/**
 * Quick Filter - Detecção rápida de documentos não-exames
 * Gorgen System - Módulo de Extração de Exames
 * 
 * Este módulo analisa apenas as primeiras linhas/página do documento
 * para decidir rapidamente se deve ser processado ou ignorado.
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

// ============================================================================
// TIPOS
// ============================================================================

export enum FilterDecision {
  PROCESS = 'process',           // Processar normalmente
  SKIP = 'skip',                 // Ignorar completamente
  NEEDS_REVIEW = 'needs_review'  // Requer análise mais profunda
}

export interface QuickFilterResult {
  decision: FilterDecision;
  reason: string;
  document_type?: string;
  confidence: number;
  processing_time_ms: number;
}

// ============================================================================
// PADRÕES DE EXCLUSÃO RÁPIDA (primeiras 500 caracteres)
// ============================================================================

const SKIP_PATTERNS = {
  // Receitas médicas
  receita: {
    patterns: [
      /receita\s+(médica|especial|simples)/i,
      /receituário/i,
      /prescrição\s+médica/i,
      /uso\s+(contínuo|interno|externo)/i,
      /tomar\s+\d+\s*(comprimido|cápsula|gotas)/i,
      /posologia/i,
      /via\s+oral/i,
      /\d+\s*mg\s+(ao\s+dia|por\s+dia|\/dia)/i
    ],
    reason: 'Documento identificado como RECEITA MÉDICA'
  },
  
  // Solicitações de exame
  solicitacao: {
    patterns: [
      /solicitação\s+de\s+exame/i,
      /solicito\s+(os\s+)?exames?/i,
      /guia\s+sadt/i,
      /requisição\s+de\s+exame/i,
      /favor\s+realizar/i,
      /exames?\s+solicitados?/i,
      /cremers.*solicitação/i,
      /encaminho\s+para\s+realização/i
    ],
    reason: 'Documento identificado como SOLICITAÇÃO DE EXAME (não é resultado)'
  },
  
  // Extratos e pagamentos
  extrato: {
    patterns: [
      /extrato\s+(de\s+)?pagamento/i,
      /demonstrativo\s+(de\s+)?pagamento/i,
      /faturamento\s+médico/i,
      /valor\s+pago/i,
      /glosa/i,
      /repasse\s+médico/i,
      /honorário/i,
      /competência\s+\d{2}\/\d{4}/i
    ],
    reason: 'Documento identificado como EXTRATO/DEMONSTRATIVO DE PAGAMENTO'
  },
  
  // Guias de autorização
  guia: {
    patterns: [
      /guia\s+de\s+autorização/i,
      /autorização\s+prévia/i,
      /senha\s+de\s+autorização/i,
      /tiss/i,
      /número\s+da\s+guia/i,
      /carteirinha\s+do\s+beneficiário/i
    ],
    reason: 'Documento identificado como GUIA DE AUTORIZAÇÃO'
  },
  
  // Atestados
  atestado: {
    patterns: [
      /atestado\s+médico/i,
      /atesto\s+(para\s+os\s+devidos\s+fins|que)/i,
      /afastamento\s+de\s+\d+\s+dias?/i,
      /cid[:\s]+[a-z]\d{2}/i
    ],
    reason: 'Documento identificado como ATESTADO MÉDICO'
  },
  
  // Declarações
  declaracao: {
    patterns: [
      /declaração/i,
      /declaro\s+(para|que)/i,
      /para\s+fins\s+de\s+comprovação/i
    ],
    reason: 'Documento identificado como DECLARAÇÃO'
  },
  
  // Termos de consentimento
  termo: {
    patterns: [
      /termo\s+de\s+consentimento/i,
      /consentimento\s+(livre\s+e\s+)?esclarecido/i,
      /autorizo\s+a\s+realização/i,
      /declaro\s+que\s+fui\s+informado/i
    ],
    reason: 'Documento identificado como TERMO DE CONSENTIMENTO'
  }
};

// ============================================================================
// PADRÕES DE INCLUSÃO (confirma que é resultado de exame)
// ============================================================================

const INCLUDE_PATTERNS = {
  laboratorial: {
    patterns: [
      /resultado\s+(de\s+)?exame/i,
      /laudo\s+(laboratorial|de\s+exame)/i,
      /valores?\s+de\s+referência/i,
      /material[:\s]+(sangue|urina|fezes)/i,
      /método[:\s]+/i,
      /hemograma/i,
      /glicose|creatinina|ureia/i,
      /colesterol|triglicerídeos/i
    ],
    type: 'laboratorial'
  },
  
  imagem: {
    patterns: [
      /laudo\s+(de\s+)?(ultrassonografia|ecografia|tomografia|ressonância)/i,
      /impressão\s+diagnóstica/i,
      /conclusão[:\s]/i,
      /fígado\s+(com\s+)?tamanho/i,
      /rins\s+(com\s+)?tamanho/i,
      /ecogenicidade/i,
      /parênquima/i
    ],
    type: 'imagem'
  },
  
  anatomopatologico: {
    patterns: [
      /laudo\s+anatomopatológico/i,
      /diagnóstico\s+histológico/i,
      /exame\s+histopatológico/i,
      /macroscopia/i,
      /microscopia/i,
      /espécime/i,
      /biópsia/i
    ],
    type: 'anatomopatologico'
  }
};

// ============================================================================
// FUNÇÃO PRINCIPAL DE FILTRO RÁPIDO
// ============================================================================

/**
 * Analisa rapidamente o início de um documento para decidir se deve ser processado
 * 
 * @param textContent Texto das primeiras páginas (idealmente primeiros 500-1000 chars)
 * @param filename Nome do arquivo para hints adicionais
 * @returns Decisão de filtro com justificativa
 */
export function quickFilter(
  textContent: string,
  filename: string
): QuickFilterResult {
  const startTime = Date.now();
  
  // Normalizar texto (primeiros 1000 caracteres são suficientes)
  const sampleText = textContent.substring(0, 1000).toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  
  // 1. VERIFICAR PADRÕES DE EXCLUSÃO (mais rápido)
  for (const [category, config] of Object.entries(SKIP_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(sampleText) || pattern.test(normalizedFilename)) {
        return {
          decision: FilterDecision.SKIP,
          reason: config.reason,
          document_type: category,
          confidence: 0.95,
          processing_time_ms: Date.now() - startTime
        };
      }
    }
  }
  
  // 2. VERIFICAR PADRÕES DE INCLUSÃO
  for (const [category, config] of Object.entries(INCLUDE_PATTERNS)) {
    let matchCount = 0;
    for (const pattern of config.patterns) {
      if (pattern.test(sampleText)) {
        matchCount++;
      }
    }
    
    // Se encontrou 2+ padrões de inclusão, processar
    if (matchCount >= 2) {
      return {
        decision: FilterDecision.PROCESS,
        reason: `Documento identificado como resultado de exame (${config.type})`,
        document_type: config.type,
        confidence: Math.min(0.95, 0.5 + matchCount * 0.15),
        processing_time_ms: Date.now() - startTime
      };
    }
  }
  
  // 3. VERIFICAR HINTS NO NOME DO ARQUIVO
  const filenameHints = analyzeFilename(normalizedFilename);
  if (filenameHints.decision !== FilterDecision.NEEDS_REVIEW) {
    return {
      ...filenameHints,
      processing_time_ms: Date.now() - startTime
    };
  }
  
  // 4. CASO INCERTO - requer análise mais profunda
  return {
    decision: FilterDecision.NEEDS_REVIEW,
    reason: 'Documento não identificado claramente - requer análise adicional',
    confidence: 0.3,
    processing_time_ms: Date.now() - startTime
  };
}

// ============================================================================
// ANÁLISE DE NOME DE ARQUIVO
// ============================================================================

function analyzeFilename(filename: string): Omit<QuickFilterResult, 'processing_time_ms'> {
  // Padrões de exclusão por nome
  const skipFilenamePatterns = [
    { pattern: /receita/i, type: 'receita', reason: 'Nome do arquivo sugere RECEITA' },
    { pattern: /guia/i, type: 'guia', reason: 'Nome do arquivo sugere GUIA' },
    { pattern: /atestado/i, type: 'atestado', reason: 'Nome do arquivo sugere ATESTADO' },
    { pattern: /solicit/i, type: 'solicitacao', reason: 'Nome do arquivo sugere SOLICITAÇÃO' },
    { pattern: /extrato/i, type: 'extrato', reason: 'Nome do arquivo sugere EXTRATO' },
    { pattern: /pagamento/i, type: 'extrato', reason: 'Nome do arquivo sugere PAGAMENTO' }
  ];
  
  for (const { pattern, type, reason } of skipFilenamePatterns) {
    if (pattern.test(filename)) {
      return {
        decision: FilterDecision.SKIP,
        reason,
        document_type: type,
        confidence: 0.7
      };
    }
  }
  
  // Padrões de inclusão por nome
  const processFilenamePatterns = [
    { pattern: /exame/i, type: 'laboratorial', reason: 'Nome do arquivo sugere EXAME' },
    { pattern: /resultado/i, type: 'laboratorial', reason: 'Nome do arquivo sugere RESULTADO' },
    { pattern: /laudo/i, type: 'laboratorial', reason: 'Nome do arquivo sugere LAUDO' },
    { pattern: /hemograma/i, type: 'laboratorial', reason: 'Nome do arquivo sugere HEMOGRAMA' },
    { pattern: /usg|ultrassom/i, type: 'imagem', reason: 'Nome do arquivo sugere USG' },
    { pattern: /tomografia|tc/i, type: 'imagem', reason: 'Nome do arquivo sugere TOMOGRAFIA' },
    { pattern: /ressonancia|rm/i, type: 'imagem', reason: 'Nome do arquivo sugere RESSONÂNCIA' }
  ];
  
  for (const { pattern, type, reason } of processFilenamePatterns) {
    if (pattern.test(filename)) {
      return {
        decision: FilterDecision.PROCESS,
        reason,
        document_type: type,
        confidence: 0.6
      };
    }
  }
  
  // Padrões numéricos típicos de laboratórios (ex: 2841190270.pdf)
  if (/^\d{8,12}\.pdf$/i.test(filename)) {
    return {
      decision: FilterDecision.PROCESS,
      reason: 'Nome do arquivo segue padrão numérico de laboratório',
      document_type: 'laboratorial',
      confidence: 0.5
    };
  }
  
  return {
    decision: FilterDecision.NEEDS_REVIEW,
    reason: 'Nome do arquivo não fornece indicação clara',
    confidence: 0.3
  };
}

// ============================================================================
// FILTRO EM LOTE
// ============================================================================

export interface BatchFilterResult {
  to_process: Array<{ filename: string; type: string; confidence: number }>;
  to_skip: Array<{ filename: string; reason: string }>;
  needs_review: Array<{ filename: string }>;
  stats: {
    total: number;
    processed: number;
    skipped: number;
    review: number;
    avg_filter_time_ms: number;
  };
}

/**
 * Filtra rapidamente um lote de documentos
 */
export function quickFilterBatch(
  files: Array<{ filename: string; textSample: string }>
): BatchFilterResult {
  const toProcess: BatchFilterResult['to_process'] = [];
  const toSkip: BatchFilterResult['to_skip'] = [];
  const needsReview: BatchFilterResult['needs_review'] = [];
  let totalTime = 0;
  
  for (const file of files) {
    const result = quickFilter(file.textSample, file.filename);
    totalTime += result.processing_time_ms;
    
    switch (result.decision) {
      case FilterDecision.PROCESS:
        toProcess.push({
          filename: file.filename,
          type: result.document_type || 'unknown',
          confidence: result.confidence
        });
        break;
        
      case FilterDecision.SKIP:
        toSkip.push({
          filename: file.filename,
          reason: result.reason
        });
        break;
        
      case FilterDecision.NEEDS_REVIEW:
        needsReview.push({ filename: file.filename });
        break;
    }
  }
  
  return {
    to_process: toProcess,
    to_skip: toSkip,
    needs_review: needsReview,
    stats: {
      total: files.length,
      processed: toProcess.length,
      skipped: toSkip.length,
      review: needsReview.length,
      avg_filter_time_ms: files.length > 0 ? totalTime / files.length : 0
    }
  };
}

// ============================================================================
// VALIDAÇÃO DE PDF
// ============================================================================

/**
 * Verifica se o arquivo é um PDF válido (magic bytes)
 */
export function isValidPDF(buffer: Buffer): boolean {
  // PDF magic bytes: %PDF-
  return buffer.length >= 5 && 
         buffer[0] === 0x25 && // %
         buffer[1] === 0x50 && // P
         buffer[2] === 0x44 && // D
         buffer[3] === 0x46 && // F
         buffer[4] === 0x2D;   // -
}

/**
 * Verifica se o PDF está corrompido (verificação básica)
 */
export function isPDFCorrupted(buffer: Buffer): boolean {
  // Verificar se tem EOF marker
  const lastBytes = buffer.slice(-1024).toString('latin1');
  return !lastBytes.includes('%%EOF');
}

export default {
  quickFilter,
  quickFilterBatch,
  isValidPDF,
  isPDFCorrupted,
  FilterDecision
};
