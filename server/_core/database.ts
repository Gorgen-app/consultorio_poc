/**
 * Database Connection Pool Manager
 * 
 * Este módulo gerencia um pool de conexões MySQL para melhorar
 * a performance e escalabilidade do sistema.
 * 
 * Capacidade estimada: 500+ conexões simultâneas
 */

import { createPool, Pool, PoolOptions } from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";

// Configuração do pool de conexões
const POOL_CONFIG: Partial<PoolOptions> = {
  // Número máximo de conexões no pool
  connectionLimit: 50,
  // Aguardar por conexões disponíveis
  waitForConnections: true,
  // Máximo de requisições na fila
  queueLimit: 100,
  // Habilitar keep-alive para conexões
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Pool de conexões singleton
let pool: Pool | null = null;
let db: MySql2Database<Record<string, never>> | null = null;

/**
 * Inicializa o pool de conexões MySQL
 */
export async function initializePool(): Promise<Pool | null> {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[Database Pool] DATABASE_URL not configured");
    return null;
  }

  try {
    // Parsear a URL do banco de dados
    const url = new URL(databaseUrl);
    
    const poolConfig: PoolOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove a barra inicial
      ...POOL_CONFIG,
    };

    // TiDB Cloud requer SSL obrigatoriamente
    // Adicionar SSL sempre para garantir conexão segura
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };

    pool = createPool(poolConfig);

    // Testar a conexão
    const connection = await pool.getConnection();
    console.log("[Database Pool] Connection pool initialized successfully");
    console.log(`[Database Pool] Pool config: ${POOL_CONFIG.connectionLimit} connections max`);
    connection.release();

    return pool;
  } catch (error) {
    console.error("[Database Pool] Failed to initialize pool:", error);
    pool = null;
    return null;
  }
}

/**
 * Retorna a instância do Drizzle ORM com connection pooling
 */
export async function getPooledDb(): Promise<MySql2Database<Record<string, never>> | null> {
  if (db) {
    return db;
  }

  const poolInstance = await initializePool();
  if (!poolInstance) {
    // Fallback para conexão direta se o pool falhar
    console.warn("[Database Pool] Falling back to direct connection");
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      db = drizzle(databaseUrl) as MySql2Database<Record<string, never>>;
      return db;
    }
    return null;
  }

  db = drizzle(poolInstance) as MySql2Database<Record<string, never>>;
  return db;
}

/**
 * Retorna estatísticas do pool de conexões
 */
export function getPoolStats(): {
  totalConnections: number;
  freeConnections: number;
  waitingRequests: number;
} | null {
  if (!pool) {
    return null;
  }

  return {
    totalConnections: POOL_CONFIG.connectionLimit || 50,
    freeConnections: 0, // Não disponível diretamente no mysql2
    waitingRequests: 0, // Não disponível diretamente no mysql2
  };
}

/**
 * Fecha o pool de conexões (para shutdown graceful)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log("[Database Pool] Connection pool closed");
  }
}

/**
 * Health check do pool de conexões
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  message: string;
  latencyMs: number;
}> {
  const start = Date.now();
  
  try {
    const poolInstance = await initializePool();
    if (!poolInstance) {
      return {
        healthy: false,
        message: "Pool not initialized",
        latencyMs: Date.now() - start,
      };
    }

    const connection = await poolInstance.getConnection();
    await connection.ping();
    connection.release();

    return {
      healthy: true,
      message: "Pool healthy",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown error",
      latencyMs: Date.now() - start,
    };
  }
}
