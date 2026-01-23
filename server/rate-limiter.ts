/**
 * Rate Limiter para prevenir ataques de força bruta
 * Implementação em memória com sliding window
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

interface RateLimitConfig {
  windowMs: number;      // Janela de tempo em ms
  maxAttempts: number;   // Máximo de tentativas na janela
  blockDurationMs: number; // Duração do bloqueio em ms
}

// Configurações por tipo de ação
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000,      // 15 minutos
    maxAttempts: 5,                 // 5 tentativas
    blockDurationMs: 30 * 60 * 1000 // Bloqueio de 30 minutos
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,      // 1 hora
    maxAttempts: 3,                 // 3 tentativas
    blockDurationMs: 60 * 60 * 1000 // Bloqueio de 1 hora
  },
  register: {
    windowMs: 60 * 60 * 1000,      // 1 hora
    maxAttempts: 5,                 // 5 tentativas
    blockDurationMs: 60 * 60 * 1000 // Bloqueio de 1 hora
  },
  twoFactor: {
    windowMs: 5 * 60 * 1000,       // 5 minutos
    maxAttempts: 5,                 // 5 tentativas
    blockDurationMs: 15 * 60 * 1000 // Bloqueio de 15 minutos
  }
};

// Armazenamento em memória (em produção, usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpeza periódica de entradas expiradas
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    // Remove entradas que expiraram e não estão bloqueadas
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitStore.delete(key);
    } else if (now - entry.firstAttempt > 2 * 60 * 60 * 1000) {
      // Remove entradas com mais de 2 horas
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpa a cada 5 minutos

/**
 * Gera uma chave única para o rate limiting
 */
function generateKey(action: string, identifier: string): string {
  return `${action}:${identifier}`;
}

/**
 * Verifica se uma ação está bloqueada
 */
export function isRateLimited(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  identifier: string // IP ou username
): { blocked: boolean; remainingAttempts: number; blockedUntil: Date | null; message: string } {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) {
    return { blocked: false, remainingAttempts: 999, blockedUntil: null, message: "" };
  }

  const key = generateKey(action, identifier);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  // Se não há entrada, não está bloqueado
  if (!entry) {
    return { 
      blocked: false, 
      remainingAttempts: config.maxAttempts, 
      blockedUntil: null,
      message: ""
    };
  }

  // Verifica se está bloqueado
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const remainingMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
    return {
      blocked: true,
      remainingAttempts: 0,
      blockedUntil: new Date(entry.blockedUntil),
      message: `Muitas tentativas. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}.`
    };
  }

  // Verifica se a janela expirou
  if (now - entry.firstAttempt > config.windowMs) {
    // Janela expirou, reseta
    rateLimitStore.delete(key);
    return { 
      blocked: false, 
      remainingAttempts: config.maxAttempts, 
      blockedUntil: null,
      message: ""
    };
  }

  // Calcula tentativas restantes
  const remainingAttempts = Math.max(0, config.maxAttempts - entry.count);
  
  return {
    blocked: false,
    remainingAttempts,
    blockedUntil: null,
    message: remainingAttempts <= 2 ? `${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.` : ""
  };
}

/**
 * Registra uma tentativa (falha)
 */
export function recordFailedAttempt(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  identifier: string
): { blocked: boolean; remainingAttempts: number; blockedUntil: Date | null; message: string } {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) {
    return { blocked: false, remainingAttempts: 999, blockedUntil: null, message: "" };
  }

  const key = generateKey(action, identifier);
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttempt > config.windowMs) {
    // Nova entrada ou janela expirada
    entry = {
      count: 1,
      firstAttempt: now,
      blockedUntil: null
    };
  } else {
    // Incrementa contador
    entry.count++;
  }

  // Verifica se deve bloquear
  if (entry.count >= config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs;
    rateLimitStore.set(key, entry);
    
    const remainingMinutes = Math.ceil(config.blockDurationMs / 60000);
    return {
      blocked: true,
      remainingAttempts: 0,
      blockedUntil: new Date(entry.blockedUntil),
      message: `Muitas tentativas. Conta bloqueada por ${remainingMinutes} minutos.`
    };
  }

  rateLimitStore.set(key, entry);
  
  const remainingAttempts = config.maxAttempts - entry.count;
  return {
    blocked: false,
    remainingAttempts,
    blockedUntil: null,
    message: `${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`
  };
}

/**
 * Limpa o rate limiting após sucesso (ex: login bem-sucedido)
 */
export function clearRateLimit(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  identifier: string
): void {
  const key = generateKey(action, identifier);
  rateLimitStore.delete(key);
}

/**
 * Obtém estatísticas do rate limiter (para admin)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  blockedEntries: number;
  entriesByAction: Record<string, number>;
} {
  const now = Date.now();
  let blockedCount = 0;
  const byAction: Record<string, number> = {};

  const statsEntries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of statsEntries) {
    const action = key.split(':')[0];
    byAction[action] = (byAction[action] || 0) + 1;
    
    if (entry.blockedUntil && entry.blockedUntil > now) {
      blockedCount++;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    blockedEntries: blockedCount,
    entriesByAction: byAction
  };
}
