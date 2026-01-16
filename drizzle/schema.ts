import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean, json, datetime, index, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Tabela de Tenants - Multi-tenant architecture
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 20 }),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  logoUrl: varchar("logo_url", { length: 500 }),
  plano: mysqlEnum("plano", ["free", "basic", "professional", "enterprise"]).default("free"),
  status: mysqlEnum("status", ["ativo", "inativo", "suspenso"]).default("ativo"),
  dataExpiracaoPlano: timestamp("data_expiracao_plano"),
  maxUsuarios: int("max_usuarios").default(5),
  maxPacientes: int("max_pacientes").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Tabela de Autorizações de Pacientes - Compartilhamento Cross-Tenant
 * Permite que um paciente autorize o compartilhamento de seus dados entre diferentes clínicas/tenants
 */
export const pacienteAutorizacoes = mysqlTable("paciente_autorizacoes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tenant de origem (onde os dados estão armazenados)
  tenantOrigemId: int("tenant_origem_id").notNull().references(() => tenants.id),
  
  // Tenant de destino (quem receberá acesso aos dados)
  tenantDestinoId: int("tenant_destino_id").notNull().references(() => tenants.id),
  
  // Paciente que está concedendo a autorização
  pacienteId: int("paciente_id").notNull(),
  
  // Usuário que criou a autorização (pode ser o próprio paciente ou um admin)
  criadoPorUserId: int("criado_por_user_id").notNull(),
  
  // Tipo de autorização
  tipoAutorizacao: mysqlEnum("tipo_autorizacao", [
    "leitura",      // Apenas visualização
    "escrita",      // Pode adicionar registros
    "completo"      // Acesso total (leitura + escrita + histórico)
  ]).default("leitura"),
  
  // Escopo da autorização - quais dados podem ser acessados
  escopoAutorizacao: mysqlEnum("escopo_autorizacao", [
    "prontuario",        // Apenas prontuário médico
    "atendimentos",      // Apenas atendimentos
    "exames",            // Apenas exames
    "documentos",        // Apenas documentos
    "completo"           // Todos os dados do paciente
  ]).default("completo"),
  
  // Período de validade
  dataInicio: timestamp("data_inicio").defaultNow(),
  dataFim: timestamp("data_fim"),
  
  // Motivo/justificativa da autorização
  motivo: text("motivo"),
  
  // Status da autorização
  status: mysqlEnum("status", [
    "pendente",    // Aguardando aprovação
    "ativa",       // Autorização válida
    "revogada",    // Revogada pelo paciente ou admin
    "expirada",    // Passou da data de validade
    "rejeitada"    // Rejeitada pelo paciente
  ]).default("pendente"),
  
  // Consentimento LGPD
  consentimentoLGPD: boolean("consentimento_lgpd").default(false),
  dataConsentimento: timestamp("data_consentimento"),
  ipConsentimento: varchar("ip_consentimento", { length: 45 }),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PacienteAutorizacao = typeof pacienteAutorizacoes.$inferSelect;
export type InsertPacienteAutorizacao = typeof pacienteAutorizacoes.$inferInsert;

/**
 * Tabela de Logs de Acesso Cross-Tenant
 * Registra todos os acessos realizados através de autorizações cross-tenant
 */
export const crossTenantAccessLogs = mysqlTable("cross_tenant_access_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referência à autorização utilizada
  autorizacaoId: int("autorizacao_id").notNull().references(() => pacienteAutorizacoes.id),
  
  // Tenants envolvidos
  tenantOrigemId: int("tenant_origem_id").notNull().references(() => tenants.id),
  tenantDestinoId: int("tenant_destino_id").notNull().references(() => tenants.id),
  
  // Paciente acessado
  pacienteId: int("paciente_id").notNull(),
  
  // Usuário que realizou o acesso
  userId: int("user_id").notNull(),
  
  // Tipo de ação realizada
  tipoAcao: mysqlEnum("tipo_acao", [
    "visualizacao",      // Visualizou dados
    "download",          // Baixou documento/exame
    "impressao",         // Imprimiu dados
    "criacao",           // Criou novo registro
    "edicao",            // Editou registro existente
    "exportacao"         // Exportou dados
  ]).notNull(),
  
  // Recurso acessado
  recursoTipo: varchar("recurso_tipo", { length: 50 }).notNull(), // prontuario, atendimento, exame, etc.
  recursoId: int("recurso_id"),
  
  // Detalhes adicionais
  detalhes: text("detalhes"),
  
  // Informações de contexto
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

export type CrossTenantAccessLog = typeof crossTenantAccessLogs.$inferSelect;
export type InsertCrossTenantAccessLog = typeof crossTenantAccessLogs.$inferInsert;

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1).references(() => tenants.id),
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
  tenantId: int("tenant_id").notNull().default(1).references(() => tenants.id),
  idPaciente: varchar("id_paciente", { length: 64 }).notNull(), // ex: 2025-0000001
  codigoLegado: varchar("codigo_legado", { length: 64 }), // ID do sistema anterior para migração
  dataInclusao: date("data_inclusao"),
  pastaPaciente: varchar("pasta_paciente", { length: 255 }),
  nome: varchar("nome", { length: 255 }).notNull(),
  dataNascimento: date("data_nascimento"),
  sexo: mysqlEnum("sexo", ["M", "F", "Outro"]),
  cpf: varchar("cpf", { length: 14 }),
  nomeMae: varchar("nome_mae", { length: 255 }),
  
  // Responsável / Next of Kin
  responsavelNome: varchar("responsavel_nome", { length: 255 }),
  responsavelParentesco: varchar("responsavel_parentesco", { length: 100 }),
  responsavelTelefone: varchar("responsavel_telefone", { length: 20 }),
  responsavelEmail: varchar("responsavel_email", { length: 320 }),
  
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
  
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: int("deleted_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índices para multi-tenant
  tenantIdx: index("idx_pacientes_tenant").on(table.tenantId),
  tenantIdPacienteIdx: index("idx_pacientes_tenant_id_paciente").on(table.tenantId, table.idPaciente),
  tenantNomeIdx: index("idx_pacientes_tenant_nome").on(table.tenantId, table.nome),
  tenantCpfIdx: index("idx_pacientes_tenant_cpf").on(table.tenantId, table.cpf),
}));

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

/**
 * Tabela de Atendimentos - 26 campos principais conforme especificação
 */
export const atendimentos = mysqlTable("atendimentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1).references(() => tenants.id),
  atendimento: varchar("atendimento", { length: 64 }).notNull(), // ex: 20260001
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
  
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: int("deleted_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índices para multi-tenant
  tenantIdx: index("idx_atendimentos_tenant").on(table.tenantId),
  tenantAtendimentoIdx: index("idx_atendimentos_tenant_atendimento").on(table.tenantId, table.atendimento),
  tenantPacienteIdx: index("idx_atendimentos_tenant_paciente").on(table.tenantId, table.pacienteId),
  tenantDataIdx: index("idx_atendimentos_tenant_data").on(table.tenantId, table.dataAtendimento),
}));

export type Atendimento = typeof atendimentos.$inferSelect;
export type InsertAtendimento = typeof atendimentos.$inferInsert;

/**
 * Tabela de Log de Auditoria - Registra todas as alterações no sistema
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  
  // Quem fez a ação
  userId: int("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 255 }),
  userEmail: varchar("user_email", { length: 320 }),
  
  // O que foi feito
  action: mysqlEnum("action", ["CREATE", "UPDATE", "DELETE", "RESTORE", "VIEW", "EXPORT", "LOGIN", "LOGOUT", "AUTHORIZE", "REVOKE"]).notNull(),
  entityType: mysqlEnum("entity_type", ["paciente", "atendimento", "user", "prontuario", "documento", "autorizacao", "tenant", "session"]).notNull(),
  entityId: int("entity_id").notNull(),
  entityIdentifier: varchar("entity_identifier", { length: 100 }), // idPaciente ou atendimento
  
  // Detalhes da alteração
  oldValues: json("old_values"), // Valores antes da alteração
  newValues: json("new_values"), // Valores depois da alteração
  changedFields: json("changed_fields"), // Lista de campos alterados
  
  // Metadados
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;


// ===== PRONTUÁRIO MÉDICO ELETRÔNICO =====

/**
 * Resumo Clínico do Paciente - Informações persistentes do prontuário
 */
export const resumoClinico = mysqlTable("resumo_clinico", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id).unique(),
  
  // História clínica resumida
  historiaClinica: text("historia_clinica"),
  
  // Antecedentes
  antecedentesPessoais: text("antecedentes_pessoais"),
  antecedentesFamiliares: text("antecedentes_familiares"),
  habitos: text("habitos"), // Tabagismo, etilismo, etc.
  
  // Informações obstétricas (apenas para mulheres)
  gestacoes: int("gestacoes"),
  partos: int("partos"),
  abortos: int("abortos"),
  dum: date("dum"), // Data última menstruação
  
  // Dados antropométricos atuais
  pesoAtual: decimal("peso_atual", { precision: 5, scale: 2 }),
  altura: decimal("altura", { precision: 3, scale: 2 }),
  imc: decimal("imc", { precision: 4, scale: 1 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ResumoClinico = typeof resumoClinico.$inferSelect;
export type InsertResumoClinico = typeof resumoClinico.$inferInsert;

/**
 * Problemas Ativos do Paciente (Lista de Problemas)
 */
export const problemasAtivos = mysqlTable("problemas_ativos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  descricao: varchar("descricao", { length: 500 }).notNull(),
  cid10: varchar("cid10", { length: 20 }),
  dataInicio: date("data_inicio"),
  dataResolucao: date("data_resolucao"),
  ativo: boolean("ativo").default(true).notNull(),
  observacoes: text("observacoes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProblemaAtivo = typeof problemasAtivos.$inferSelect;
export type InsertProblemaAtivo = typeof problemasAtivos.$inferInsert;

/**
 * Alergias do Paciente
 */
export const alergias = mysqlTable("alergias", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  tipo: mysqlEnum("tipo", ["Medicamento", "Alimento", "Ambiental", "Outro"]).notNull(),
  substancia: varchar("substancia", { length: 255 }).notNull(),
  reacao: varchar("reacao", { length: 500 }),
  gravidade: mysqlEnum("gravidade", ["Leve", "Moderada", "Grave"]),
  confirmada: boolean("confirmada").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Alergia = typeof alergias.$inferSelect;
export type InsertAlergia = typeof alergias.$inferInsert;

/**
 * Medicamentos em Uso
 */
export const medicamentosUso = mysqlTable("medicamentos_uso", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  medicamento: varchar("medicamento", { length: 255 }).notNull(),
  principioAtivo: varchar("principio_ativo", { length: 255 }),
  dosagem: varchar("dosagem", { length: 100 }),
  posologia: varchar("posologia", { length: 255 }), // Ex: 1 cp 12/12h
  viaAdministracao: varchar("via_administracao", { length: 50 }), // VO, EV, IM, SC
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  motivoUso: varchar("motivo_uso", { length: 255 }),
  prescritoPor: varchar("prescrito_por", { length: 255 }),
  ativo: boolean("ativo").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MedicamentoUso = typeof medicamentosUso.$inferSelect;
export type InsertMedicamentoUso = typeof medicamentosUso.$inferInsert;

/**
 * Evoluções Clínicas (Consultas)
 */
export const evolucoes = mysqlTable("evolucoes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  atendimentoId: int("atendimento_id").references(() => atendimentos.id),
  
  dataEvolucao: timestamp("data_evolucao").notNull(),
  tipo: mysqlEnum("tipo", ["Consulta", "Retorno", "Urgência", "Teleconsulta", "Parecer"]).default("Consulta"),
  
  // SOAP ou texto livre
  subjetivo: text("subjetivo"), // Queixa principal, HDA
  objetivo: text("objetivo"), // Exame físico
  avaliacao: text("avaliacao"), // Impressão diagnóstica
  plano: text("plano"), // Conduta
  
  // Sinais vitais
  pressaoArterial: varchar("pressao_arterial", { length: 20 }),
  frequenciaCardiaca: int("frequencia_cardiaca"),
  temperatura: decimal("temperatura", { precision: 4, scale: 1 }),
  peso: decimal("peso", { precision: 5, scale: 2 }),
  altura: decimal("altura", { precision: 3, scale: 2 }),
  imc: decimal("imc", { precision: 4, scale: 1 }),
  
  // Metadados
  profissionalId: int("profissional_id").references(() => users.id),
  profissionalNome: varchar("profissional_nome", { length: 255 }),
  assinado: boolean("assinado").default(false),
  dataAssinatura: timestamp("data_assinatura"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Evolucao = typeof evolucoes.$inferSelect;
export type InsertEvolucao = typeof evolucoes.$inferInsert;

/**
 * Internações Hospitalares
 */
export const internacoes = mysqlTable("internacoes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  hospital: varchar("hospital", { length: 255 }).notNull(),
  setor: varchar("setor", { length: 100 }),
  leito: varchar("leito", { length: 50 }),
  
  dataAdmissao: timestamp("data_admissao").notNull(),
  dataAlta: timestamp("data_alta"),
  motivoInternacao: text("motivo_internacao"),
  diagnosticoAdmissao: varchar("diagnostico_admissao", { length: 500 }),
  cid10Admissao: varchar("cid10_admissao", { length: 20 }),
  
  diagnosticoAlta: varchar("diagnostico_alta", { length: 500 }),
  cid10Alta: varchar("cid10_alta", { length: 20 }),
  tipoAlta: mysqlEnum("tipo_alta", ["Melhorado", "Curado", "Transferido", "Óbito", "Evasão", "A pedido"]),
  
  resumoInternacao: text("resumo_internacao"),
  complicacoes: text("complicacoes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Internacao = typeof internacoes.$inferSelect;
export type InsertInternacao = typeof internacoes.$inferInsert;

/**
 * Cirurgias
 */
export const cirurgias = mysqlTable("cirurgias", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  internacaoId: int("internacao_id").references(() => internacoes.id),
  
  dataCirurgia: timestamp("data_cirurgia").notNull(),
  procedimento: varchar("procedimento", { length: 500 }).notNull(),
  codigosCBHPM: text("codigos_cbhpm"),
  
  hospital: varchar("hospital", { length: 255 }),
  salaOperatoria: varchar("sala_operatoria", { length: 50 }),
  
  cirurgiaoResponsavel: varchar("cirurgiao_responsavel", { length: 255 }),
  equipe: text("equipe"), // JSON com membros da equipe
  anestesista: varchar("anestesista", { length: 255 }),
  tipoAnestesia: varchar("tipo_anestesia", { length: 100 }),
  
  indicacao: text("indicacao"),
  descricaoCirurgica: text("descricao_cirurgica"),
  achados: text("achados"),
  complicacoes: text("complicacoes"),
  
  duracaoMinutos: int("duracao_minutos"),
  sangramento: varchar("sangramento", { length: 100 }),
  
  // Status do agendamento
  status: mysqlEnum("status", ["Agendada", "Realizada", "Cancelada", "Adiada"]).default("Agendada"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Cirurgia = typeof cirurgias.$inferSelect;
export type InsertCirurgia = typeof cirurgias.$inferInsert;

/**
 * Exames Laboratoriais
 */
export const examesLaboratoriais = mysqlTable("exames_laboratoriais", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataColeta: date("data_coleta").notNull(),
  dataResultado: date("data_resultado"),
  laboratorio: varchar("laboratorio", { length: 255 }),
  
  tipoExame: varchar("tipo_exame", { length: 255 }).notNull(), // Hemograma, Bioquímica, etc.
  exame: varchar("exame", { length: 255 }).notNull(), // Nome específico
  resultado: text("resultado"),
  valorReferencia: varchar("valor_referencia", { length: 255 }),
  unidade: varchar("unidade", { length: 50 }),
  
  alterado: boolean("alterado").default(false),
  observacoes: text("observacoes"),
  
  // Arquivo do laudo
  arquivoUrl: varchar("arquivo_url", { length: 500 }),
  arquivoNome: varchar("arquivo_nome", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ExameLaboratorial = typeof examesLaboratoriais.$inferSelect;
export type InsertExameLaboratorial = typeof examesLaboratoriais.$inferInsert;

/**
 * Exames de Imagem
 */
export const examesImagem = mysqlTable("exames_imagem", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataExame: date("data_exame").notNull(),
  tipoExame: mysqlEnum("tipo_exame", ["Raio-X", "Tomografia", "Ressonância", "Ultrassonografia", "Mamografia", "Densitometria", "PET-CT", "Cintilografia", "Outro"]).notNull(),
  regiao: varchar("regiao", { length: 255 }).notNull(), // Ex: Tórax, Abdome, Crânio
  
  clinicaServico: varchar("clinica_servico", { length: 255 }),
  medicoSolicitante: varchar("medico_solicitante", { length: 255 }),
  medicoLaudador: varchar("medico_laudador", { length: 255 }),
  
  indicacao: text("indicacao"),
  laudo: text("laudo"),
  conclusao: text("conclusao"),
  
  // Arquivos
  arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
  arquivoImagemUrl: varchar("arquivo_imagem_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ExameImagem = typeof examesImagem.$inferSelect;
export type InsertExameImagem = typeof examesImagem.$inferInsert;

/**
 * Endoscopias (EDA, Colonoscopia, etc.)
 */
export const endoscopias = mysqlTable("endoscopias", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataExame: date("data_exame").notNull(),
  tipoExame: mysqlEnum("tipo_exame", ["EDA", "Colonoscopia", "Retossigmoidoscopia", "CPRE", "Ecoendoscopia", "Enteroscopia", "Outro"]).notNull(),
  
  clinicaServico: varchar("clinica_servico", { length: 255 }),
  medicoExecutor: varchar("medico_executor", { length: 255 }),
  
  indicacao: text("indicacao"),
  preparo: varchar("preparo", { length: 255 }),
  sedacao: varchar("sedacao", { length: 255 }),
  
  descricao: text("descricao"),
  conclusao: text("conclusao"),
  biopsia: boolean("biopsia").default(false),
  localBiopsia: varchar("local_biopsia", { length: 255 }),
  resultadoBiopsia: text("resultado_biopsia"),
  
  // Arquivos
  arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
  arquivoImagensUrl: varchar("arquivo_imagens_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Endoscopia = typeof endoscopias.$inferSelect;
export type InsertEndoscopia = typeof endoscopias.$inferInsert;

/**
 * Exames de Cardiologia
 */
export const cardiologia = mysqlTable("cardiologia", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataExame: date("data_exame").notNull(),
  tipoExame: mysqlEnum("tipo_exame", ["ECG", "Ecocardiograma", "Teste Ergométrico", "Holter 24h", "MAPA", "Cintilografia Miocárdica", "Cateterismo", "Angiotomografia", "Outro"]).notNull(),
  
  clinicaServico: varchar("clinica_servico", { length: 255 }),
  medicoExecutor: varchar("medico_executor", { length: 255 }),
  
  indicacao: text("indicacao"),
  descricao: text("descricao"),
  conclusao: text("conclusao"),
  
  // Dados específicos do ecocardiograma
  feve: decimal("feve", { precision: 4, scale: 1 }), // Fração de ejeção
  ddve: decimal("ddve", { precision: 4, scale: 1 }), // Diâmetro diastólico VE
  dsve: decimal("dsve", { precision: 4, scale: 1 }), // Diâmetro sistólico VE
  ae: decimal("ae", { precision: 4, scale: 1 }), // Átrio esquerdo
  
  // Arquivos
  arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
  arquivoExameUrl: varchar("arquivo_exame_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Cardiologia = typeof cardiologia.$inferSelect;
export type InsertCardiologia = typeof cardiologia.$inferInsert;

/**
 * Terapias e Infusões (Quimioterapia, Imunobiológicos, etc.)
 */
export const terapias = mysqlTable("terapias", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataTerapia: timestamp("data_terapia").notNull(),
  tipoTerapia: mysqlEnum("tipo_terapia", ["Quimioterapia", "Imunoterapia", "Terapia Alvo", "Imunobiológico", "Infusão", "Transfusão", "Outro"]).notNull(),
  
  protocolo: varchar("protocolo", { length: 255 }),
  ciclo: int("ciclo"),
  dia: int("dia"),
  
  medicamentos: text("medicamentos"), // JSON com medicamentos e doses
  local: varchar("local", { length: 255 }),
  
  preQuimio: text("pre_quimio"), // Avaliação pré-infusão
  intercorrencias: text("intercorrencias"),
  observacoes: text("observacoes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Terapia = typeof terapias.$inferSelect;
export type InsertTerapia = typeof terapias.$inferInsert;

/**
 * Obstetrícia (apenas para pacientes do sexo feminino)
 */
export const obstetricia = mysqlTable("obstetricia", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  tipoRegistro: mysqlEnum("tipo_registro", ["Pré-natal", "Parto", "Puerpério", "Aborto"]).notNull(),
  dataRegistro: date("data_registro").notNull(),
  
  // Pré-natal
  dum: date("dum"),
  dpp: date("dpp"), // Data provável do parto
  idadeGestacional: varchar("idade_gestacional", { length: 20 }),
  
  // Parto
  tipoParto: mysqlEnum("tipo_parto", ["Normal", "Cesárea", "Fórceps", "Vácuo"]),
  dataParto: timestamp("data_parto"),
  hospital: varchar("hospital", { length: 255 }),
  
  // Recém-nascido
  pesoRN: decimal("peso_rn", { precision: 5, scale: 0 }), // em gramas
  apgar1: int("apgar_1"),
  apgar5: int("apgar_5"),
  sexoRN: mysqlEnum("sexo_rn", ["M", "F"]),
  
  observacoes: text("observacoes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Obstetricia = typeof obstetricia.$inferSelect;
export type InsertObstetricia = typeof obstetricia.$inferInsert;

/**
 * Documentos Médicos (Receitas, Atestados, Solicitações, etc.)
 */
export const documentosMedicos = mysqlTable("documentos_medicos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  evolucaoId: int("evolucao_id").references(() => evolucoes.id),
  
  tipo: mysqlEnum("tipo", [
    "Receita",
    "Receita Especial",
    "Solicitação de Exames",
    "Atestado Comparecimento",
    "Atestado Afastamento",
    "Laudo Médico",
    "Relatório Médico",
    "Protocolo Cirurgia",
    "Guia SADT",
    "Guia Internação",
    "Outro"
  ]).notNull(),
  
  dataEmissao: timestamp("data_emissao").notNull(),
  
  // Conteúdo do documento
  conteudo: text("conteudo"), // Texto principal do documento
  
  // Campos específicos para receitas
  medicamentos: text("medicamentos"), // JSON com lista de medicamentos
  
  // Campos específicos para atestados
  cid10: varchar("cid10", { length: 20 }),
  diasAfastamento: int("dias_afastamento"),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  
  // Campos específicos para solicitações
  examesSolicitados: text("exames_solicitados"), // JSON com lista de exames
  justificativa: text("justificativa"),
  
  // Campos específicos para protocolo de cirurgia
  procedimentoProposto: varchar("procedimento_proposto", { length: 500 }),
  dataPrevista: date("data_prevista"),
  hospitalPrevisto: varchar("hospital_previsto", { length: 255 }),
  
  // Metadados
  profissionalId: int("profissional_id").references(() => users.id),
  profissionalNome: varchar("profissional_nome", { length: 255 }),
  crm: varchar("crm", { length: 20 }),
  
  // Arquivo gerado
  arquivoUrl: varchar("arquivo_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DocumentoMedico = typeof documentosMedicos.$inferSelect;
export type InsertDocumentoMedico = typeof documentosMedicos.$inferInsert;


// ==========================================
// HISTÓRICO DE MEDIDAS ANTROPOMÉTRICAS
// Pilar Fundamental: Imutabilidade e Preservação Histórica
// ==========================================

export const historicoMedidas = mysqlTable("historico_medidas", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull(),
  dataMedicao: timestamp("data_medicao").notNull(),
  peso: decimal("peso", { precision: 5, scale: 2 }), // kg
  altura: decimal("altura", { precision: 3, scale: 2 }), // metros
  imc: decimal("imc", { precision: 4, scale: 1 }), // calculado
  pressaoSistolica: int("pressao_sistolica"), // mmHg
  pressaoDiastolica: int("pressao_diastolica"), // mmHg
  frequenciaCardiaca: int("frequencia_cardiaca"), // bpm
  temperatura: decimal("temperatura", { precision: 3, scale: 1 }), // °C
  saturacao: int("saturacao"), // SpO2 %
  observacoes: text("observacoes"),
  registradoPor: varchar("registrado_por", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// ==========================================
// MÓDULO DE AGENDA
// Pilar Fundamental: Imutabilidade - Nada é apagado, apenas marcado
// ==========================================

/**
 * Tipos de Compromisso na Agenda
 */
export const tipoCompromissoEnum = mysqlEnum("tipo_compromisso", [
  "Consulta",
  "Cirurgia", 
  "Visita internado",
  "Procedimento em consultório",
  "Exame",
  "Reunião",
  "Bloqueio"
]);

/**
 * Status do Agendamento
 */
export const statusAgendamentoEnum = mysqlEnum("status", [
  "Agendado",
  "Confirmado",
  "Aguardando",
  "Em atendimento",
  "Encerrado",
  "Cancelado",
  "Falta",
  "Transferido",
  // Status legados (manter para compatibilidade com dados existentes)
  "Realizado",
  "Reagendado",
  "Faltou"
]);

/**
 * Tabela de Agendamentos
 * Cada agendamento é imutável - cancelamentos e reagendamentos criam referências, não apagam
 */
export const agendamentos = mysqlTable("agendamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Identificador único do agendamento (formato: AG-YYYY-NNNNN)
  idAgendamento: varchar("id_agendamento", { length: 20 }).notNull().unique(),
  
  // Tipo de compromisso
  tipoCompromisso: tipoCompromissoEnum.notNull(),
  
  // Paciente (opcional para reuniões e bloqueios)
  pacienteId: int("paciente_id").references(() => pacientes.id),
  pacienteNome: varchar("paciente_nome", { length: 255 }),
  
  // Data e horário
  dataHoraInicio: timestamp("data_hora_inicio").notNull(),
  dataHoraFim: timestamp("data_hora_fim").notNull(),
  
  // Local
  local: varchar("local", { length: 100 }),
  
  // Status
  status: statusAgendamentoEnum.default("Agendado").notNull(),
  
  // Descrição/Observações
  titulo: varchar("titulo", { length: 255 }),
  descricao: text("descricao"),
  
  // Reagendamento - referência ao agendamento original
  reagendadoDe: int("reagendado_de").references((): any => agendamentos.id),
  
  // Cancelamento
  canceladoEm: timestamp("cancelado_em"),
  canceladoPor: varchar("cancelado_por", { length: 255 }),
  motivoCancelamento: text("motivo_cancelamento"),
  
  // Confirmação
  confirmadoEm: timestamp("confirmado_em"),
  confirmadoPor: varchar("confirmado_por", { length: 255 }),
  
  // Realização
  realizadoEm: timestamp("realizado_em"),
  realizadoPor: varchar("realizado_por", { length: 255 }),
  
  // Falta
  marcadoFaltaEm: timestamp("marcado_falta_em"),
  marcadoFaltaPor: varchar("marcado_falta_por", { length: 255 }),
  
  // Transferência - referência ao novo agendamento criado
  transferidoParaId: int("transferido_para_id").references((): any => agendamentos.id),
  transferidoEm: timestamp("transferido_em"),
  transferidoPor: varchar("transferido_por", { length: 255 }),
  
  // Aguardando (paciente chegou)
  pacienteChegouEm: timestamp("paciente_chegou_em"),
  pacienteChegouRegistradoPor: varchar("paciente_chegou_registrado_por", { length: 255 }),
  
  // Em atendimento
  atendimentoIniciadoEm: timestamp("atendimento_iniciado_em"),
  atendimentoIniciadoPor: varchar("atendimento_iniciado_por", { length: 255 }),
  
  // Encerrado
  encerradoEm: timestamp("encerrado_em"),
  encerradoPor: varchar("encerrado_por", { length: 255 }),
  
  // Vínculo com atendimento (quando realizado)
  atendimentoId: int("atendimento_id").references(() => atendimentos.id),
  
  // Metadados
  criadoPor: varchar("criado_por", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Importação do Google Calendar
  googleUid: varchar("google_uid", { length: 255 }),
  importadoDe: varchar("importado_de", { length: 50 }), // 'google_calendar', 'manual', etc.
  convenio: varchar("convenio", { length: 100 }),
  cpfPaciente: varchar("cpf_paciente", { length: 14 }),
  telefonePaciente: varchar("telefone_paciente", { length: 20 }),
  emailPaciente: varchar("email_paciente", { length: 255 }),
});

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = typeof agendamentos.$inferInsert;

/**
 * Tabela de Bloqueios de Horário
 * Períodos em que não há atendimento (férias, feriados, reuniões fixas, etc.)
 */
export const bloqueiosHorario = mysqlTable("bloqueios_horario", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Identificador único (formato: BL-YYYY-NNNNN)
  idBloqueio: varchar("id_bloqueio", { length: 20 }).notNull().unique(),
  
  // Período do bloqueio
  dataHoraInicio: timestamp("data_hora_inicio").notNull(),
  dataHoraFim: timestamp("data_hora_fim").notNull(),
  
  // Tipo de bloqueio
  tipoBloqueio: mysqlEnum("tipo_bloqueio", [
    "Férias",
    "Feriado",
    "Reunião fixa",
    "Congresso",
    "Particular",
    "Outro"
  ]).notNull(),
  
  // Descrição
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  
  // Recorrência (opcional)
  recorrente: boolean("recorrente").default(false),
  padraoRecorrencia: varchar("padrao_recorrencia", { length: 100 }), // Ex: "WEEKLY", "MONTHLY"
  
  // Cancelamento (bloqueios também não são apagados)
  cancelado: boolean("cancelado").default(false),
  canceladoEm: timestamp("cancelado_em"),
  canceladoPor: varchar("cancelado_por", { length: 255 }),
  motivoCancelamento: text("motivo_cancelamento"),
  
  // Metadados
  criadoPor: varchar("criado_por", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BloqueioHorario = typeof bloqueiosHorario.$inferSelect;
export type InsertBloqueioHorario = typeof bloqueiosHorario.$inferInsert;

/**
 * Histórico de Alterações de Agendamentos
 * Registra todas as mudanças para rastreabilidade completa
 */
export const historicoAgendamentos = mysqlTable("historico_agendamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  agendamentoId: int("agendamento_id").notNull().references(() => agendamentos.id),
  
  // Tipo de alteração
  tipoAlteracao: mysqlEnum("tipo_alteracao", [
    "Criação",
    "Confirmação",
    "Cancelamento",
    "Reagendamento",
    "Realização",
    "Falta",
    "Edição",
    "Transferência",
    "Paciente Chegou",
    "Atendimento Iniciado",
    "Encerramento",
    "Reativação"
  ]).notNull(),
  
  // Detalhes
  descricaoAlteracao: text("descricao_alteracao"),
  valoresAnteriores: json("valores_anteriores"),
  valoresNovos: json("valores_novos"),
  
  // Quem fez
  realizadoPor: varchar("realizado_por", { length: 255 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type HistoricoAgendamento = typeof historicoAgendamentos.$inferSelect;
export type InsertHistoricoAgendamento = typeof historicoAgendamentos.$inferInsert;

/**
 * Perfis de Usuário - Sistema de Controle de Acesso
 * Conforme Pilar 5: Controle de Acesso Baseado em Perfis
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1).references(() => tenants.id),
  userId: int("user_id").notNull().unique(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  email: varchar("email", { length: 320 }),
  
  // Perfil atualmente ativo
  perfilAtivo: mysqlEnum("perfil_ativo", [
    "admin_master",
    "medico",
    "secretaria",
    "auditor",
    "paciente"
  ]).default("paciente").notNull(),
  
  // Flags de perfis disponíveis para o usuário
  isAdminMaster: boolean("is_admin_master").default(false).notNull(),
  isMedico: boolean("is_medico").default(false).notNull(),
  isSecretaria: boolean("is_secretaria").default(false).notNull(),
  isAuditor: boolean("is_auditor").default(false).notNull(),
  isPaciente: boolean("is_paciente").default(true).notNull(),
  
  // Dados específicos do médico
  crm: varchar("crm", { length: 20 }),
  especialidade: varchar("especialidade", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Configurações do Usuário por Categoria
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  userProfileId: int("user_profile_id").notNull(),
  categoria: varchar("categoria", { length: 50 }).notNull(),
  chave: varchar("chave", { length: 100 }).notNull(),
  valor: text("valor"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;


// ========================================
// VÍNCULO SECRETÁRIA-MÉDICO
// ========================================

export const statusVinculoEnum = mysqlEnum("status", [
  "ativo",
  "pendente_renovacao",
  "expirado",
  "cancelado",
]);

export const vinculoSecretariaMedico = mysqlTable("vinculo_secretaria_medico", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  secretariaUserId: varchar("secretaria_user_id", { length: 255 }).notNull(),
  medicoUserId: varchar("medico_user_id", { length: 255 }).notNull(),
  dataInicio: datetime("data_inicio").notNull(),
  dataValidade: datetime("data_validade").notNull(),
  status: mysqlEnum("status", ["ativo", "pendente_renovacao", "expirado", "cancelado"]).default("ativo"),
  notificacaoEnviada: boolean("notificacao_enviada").default(false),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const acaoVinculoEnum = mysqlEnum("acao", [
  "criado",
  "renovado",
  "expirado",
  "cancelado",
]);

export const historicoVinculo = mysqlTable("historico_vinculo", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  vinculoId: int("vinculo_id").notNull(),
  acao: mysqlEnum("acao", ["criado", "renovado", "expirado", "cancelado"]).notNull(),
  dataAcao: datetime("data_acao").default(sql`CURRENT_TIMESTAMP`),
  observacao: text("observacao"),
});


// ==========================================
// DOCUMENTOS EXTERNOS DO PRONTUÁRIO
// Pilar Fundamental: Imutabilidade e Preservação Histórica
// ==========================================

/**
 * Categorias de documentos externos
 */
export const categoriaDocumentoEnum = mysqlEnum("categoria_documento", [
  "Evolução",
  "Internação",
  "Cirurgia",
  "Exame Laboratorial",
  "Exame de Imagem",
  "Endoscopia",
  "Cardiologia",
  "Patologia"
]);

/**
 * Documentos Externos do Prontuário
 * Armazena referências a documentos externos (laudos, exames, etc.)
 * que foram digitalizados e convertidos para PDF com OCR
 */
export const documentosExternos = mysqlTable("documentos_externos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  // Categoria do documento
  categoria: categoriaDocumentoEnum.notNull(),
  
  // Referência ao registro específico (opcional)
  evolucaoId: int("evolucao_id").references(() => evolucoes.id),
  internacaoId: int("internacao_id").references(() => internacoes.id),
  cirurgiaId: int("cirurgia_id").references(() => cirurgias.id),
  exameLaboratorialId: int("exame_laboratorial_id").references(() => examesLaboratoriais.id),
  exameImagemId: int("exame_imagem_id").references(() => examesImagem.id),
  endoscopiaId: int("endoscopia_id").references(() => endoscopias.id),
  cardiologiaId: int("cardiologia_id").references(() => cardiologia.id),
  patologiaId: int("patologia_id"),
  
  // Informações do documento
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataDocumento: date("data_documento"), // Data do documento original
  
  // Arquivo original (antes da conversão)
  arquivoOriginalUrl: varchar("arquivo_original_url", { length: 500 }).notNull(),
  arquivoOriginalNome: varchar("arquivo_original_nome", { length: 255 }).notNull(),
  arquivoOriginalTipo: varchar("arquivo_original_tipo", { length: 50 }), // image/jpeg, application/pdf, etc.
  arquivoOriginalTamanho: int("arquivo_original_tamanho"), // bytes
  
  // Arquivo PDF convertido (com OCR)
  arquivoPdfUrl: varchar("arquivo_pdf_url", { length: 500 }),
  arquivoPdfNome: varchar("arquivo_pdf_nome", { length: 255 }),
  
  // OCR e IA
  textoOcr: text("texto_ocr"), // Texto extraído via OCR
  interpretacaoIa: text("interpretacao_ia"), // Futura interpretação por IA
  dataInterpretacao: timestamp("data_interpretacao"),
  
  // Metadados de auditoria
  uploadPor: varchar("upload_por", { length: 255 }).notNull(),
  uploadEm: timestamp("upload_em").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DocumentoExterno = typeof documentosExternos.$inferSelect;
export type InsertDocumentoExterno = typeof documentosExternos.$inferInsert;

/**
 * Exames de Patologia (Anatomopatológico, Citopatológico, Imunohistoquímica)
 */
export const patologias = mysqlTable("patologias", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  
  dataColeta: date("data_coleta").notNull(),
  dataResultado: date("data_resultado"),
  
  tipoExame: mysqlEnum("tipo_exame", [
    "Anatomopatológico",
    "Citopatológico", 
    "Imunohistoquímica",
    "Hibridização in situ",
    "Biópsia Líquida",
    "Outro"
  ]).notNull(),
  
  // Origem do material
  origemMaterial: varchar("origem_material", { length: 255 }), // Ex: Mama direita, Cólon, Pele
  tipoProcedimento: varchar("tipo_procedimento", { length: 255 }), // Biópsia, Ressecção, Punção
  
  // Laboratório
  laboratorio: varchar("laboratorio", { length: 255 }),
  patologistaResponsavel: varchar("patologista_responsavel", { length: 255 }),
  
  // Laudo
  descricaoMacroscopica: text("descricao_macroscopica"),
  descricaoMicroscopica: text("descricao_microscopica"),
  diagnostico: text("diagnostico"),
  conclusao: text("conclusao"),
  
  // Classificações específicas (oncologia)
  estadiamentoTnm: varchar("estadiamento_tnm", { length: 50 }),
  grauHistologico: varchar("grau_histologico", { length: 50 }),
  margemCirurgica: varchar("margem_cirurgica", { length: 100 }),
  invasaoLinfovascular: boolean("invasao_linfovascular"),
  invasaoPerineural: boolean("invasao_perineural"),
  
  // Imunohistoquímica (marcadores comuns)
  ki67: varchar("ki67", { length: 20 }),
  receptorEstrogeno: varchar("receptor_estrogeno", { length: 50 }),
  receptorProgesterona: varchar("receptor_progesterona", { length: 50 }),
  her2: varchar("her2", { length: 50 }),
  pdl1: varchar("pdl1", { length: 50 }),
  outrosMarcadores: text("outros_marcadores"), // JSON com outros marcadores
  
  // Arquivos
  arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
  arquivoLaminasUrl: varchar("arquivo_laminas_url", { length: 500 }),
  
  observacoes: text("observacoes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Patologia = typeof patologias.$inferSelect;
export type InsertPatologia = typeof patologias.$inferInsert;


// ==========================================
// RESULTADOS LABORATORIAIS ESTRUTURADOS
// Pilar Fundamental: Imutabilidade e Preservação Histórica
// ==========================================

/**
 * Catálogo de Exames Padronizados
 * Permite normalizar nomes de exames de diferentes laboratórios
 */
export const examesPadronizados = mysqlTable("exames_padronizados", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Nome padronizado do exame
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  
  // Categoria do exame
  categoria: mysqlEnum("categoria", [
    "Hemograma",
    "Bioquímica",
    "Função Renal",
    "Função Hepática",
    "Perfil Lipídico",
    "Coagulação",
    "Hormônios",
    "Marcadores Tumorais",
    "Eletrólitos",
    "Urinálise",
    "Sorologias",
    "Metabolismo do Ferro",
    "Vitaminas",
    "Outros"
  ]).notNull(),
  
  // Unidade padrão
  unidadePadrao: varchar("unidade_padrao", { length: 50 }),
  
  // Valores de referência padrão (podem variar por sexo/idade)
  valorReferenciaMinMasculino: decimal("valor_ref_min_masculino", { precision: 10, scale: 4 }),
  valorReferenciaMaxMasculino: decimal("valor_ref_max_masculino", { precision: 10, scale: 4 }),
  valorReferenciaMinFeminino: decimal("valor_ref_min_feminino", { precision: 10, scale: 4 }),
  valorReferenciaMaxFeminino: decimal("valor_ref_max_feminino", { precision: 10, scale: 4 }),
  
  // Sinônimos (nomes alternativos usados por diferentes laboratórios)
  sinonimos: text("sinonimos"), // JSON array: ["TGP", "ALT", "Alanina aminotransferase"]
  
  // Descrição e notas
  descricao: text("descricao"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ExamePadronizado = typeof examesPadronizados.$inferSelect;
export type InsertExamePadronizado = typeof examesPadronizados.$inferInsert;

/**
 * Resultados Laboratoriais Estruturados
 * Armazena cada resultado individual extraído dos PDFs
 */
export const resultadosLaboratoriais = mysqlTable("resultados_laboratoriais", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Vínculos
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  documentoExternoId: int("documento_externo_id").references(() => documentosExternos.id), // PDF original
  examePadronizadoId: int("exame_padronizado_id").references(() => examesPadronizados.id), // Exame normalizado
  
  // Nome do exame (como aparece no laudo)
  nomeExameOriginal: varchar("nome_exame_original", { length: 255 }).notNull(),
  
  // Data da coleta
  dataColeta: date("data_coleta").notNull(),
  
  // Resultado (texto para suportar ">90", "<0.1", "Não reagente", etc.)
  resultado: varchar("resultado", { length: 100 }).notNull(),
  resultadoNumerico: decimal("resultado_numerico", { precision: 15, scale: 6 }), // Valor numérico quando aplicável
  
  // Unidade
  unidade: varchar("unidade", { length: 50 }),
  
  // Valores de referência (como aparecem no laudo)
  valorReferenciaTexto: varchar("valor_referencia_texto", { length: 255 }),
  valorReferenciaMin: decimal("valor_referencia_min", { precision: 15, scale: 6 }),
  valorReferenciaMax: decimal("valor_referencia_max", { precision: 15, scale: 6 }),
  
  // Indicador de valor fora da referência
  foraReferencia: boolean("fora_referencia").default(false),
  tipoAlteracao: mysqlEnum("tipo_alteracao", ["Normal", "Aumentado", "Diminuído"]).default("Normal"),
  
  // Laboratório
  laboratorio: varchar("laboratorio", { length: 255 }),
  
  // Metadados de extração
  extraidoPorIa: boolean("extraido_por_ia").default(true),
  confiancaExtracao: decimal("confianca_extracao", { precision: 3, scale: 2 }), // 0.00 a 1.00
  revisadoManualmente: boolean("revisado_manualmente").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ResultadoLaboratorial = typeof resultadosLaboratoriais.$inferSelect;
export type InsertResultadoLaboratorial = typeof resultadosLaboratoriais.$inferInsert;


// Tabela de Exames Favoritos - exames que o usuário quer acompanhar no fluxograma
export const examesFavoritos = mysqlTable("exames_favoritos", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  nomeExame: varchar("nome_exame", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }).default("Geral"),
  ordem: int("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});


/**
 * Configuração de Dashboard Customizável
 * Armazena as preferências de métricas de cada usuário
 */
export const dashboardConfigs = mysqlTable("dashboard_configs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  userId: int("user_id").notNull().references(() => users.id),
  
  // Métricas selecionadas para exibição (JSON array de IDs de métricas)
  metricasSelecionadas: text("metricas_selecionadas").notNull(), // JSON array
  
  // Ordem de exibição das métricas (JSON array de IDs)
  ordemMetricas: text("ordem_metricas"),
  
  // Período padrão selecionado
  periodoDefault: mysqlEnum("periodo_default", ["7d", "30d", "3m", "6m", "1a", "3a", "5a", "todo"]).default("30d"),
  
  // Layout preferido (grid columns)
  layoutColunas: int("layout_colunas").default(3),
  
  // Tema de cores
  temaGraficos: mysqlEnum("tema_graficos", ["padrao", "escuro", "colorido"]).default("padrao"),
  
  // Tamanhos dos widgets (JSON object: { metricaId: 'pequeno' | 'medio' | 'grande' })
  widgetSizes: text("widget_sizes"),
  
  // Períodos individuais dos widgets (JSON object: { metricaId: periodo })
  widgetPeriods: text("widget_periods"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type InsertDashboardConfig = typeof dashboardConfigs.$inferInsert;


// ==========================================
// SISTEMA DE BACKUP AUTOMÁTICO
// Pilar Fundamental: Imutabilidade e Preservação Histórica
// ==========================================

/**
 * Histórico de Backups
 * Registra todos os backups realizados no sistema
 */
export const backupHistory = mysqlTable("backup_history", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Tipo de backup
  backupType: mysqlEnum("backup_type", ["full", "incremental", "transactional", "offline"]).notNull(),
  
  // Status do backup
  status: mysqlEnum("status", ["running", "success", "failed", "validating"]).notNull().default("running"),
  
  // Timestamps
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  
  // Informações do arquivo
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  checksumSha256: varchar("checksum_sha256", { length: 64 }),
  
  // Destino do backup
  destination: mysqlEnum("destination", ["s3_primary", "s3_secondary", "offline_hd"]).default("s3_primary"),
  
  // Metadados adicionais
  databaseRecords: int("database_records"), // Total de registros no banco
  filesCount: int("files_count"), // Total de arquivos no S3
  
  // Erro (se houver)
  errorMessage: text("error_message"),
  
  // Quem iniciou o backup
  triggeredBy: mysqlEnum("triggered_by", ["scheduled", "manual", "system"]).default("scheduled"),
  createdByUserId: int("created_by_user_id").references(() => users.id),
  
  // Auditoria detalhada
  userIpAddress: varchar("user_ip_address", { length: 45 }), // IPv4 ou IPv6
  userAgent: varchar("user_agent", { length: 500 }), // Browser/Client info
  
  // Criptografia
  isEncrypted: boolean("is_encrypted").default(false), // Indica se o backup está criptografado
  encryptionAlgorithm: varchar("encryption_algorithm", { length: 50 }), // Ex: AES-256-GCM
  
  // Verificação de integridade
  lastVerifiedAt: timestamp("last_verified_at"), // Última verificação de integridade
  verificationStatus: mysqlEnum("verification_status", ["pending", "valid", "invalid", "error"]).default("pending"),
  
  // Timestamps de auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BackupHistory = typeof backupHistory.$inferSelect;
export type InsertBackupHistory = typeof backupHistory.$inferInsert;

/**
 * Configuração de Backup
 * Armazena as configurações de backup de cada tenant
 */
export const backupConfig = mysqlTable("backup_config", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id).unique(),
  
  // Configurações de agendamento
  backupEnabled: boolean("backup_enabled").default(true),
  dailyBackupTime: varchar("daily_backup_time", { length: 5 }).default("03:00"), // HH:MM
  weeklyBackupDay: int("weekly_backup_day").default(0), // 0 = Domingo
  monthlyBackupDay: int("monthly_backup_day").default(1), // 1º dia do mês
  
  // Retenção
  dailyRetentionDays: int("daily_retention_days").default(30),
  weeklyRetentionWeeks: int("weekly_retention_weeks").default(12),
  monthlyRetentionMonths: int("monthly_retention_months").default(12),
  
  // Notificações
  notifyOnSuccess: boolean("notify_on_success").default(false),
  notifyOnFailure: boolean("notify_on_failure").default(true),
  notificationEmail: varchar("notification_email", { length: 255 }),
  
  // Backup offline
  offlineBackupEnabled: boolean("offline_backup_enabled").default(true),
  offlineBackupReminderDay: int("offline_backup_reminder_day").default(1), // 1º domingo do mês
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BackupConfig = typeof backupConfig.$inferSelect;
export type InsertBackupConfig = typeof backupConfig.$inferInsert;


/**
 * Tabela de Delegados da Agenda
 * Permite que médicos deleguem acesso à sua agenda para secretárias ou colaboradores
 * Conforme Pilar 5: Controle de Acesso Baseado em Perfis
 */
export const delegadosAgenda = mysqlTable("delegados_agenda", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Médico que está delegando acesso (dono da agenda)
  medicoUserId: int("medico_user_id").notNull().references(() => users.id),
  
  // Usuário que receberá acesso (delegado)
  delegadoUserId: int("delegado_user_id").references(() => users.id),
  
  // E-mail do delegado (para convites pendentes)
  delegadoEmail: varchar("delegado_email", { length: 320 }).notNull(),
  delegadoNome: varchar("delegado_nome", { length: 255 }),
  
  // Nível de permissão
  permissao: mysqlEnum("permissao", ["visualizar", "editar"]).default("visualizar").notNull(),
  
  // Período de validade
  dataInicio: timestamp("data_inicio").defaultNow().notNull(),
  dataFim: timestamp("data_fim"),
  
  // Status
  ativo: boolean("ativo").default(true).notNull(),
  
  // Auditoria
  criadoPor: varchar("criado_por", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_delegados_agenda_tenant").on(table.tenantId),
  medicoIdx: index("idx_delegados_agenda_medico").on(table.medicoUserId),
  delegadoIdx: index("idx_delegados_agenda_delegado").on(table.delegadoUserId),
}));

export type DelegadoAgenda = typeof delegadosAgenda.$inferSelect;
export type InsertDelegadoAgenda = typeof delegadosAgenda.$inferInsert;


/**
 * Tabela de Sincronização Google Calendar
 * Mapeia agendamentos do GORGEN com eventos do Google Calendar
 * Permite sincronização bidirecional
 */
export const googleCalendarSync = mysqlTable("google_calendar_sync", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  
  // Referência ao agendamento no GORGEN
  agendamentoId: int("agendamento_id").notNull().references(() => agendamentos.id),
  
  // Referência ao evento no Google Calendar
  googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
  googleCalendarId: varchar("google_calendar_id", { length: 255 }).default("primary"),
  
  // Status de sincronização
  syncStatus: mysqlEnum("sync_status", [
    "synced",           // Sincronizado com sucesso
    "pending_to_google", // Pendente envio para Google
    "pending_from_google", // Pendente importação do Google
    "conflict",         // Conflito de dados
    "error"             // Erro na sincronização
  ]).default("synced").notNull(),
  
  // Direção da última sincronização
  lastSyncDirection: mysqlEnum("last_sync_direction", ["to_google", "from_google"]),
  
  // Timestamps de sincronização
  lastSyncAt: timestamp("last_sync_at"),
  googleUpdatedAt: timestamp("google_updated_at"),
  gorgenUpdatedAt: timestamp("gorgen_updated_at"),
  
  // Detalhes de erro (se houver)
  errorMessage: text("error_message"),
  errorCount: int("error_count").default(0),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_gcal_sync_tenant").on(table.tenantId),
  agendamentoIdx: index("idx_gcal_sync_agendamento").on(table.agendamentoId),
  googleEventIdx: index("idx_gcal_sync_google_event").on(table.googleEventId),
  syncStatusIdx: index("idx_gcal_sync_status").on(table.syncStatus),
}));
export type GoogleCalendarSync = typeof googleCalendarSync.$inferSelect;
export type InsertGoogleCalendarSync = typeof googleCalendarSync.$inferInsert;

/**
 * Configuração de Sincronização Google Calendar por Usuário
 * Armazena as preferências de sincronização de cada usuário
 */
export const googleCalendarConfig = mysqlTable("google_calendar_config", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  userId: int("user_id").notNull().references(() => users.id),
  
  // Configurações de sincronização
  syncEnabled: boolean("sync_enabled").default(false).notNull(),
  syncDirection: mysqlEnum("sync_direction", [
    "bidirectional",    // Sincroniza em ambas direções
    "to_google_only",   // Apenas GORGEN -> Google
    "from_google_only"  // Apenas Google -> GORGEN
  ]).default("bidirectional"),
  
  // Calendário do Google a ser usado
  googleCalendarId: varchar("google_calendar_id", { length: 255 }).default("primary"),
  
  // Filtros de sincronização
  syncConsultas: boolean("sync_consultas").default(true),
  syncCirurgias: boolean("sync_cirurgias").default(true),
  syncReunions: boolean("sync_reunioes").default(true),
  syncBloqueios: boolean("sync_bloqueios").default(false),
  syncOutros: boolean("sync_outros").default(true),
  
  // Configurações de privacidade
  includePatientName: boolean("include_patient_name").default(false), // Por LGPD, padrão é não incluir
  includePatientPhone: boolean("include_patient_phone").default(false),
  eventVisibility: mysqlEnum("event_visibility", ["default", "public", "private"]).default("private"),
  
  // Última sincronização
  lastFullSyncAt: timestamp("last_full_sync_at"),
  lastIncrementalSyncAt: timestamp("last_incremental_sync_at"),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantUserIdx: index("idx_gcal_config_tenant_user").on(table.tenantId, table.userId),
}));
export type GoogleCalendarConfig = typeof googleCalendarConfig.$inferSelect;
export type InsertGoogleCalendarConfig = typeof googleCalendarConfig.$inferInsert;
