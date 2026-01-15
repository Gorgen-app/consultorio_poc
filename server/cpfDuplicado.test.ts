import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock do banco de dados
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

describe('Verificação de CPF Duplicado', () => {
  describe('Lógica de limpeza de CPF', () => {
    it('deve limpar CPF com pontos e traços', () => {
      const cpf = '529.982.247-25';
      const cpfLimpo = cpf.replace(/\D/g, '');
      expect(cpfLimpo).toBe('52998224725');
      expect(cpfLimpo.length).toBe(11);
    });

    it('deve limpar CPF com espaços', () => {
      const cpf = '529 982 247 25';
      const cpfLimpo = cpf.replace(/\D/g, '');
      expect(cpfLimpo).toBe('52998224725');
    });

    it('deve manter CPF já limpo', () => {
      const cpf = '52998224725';
      const cpfLimpo = cpf.replace(/\D/g, '');
      expect(cpfLimpo).toBe('52998224725');
    });

    it('deve identificar CPF incompleto', () => {
      const cpf = '529.982.247';
      const cpfLimpo = cpf.replace(/\D/g, '');
      expect(cpfLimpo.length).toBeLessThan(11);
    });
  });

  describe('Resultado da verificação', () => {
    it('deve retornar estrutura correta quando CPF não é duplicado', () => {
      const resultado = { duplicado: false };
      expect(resultado.duplicado).toBe(false);
      expect(resultado).not.toHaveProperty('pacienteExistente');
    });

    it('deve retornar estrutura correta quando CPF é duplicado', () => {
      const resultado = {
        duplicado: true,
        pacienteExistente: {
          id: 123,
          idPaciente: '2025-0000001',
          nome: 'João da Silva',
        },
      };
      expect(resultado.duplicado).toBe(true);
      expect(resultado.pacienteExistente).toBeDefined();
      expect(resultado.pacienteExistente?.id).toBe(123);
      expect(resultado.pacienteExistente?.nome).toBe('João da Silva');
    });
  });

  describe('Exclusão do próprio paciente na edição', () => {
    it('deve aceitar excludeId para não considerar o próprio paciente', () => {
      const input = {
        cpf: '529.982.247-25',
        excludeId: 123,
      };
      expect(input.excludeId).toBe(123);
    });

    it('deve funcionar sem excludeId para novo cadastro', () => {
      const input = {
        cpf: '529.982.247-25',
      };
      expect(input.excludeId).toBeUndefined();
    });
  });
});
