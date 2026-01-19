/**
 * Testes do Rate Limiting - Gorgen
 * 
 * Verifica que o módulo de rate limiting está configurado corretamente
 * e que as funções auxiliares funcionam como esperado.
 */

import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "./_core/rateLimit";

describe("Rate Limiting Configuration", () => {
  describe("RATE_LIMITS constants", () => {
    it("should have global IP limit of 100 requests per minute", () => {
      expect(RATE_LIMITS.GLOBAL_IP.max).toBe(100);
      expect(RATE_LIMITS.GLOBAL_IP.windowMs).toBe(60 * 1000);
    });

    it("should have user limit of 300 requests per minute", () => {
      expect(RATE_LIMITS.USER.max).toBe(300);
      expect(RATE_LIMITS.USER.windowMs).toBe(60 * 1000);
    });

    it("should have tenant limit of 1000 requests per minute", () => {
      expect(RATE_LIMITS.TENANT.max).toBe(1000);
      expect(RATE_LIMITS.TENANT.windowMs).toBe(60 * 1000);
    });

    it("should have sensitive endpoint limit of 10 requests per minute", () => {
      expect(RATE_LIMITS.SENSITIVE.max).toBe(10);
      expect(RATE_LIMITS.SENSITIVE.windowMs).toBe(60 * 1000);
    });

    it("should have write operation limit of 50 requests per minute", () => {
      expect(RATE_LIMITS.WRITE.max).toBe(50);
      expect(RATE_LIMITS.WRITE.windowMs).toBe(60 * 1000);
    });
  });

  describe("Error messages", () => {
    it("should have Portuguese error messages", () => {
      expect(RATE_LIMITS.GLOBAL_IP.message.error).toContain("Muitas requisições");
      expect(RATE_LIMITS.USER.message.error).toContain("Limite de requisições");
      expect(RATE_LIMITS.TENANT.message.error).toContain("clínica");
      expect(RATE_LIMITS.SENSITIVE.message.error).toContain("tentativas");
      expect(RATE_LIMITS.WRITE.message.error).toContain("operações");
    });

    it("should include retryAfter in all messages", () => {
      expect(RATE_LIMITS.GLOBAL_IP.message.retryAfter).toBe(60);
      expect(RATE_LIMITS.USER.message.retryAfter).toBe(60);
      expect(RATE_LIMITS.TENANT.message.retryAfter).toBe(60);
      expect(RATE_LIMITS.SENSITIVE.message.retryAfter).toBe(60);
      expect(RATE_LIMITS.WRITE.message.retryAfter).toBe(60);
    });
  });
});

describe("Rate Limiting Exports", () => {
  it("should export all required limiters", async () => {
    const rateLimitModule = await import("./_core/rateLimit");
    
    expect(rateLimitModule.globalRateLimiter).toBeDefined();
    expect(rateLimitModule.userRateLimiter).toBeDefined();
    expect(rateLimitModule.tenantRateLimiter).toBeDefined();
    expect(rateLimitModule.sensitiveRateLimiter).toBeDefined();
    expect(rateLimitModule.writeRateLimiter).toBeDefined();
  });

  it("should export combinedRateLimiter function", async () => {
    const rateLimitModule = await import("./_core/rateLimit");
    
    expect(typeof rateLimitModule.combinedRateLimiter).toBe("function");
  });

  it("should export addRateLimitHeaders function", async () => {
    const rateLimitModule = await import("./_core/rateLimit");
    
    expect(typeof rateLimitModule.addRateLimitHeaders).toBe("function");
  });

  it("should export getRateLimitStats function", async () => {
    const rateLimitModule = await import("./_core/rateLimit");
    
    expect(typeof rateLimitModule.getRateLimitStats).toBe("function");
  });

  it("should export isRateLimited function", async () => {
    const rateLimitModule = await import("./_core/rateLimit");
    
    expect(typeof rateLimitModule.isRateLimited).toBe("function");
  });
});
