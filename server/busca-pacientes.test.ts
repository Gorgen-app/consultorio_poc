import { describe, it, expect } from 'vitest';

/**
 * Testes para validar as correções na busca de pacientes
 */

// Função de normalização (copiada do db.ts para teste)
function normalizeSearchTerm(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeLikePattern(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

describe('Normalização de Busca', () => {
  describe('normalizeSearchTerm', () => {
    it('deve converter para minúsculas', () => {
      expect(normalizeSearchTerm('MARIA')).toBe('maria');
      expect(normalizeSearchTerm('João')).toBe('joao');
      expect(normalizeSearchTerm('ANDRÉ')).toBe('andre');
    });

    it('deve remover acentos', () => {
      expect(normalizeSearchTerm('José')).toBe('jose');
      expect(normalizeSearchTerm('André')).toBe('andre');
      expect(normalizeSearchTerm('João')).toBe('joao');
      expect(normalizeSearchTerm('Conceição')).toBe('conceicao');
      expect(normalizeSearchTerm('Müller')).toBe('muller');
    });

    it('deve remover espaços extras', () => {
      expect(normalizeSearchTerm('  Maria  ')).toBe('maria');
      expect(normalizeSearchTerm('\tJoão\n')).toBe('joao');
    });

    it('deve lidar com strings vazias', () => {
      expect(normalizeSearchTerm('')).toBe('');
      expect(normalizeSearchTerm('   ')).toBe('');
    });

    it('deve preservar números', () => {
      expect(normalizeSearchTerm('123.456.789-00')).toBe('123.456.789-00');
      expect(normalizeSearchTerm('2025-0000001')).toBe('2025-0000001');
    });
  });

  describe('escapeLikePattern', () => {
    it('deve escapar caracteres especiais do LIKE', () => {
      expect(escapeLikePattern('100%')).toBe('100\\%');
      expect(escapeLikePattern('test_name')).toBe('test\\_name');
      expect(escapeLikePattern('path\\file')).toBe('path\\\\file');
    });

    it('deve lidar com múltiplos caracteres especiais', () => {
      expect(escapeLikePattern('100%_test')).toBe('100\\%\\_test');
    });

    it('deve preservar texto normal', () => {
      expect(escapeLikePattern('Maria Silva')).toBe('Maria Silva');
      expect(escapeLikePattern('João')).toBe('João');
    });
  });
});

describe('Busca Case-Insensitive', () => {
  it('deve encontrar "Maria" buscando por "maria"', () => {
    const termoBusca = normalizeSearchTerm('maria');
    const nomeNoBanco = normalizeSearchTerm('Maria');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar "MARIA SILVA" buscando por "maria"', () => {
    const termoBusca = normalizeSearchTerm('maria');
    const nomeNoBanco = normalizeSearchTerm('MARIA SILVA');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar "José" buscando por "jose"', () => {
    const termoBusca = normalizeSearchTerm('jose');
    const nomeNoBanco = normalizeSearchTerm('José');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar "André Gorgen" buscando por "andre"', () => {
    const termoBusca = normalizeSearchTerm('andre');
    const nomeNoBanco = normalizeSearchTerm('André Gorgen');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar "João" buscando por "joao"', () => {
    const termoBusca = normalizeSearchTerm('joao');
    const nomeNoBanco = normalizeSearchTerm('João');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });
});

describe('Busca por CPF', () => {
  it('deve normalizar CPF removendo pontuação', () => {
    const cpfFormatado = '123.456.789-00';
    const cpfNormalizado = cpfFormatado.replace(/\D/g, '');
    expect(cpfNormalizado).toBe('12345678900');
  });

  it('deve encontrar CPF formatado buscando por números', () => {
    const termoBusca = '12345';
    const cpfNoBanco = '123.456.789-00'.replace(/\D/g, '');
    expect(cpfNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar CPF sem formatação buscando por números', () => {
    const termoBusca = '12345';
    const cpfNoBanco = '12345678900';
    expect(cpfNoBanco.includes(termoBusca)).toBe(true);
  });
});

describe('Cenários de Busca Problemáticos (Corrigidos)', () => {
  it('deve encontrar nome com mais de 5 caracteres', () => {
    const termoBusca = normalizeSearchTerm('Maria Silva');
    const nomeNoBanco = normalizeSearchTerm('MARIA SILVA DOS SANTOS');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar nome parcial com acentos diferentes', () => {
    const termoBusca = normalizeSearchTerm('conceicao');
    const nomeNoBanco = normalizeSearchTerm('Maria da Conceição');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });

  it('deve encontrar sobrenome específico', () => {
    const termoBusca = normalizeSearchTerm('gorgen');
    const nomeNoBanco = normalizeSearchTerm('André Gorgen');
    expect(nomeNoBanco.includes(termoBusca)).toBe(true);
  });
});
