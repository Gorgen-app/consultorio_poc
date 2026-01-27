/**
 * Serviço de Extração via Machine Learning
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Opção 3: ML com Fine-tuning
 * 
 * Este serviço utiliza LLMs para extração inteligente de exames:
 * 1. Usa GPT-4.1-mini para extração de texto não estruturado
 * 2. Aplica few-shot learning com exemplos validados
 * 3. Permite fine-tuning com dados de correções
 * 
 * NOTA: Este serviço está preparado para implementação futura.
 * A ativação requer configuração de API e custos associados.
 */

import { ExamResult, MLExtractionConfig, FewShotExample } from './types';
import { ML_EXTRACTION_CONFIG, EXAM_SYNONYMS, REFERENCE_VALUES } from './config';

export class MLExtractionService {
  private static instance: MLExtractionService;
  
  // Configuração atual
  private config: MLExtractionConfig;
  
  // Cache de exemplos few-shot
  private fewShotExamples: FewShotExample[] = [];
  
  // Estatísticas de uso
  private usageStats = {
    totalCalls: 0,
    totalTokens: 0,
    averageLatencyMs: 0,
    successRate: 0,
  };

  // Flag para ativação do serviço
  private isEnabled: boolean = false;

  private constructor() {
    this.config = ML_EXTRACTION_CONFIG;
    this.loadFewShotExamples();
  }

  public static getInstance(): MLExtractionService {
    if (!MLExtractionService.instance) {
      MLExtractionService.instance = new MLExtractionService();
    }
    return MLExtractionService.instance;
  }

  /**
   * Verifica se o serviço está habilitado
   */
  public isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Habilita o serviço ML
   * Requer API key configurada
   */
  public enable(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada. ML Extraction não pode ser habilitado.');
    }
    this.isEnabled = true;
    console.log('[MLExtraction] Serviço habilitado');
  }

  /**
   * Desabilita o serviço ML
   */
  public disable(): void {
    this.isEnabled = false;
    console.log('[MLExtraction] Serviço desabilitado');
  }

  /**
   * Carrega exemplos few-shot do banco de dados
   */
  private async loadFewShotExamples(): Promise<void> {
    // Exemplos hardcoded para início
    // TODO: Carregar do banco de dados (correções validadas)
    this.fewShotExamples = [
      {
        input: `HEMOGRAMA COMPLETO
Eritrócitos: 4.85 milhões/mm³ (4.32-5.67)
Hemoglobina: 14.8 g/dL (13.3-16.5)
Hematócrito: 44.2% (39.2-49.0)
Leucócitos: 6.540/mm³ (3.650-8.120)
Plaquetas: 245.000/mm³ (151.000-304.000)`,
        output: [
          { name: 'HEMÁCIAS', value: '4.85', unit: 'milhões/mm³', reference: '4.32-5.67', isAltered: false },
          { name: 'HEMOGLOBINA', value: '14.8', unit: 'g/dL', reference: '13.3-16.5', isAltered: false },
          { name: 'HEMATÓCRITO', value: '44.2', unit: '%', reference: '39.2-49.0', isAltered: false },
          { name: 'LEUCÓCITOS', value: '6540', unit: '/mm³', reference: '3650-8120', isAltered: false },
          { name: 'PLAQUETAS', value: '245000', unit: '/mm³', reference: '151000-304000', isAltered: false },
        ],
      },
      {
        input: `PERFIL HEPÁTICO
TGO (AST): 85 U/L (até 40)
TGP (ALT): 120 U/L (até 41)
Gama GT: 250 U/L (12-73)
Fosfatase Alcalina: 95 U/L (40-129)
Bilirrubina Total: 1.8 mg/dL (0.20-1.10)`,
        output: [
          { name: 'TGO/AST', value: '85', unit: 'U/L', reference: '<40', isAltered: true, alertType: 'HIGH' },
          { name: 'TGP/ALT', value: '120', unit: 'U/L', reference: '<41', isAltered: true, alertType: 'HIGH' },
          { name: 'GAMA GT', value: '250', unit: 'U/L', reference: '12-73', isAltered: true, alertType: 'HIGH' },
          { name: 'FOSFATASE ALCALINA', value: '95', unit: 'U/L', reference: '40-129', isAltered: false },
          { name: 'BILIRRUBINA TOTAL', value: '1.8', unit: 'mg/dL', reference: '0.20-1.10', isAltered: true, alertType: 'HIGH' },
        ],
      },
    ];
  }

  /**
   * Extrai exames usando LLM
   * @param pdfText Texto do PDF
   * @returns Lista de exames extraídos
   */
  public async extractWithML(pdfText: string): Promise<ExamResult[]> {
    if (!this.isEnabled) {
      throw new Error('MLExtractionService não está habilitado. Use enable() primeiro.');
    }

    const startTime = Date.now();
    this.usageStats.totalCalls++;

    try {
      // Construir prompt com few-shot examples
      const prompt = this.buildPrompt(pdfText);
      
      // Chamar API OpenAI
      const response = await this.callOpenAI(prompt);
      
      // Parsear resposta
      const exams = this.parseResponse(response);
      
      // Normalizar nomes usando sinônimos
      const normalizedExams = this.normalizeExams(exams);
      
      // Detectar valores alterados
      const examsWithAlerts = this.detectAlteredValues(normalizedExams);
      
      // Atualizar estatísticas
      const latency = Date.now() - startTime;
      this.updateStats(latency, true);
      
      return examsWithAlerts;

    } catch (error) {
      this.updateStats(Date.now() - startTime, false);
      console.error('[MLExtraction] Erro na extração:', error);
      throw error;
    }
  }

  /**
   * Constrói o prompt com exemplos few-shot
   */
  private buildPrompt(pdfText: string): string {
    let prompt = this.config.basePrompt + '\n\n';
    
    // Adicionar exemplos few-shot
    prompt += '## Exemplos:\n\n';
    for (const example of this.fewShotExamples.slice(0, 3)) {
      prompt += `### Entrada:\n${example.input}\n\n`;
      prompt += `### Saída:\n${JSON.stringify(example.output, null, 2)}\n\n`;
    }
    
    // Adicionar texto do PDF
    prompt += `## Texto do laudo para análise:\n${pdfText.substring(0, 8000)}\n\n`;
    prompt += '## Extraia todos os exames no formato JSON:';
    
    return prompt;
  }

  /**
   * Chama a API OpenAI
   */
  private async callOpenAI(prompt: string): Promise<string> {
    // Usar OpenAI SDK (import dinâmico para evitar dependência obrigatória)
    // @ts-ignore - openai será instalado quando ML for ativado
    const OpenAI = await import('openai' as string);
    const client = new OpenAI.default();
    
    const response = await client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: 'Você é um especialista em extração de dados de exames laboratoriais.' },
        { role: 'user', content: prompt },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    // Atualizar contagem de tokens
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.total_tokens;
    }

    return response.choices[0]?.message?.content || '[]';
  }

  /**
   * Parseia a resposta do LLM
   */
  private parseResponse(response: string): ExamResult[] {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('[MLExtraction] Nenhum JSON encontrado na resposta');
        return [];
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        console.warn('[MLExtraction] Resposta não é um array');
        return [];
      }
      
      return parsed;
    } catch (error) {
      console.error('[MLExtraction] Erro ao parsear resposta:', error);
      return [];
    }
  }

  /**
   * Normaliza nomes de exames usando sinônimos
   */
  private normalizeExams(exams: ExamResult[]): ExamResult[] {
    return exams.map(exam => {
      const upperName = exam.name.toUpperCase().trim();
      
      for (const [standardName, synonyms] of Object.entries(EXAM_SYNONYMS)) {
        if (synonyms.some(s => upperName.includes(s.toUpperCase()))) {
          return { ...exam, name: standardName };
        }
      }
      
      return exam;
    });
  }

  /**
   * Detecta valores alterados
   */
  private detectAlteredValues(exams: ExamResult[]): ExamResult[] {
    return exams.map(exam => {
      const refConfig = REFERENCE_VALUES[exam.name];
      if (!refConfig) return exam;

      const numValue = parseFloat(exam.value);
      if (isNaN(numValue)) return exam;

      let isAltered = false;
      let alertType: 'HIGH' | 'LOW' | undefined;

      if (refConfig.min !== undefined && numValue < refConfig.min) {
        isAltered = true;
        alertType = 'LOW';
      } else if (refConfig.max !== undefined && numValue > refConfig.max) {
        isAltered = true;
        alertType = 'HIGH';
      }

      return { ...exam, isAltered, alertType };
    });
  }

  /**
   * Atualiza estatísticas de uso
   */
  private updateStats(latencyMs: number, success: boolean): void {
    const total = this.usageStats.totalCalls;
    const currentAvg = this.usageStats.averageLatencyMs;
    this.usageStats.averageLatencyMs = (currentAvg * (total - 1) + latencyMs) / total;
    
    if (success) {
      const successCount = this.usageStats.successRate * (total - 1);
      this.usageStats.successRate = (successCount + 1) / total;
    } else {
      const successCount = this.usageStats.successRate * (total - 1);
      this.usageStats.successRate = successCount / total;
    }
  }

  /**
   * Adiciona exemplo few-shot validado
   */
  public addFewShotExample(example: FewShotExample): void {
    this.fewShotExamples.push(example);
    console.log('[MLExtraction] Novo exemplo few-shot adicionado');
  }

  /**
   * Retorna estatísticas de uso
   */
  public getStats(): typeof this.usageStats {
    return { ...this.usageStats };
  }

  /**
   * Estima custo de extração
   * @param textLength Tamanho do texto em caracteres
   * @returns Custo estimado em USD
   */
  public estimateCost(textLength: number): number {
    // Estimativa: ~4 caracteres por token
    const inputTokens = Math.ceil(textLength / 4);
    const outputTokens = 500; // Estimativa para resposta
    
    // Preços GPT-4.1-mini (estimados)
    const inputCostPer1K = 0.00015;
    const outputCostPer1K = 0.0006;
    
    return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
  }

  /**
   * Atualiza configuração do modelo
   */
  public updateConfig(newConfig: Partial<MLExtractionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[MLExtraction] Configuração atualizada');
  }

  /**
   * Reseta estatísticas (para testes)
   */
  public resetStats(): void {
    this.usageStats = {
      totalCalls: 0,
      totalTokens: 0,
      averageLatencyMs: 0,
      successRate: 0,
    };
  }
}

export default MLExtractionService;
