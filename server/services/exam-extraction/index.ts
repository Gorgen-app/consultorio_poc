/**
 * Módulo de Extração de Exames
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Exporta todos os componentes do serviço de extração
 */

export { ExamExtractionService } from './ExamExtractionService';
export * from './types';
export * from './config';
export { FeedbackLoopService } from './FeedbackLoopService';
export { MLExtractionService } from './MLExtractionService';
export { PatientIntegrationService, createDrizzleAdapter } from './PatientIntegrationService';
export type { PatientIntegrationConfig, PatientSearchResult, ProntuarioInsertResult, DatabaseAdapter } from './PatientIntegrationService';
