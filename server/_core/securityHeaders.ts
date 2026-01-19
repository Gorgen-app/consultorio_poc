/**
 * GORGEN - Headers de Segurança
 * 
 * Este módulo implementa os headers de segurança HTTP recomendados,
 * incluindo Content Security Policy (CSP), X-Frame-Options, etc.
 * 
 * Referências:
 * - OWASP Secure Headers: https://owasp.org/www-project-secure-headers/
 * - MDN CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * 
 * @version 1.0.0
 * @date 2026-01-19
 */

import { Request, Response, NextFunction } from "express";

// ==========================================
// CONFIGURAÇÃO DO CSP
// ==========================================

/**
 * Content Security Policy (CSP) configurado para o Gorgen.
 * 
 * Diretivas:
 * - default-src: Fonte padrão para todos os recursos
 * - script-src: Fontes permitidas para scripts
 * - style-src: Fontes permitidas para estilos
 * - font-src: Fontes permitidas para fontes
 * - img-src: Fontes permitidas para imagens
 * - connect-src: Fontes permitidas para conexões (fetch, XHR, WebSocket)
 * - frame-src: Fontes permitidas para iframes
 * - object-src: Fontes permitidas para plugins
 * - base-uri: URLs permitidas para <base>
 * - form-action: URLs permitidas para ação de formulários
 * - frame-ancestors: Quem pode incorporar a página em iframe
 * - upgrade-insecure-requests: Atualizar HTTP para HTTPS automaticamente
 */

const CSP_DIRECTIVES = {
  // Fonte padrão: apenas o próprio domínio
  "default-src": ["'self'"],
  
  // Scripts: próprio domínio + inline (necessário para React) + eval (necessário para Vite HMR em dev)
  // + Forge API para funcionalidades externas
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Necessário para Vite HMR em desenvolvimento
    "https://forge.butterfly-effect.dev",
    "https://maps.googleapis.com", // Google Maps
    "https://maps.gstatic.com",
  ],
  
  // Estilos: próprio domínio + inline (necessário para Tailwind) + Google Fonts
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Necessário para Tailwind CSS e estilos dinâmicos
    "https://fonts.googleapis.com",
  ],
  
  // Fontes: próprio domínio + Google Fonts + data URIs
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  
  // Imagens: próprio domínio + data URIs + blobs + S3 + Google Maps
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.s3.amazonaws.com",
    "https://*.s3.*.amazonaws.com",
    "https://s3.amazonaws.com",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://*.googleusercontent.com",
  ],
  
  // Conexões: próprio domínio + ViaCEP + Forge API + Google Maps + S3
  "connect-src": [
    "'self'",
    "https://viacep.com.br",
    "https://forge.butterfly-effect.dev",
    "https://maps.googleapis.com",
    "https://*.s3.amazonaws.com",
    "https://*.s3.*.amazonaws.com",
    "https://s3.amazonaws.com",
    // WebSocket para Vite HMR em desenvolvimento
    "ws://localhost:*",
    "wss://localhost:*",
    "ws://127.0.0.1:*",
    "wss://127.0.0.1:*",
  ],
  
  // Iframes: nenhum permitido (segurança máxima)
  "frame-src": ["'none'"],
  
  // Plugins (Flash, Java, etc.): nenhum permitido
  "object-src": ["'none'"],
  
  // Base URI: apenas o próprio domínio
  "base-uri": ["'self'"],
  
  // Ação de formulários: apenas o próprio domínio
  "form-action": ["'self'"],
  
  // Quem pode incorporar esta página em iframe: ninguém
  "frame-ancestors": ["'none'"],
  
  // Workers: próprio domínio + blobs (para PDF.js, etc.)
  "worker-src": ["'self'", "blob:"],
  
  // Manifests: próprio domínio
  "manifest-src": ["'self'"],
  
  // Media: próprio domínio + S3
  "media-src": [
    "'self'",
    "https://*.s3.amazonaws.com",
    "https://*.s3.*.amazonaws.com",
  ],
};

/**
 * Gera a string do CSP a partir das diretivas configuradas.
 */
function buildCSPString(): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
  
  // Adicionar upgrade-insecure-requests em produção
  const upgradeInsecure = process.env.NODE_ENV === "production" 
    ? "; upgrade-insecure-requests" 
    : "";
  
  return directives + upgradeInsecure;
}

// ==========================================
// MIDDLEWARE DE HEADERS DE SEGURANÇA
// ==========================================

/**
 * Middleware que adiciona headers de segurança HTTP às respostas.
 * 
 * Headers implementados:
 * - Content-Security-Policy: Controla recursos que podem ser carregados
 * - X-Frame-Options: Previne clickjacking
 * - X-Content-Type-Options: Previne MIME sniffing
 * - X-XSS-Protection: Proteção contra XSS (legacy)
 * - Referrer-Policy: Controla informações de referrer
 * - Strict-Transport-Security: Força HTTPS (apenas em produção)
 * - Permissions-Policy: Controla APIs do navegador
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Content-Security-Policy
  const csp = buildCSPString();
  res.setHeader("Content-Security-Policy", csp);
  
  // X-Frame-Options: Previne que a página seja carregada em iframe
  // DENY = não permite em nenhum iframe
  res.setHeader("X-Frame-Options", "DENY");
  
  // X-Content-Type-Options: Previne MIME type sniffing
  // nosniff = navegador deve respeitar o Content-Type declarado
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // X-XSS-Protection: Proteção XSS do navegador (legacy, mas ainda útil)
  // 1; mode=block = bloqueia a página se XSS for detectado
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer-Policy: Controla quais informações de referrer são enviadas
  // strict-origin-when-cross-origin = envia origin completa para same-origin,
  // apenas origin para cross-origin HTTPS, nada para HTTP
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Strict-Transport-Security (HSTS): Força HTTPS
  // Apenas em produção para não quebrar desenvolvimento local
  if (process.env.NODE_ENV === "production") {
    // max-age=31536000 = 1 ano
    // includeSubDomains = aplica a subdomínios
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  // Permissions-Policy: Controla quais APIs do navegador podem ser usadas
  // Desabilita APIs potencialmente perigosas ou desnecessárias
  res.setHeader("Permissions-Policy", [
    "accelerometer=()",
    "camera=()",
    "geolocation=(self)", // Permitir geolocalização para Google Maps
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "));
  
  // Remover header X-Powered-By do Express (segurança por obscuridade)
  res.removeHeader("X-Powered-By");
  
  next();
}

// ==========================================
// EXPORTAÇÕES
// ==========================================

export default securityHeaders;

/**
 * Retorna o CSP como string para uso em outros contextos (ex: meta tag).
 */
export function getCSPString(): string {
  return buildCSPString();
}

/**
 * Retorna as diretivas do CSP como objeto para inspeção/debug.
 */
export function getCSPDirectives(): typeof CSP_DIRECTIVES {
  return { ...CSP_DIRECTIVES };
}
