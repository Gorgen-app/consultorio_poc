/**
 * Gorgen Exam Extraction Module
 * 
 * Módulo otimizado para extração de dados de exames laboratoriais de PDFs.
 * 
 * @version 2.0.0
 * @date 2026-01-25
 * 
 * Componentes:
 * - exam-extractor: Classe principal de extração (código completo e detalhado)
 * - pdf-classifier: Pré-classificação de PDFs por tipo
 * - laboratory-cache: Cache de formatos de laboratórios conhecidos
 * - quick-filter: Detecção rápida de documentos não-exames
 * - batch-processor: Processamento em lote por tipo
 * - utils: Funções utilitárias
 * - cli: Interface de linha de comando
 */

// Exportar todos os módulos
export * from './exam-extractor';
export * from './pdf-classifier';
export * from './laboratory-cache';
export * from './quick-filter';
export * from './batch-processor';
export * from './utils';

// Exportar tipos principais do exam-extractor
export {
  ExtratorExames,
  TipoDocumento,
  DecisaoFiltro,
  DocumentoPDF,
  ExameExtraido,
  ResultadoProcessamento,
  FormatoLaboratorio,
  IndicePaciente,
  processarExamesPDF,
  validarPDF,
  verificarPDFCorrompido
} from './exam-extractor';

// Exportar tipos do pdf-classifier
export { DocumentType, ClassificationResult, BatchClassificationResult } from './pdf-classifier';

// Exportar tipos do laboratory-cache
export { LaboratoryFormat, LABORATORY_CACHE } from './laboratory-cache';

// Exportar tipos do quick-filter
export { FilterDecision, QuickFilterResult, BatchFilterResult } from './quick-filter';

// Exportar tipos do batch-processor
export { BatchProcessor, ExtractionResult, BatchProcessingResult, ProcessingOptions } from './batch-processor';

// Exportar utilitários
export {
  lerPDF,
  lerPDFsDiretorio,
  exportarCSV,
  exportarTabelaPivotada,
  exportarJSON,
  carregarIndicePacientes,
  salvarIndicePacientes,
  parseDateBR,
  formatDateBR,
  ordenarDatasBR,
  removerAcentos,
  normalizarEspacos,
  limparTextoComparacao,
  validarReferencia,
  parseReferencia,
  calcularEstatisticas,
  categorizarExame,
  mergeExames,
  carregarExamesCSV,
  Logger
} from './utils';

// Função de conveniência para processamento completo (usando BatchProcessor)
import { BatchProcessor, ProcessingOptions, BatchProcessingResult, PDFDocument } from './batch-processor';

/**
 * Processa um lote de PDFs de exames de forma otimizada (usando BatchProcessor)
 * 
 * @example
 * ```typescript
 * const result = await processExamPDFs([
 *   { filename: 'exam1.pdf', filepath: '/path/to/exam1.pdf', textContent: '...', pageCount: 5, fileSize: 1024 },
 *   { filename: 'exam2.pdf', filepath: '/path/to/exam2.pdf', textContent: '...', pageCount: 3, fileSize: 512 }
 * ]);
 * 
 * console.log(`Extraídos ${result.stats.total_exams} exames de ${result.stats.processed_files} arquivos`);
 * ```
 */
export async function processExamPDFs(
  documents: PDFDocument[],
  options?: ProcessingOptions
): Promise<BatchProcessingResult> {
  const processor = new BatchProcessor(options);
  return processor.processBatch(documents);
}

// Versão do módulo
export const VERSION = '2.0.0';

// Configurações padrão
export const DEFAULT_CONFIG = {
  parallel_limit: 5,
  priority_order: true,
  group_by_laboratory: true,
  group_by_type: true,
  skip_duplicates: true,
  quick_filter_sample_size: 1000,
  max_pages_per_document: 50
};
