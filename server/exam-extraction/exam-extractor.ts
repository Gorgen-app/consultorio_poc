/**
 * ============================================================================
 * GORGEN EXAM EXTRACTOR - Código Completo de Extração de Exames de PDFs
 * ============================================================================
 * 
 * Este arquivo contém o código completo e detalhado do processo de extração
 * de dados de exames laboratoriais de arquivos PDF.
 * 
 * @version 2.0.0
 * @date 2026-01-25
 * @author Gorgen System
 * 
 * FLUXO DE PROCESSAMENTO:
 * 1. Receber PDFs
 * 2. Validar integridade do arquivo
 * 3. Filtro rápido (identificar não-exames)
 * 4. Classificar tipo de documento
 * 5. Detectar laboratório e aplicar formato
 * 6. Extrair dados estruturados
 * 7. Normalizar e validar
 * 8. Consolidar resultados
 * 9. Gerar tabela de saída
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// SEÇÃO 1: TIPOS E INTERFACES
// ============================================================================

/**
 * Tipos de documento suportados pelo sistema
 */
export enum TipoDocumento {
  LABORATORIAL = 'laboratorial',
  IMAGEM = 'imagem',
  ANATOMOPATOLOGICO = 'anatomopatologico',
  LAUDO_EVOLUTIVO = 'laudo_evolutivo',
  SOLICITACAO = 'solicitacao',
  RECEITA = 'receita',
  EXTRATO = 'extrato',
  GUIA = 'guia',
  ATESTADO = 'atestado',
  DESCONHECIDO = 'desconhecido'
}

/**
 * Decisão do filtro rápido
 */
export enum DecisaoFiltro {
  PROCESSAR = 'processar',
  IGNORAR = 'ignorar',
  REVISAR = 'revisar'
}

/**
 * Documento PDF de entrada
 */
export interface DocumentoPDF {
  nome_arquivo: string;
  caminho: string;
  conteudo_texto: string;
  numero_paginas: number;
  tamanho_bytes: number;
  data_modificacao?: Date;
}

/**
 * Resultado da extração de um exame
 */
export interface ExameExtraido {
  paciente: string;
  nome_exame: string;
  resultado: string;
  unidade: string;
  valor_referencia: string;
  data_coleta: string;
  laboratorio: string;
  alterado: boolean;
  arquivo_origem: string;
  pagina?: number;
  observacoes?: string;
}

/**
 * Resultado do processamento de um lote de PDFs
 */
export interface ResultadoProcessamento {
  exames: ExameExtraido[];
  estatisticas: {
    total_arquivos: number;
    arquivos_processados: number;
    arquivos_ignorados: number;
    total_exames: number;
    tempo_total_ms: number;
    exames_por_minuto: number;
  };
  erros: Array<{ arquivo: string; erro: string }>;
  ignorados: Array<{ arquivo: string; motivo: string }>;
}

/**
 * Formato de laboratório conhecido
 */
export interface FormatoLaboratorio {
  id: string;
  nome: string;
  aliases: string[];
  padrao_cabecalho: RegExp;
  padrao_paciente: RegExp;
  padrao_data: RegExp;
  padrao_exame: RegExp;
  mapeamento_exames: Record<string, string>;
  referencias_padrao: Record<string, { min?: number; max?: number; unidade: string }>;
}

/**
 * Índice de pacientes para evitar duplicidade
 */
export interface IndicePaciente {
  nome: string;
  arquivo_tabela: string;
  datas: string[];
  ultima_atualizacao: Date;
}

// ============================================================================
// SEÇÃO 2: CONFIGURAÇÕES E CONSTANTES
// ============================================================================

/**
 * Padrões para detecção rápida de documentos NÃO-EXAMES
 */
const PADROES_EXCLUSAO: Record<string, { padroes: RegExp[]; motivo: string }> = {
  receita: {
    padroes: [
      /receita\s+(médica|especial|simples)/i,
      /receituário/i,
      /prescrição\s+médica/i,
      /uso\s+(contínuo|interno|externo)/i,
      /tomar\s+\d+\s*(comprimido|cápsula|gotas)/i,
      /posologia[:\s]/i,
      /via\s+oral/i,
      /\d+\s*mg\s+(ao\s+dia|por\s+dia|\/dia)/i
    ],
    motivo: 'RECEITA MÉDICA - Não é resultado de exame'
  },
  solicitacao: {
    padroes: [
      /solicitação\s+de\s+exame/i,
      /solicito\s+(os\s+)?exames?/i,
      /guia\s+sadt/i,
      /requisição\s+de\s+exame/i,
      /favor\s+realizar/i,
      /exames?\s+solicitados?[:\s]/i,
      /cremers.*solicitação/i
    ],
    motivo: 'SOLICITAÇÃO DE EXAME - Não contém resultados'
  },
  extrato: {
    padroes: [
      /extrato\s+(de\s+)?pagamento/i,
      /demonstrativo\s+(de\s+)?pagamento/i,
      /faturamento\s+médico/i,
      /valor\s+pago/i,
      /glosa/i,
      /repasse\s+médico/i,
      /competência\s+\d{2}\/\d{4}/i
    ],
    motivo: 'EXTRATO/DEMONSTRATIVO - Documento financeiro'
  },
  guia: {
    padroes: [
      /guia\s+de\s+autorização/i,
      /autorização\s+prévia/i,
      /senha\s+de\s+autorização/i,
      /número\s+da\s+guia/i,
      /carteirinha\s+do\s+beneficiário/i
    ],
    motivo: 'GUIA DE AUTORIZAÇÃO - Não é resultado de exame'
  },
  atestado: {
    padroes: [
      /atestado\s+médico/i,
      /atesto\s+(para\s+os\s+devidos\s+fins|que)/i,
      /afastamento\s+de\s+\d+\s+dias?/i
    ],
    motivo: 'ATESTADO MÉDICO - Não é resultado de exame'
  }
};

/**
 * Padrões para identificação de tipo de exame
 */
const PADROES_TIPO_EXAME: Record<TipoDocumento, { padroes: RegExp[]; peso: number }> = {
  [TipoDocumento.LABORATORIAL]: {
    padroes: [
      /hemograma/i, /glicose/i, /creatinina/i, /ureia/i,
      /colesterol/i, /triglicerídeos/i, /tgo|tgp/i, /gama\s*gt/i,
      /bilirrubina/i, /hemoglobina/i, /hematócrito/i, /leucócitos/i,
      /plaquetas/i, /ferritina/i, /tsh/i, /t4/i, /psa/i,
      /valores?\s+de\s+referência/i, /material[:\s]+(sangue|urina|fezes)/i,
      /método[:\s]+/i, /resultado[:\s]+\d/i
    ],
    peso: 1.0
  },
  [TipoDocumento.IMAGEM]: {
    padroes: [
      /ultrassonografia|ecografia|usg/i, /tomografia|tc\s/i,
      /ressonância|rm\s/i, /ecocardiograma/i, /elastografia/i,
      /radiografia|raio-?x|rx\s/i, /doppler/i, /densitometria/i,
      /fígado\s+(com\s+)?tamanho/i, /rins\s+(com\s+)?tamanho/i,
      /ecogenicidade/i, /parênquima/i, /impressão\s+diagnóstica/i
    ],
    peso: 1.0
  },
  [TipoDocumento.ANATOMOPATOLOGICO]: {
    padroes: [
      /anatomopatológico/i, /anatomia\s+patológica/i,
      /histopatológico/i, /citopatológico/i, /biópsia/i,
      /peça\s+cirúrgica/i, /espécime/i, /diagnóstico\s+histológico/i,
      /macroscopia/i, /microscopia/i, /imunohistoquímica/i,
      /neoplasia/i, /carcinoma/i, /adenoma/i, /margens\s+cirúrgicas/i
    ],
    peso: 1.2
  },
  [TipoDocumento.LAUDO_EVOLUTIVO]: {
    padroes: [
      /laudo\s+evolutivo/i, /fluxograma/i, /histórico\s+de\s+exames/i,
      /evolução\s+laboratorial/i, /comparativo/i, /data\s+anterior/i
    ],
    peso: 1.5
  },
  [TipoDocumento.SOLICITACAO]: { padroes: [], peso: 0 },
  [TipoDocumento.RECEITA]: { padroes: [], peso: 0 },
  [TipoDocumento.EXTRATO]: { padroes: [], peso: 0 },
  [TipoDocumento.GUIA]: { padroes: [], peso: 0 },
  [TipoDocumento.ATESTADO]: { padroes: [], peso: 0 },
  [TipoDocumento.DESCONHECIDO]: { padroes: [], peso: 0 }
};

/**
 * Cache de formatos de laboratórios conhecidos
 */
const LABORATORIOS: Record<string, FormatoLaboratorio> = {
  weinmann: {
    id: 'weinmann',
    nome: 'Weinmann Laboratório',
    aliases: ['weinmann', 'lab weinmann'],
    padrao_cabecalho: /weinmann/i,
    padrao_paciente: /cliente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
    padrao_data: /data\s+da\s+ficha[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    padrao_exame: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s,()-]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%³µ]+)?/gm,
    mapeamento_exames: {
      'TRANSAMINASE GLUTAMICO-OXALACETICA (TGO)': 'TGO/AST',
      'ASPARTATO AMINO TRANSFERASE (AST)': 'TGO/AST',
      'TRANSAMINASE GLUTAMICO-PIRUVICA (TGP)': 'TGP/ALT',
      'ALANINA AMINO TRANSFERASE (ALT)': 'TGP/ALT',
      'GAMA GLUTAMIL TRANSFERASE (GAMA-GT)': 'GAMA GT',
      'PROTEINA C REATIVA ULTRASSENSIVEL': 'PCR ULTRASSENSÍVEL',
      'HEMOGLOBINA GLICADA (HBA1C)': 'HEMOGLOBINA GLICADA',
      'ESTIMATIVA DA FILTRAÇÃO GLOMERULAR': 'TFG CKD-EPI'
    },
    referencias_padrao: {
      'ERITRÓCITOS': { min: 4.32, max: 5.67, unidade: 'milhões/mm³' },
      'HEMOGLOBINA': { min: 13.3, max: 16.5, unidade: 'g/dL' },
      'HEMATÓCRITO': { min: 39.2, max: 49.0, unidade: '%' },
      'VCM': { min: 81.7, max: 95.3, unidade: 'fL' },
      'LEUCÓCITOS': { min: 3650, max: 8120, unidade: '/mm³' },
      'PLAQUETAS': { min: 151000, max: 304000, unidade: '/mm³' },
      'GLICOSE': { max: 99, unidade: 'mg/dL' },
      'CREATININA': { min: 0.70, max: 1.30, unidade: 'mg/dL' },
      'TGO/AST': { max: 40, unidade: 'U/L' },
      'TGP/ALT': { max: 41, unidade: 'U/L' },
      'GAMA GT': { min: 12, max: 73, unidade: 'U/L' },
      'COLESTEROL TOTAL': { max: 190, unidade: 'mg/dL' },
      'COLESTEROL HDL': { min: 40, unidade: 'mg/dL' },
      'COLESTEROL LDL': { max: 130, unidade: 'mg/dL' },
      'TRIGLICERÍDEOS': { max: 150, unidade: 'mg/dL' }
    }
  },
  iberleo: {
    id: 'iberleo',
    nome: 'IBERLEO Laboratório',
    aliases: ['iberleo', 'lab iberleo'],
    padrao_cabecalho: /iberleo/i,
    padrao_paciente: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
    padrao_data: /data[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    padrao_exame: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%]+)?/gm,
    mapeamento_exames: {
      'AST (TGO)': 'TGO/AST',
      'ALT (TGP)': 'TGP/ALT',
      'GGT': 'GAMA GT'
    },
    referencias_padrao: {
      'GLICOSE': { max: 100, unidade: 'mg/dL' },
      'HEMOGLOBINA GLICADA': { max: 5.7, unidade: '%' }
    }
  },
  unilab: {
    id: 'unilab',
    nome: 'UNILAB/UNIRAD',
    aliases: ['unilab', 'unirad', 'unidade diagnóstica'],
    padrao_cabecalho: /unilab|unirad/i,
    padrao_paciente: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s+\d+\s+ano/i,
    padrao_data: /(\d{2}\/\d{2}\/\d{4})/,
    padrao_exame: /^([A-Za-záéíóúâêîôûãõç\s]+)[\s:]+(.+)/gm,
    mapeamento_exames: {},
    referencias_padrao: {}
  },
  instituto_patologia: {
    id: 'instituto_patologia',
    nome: 'Instituto de Patologia',
    aliases: ['instituto de patologia', 'patologia'],
    padrao_cabecalho: /instituto\s+de\s+patologia/i,
    padrao_paciente: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
    padrao_data: /data[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    padrao_exame: /diagnóstico[:\s]+([^.]+\.)/gi,
    mapeamento_exames: {},
    referencias_padrao: {}
  },
  dal_pont: {
    id: 'dal_pont',
    nome: 'Laboratório Dal Pont',
    aliases: ['dal pont', 'lab dal pont'],
    padrao_cabecalho: /dal\s*pont/i,
    padrao_paciente: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
    padrao_data: /(\d{2}\/\d{2}\/\d{4})/,
    padrao_exame: /^([A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)/gm,
    mapeamento_exames: {},
    referencias_padrao: {}
  },
  unimed_poa: {
    id: 'unimed_poa',
    nome: 'Unimed Porto Alegre',
    aliases: ['unimed', 'unimed poa'],
    padrao_cabecalho: /unimed/i,
    padrao_paciente: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
    padrao_data: /(\d{2}\/\d{2}\/\d{4})/,
    padrao_exame: /^([A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)/gm,
    mapeamento_exames: {},
    referencias_padrao: {}
  }
};

/**
 * Mapeamento genérico de nomes de exames
 */
const MAPEAMENTO_EXAMES_GENERICO: Record<string, string> = {
  'AST': 'TGO/AST',
  'ALT': 'TGP/ALT',
  'GGT': 'GAMA GT',
  'GAMMA GT': 'GAMA GT',
  'HB': 'HEMOGLOBINA',
  'HT': 'HEMATÓCRITO',
  'HBA1C': 'HEMOGLOBINA GLICADA',
  'GLICEMIA': 'GLICOSE',
  'NA': 'SÓDIO',
  'K': 'POTÁSSIO',
  'CA': 'CÁLCIO',
  'MG': 'MAGNÉSIO',
  'P': 'FÓSFORO',
  'CL': 'CLORO',
  'BT': 'BILIRRUBINA TOTAL',
  'BD': 'BILIRRUBINA DIRETA',
  'BI': 'BILIRRUBINA INDIRETA',
  'CT': 'COLESTEROL TOTAL',
  'TG': 'TRIGLICERÍDEOS',
  'HDL': 'COLESTEROL HDL',
  'LDL': 'COLESTEROL LDL',
  'VLDL': 'COLESTEROL VLDL',
  'TP': 'TEMPO DE PROTROMBINA',
  'TTPA': 'TEMPO DE TROMBOPLASTINA',
  'VHS': 'VHS',
  'PCR': 'PCR',
  'TSH': 'TSH',
  'T4L': 'T4 LIVRE',
  'T3L': 'T3 LIVRE'
};

/**
 * Valores de referência genéricos
 */
const REFERENCIAS_GENERICAS: Record<string, { min?: number; max?: number; unidade: string }> = {
  'GLICOSE': { max: 99, unidade: 'mg/dL' },
  'HEMOGLOBINA GLICADA': { max: 5.7, unidade: '%' },
  'CREATININA': { min: 0.7, max: 1.3, unidade: 'mg/dL' },
  'UREIA': { min: 10, max: 50, unidade: 'mg/dL' },
  'TGO/AST': { max: 40, unidade: 'U/L' },
  'TGP/ALT': { max: 41, unidade: 'U/L' },
  'GAMA GT': { min: 12, max: 73, unidade: 'U/L' },
  'FOSFATASE ALCALINA': { min: 40, max: 129, unidade: 'U/L' },
  'BILIRRUBINA TOTAL': { min: 0.2, max: 1.1, unidade: 'mg/dL' },
  'COLESTEROL TOTAL': { max: 190, unidade: 'mg/dL' },
  'COLESTEROL HDL': { min: 40, unidade: 'mg/dL' },
  'COLESTEROL LDL': { max: 130, unidade: 'mg/dL' },
  'TRIGLICERÍDEOS': { max: 150, unidade: 'mg/dL' },
  'SÓDIO': { min: 136, max: 145, unidade: 'mEq/L' },
  'POTÁSSIO': { min: 3.5, max: 5.1, unidade: 'mEq/L' },
  'TSH': { min: 0.4, max: 4.0, unidade: 'µUI/mL' },
  'T4 LIVRE': { min: 0.8, max: 1.8, unidade: 'ng/dL' },
  'FERRITINA': { min: 30, max: 300, unidade: 'ng/mL' },
  'PCR ULTRASSENSÍVEL': { max: 0.3, unidade: 'mg/dL' }
};

// ============================================================================
// SEÇÃO 3: CLASSE PRINCIPAL - ExtratorExames
// ============================================================================

/**
 * Classe principal para extração de exames de PDFs
 */
export class ExtratorExames {
  private indicePacientes: Map<string, IndicePaciente>;
  private estatisticasLabs: Map<string, { processados: number; tempo_total: number; sucesso: number }>;
  private opcoes: {
    tamanho_amostra_filtro: number;
    max_paginas_documento: number;
    agrupar_por_laboratorio: boolean;
    agrupar_por_tipo: boolean;
    ordenar_por_prioridade: boolean;
  };

  constructor(opcoes?: Partial<ExtratorExames['opcoes']>) {
    this.indicePacientes = new Map();
    this.estatisticasLabs = new Map();
    this.opcoes = {
      tamanho_amostra_filtro: 1000,
      max_paginas_documento: 50,
      agrupar_por_laboratorio: true,
      agrupar_por_tipo: true,
      ordenar_por_prioridade: true,
      ...opcoes
    };
  }

  // ==========================================================================
  // MÉTODO PRINCIPAL: Processar lote de PDFs
  // ==========================================================================

  /**
   * Processa um lote de documentos PDF e extrai os exames
   * 
   * @param documentos Lista de documentos PDF para processar
   * @returns Resultado do processamento com exames extraídos e estatísticas
   */
  async processarLote(documentos: DocumentoPDF[]): Promise<ResultadoProcessamento> {
    const inicio = Date.now();
    
    const resultado: ResultadoProcessamento = {
      exames: [],
      estatisticas: {
        total_arquivos: documentos.length,
        arquivos_processados: 0,
        arquivos_ignorados: 0,
        total_exames: 0,
        tempo_total_ms: 0,
        exames_por_minuto: 0
      },
      erros: [],
      ignorados: []
    };

    console.log(`\n${'='.repeat(70)}`);
    console.log(`GORGEN EXAM EXTRACTOR - Iniciando processamento`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total de arquivos: ${documentos.length}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(70)}\n`);

    // ========================================================================
    // FASE 1: FILTRO RÁPIDO
    // ========================================================================
    console.log(`[FASE 1] Filtro rápido de documentos...`);
    
    const { processar, ignorar, revisar } = this.filtroRapidoLote(documentos);
    
    console.log(`  ✓ Para processar: ${processar.length}`);
    console.log(`  ✗ Ignorados: ${ignorar.length}`);
    console.log(`  ? Para revisão: ${revisar.length}`);

    // Registrar ignorados
    for (const item of ignorar) {
      resultado.ignorados.push(item);
      resultado.estatisticas.arquivos_ignorados++;
    }

    // Adicionar revisão aos processáveis
    const documentosParaProcessar = [...processar, ...revisar];

    // ========================================================================
    // FASE 2: CLASSIFICAÇÃO
    // ========================================================================
    console.log(`\n[FASE 2] Classificando ${documentosParaProcessar.length} documentos...`);
    
    const classificados = this.classificarDocumentos(documentosParaProcessar);
    
    for (const [tipo, docs] of Object.entries(classificados)) {
      if (docs.length > 0) {
        console.log(`  ${tipo}: ${docs.length} documento(s)`);
      }
    }

    // ========================================================================
    // FASE 3: AGRUPAMENTO
    // ========================================================================
    console.log(`\n[FASE 3] Agrupando documentos por laboratório e tipo...`);
    
    const grupos = this.agruparDocumentos(classificados);
    console.log(`  Total de grupos: ${grupos.length}`);

    // ========================================================================
    // FASE 4: PROCESSAMENTO
    // ========================================================================
    console.log(`\n[FASE 4] Processando grupos...`);
    
    for (const grupo of grupos) {
      console.log(`\n  Grupo: ${grupo.laboratorio} - ${grupo.tipo} (${grupo.documentos.length} docs)`);
      
      for (const doc of grupo.documentos) {
        try {
          const exames = await this.extrairExamesDocumento(doc, grupo.laboratorio, grupo.tipo);
          resultado.exames.push(...exames);
          resultado.estatisticas.arquivos_processados++;
          resultado.estatisticas.total_exames += exames.length;
          
          console.log(`    ✓ ${doc.nome_arquivo}: ${exames.length} exames`);
        } catch (erro) {
          resultado.erros.push({
            arquivo: doc.nome_arquivo,
            erro: erro instanceof Error ? erro.message : 'Erro desconhecido'
          });
          console.log(`    ✗ ${doc.nome_arquivo}: ERRO - ${erro}`);
        }
      }
    }

    // ========================================================================
    // FASE 5: CONSOLIDAÇÃO
    // ========================================================================
    console.log(`\n[FASE 5] Consolidando resultados...`);
    
    resultado.exames = this.consolidarExames(resultado.exames);
    
    // Calcular estatísticas finais
    resultado.estatisticas.tempo_total_ms = Date.now() - inicio;
    resultado.estatisticas.exames_por_minuto = 
      resultado.estatisticas.total_exames / (resultado.estatisticas.tempo_total_ms / 60000);

    // ========================================================================
    // RESUMO FINAL
    // ========================================================================
    console.log(`\n${'='.repeat(70)}`);
    console.log(`PROCESSAMENTO CONCLUÍDO`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Arquivos processados: ${resultado.estatisticas.arquivos_processados}/${resultado.estatisticas.total_arquivos}`);
    console.log(`Arquivos ignorados: ${resultado.estatisticas.arquivos_ignorados}`);
    console.log(`Total de exames: ${resultado.estatisticas.total_exames}`);
    console.log(`Tempo total: ${(resultado.estatisticas.tempo_total_ms / 1000).toFixed(2)}s`);
    console.log(`Velocidade: ${resultado.estatisticas.exames_por_minuto.toFixed(1)} exames/min`);
    console.log(`${'='.repeat(70)}\n`);

    return resultado;
  }

  // ==========================================================================
  // FASE 1: FILTRO RÁPIDO
  // ==========================================================================

  /**
   * Aplica filtro rápido em um lote de documentos
   * Analisa apenas os primeiros N caracteres para decidir rapidamente
   */
  private filtroRapidoLote(documentos: DocumentoPDF[]): {
    processar: DocumentoPDF[];
    ignorar: Array<{ arquivo: string; motivo: string }>;
    revisar: DocumentoPDF[];
  } {
    const processar: DocumentoPDF[] = [];
    const ignorar: Array<{ arquivo: string; motivo: string }> = [];
    const revisar: DocumentoPDF[] = [];

    for (const doc of documentos) {
      const resultado = this.filtroRapido(doc);
      
      switch (resultado.decisao) {
        case DecisaoFiltro.PROCESSAR:
          processar.push(doc);
          break;
        case DecisaoFiltro.IGNORAR:
          ignorar.push({ arquivo: doc.nome_arquivo, motivo: resultado.motivo });
          break;
        case DecisaoFiltro.REVISAR:
          revisar.push(doc);
          break;
      }
    }

    return { processar, ignorar, revisar };
  }

  /**
   * Aplica filtro rápido em um único documento
   */
  private filtroRapido(doc: DocumentoPDF): { decisao: DecisaoFiltro; motivo: string } {
    // Amostra do texto (primeiros N caracteres)
    const amostra = doc.conteudo_texto.substring(0, this.opcoes.tamanho_amostra_filtro).toLowerCase();
    const nomeArquivo = doc.nome_arquivo.toLowerCase();

    // 1. Verificar padrões de exclusão
    for (const [categoria, config] of Object.entries(PADROES_EXCLUSAO)) {
      for (const padrao of config.padroes) {
        if (padrao.test(amostra) || padrao.test(nomeArquivo)) {
          return { decisao: DecisaoFiltro.IGNORAR, motivo: config.motivo };
        }
      }
    }

    // 2. Verificar padrões de inclusão (exames)
    let pontuacaoExame = 0;
    for (const [tipo, config] of Object.entries(PADROES_TIPO_EXAME)) {
      for (const padrao of config.padroes) {
        if (padrao.test(amostra)) {
          pontuacaoExame += config.peso;
        }
      }
    }

    // 3. Decidir baseado na pontuação
    if (pontuacaoExame >= 2) {
      return { decisao: DecisaoFiltro.PROCESSAR, motivo: 'Padrões de exame detectados' };
    }

    // 4. Verificar nome do arquivo
    if (/^\d{8,12}\.pdf$/i.test(doc.nome_arquivo)) {
      return { decisao: DecisaoFiltro.PROCESSAR, motivo: 'Nome segue padrão de laboratório' };
    }

    if (/exame|resultado|laudo/i.test(nomeArquivo)) {
      return { decisao: DecisaoFiltro.PROCESSAR, motivo: 'Nome sugere exame' };
    }

    // 5. Caso incerto
    return { decisao: DecisaoFiltro.REVISAR, motivo: 'Requer análise adicional' };
  }

  // ==========================================================================
  // FASE 2: CLASSIFICAÇÃO
  // ==========================================================================

  /**
   * Classifica documentos por tipo
   */
  private classificarDocumentos(documentos: DocumentoPDF[]): Record<TipoDocumento, DocumentoPDF[]> {
    const classificados: Record<TipoDocumento, DocumentoPDF[]> = {
      [TipoDocumento.LABORATORIAL]: [],
      [TipoDocumento.IMAGEM]: [],
      [TipoDocumento.ANATOMOPATOLOGICO]: [],
      [TipoDocumento.LAUDO_EVOLUTIVO]: [],
      [TipoDocumento.SOLICITACAO]: [],
      [TipoDocumento.RECEITA]: [],
      [TipoDocumento.EXTRATO]: [],
      [TipoDocumento.GUIA]: [],
      [TipoDocumento.ATESTADO]: [],
      [TipoDocumento.DESCONHECIDO]: []
    };

    for (const doc of documentos) {
      const tipo = this.classificarDocumento(doc);
      classificados[tipo].push(doc);
    }

    return classificados;
  }

  /**
   * Classifica um único documento
   */
  private classificarDocumento(doc: DocumentoPDF): TipoDocumento {
    const texto = doc.conteudo_texto.toLowerCase();
    const pontuacoes: Record<TipoDocumento, number> = {} as any;

    // Calcular pontuação para cada tipo
    for (const [tipo, config] of Object.entries(PADROES_TIPO_EXAME)) {
      let pontuacao = 0;
      for (const padrao of config.padroes) {
        if (padrao.test(texto)) {
          pontuacao += config.peso;
        }
      }
      pontuacoes[tipo as TipoDocumento] = pontuacao;
    }

    // Encontrar tipo com maior pontuação
    let melhorTipo = TipoDocumento.DESCONHECIDO;
    let melhorPontuacao = 0;

    for (const [tipo, pontuacao] of Object.entries(pontuacoes)) {
      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao;
        melhorTipo = tipo as TipoDocumento;
      }
    }

    return melhorTipo;
  }

  // ==========================================================================
  // FASE 3: AGRUPAMENTO
  // ==========================================================================

  /**
   * Agrupa documentos por laboratório e tipo para processamento otimizado
   */
  private agruparDocumentos(classificados: Record<TipoDocumento, DocumentoPDF[]>): Array<{
    laboratorio: string;
    tipo: TipoDocumento;
    documentos: DocumentoPDF[];
    prioridade: number;
  }> {
    const grupos: Map<string, {
      laboratorio: string;
      tipo: TipoDocumento;
      documentos: DocumentoPDF[];
      prioridade: number;
    }> = new Map();

    // Prioridades por tipo
    const prioridades: Record<TipoDocumento, number> = {
      [TipoDocumento.LAUDO_EVOLUTIVO]: 1,
      [TipoDocumento.LABORATORIAL]: 2,
      [TipoDocumento.ANATOMOPATOLOGICO]: 2,
      [TipoDocumento.IMAGEM]: 3,
      [TipoDocumento.DESCONHECIDO]: 4,
      [TipoDocumento.SOLICITACAO]: 5,
      [TipoDocumento.RECEITA]: 5,
      [TipoDocumento.EXTRATO]: 5,
      [TipoDocumento.GUIA]: 5,
      [TipoDocumento.ATESTADO]: 5
    };

    // Tipos processáveis
    const tiposProcessaveis = [
      TipoDocumento.LABORATORIAL,
      TipoDocumento.IMAGEM,
      TipoDocumento.ANATOMOPATOLOGICO,
      TipoDocumento.LAUDO_EVOLUTIVO,
      TipoDocumento.DESCONHECIDO
    ];

    for (const tipo of tiposProcessaveis) {
      for (const doc of classificados[tipo]) {
        const laboratorio = this.detectarLaboratorio(doc.conteudo_texto);
        const chave = `${laboratorio}:${tipo}`;

        if (!grupos.has(chave)) {
          grupos.set(chave, {
            laboratorio,
            tipo,
            documentos: [],
            prioridade: prioridades[tipo]
          });
        }

        grupos.get(chave)!.documentos.push(doc);
      }
    }

    // Ordenar por prioridade
    return Array.from(grupos.values()).sort((a, b) => a.prioridade - b.prioridade);
  }

  /**
   * Detecta o laboratório baseado no texto do documento
   */
  private detectarLaboratorio(texto: string): string {
    const textoLower = texto.toLowerCase();

    for (const [id, lab] of Object.entries(LABORATORIOS)) {
      for (const alias of lab.aliases) {
        if (textoLower.includes(alias)) {
          return id;
        }
      }
    }

    return 'desconhecido';
  }

  // ==========================================================================
  // FASE 4: EXTRAÇÃO
  // ==========================================================================

  /**
   * Extrai exames de um documento
   */
  private async extrairExamesDocumento(
    doc: DocumentoPDF,
    laboratorio: string,
    tipo: TipoDocumento
  ): Promise<ExameExtraido[]> {
    const formatoLab = LABORATORIOS[laboratorio];
    
    // Extrair informações básicas
    const paciente = this.extrairNomePaciente(doc.conteudo_texto, formatoLab);
    const data = this.extrairData(doc.conteudo_texto, formatoLab);
    const nomeLab = formatoLab?.nome || 'Laboratório Desconhecido';

    // Processar baseado no tipo
    switch (tipo) {
      case TipoDocumento.LABORATORIAL:
        return this.extrairExamesLaboratoriais(doc.conteudo_texto, paciente, data, nomeLab, doc.nome_arquivo, formatoLab);
      
      case TipoDocumento.IMAGEM:
        return this.extrairExamesImagem(doc.conteudo_texto, paciente, data, nomeLab, doc.nome_arquivo);
      
      case TipoDocumento.ANATOMOPATOLOGICO:
        return this.extrairExamesAnatomopatologico(doc.conteudo_texto, paciente, data, nomeLab, doc.nome_arquivo);
      
      case TipoDocumento.LAUDO_EVOLUTIVO:
        return this.extrairLaudoEvolutivo(doc.conteudo_texto, paciente, nomeLab, doc.nome_arquivo, formatoLab);
      
      default:
        // Tentar extração genérica
        return this.extrairExamesLaboratoriais(doc.conteudo_texto, paciente, data, nomeLab, doc.nome_arquivo, formatoLab);
    }
  }

  /**
   * Extrai nome do paciente do texto
   */
  private extrairNomePaciente(texto: string, formatoLab?: FormatoLaboratorio): string {
    // Tentar padrão do laboratório
    if (formatoLab) {
      const match = texto.match(formatoLab.padrao_paciente);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    }

    // Padrões genéricos
    const padroes = [
      /(?:cliente|paciente|nome)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{5,})/m
    ];

    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1] && match[1].trim().length > 5) {
        return match[1].trim().toUpperCase();
      }
    }

    return 'PACIENTE DESCONHECIDO';
  }

  /**
   * Extrai data do texto
   */
  private extrairData(texto: string, formatoLab?: FormatoLaboratorio): string {
    // Tentar padrão do laboratório
    if (formatoLab) {
      const match = texto.match(formatoLab.padrao_data);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Padrões genéricos
    const padroes = [
      /(\d{2}\/\d{2}\/\d{4})/,
      /(\d{2}\/\d{2}\/\d{2})/,
      /(\d{4}-\d{2}-\d{2})/
    ];

    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match) {
        return match[1];
      }
    }

    return new Date().toLocaleDateString('pt-BR');
  }

  /**
   * Extrai exames laboratoriais
   */
  private extrairExamesLaboratoriais(
    texto: string,
    paciente: string,
    data: string,
    laboratorio: string,
    arquivo: string,
    formatoLab?: FormatoLaboratorio
  ): ExameExtraido[] {
    const exames: ExameExtraido[] = [];

    // Padrão para extrair exames: NOME: VALOR UNIDADE
    const padrao = /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s,()-]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%³µ]+)?/gm;

    let match;
    while ((match = padrao.exec(texto)) !== null) {
      const nomeOriginal = match[1].trim();
      const resultado = match[2].replace(',', '.');
      const unidade = match[3] || '';

      // Normalizar nome do exame
      const nomeNormalizado = this.normalizarNomeExame(nomeOriginal, formatoLab);

      // Buscar valor de referência
      const referencia = this.buscarReferencia(texto, match.index, nomeNormalizado, formatoLab);

      // Verificar se está alterado
      const alterado = this.verificarAlterado(parseFloat(resultado), referencia, nomeNormalizado, formatoLab);

      exames.push({
        paciente,
        nome_exame: nomeNormalizado,
        resultado,
        unidade,
        valor_referencia: referencia,
        data_coleta: data,
        laboratorio,
        alterado,
        arquivo_origem: arquivo
      });
    }

    return exames;
  }

  /**
   * Extrai exames de imagem
   */
  private extrairExamesImagem(
    texto: string,
    paciente: string,
    data: string,
    laboratorio: string,
    arquivo: string
  ): ExameExtraido[] {
    const exames: ExameExtraido[] = [];

    // Identificar tipo de exame de imagem
    const tiposImagem = [
      { padrao: /ultrassonografia|ecografia|usg/i, nome: 'USG' },
      { padrao: /tomografia|tc\s/i, nome: 'TOMOGRAFIA' },
      { padrao: /ressonância|rm\s/i, nome: 'RESSONÂNCIA' },
      { padrao: /ecocardiograma/i, nome: 'ECOCARDIOGRAMA' },
      { padrao: /elastografia/i, nome: 'ELASTOGRAFIA' },
      { padrao: /radiografia|raio-?x/i, nome: 'RADIOGRAFIA' }
    ];

    let tipoExame = 'IMAGEM';
    for (const { padrao, nome } of tiposImagem) {
      if (padrao.test(texto)) {
        tipoExame = nome;
        break;
      }
    }

    // Identificar regiões anatômicas
    const regioes = [
      { padrao: /abdome|abdominal/i, regiao: 'ABDOME' },
      { padrao: /fígado|hepático/i, regiao: 'FÍGADO' },
      { padrao: /rins|renal/i, regiao: 'RINS' },
      { padrao: /tireóide|tireoide/i, regiao: 'TIREOIDE' },
      { padrao: /mama|mamário/i, regiao: 'MAMA' },
      { padrao: /próstata|prostático/i, regiao: 'PRÓSTATA' },
      { padrao: /coração|cardíaco/i, regiao: 'CORAÇÃO' }
    ];

    for (const { padrao, regiao } of regioes) {
      if (padrao.test(texto)) {
        // Extrair conclusão para esta região
        const conclusaoMatch = texto.match(new RegExp(`${regiao}[^.]*\\.`, 'i'));
        const conclusao = conclusaoMatch ? conclusaoMatch[0] : 'Ver laudo completo';

        // Verificar se há alterações
        const alterado = /alterado|anormal|aumentado|diminuído|nódulo|cisto|massa|lesão/i.test(texto);

        exames.push({
          paciente,
          nome_exame: `${tipoExame} ${regiao}`,
          resultado: conclusao,
          unidade: '',
          valor_referencia: '',
          data_coleta: data,
          laboratorio,
          alterado,
          arquivo_origem: arquivo
        });
      }
    }

    // Se não encontrou regiões específicas, criar entrada genérica
    if (exames.length === 0) {
      const impressaoMatch = texto.match(/impressão\s+diagnóstica[:\s]+([^.]+\.)/i) ||
                             texto.match(/conclusão[:\s]+([^.]+\.)/i);
      
      exames.push({
        paciente,
        nome_exame: tipoExame,
        resultado: impressaoMatch ? impressaoMatch[1] : 'Ver laudo completo',
        unidade: '',
        valor_referencia: '',
        data_coleta: data,
        laboratorio,
        alterado: false,
        arquivo_origem: arquivo
      });
    }

    return exames;
  }

  /**
   * Extrai exames anatomopatológicos
   */
  private extrairExamesAnatomopatologico(
    texto: string,
    paciente: string,
    data: string,
    laboratorio: string,
    arquivo: string
  ): ExameExtraido[] {
    const exames: ExameExtraido[] = [];

    // Extrair espécime
    const especimeMatch = texto.match(/espécime[:\s]+([^.]+\.)/i);
    if (especimeMatch) {
      exames.push({
        paciente,
        nome_exame: 'ANATOMOPATOLÓGICO - ESPÉCIME',
        resultado: especimeMatch[1].trim(),
        unidade: '',
        valor_referencia: '',
        data_coleta: data,
        laboratorio,
        alterado: false,
        arquivo_origem: arquivo
      });
    }

    // Extrair diagnóstico
    const diagnosticoMatch = texto.match(/diagnóstico[:\s]+([^.]+\.)/i);
    if (diagnosticoMatch) {
      const diagnostico = diagnosticoMatch[1].trim();
      const alterado = /maligno|carcinoma|neoplasia|displasia|metástase/i.test(diagnostico);

      exames.push({
        paciente,
        nome_exame: 'ANATOMOPATOLÓGICO - DIAGNÓSTICO',
        resultado: diagnostico,
        unidade: '',
        valor_referencia: '',
        data_coleta: data,
        laboratorio,
        alterado,
        arquivo_origem: arquivo
      });
    }

    // Extrair margens cirúrgicas
    const margensMatch = texto.match(/margens?\s+(cirúrgicas?)?[:\s]+([^.]+\.)/i);
    if (margensMatch) {
      const margens = margensMatch[2].trim();
      const alterado = /comprometid|positiv|invadid/i.test(margens);

      exames.push({
        paciente,
        nome_exame: 'ANATOMOPATOLÓGICO - MARGENS',
        resultado: margens,
        unidade: '',
        valor_referencia: '',
        data_coleta: data,
        laboratorio,
        alterado,
        arquivo_origem: arquivo
      });
    }

    return exames;
  }

  /**
   * Extrai dados de laudo evolutivo (tabela com múltiplas datas)
   */
  private extrairLaudoEvolutivo(
    texto: string,
    paciente: string,
    laboratorio: string,
    arquivo: string,
    formatoLab?: FormatoLaboratorio
  ): ExameExtraido[] {
    const exames: ExameExtraido[] = [];

    // Extrair todas as datas do documento
    const datasMatch = texto.match(/\d{2}\/\d{2}\/\d{2,4}/g);
    const datas: string[] = Array.from(new Set(datasMatch || []));

    if (datas.length < 2) {
      // Não é laudo evolutivo, processar como laboratorial normal
      return this.extrairExamesLaboratoriais(
        texto, paciente, datas[0] || new Date().toLocaleDateString('pt-BR'),
        laboratorio, arquivo, formatoLab
      );
    }

    // Processar linhas da tabela evolutiva
    const linhas = texto.split('\n');
    
    for (const linha of linhas) {
      // Verificar se é linha de exame (começa com nome e tem números)
      const exameMatch = linha.match(/^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)\s+([\d.,\s-]+)/);
      
      if (exameMatch) {
        const nomeOriginal = exameMatch[1].trim();
        const valores = exameMatch[2].trim().split(/\s+/);
        const nomeNormalizado = this.normalizarNomeExame(nomeOriginal, formatoLab);

        // Associar valores com datas
        for (let i = 0; i < Math.min(valores.length, datas.length); i++) {
          const valor = valores[i];
          
          // Ignorar valores vazios ou marcadores
          if (!valor || valor === '-' || valor === '--' || valor === '---') {
            continue;
          }

          const resultado = valor.replace(',', '.');
          const referencia = this.buscarReferenciaGenerica(nomeNormalizado, formatoLab);
          const alterado = this.verificarAlterado(parseFloat(resultado), referencia, nomeNormalizado, formatoLab);

          exames.push({
            paciente,
            nome_exame: nomeNormalizado,
            resultado,
            unidade: '',
            valor_referencia: referencia,
            data_coleta: datas[i],
            laboratorio,
            alterado,
            arquivo_origem: arquivo,
            observacoes: 'Extraído de laudo evolutivo'
          });
        }
      }
    }

    return exames;
  }

  // ==========================================================================
  // FUNÇÕES AUXILIARES
  // ==========================================================================

  /**
   * Normaliza nome de exame usando mapeamentos
   */
  private normalizarNomeExame(nome: string, formatoLab?: FormatoLaboratorio): string {
    const nomeUpper = nome.toUpperCase().trim();

    // Primeiro, tentar mapeamento do laboratório
    if (formatoLab?.mapeamento_exames[nomeUpper]) {
      return formatoLab.mapeamento_exames[nomeUpper];
    }

    // Segundo, tentar mapeamento genérico
    if (MAPEAMENTO_EXAMES_GENERICO[nomeUpper]) {
      return MAPEAMENTO_EXAMES_GENERICO[nomeUpper];
    }

    // Remover parênteses e conteúdo
    const semParenteses = nomeUpper.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    if (MAPEAMENTO_EXAMES_GENERICO[semParenteses]) {
      return MAPEAMENTO_EXAMES_GENERICO[semParenteses];
    }

    return nomeUpper;
  }

  /**
   * Busca valor de referência no texto próximo
   */
  private buscarReferencia(
    texto: string,
    posicao: number,
    nomeExame: string,
    formatoLab?: FormatoLaboratorio
  ): string {
    // Buscar no texto próximo
    const textoProximo = texto.substring(posicao, posicao + 300);
    const refMatch = textoProximo.match(/(?:ref|referência|vr)[.:\s]+([^\n]+)/i);
    
    if (refMatch) {
      return refMatch[1].trim();
    }

    // Usar referência genérica
    return this.buscarReferenciaGenerica(nomeExame, formatoLab);
  }

  /**
   * Busca referência genérica para um exame
   */
  private buscarReferenciaGenerica(nomeExame: string, formatoLab?: FormatoLaboratorio): string {
    // Tentar referência do laboratório
    if (formatoLab?.referencias_padrao[nomeExame]) {
      const ref = formatoLab.referencias_padrao[nomeExame];
      return this.formatarReferencia(ref);
    }

    // Tentar referência genérica
    if (REFERENCIAS_GENERICAS[nomeExame]) {
      const ref = REFERENCIAS_GENERICAS[nomeExame];
      return this.formatarReferencia(ref);
    }

    return '';
  }

  /**
   * Formata objeto de referência para string
   */
  private formatarReferencia(ref: { min?: number; max?: number; unidade: string }): string {
    if (ref.min !== undefined && ref.max !== undefined) {
      return `${ref.min} - ${ref.max} ${ref.unidade}`;
    } else if (ref.max !== undefined) {
      return `< ${ref.max} ${ref.unidade}`;
    } else if (ref.min !== undefined) {
      return `> ${ref.min} ${ref.unidade}`;
    }
    return '';
  }

  /**
   * Verifica se valor está alterado
   */
  private verificarAlterado(
    valor: number,
    referencia: string,
    nomeExame: string,
    formatoLab?: FormatoLaboratorio
  ): boolean {
    if (isNaN(valor)) return false;

    // Tentar parsear referência do texto
    const rangeMatch = referencia.match(/(\d+[.,]?\d*)\s*[-a]\s*(\d+[.,]?\d*)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1].replace(',', '.'));
      const max = parseFloat(rangeMatch[2].replace(',', '.'));
      return valor < min || valor > max;
    }

    const menorQueMatch = referencia.match(/<\s*(\d+[.,]?\d*)/);
    if (menorQueMatch) {
      const max = parseFloat(menorQueMatch[1].replace(',', '.'));
      return valor >= max;
    }

    const maiorQueMatch = referencia.match(/>\s*(\d+[.,]?\d*)/);
    if (maiorQueMatch) {
      const min = parseFloat(maiorQueMatch[1].replace(',', '.'));
      return valor <= min;
    }

    // Tentar usar referência do laboratório ou genérica
    const ref = formatoLab?.referencias_padrao[nomeExame] || REFERENCIAS_GENERICAS[nomeExame];
    if (ref) {
      if (ref.min !== undefined && valor < ref.min) return true;
      if (ref.max !== undefined && valor > ref.max) return true;
    }

    return false;
  }

  // ==========================================================================
  // FASE 5: CONSOLIDAÇÃO
  // ==========================================================================

  /**
   * Consolida exames, removendo duplicatas e atualizando índice de pacientes
   */
  private consolidarExames(exames: ExameExtraido[]): ExameExtraido[] {
    // Remover duplicatas exatas
    const unicos = new Map<string, ExameExtraido>();
    
    for (const exame of exames) {
      const chave = `${exame.paciente}|${exame.nome_exame}|${exame.data_coleta}|${exame.resultado}`;
      if (!unicos.has(chave)) {
        unicos.set(chave, exame);
      }
    }

    // Atualizar índice de pacientes
    Array.from(unicos.values()).forEach((exame: ExameExtraido) => {
      this.atualizarIndicePaciente(exame);
    });

    return Array.from(unicos.values());
  }

  /**
   * Atualiza índice de pacientes
   */
  private atualizarIndicePaciente(exame: ExameExtraido): void {
    const paciente = exame.paciente;
    
    if (!this.indicePacientes.has(paciente)) {
      this.indicePacientes.set(paciente, {
        nome: paciente,
        arquivo_tabela: `${paciente.replace(/\s+/g, '_')}.csv`,
        datas: [],
        ultima_atualizacao: new Date()
      });
    }

    const indice = this.indicePacientes.get(paciente)!;
    if (!indice.datas.includes(exame.data_coleta)) {
      indice.datas.push(exame.data_coleta);
    }
    indice.ultima_atualizacao = new Date();
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS AUXILIARES
  // ==========================================================================

  /**
   * Obtém índice de pacientes
   */
  getIndicePacientes(): Map<string, IndicePaciente> {
    return this.indicePacientes;
  }

  /**
   * Gera tabela CSV pivotada (exames nas linhas, datas nas colunas)
   */
  gerarTabelaPivotada(exames: ExameExtraido[], paciente?: string): string {
    // Filtrar por paciente se especificado
    const examesFiltrados = paciente 
      ? exames.filter(e => e.paciente === paciente)
      : exames;

    // Agrupar por paciente
    const porPaciente = new Map<string, ExameExtraido[]>();
    for (const exame of examesFiltrados) {
      if (!porPaciente.has(exame.paciente)) {
        porPaciente.set(exame.paciente, []);
      }
      porPaciente.get(exame.paciente)!.push(exame);
    }

    let csv = '';

    porPaciente.forEach((examesPaciente, nomePaciente) => {
      // Obter datas únicas ordenadas
      const datasSet = new Set<string>();
      examesPaciente.forEach((e: ExameExtraido) => datasSet.add(e.data_coleta));
      const datas: string[] = Array.from(datasSet).sort();
      
      // Obter exames únicos
      const nomesSet = new Set<string>();
      examesPaciente.forEach((e: ExameExtraido) => nomesSet.add(e.nome_exame));
      const nomesExames: string[] = Array.from(nomesSet).sort();

      // Cabeçalho
      csv += `\n# PACIENTE: ${nomePaciente}\n`;
      csv += `EXAME,${datas.join(',')}\n`;

      // Linhas de exames
      for (const nomeExame of nomesExames) {
        const valores = datas.map((data: string) => {
          const exame = examesPaciente.find((e: ExameExtraido) => e.nome_exame === nomeExame && e.data_coleta === data);
          if (exame) {
            return exame.alterado ? `${exame.resultado}*` : exame.resultado;
          }
          return '-';
        });
        csv += `${nomeExame},${valores.join(',')}\n`;
      }
    });

    return csv;
  }

  /**
   * Gera relatório de processamento
   */
  gerarRelatorio(resultado: ResultadoProcessamento): string {
    let relatorio = `
================================================================================
RELATÓRIO DE PROCESSAMENTO DE EXAMES - GORGEN SYSTEM
================================================================================
Data: ${new Date().toLocaleString('pt-BR')}

ESTATÍSTICAS GERAIS
-------------------
Total de arquivos: ${resultado.estatisticas.total_arquivos}
Arquivos processados: ${resultado.estatisticas.arquivos_processados}
Arquivos ignorados: ${resultado.estatisticas.arquivos_ignorados}
Total de exames extraídos: ${resultado.estatisticas.total_exames}
Tempo de processamento: ${(resultado.estatisticas.tempo_total_ms / 1000).toFixed(2)} segundos
Velocidade: ${resultado.estatisticas.exames_por_minuto.toFixed(1)} exames/minuto

`;

    if (resultado.ignorados.length > 0) {
      relatorio += `\nARQUIVOS IGNORADOS (${resultado.ignorados.length})\n`;
      relatorio += '-'.repeat(40) + '\n';
      for (const item of resultado.ignorados) {
        relatorio += `- ${item.arquivo}: ${item.motivo}\n`;
      }
    }

    if (resultado.erros.length > 0) {
      relatorio += `\nERROS (${resultado.erros.length})\n`;
      relatorio += '-'.repeat(40) + '\n';
      for (const item of resultado.erros) {
        relatorio += `- ${item.arquivo}: ${item.erro}\n`;
      }
    }

    // Estatísticas por paciente
    const porPaciente = new Map<string, number>();
    for (const exame of resultado.exames) {
      porPaciente.set(exame.paciente, (porPaciente.get(exame.paciente) || 0) + 1);
    }

    relatorio += `\nEXAMES POR PACIENTE\n`;
    relatorio += '-'.repeat(40) + '\n';
    porPaciente.forEach((count, paciente) => {
      relatorio += `- ${paciente}: ${count} exames\n`;
    });

    // Exames alterados
    const alterados = resultado.exames.filter(e => e.alterado);
    if (alterados.length > 0) {
      relatorio += `\nEXAMES ALTERADOS (${alterados.length})\n`;
      relatorio += '-'.repeat(40) + '\n';
      for (const exame of alterados) {
        relatorio += `- ${exame.paciente} | ${exame.nome_exame}: ${exame.resultado} (ref: ${exame.valor_referencia})\n`;
      }
    }

    relatorio += '\n' + '='.repeat(80) + '\n';

    return relatorio;
  }
}

// ============================================================================
// SEÇÃO 4: FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Função de conveniência para processar PDFs
 */
export async function processarExamesPDF(
  documentos: DocumentoPDF[],
  opcoes?: Partial<ExtratorExames['opcoes']>
): Promise<ResultadoProcessamento> {
  const extrator = new ExtratorExames(opcoes);
  return extrator.processarLote(documentos);
}

/**
 * Valida se um buffer é um PDF válido
 */
export function validarPDF(buffer: Buffer): boolean {
  // Verificar magic bytes: %PDF-
  return buffer.length >= 5 &&
         buffer[0] === 0x25 && // %
         buffer[1] === 0x50 && // P
         buffer[2] === 0x44 && // D
         buffer[3] === 0x46 && // F
         buffer[4] === 0x2D;   // -
}

/**
 * Verifica se PDF está corrompido
 */
export function verificarPDFCorrompido(buffer: Buffer): boolean {
  const ultimosBytes = buffer.slice(-1024).toString('latin1');
  return !ultimosBytes.includes('%%EOF');
}

// ============================================================================
// EXPORTAÇÃO PADRÃO
// ============================================================================

export default ExtratorExames;
