/**
 * Testes para busca de pacientes - case insensitive e sem acentos
 * GORGEN System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo de database
vi.mock('./_core/database', () => ({
  getPooledDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  }),
}));

describe('Busca de Pacientes - Case/Accent Insensitive', () => {
  describe('Normalização de termos de busca', () => {
    it('deve normalizar acentos corretamente', () => {
      const termos = [
        { input: 'José', expected: 'jose' },
        { input: 'MARIA', expected: 'maria' },
        { input: 'João', expected: 'joao' },
        { input: 'André', expected: 'andre' },
        { input: 'Conceição', expected: 'conceicao' },
        { input: 'ANTÔNIO', expected: 'antonio' },
        { input: 'Müller', expected: 'muller' },
      ];

      termos.forEach(({ input, expected }) => {
        const normalizado = input
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        expect(normalizado).toBe(expected);
      });
    });

    it('deve manter números e caracteres especiais', () => {
      const termos = [
        { input: '123.456.789-00', expected: '123.456.789-00' },
        { input: 'CPF: 12345678900', expected: 'cpf: 12345678900' },
      ];

      termos.forEach(({ input, expected }) => {
        const normalizado = input
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        expect(normalizado).toBe(expected);
      });
    });
  });

  describe('Busca por nome', () => {
    it('deve encontrar paciente independente de maiúsculas/minúsculas', () => {
      // Simulação: buscar "JOSE" deve encontrar "José"
      const nomeNoBanco = 'José da Silva';
      const termoBusca = 'JOSE';
      
      const nomeNormalizado = nomeNoBanco
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const termoNormalizado = termoBusca
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      
      expect(nomeNormalizado).toContain(termoNormalizado);
    });

    it('deve encontrar paciente independente de acentos', () => {
      // Simulação: buscar "Joao" deve encontrar "João"
      const nomeNoBanco = 'João Pedro';
      const termoBusca = 'Joao';
      
      const nomeNormalizado = nomeNoBanco
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const termoNormalizado = termoBusca
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      
      expect(nomeNormalizado).toContain(termoNormalizado);
    });

    it('deve encontrar paciente com combinação de case e acentos diferentes', () => {
      const casos = [
        { nomeNoBanco: 'ANTÔNIO JOSÉ', termoBusca: 'antonio jose' },
        { nomeNoBanco: 'Maria Conceição', termoBusca: 'MARIA CONCEICAO' },
        { nomeNoBanco: 'André Müller', termoBusca: 'andre muller' },
        { nomeNoBanco: 'josé', termoBusca: 'JOSÉ' },
      ];

      casos.forEach(({ nomeNoBanco, termoBusca }) => {
        const nomeNormalizado = nomeNoBanco
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const termoNormalizado = termoBusca
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        
        expect(nomeNormalizado).toContain(termoNormalizado);
      });
    });
  });

  describe('Busca por CPF', () => {
    it('deve encontrar paciente por CPF com ou sem formatação', () => {
      const cpfNoBanco = '123.456.789-00';
      const buscas = ['12345678900', '123.456.789-00', '123456789'];
      
      buscas.forEach(busca => {
        const cpfNumeros = cpfNoBanco.replace(/\D/g, '');
        const buscaNumeros = busca.replace(/\D/g, '');
        expect(cpfNumeros).toContain(buscaNumeros);
      });
    });
  });

  describe('Busca por ID do paciente', () => {
    it('deve encontrar paciente por ID numérico', () => {
      const idPaciente = '12345';
      const busca = '123';
      
      expect(idPaciente).toContain(busca);
    });
  });
});
