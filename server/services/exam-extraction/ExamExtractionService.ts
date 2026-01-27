/**
 * Serviço de Extração de Exames Laboratoriais
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Versão: 2.0.0
 * Última atualização: 2026-01-27
 * 
 * Este serviço é responsável por:
 * 1. Extrair dados de exames de PDFs
 * 2. Identificar laboratórios e formatos
 * 3. Normalizar e padronizar resultados
 * 4. Detectar valores alterados
 * 5. Registrar correções para feedback loop
 */

import { EXAM_SYNONYMS, KNOWN_LABORATORIES, REFERENCE_VALUES } from './config';
import { ExamResult, ExtractionResult, LaboratoryInfo, CorrectionLog } from './types';

export class ExamExtractionService {
  private static instance: ExamExtractionService;
  
  // Cache de padrões de laboratórios para acelerar processamento
  private laboratoryPatterns: Map<string, RegExp[]> = new Map();
  
  // Estatísticas de extração para monitoramento
  private extractionStats = {
    totalProcessed: 0,
    successfulExtractions: 0,
    failedExtractions: 0,
    correctionsApplied: 0,
    averageExamsPerPdf: 0,
  };

  private constructor() {
    this.initializeLaboratoryPatterns();
  }

  public static getInstance(): ExamExtractionService {
    if (!ExamExtractionService.instance) {
      ExamExtractionService.instance = new ExamExtractionService();
    }
    return ExamExtractionService.instance;
  }

  /**
   * Inicializa padrões de regex para identificação de laboratórios
   */
  private initializeLaboratoryPatterns(): void {
    for (const [labName, labConfig] of Object.entries(KNOWN_LABORATORIES)) {
      const patterns = labConfig.identificationPatterns.map(p => new RegExp(p, 'i'));
      this.laboratoryPatterns.set(labName, patterns);
    }
  }

  /**
   * Extrai dados de exames de um PDF
   * @param pdfText Texto extraído do PDF
   * @param fileName Nome do arquivo para logging
   * @returns Resultado da extração com exames identificados
   */
  public async extractFromPdfText(pdfText: string, fileName: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    this.extractionStats.totalProcessed++;

    try {
      // 1. Verificar se é documento de exame válido
      const documentType = this.classifyDocument(pdfText);
      if (documentType === 'NOT_EXAM') {
        return {
          success: false,
          documentType: 'NOT_EXAM',
          message: 'Documento não é um laudo de exame',
          exams: [],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // 2. Identificar laboratório
      const laboratory = this.identifyLaboratory(pdfText);

      // 3. Extrair informações do paciente
      const patientInfo = this.extractPatientInfo(pdfText);

      // 4. Extrair data do exame
      const examDate = this.extractExamDate(pdfText);

      // 5. Extrair resultados de exames
      const exams = this.extractExamResults(pdfText, laboratory);

      // 6. Detectar valores alterados
      const examsWithAlerts = this.detectAlteredValues(exams);

      // 7. Verificar se há laudo evolutivo (histórico)
      const evolutiveData = this.extractEvolutiveReport(pdfText, laboratory);

      this.extractionStats.successfulExtractions++;
      this.updateAverageExams(examsWithAlerts.length);

      return {
        success: true,
        documentType,
        laboratory,
        patientInfo,
        examDate,
        exams: examsWithAlerts,
        evolutiveData,
        processingTimeMs: Date.now() - startTime,
        fileName,
      };

    } catch (error) {
      this.extractionStats.failedExtractions++;
      return {
        success: false,
        documentType: 'UNKNOWN',
        message: `Erro na extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        exams: [],
        processingTimeMs: Date.now() - startTime,
        fileName,
      };
    }
  }

  /**
   * Classifica o tipo de documento
   */
  private classifyDocument(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Padrões de documentos que NÃO são exames
    const nonExamPatterns = [
      /receitu[aá]rio/i,
      /prescri[çc][aã]o/i,
      /atestado m[ée]dico/i,
      /solicita[çc][aã]o de exame/i,
      /guia sadt/i,
      /extrato de pagamento/i,
      /boleto/i,
      /nota fiscal/i,
      /regulamento/i,
      /termo de consentimento/i,
    ];

    for (const pattern of nonExamPatterns) {
      if (pattern.test(text)) {
        return 'NOT_EXAM';
      }
    }

    // Padrões de exames laboratoriais
    if (/hemograma|glicose|creatinina|tgo|tgp|colesterol|triglicérides/i.test(lowerText)) {
      return 'LABORATORIAL';
    }

    // Padrões de exames de imagem
    if (/ultrassonografia|tomografia|ressonância|raio-?x|ecografia|ecodoppler/i.test(lowerText)) {
      return 'IMAGEM';
    }

    // Padrões de exames anatomopatológicos
    if (/anatomopatol[oó]gico|bi[oó]psia|histopatol[oó]gico|imuno-?histoqu[ií]mica/i.test(lowerText)) {
      return 'ANATOMOPATOLOGICO';
    }

    // Padrões de endoscopia
    if (/endoscopia|colonoscopia|eda|cpre/i.test(lowerText)) {
      return 'ENDOSCOPIA';
    }

    // Padrões de cardiologia
    if (/eletrocardiograma|ecg|ecocardiograma|holter|mapa/i.test(lowerText)) {
      return 'CARDIOLOGIA';
    }

    return 'LABORATORIAL'; // Default
  }

  /**
   * Identifica o laboratório baseado em padrões conhecidos
   */
  private identifyLaboratory(text: string): LaboratoryInfo {
    for (const [labName, patterns] of Array.from(this.laboratoryPatterns.entries())) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          const labConfig = KNOWN_LABORATORIES[labName];
          return {
            name: labName,
            fullName: labConfig.fullName,
            city: labConfig.city,
            state: labConfig.state,
            confidence: 0.95,
          };
        }
      }
    }

    // Laboratório não identificado
    return {
      name: 'DESCONHECIDO',
      fullName: 'Laboratório não identificado',
      confidence: 0,
    };
  }

  /**
   * Extrai informações do paciente do texto
   */
  private extractPatientInfo(text: string): { name: string; birthDate?: string; document?: string } {
    const patterns = {
      name: [
        /(?:paciente|cliente|nome)[:\s]*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-Za-záàâãéèêíïóôõöúçñ\s]+)/i,
        /^([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-Za-záàâãéèêíïóôõöúçñ\s]{10,50})$/m,
      ],
      birthDate: [
        /(?:nascimento|data de nascimento|dn)[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
        /(\d{2}\/\d{2}\/\d{4})/,
      ],
      document: [
        /(?:cpf)[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i,
        /(?:rg)[:\s]*(\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]?)/i,
      ],
    };

    let name = '';
    let birthDate = '';
    let document = '';

    for (const pattern of patterns.name) {
      const match = text.match(pattern);
      if (match && match[1]) {
        name = match[1].trim().toUpperCase();
        break;
      }
    }

    for (const pattern of patterns.birthDate) {
      const match = text.match(pattern);
      if (match && match[1]) {
        birthDate = match[1];
        break;
      }
    }

    for (const pattern of patterns.document) {
      const match = text.match(pattern);
      if (match && match[1]) {
        document = match[1];
        break;
      }
    }

    return { name, birthDate, document };
  }

  /**
   * Extrai a data do exame
   */
  private extractExamDate(text: string): string {
    const patterns = [
      /(?:data da coleta|coletado em|data do exame|data da ficha)[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
      /(?:recebido\/coletado em)[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
      /(\d{2}\/\d{2}\/\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Extrai resultados de exames do texto
   */
  private extractExamResults(text: string, laboratory: LaboratoryInfo): ExamResult[] {
    const results: ExamResult[] = [];
    const lines = text.split('\n');

    // Padrões genéricos para extração de resultados
    const resultPatterns = [
      // Padrão: NOME_EXAME : VALOR UNIDADE (REFERENCIA)
      /^([A-Za-záàâãéèêíïóôõöúçñ\s\-\/\(\)]+)[:\s]+(\d+[,.]?\d*)\s*([a-zA-Z\/%³²]+)?\s*(?:\(?\s*(?:ref|referência)?[:\s]*([^)]+)\)?)?$/i,
      
      // Padrão: NOME_EXAME VALOR UNIDADE REF: MIN-MAX
      /^([A-Za-záàâãéèêíïóôõöúçñ\s\-\/]+)\s+(\d+[,.]?\d*)\s+([a-zA-Z\/%³²]+)\s+(?:ref[:\s]*)?(\d+[,.]?\d*\s*[-aà]\s*\d+[,.]?\d*)/i,
      
      // Padrão específico Weinmann (laudo evolutivo)
      /^([A-Za-záàâãéèêíïóôõöúçñ\s\-\/\(\)]+)\s+(\d+[,.]?\d*)\s+[-]+\s+[-]+\s+[-]+\s+[-]+\s+(\d+[,.]?\d*)\s+([^$]+)$/i,
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 5) continue;

      for (const pattern of resultPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const examName = this.normalizeExamName(match[1].trim());
          const value = this.normalizeValue(match[2]);
          const unit = match[3]?.trim() || '';
          const reference = match[4]?.trim() || '';

          if (examName && value) {
            results.push({
              name: examName,
              value,
              unit,
              reference,
              isAltered: false,
              rawLine: trimmedLine,
            });
          }
          break;
        }
      }
    }

    return results;
  }

  /**
   * Normaliza o nome do exame usando sinônimos
   */
  private normalizeExamName(name: string): string {
    const upperName = name.toUpperCase().trim();
    
    for (const [standardName, synonyms] of Object.entries(EXAM_SYNONYMS)) {
      if (synonyms.some(s => upperName.includes(s.toUpperCase()))) {
        return standardName;
      }
    }
    
    return upperName;
  }

  /**
   * Normaliza o valor numérico
   */
  private normalizeValue(value: string): string {
    return value.replace(',', '.').trim();
  }

  /**
   * Detecta valores alterados comparando com referências
   */
  private detectAlteredValues(exams: ExamResult[]): ExamResult[] {
    return exams.map(exam => {
      const refConfig = REFERENCE_VALUES[exam.name];
      if (!refConfig) {
        return exam;
      }

      const numValue = parseFloat(exam.value);
      if (isNaN(numValue)) {
        return exam;
      }

      let isAltered = false;
      let alertType: 'HIGH' | 'LOW' | undefined;

      if (refConfig.min !== undefined && numValue < refConfig.min) {
        isAltered = true;
        alertType = 'LOW';
      } else if (refConfig.max !== undefined && numValue > refConfig.max) {
        isAltered = true;
        alertType = 'HIGH';
      }

      return {
        ...exam,
        isAltered,
        alertType,
      };
    });
  }

  /**
   * Extrai dados do laudo evolutivo (histórico)
   */
  private extractEvolutiveReport(text: string, laboratory: LaboratoryInfo): Map<string, ExamResult[]> | null {
    const evolutiveData = new Map<string, ExamResult[]>();
    
    // Detectar se há laudo evolutivo
    if (!/laudo evolutivo/i.test(text)) {
      return null;
    }

    // Extrair seção do laudo evolutivo
    const evolutiveMatch = text.match(/laudo evolutivo[\s\S]*?(?=CRM:|$)/i);
    if (!evolutiveMatch) {
      return null;
    }

    const evolutiveSection = evolutiveMatch[0];
    
    // Extrair datas das colunas
    const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
    const dates: string[] = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(evolutiveSection)) !== null) {
      if (!dates.includes(dateMatch[1])) {
        dates.push(dateMatch[1]);
      }
    }

    // Inicializar mapa com datas
    for (const date of dates) {
      evolutiveData.set(date, []);
    }

    return evolutiveData.size > 0 ? evolutiveData : null;
  }

  /**
   * Atualiza média de exames por PDF
   */
  private updateAverageExams(examCount: number): void {
    const total = this.extractionStats.successfulExtractions;
    const currentAvg = this.extractionStats.averageExamsPerPdf;
    this.extractionStats.averageExamsPerPdf = 
      (currentAvg * (total - 1) + examCount) / total;
  }

  /**
   * Registra correção para feedback loop (Opção 1)
   */
  public async logCorrection(correction: CorrectionLog): Promise<void> {
    this.extractionStats.correctionsApplied++;
    // Será implementado com integração ao banco de dados
    console.log('[ExamExtraction] Correção registrada:', correction);
  }

  /**
   * Retorna estatísticas de extração
   */
  public getStats(): typeof this.extractionStats {
    return { ...this.extractionStats };
  }

  /**
   * Reseta estatísticas (para testes)
   */
  public resetStats(): void {
    this.extractionStats = {
      totalProcessed: 0,
      successfulExtractions: 0,
      failedExtractions: 0,
      correctionsApplied: 0,
      averageExamsPerPdf: 0,
    };
  }
}

export default ExamExtractionService;
