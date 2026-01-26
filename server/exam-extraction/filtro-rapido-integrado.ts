/**
 * ============================================================================
 * GORGEN - FILTRO RÁPIDO INTEGRADO
 * ============================================================================
 * 
 * Módulo de filtro rápido para pré-processamento de documentos antes da
 * extração via LLM. Economiza ~30-40% de chamadas LLM ao filtrar documentos
 * que não são resultados de exames.
 * 
 * INTEGRAÇÃO COM ROUTERS.TS:
 *   import { filtrarDocumento, classificarDocumento, detectarLaboratorio } 
 *     from './exam-extraction/filtro-rapido-integrado';
 * 
 * @version 2.0.0
 * @date 2026-01-25
 */

// ============================================================================
// TIPOS
// ============================================================================

export type DecisaoFiltro = 'PROCESSAR' | 'IGNORAR' | 'REVISAR';

export type MotivoFiltro = 
  | 'EXAME_DETECTADO'
  | 'LAUDO_EVOLUTIVO'
  | 'RECEITA'
  | 'SOLICITACAO'
  | 'EXTRATO'
  | 'GUIA_SADT'
  | 'ATESTADO'
  | 'DECLARACAO'
  | 'TEXTO_VAZIO'
  | 'TEXTO_CURTO'
  | 'INCERTO';

export type TipoDocumento = 
  | 'LABORATORIAL'
  | 'IMAGEM'
  | 'ANATOMOPATOLOGICO'
  | 'LAUDO_EVOLUTIVO'
  | 'DESCONHECIDO';

export interface ResultadoFiltro {
  decisao: DecisaoFiltro;
  motivo: MotivoFiltro;
  confianca: number; // 0-100
  tempoMs: number;
  detalhes?: string;
}

export interface ResultadoClassificacao {
  tipo: TipoDocumento;
  confianca: number;
  laboratorio: string | null;
  tempoMs: number;
}

export interface ConfigLaboratorio {
  nome: string;
  formato: 'tabular' | 'linear' | 'misto';
  prioridade: 'laudo_evolutivo' | 'fluxograma' | 'resultado';
  padraoData: RegExp;
  padraoExame: RegExp;
}

// ============================================================================
// CACHE DE LABORATÓRIOS
// ============================================================================

const LABORATORIOS: Record<string, ConfigLaboratorio> = {
  'WEINMANN': {
    nome: 'Weinmann Laboratório',
    formato: 'tabular',
    prioridade: 'laudo_evolutivo',
    padraoData: /Data\s+da\s+Ficha:\s*(\d{2}\/\d{2}\/\d{4})/i,
    padraoExame: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+):\s*([\d.,]+)/m
  },
  'IBERLEO': {
    nome: 'Iberleo Laboratório',
    formato: 'linear',
    prioridade: 'resultado',
    padraoData: /Data\s+Coleta:\s*(\d{2}\/\d{2}\/\d{4})/i,
    padraoExame: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s+([\d.,]+)\s+\w+/m
  },
  'UNILAB': {
    nome: 'UNILAB/UNIRAD',
    formato: 'tabular',
    prioridade: 'fluxograma',
    padraoData: /(\d{2}\/\d{2}\/\d{2,4})/,
    padraoExame: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s*[:\-]\s*([\d.,]+)/
  },
  'UNIRAD': {
    nome: 'UNILAB/UNIRAD',
    formato: 'tabular',
    prioridade: 'fluxograma',
    padraoData: /(\d{2}\/\d{2}\/\d{2,4})/,
    padraoExame: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s*[:\-]\s*([\d.,]+)/
  },
  'INSTITUTO DE PATOLOGIA': {
    nome: 'Instituto de Patologia',
    formato: 'linear',
    prioridade: 'resultado',
    padraoData: /Data:\s*(\d{2}\/\d{2}\/\d{4})/i,
    padraoExame: /DIAGNÓSTICO|CONCLUSÃO/i
  },
  'DAL PONT': {
    nome: 'Laboratório Dal Pont',
    formato: 'linear',
    prioridade: 'resultado',
    padraoData: /(\d{2}\/\d{2}\/\d{4})/,
    padraoExame: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+):\s*([\d.,]+)/m
  },
  'UNIMED': {
    nome: 'Unimed POA',
    formato: 'misto',
    prioridade: 'resultado',
    padraoData: /Data:\s*(\d{2}\/\d{2}\/\d{4})/i,
    padraoExame: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s+([\d.,]+)/
  },
  'MOINHOS': {
    nome: 'Hospital Moinhos de Vento',
    formato: 'tabular',
    prioridade: 'resultado',
    padraoData: /(\d{2}\/\d{2}\/\d{4})/,
    padraoExame: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s*:\s*([\d.,]+)/
  },
  'CITOSON': {
    nome: 'Citoson',
    formato: 'linear',
    prioridade: 'resultado',
    padraoData: /Data:\s*(\d{2}\/\d{2}\/\d{4})/i,
    padraoExame: /CONCLUSÃO|IMPRESSÃO/i
  }
};

// ============================================================================
// PADRÕES DE DETECÇÃO
// ============================================================================

// Padrões de NÃO-EXAMES (alta confiança de ignorar)
const PADROES_NAO_EXAME = {
  RECEITA: [
    /RECEITU[AÁ]RIO\s+(ESPECIAL|SIMPLES|M[EÉ]DICO)/i,
    /RECEITA\s+(M[EÉ]DICA|ESPECIAL|SIMPLES)/i,
    /PRESCRIÇÃO\s+M[EÉ]DICA/i,
    /USO\s+(INTERNO|EXTERNO|CONT[IÍ]NUO)/i,
    /POSOLOGIA/i
  ],
  SOLICITACAO: [
    /SOLICITA[CÇ][AÃ]O\s+DE\s+EXAME/i,
    /GUIA\s+SADT/i,
    /AUTORIZA[CÇ][AÃ]O\s+DE\s+PROCEDIMENTO/i,
    /PEDIDO\s+M[EÉ]DICO/i,
    /REQUISI[CÇ][AÃ]O\s+DE\s+EXAME/i
  ],
  EXTRATO: [
    /EXTRATO\s+(DE\s+)?(PAGAMENTO|CONTA)/i,
    /DEMONSTRATIVO\s+DE\s+PAGAMENTO/i,
    /FATURA\s+M[EÉ]DICA/i,
    /NOTA\s+FISCAL/i
  ],
  GUIA_SADT: [
    /GUIA\s+DE\s+SERVI[CÇ]O/i,
    /TISS\s+-\s+GUIA/i,
    /GUIA\s+DE\s+CONSULTA/i
  ],
  ATESTADO: [
    /ATESTADO\s+(M[EÉ]DICO|DE\s+COMPARECIMENTO)/i,
    /DECLARO\s+PARA\s+OS\s+DEVIDOS\s+FINS/i,
    /ATESTO\s+QUE/i
  ],
  DECLARACAO: [
    /DECLARA[CÇ][AÃ]O/i,
    /TERMO\s+DE\s+CONSENTIMENTO/i,
    /TERMO\s+DE\s+RESPONSABILIDADE/i
  ]
};

// Padrões de EXAMES (alta confiança de processar)
const PADROES_EXAME = {
  LABORATORIAL: [
    /LABORAT[OÓ]RIO/i,
    /HEMOGRAMA/i,
    /GLICOSE|GLICEMIA/i,
    /COLESTEROL/i,
    /TRIGLICE?R[IÍ]DEOS/i,
    /CREATININA/i,
    /UR[EÉ]IA/i,
    /TGO|TGP|AST|ALT/i,
    /BILIRRUBINA/i,
    /HEMOGLOBINA\s+GLICADA/i,
    /TSH|T4\s+LIVRE/i,
    /VALORES\s+DE\s+REFER[EÊ]NCIA/i,
    /RESULTADO\s+DO\s+EXAME/i
  ],
  LAUDO_EVOLUTIVO: [
    /LAUDO\s+EVOLUTIVO/i,
    /FLUXOGRAMA/i,
    /HIST[OÓ]RICO\s+DE\s+RESULTADOS/i,
    /EVOLU[CÇ][AÃ]O\s+DOS\s+EXAMES/i
  ],
  IMAGEM: [
    /ULTRASSONOGRAFIA|USG/i,
    /TOMOGRAFIA/i,
    /RESSON[AÂ]NCIA\s+MAGN[EÉ]TICA/i,
    /RAIO[- ]?X|RX/i,
    /ECOCARDIOGRAMA/i,
    /MAMOGRAFIA/i,
    /DENSITOMETRIA/i,
    /CINTILOGRAFIA/i,
    /ENDOSCOPIA/i,
    /COLONOSCOPIA/i
  ],
  ANATOMOPATOLOGICO: [
    /ANATOMOPATOL[OÓ]GICO/i,
    /HISTOPATOL[OÓ]GICO/i,
    /BI[OÓ]PSIA/i,
    /CITOLOGIA/i,
    /CITOPATOL[OÓ]GICO/i,
    /MATERIAL\s+RECEBIDO/i,
    /DIAGN[OÓ]STICO\s+HISTOPATOL[OÓ]GICO/i
  ]
};

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Filtro rápido para determinar se documento deve ser processado.
 * Analisa apenas os primeiros 1000 caracteres para decisão rápida.
 * 
 * @param textoOcr - Texto OCR do documento
 * @param tenantId - ID do tenant (obrigatório para segurança)
 * @returns Resultado do filtro com decisão, motivo e confiança
 */
export function filtrarDocumento(textoOcr: string, tenantId: number): ResultadoFiltro {
  const inicio = Date.now();
  
  // Validação de segurança
  if (!tenantId || tenantId <= 0) {
    return {
      decisao: 'IGNORAR',
      motivo: 'INCERTO',
      confianca: 0,
      tempoMs: Date.now() - inicio,
      detalhes: 'ERRO: tenantId inválido'
    };
  }
  
  // Verificar texto vazio ou muito curto
  if (!textoOcr || textoOcr.trim().length === 0) {
    return {
      decisao: 'IGNORAR',
      motivo: 'TEXTO_VAZIO',
      confianca: 100,
      tempoMs: Date.now() - inicio,
      detalhes: 'Documento sem texto OCR'
    };
  }
  
  if (textoOcr.trim().length < 50) {
    return {
      decisao: 'IGNORAR',
      motivo: 'TEXTO_CURTO',
      confianca: 90,
      tempoMs: Date.now() - inicio,
      detalhes: `Texto muito curto: ${textoOcr.length} caracteres`
    };
  }
  
  // Analisar apenas primeiros 1000 caracteres para performance
  const textoAnalise = textoOcr.substring(0, 1000).toUpperCase();
  
  // 1. Verificar padrões de NÃO-EXAME (prioridade alta)
  for (const [tipo, padroes] of Object.entries(PADROES_NAO_EXAME)) {
    for (const padrao of padroes) {
      if (padrao.test(textoAnalise)) {
        return {
          decisao: 'IGNORAR',
          motivo: tipo as MotivoFiltro,
          confianca: 95,
          tempoMs: Date.now() - inicio,
          detalhes: `Padrão detectado: ${padrao.source}`
        };
      }
    }
  }
  
  // 2. Verificar padrões de LAUDO EVOLUTIVO (prioridade máxima)
  for (const padrao of PADROES_EXAME.LAUDO_EVOLUTIVO) {
    if (padrao.test(textoAnalise)) {
      return {
        decisao: 'PROCESSAR',
        motivo: 'LAUDO_EVOLUTIVO',
        confianca: 98,
        tempoMs: Date.now() - inicio,
        detalhes: 'Laudo evolutivo detectado - prioridade máxima'
      };
    }
  }
  
  // 3. Verificar padrões de EXAME
  for (const padrao of PADROES_EXAME.LABORATORIAL) {
    if (padrao.test(textoAnalise)) {
      return {
        decisao: 'PROCESSAR',
        motivo: 'EXAME_DETECTADO',
        confianca: 90,
        tempoMs: Date.now() - inicio,
        detalhes: `Padrão de exame detectado: ${padrao.source}`
      };
    }
  }
  
  // 4. Verificar padrões de IMAGEM
  for (const padrao of PADROES_EXAME.IMAGEM) {
    if (padrao.test(textoAnalise)) {
      return {
        decisao: 'PROCESSAR',
        motivo: 'EXAME_DETECTADO',
        confianca: 85,
        tempoMs: Date.now() - inicio,
        detalhes: `Exame de imagem detectado: ${padrao.source}`
      };
    }
  }
  
  // 5. Verificar padrões de ANATOMOPATOLÓGICO
  for (const padrao of PADROES_EXAME.ANATOMOPATOLOGICO) {
    if (padrao.test(textoAnalise)) {
      return {
        decisao: 'PROCESSAR',
        motivo: 'EXAME_DETECTADO',
        confianca: 85,
        tempoMs: Date.now() - inicio,
        detalhes: `Exame anatomopatológico detectado: ${padrao.source}`
      };
    }
  }
  
  // 6. Incerto - enviar para análise LLM
  return {
    decisao: 'PROCESSAR',
    motivo: 'INCERTO',
    confianca: 50,
    tempoMs: Date.now() - inicio,
    detalhes: 'Nenhum padrão claro detectado - enviando para LLM'
  };
}

/**
 * Classifica o tipo de documento para otimizar extração.
 * Usa priorização: LAUDO_EVOLUTIVO > LABORATORIAL > ANATOMOPATOLOGICO > IMAGEM
 * 
 * @param textoOcr - Texto OCR do documento
 * @returns Tipo do documento e laboratório detectado
 */
export function classificarDocumento(textoOcr: string): ResultadoClassificacao {
  const inicio = Date.now();
  const textoAnalise = textoOcr.substring(0, 2000).toUpperCase();
  
  // Detectar laboratório primeiro
  const laboratorio = detectarLaboratorio(textoOcr);
  
  // Priorização de classificação (ordem importa!)
  
  // 1. LAUDO EVOLUTIVO (prioridade máxima - contém histórico)
  for (const padrao of PADROES_EXAME.LAUDO_EVOLUTIVO) {
    if (padrao.test(textoAnalise)) {
      return {
        tipo: 'LAUDO_EVOLUTIVO',
        confianca: 95,
        laboratorio,
        tempoMs: Date.now() - inicio
      };
    }
  }
  
  // 2. LABORATORIAL (segunda prioridade)
  let scoreLab = 0;
  for (const padrao of PADROES_EXAME.LABORATORIAL) {
    if (padrao.test(textoAnalise)) scoreLab++;
  }
  
  // 3. ANATOMOPATOLÓGICO (terceira prioridade)
  let scoreAnato = 0;
  for (const padrao of PADROES_EXAME.ANATOMOPATOLOGICO) {
    if (padrao.test(textoAnalise)) scoreAnato++;
  }
  
  // 4. IMAGEM (quarta prioridade)
  let scoreImagem = 0;
  for (const padrao of PADROES_EXAME.IMAGEM) {
    if (padrao.test(textoAnalise)) scoreImagem++;
  }
  
  // Decidir com base nos scores (priorização)
  if (scoreLab >= 2) {
    return {
      tipo: 'LABORATORIAL',
      confianca: Math.min(95, 70 + scoreLab * 5),
      laboratorio,
      tempoMs: Date.now() - inicio
    };
  }
  
  if (scoreAnato >= 1) {
    return {
      tipo: 'ANATOMOPATOLOGICO',
      confianca: Math.min(90, 70 + scoreAnato * 10),
      laboratorio,
      tempoMs: Date.now() - inicio
    };
  }
  
  if (scoreImagem >= 1) {
    return {
      tipo: 'IMAGEM',
      confianca: Math.min(90, 70 + scoreImagem * 10),
      laboratorio,
      tempoMs: Date.now() - inicio
    };
  }
  
  // Se tem laboratório detectado, provavelmente é laboratorial
  if (laboratorio) {
    return {
      tipo: 'LABORATORIAL',
      confianca: 60,
      laboratorio,
      tempoMs: Date.now() - inicio
    };
  }
  
  return {
    tipo: 'DESCONHECIDO',
    confianca: 30,
    laboratorio: null,
    tempoMs: Date.now() - inicio
  };
}

/**
 * Detecta o laboratório a partir do texto OCR.
 * 
 * @param textoOcr - Texto OCR do documento
 * @returns Nome do laboratório ou null
 */
export function detectarLaboratorio(textoOcr: string): string | null {
  const textoAnalise = textoOcr.substring(0, 500).toUpperCase();
  
  for (const [chave, config] of Object.entries(LABORATORIOS)) {
    if (textoAnalise.includes(chave)) {
      return chave;
    }
  }
  
  return null;
}

/**
 * Obtém configuração do laboratório para otimizar extração.
 * 
 * @param laboratorio - Nome do laboratório
 * @returns Configuração ou null
 */
export function getConfigLaboratorio(laboratorio: string | null): ConfigLaboratorio | null {
  if (!laboratorio) return null;
  return LABORATORIOS[laboratorio] || null;
}

/**
 * Verifica se deve usar extração otimizada ou LLM padrão.
 * 
 * @param classificacao - Resultado da classificação
 * @returns true se deve usar extração otimizada
 */
export function deveUsarExtracaoOtimizada(classificacao: ResultadoClassificacao): boolean {
  // Usar extração otimizada se:
  // 1. Laboratório conhecido
  // 2. Tipo bem definido (não DESCONHECIDO)
  // 3. Confiança >= 70%
  return (
    classificacao.laboratorio !== null &&
    classificacao.tipo !== 'DESCONHECIDO' &&
    classificacao.confianca >= 70
  );
}

// ============================================================================
// FUNÇÃO DE INTEGRAÇÃO PRINCIPAL
// ============================================================================

/**
 * Função principal de pré-processamento para integração com routers.ts.
 * Combina filtro rápido + classificação + detecção de laboratório.
 * 
 * USO NO ROUTERS.TS:
 *   const preProcessamento = preProcessarDocumento(textoOcr, tenantId);
 *   if (!preProcessamento.processar) {
 *     return { sucesso: false, motivo: preProcessamento.motivo };
 *   }
 *   // Continuar com invokeLLM...
 * 
 * @param textoOcr - Texto OCR do documento
 * @param tenantId - ID do tenant
 * @returns Resultado completo do pré-processamento
 */
export function preProcessarDocumento(textoOcr: string, tenantId: number): {
  processar: boolean;
  motivo: string;
  tipo: TipoDocumento;
  laboratorio: string | null;
  configLab: ConfigLaboratorio | null;
  usarExtracaoOtimizada: boolean;
  tempoTotalMs: number;
  detalhes: {
    filtro: ResultadoFiltro;
    classificacao: ResultadoClassificacao;
  };
} {
  const inicio = Date.now();
  
  // 1. Filtro rápido
  const filtro = filtrarDocumento(textoOcr, tenantId);
  
  // Se filtro decidiu ignorar, retornar imediatamente
  if (filtro.decisao === 'IGNORAR') {
    return {
      processar: false,
      motivo: filtro.motivo,
      tipo: 'DESCONHECIDO',
      laboratorio: null,
      configLab: null,
      usarExtracaoOtimizada: false,
      tempoTotalMs: Date.now() - inicio,
      detalhes: {
        filtro,
        classificacao: {
          tipo: 'DESCONHECIDO',
          confianca: 0,
          laboratorio: null,
          tempoMs: 0
        }
      }
    };
  }
  
  // 2. Classificação
  const classificacao = classificarDocumento(textoOcr);
  
  // 3. Config do laboratório
  const configLab = getConfigLaboratorio(classificacao.laboratorio);
  
  // 4. Decidir se usa extração otimizada
  const usarExtracaoOtimizada = deveUsarExtracaoOtimizada(classificacao);
  
  return {
    processar: true,
    motivo: filtro.motivo,
    tipo: classificacao.tipo,
    laboratorio: classificacao.laboratorio,
    configLab,
    usarExtracaoOtimizada,
    tempoTotalMs: Date.now() - inicio,
    detalhes: {
      filtro,
      classificacao
    }
  };
}

// ============================================================================
// EXPORTS PARA USO NO ROUTERS.TS
// ============================================================================

export default {
  filtrarDocumento,
  classificarDocumento,
  detectarLaboratorio,
  getConfigLaboratorio,
  deveUsarExtracaoOtimizada,
  preProcessarDocumento,
  LABORATORIOS,
  PADROES_EXAME,
  PADROES_NAO_EXAME
};
