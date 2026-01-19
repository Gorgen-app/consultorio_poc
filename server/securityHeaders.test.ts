/**
 * GORGEN - Testes dos Headers de Segurança
 * 
 * Testes para validar a implementação do CSP e outros headers de segurança.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { securityHeaders, getCSPString, getCSPDirectives } from "./_core/securityHeaders";

describe("Security Headers Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderCalls: Map<string, string>;

  beforeEach(() => {
    setHeaderCalls = new Map();
    mockReq = {};
    mockRes = {
      setHeader: vi.fn((name: string, value: string) => {
        setHeaderCalls.set(name, value);
        return mockRes as Response;
      }),
      removeHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe("securityHeaders middleware", () => {
    it("deve definir Content-Security-Policy", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.any(String)
      );
      expect(setHeaderCalls.get("Content-Security-Policy")).toBeDefined();
    });

    it("deve definir X-Frame-Options como DENY", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    });

    it("deve definir X-Content-Type-Options como nosniff", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    });

    it("deve definir X-XSS-Protection", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
    });

    it("deve definir Referrer-Policy", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Referrer-Policy",
        "strict-origin-when-cross-origin"
      );
    });

    it("deve definir Permissions-Policy", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Permissions-Policy",
        expect.stringContaining("camera=()")
      );
    });

    it("deve remover X-Powered-By", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.removeHeader).toHaveBeenCalledWith("X-Powered-By");
    });

    it("deve chamar next()", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("CSP Directives", () => {
    it("deve incluir default-src 'self'", () => {
      const csp = getCSPString();
      expect(csp).toContain("default-src 'self'");
    });

    it("deve incluir script-src com domínios necessários", () => {
      const csp = getCSPString();
      expect(csp).toContain("script-src");
      expect(csp).toContain("'self'");
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).toContain("https://maps.googleapis.com");
    });

    it("deve incluir style-src com Google Fonts", () => {
      const csp = getCSPString();
      expect(csp).toContain("style-src");
      expect(csp).toContain("https://fonts.googleapis.com");
    });

    it("deve incluir font-src com Google Fonts", () => {
      const csp = getCSPString();
      expect(csp).toContain("font-src");
      expect(csp).toContain("https://fonts.gstatic.com");
    });

    it("deve incluir img-src com S3 e Google Maps", () => {
      const csp = getCSPString();
      expect(csp).toContain("img-src");
      expect(csp).toContain("https://*.s3.amazonaws.com");
      expect(csp).toContain("https://maps.googleapis.com");
    });

    it("deve incluir connect-src com ViaCEP", () => {
      const csp = getCSPString();
      expect(csp).toContain("connect-src");
      expect(csp).toContain("https://viacep.com.br");
    });

    it("deve bloquear frame-src", () => {
      const csp = getCSPString();
      expect(csp).toContain("frame-src 'none'");
    });

    it("deve bloquear object-src", () => {
      const csp = getCSPString();
      expect(csp).toContain("object-src 'none'");
    });

    it("deve bloquear frame-ancestors", () => {
      const csp = getCSPString();
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe("getCSPDirectives", () => {
    it("deve retornar objeto com todas as diretivas", () => {
      const directives = getCSPDirectives();
      
      expect(directives).toHaveProperty("default-src");
      expect(directives).toHaveProperty("script-src");
      expect(directives).toHaveProperty("style-src");
      expect(directives).toHaveProperty("font-src");
      expect(directives).toHaveProperty("img-src");
      expect(directives).toHaveProperty("connect-src");
      expect(directives).toHaveProperty("frame-src");
      expect(directives).toHaveProperty("object-src");
    });

    it("deve retornar cópia do objeto (não referência)", () => {
      const directives1 = getCSPDirectives();
      const directives2 = getCSPDirectives();
      
      expect(directives1).not.toBe(directives2);
    });
  });
});

describe("CSP Integration", () => {
  it("CSP deve permitir Google Fonts", () => {
    const csp = getCSPString();
    
    // Google Fonts precisa de:
    // - style-src: fonts.googleapis.com (para CSS)
    // - font-src: fonts.gstatic.com (para arquivos de fonte)
    expect(csp).toContain("https://fonts.googleapis.com");
    expect(csp).toContain("https://fonts.gstatic.com");
  });

  it("CSP deve permitir Google Maps", () => {
    const csp = getCSPString();
    
    // Google Maps precisa de:
    // - script-src: maps.googleapis.com
    // - img-src: maps.googleapis.com, maps.gstatic.com
    expect(csp).toMatch(/script-src[^;]*https:\/\/maps\.googleapis\.com/);
    expect(csp).toMatch(/img-src[^;]*https:\/\/maps\.googleapis\.com/);
  });

  it("CSP deve permitir S3 para uploads", () => {
    const csp = getCSPString();
    
    // S3 precisa de:
    // - img-src: *.s3.amazonaws.com
    // - connect-src: *.s3.amazonaws.com
    expect(csp).toMatch(/img-src[^;]*https:\/\/\*\.s3\.amazonaws\.com/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.s3\.amazonaws\.com/);
  });

  it("CSP deve permitir ViaCEP para busca de CEP", () => {
    const csp = getCSPString();
    
    // ViaCEP precisa de:
    // - connect-src: viacep.com.br
    expect(csp).toMatch(/connect-src[^;]*https:\/\/viacep\.com\.br/);
  });

  it("CSP deve permitir WebSocket para Vite HMR em desenvolvimento", () => {
    const csp = getCSPString();
    
    // Vite HMR precisa de:
    // - connect-src: ws://localhost:*, wss://localhost:*
    expect(csp).toMatch(/connect-src[^;]*ws:\/\/localhost:\*/);
  });
});
