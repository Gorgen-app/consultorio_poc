/**
 * PDF Classifier - Pré-classificação de PDFs por tipo
 * Gorgen System - Módulo de Extração de Exames
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

// ============================================================================
// TIPOS DE DOCUMENTO
// ============================================================================

export enum DocumentType {
  LABORATORIAL = 'laboratorial',           // Exames de sangue, urina, fezes
  IMAGEM = 'imagem',                        // USG, RX, TC, RM, Eco
  ANATOMOPATOLOGICO = 'anatomopatologico',  // Biópsias, citologia
  SOLICITACAO = 'solicitacao',              // Pedidos de exame (SADT, CREMERS)
  RECEITA = 'receita',                      // Receitas médicas
  EXTRATO = 'extrato',                      // Extratos de pagamento
  GUIA = 'guia',                            // Guias de autorização
  LAUDO_EVOLUTIVO = 'laudo_evolutivo',      // Tabelas comparativas multi-data
  DESCONHECIDO = 'desconhecido'
}

export interface ClassificationResult {
  type: DocumentType;
  confidence: number;           // 0.0 - 1.0
  laboratory?: string;
  patient?: string;
  date?: string;
  keywords_found: string[];
  processing_priority: number;  // 1 (alta) - 5 (baixa)
  estimated_exams: number;
  should_process: boolean;
}

// ============================================================================
// PADRÕES DE DETECÇÃO POR TIPO
// ============================================================================

const DETECTION_PATTERNS: Record<DocumentType, {
  keywords: string[];
  negative_keywords: string[];
  weight: number;
}> = {
  [DocumentType.LABORATORIAL]: {
    keywords: [
      'hemograma', 'glicose', 'creatinina', 'ureia', 'colesterol',
      'triglicerídeos', 'tgo', 'tgp', 'gama gt', 'bilirrubina',
      'hemoglobina', 'hematócrito', 'leucócitos', 'plaquetas',
      'ferritina', 'ferro sérico', 'vitamina', 'tsh', 't4',
      'psa', 'pcr', 'vhs', 'ácido úrico', 'albumina',
      'resultado', 'valor de referência', 'material: sangue',
      'material: urina', 'método:', 'unidade:'
    ],
    negative_keywords: ['solicitação', 'solicito', 'prescrição'],
    weight: 1.0
  },
  
  [DocumentType.IMAGEM]: {
    keywords: [
      'ultrassonografia', 'ecografia', 'tomografia', 'ressonância',
      'radiografia', 'raio-x', 'rx ', 'usg ', 'tc ', 'rm ',
      'ecocardiograma', 'doppler', 'elastografia', 'densitometria',
      'mamografia', 'endoscopia', 'colonoscopia', 'laudo de imagem',
      'fígado com tamanho', 'rins com tamanho', 'baço com',
      'dimensões normais', 'ecogenicidade', 'parênquima'
    ],
    negative_keywords: [],
    weight: 1.0
  },
  
  [DocumentType.ANATOMOPATOLOGICO]: {
    keywords: [
      'anatomopatológico', 'anatomia patológica', 'histopatológico',
      'citopatológico', 'biópsia', 'peça cirúrgica', 'espécime',
      'diagnóstico histológico', 'macroscopia', 'microscopia',
      'imunohistoquímica', 'neoplasia', 'carcinoma', 'adenoma',
      'hiperplasia', 'displasia', 'metaplasia', 'inflamação',
      'margens cirúrgicas', 'linfonodo', 'parafina'
    ],
    negative_keywords: [],
    weight: 1.2  // Prioridade maior por complexidade
  },
  
  [DocumentType.SOLICITACAO]: {
    keywords: [
      'solicitação de exame', 'solicito', 'solicitar',
      'guia sadt', 'autorização', 'cremers', 'crm-rs',
      'pedido de exame', 'requisição', 'encaminho para',
      'favor realizar', 'exames solicitados'
    ],
    negative_keywords: ['resultado', 'valor de referência'],
    weight: 0.5  // Não processar
  },
  
  [DocumentType.RECEITA]: {
    keywords: [
      'receita', 'prescrição', 'receituário', 'uso contínuo',
      'uso interno', 'uso externo', 'tomar', 'comprimido',
      'cápsula', 'mg ao dia', 'posologia', 'via oral'
    ],
    negative_keywords: ['resultado', 'hemograma'],
    weight: 0.5  // Não processar
  },
  
  [DocumentType.EXTRATO]: {
    keywords: [
      'extrato', 'demonstrativo', 'pagamento', 'faturamento',
      'valor pago', 'valor cobrado', 'glosa', 'repasse',
      'honorário', 'procedimento realizado', 'competência'
    ],
    negative_keywords: [],
    weight: 0.5  // Não processar
  },
  
  [DocumentType.GUIA]: {
    keywords: [
      'guia de', 'autorização prévia', 'tiss', 'ans',
      'operadora', 'beneficiário', 'carteirinha',
      'código do procedimento', 'senha de autorização'
    ],
    negative_keywords: [],
    weight: 0.5  // Não processar
  },
  
  [DocumentType.LAUDO_EVOLUTIVO]: {
    keywords: [
      'laudo evolutivo', 'fluxograma', 'histórico de exames',
      'evolução laboratorial', 'comparativo', 'data anterior',
      'resultado anterior', 'tendência'
    ],
    negative_keywords: [],
    weight: 1.5  // Alta prioridade - dados históricos valiosos
  },
  
  [DocumentType.DESCONHECIDO]: {
    keywords: [],
    negative_keywords: [],
    weight: 0.3
  }
};

// ============================================================================
// FUNÇÃO PRINCIPAL DE CLASSIFICAÇÃO
// ============================================================================

/**
 * Classifica um PDF baseado no texto extraído das primeiras páginas
 * @param textContent Texto extraído do PDF (primeiras 2-3 páginas)
 * @param filename Nome do arquivo para hints adicionais
 * @returns Resultado da classificação com tipo, confiança e metadados
 */
export function classifyDocument(
  textContent: string,
  filename: string
): ClassificationResult {
  const normalizedText = textContent.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  
  const scores: Record<DocumentType, { score: number; keywords: string[] }> = {} as any;
  
  // Calcular score para cada tipo
  for (const [type, patterns] of Object.entries(DETECTION_PATTERNS)) {
    const docType = type as DocumentType;
    let score = 0;
    const foundKeywords: string[] = [];
    
    // Pontos positivos por keywords encontradas
    for (const keyword of patterns.keywords) {
      if (normalizedText.includes(keyword) || normalizedFilename.includes(keyword)) {
        score += patterns.weight;
        foundKeywords.push(keyword);
      }
    }
    
    // Pontos negativos por keywords excludentes
    for (const negKeyword of patterns.negative_keywords) {
      if (normalizedText.includes(negKeyword)) {
        score -= 0.5;
      }
    }
    
    scores[docType] = { score: Math.max(0, score), keywords: foundKeywords };
  }
  
  // Encontrar tipo com maior score
  let bestType = DocumentType.DESCONHECIDO;
  let bestScore = 0;
  let bestKeywords: string[] = [];
  
  for (const [type, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestType = type as DocumentType;
      bestKeywords = data.keywords;
    }
  }
  
  // Calcular confiança (normalizada 0-1)
  const maxPossibleScore = Math.max(...Object.values(DETECTION_PATTERNS).map(p => p.keywords.length * p.weight));
  const confidence = Math.min(1, bestScore / (maxPossibleScore * 0.3)); // 30% das keywords = 100% confiança
  
  // Extrair metadados básicos
  const laboratory = extractLaboratory(normalizedText);
  const patient = extractPatientName(textContent);
  const date = extractDate(textContent);
  
  // Determinar se deve processar
  const shouldProcess = [
    DocumentType.LABORATORIAL,
    DocumentType.IMAGEM,
    DocumentType.ANATOMOPATOLOGICO,
    DocumentType.LAUDO_EVOLUTIVO
  ].includes(bestType) && confidence > 0.3;
  
  // Estimar quantidade de exames
  const estimatedExams = estimateExamCount(normalizedText, bestType);
  
  // Definir prioridade de processamento
  const processingPriority = getProcessingPriority(bestType, estimatedExams);
  
  return {
    type: bestType,
    confidence,
    laboratory,
    patient,
    date,
    keywords_found: bestKeywords,
    processing_priority: processingPriority,
    estimated_exams: estimatedExams,
    should_process: shouldProcess
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function extractLaboratory(text: string): string | undefined {
  const labPatterns = [
    /weinmann/i,
    /fleury/i,
    /hermes pardini/i,
    /dasa/i,
    /unimed/i,
    /unilab/i,
    /unirad/i,
    /dal pont/i,
    /citoson/i,
    /moinhos de vento/i,
    /instituto de patologia/i,
    /iberleo/i,
    /santa casa/i
  ];
  
  for (const pattern of labPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
    }
  }
  return undefined;
}

function extractPatientName(text: string): string | undefined {
  const patterns = [
    /(?:cliente|paciente|nome)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇa-záéíóúâêîôûãõç\s]+)/i,
    /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)$/m
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 5) {
      return match[1].trim().toUpperCase();
    }
  }
  return undefined;
}

function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}\/\d{2}\/\d{2})/,
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function estimateExamCount(text: string, type: DocumentType): number {
  switch (type) {
    case DocumentType.LABORATORIAL:
      // Contar linhas com padrão "nome: valor unidade"
      const labMatches = text.match(/\d+[.,]\d+\s*(mg|g|u\/l|ml|%|meq)/gi);
      return labMatches ? Math.min(labMatches.length, 50) : 10;
      
    case DocumentType.IMAGEM:
      return 5; // USG/TC geralmente tem ~5 achados principais
      
    case DocumentType.ANATOMOPATOLOGICO:
      return 3; // Diagnósticos principais
      
    case DocumentType.LAUDO_EVOLUTIVO:
      // Contar colunas de data
      const dateMatches = text.match(/\d{2}\/\d{2}\/\d{2,4}/g);
      const uniqueDates = new Set(dateMatches || []);
      return uniqueDates.size * 15; // ~15 exames por data
      
    default:
      return 0;
  }
}

function getProcessingPriority(type: DocumentType, estimatedExams: number): number {
  const basePriority: Record<DocumentType, number> = {
    [DocumentType.LAUDO_EVOLUTIVO]: 1,      // Máxima prioridade
    [DocumentType.LABORATORIAL]: 2,
    [DocumentType.ANATOMOPATOLOGICO]: 2,
    [DocumentType.IMAGEM]: 3,
    [DocumentType.SOLICITACAO]: 5,
    [DocumentType.RECEITA]: 5,
    [DocumentType.EXTRATO]: 5,
    [DocumentType.GUIA]: 5,
    [DocumentType.DESCONHECIDO]: 4
  };
  
  // Ajustar por quantidade de exames
  let priority = basePriority[type];
  if (estimatedExams > 30) priority = Math.max(1, priority - 1);
  
  return priority;
}

// ============================================================================
// CLASSIFICAÇÃO EM LOTE
// ============================================================================

export interface BatchClassificationResult {
  files: Array<{
    filename: string;
    classification: ClassificationResult;
  }>;
  summary: {
    total: number;
    by_type: Record<DocumentType, number>;
    to_process: number;
    to_skip: number;
    estimated_total_exams: number;
  };
  processing_order: string[];  // Filenames ordenados por prioridade
}

/**
 * Classifica múltiplos PDFs e retorna ordem otimizada de processamento
 */
export function classifyBatch(
  files: Array<{ filename: string; textContent: string }>
): BatchClassificationResult {
  const results: BatchClassificationResult['files'] = [];
  const byType: Record<DocumentType, number> = {} as any;
  
  // Inicializar contadores
  for (const type of Object.values(DocumentType)) {
    byType[type] = 0;
  }
  
  // Classificar cada arquivo
  for (const file of files) {
    const classification = classifyDocument(file.textContent, file.filename);
    results.push({ filename: file.filename, classification });
    byType[classification.type]++;
  }
  
  // Calcular sumário
  const toProcess = results.filter(r => r.classification.should_process);
  const estimatedTotalExams = toProcess.reduce(
    (sum, r) => sum + r.classification.estimated_exams, 0
  );
  
  // Ordenar por prioridade e quantidade de exames
  const processingOrder = toProcess
    .sort((a, b) => {
      // Primeiro por prioridade
      const priorityDiff = a.classification.processing_priority - b.classification.processing_priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Depois por quantidade de exames (mais exames primeiro)
      return b.classification.estimated_exams - a.classification.estimated_exams;
    })
    .map(r => r.filename);
  
  return {
    files: results,
    summary: {
      total: files.length,
      by_type: byType,
      to_process: toProcess.length,
      to_skip: files.length - toProcess.length,
      estimated_total_exams: estimatedTotalExams
    },
    processing_order: processingOrder
  };
}

export default {
  classifyDocument,
  classifyBatch,
  DocumentType
};
