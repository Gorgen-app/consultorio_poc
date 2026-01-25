/**
 * ============================================================================
 * GORGEN EXAM EXTRACTOR - Testes Unitários
 * ============================================================================
 * 
 * Testes para validar o funcionamento do extrator de exames.
 * 
 * EXECUTAR:
 *   npx vitest run exam-extractor.test.ts
 *   npx vitest watch exam-extractor.test.ts
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExtratorExames,
  TipoDocumento,
  DecisaoFiltro,
  DocumentoPDF,
  ExameExtraido
} from './exam-extractor';
import {
  parseDateBR,
  formatDateBR,
  ordenarDatasBR,
  removerAcentos,
  normalizarEspacos,
  validarReferencia,
  parseReferencia,
  categorizarExame
} from './utils';

// ============================================================================
// FIXTURES - DADOS DE TESTE
// ============================================================================

const PDF_LABORATORIAL: DocumentoPDF = {
  nome_arquivo: '2841160157.pdf',
  caminho: '/test/2841160157.pdf',
  conteudo_texto: `
    WEINMANN LABORATÓRIO
    Cliente: JOÃO SILVA DA COSTA
    Data da Ficha: 15/01/2026
    
    HEMOGRAMA COMPLETO
    
    ERITRÓCITOS: 4.85 milhões/mm³
    Valores de referência: 4.32 a 5.67
    
    HEMOGLOBINA: 14.2 g/dL
    Valores de referência: 13.3 a 16.5
    
    HEMATÓCRITO: 42.5 %
    Valores de referência: 39.2 a 49.0
    
    LEUCÓCITOS: 7.500 /mm³
    Valores de referência: 3.650 a 8.120
    
    PLAQUETAS: 180.000 /mm³
    Valores de referência: 151.000 a 304.000
    
    GLICOSE: 105 mg/dL
    Valores de referência: < 100
    
    CREATININA: 1.1 mg/dL
    Valores de referência: 0.70 a 1.30
    
    TGO (AST): 45 U/L
    Valores de referência: < 40
    
    TGP (ALT): 38 U/L
    Valores de referência: < 41
  `,
  numero_paginas: 3,
  tamanho_bytes: 50000
};

const PDF_RECEITA: DocumentoPDF = {
  nome_arquivo: 'receita_especial.pdf',
  caminho: '/test/receita_especial.pdf',
  conteudo_texto: `
    RECEITA ESPECIAL
    
    Paciente: Maria Souza
    Data: 10/01/2026
    
    Prescrição:
    1. Medicamento XYZ 500mg
       Tomar 1 comprimido ao dia por 30 dias
       Via oral
    
    2. Medicamento ABC 10mg
       Tomar 2 comprimidos ao dia
       Uso contínuo
  `,
  numero_paginas: 1,
  tamanho_bytes: 10000
};

const PDF_SOLICITACAO: DocumentoPDF = {
  nome_arquivo: 'guia_sadt.pdf',
  caminho: '/test/guia_sadt.pdf',
  conteudo_texto: `
    GUIA SADT - SOLICITAÇÃO DE EXAMES
    
    Paciente: Pedro Santos
    
    Solicito os exames abaixo:
    - Hemograma completo
    - Glicemia de jejum
    - Perfil lipídico
    
    Favor realizar em jejum de 12 horas.
  `,
  numero_paginas: 1,
  tamanho_bytes: 8000
};

const PDF_IMAGEM: DocumentoPDF = {
  nome_arquivo: 'usg_abdome.pdf',
  caminho: '/test/usg_abdome.pdf',
  conteudo_texto: `
    ULTRASSONOGRAFIA DE ABDOME TOTAL
    
    Paciente: ANA MARIA OLIVEIRA
    Data: 20/01/2026
    
    FÍGADO: Tamanho normal, ecogenicidade preservada.
    Sem lesões focais.
    
    VESÍCULA BILIAR: Normodistendida, paredes finas.
    Presença de cálculo de 8mm.
    
    RINS: Tamanho e forma normais bilateralmente.
    Sem dilatação do sistema coletor.
    
    IMPRESSÃO DIAGNÓSTICA:
    - Colelitíase
    - Demais estruturas sem alterações
  `,
  numero_paginas: 2,
  tamanho_bytes: 25000
};

const PDF_LAUDO_EVOLUTIVO: DocumentoPDF = {
  nome_arquivo: 'laudo_evolutivo.pdf',
  caminho: '/test/laudo_evolutivo.pdf',
  conteudo_texto: `
    LAUDO EVOLUTIVO
    
    Paciente: CARLOS EDUARDO FERREIRA
    
    EXAME           10/10/25    15/11/25    20/12/25    15/01/26
    GLICOSE         98          102         110         95
    HEMOGLOBINA     14.5        14.2        13.8        14.0
    CREATININA      1.0         1.1         1.2         1.1
    TGO             35          42          55          40
    TGP             30          38          48          35
    FERRITINA       250         320         450         380
  `,
  numero_paginas: 1,
  tamanho_bytes: 15000
};

// ============================================================================
// TESTES - EXTRATOR DE EXAMES
// ============================================================================

describe('ExtratorExames', () => {
  let extrator: ExtratorExames;

  beforeEach(() => {
    extrator = new ExtratorExames();
  });

  describe('Filtro Rápido', () => {
    it('deve processar PDF laboratorial', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      expect(resultado.estatisticas.arquivos_processados).toBe(1);
      expect(resultado.estatisticas.arquivos_ignorados).toBe(0);
    });

    it('deve ignorar receita médica', async () => {
      const resultado = await extrator.processarLote([PDF_RECEITA]);
      expect(resultado.estatisticas.arquivos_ignorados).toBe(1);
      expect(resultado.ignorados[0].motivo).toContain('RECEITA');
    });

    it('deve ignorar solicitação de exames', async () => {
      const resultado = await extrator.processarLote([PDF_SOLICITACAO]);
      expect(resultado.estatisticas.arquivos_ignorados).toBe(1);
      expect(resultado.ignorados[0].motivo).toContain('SOLICITAÇÃO');
    });
  });

  describe('Classificação de Documentos', () => {
    it('deve classificar PDF laboratorial corretamente', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      expect(resultado.exames.length).toBeGreaterThan(0);
      // Verificar que extraiu exames de hemograma
      const hemoglobina = resultado.exames.find(e => e.nome_exame.includes('HEMOGLOBINA'));
      expect(hemoglobina).toBeDefined();
    });

    it('deve classificar PDF de imagem corretamente', async () => {
      const resultado = await extrator.processarLote([PDF_IMAGEM]);
      expect(resultado.exames.length).toBeGreaterThan(0);
      // Verificar que extraiu exame de USG
      const usg = resultado.exames.find(e => e.nome_exame.includes('USG'));
      expect(usg).toBeDefined();
    });

    it('deve classificar laudo evolutivo corretamente', async () => {
      const resultado = await extrator.processarLote([PDF_LAUDO_EVOLUTIVO]);
      expect(resultado.exames.length).toBeGreaterThan(0);
      // Verificar que extraiu múltiplas datas
      const datas = [...new Set(resultado.exames.map(e => e.data_coleta))];
      expect(datas.length).toBeGreaterThan(1);
    });
  });

  describe('Extração de Dados', () => {
    it('deve extrair nome do paciente', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      expect(resultado.exames[0].paciente).toBe('JOÃO SILVA DA COSTA');
    });

    it('deve extrair data da coleta', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      expect(resultado.exames[0].data_coleta).toBe('15/01/2026');
    });

    it('deve extrair laboratório', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      expect(resultado.exames[0].laboratorio).toContain('Weinmann');
    });

    it('deve identificar valores alterados', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      // Glicose 105 está acima da referência (<100)
      const glicose = resultado.exames.find(e => e.nome_exame.includes('GLICOSE'));
      expect(glicose?.alterado).toBe(true);
      
      // TGO 45 está acima da referência (<40)
      const tgo = resultado.exames.find(e => e.nome_exame.includes('TGO'));
      expect(tgo?.alterado).toBe(true);
    });

    it('deve identificar valores normais', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      // Hemoglobina 14.2 está dentro da referência (13.3-16.5)
      const hemoglobina = resultado.exames.find(e => e.nome_exame.includes('HEMOGLOBINA'));
      expect(hemoglobina?.alterado).toBe(false);
    });
  });

  describe('Normalização de Exames', () => {
    it('deve normalizar TGO/AST', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      const tgo = resultado.exames.find(e => 
        e.nome_exame.includes('TGO') || e.nome_exame.includes('AST')
      );
      expect(tgo).toBeDefined();
    });

    it('deve normalizar TGP/ALT', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      const tgp = resultado.exames.find(e => 
        e.nome_exame.includes('TGP') || e.nome_exame.includes('ALT')
      );
      expect(tgp).toBeDefined();
    });
  });

  describe('Processamento em Lote', () => {
    it('deve processar múltiplos PDFs', async () => {
      const resultado = await extrator.processarLote([
        PDF_LABORATORIAL,
        PDF_IMAGEM,
        PDF_RECEITA
      ]);
      
      expect(resultado.estatisticas.total_arquivos).toBe(3);
      expect(resultado.estatisticas.arquivos_processados).toBe(2);
      expect(resultado.estatisticas.arquivos_ignorados).toBe(1);
    });

    it('deve calcular estatísticas corretamente', async () => {
      const resultado = await extrator.processarLote([PDF_LABORATORIAL]);
      
      expect(resultado.estatisticas.tempo_total_ms).toBeGreaterThan(0);
      expect(resultado.estatisticas.exames_por_minuto).toBeGreaterThan(0);
    });
  });

  describe('Índice de Pacientes', () => {
    it('deve atualizar índice de pacientes', async () => {
      await extrator.processarLote([PDF_LABORATORIAL]);
      
      const indice = extrator.getIndicePacientes();
      expect(indice.has('JOÃO SILVA DA COSTA')).toBe(true);
    });

    it('deve registrar datas no índice', async () => {
      await extrator.processarLote([PDF_LABORATORIAL]);
      
      const indice = extrator.getIndicePacientes();
      const paciente = indice.get('JOÃO SILVA DA COSTA');
      expect(paciente?.datas).toContain('15/01/2026');
    });
  });
});

// ============================================================================
// TESTES - UTILITÁRIOS
// ============================================================================

describe('Utilitários', () => {
  describe('parseDateBR', () => {
    it('deve parsear data DD/MM/YYYY', () => {
      const data = parseDateBR('15/01/2026');
      expect(data?.getDate()).toBe(15);
      expect(data?.getMonth()).toBe(0); // Janeiro = 0
      expect(data?.getFullYear()).toBe(2026);
    });

    it('deve parsear data DD/MM/YY', () => {
      const data = parseDateBR('15/01/26');
      expect(data?.getFullYear()).toBe(2026);
    });

    it('deve retornar null para data inválida', () => {
      const data = parseDateBR('invalid');
      expect(data).toBeNull();
    });
  });

  describe('formatDateBR', () => {
    it('deve formatar data para DD/MM/YYYY', () => {
      const data = new Date(2026, 0, 15); // 15/01/2026
      expect(formatDateBR(data)).toBe('15/01/2026');
    });
  });

  describe('ordenarDatasBR', () => {
    it('deve ordenar datas cronologicamente', () => {
      const datas = ['20/12/25', '10/10/25', '15/01/26', '15/11/25'];
      const ordenadas = ordenarDatasBR(datas);
      expect(ordenadas[0]).toBe('10/10/25');
      expect(ordenadas[3]).toBe('15/01/26');
    });
  });

  describe('removerAcentos', () => {
    it('deve remover acentos', () => {
      expect(removerAcentos('HEMOGLOBINA GLICADA')).toBe('HEMOGLOBINA GLICADA');
      expect(removerAcentos('BILIRRUBINA DIRETA')).toBe('BILIRRUBINA DIRETA');
      expect(removerAcentos('CREATININA')).toBe('CREATININA');
    });
  });

  describe('normalizarEspacos', () => {
    it('deve normalizar múltiplos espaços', () => {
      expect(normalizarEspacos('GAMA   GT')).toBe('GAMA GT');
      expect(normalizarEspacos('  TESTE  ')).toBe('TESTE');
    });
  });

  describe('validarReferencia', () => {
    it('deve validar valor dentro da faixa', () => {
      const resultado = validarReferencia(14.2, 13.3, 16.5);
      expect(resultado.valido).toBe(true);
      expect(resultado.status).toBe('normal');
    });

    it('deve identificar valor baixo', () => {
      const resultado = validarReferencia(12.0, 13.3, 16.5);
      expect(resultado.valido).toBe(false);
      expect(resultado.status).toBe('baixo');
    });

    it('deve identificar valor alto', () => {
      const resultado = validarReferencia(18.0, 13.3, 16.5);
      expect(resultado.valido).toBe(false);
      expect(resultado.status).toBe('alto');
    });

    it('deve validar apenas máximo', () => {
      const resultado = validarReferencia(105, undefined, 100);
      expect(resultado.valido).toBe(false);
      expect(resultado.status).toBe('alto');
    });

    it('deve validar apenas mínimo', () => {
      const resultado = validarReferencia(35, 40, undefined);
      expect(resultado.valido).toBe(false);
      expect(resultado.status).toBe('baixo');
    });
  });

  describe('parseReferencia', () => {
    it('deve parsear faixa "X - Y"', () => {
      const ref = parseReferencia('13.3 - 16.5');
      expect(ref?.min).toBe(13.3);
      expect(ref?.max).toBe(16.5);
    });

    it('deve parsear "< X"', () => {
      const ref = parseReferencia('< 100');
      expect(ref?.max).toBe(100);
      expect(ref?.min).toBeUndefined();
    });

    it('deve parsear "> X"', () => {
      const ref = parseReferencia('> 40');
      expect(ref?.min).toBe(40);
      expect(ref?.max).toBeUndefined();
    });

    it('deve retornar null para formato inválido', () => {
      const ref = parseReferencia('normal');
      expect(ref).toBeNull();
    });
  });

  describe('categorizarExame', () => {
    it('deve categorizar exames de hemograma', () => {
      expect(categorizarExame('HEMOGLOBINA')).toBe('HEMOGRAMA');
      expect(categorizarExame('LEUCÓCITOS')).toBe('HEMOGRAMA');
      expect(categorizarExame('PLAQUETAS')).toBe('HEMOGRAMA');
    });

    it('deve categorizar função hepática', () => {
      expect(categorizarExame('TGO/AST')).toBe('FUNÇÃO HEPÁTICA');
      expect(categorizarExame('TGP/ALT')).toBe('FUNÇÃO HEPÁTICA');
      expect(categorizarExame('GAMA GT')).toBe('FUNÇÃO HEPÁTICA');
    });

    it('deve categorizar função renal', () => {
      expect(categorizarExame('CREATININA')).toBe('FUNÇÃO RENAL');
      expect(categorizarExame('UREIA')).toBe('FUNÇÃO RENAL');
    });

    it('deve categorizar perfil lipídico', () => {
      expect(categorizarExame('COLESTEROL TOTAL')).toBe('PERFIL LIPÍDICO');
      expect(categorizarExame('TRIGLICERÍDEOS')).toBe('PERFIL LIPÍDICO');
    });

    it('deve categorizar glicemia', () => {
      expect(categorizarExame('GLICOSE')).toBe('GLICEMIA');
      expect(categorizarExame('HEMOGLOBINA GLICADA')).toBe('GLICEMIA');
    });

    it('deve categorizar exames de imagem', () => {
      expect(categorizarExame('USG ABDOME')).toBe('IMAGEM');
      expect(categorizarExame('TOMOGRAFIA')).toBe('IMAGEM');
    });

    it('deve retornar OUTROS para exames desconhecidos', () => {
      expect(categorizarExame('EXAME DESCONHECIDO')).toBe('OUTROS');
    });
  });
});

// ============================================================================
// TESTES DE INTEGRAÇÃO
// ============================================================================

describe('Integração', () => {
  it('deve processar lote completo e gerar relatório', async () => {
    const extrator = new ExtratorExames();
    const resultado = await extrator.processarLote([
      PDF_LABORATORIAL,
      PDF_IMAGEM,
      PDF_LAUDO_EVOLUTIVO,
      PDF_RECEITA,
      PDF_SOLICITACAO
    ]);

    // Verificar estatísticas
    expect(resultado.estatisticas.total_arquivos).toBe(5);
    expect(resultado.estatisticas.arquivos_processados).toBe(3);
    expect(resultado.estatisticas.arquivos_ignorados).toBe(2);

    // Verificar relatório
    const relatorio = extrator.gerarRelatorio(resultado);
    expect(relatorio).toContain('RELATÓRIO DE PROCESSAMENTO');
    expect(relatorio).toContain('ESTATÍSTICAS GERAIS');
    expect(relatorio).toContain('ARQUIVOS IGNORADOS');
  });

  it('deve gerar tabela pivotada corretamente', async () => {
    const extrator = new ExtratorExames();
    const resultado = await extrator.processarLote([PDF_LAUDO_EVOLUTIVO]);

    const tabela = extrator.gerarTabelaPivotada(resultado.exames);
    
    // Verificar que contém cabeçalho com datas
    expect(tabela).toContain('EXAME');
    expect(tabela).toContain('10/10/25');
    expect(tabela).toContain('15/01/26');
    
    // Verificar que contém exames
    expect(tabela).toContain('GLICOSE');
  });
});
