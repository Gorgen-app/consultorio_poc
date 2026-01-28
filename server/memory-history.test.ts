/**
 * Testes para o histórico de uso de memória
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getMemoryHistory, startMemoryHistoryCollection, stopMemoryHistoryCollection } from './performance';

describe('Histórico de Memória', () => {
  describe('getMemoryHistory', () => {
    it('deve retornar estrutura correta mesmo sem dados', () => {
      const result = getMemoryHistory(5);
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.summary).toHaveProperty('avgHeapUsed');
      expect(result.summary).toHaveProperty('maxHeapUsed');
      expect(result.summary).toHaveProperty('minHeapUsed');
      expect(result.summary).toHaveProperty('avgHeapPercent');
      expect(result.summary).toHaveProperty('maxHeapPercent');
      expect(result.summary).toHaveProperty('trend');
    });

    it('deve aceitar parâmetro de minutos', () => {
      const result30 = getMemoryHistory(30);
      const result60 = getMemoryHistory(60);
      
      expect(result30).toHaveProperty('data');
      expect(result60).toHaveProperty('data');
    });

    it('deve retornar trend como stable, increasing ou decreasing', () => {
      const result = getMemoryHistory(60);
      
      expect(['stable', 'increasing', 'decreasing']).toContain(result.summary.trend);
    });

    it('summary deve ter valores numéricos válidos', () => {
      const result = getMemoryHistory(60);
      
      expect(typeof result.summary.avgHeapUsed).toBe('number');
      expect(typeof result.summary.maxHeapUsed).toBe('number');
      expect(typeof result.summary.minHeapUsed).toBe('number');
      expect(typeof result.summary.avgHeapPercent).toBe('number');
      expect(typeof result.summary.maxHeapPercent).toBe('number');
      
      // Valores devem ser >= 0
      expect(result.summary.avgHeapUsed).toBeGreaterThanOrEqual(0);
      expect(result.summary.maxHeapUsed).toBeGreaterThanOrEqual(0);
      expect(result.summary.minHeapUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Coleta de Memória', () => {
    it('startMemoryHistoryCollection não deve lançar erro', () => {
      expect(() => startMemoryHistoryCollection()).not.toThrow();
    });

    it('stopMemoryHistoryCollection não deve lançar erro', () => {
      expect(() => stopMemoryHistoryCollection()).not.toThrow();
    });

    it('deve poder iniciar e parar coleta múltiplas vezes', () => {
      expect(() => {
        startMemoryHistoryCollection();
        startMemoryHistoryCollection(); // Chamada duplicada não deve causar erro
        stopMemoryHistoryCollection();
        stopMemoryHistoryCollection(); // Chamada duplicada não deve causar erro
      }).not.toThrow();
    });
  });

  describe('Formato dos Dados', () => {
    it('cada item de data deve ter campos obrigatórios', () => {
      // Aguardar um pouco para ter dados
      startMemoryHistoryCollection();
      
      const result = getMemoryHistory(60);
      
      if (result.data.length > 0) {
        const item = result.data[0];
        expect(item).toHaveProperty('time');
        expect(item).toHaveProperty('heapUsed');
        expect(item).toHaveProperty('heapTotal');
        expect(item).toHaveProperty('heapUsagePercent');
        expect(item).toHaveProperty('rss');
        
        // Verificar tipos
        expect(typeof item.time).toBe('string');
        expect(typeof item.heapUsed).toBe('number');
        expect(typeof item.heapTotal).toBe('number');
        expect(typeof item.heapUsagePercent).toBe('number');
        expect(typeof item.rss).toBe('number');
      }
    });

    it('time deve estar no formato HH:MM', () => {
      startMemoryHistoryCollection();
      
      const result = getMemoryHistory(60);
      
      if (result.data.length > 0) {
        const timeRegex = /^\d{2}:\d{2}$/;
        expect(result.data[0].time).toMatch(timeRegex);
      }
    });
  });
});
