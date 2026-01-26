/**
 * Batch Processor - Processamento em lote por tipo de documento
 * Gorgen System - Módulo de Extração de Exames
 * 
 * Agrupa documentos similares e processa em lote para aproveitar
 * padrões comuns e otimizar performance.
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

import { DocumentType, classifyBatch, ClassificationResult } from './pdf-classifier';
import { detectLaboratory, LaboratoryFormat, updateLabStats } from './laboratory-cache';
import { quickFilterBatch, FilterDecision } from './quick-filter';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PDFDocument {
  filename: string;
  filepath: string;
  textContent: string;
  pageCount: number;
  fileSize: number;
}

export interface ExtractionResult {
  patient_name: string;
  exam_name: string;
  result: string;
  unit: string;
  reference: string;
  date: string;
  laboratory: string;
  is_abnormal: boolean;
  source_file: string;
}

export interface BatchProcessingResult {
  extractions: ExtractionResult[];
  stats: {
    total_files: number;
    processed_files: number;
    skipped_files: number;
    total_exams: number;
    total_time_ms: number;
    by_type: Record<DocumentType, { count: number; exams: number; time_ms: number }>;
    by_laboratory: Record<string, { count: number; exams: number; time_ms: number }>;
  };
  errors: Array<{ filename: string; error: string }>;
  skipped: Array<{ filename: string; reason: string }>;
}

export interface ProcessingOptions {
  parallel_limit?: number;        // Máximo de processamentos paralelos
  priority_order?: boolean;       // Processar por prioridade
  group_by_laboratory?: boolean;  // Agrupar por laboratório
  group_by_type?: boolean;        // Agrupar por tipo
  skip_duplicates?: boolean;      // Ignorar arquivos duplicados
  patient_index?: Map<string, string[]>;  // Índice de pacientes existentes
}

// ============================================================================
// PROCESSADOR EM LOTE PRINCIPAL
// ============================================================================

export class BatchProcessor {
  private options: ProcessingOptions;
  private patientIndex: Map<string, string[]>;
  
  constructor(options: ProcessingOptions = {}) {
    this.options = {
      parallel_limit: 5,
      priority_order: true,
      group_by_laboratory: true,
      group_by_type: true,
      skip_duplicates: true,
      ...options
    };
    this.patientIndex = options.patient_index || new Map();
  }
  
  /**
   * Processa um lote de PDFs de forma otimizada
   */
  async processBatch(documents: PDFDocument[]): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const result: BatchProcessingResult = {
      extractions: [],
      stats: {
        total_files: documents.length,
        processed_files: 0,
        skipped_files: 0,
        total_exams: 0,
        total_time_ms: 0,
        by_type: {} as any,
        by_laboratory: {}
      },
      errors: [],
      skipped: []
    };
    
    // Inicializar estatísticas por tipo
    for (const type of Object.values(DocumentType)) {
      result.stats.by_type[type] = { count: 0, exams: 0, time_ms: 0 };
    }
    
    // FASE 1: Filtro rápido
    console.log(`[BatchProcessor] Fase 1: Filtro rápido de ${documents.length} documentos`);
    const filterResult = quickFilterBatch(
      documents.map(d => ({ filename: d.filename, textSample: d.textContent.substring(0, 1000) }))
    );
    
    // Registrar documentos ignorados
    for (const skipped of filterResult.to_skip) {
      result.skipped.push(skipped);
      result.stats.skipped_files++;
    }
    
    // FASE 2: Classificação detalhada dos documentos a processar
    console.log(`[BatchProcessor] Fase 2: Classificação de ${filterResult.to_process.length} documentos`);
    const toProcess = documents.filter(d => 
      filterResult.to_process.some(p => p.filename === d.filename) ||
      filterResult.needs_review.some(r => r.filename === d.filename)
    );
    
    const classificationResult = classifyBatch(
      toProcess.map(d => ({ filename: d.filename, textContent: d.textContent }))
    );
    
    // FASE 3: Agrupar documentos para processamento otimizado
    console.log(`[BatchProcessor] Fase 3: Agrupamento para processamento`);
    const groups = this.groupDocuments(toProcess, classificationResult.files);
    
    // FASE 4: Processar cada grupo
    console.log(`[BatchProcessor] Fase 4: Processamento de ${groups.length} grupos`);
    for (const group of groups) {
      const groupStartTime = Date.now();
      
      try {
        const groupExtractions = await this.processGroup(group);
        result.extractions.push(...groupExtractions);
        
        // Atualizar estatísticas
        const groupTime = Date.now() - groupStartTime;
        result.stats.processed_files += group.documents.length;
        result.stats.total_exams += groupExtractions.length;
        
        // Por tipo
        result.stats.by_type[group.type].count += group.documents.length;
        result.stats.by_type[group.type].exams += groupExtractions.length;
        result.stats.by_type[group.type].time_ms += groupTime;
        
        // Por laboratório
        if (group.laboratory) {
          if (!result.stats.by_laboratory[group.laboratory]) {
            result.stats.by_laboratory[group.laboratory] = { count: 0, exams: 0, time_ms: 0 };
          }
          result.stats.by_laboratory[group.laboratory].count += group.documents.length;
          result.stats.by_laboratory[group.laboratory].exams += groupExtractions.length;
          result.stats.by_laboratory[group.laboratory].time_ms += groupTime;
        }
        
      } catch (error) {
        for (const doc of group.documents) {
          result.errors.push({
            filename: doc.filename,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    result.stats.total_time_ms = Date.now() - startTime;
    
    // FASE 5: Atualizar índice de pacientes
    this.updatePatientIndex(result.extractions);
    
    return result;
  }
  
  /**
   * Agrupa documentos por tipo e laboratório para processamento otimizado
   */
  private groupDocuments(
    documents: PDFDocument[],
    classifications: Array<{ filename: string; classification: ClassificationResult }>
  ): DocumentGroup[] {
    const groups: Map<string, DocumentGroup> = new Map();
    
    for (const doc of documents) {
      const classInfo = classifications.find(c => c.filename === doc.filename);
      if (!classInfo || !classInfo.classification.should_process) continue;
      
      const type = classInfo.classification.type;
      const lab = classInfo.classification.laboratory || 'unknown';
      
      // Criar chave de grupo
      let groupKey: string;
      if (this.options.group_by_laboratory && this.options.group_by_type) {
        groupKey = `${type}:${lab}`;
      } else if (this.options.group_by_type) {
        groupKey = type;
      } else if (this.options.group_by_laboratory) {
        groupKey = lab;
      } else {
        groupKey = 'all';
      }
      
      // Adicionar ao grupo
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          type,
          laboratory: lab,
          documents: [],
          priority: classInfo.classification.processing_priority
        });
      }
      
      groups.get(groupKey)!.documents.push({
        ...doc,
        classification: classInfo.classification
      });
    }
    
    // Ordenar grupos por prioridade
    const sortedGroups = Array.from(groups.values());
    if (this.options.priority_order) {
      sortedGroups.sort((a, b) => a.priority - b.priority);
    }
    
    return sortedGroups;
  }
  
  /**
   * Processa um grupo de documentos similares
   */
  private async processGroup(group: DocumentGroup): Promise<ExtractionResult[]> {
    const extractions: ExtractionResult[] = [];
    const labFormat = detectLaboratory(group.documents[0]?.textContent || '');
    
    console.log(`[BatchProcessor] Processando grupo ${group.key}: ${group.documents.length} docs`);
    
    for (const doc of group.documents) {
      const docStartTime = Date.now();
      
      try {
        const docExtractions = await this.extractFromDocument(doc, labFormat, group.type);
        extractions.push(...docExtractions);
        
        // Atualizar estatísticas do laboratório
        if (labFormat) {
          updateLabStats(labFormat.id, Date.now() - docStartTime, true);
        }
        
      } catch (error) {
        console.error(`[BatchProcessor] Erro em ${doc.filename}: ${error}`);
        if (labFormat) {
          updateLabStats(labFormat.id, Date.now() - docStartTime, false);
        }
      }
    }
    
    return extractions;
  }
  
  /**
   * Extrai dados de um documento individual
   */
  private async extractFromDocument(
    doc: PDFDocument & { classification: ClassificationResult },
    labFormat: LaboratoryFormat | null,
    type: DocumentType
  ): Promise<ExtractionResult[]> {
    const extractions: ExtractionResult[] = [];
    
    // Extrair informações básicas
    const patientName = doc.classification.patient || this.extractPatientName(doc.textContent);
    const examDate = doc.classification.date || this.extractDate(doc.textContent);
    const laboratory = doc.classification.laboratory || 'Desconhecido';
    
    // Processar baseado no tipo
    switch (type) {
      case DocumentType.LABORATORIAL:
        extractions.push(...this.extractLaboratorialExams(doc.textContent, patientName, examDate, laboratory, doc.filename, labFormat));
        break;
        
      case DocumentType.IMAGEM:
        extractions.push(...this.extractImageExams(doc.textContent, patientName, examDate, laboratory, doc.filename));
        break;
        
      case DocumentType.ANATOMOPATOLOGICO:
        extractions.push(...this.extractAnatomopatologico(doc.textContent, patientName, examDate, laboratory, doc.filename));
        break;
        
      case DocumentType.LAUDO_EVOLUTIVO:
        extractions.push(...this.extractLaudoEvolutivo(doc.textContent, patientName, laboratory, doc.filename, labFormat));
        break;
        
      default:
        // Tentar extração genérica
        extractions.push(...this.extractLaboratorialExams(doc.textContent, patientName, examDate, laboratory, doc.filename, labFormat));
    }
    
    return extractions;
  }
  
  // ============================================================================
  // MÉTODOS DE EXTRAÇÃO POR TIPO
  // ============================================================================
  
  private extractLaboratorialExams(
    text: string,
    patient: string,
    date: string,
    lab: string,
    filename: string,
    labFormat: LaboratoryFormat | null
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    
    // Padrão genérico: NOME_EXAME: VALOR UNIDADE (REF: X-Y)
    const examPattern = /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s,()-]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%³µ]+)?/gm;
    
    let match;
    while ((match = examPattern.exec(text)) !== null) {
      const examName = this.normalizeExamName(match[1].trim(), labFormat);
      const result = match[2].replace(',', '.');
      const unit = match[3] || '';
      
      // Buscar referência próxima
      const reference = this.findReference(text, match.index, labFormat, examName);
      const isAbnormal = this.checkIfAbnormal(parseFloat(result), reference);
      
      results.push({
        patient_name: patient,
        exam_name: examName,
        result,
        unit,
        reference,
        date,
        laboratory: lab,
        is_abnormal: isAbnormal,
        source_file: filename
      });
    }
    
    return results;
  }
  
  private extractImageExams(
    text: string,
    patient: string,
    date: string,
    lab: string,
    filename: string
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    
    // Extrair tipo de exame de imagem
    const imageTypes = [
      { pattern: /ultrassonografia|ecografia|usg/i, name: 'USG' },
      { pattern: /tomografia|tc/i, name: 'TOMOGRAFIA' },
      { pattern: /ressonância|rm/i, name: 'RESSONÂNCIA' },
      { pattern: /ecocardiograma/i, name: 'ECOCARDIOGRAMA' },
      { pattern: /elastografia/i, name: 'ELASTOGRAFIA' }
    ];
    
    let examType = 'IMAGEM';
    for (const { pattern, name } of imageTypes) {
      if (pattern.test(text)) {
        examType = name;
        break;
      }
    }
    
    // Extrair região anatômica
    const regions = [
      { pattern: /abdome|abdominal/i, region: 'ABDOME' },
      { pattern: /fígado|hepático/i, region: 'FÍGADO' },
      { pattern: /rins|renal/i, region: 'RINS' },
      { pattern: /tireóide|tireoide/i, region: 'TIREOIDE' },
      { pattern: /mama|mamário/i, region: 'MAMA' },
      { pattern: /próstata|prostático/i, region: 'PRÓSTATA' }
    ];
    
    for (const { pattern, region } of regions) {
      if (pattern.test(text)) {
        // Extrair conclusão/impressão para esta região
        const conclusionMatch = text.match(new RegExp(`${region}[^.]*\\.`, 'i'));
        
        results.push({
          patient_name: patient,
          exam_name: `${examType} ${region}`,
          result: conclusionMatch ? conclusionMatch[0] : 'Ver laudo completo',
          unit: '',
          reference: '',
          date,
          laboratory: lab,
          is_abnormal: /alterado|anormal|aumentado|diminuído|nódulo|cisto|massa/i.test(text),
          source_file: filename
        });
      }
    }
    
    return results;
  }
  
  private extractAnatomopatologico(
    text: string,
    patient: string,
    date: string,
    lab: string,
    filename: string
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    
    // Extrair diagnóstico principal
    const diagMatch = text.match(/diagnóstico[:\s]+([^.]+\.)/i);
    if (diagMatch) {
      results.push({
        patient_name: patient,
        exam_name: 'ANATOMOPATOLÓGICO - DIAGNÓSTICO',
        result: diagMatch[1].trim(),
        unit: '',
        reference: '',
        date,
        laboratory: lab,
        is_abnormal: /maligno|carcinoma|neoplasia|displasia/i.test(diagMatch[1]),
        source_file: filename
      });
    }
    
    // Extrair espécime
    const specMatch = text.match(/espécime[:\s]+([^.]+\.)/i);
    if (specMatch) {
      results.push({
        patient_name: patient,
        exam_name: 'ANATOMOPATOLÓGICO - ESPÉCIME',
        result: specMatch[1].trim(),
        unit: '',
        reference: '',
        date,
        laboratory: lab,
        is_abnormal: false,
        source_file: filename
      });
    }
    
    return results;
  }
  
  private extractLaudoEvolutivo(
    text: string,
    patient: string,
    lab: string,
    filename: string,
    labFormat: LaboratoryFormat | null
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    
    // Identificar padrão de laudo evolutivo (tabela com múltiplas datas)
    // Formato típico: EXAME | DATA1 | DATA2 | DATA3 ...
    
    // Extrair datas do cabeçalho
    const dateMatches = text.match(/\d{2}\/\d{2}\/\d{2,4}/g);
    const uniqueDates: string[] = Array.from(new Set(dateMatches || []));
    
    // Para cada linha com valores, extrair exame e resultados por data
    const lines = text.split('\n');
    for (const line of lines) {
      // Verificar se é linha de exame (começa com nome e tem números)
      const examMatch = line.match(/^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)\s+([\d.,\s]+)/);
      if (examMatch) {
        const examName = this.normalizeExamName(examMatch[1].trim(), labFormat);
        const values = examMatch[2].trim().split(/\s+/);
        
        // Associar valores com datas
        for (let i = 0; i < Math.min(values.length, uniqueDates.length); i++) {
          if (values[i] && values[i] !== '-' && values[i] !== '--') {
            results.push({
              patient_name: patient,
              exam_name: examName,
              result: values[i].replace(',', '.'),
              unit: '',
              reference: '',
              date: uniqueDates[i],
              laboratory: lab,
              is_abnormal: false,  // Verificar depois
              source_file: filename
            });
          }
        }
      }
    }
    
    return results;
  }
  
  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================
  
  private extractPatientName(text: string): string {
    const patterns = [
      /(?:cliente|paciente|nome)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)$/m
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        return match[1].trim().toUpperCase();
      }
    }
    return 'DESCONHECIDO';
  }
  
  private extractDate(text: string): string {
    const match = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    return match ? match[1] : new Date().toLocaleDateString('pt-BR');
  }
  
  private normalizeExamName(name: string, labFormat: LaboratoryFormat | null): string {
    const upperName = name.toUpperCase().trim();
    
    if (labFormat?.exam_name_mapping[upperName]) {
      return labFormat.exam_name_mapping[upperName];
    }
    
    // Mapeamentos genéricos
    const genericMap: Record<string, string> = {
      'TRANSAMINASE GLUTAMICO-OXALACETICA (TGO)': 'TGO/AST',
      'TRANSAMINASE GLUTAMICO-PIRUVICA (TGP)': 'TGP/ALT',
      'GAMA GLUTAMIL TRANSFERASE': 'GAMA GT'
    };
    
    return genericMap[upperName] || upperName;
  }
  
  private findReference(
    text: string, 
    position: number, 
    labFormat: LaboratoryFormat | null,
    examName: string
  ): string {
    // Buscar referência próxima no texto
    const nearbyText = text.substring(position, position + 200);
    const refMatch = nearbyText.match(/(?:ref|referência)[.:\s]+([^\n]+)/i);
    
    if (refMatch) {
      return refMatch[1].trim();
    }
    
    // Usar referência padrão do laboratório
    if (labFormat?.default_references[examName]) {
      const ref = labFormat.default_references[examName];
      if (ref.min !== undefined && ref.max !== undefined) {
        return `${ref.min} - ${ref.max} ${ref.unit}`;
      } else if (ref.max !== undefined) {
        return `< ${ref.max} ${ref.unit}`;
      } else if (ref.min !== undefined) {
        return `> ${ref.min} ${ref.unit}`;
      }
    }
    
    return '';
  }
  
  private checkIfAbnormal(value: number, reference: string): boolean {
    if (!reference || isNaN(value)) return false;
    
    // Padrão: "X - Y" ou "< X" ou "> X"
    const rangeMatch = reference.match(/(\d+[.,]?\d*)\s*[-a]\s*(\d+[.,]?\d*)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1].replace(',', '.'));
      const max = parseFloat(rangeMatch[2].replace(',', '.'));
      return value < min || value > max;
    }
    
    const lessThanMatch = reference.match(/<\s*(\d+[.,]?\d*)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1].replace(',', '.'));
      return value >= max;
    }
    
    const greaterThanMatch = reference.match(/>\s*(\d+[.,]?\d*)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1].replace(',', '.'));
      return value <= min;
    }
    
    return false;
  }
  
  private updatePatientIndex(extractions: ExtractionResult[]): void {
    for (const extraction of extractions) {
      const patient = extraction.patient_name;
      if (!this.patientIndex.has(patient)) {
        this.patientIndex.set(patient, []);
      }
      
      const dates = this.patientIndex.get(patient)!;
      if (!dates.includes(extraction.date)) {
        dates.push(extraction.date);
      }
    }
  }
  
  /**
   * Obtém índice de pacientes atualizado
   */
  getPatientIndex(): Map<string, string[]> {
    return this.patientIndex;
  }
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

interface DocumentGroup {
  key: string;
  type: DocumentType;
  laboratory: string;
  documents: Array<PDFDocument & { classification: ClassificationResult }>;
  priority: number;
}

export default BatchProcessor;
