/**
 * Gorgen Exam Extraction Module
 * 
 * Módulo otimizado para extração de dados de exames laboratoriais de PDFs.
 * 
 * @version 1.0.0
 * @date 2026-01-25
 * 
 * Componentes:
 * - pdf-classifier: Pré-classificação de PDFs por tipo
 * - laboratory-cache: Cache de formatos de laboratórios conhecidos
 * - quick-filter: Detecção rápida de documentos não-exames
 * - batch-processor: Processamento em lote por tipo
 */

// Exportar todos os módulos
export * from './pdf-classifier';
export * from './laboratory-cache';
export * from './quick-filter';
export * from './batch-processor';

// Exportar tipos principais
export { DocumentType, ClassificationResult, BatchClassificationResult } from './pdf-classifier';
export { LaboratoryFormat, LABORATORY_CACHE } from './laboratory-cache';
export { FilterDecision, QuickFilterResult, BatchFilterResult } from './quick-filter';
export { BatchProcessor, ExtractionResult, BatchProcessingResult, ProcessingOptions } from './batch-processor';

// Função de conveniência para processamento completo
import { BatchProcessor, ProcessingOptions, BatchProcessingResult, PDFDocument } from './batch-processor';

/**
 * Processa um lote de PDFs de exames de forma otimizada
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
export const VERSION = '1.0.0';

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
