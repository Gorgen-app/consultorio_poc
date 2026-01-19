/**
 * Rate Limiting Middleware - Gorgen
 * 
 * Este módulo implementa limitação de taxa de requisições para proteger
 * o sistema contra abuso e garantir disponibilidade para todos os usuários.
 * 
 * Limites configurados:
 * - Por IP: 100 req/min (proteção contra bots)
 * - Por usuário: 300 req/min (uso normal)
 * - Por tenant: 1000 req/min (limite por clínica)
 * - Endpoints sensíveis: 10 req/min (login, etc.)
 */

import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

/**
 * Normaliza endereços IPv6 para IPv4 quando possível
 * Isso garante consistência no rate limiting
 */
function normalizeIP(ip: string | undefined): string {
  if (!ip) return "unknown";
  
  // Remove prefixo IPv6 de endereços IPv4-mapped (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }
  
  // Normaliza localhost IPv6 para IPv4
  if (ip === "::1") {
    return "127.0.0.1";
  }
  
  return ip;
}

// Configuração de limites
export const RATE_LIMITS = {
  // Limite global por IP (proteção contra bots)
  GLOBAL_IP: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto
    message: {
      error: "Muitas requisições. Aguarde um momento antes de tentar novamente.",
      retryAfter: 60,
    },
  },
  
  // Limite por usuário autenticado
  USER: {
    windowMs: 60 * 1000, // 1 minuto
    max: 300, // 300 requisições por minuto
    message: {
      error: "Limite de requisições excedido. Aguarde um momento.",
      retryAfter: 60,
    },
  },
  
  // Limite por tenant (clínica)
  TENANT: {
    windowMs: 60 * 1000, // 1 minuto
    max: 1000, // 1000 requisições por minuto por clínica
    message: {
      error: "Limite de requisições da clínica excedido. Contate o administrador.",
      retryAfter: 60,
    },
  },
  
  // Limite para endpoints sensíveis (login, reset de senha)
  SENSITIVE: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 tentativas por minuto
    message: {
      error: "Muitas tentativas. Aguarde antes de tentar novamente.",
      retryAfter: 60,
    },
  },
  
  // Limite para operações de escrita (create, update, delete)
  WRITE: {
    windowMs: 60 * 1000, // 1 minuto
    max: 50, // 50 operações de escrita por minuto
    message: {
      error: "Limite de operações excedido. Aguarde um momento.",
      retryAfter: 60,
    },
  },
};

/**
 * Extrai o identificador do usuário da requisição
 */
function getUserId(req: Request): string | undefined {
  // Tenta extrair do contexto tRPC ou sessão
  const user = (req as any).user || (req as any).session?.user;
  return user?.id?.toString();
}

/**
 * Extrai o identificador do tenant da requisição
 */
function getTenantId(req: Request): string | undefined {
  const tenant = (req as any).tenant;
  return tenant?.tenantId?.toString();
}

/**
 * Rate limiter global por IP
 * Aplicado a todas as requisições
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL_IP.windowMs,
  max: RATE_LIMITS.GLOBAL_IP.max,
  standardHeaders: true, // Retorna headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  message: RATE_LIMITS.GLOBAL_IP.message,
  keyGenerator: (req: Request) => {
    // Usa IP real considerando proxies, normalizado para IPv4 quando possível
    return normalizeIP(req.ip || req.socket.remoteAddress);
  },
  validate: { xForwardedForHeader: false },
  skip: (req: Request) => {
    // Pula health checks e assets estáticos
    return req.path === "/health" || req.path.startsWith("/assets/");
  },
});

/**
 * Rate limiter por usuário autenticado
 * Aplicado apenas a usuários logados
 */
export const userRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.USER.windowMs,
  max: RATE_LIMITS.USER.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMITS.USER.message,
keyGenerator: (req: Request) => {
    const userId = getUserId(req);
    return userId || normalizeIP(req.ip || req.socket.remoteAddress);
  },
  validate: { xForwardedForHeader: false },
  skip: (req: Request) => {
    // Pula se não há usuário autenticado
    return !getUserId(req);
  },
});

/**
 * Rate limiter por tenant
 * Limita requisições por clínica
 */
export const tenantRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.TENANT.windowMs,
  max: RATE_LIMITS.TENANT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMITS.TENANT.message,
keyGenerator: (req: Request) => {
    const tenantId = getTenantId(req);
    return tenantId ? `tenant:${tenantId}` : normalizeIP(req.ip || req.socket.remoteAddress);
  },
  validate: { xForwardedForHeader: false },
  skip: (req: Request) => {
    // Pula se não há tenant identificado
    return !getTenantId(req);
  },
});

/**
 * Rate limiter para endpoints sensíveis
 * Aplicado a login, reset de senha, etc.
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.SENSITIVE.windowMs,
  max: RATE_LIMITS.SENSITIVE.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMITS.SENSITIVE.message,
  keyGenerator: (req: Request) => {
    // Combina IP + email/username para evitar ataques distribuídos
    const body = req.body || {};
    const identifier = body.email || body.username || "";
    const ip = normalizeIP(req.ip || req.socket.remoteAddress);
    return `${ip}:${identifier}`;
  },
  validate: { xForwardedForHeader: false },
});

/**
 * Rate limiter para operações de escrita
 * Aplicado a POST, PUT, DELETE, PATCH
 */
export const writeRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.WRITE.windowMs,
  max: RATE_LIMITS.WRITE.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMITS.WRITE.message,
  keyGenerator: (req: Request) => {
    const userId = getUserId(req);
    const ip = normalizeIP(req.ip || req.socket.remoteAddress);
    return userId ? `write:${userId}` : `write:${ip}`;
  },
  validate: { xForwardedForHeader: false },
  skip: (req: Request) => {
    // Aplica apenas a métodos de escrita
    return !["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
  },
});

/**
 * Middleware combinado de rate limiting
 * Aplica múltiplos limiters em sequência
 */
export function combinedRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Aplica rate limiter global primeiro
  globalRateLimiter(req, res, (err) => {
    if (err) return next(err);
    
    // Depois aplica por usuário se autenticado
    userRateLimiter(req, res, (err) => {
      if (err) return next(err);
      
      // Depois aplica por tenant
      tenantRateLimiter(req, res, (err) => {
        if (err) return next(err);
        
        // Por fim, aplica limite de escrita se aplicável
        writeRateLimiter(req, res, next);
      });
    });
  });
}

/**
 * Headers de rate limit para resposta
 * Adiciona informações úteis para o cliente
 */
export function addRateLimitHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Adiciona header indicando que rate limiting está ativo
  res.setHeader("X-RateLimit-Policy", "100/min per IP, 300/min per user");
  next();
}

/**
 * Verifica se uma requisição está sendo limitada
 */
export function isRateLimited(req: Request): boolean {
  const remaining = parseInt(req.get("RateLimit-Remaining") || "1", 10);
  return remaining <= 0;
}

/**
 * Retorna estatísticas de rate limiting para monitoramento
 */
export function getRateLimitStats(): {
  limits: typeof RATE_LIMITS;
  description: string;
} {
  return {
    limits: RATE_LIMITS,
    description: "Rate limiting configurado para proteção do sistema Gorgen",
  };
}
