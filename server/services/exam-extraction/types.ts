/**
 * Tipos para o Serviço de Extração de Exames
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Versão: 2.0.0
 */

/**
 * Resultado individual de um exame
 */
export interface ExamResult {
  /** Nome padronizado do exame */
  name: string;
  
  /** Valor do resultado */
  value: string;
  
  /** Unidade de medida */
  unit: string;
  
  /** Valor de referência */
  reference: string;
  
  /** Indica se o valor está fora da referência */
  isAltered: boolean;
  
  /** Tipo de alteração (alto ou baixo) */
  alertType?: 'HIGH' | 'LOW';
  
  /** Linha original do PDF (para debug) */
  rawLine?: string;
  
  /** Confiança da extração (0-1) */
  confidence?: number;
}

/**
 * Informações do laboratório identificado
 */
export interface LaboratoryInfo {
  /** Nome curto do laboratório */
  name: string;
  
  /** Nome completo */
  fullName: string;
  
  /** Cidade */
  city?: string;
  
  /** Estado */
  state?: string;
  
  /** Confiança da identificação (0-1) */
  confidence: number;
}

/**
 * Informações do paciente extraídas
 */
export interface PatientInfo {
  /** Nome completo */
  name: string;
  
  /** Data de nascimento */
  birthDate?: string;
  
  /** Documento (CPF/RG) */
  document?: string;
}

/**
 * Resultado completo da extração
 */
export interface ExtractionResult {
  /** Indica se a extração foi bem-sucedida */
  success: boolean;
  
  /** Tipo de documento identificado */
  documentType: string;
  
  /** Mensagem de erro ou informação */
  message?: string;
  
  /** Laboratório identificado */
  laboratory?: LaboratoryInfo;
  
  /** Informações do paciente */
  patientInfo?: PatientInfo;
  
  /** Data do exame */
  examDate?: string;
  
  /** Lista de exames extraídos */
  exams: ExamResult[];
  
  /** Dados do laudo evolutivo (histórico) */
  evolutiveData?: Map<string, ExamResult[]> | null;
  
  /** Tempo de processamento em milissegundos */
  processingTimeMs: number;
  
  /** Nome do arquivo processado */
  fileName?: string;
}

/**
 * Log de correção para feedback loop (Opção 1)
 */
export interface CorrectionLog {
  /** ID único da correção */
  id?: number;
  
  /** Hash do PDF para identificação */
  pdfHash: string;
  
  /** Nome do laboratório */
  laboratory: string;
  
  /** Nome do campo/exame */
  fieldName: string;
  
  /** Valor extraído originalmente */
  originalValue: string;
  
  /** Valor corrigido pelo usuário */
  correctedValue: string;
  
  /** Tipo de correção */
  correctionType: 'VALUE' | 'NAME' | 'UNIT' | 'REFERENCE' | 'MISSING' | 'FALSE_POSITIVE';
  
  /** ID do usuário que fez a correção */
  userId: number;
  
  /** ID do tenant */
  tenantId: number;
  
  /** Data da correção */
  createdAt?: Date;
  
  /** Se a correção já foi aplicada ao código */
  appliedToCode?: boolean;
}

/**
 * Template de laboratório para extração configurável (Opção 2)
 */
export interface LaboratoryTemplate {
  /** ID único */
  id?: number;
  
  /** Nome do laboratório */
  name: string;
  
  /** Padrões de identificação (regex) */
  identificationPatterns: string[];
  
  /** Mapeamento de campos */
  fieldMappings: FieldMapping[];
  
  /** Se o template está ativo */
  isActive: boolean;
  
  /** ID do usuário que criou */
  createdBy: number;
  
  /** Data de criação */
  createdAt?: Date;
  
  /** Data de atualização */
  updatedAt?: Date;
}

/**
 * Mapeamento de campo para template
 */
export interface FieldMapping {
  /** Nome padronizado do exame */
  standardName: string;
  
  /** Padrões regex para encontrar o campo */
  patterns: string[];
  
  /** Unidade esperada */
  expectedUnit?: string;
  
  /** Posição no laudo (para PDFs estruturados) */
  position?: {
    line?: number;
    column?: number;
  };
}

/**
 * Configuração para extração via ML (Opção 3)
 */
export interface MLExtractionConfig {
  /** Modelo a ser usado */
  model: 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gemini-2.5-flash';
  
  /** Temperatura para geração */
  temperature: number;
  
  /** Máximo de tokens */
  maxTokens: number;
  
  /** Prompt base para extração */
  basePrompt: string;
  
  /** Exemplos few-shot */
  fewShotExamples: FewShotExample[];
}

/**
 * Exemplo few-shot para ML
 */
export interface FewShotExample {
  /** Texto de entrada (trecho do PDF) */
  input: string;
  
  /** Saída esperada (JSON de exames) */
  output: ExamResult[];
}

/**
 * Estatísticas de extração
 */
export interface ExtractionStats {
  /** Total de PDFs processados */
  totalProcessed: number;
  
  /** Extrações bem-sucedidas */
  successfulExtractions: number;
  
  /** Extrações com falha */
  failedExtractions: number;
  
  /** Correções aplicadas */
  correctionsApplied: number;
  
  /** Média de exames por PDF */
  averageExamsPerPdf: number;
  
  /** Taxa de sucesso */
  successRate?: number;
  
  /** Tempo médio de processamento */
  averageProcessingTimeMs?: number;
}

/**
 * Resultado de validação de exame
 */
export interface ValidationResult {
  /** Se o exame é válido */
  isValid: boolean;
  
  /** Erros encontrados */
  errors: string[];
  
  /** Avisos */
  warnings: string[];
  
  /** Sugestões de correção */
  suggestions: string[];
}

/**
 * Evento de extração para auditoria
 */
export interface ExtractionEvent {
  /** Tipo de evento */
  type: 'EXTRACTION_START' | 'EXTRACTION_SUCCESS' | 'EXTRACTION_FAILURE' | 'CORRECTION_APPLIED';
  
  /** Timestamp */
  timestamp: Date;
  
  /** ID do usuário */
  userId?: number;
  
  /** ID do tenant */
  tenantId?: number;
  
  /** ID do paciente */
  patientId?: number;
  
  /** Detalhes do evento */
  details: Record<string, unknown>;
}
