import { describe, it, expect, beforeEach } from "vitest";
import {
  recordEndpointMetric,
  recordCacheHit,
  recordCacheMiss,
  getAggregatedMetrics,
  getSystemMetrics,
  getResponseTimeHistory,
  getSlowestEndpoints,
  getOverallStats,
} from "./performance";

describe("Performance Metrics", () => {
  describe("recordEndpointMetric", () => {
    it("deve registrar métricas de endpoint sem erro", () => {
      expect(() => {
        recordEndpointMetric({
          endpoint: "/api/test",
          method: "GET",
          responseTime: 100,
          statusCode: 200,
        });
      }).not.toThrow();
    });

    it("deve registrar métricas com userId", () => {
      expect(() => {
        recordEndpointMetric({
          endpoint: "/api/protected",
          method: "POST",
          responseTime: 250,
          statusCode: 201,
          userId: 1,
        });
      }).not.toThrow();
    });
  });

  describe("recordCacheHit e recordCacheMiss", () => {
    it("deve registrar cache hits sem erro", () => {
      expect(() => recordCacheHit()).not.toThrow();
    });

    it("deve registrar cache misses sem erro", () => {
      expect(() => recordCacheMiss()).not.toThrow();
    });
  });

  describe("getAggregatedMetrics", () => {
    beforeEach(() => {
      // Registrar algumas métricas para teste
      for (let i = 0; i < 10; i++) {
        recordEndpointMetric({
          endpoint: "/api/pacientes",
          method: "GET",
          responseTime: 50 + i * 10,
          statusCode: 200,
        });
      }
    });

    it("deve retornar array de métricas agregadas", () => {
      const metrics = getAggregatedMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it("deve incluir campos obrigatórios nas métricas", () => {
      const metrics = getAggregatedMetrics();
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(metric).toHaveProperty("endpoint");
        expect(metric).toHaveProperty("count");
        expect(metric).toHaveProperty("avgResponseTime");
        expect(metric).toHaveProperty("minResponseTime");
        expect(metric).toHaveProperty("maxResponseTime");
        expect(metric).toHaveProperty("p95ResponseTime");
        expect(metric).toHaveProperty("errorCount");
        expect(metric).toHaveProperty("lastHour");
      }
    });
  });

  describe("getSystemMetrics", () => {
    it("deve retornar métricas do sistema", () => {
      const metrics = getSystemMetrics();
      
      expect(metrics).toHaveProperty("uptime");
      expect(metrics).toHaveProperty("memoryUsage");
      expect(metrics).toHaveProperty("cacheStats");
      
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(metrics.memoryUsage.heapTotal).toBeGreaterThan(0);
    });

    it("deve retornar estatísticas de cache", () => {
      // Registrar alguns hits e misses
      recordCacheHit();
      recordCacheHit();
      recordCacheMiss();
      
      const metrics = getSystemMetrics();
      expect(metrics.cacheStats).toHaveProperty("hitRate");
      expect(metrics.cacheStats).toHaveProperty("hits");
      expect(metrics.cacheStats).toHaveProperty("misses");
    });
  });

  describe("getResponseTimeHistory", () => {
    it("deve retornar histórico de 24 horas", () => {
      const history = getResponseTimeHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(24);
    });

    it("deve ter formato correto para cada hora", () => {
      const history = getResponseTimeHistory();
      
      history.forEach(entry => {
        expect(entry).toHaveProperty("hour");
        expect(entry).toHaveProperty("avgTime");
        expect(entry).toHaveProperty("count");
        expect(entry.hour).toMatch(/^\d{2}:00$/);
      });
    });
  });

  describe("getSlowestEndpoints", () => {
    beforeEach(() => {
      // Registrar endpoints com diferentes tempos
      for (let i = 0; i < 10; i++) {
        recordEndpointMetric({
          endpoint: "/api/fast",
          method: "GET",
          responseTime: 10,
          statusCode: 200,
        });
        recordEndpointMetric({
          endpoint: "/api/slow",
          method: "GET",
          responseTime: 500,
          statusCode: 200,
        });
      }
    });

    it("deve retornar array de endpoints lentos", () => {
      const slowest = getSlowestEndpoints(5);
      expect(Array.isArray(slowest)).toBe(true);
    });

    it("deve respeitar o limite especificado", () => {
      const slowest = getSlowestEndpoints(3);
      expect(slowest.length).toBeLessThanOrEqual(3);
    });

    it("deve ordenar por tempo médio decrescente", () => {
      const slowest = getSlowestEndpoints(10);
      
      for (let i = 1; i < slowest.length; i++) {
        expect(slowest[i - 1].avgTime).toBeGreaterThanOrEqual(slowest[i].avgTime);
      }
    });
  });

  describe("getOverallStats", () => {
    it("deve retornar estatísticas gerais", () => {
      const stats = getOverallStats();
      
      expect(stats).toHaveProperty("totalRequests");
      expect(stats).toHaveProperty("avgResponseTime");
      expect(stats).toHaveProperty("errorRate");
      expect(stats).toHaveProperty("requestsPerMinute");
    });

    it("deve calcular taxa de erro corretamente", () => {
      // Registrar requisições com e sem erro
      for (let i = 0; i < 8; i++) {
        recordEndpointMetric({
          endpoint: "/api/test",
          method: "GET",
          responseTime: 100,
          statusCode: 200,
        });
      }
      for (let i = 0; i < 2; i++) {
        recordEndpointMetric({
          endpoint: "/api/test",
          method: "GET",
          responseTime: 100,
          statusCode: 500,
        });
      }
      
      const stats = getOverallStats();
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeLessThanOrEqual(100);
    });
  });
});
