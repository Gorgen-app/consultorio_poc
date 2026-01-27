/**
 * Schema de Banco de Dados para Extração de Exames
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Versão: 2.0.0
 * 
 * Tabelas para suporte ao ciclo de feedback e melhoria contínua:
 * - examCorrections: Log de correções feitas pelos usuários (Opção 1)
 * - laboratoryTemplates: Templates configuráveis por laboratório (Opção 2)
 * - mlFewShotExamples: Exemplos para treinamento ML (Opção 3)
 * - extractionLogs: Logs de extração para auditoria
 */

import { mysqlTable, int, varchar, text, boolean, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";
import { users, tenants, pacientes } from "./schema";

/**
 * Tabela de Correções de Extração (Opção 1 - Feedback Loop Manual)
 * 
 * Registra todas as correções feitas pelos usuários para:
 * 1. Análise de padrões de erro
 * 2. Geração de relatórios de acurácia
 * 3. Sugestões de melhorias no algoritmo
 */
export const examCorrections = mysqlTable("exam_corrections", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do PDF
  pdfHash: varchar("pdf_hash", { length: 64 }).notNull(),
  pdfFileName: varchar("pdf_file_name", { length: 255 }),
  
  // Laboratório identificado
  laboratory: varchar("laboratory", { length: 100 }).notNull(),
  
  // Campo/Exame corrigido
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  
  // Valores
  originalValue: text("original_value").notNull(),
  correctedValue: text("corrected_value").notNull(),
  
  // Tipo de correção
  correctionType: mysqlEnum("correction_type", [
    "VALUE",          // Valor numérico incorreto
    "NAME",           // Nome do exame incorreto
    "UNIT",           // Unidade incorreta
    "REFERENCE",      // Valor de referência incorreto
    "MISSING",        // Exame não foi extraído
    "FALSE_POSITIVE", // Exame extraído que não existe
  ]).notNull(),
  
  // Contexto adicional
  context: text("context"), // Linha original do PDF para debug
  notes: text("notes"),     // Observações do usuário
  
  // Rastreabilidade (Pilar do Gorgen)
  userId: int("user_id").notNull().references(() => users.id),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Status de aplicação ao código
  appliedToCode: boolean("applied_to_code").default(false),
  appliedAt: timestamp("applied_at"),
  appliedBy: int("applied_by").references(() => users.id),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type ExamCorrection = typeof examCorrections.$inferSelect;
export type InsertExamCorrection = typeof examCorrections.$inferInsert;

/**
 * Tabela de Templates de Laboratório (Opção 2 - Templates Configuráveis)
 * 
 * Permite que administradores configurem padrões de extração
 * específicos para cada laboratório sem alterar código.
 */
export const laboratoryTemplates = mysqlTable("laboratory_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do laboratório
  name: varchar("name", { length: 100 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  
  // Padrões de identificação (array de regex)
  identificationPatterns: json("identification_patterns").$type<string[]>().notNull(),
  
  // Mapeamento de campos (JSON estruturado)
  fieldMappings: json("field_mappings").$type<{
    standardName: string;
    patterns: string[];
    expectedUnit?: string;
    position?: { line?: number; column?: number };
  }[]>(),
  
  // Configurações específicas
  dateFormat: varchar("date_format", { length: 50 }).default("DD/MM/YYYY"),
  decimalSeparator: varchar("decimal_separator", { length: 1 }).default(","),
  hasEvolutiveReport: boolean("has_evolutive_report").default(false),
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: int("priority").default(0), // Maior = verificado primeiro
  
  // Rastreabilidade
  createdBy: int("created_by").notNull().references(() => users.id),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type LaboratoryTemplate = typeof laboratoryTemplates.$inferSelect;
export type InsertLaboratoryTemplate = typeof laboratoryTemplates.$inferInsert;

/**
 * Tabela de Exemplos Few-Shot para ML (Opção 3 - ML com Fine-tuning)
 * 
 * Armazena exemplos validados para treinamento do modelo ML.
 * Cada exemplo é um par (input, output) validado por um usuário.
 */
export const mlFewShotExamples = mysqlTable("ml_few_shot_examples", {
  id: int("id").autoincrement().primaryKey(),
  
  // Texto de entrada (trecho do PDF)
  inputText: text("input_text").notNull(),
  
  // Saída esperada (JSON de exames)
  expectedOutput: json("expected_output").$type<{
    name: string;
    value: string;
    unit: string;
    reference: string;
    isAltered: boolean;
    alertType?: 'HIGH' | 'LOW';
  }[]>().notNull(),
  
  // Metadados do exemplo
  laboratory: varchar("laboratory", { length: 100 }),
  examType: mysqlEnum("exam_type", [
    "LABORATORIAL",
    "IMAGEM",
    "ANATOMOPATOLOGICO",
    "ENDOSCOPIA",
    "CARDIOLOGIA",
  ]).default("LABORATORIAL"),
  
  // Qualidade do exemplo
  quality: mysqlEnum("quality", [
    "VALIDATED",    // Validado por especialista
    "CORRECTED",    // Gerado a partir de correção
    "GENERATED",    // Gerado automaticamente
  ]).default("CORRECTED"),
  
  // Uso no treinamento
  usedInTraining: boolean("used_in_training").default(false),
  trainingBatchId: varchar("training_batch_id", { length: 64 }),
  
  // Rastreabilidade
  createdBy: int("created_by").notNull().references(() => users.id),
  validatedBy: int("validated_by").references(() => users.id),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type MLFewShotExample = typeof mlFewShotExamples.$inferSelect;
export type InsertMLFewShotExample = typeof mlFewShotExamples.$inferInsert;

/**
 * Tabela de Logs de Extração (Auditoria)
 * 
 * Registra todas as extrações realizadas para:
 * 1. Auditoria de uso
 * 2. Análise de performance
 * 3. Rastreabilidade (Pilar do Gorgen)
 */
export const extractionLogs = mysqlTable("extraction_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do PDF
  pdfHash: varchar("pdf_hash", { length: 64 }).notNull(),
  pdfFileName: varchar("pdf_file_name", { length: 255 }),
  
  // Resultado da extração
  success: boolean("success").notNull(),
  documentType: varchar("document_type", { length: 50 }),
  laboratory: varchar("laboratory", { length: 100 }),
  
  // Estatísticas
  examsExtracted: int("exams_extracted").default(0),
  examsAltered: int("exams_altered").default(0),
  processingTimeMs: int("processing_time_ms"),
  
  // Método de extração
  extractionMethod: mysqlEnum("extraction_method", [
    "REGEX",        // Extração por regex (padrão)
    "TEMPLATE",     // Extração por template
    "ML",           // Extração por ML
    "HYBRID",       // Combinação de métodos
  ]).default("REGEX"),
  
  // Erros (se houver)
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  
  // Paciente associado (se identificado)
  pacienteId: int("paciente_id").references(() => pacientes.id),
  patientName: varchar("patient_name", { length: 255 }),
  examDate: varchar("exam_date", { length: 10 }),
  
  // Rastreabilidade
  userId: int("user_id").notNull().references(() => users.id),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Contexto
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
});

export type ExtractionLog = typeof extractionLogs.$inferSelect;
export type InsertExtractionLog = typeof extractionLogs.$inferInsert;

/**
 * Tabela de Sinônimos de Exames (Extensível)
 * 
 * Permite adicionar novos sinônimos sem alterar código.
 * Complementa os sinônimos hardcoded no config.ts
 */
export const examSynonyms = mysqlTable("exam_synonyms", {
  id: int("id").autoincrement().primaryKey(),
  
  // Nome padronizado do exame
  standardName: varchar("standard_name", { length: 100 }).notNull(),
  
  // Sinônimo encontrado
  synonym: varchar("synonym", { length: 100 }).notNull(),
  
  // Origem do sinônimo
  source: mysqlEnum("source", [
    "SYSTEM",       // Definido no sistema
    "CORRECTION",   // Gerado a partir de correção
    "MANUAL",       // Adicionado manualmente
  ]).default("CORRECTION"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Rastreabilidade
  createdBy: int("created_by").references(() => users.id),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
});

export type ExamSynonym = typeof examSynonyms.$inferSelect;
export type InsertExamSynonym = typeof examSynonyms.$inferInsert;

/**
 * Tabela de Valores de Referência Customizados
 * 
 * Permite customizar valores de referência por:
 * - Laboratório
 * - Faixa etária
 * - Sexo
 */
export const customReferenceValues = mysqlTable("custom_reference_values", {
  id: int("id").autoincrement().primaryKey(),
  
  // Exame
  examName: varchar("exam_name", { length: 100 }).notNull(),
  
  // Laboratório (null = todos)
  laboratory: varchar("laboratory", { length: 100 }),
  
  // Valores de referência
  minValue: varchar("min_value", { length: 50 }),
  maxValue: varchar("max_value", { length: 50 }),
  unit: varchar("unit", { length: 50 }),
  
  // Filtros
  gender: mysqlEnum("gender", ["M", "F", "BOTH"]).default("BOTH"),
  ageMin: int("age_min"),
  ageMax: int("age_max"),
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: int("priority").default(0),
  
  // Rastreabilidade
  createdBy: int("created_by").notNull().references(() => users.id),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CustomReferenceValue = typeof customReferenceValues.$inferSelect;
export type InsertCustomReferenceValue = typeof customReferenceValues.$inferInsert;
