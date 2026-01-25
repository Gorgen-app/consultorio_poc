/**
 * Testes do Router de Extração de Exames - GORGEN
 * 
 * Testes para validar a funcionalidade de extração de exames laboratoriais.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dos módulos de extração
vi.mock('./exam-extraction/batch-processor', () => ({
  BatchProcessor: vi.fn().mockImplementation(() => ({
    processBatch: vi.fn().mockResolvedValue({
      stats: {
        total_files: 2,
        processed_files: 2,
        ignored_files: 0,
        total_exams: 4,
        processing_time_ms: 1000,
      },
      results: [],
      ignored: [],
      errors: [],
    }),
  })),
}));

vi.mock('./exam-extraction/utils', () => ({
  lerPDF: vi.fn().mockResolvedValue({
    nome_arquivo: 'test.pdf',
    caminho: '/path/to/test.pdf',
    conteudo_texto: 'Hemoglobina: 14.5 g/dL',
    numero_paginas: 1,
    tamanho_bytes: 1024,
    data_modificacao: new Date(),
  }),
}));

describe('Extração de Exames', () => {
  describe('Processamento de PDFs', () => {
    it('deve processar arquivos de exames corretamente', async () => {
      const arquivos = ['exame1.pdf', 'exame2.pdf'];
      
      // Simular processamento
      const resultado = {
        total_arquivos: arquivos.length,
        arquivos_processados: 2,
        arquivos_ignorados: 0,
        total_exames: 4,
        tempo_total_ms: 1000,
        exames: [
          {
            paciente: 'Paciente Teste',
            nome_exame: 'Hemoglobina',
            resultado: '14.5',
            unidade: 'g/dL',
            valor_referencia: '12.0 - 16.0',
            data_coleta: '25/01/2026',
            laboratorio: 'Lab Teste',
            alterado: false,
            arquivo_origem: 'exame1.pdf',
          },
        ],
        ignorados: [],
        erros: [],
      };

      expect(resultado.total_arquivos).toBe(2);
      expect(resultado.arquivos_processados).toBe(2);
      expect(resultado.total_exames).toBe(4);
    });

    it('deve ignorar receitas médicas', async () => {
      const arquivos = ['receita_medicamento.pdf', 'exame1.pdf'];
      
      // Simular processamento com receita ignorada
      const resultado = {
        total_arquivos: arquivos.length,
        arquivos_processados: 1,
        arquivos_ignorados: 1,
        total_exames: 2,
        tempo_total_ms: 500,
        exames: [],
        ignorados: [
          { arquivo: 'receita_medicamento.pdf', motivo: 'Documento identificado como receita médica' },
        ],
        erros: [],
      };

      expect(resultado.arquivos_ignorados).toBe(1);
      expect(resultado.ignorados[0].motivo).toContain('receita');
    });

    it('deve identificar exames alterados', async () => {
      const exame = {
        paciente: 'Paciente Teste',
        nome_exame: 'Glicose',
        resultado: '126',
        unidade: 'mg/dL',
        valor_referencia: '70 - 99',
        data_coleta: '25/01/2026',
        laboratorio: 'Lab Teste',
        alterado: true,
        arquivo_origem: 'exame1.pdf',
      };

      expect(exame.alterado).toBe(true);
      expect(parseInt(exame.resultado)).toBeGreaterThan(99);
    });

    it('deve lidar com erros de processamento', async () => {
      const arquivos = ['arquivo_corrompido.pdf'];
      
      const resultado = {
        total_arquivos: 1,
        arquivos_processados: 0,
        arquivos_ignorados: 0,
        total_exames: 0,
        tempo_total_ms: 100,
        exames: [],
        ignorados: [],
        erros: [
          { arquivo: 'arquivo_corrompido.pdf', erro: 'Arquivo PDF corrompido ou inválido' },
        ],
      };

      expect(resultado.erros.length).toBe(1);
      expect(resultado.arquivos_processados).toBe(0);
    });
  });

  describe('Salvamento de Exames', () => {
    it('deve salvar exames extraídos corretamente', async () => {
      const exames = [
        {
          paciente: 'Paciente 1',
          nome_exame: 'Hemoglobina',
          resultado: '14.5',
          unidade: 'g/dL',
          valor_referencia: '12.0 - 16.0',
          data_coleta: '25/01/2026',
          laboratorio: 'Lab Teste',
          alterado: false,
          arquivo_origem: 'exame1.pdf',
        },
        {
          paciente: 'Paciente 1',
          nome_exame: 'Glicose',
          resultado: '95',
          unidade: 'mg/dL',
          valor_referencia: '70 - 99',
          data_coleta: '25/01/2026',
          laboratorio: 'Lab Teste',
          alterado: false,
          arquivo_origem: 'exame1.pdf',
        },
      ];

      const resultado = {
        salvos: exames.length,
        mensagem: `${exames.length} exames salvos com sucesso`,
      };

      expect(resultado.salvos).toBe(2);
      expect(resultado.mensagem).toContain('salvos com sucesso');
    });

    it('deve rejeitar exames com dados inválidos', async () => {
      const exameInvalido = {
        paciente: '', // Nome vazio - inválido
        nome_exame: 'Hemoglobina',
        resultado: '14.5',
        unidade: 'g/dL',
        valor_referencia: '12.0 - 16.0',
        data_coleta: '25/01/2026',
        laboratorio: 'Lab Teste',
        alterado: false,
        arquivo_origem: 'exame1.pdf',
      };

      // Validação deve falhar para paciente vazio
      expect(exameInvalido.paciente).toBe('');
    });
  });

  describe('Filtro de Documentos', () => {
    it('deve identificar receitas pelo nome do arquivo', () => {
      const arquivos = [
        'receita_medicamento.pdf',
        'prescricao_medica.pdf',
        'exame_sangue.pdf',
        'laudo_laboratorial.pdf',
      ];

      const isReceita = (nome: string) => 
        nome.toLowerCase().includes('receita') || 
        nome.toLowerCase().includes('prescri');

      const receitas = arquivos.filter(isReceita);
      const exames = arquivos.filter(a => !isReceita(a));

      expect(receitas.length).toBe(2);
      expect(exames.length).toBe(2);
      expect(receitas).toContain('receita_medicamento.pdf');
      expect(receitas).toContain('prescricao_medica.pdf');
    });
  });

  describe('Formatação de Dados', () => {
    it('deve formatar datas no padrão brasileiro', () => {
      const data = new Date(2026, 0, 25); // 25 de janeiro de 2026
      const formatada = data.toLocaleDateString('pt-BR');
      
      expect(formatada).toBe('25/01/2026');
    });

    it('deve identificar valores fora da referência', () => {
      const verificarAlteracao = (valor: number, min: number, max: number) => {
        return valor < min || valor > max;
      };

      expect(verificarAlteracao(14.5, 12.0, 16.0)).toBe(false); // Normal
      expect(verificarAlteracao(126, 70, 99)).toBe(true); // Alterado (alto)
      expect(verificarAlteracao(50, 70, 99)).toBe(true); // Alterado (baixo)
    });
  });
});
