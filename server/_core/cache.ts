/**
 * Redis Cache Manager
 * 
 * Este módulo gerencia o cache distribuído usando Redis para melhorar
 * a performance e reduzir carga no banco de dados.
 * 
 * Funcionalidades:
 * - Cache de sessões de usuário
 * - Cache de dados de tenant
 * - Cache de queries frequentes
 * - TTL configurável por tipo de dado
 */

import Redis from "ioredis";

// Configuração de TTL por tipo de cache (em segundos)
export const CACHE_TTL = {
  // Sessões de usuário - 30 minutos
  SESSION: 30 * 60,
  // Dados de tenant - 5 minutos
  TENANT: 5 * 60,
  // Lista de pacientes - 1 minuto
  PACIENTES_LIST: 60,
  // Dados de paciente individual - 2 minutos
  PACIENTE: 2 * 60,
  // Dashboard stats - 30 segundos
  DASHBOARD: 30,
  // Configurações de usuário - 10 minutos
  USER_SETTINGS: 10 * 60,
  // Tenant ativo do usuário - 5 minutos
  ACTIVE_TENANT: 5 * 60,
};

// Prefixos de chave para organização
export const CACHE_PREFIX = {
  SESSION: "session:",
  TENANT: "tenant:",
  PACIENTE: "paciente:",
  PACIENTES_LIST: "pacientes_list:",
  DASHBOARD: "dashboard:",
  USER_SETTINGS: "user_settings:",
  ACTIVE_TENANT: "active_tenant:",
};

// Cliente Redis singleton
let redis: Redis | null = null;
let isConnected = false;

/**
 * Inicializa a conexão com o Redis
 */
export async function initializeRedis(): Promise<Redis | null> {
  if (redis && isConnected) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;
  
  // Se não há REDIS_URL configurada, usar cache em memória como fallback
  if (!redisUrl) {
    console.warn("[Redis Cache] REDIS_URL not configured, using in-memory cache fallback");
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("[Redis Cache] Max retries reached, giving up");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on("connect", () => {
      isConnected = true;
      console.log("[Redis Cache] Connected successfully");
    });

    redis.on("error", (err) => {
      console.error("[Redis Cache] Connection error:", err.message);
      isConnected = false;
    });

    redis.on("close", () => {
      isConnected = false;
      console.log("[Redis Cache] Connection closed");
    });

    await redis.connect();
    return redis;
  } catch (error) {
    console.error("[Redis Cache] Failed to initialize:", error);
    redis = null;
    isConnected = false;
    return null;
  }
}

/**
 * Cache em memória como fallback quando Redis não está disponível
 */
const memoryCache = new Map<string, { value: string; expiry: number }>();
const MAX_MEMORY_CACHE_SIZE = 500; // Limite de entradas no cache em memória

/**
 * Limpa entradas expiradas do cache em memória
 */
function cleanExpiredMemoryCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  memoryCache.forEach((entry, key) => {
    if (entry.expiry < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryCache.delete(key));
  
  // Se ainda estiver muito grande, remover as mais antigas
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    const toRemove = entries.slice(0, entries.length - MAX_MEMORY_CACHE_SIZE);
    toRemove.forEach(([key]) => memoryCache.delete(key));
  }
}

// Limpar cache em memória a cada 30 segundos (aumentado de 60s para 30s)
setInterval(cleanExpiredMemoryCache, 30000);

/**
 * Obtém um valor do cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    // Tentar Redis primeiro
    if (redis && isConnected) {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    }

    // Fallback para cache em memória
    const entry = memoryCache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return JSON.parse(entry.value) as T;
    }
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.error("[Cache] Error getting key:", key, error);
    return null;
  }
}

/**
 * Define um valor no cache com TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);

    // Tentar Redis primeiro
    if (redis && isConnected) {
      await redis.setex(key, ttlSeconds, serialized);
      return true;
    }

    // Fallback para cache em memória
    memoryCache.set(key, {
      value: serialized,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  } catch (error) {
    console.error("[Cache] Error setting key:", key, error);
    return false;
  }
}

/**
 * Remove um valor do cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    if (redis && isConnected) {
      await redis.del(key);
    }
    memoryCache.delete(key);
    return true;
  } catch (error) {
    console.error("[Cache] Error deleting key:", key, error);
    return false;
  }
}

/**
 * Remove múltiplos valores por padrão de chave
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    let count = 0;

    if (redis && isConnected) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        count = await redis.del(...keys);
      }
    }

    // Também limpar do cache em memória
    const regex = new RegExp(pattern.replace("*", ".*"));
    const keysToDelete: string[] = [];
    memoryCache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => {
      memoryCache.delete(key);
      count++;
    });

    return count;
  } catch (error) {
    console.error("[Cache] Error deleting pattern:", pattern, error);
    return 0;
  }
}

/**
 * Invalida cache de tenant quando dados são modificados
 */
export async function invalidateTenantCache(tenantId: number): Promise<void> {
  await cacheDeletePattern(`${CACHE_PREFIX.PACIENTES_LIST}${tenantId}:*`);
  await cacheDeletePattern(`${CACHE_PREFIX.DASHBOARD}${tenantId}:*`);
  await cacheDelete(`${CACHE_PREFIX.TENANT}${tenantId}`);
}

/**
 * Invalida cache de paciente
 */
export async function invalidatePacienteCache(tenantId: number, pacienteId?: number): Promise<void> {
  if (pacienteId) {
    await cacheDelete(`${CACHE_PREFIX.PACIENTE}${tenantId}:${pacienteId}`);
  }
  await cacheDeletePattern(`${CACHE_PREFIX.PACIENTES_LIST}${tenantId}:*`);
  await cacheDeletePattern(`${CACHE_PREFIX.DASHBOARD}${tenantId}:*`);
}

/**
 * Health check do cache
 */
export async function cacheHealthCheck(): Promise<{
  healthy: boolean;
  type: "redis" | "memory";
  message: string;
  latencyMs: number;
}> {
  const start = Date.now();

  if (redis && isConnected) {
    try {
      await redis.ping();
      return {
        healthy: true,
        type: "redis",
        message: "Redis connected",
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        type: "redis",
        message: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  return {
    healthy: true,
    type: "memory",
    message: "Using in-memory cache fallback",
    latencyMs: Date.now() - start,
  };
}

/**
 * Fecha a conexão com o Redis (para shutdown graceful)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
    console.log("[Redis Cache] Connection closed");
  }
}

/**
 * Helper para cache-aside pattern
 * Busca no cache, se não encontrar executa a função e armazena o resultado
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Tentar buscar do cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Executar função e armazenar no cache
  const result = await fetchFn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}
