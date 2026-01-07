import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Pacientes - 33 campos conforme especificação
 */
export const pacientes = mysqlTable("pacientes", {
  id: int("id").autoincrement().primaryKey(),
  idPaciente: varchar("id_paciente", { length: 64 }).notNull().unique(), // ex: 2025-0000001
  dataInclusao: date("data_inclusao"),
  pastaPaciente: varchar("pasta_paciente", { length: 255 }),
  nome: varchar("nome", { length: 255 }).notNull(),
  dataNascimento: date("data_nascimento"),
  sexo: mysqlEnum("sexo", ["M", "F", "Outro"]),
  cpf: varchar("cpf", { length: 14 }),
  nomeMae: varchar("nome_mae", { length: 255 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: varchar("endereco", { length: 500 }),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  pais: varchar("pais", { length: 100 }).default("Brasil"),
  
  // Convênio 1
  operadora1: varchar("operadora_1", { length: 100 }),
  planoModalidade1: varchar("plano_modalidade_1", { length: 100 }),
  matriculaConvenio1: varchar("matricula_convenio_1", { length: 100 }),
  vigente1: varchar("vigente_1", { length: 50 }),
  privativo1: varchar("privativo_1", { length: 50 }),
  
  // Convênio 2
  operadora2: varchar("operadora_2", { length: 100 }),
  planoModalidade2: varchar("plano_modalidade_2", { length: 100 }),
  matriculaConvenio2: varchar("matricula_convenio_2", { length: 100 }),
  vigente2: varchar("vigente_2", { length: 50 }),
  privativo2: varchar("privativo_2", { length: 50 }),
  
  // Status e Diagnóstico
  obitoPerda: varchar("obito_perda", { length: 100 }),
  dataObitoLastFU: date("data_obito_last_fu"),
  statusCaso: varchar("status_caso", { length: 50 }).default("Ativo"),
  grupoDiagnostico: varchar("grupo_diagnostico", { length: 100 }),
  diagnosticoEspecifico: text("diagnostico_especifico"),
  tempoSeguimentoAnos: decimal("tempo_seguimento_anos", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

/**
 * Tabela de Atendimentos - 26 campos principais conforme especificação
 */
export const atendimentos = mysqlTable("atendimentos", {
  id: int("id").autoincrement().primaryKey(),
  atendimento: varchar("atendimento", { length: 64 }).notNull().unique(), // ex: 20260001
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id), // Relacionamento via ID
  dataAtendimento: timestamp("data_atendimento").notNull(),
  semana: int("semana"),
  tipoAtendimento: varchar("tipo_atendimento", { length: 100 }), // Consulta, Visita Internado, Cirurgia
  procedimento: varchar("procedimento", { length: 255 }),
  codigosCBHPM: text("codigos_cbhpm"),
  nomePaciente: varchar("nome_paciente", { length: 255 }), // Mantido para compatibilidade
  local: varchar("local", { length: 100 }), // HMV, Consultório, etc
  convenio: varchar("convenio", { length: 100 }),
  planoConvenio: varchar("plano_convenio", { length: 100 }),
  
  // Pagamento
  pagamentoEfetivado: boolean("pagamento_efetivado").default(false),
  pagamentoPostergado: varchar("pagamento_postergado", { length: 50 }),
  dataEnvioFaturamento: date("data_envio_faturamento"),
  dataEsperadaPagamento: date("data_esperada_pagamento"),
  faturamentoPrevisto: decimal("faturamento_previsto", { precision: 10, scale: 2 }),
  registroManualValorHM: decimal("registro_manual_valor_hm", { precision: 10, scale: 2 }),
  faturamentoPrevistoFinal: decimal("faturamento_previsto_final", { precision: 10, scale: 2 }),
  dataPagamento: date("data_pagamento"),
  notaFiscalCorrespondente: varchar("nota_fiscal_correspondente", { length: 100 }),
  observacoes: text("observacoes"),
  
  // Faturamento adicional
  faturamentoLeticia: decimal("faturamento_leticia", { precision: 10, scale: 2 }),
  faturamentoAGLU: decimal("faturamento_ag_lu", { precision: 10, scale: 2 }),
  
  // Campos calculados/auxiliares
  mes: int("mes"),
  ano: int("ano"),
  trimestre: varchar("trimestre", { length: 10 }),
  trimestreAno: varchar("trimestre_ano", { length: 20 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Atendimento = typeof atendimentos.$inferSelect;
export type InsertAtendimento = typeof atendimentos.$inferInsert;
