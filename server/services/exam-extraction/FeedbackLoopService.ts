/**
 * Serviço de Feedback Loop para Extração de Exames
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Opção 1: Feedback Loop Manual
 * 
 * Este serviço gerencia o ciclo de feedback para melhoria contínua:
 * 1. Registra correções feitas pelos usuários
 * 2. Armazena padrões de erro para análise
 * 3. Gera relatórios de acurácia
 * 4. Prepara dados para atualização do algoritmo
 */

import { CorrectionLog, ExtractionStats } from './types';

export class FeedbackLoopService {
  private static instance: FeedbackLoopService;
  
  // Cache de correções pendentes (antes de persistir no banco)
  private pendingCorrections: CorrectionLog[] = [];
  
  // Estatísticas de correções
  private correctionStats = {
    totalCorrections: 0,
    byType: new Map<string, number>(),
    byLaboratory: new Map<string, number>(),
    byField: new Map<string, number>(),
  };

  private constructor() {}

  public static getInstance(): FeedbackLoopService {
    if (!FeedbackLoopService.instance) {
      FeedbackLoopService.instance = new FeedbackLoopService();
    }
    return FeedbackLoopService.instance;
  }

  /**
   * Registra uma correção feita pelo usuário
   * @param correction Dados da correção
   */
  public async logCorrection(correction: CorrectionLog): Promise<void> {
    // Adicionar timestamp
    correction.createdAt = new Date();
    
    // Adicionar ao cache
    this.pendingCorrections.push(correction);
    
    // Atualizar estatísticas
    this.updateStats(correction);
    
    // Se houver muitas correções pendentes, persistir
    if (this.pendingCorrections.length >= 10) {
      await this.persistCorrections();
    }
    
    console.log('[FeedbackLoop] Correção registrada:', {
      field: correction.fieldName,
      type: correction.correctionType,
      laboratory: correction.laboratory,
    });
  }

  /**
   * Atualiza estatísticas de correções
   */
  private updateStats(correction: CorrectionLog): void {
    this.correctionStats.totalCorrections++;
    
    // Por tipo
    const typeCount = this.correctionStats.byType.get(correction.correctionType) || 0;
    this.correctionStats.byType.set(correction.correctionType, typeCount + 1);
    
    // Por laboratório
    const labCount = this.correctionStats.byLaboratory.get(correction.laboratory) || 0;
    this.correctionStats.byLaboratory.set(correction.laboratory, labCount + 1);
    
    // Por campo
    const fieldCount = this.correctionStats.byField.get(correction.fieldName) || 0;
    this.correctionStats.byField.set(correction.fieldName, fieldCount + 1);
  }

  /**
   * Persiste correções pendentes no banco de dados
   * Será implementado com integração ao Drizzle ORM
   */
  public async persistCorrections(): Promise<void> {
    if (this.pendingCorrections.length === 0) return;
    
    // TODO: Implementar persistência com Drizzle
    // const db = getDb();
    // await db.insert(examCorrections).values(this.pendingCorrections);
    
    console.log(`[FeedbackLoop] Persistindo ${this.pendingCorrections.length} correções`);
    
    // Limpar cache
    this.pendingCorrections = [];
  }

  /**
   * Obtém correções pendentes de aplicação ao código
   */
  public async getPendingCodeUpdates(): Promise<CorrectionLog[]> {
    // TODO: Buscar do banco correções com appliedToCode = false
    // const db = getDb();
    // return await db.select().from(examCorrections).where(eq(examCorrections.appliedToCode, false));
    
    return this.pendingCorrections.filter(c => !c.appliedToCode);
  }

  /**
   * Marca correções como aplicadas ao código
   */
  public async markCorrectionsAsApplied(correctionIds: number[]): Promise<void> {
    // TODO: Atualizar no banco
    // const db = getDb();
    // await db.update(examCorrections)
    //   .set({ appliedToCode: true })
    //   .where(inArray(examCorrections.id, correctionIds));
    
    console.log(`[FeedbackLoop] ${correctionIds.length} correções marcadas como aplicadas`);
  }

  /**
   * Gera relatório de acurácia do algoritmo
   */
  public generateAccuracyReport(): {
    totalExtractions: number;
    totalCorrections: number;
    accuracyRate: number;
    topErrorFields: Array<{ field: string; count: number }>;
    topErrorLabs: Array<{ lab: string; count: number }>;
    correctionsByType: Array<{ type: string; count: number }>;
  } {
    const totalExtractions = 1000; // TODO: Buscar do banco
    const totalCorrections = this.correctionStats.totalCorrections;
    const accuracyRate = totalExtractions > 0 
      ? ((totalExtractions - totalCorrections) / totalExtractions) * 100 
      : 100;

    // Top campos com erro
    const topErrorFields = Array.from(this.correctionStats.byField.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top laboratórios com erro
    const topErrorLabs = Array.from(this.correctionStats.byLaboratory.entries())
      .map(([lab, count]) => ({ lab, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Correções por tipo
    const correctionsByType = Array.from(this.correctionStats.byType.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalExtractions,
      totalCorrections,
      accuracyRate,
      topErrorFields,
      topErrorLabs,
      correctionsByType,
    };
  }

  /**
   * Sugere melhorias no algoritmo baseado nas correções
   */
  public suggestImprovements(): Array<{
    type: 'NEW_SYNONYM' | 'NEW_PATTERN' | 'NEW_LABORATORY' | 'REFERENCE_UPDATE';
    description: string;
    data: Record<string, unknown>;
  }> {
    const suggestions: Array<{
      type: 'NEW_SYNONYM' | 'NEW_PATTERN' | 'NEW_LABORATORY' | 'REFERENCE_UPDATE';
      description: string;
      data: Record<string, unknown>;
    }> = [];

    // Analisar correções de tipo NAME para sugerir novos sinônimos
    const nameCorrections = this.pendingCorrections.filter(c => c.correctionType === 'NAME');
    for (const correction of nameCorrections) {
      suggestions.push({
        type: 'NEW_SYNONYM',
        description: `Adicionar "${correction.originalValue}" como sinônimo de "${correction.correctedValue}"`,
        data: {
          standardName: correction.correctedValue,
          newSynonym: correction.originalValue,
        },
      });
    }

    // Analisar laboratórios desconhecidos
    const unknownLabCorrections = this.pendingCorrections.filter(
      c => c.laboratory === 'DESCONHECIDO'
    );
    const labCounts = new Map<string, number>();
    for (const correction of unknownLabCorrections) {
      const count = labCounts.get(correction.fieldName) || 0;
      labCounts.set(correction.fieldName, count + 1);
    }
    
    for (const [lab, count] of labCounts.entries()) {
      if (count >= 3) {
        suggestions.push({
          type: 'NEW_LABORATORY',
          description: `Considerar adicionar padrão para laboratório frequente: ${lab}`,
          data: { laboratoryName: lab, occurrences: count },
        });
      }
    }

    return suggestions;
  }

  /**
   * Exporta correções para análise externa
   */
  public exportCorrections(): string {
    const report = {
      exportDate: new Date().toISOString(),
      stats: this.correctionStats,
      corrections: this.pendingCorrections,
      suggestions: this.suggestImprovements(),
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Limpa estatísticas (para testes)
   */
  public resetStats(): void {
    this.pendingCorrections = [];
    this.correctionStats = {
      totalCorrections: 0,
      byType: new Map(),
      byLaboratory: new Map(),
      byField: new Map(),
    };
  }
}

export default FeedbackLoopService;
