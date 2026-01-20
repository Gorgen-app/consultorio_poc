import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, int, varchar, mysqlEnum, timestamp, text, date, decimal, json, datetime, longtext, tinyint, boolean, bigint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const agendamentos = mysqlTable("agendamentos", {
	id: int().autoincrement().notNull(),
	idAgendamento: varchar("id_agendamento", { length: 20 }).notNull(),
	tipoCompromisso: mysqlEnum("tipo_compromisso", ['Consulta','Cirurgia','Visita internado','Procedimento em consultório','Exame','Reunião','Bloqueio']).notNull(),
	pacienteId: int("paciente_id").references(() => pacientes.id),
	profissionalId: int("profissional_id").references(() => profissionais.id),
	pacienteNome: varchar("paciente_nome", { length: 255 }),
	dataHoraInicio: timestamp("data_hora_inicio", { mode: 'string' }).notNull(),
	dataHoraFim: timestamp("data_hora_fim", { mode: 'string' }).notNull(),
	local: varchar({ length: 100 }),
	status: mysqlEnum(['Agendado','Confirmado','Aguardando','Em atendimento','Encerrado','Cancelado','Falta','Transferido','Realizado','Reagendado','Faltou']).default('Agendado').notNull(),
	titulo: varchar({ length: 255 }),
	descricao: text(),
	reagendadoDe: int("reagendado_de"),
	canceladoEm: timestamp("cancelado_em", { mode: 'string' }),
	canceladoPor: varchar("cancelado_por", { length: 255 }),
	motivoCancelamento: text("motivo_cancelamento"),
	confirmadoEm: timestamp("confirmado_em", { mode: 'string' }),
	confirmadoPor: varchar("confirmado_por", { length: 255 }),
	realizadoEm: timestamp("realizado_em", { mode: 'string' }),
	realizadoPor: varchar("realizado_por", { length: 255 }),
	marcadoFaltaEm: timestamp("marcado_falta_em", { mode: 'string' }),
	marcadoFaltaPor: varchar("marcado_falta_por", { length: 255 }),
	atendimentoId: int("atendimento_id").references(() => atendimentos.id),
	criadoPor: varchar("criado_por", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	tenantId: int("tenant_id").default(1),
	googleUid: varchar("google_uid", { length: 255 }),
	importadoDe: varchar("importado_de", { length: 50 }),
	convenio: varchar({ length: 100 }),
	cpfPaciente: varchar("cpf_paciente", { length: 14 }),
	telefonePaciente: varchar("telefone_paciente", { length: 20 }),
	emailPaciente: varchar("email_paciente", { length: 255 }),
	transferidoParaId: int("transferido_para_id"),
	transferidoEm: timestamp("transferido_em", { mode: 'string' }),
	transferidoPor: varchar("transferido_por", { length: 255 }),
	pacienteChegouEm: timestamp("paciente_chegou_em", { mode: 'string' }),
	pacienteChegouRegistradoPor: varchar("paciente_chegou_registrado_por", { length: 255 }),
	atendimentoIniciadoEm: timestamp("atendimento_iniciado_em", { mode: 'string' }),
	atendimentoIniciadoPor: varchar("atendimento_iniciado_por", { length: 255 }),
	encerradoEm: timestamp("encerrado_em", { mode: 'string' }),
	encerradoPor: varchar("encerrado_por", { length: 255 }),
},
(table) => [
	index("id_agendamento").on(table.idAgendamento),
	index("idx_agendamentos_tenant_data").on(table.tenantId, table.dataHoraInicio),
	index("idx_agendamentos_status").on(table.status),
	index("idx_agendamentos_paciente").on(table.pacienteId),
	index("idx_agendamentos_profissional").on(table.profissionalId),
	foreignKey({
			columns: [table.reagendadoDe],
			foreignColumns: [table.id],
			name: "fk_2"
		}),
]);

export const alergias = mysqlTable("alergias", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	tipo: mysqlEnum(['Medicamento','Alimento','Ambiental','Outro']).notNull(),
	substancia: varchar({ length: 255 }).notNull(),
	reacao: varchar({ length: 500 }),
	gravidade: mysqlEnum(['Leve','Moderada','Grave']),
	confirmada: tinyint().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const atendimentos = mysqlTable("atendimentos", {
	id: int().autoincrement().notNull(),
	atendimento: varchar({ length: 64 }).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id, { onDelete: "cascade" } ),
	dataAtendimento: timestamp("data_atendimento", { mode: 'string' }).notNull(),
	semana: int(),
	tipoAtendimento: varchar("tipo_atendimento", { length: 100 }),
	procedimento: varchar({ length: 255 }),
	codigosCbhpm: text("codigos_cbhpm"),
	nomePaciente: varchar("nome_paciente", { length: 255 }),
	local: varchar({ length: 100 }),
	convenio: varchar({ length: 100 }),
	planoConvenio: varchar("plano_convenio", { length: 100 }),
	pagamentoEfetivado: tinyint("pagamento_efetivado").default(0),
	pagamentoPostergado: varchar("pagamento_postergado", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataEnvioFaturamento: date("data_envio_faturamento", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataEsperadaPagamento: date("data_esperada_pagamento", { mode: 'string' }),
	faturamentoPrevisto: decimal("faturamento_previsto", { precision: 10, scale: 2 }),
	registroManualValorHm: decimal("registro_manual_valor_hm", { precision: 10, scale: 2 }),
	faturamentoPrevistoFinal: decimal("faturamento_previsto_final", { precision: 10, scale: 2 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataPagamento: date("data_pagamento", { mode: 'string' }),
	notaFiscalCorrespondente: varchar("nota_fiscal_correspondente", { length: 100 }),
	observacoes: text(),
	faturamentoLeticia: decimal("faturamento_leticia", { precision: 10, scale: 2 }),
	faturamentoAgLu: decimal("faturamento_ag_lu", { precision: 10, scale: 2 }),
	mes: int(),
	ano: int(),
	trimestre: varchar({ length: 10 }),
	trimestreAno: varchar("trimestre_ano", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	deletedBy: int("deleted_by"),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("atendimento").on(table.atendimento),
	index("idx_atendimentos_tenant").on(table.tenantId),
	index("idx_atendimentos_tenant_atendimento").on(table.tenantId, table.atendimento),
	index("idx_atendimentos_tenant_paciente").on(table.tenantId, table.pacienteId),
	index("idx_atendimentos_tenant_data").on(table.tenantId, table.dataAtendimento),
	index("idx_atendimentos_metricas").on(table.tenantId, table.pacienteId, table.dataAtendimento, table.deletedAt),
]);

export const auditLog = mysqlTable("audit_log", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	userId: int("user_id").references(() => users.id),
	userName: varchar("user_name", { length: 255 }),
	userEmail: varchar("user_email", { length: 320 }),
	action: mysqlEnum(['CREATE','UPDATE','DELETE','RESTORE','VIEW','EXPORT','LOGIN','LOGOUT','AUTHORIZE','REVOKE']).notNull(),
	entityType: mysqlEnum("entity_type", ['paciente','atendimento','user','prontuario','documento','autorizacao','tenant','session']).notNull(),
	entityId: int("entity_id").notNull(),
	entityIdentifier: varchar("entity_identifier", { length: 100 }),
	oldValues: json("old_values"),
	newValues: json("new_values"),
	changedFields: json("changed_fields"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const authLogs = mysqlTable("auth_logs", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	action: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_auth_logs_user_id").on(table.userId),
	index("idx_auth_logs_action").on(table.action),
	index("idx_auth_logs_created_at").on(table.createdAt),
]);

export const backupConfig = mysqlTable("backup_config", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	backupEnabled: tinyint("backup_enabled").default(1),
	dailyBackupTime: varchar("daily_backup_time", { length: 5 }).default('03:00'),
	weeklyBackupDay: int("weekly_backup_day").default(0),
	monthlyBackupDay: int("monthly_backup_day").default(1),
	dailyRetentionDays: int("daily_retention_days").default(30),
	weeklyRetentionWeeks: int("weekly_retention_weeks").default(12),
	monthlyRetentionMonths: int("monthly_retention_months").default(12),
	notifyOnSuccess: tinyint("notify_on_success").default(0),
	notifyOnFailure: tinyint("notify_on_failure").default(1),
	notificationEmail: varchar("notification_email", { length: 255 }),
	offlineBackupEnabled: tinyint("offline_backup_enabled").default(1),
	offlineBackupReminderDay: int("offline_backup_reminder_day").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("tenant_id").on(table.tenantId),
]);

export const backupHistory = mysqlTable("backup_history", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	backupType: mysqlEnum("backup_type", ['full','incremental','transactional','offline']).notNull(),
	status: mysqlEnum(['running','success','failed','validating']).default('running').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	filePath: varchar("file_path", { length: 500 }).notNull(),
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
	checksumSha256: varchar("checksum_sha256", { length: 64 }),
	destination: mysqlEnum(['s3_primary','s3_secondary','offline_hd']).default('s3_primary'),
	databaseRecords: int("database_records"),
	filesCount: int("files_count"),
	errorMessage: text("error_message"),
	triggeredBy: mysqlEnum("triggered_by", ['scheduled','manual','system']).default('scheduled'),
	createdByUserId: int("created_by_user_id").references(() => users.id),
	userIpAddress: varchar("user_ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	isEncrypted: tinyint("is_encrypted").default(0),
	encryptionAlgorithm: varchar("encryption_algorithm", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastVerifiedAt: timestamp("last_verified_at", { mode: 'string' }),
	verificationStatus: mysqlEnum("verification_status", ['pending','valid','invalid','error']).default('pending'),
});

export const bloqueiosHorario = mysqlTable("bloqueios_horario", {
	id: int().autoincrement().notNull(),
	idBloqueio: varchar("id_bloqueio", { length: 20 }).notNull(),
	dataHoraInicio: timestamp("data_hora_inicio", { mode: 'string' }).notNull(),
	dataHoraFim: timestamp("data_hora_fim", { mode: 'string' }).notNull(),
	tipoBloqueio: mysqlEnum("tipo_bloqueio", ['Férias','Feriado','Reunião fixa','Congresso','Particular','Outro']).notNull(),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	recorrente: tinyint().default(0),
	padraoRecorrencia: varchar("padrao_recorrencia", { length: 100 }),
	cancelado: tinyint().default(0),
	canceladoEm: timestamp("cancelado_em", { mode: 'string' }),
	canceladoPor: varchar("cancelado_por", { length: 255 }),
	motivoCancelamento: text("motivo_cancelamento"),
	criadoPor: varchar("criado_por", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("id_bloqueio").on(table.idBloqueio),
]);

export const calendarAcl = mysqlTable("calendar_acl", {
	id: varchar({ length: 36 }).notNull(),
	calendarId: varchar("calendar_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	role: mysqlEnum(['owner','editor','viewer']).default('viewer'),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("unique_calendar_user").on(table.calendarId, table.userId),
	index("idx_calendar").on(table.calendarId),
	index("idx_user").on(table.userId),
]);

export const calendars = mysqlTable("calendars", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	timezone: varchar({ length: 50 }).default('America/Sao_Paulo'),
	color: varchar({ length: 7 }).default('#3B82F6'),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_tenant").on(table.tenantId),
]);

export const cardiologia = mysqlTable("cardiologia", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataExame: date("data_exame", { mode: 'string' }).notNull(),
	tipoExame: mysqlEnum("tipo_exame", ['ECG','Ecocardiograma','Teste Ergométrico','Holter 24h','MAPA','Cintilografia Miocárdica','Cateterismo','Angiotomografia','Outro']).notNull(),
	clinicaServico: varchar("clinica_servico", { length: 255 }),
	medicoExecutor: varchar("medico_executor", { length: 255 }),
	indicacao: text(),
	descricao: text(),
	conclusao: text(),
	feve: decimal({ precision: 4, scale: 1 }),
	ddve: decimal({ precision: 4, scale: 1 }),
	dsve: decimal({ precision: 4, scale: 1 }),
	ae: decimal({ precision: 4, scale: 1 }),
	arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
	arquivoExameUrl: varchar("arquivo_exame_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const cirurgias = mysqlTable("cirurgias", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	internacaoId: int("internacao_id").references(() => internacoes.id),
	dataCirurgia: timestamp("data_cirurgia", { mode: 'string' }).notNull(),
	procedimento: varchar({ length: 500 }).notNull(),
	codigosCbhpm: text("codigos_cbhpm"),
	hospital: varchar({ length: 255 }),
	salaOperatoria: varchar("sala_operatoria", { length: 50 }),
	cirurgiaoResponsavel: varchar("cirurgiao_responsavel", { length: 255 }),
	equipe: text(),
	anestesista: varchar({ length: 255 }),
	tipoAnestesia: varchar("tipo_anestesia", { length: 100 }),
	indicacao: text(),
	descricaoCirurgica: text("descricao_cirurgica"),
	achados: text(),
	complicacoes: text(),
	duracaoMinutos: int("duracao_minutos"),
	sangramento: varchar({ length: 100 }),
	status: mysqlEnum(['Agendada','Realizada','Cancelada','Adiada']).default('Agendada'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const consultationStatusLog = mysqlTable("consultation_status_log", {
	id: varchar({ length: 36 }).notNull(),
	eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id),
	fromStatus: mysqlEnum("from_status", ['agendado','confirmado','aguardando','em_consulta','finalizado','cancelado']),
	toStatus: mysqlEnum("to_status", ['agendado','confirmado','aguardando','em_consulta','finalizado','cancelado']).notNull(),
	changedAt: datetime("changed_at", { mode: 'string'}).notNull(),
	changedByUserId: varchar("changed_by_user_id", { length: 36 }).notNull(),
	note: text(),
},
(table) => [
	index("idx_event").on(table.eventId),
	index("idx_changed_at").on(table.changedAt),
	index("idx_changed_by").on(table.changedByUserId),
]);

export const consultations = mysqlTable("consultations", {
	eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id),
	patientId: varchar("patient_id", { length: 36 }).notNull(),
	professionalId: varchar("professional_id", { length: 36 }),
	payerType: mysqlEnum("payer_type", ['particular','convenio']).default('particular'),
	payerId: varchar("payer_id", { length: 36 }),
	payerName: varchar("payer_name", { length: 255 }),
	planName: varchar("plan_name", { length: 255 }),
	memberId: varchar("member_id", { length: 50 }),
	authorizationRequired: tinyint("authorization_required").default(0),
	authorizationNumber: varchar("authorization_number", { length: 50 }),
	status: mysqlEnum(['agendado','confirmado','aguardando','em_consulta','finalizado','cancelado']).default('agendado'),
	attendanceStartedAt: datetime("attendance_started_at", { mode: 'string'}),
	attendanceEndedAt: datetime("attendance_ended_at", { mode: 'string'}),
	chiefComplaint: varchar("chief_complaint", { length: 500 }),
	notes: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_patient").on(table.patientId),
	index("idx_professional").on(table.professionalId),
	index("idx_status").on(table.status),
	index("idx_payer").on(table.payerId),
]);

export const crossTenantAccessLogs = mysqlTable("cross_tenant_access_logs", {
	id: int().autoincrement().notNull(),
	autorizacaoId: int("autorizacao_id").notNull().references(() => pacienteAutorizacoes.id),
	tenantOrigemId: int("tenant_origem_id").notNull().references(() => tenants.id),
	tenantDestinoId: int("tenant_destino_id").notNull().references(() => tenants.id),
	pacienteId: int("paciente_id").notNull(),
	userId: int("user_id").notNull(),
	tipoAcao: mysqlEnum("tipo_acao", ['visualizacao','download','impressao','criacao','edicao','exportacao']).notNull(),
	recursoTipo: varchar("recurso_tipo", { length: 50 }).notNull(),
	recursoId: int("recurso_id"),
	detalhes: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_cross_tenant_logs_autorizacao").on(table.autorizacaoId),
	index("idx_cross_tenant_logs_paciente").on(table.pacienteId),
	index("idx_cross_tenant_logs_user").on(table.userId),
	index("idx_cross_tenant_logs_created").on(table.createdAt),
]);

export const dashboardConfigs = mysqlTable("dashboard_configs", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	userId: int("user_id").notNull().references(() => users.id),
	metricasSelecionadas: text("metricas_selecionadas").notNull(),
	ordemMetricas: text("ordem_metricas"),
	periodoDefault: mysqlEnum("periodo_default", ['7d','30d','3m','6m','1a','3a','5a','todo']).default('30d'),
	layoutColunas: int("layout_colunas").default(3),
	temaGraficos: mysqlEnum("tema_graficos", ['padrao','escuro','colorido']).default('padrao'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	tamanhosWidgets: text("tamanhos_widgets"),
	periodosIndividuais: text("periodos_individuais"),
	widgetSizes: text("widget_sizes"),
	widgetPeriods: text("widget_periods"),
});

export const documentosExternos = mysqlTable("documentos_externos", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	categoriaDocumento: mysqlEnum("categoria_documento", ['Evolução','Internação','Cirurgia','Exame Laboratorial','Exame de Imagem','Endoscopia','Cardiologia','Patologia']).notNull(),
	evolucaoId: int("evolucao_id"),
	internacaoId: int("internacao_id"),
	cirurgiaId: int("cirurgia_id"),
	exameLaboratorialId: int("exame_laboratorial_id"),
	exameImagemId: int("exame_imagem_id"),
	endoscopiaId: int("endoscopia_id"),
	cardiologiaId: int("cardiologia_id"),
	patologiaId: int("patologia_id"),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataDocumento: date("data_documento", { mode: 'string' }),
	arquivoOriginalUrl: varchar("arquivo_original_url", { length: 500 }).notNull(),
	arquivoOriginalNome: varchar("arquivo_original_nome", { length: 255 }).notNull(),
	arquivoOriginalTipo: varchar("arquivo_original_tipo", { length: 50 }),
	arquivoOriginalTamanho: int("arquivo_original_tamanho"),
	arquivoPdfUrl: varchar("arquivo_pdf_url", { length: 500 }),
	arquivoPdfNome: varchar("arquivo_pdf_nome", { length: 255 }),
	textoOcr: text("texto_ocr"),
	interpretacaoIa: text("interpretacao_ia"),
	dataInterpretacao: timestamp("data_interpretacao", { mode: 'string' }),
	uploadPor: varchar("upload_por", { length: 255 }).notNull(),
	uploadEm: timestamp("upload_em", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const documentosMedicos = mysqlTable("documentos_medicos", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	evolucaoId: int("evolucao_id").references(() => evolucoes.id),
	tipo: mysqlEnum(['Receita','Receita Especial','Solicitação de Exames','Atestado Comparecimento','Atestado Afastamento','Laudo Médico','Relatório Médico','Protocolo Cirurgia','Guia SADT','Guia Internação','Outro']).notNull(),
	dataEmissao: timestamp("data_emissao", { mode: 'string' }).notNull(),
	conteudo: text(),
	medicamentos: text(),
	cid10: varchar({ length: 20 }),
	diasAfastamento: int("dias_afastamento"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInicio: date("data_inicio", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataFim: date("data_fim", { mode: 'string' }),
	examesSolicitados: text("exames_solicitados"),
	justificativa: text(),
	procedimentoProposto: varchar("procedimento_proposto", { length: 500 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataPrevista: date("data_prevista", { mode: 'string' }),
	hospitalPrevisto: varchar("hospital_previsto", { length: 255 }),
	profissionalId: int("profissional_id").references(() => users.id),
	profissionalNome: varchar("profissional_nome", { length: 255 }),
	crm: varchar({ length: 20 }),
	arquivoUrl: varchar("arquivo_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const endoscopias = mysqlTable("endoscopias", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataExame: date("data_exame", { mode: 'string' }).notNull(),
	tipoExame: mysqlEnum("tipo_exame", ['EDA','Colonoscopia','Retossigmoidoscopia','CPRE','Ecoendoscopia','Enteroscopia','Outro']).notNull(),
	clinicaServico: varchar("clinica_servico", { length: 255 }),
	medicoExecutor: varchar("medico_executor", { length: 255 }),
	indicacao: text(),
	preparo: varchar({ length: 255 }),
	sedacao: varchar({ length: 255 }),
	descricao: text(),
	conclusao: text(),
	biopsia: tinyint().default(0),
	localBiopsia: varchar("local_biopsia", { length: 255 }),
	resultadoBiopsia: text("resultado_biopsia"),
	arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
	arquivoImagensUrl: varchar("arquivo_imagens_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const events = mysqlTable("events", {
	id: varchar({ length: 36 }).notNull(),
	calendarId: varchar("calendar_id", { length: 36 }).notNull().references(() => calendars.id),
	title: varchar({ length: 255 }).notNull(),
	category: mysqlEnum(['consulta','cirurgia','procedimento','visita_internado','exame','reuniao','outro']).notNull(),
	description: text(),
	startAt: datetime("start_at", { mode: 'string'}).notNull(),
	endAt: datetime("end_at", { mode: 'string'}).notNull(),
	timezone: varchar({ length: 50 }).default('America/Sao_Paulo'),
	allDay: tinyint("all_day").default(0),
	visibility: mysqlEnum(['public','private','confidential']).default('private'),
	busyStatus: mysqlEnum("busy_status", ['busy','free','tentative']).default('busy'),
	etag: varchar({ length: 64 }),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	createdBy: varchar("created_by", { length: 36 }),
},
(table) => [
	index("idx_calendar_start").on(table.calendarId, table.startAt),
	index("idx_category").on(table.category),
	index("idx_visibility").on(table.visibility),
]);

export const evolucoes = mysqlTable("evolucoes", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	atendimentoId: int("atendimento_id").references(() => atendimentos.id),
	dataEvolucao: timestamp("data_evolucao", { mode: 'string' }).notNull(),
	tipo: mysqlEnum(['Consulta','Retorno','Urgência','Teleconsulta','Parecer']).default('Consulta'),
	subjetivo: text(),
	objetivo: text(),
	avaliacao: text(),
	plano: text(),
	pressaoArterial: varchar("pressao_arterial", { length: 20 }),
	frequenciaCardiaca: int("frequencia_cardiaca"),
	temperatura: decimal({ precision: 4, scale: 1 }),
	peso: decimal({ precision: 5, scale: 2 }),
	altura: decimal({ precision: 3, scale: 2 }),
	imc: decimal({ precision: 4, scale: 1 }),
	profissionalId: int("profissional_id").references(() => users.id),
	profissionalNome: varchar("profissional_nome", { length: 255 }),
	assinado: tinyint().default(0),
	dataAssinatura: timestamp("data_assinatura", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const examesFavoritos = mysqlTable("exames_favoritos", {
	id: int().autoincrement().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	nomeExame: varchar("nome_exame", { length: 255 }).notNull(),
	categoria: varchar({ length: 100 }).default('Geral'),
	ordem: int().default(0),
	ativo: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("unique_user_exame").on(table.userId, table.nomeExame),
]);

export const examesImagem = mysqlTable("exames_imagem", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataExame: date("data_exame", { mode: 'string' }).notNull(),
	tipoExame: mysqlEnum("tipo_exame", ['Raio-X','Tomografia','Ressonância','Ultrassonografia','Mamografia','Densitometria','PET-CT','Cintilografia','Outro']).notNull(),
	regiao: varchar({ length: 255 }).notNull(),
	clinicaServico: varchar("clinica_servico", { length: 255 }),
	medicoSolicitante: varchar("medico_solicitante", { length: 255 }),
	medicoLaudador: varchar("medico_laudador", { length: 255 }),
	indicacao: text(),
	laudo: text(),
	conclusao: text(),
	arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
	arquivoImagemUrl: varchar("arquivo_imagem_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const examesLaboratoriais = mysqlTable("exames_laboratoriais", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataColeta: date("data_coleta", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataResultado: date("data_resultado", { mode: 'string' }),
	laboratorio: varchar({ length: 255 }),
	tipoExame: varchar("tipo_exame", { length: 255 }).notNull(),
	exame: varchar({ length: 255 }).notNull(),
	resultado: text(),
	valorReferencia: varchar("valor_referencia", { length: 255 }),
	unidade: varchar({ length: 50 }),
	alterado: tinyint().default(0),
	observacoes: text(),
	arquivoUrl: varchar("arquivo_url", { length: 500 }),
	arquivoNome: varchar("arquivo_nome", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const examesPadronizados = mysqlTable("exames_padronizados", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	nome: varchar({ length: 255 }).notNull(),
	categoria: mysqlEnum(['Hemograma','Bioquímica','Função Renal','Função Hepática','Perfil Lipídico','Coagulação','Hormônios','Marcadores Tumorais','Eletrólitos','Urinálise','Sorologias','Metabolismo do Ferro','Vitaminas','Outros']).notNull(),
	unidadePadrao: varchar("unidade_padrao", { length: 50 }),
	valorRefMinMasculino: decimal("valor_ref_min_masculino", { precision: 10, scale: 4 }),
	valorRefMaxMasculino: decimal("valor_ref_max_masculino", { precision: 10, scale: 4 }),
	valorRefMinFeminino: decimal("valor_ref_min_feminino", { precision: 10, scale: 4 }),
	valorRefMaxFeminino: decimal("valor_ref_max_feminino", { precision: 10, scale: 4 }),
	sinonimos: text(),
	descricao: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("nome").on(table.nome),
]);

export const googleCalendarConfig = mysqlTable("google_calendar_config", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull(),
	userId: int("user_id").notNull(),
	syncEnabled: tinyint("sync_enabled").default(0).notNull(),
	syncDirection: mysqlEnum("sync_direction", ['bidirectional','to_google_only','from_google_only']).default('bidirectional'),
	googleCalendarId: varchar("google_calendar_id", { length: 255 }).default('primary'),
	syncConsultas: tinyint("sync_consultas").default(1),
	syncCirurgias: tinyint("sync_cirurgias").default(1),
	syncReunioes: tinyint("sync_reunioes").default(1),
	syncBloqueios: tinyint("sync_bloqueios").default(0),
	syncOutros: tinyint("sync_outros").default(1),
	includePatientName: tinyint("include_patient_name").default(0),
	includePatientPhone: tinyint("include_patient_phone").default(0),
	eventVisibility: mysqlEnum("event_visibility", ['default','public','private']).default('private'),
	lastFullSyncAt: timestamp("last_full_sync_at", { mode: 'string' }),
	lastIncrementalSyncAt: timestamp("last_incremental_sync_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_gcal_config_tenant_user").on(table.tenantId, table.userId),
]);

export const googleCalendarSync = mysqlTable("google_calendar_sync", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull(),
	agendamentoId: int("agendamento_id").notNull(),
	googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
	googleCalendarId: varchar("google_calendar_id", { length: 255 }).default('primary'),
	syncStatus: mysqlEnum("sync_status", ['synced','pending_to_google','pending_from_google','conflict','error']).default('synced').notNull(),
	lastSyncDirection: mysqlEnum("last_sync_direction", ['to_google','from_google']),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	googleUpdatedAt: timestamp("google_updated_at", { mode: 'string' }),
	gorgenUpdatedAt: timestamp("gorgen_updated_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	errorCount: int("error_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_gcal_sync_tenant").on(table.tenantId),
	index("idx_gcal_sync_agendamento").on(table.agendamentoId),
	index("idx_gcal_sync_google_event").on(table.googleEventId),
	index("idx_gcal_sync_status").on(table.syncStatus),
]);

export const historicoAgendamentos = mysqlTable("historico_agendamentos", {
	id: int().autoincrement().notNull(),
	agendamentoId: int("agendamento_id").notNull().references(() => agendamentos.id),
	tipoAlteracao: mysqlEnum("tipo_alteracao", ['Criação','Confirmação','Cancelamento','Reagendamento','Realização','Falta','Edição','Transferência','Paciente Chegou','Atendimento Iniciado','Encerramento','Reativação']).notNull(),
	descricaoAlteracao: text("descricao_alteracao"),
	valoresAnteriores: json("valores_anteriores"),
	valoresNovos: json("valores_novos"),
	realizadoPor: varchar("realizado_por", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	tenantId: int("tenant_id").default(1),
});

export const historicoMedidas = mysqlTable("historico_medidas", {
	id: int().autoincrement().notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	dataMedicao: datetime("data_medicao", { mode: 'string'}).notNull(),
	peso: decimal({ precision: 5, scale: 2 }),
	altura: decimal({ precision: 3, scale: 2 }),
	imc: decimal({ precision: 4, scale: 1 }),
	pressaoSistolica: int("pressao_sistolica"),
	pressaoDiastolica: int("pressao_diastolica"),
	frequenciaCardiaca: int("frequencia_cardiaca"),
	temperatura: decimal({ precision: 3, scale: 1 }),
	saturacao: int(),
	observacoes: text(),
	registradoPor: varchar("registrado_por", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("idx_paciente_data").on(table.pacienteId, table.dataMedicao),
]);

export const historicoSolicitacaoCirurgica = mysqlTable("historico_solicitacao_cirurgica", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	solicitacaoId: int("solicitacao_id").notNull().references(() => solicitacoesCirurgicas.id),
	statusAnterior: varchar("status_anterior", { length: 50 }),
	statusNovo: varchar("status_novo", { length: 50 }).notNull(),
	observacao: longtext(),
	alteradoPor: varchar("alterado_por", { length: 255 }),
	alteradoEm: timestamp("alterado_em", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
});

export const historicoVinculo = mysqlTable("historico_vinculo", {
	id: int().autoincrement().notNull(),
	vinculoId: int("vinculo_id").notNull().references(() => vinculoSecretariaMedico.id),
	acao: mysqlEnum(['criado','renovado','expirado','cancelado']).notNull(),
	dataAcao: datetime("data_acao", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	observacao: text(),
	tenantId: int("tenant_id").default(1),
});

export const internacoes = mysqlTable("internacoes", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	hospital: varchar({ length: 255 }).notNull(),
	setor: varchar({ length: 100 }),
	leito: varchar({ length: 50 }),
	dataAdmissao: timestamp("data_admissao", { mode: 'string' }).notNull(),
	dataAlta: timestamp("data_alta", { mode: 'string' }),
	motivoInternacao: text("motivo_internacao"),
	diagnosticoAdmissao: varchar("diagnostico_admissao", { length: 500 }),
	cid10Admissao: varchar("cid10_admissao", { length: 20 }),
	diagnosticoAlta: varchar("diagnostico_alta", { length: 500 }),
	cid10Alta: varchar("cid10_alta", { length: 20 }),
	tipoAlta: mysqlEnum("tipo_alta", ['Melhorado','Curado','Transferido','Óbito','Evasão','A pedido']),
	resumoInternacao: text("resumo_internacao"),
	complicacoes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const medicamentosUso = mysqlTable("medicamentos_uso", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	medicamento: varchar({ length: 255 }).notNull(),
	principioAtivo: varchar("principio_ativo", { length: 255 }),
	dosagem: varchar({ length: 100 }),
	posologia: varchar({ length: 255 }),
	viaAdministracao: varchar("via_administracao", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInicio: date("data_inicio", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataFim: date("data_fim", { mode: 'string' }),
	motivoUso: varchar("motivo_uso", { length: 255 }),
	prescritoPor: varchar("prescrito_por", { length: 255 }),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const medicoBancario = mysqlTable("medico_bancario", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	banco: varchar({ length: 100 }),
	agencia: varchar({ length: 20 }),
	contaCorrente: varchar("conta_corrente", { length: 30 }),
	tipoConta: mysqlEnum("tipo_conta", ['Corrente','Poupança']).default('Corrente'),
	ativo: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoCadastroPessoal = mysqlTable("medico_cadastro_pessoal", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	nomeCompleto: varchar("nome_completo", { length: 255 }).notNull(),
	nomeSocial: varchar("nome_social", { length: 255 }),
	sexo: mysqlEnum(['Masculino','Feminino','Outro']),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataNascimento: date("data_nascimento", { mode: 'string' }),
	nacionalidade: varchar({ length: 100 }).default('Brasileira'),
	ufNascimento: varchar("uf_nascimento", { length: 2 }),
	cidadeNascimento: varchar("cidade_nascimento", { length: 100 }),
	dddCelular: varchar("ddd_celular", { length: 3 }),
	celular: varchar({ length: 15 }),
	dddResidencial: varchar("ddd_residencial", { length: 3 }),
	telefoneResidencial: varchar("telefone_residencial", { length: 15 }),
	dddComercial: varchar("ddd_comercial", { length: 3 }),
	telefoneComercial: varchar("telefone_comercial", { length: 15 }),
	nomeMae: varchar("nome_mae", { length: 255 }),
	nomePai: varchar("nome_pai", { length: 255 }),
	estadoCivil: mysqlEnum("estado_civil", ['Solteiro(a)','Casado(a)','Divorciado(a)','Viúvo(a)','União Estável','Separado(a)']),
	nomeConjuge: varchar("nome_conjuge", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_profile_id").on(table.userProfileId),
]);

export const medicoConflitoInteresses = mysqlTable("medico_conflito_interesses", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	anoReferencia: int("ano_referencia").notNull(),
	dataPreenchimento: timestamp("data_preenchimento", { mode: 'string' }).notNull(),
	declaracaoUrl: varchar("declaracao_url", { length: 500 }),
	temConflito: tinyint("tem_conflito").default(0),
	descricaoConflito: text("descricao_conflito"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoConselho = mysqlTable("medico_conselho", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	conselho: varchar({ length: 20 }).default('CRM'),
	numeroRegistro: varchar("numero_registro", { length: 20 }),
	uf: varchar({ length: 2 }),
	carteiraConselhoUrl: varchar("carteira_conselho_url", { length: 500 }),
	certidaoRqeUrl: varchar("certidao_rqe_url", { length: 500 }),
	codigoValidacao: varchar("codigo_validacao", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_profile_id").on(table.userProfileId),
]);

export const medicoCredenciamento = mysqlTable("medico_credenciamento", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	localCredenciamento: varchar("local_credenciamento", { length: 255 }).notNull(),
	selecionado: tinyint().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoDocumentacao = mysqlTable("medico_documentacao", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	rg: varchar({ length: 20 }),
	rgUf: varchar("rg_uf", { length: 2 }),
	rgOrgaoEmissor: varchar("rg_orgao_emissor", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	rgDataEmissao: date("rg_data_emissao", { mode: 'string' }),
	rgDigitalizadoUrl: varchar("rg_digitalizado_url", { length: 500 }),
	numeroPis: varchar("numero_pis", { length: 20 }),
	numeroCns: varchar("numero_cns", { length: 20 }),
	cpf: varchar({ length: 14 }),
	cpfDigitalizadoUrl: varchar("cpf_digitalizado_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_profile_id").on(table.userProfileId),
]);

export const medicoDocumentos = mysqlTable("medico_documentos", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	tipo: mysqlEnum(['diploma_graduacao','carteira_conselho','certificado_especializacao','certificado_residencia','certificado_mestrado','certificado_doutorado','certificado_curso','outro']).notNull(),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	arquivoUrl: varchar("arquivo_url", { length: 500 }).notNull(),
	arquivoKey: varchar("arquivo_key", { length: 255 }).notNull(),
	arquivoNome: varchar("arquivo_nome", { length: 255 }).notNull(),
	arquivoTamanho: int("arquivo_tamanho"),
	formacaoId: int("formacao_id"),
	especializacaoId: int("especializacao_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	tenantId: int("tenant_id").default(1),
});

export const medicoEndereco = mysqlTable("medico_endereco", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	logradouro: mysqlEnum(['Rua','Avenida','Alameda','Travessa','Praça','Estrada','Rodovia','Outro']),
	enderecoResidencial: varchar("endereco_residencial", { length: 255 }),
	numero: varchar({ length: 20 }),
	complemento: varchar({ length: 100 }),
	bairro: varchar({ length: 100 }),
	cidade: varchar({ length: 100 }),
	uf: varchar({ length: 2 }),
	cep: varchar({ length: 10 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_profile_id").on(table.userProfileId),
]);

export const medicoEspecializacoes = mysqlTable("medico_especializacoes", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	especializacao: varchar({ length: 255 }).notNull(),
	instituicao: varchar({ length: 255 }).notNull(),
	tituloEspecialista: tinyint("titulo_especialista").default(0),
	registroConselho: tinyint("registro_conselho").default(0),
	rqe: varchar({ length: 20 }),
	certificadoUrl: varchar("certificado_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoFormacoes = mysqlTable("medico_formacoes", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	curso: varchar({ length: 100 }).notNull(),
	instituicao: varchar({ length: 255 }).notNull(),
	anoConclusao: int("ano_conclusao"),
	certificadoUrl: varchar("certificado_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoHistoricoProfissional = mysqlTable("medico_historico_profissional", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	instituicao: varchar({ length: 255 }).notNull(),
	cargo: varchar({ length: 100 }),
	departamento: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInicio: date("data_inicio", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataFim: date("data_fim", { mode: 'string' }),
	descricaoAtividades: text("descricao_atividades"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoLinks = mysqlTable("medico_links", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	curriculoLattes: varchar("curriculo_lattes", { length: 500 }),
	linkedin: varchar({ length: 500 }),
	orcid: varchar({ length: 100 }),
	researchGate: varchar("research_gate", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	instagram: varchar({ length: 200 }),
	facebook: varchar({ length: 500 }),
	twitter: varchar({ length: 200 }),
	tiktok: varchar({ length: 200 }),
},
(table) => [
	index("user_profile_id").on(table.userProfileId),
]);

export const medicoPosGraduacao = mysqlTable("medico_pos_graduacao", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	tipo: mysqlEnum(['Mestrado','Doutorado','Pós-Doutorado']).notNull(),
	programa: varchar({ length: 255 }).notNull(),
	instituicao: varchar({ length: 255 }).notNull(),
	anoConclusao: int("ano_conclusao"),
	tituloTese: varchar("titulo_tese", { length: 500 }),
	orientador: varchar({ length: 255 }),
	certificadoUrl: varchar("certificado_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoRecomendacoes = mysqlTable("medico_recomendacoes", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	titulo: varchar({ length: 255 }),
	recomendador: varchar({ length: 255 }),
	instituicao: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataEmissao: date("data_emissao", { mode: 'string' }),
	cartaUrl: varchar("carta_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoVacinas = mysqlTable("medico_vacinas", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	vacina: varchar({ length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataAplicacao: date("data_aplicacao", { mode: 'string' }),
	dose: varchar({ length: 50 }),
	lote: varchar({ length: 50 }),
	fabricante: varchar({ length: 100 }),
	comprovanteUrl: varchar("comprovante_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const medicoVinculos = mysqlTable("medico_vinculos", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	tipoVinculo: varchar("tipo_vinculo", { length: 100 }).notNull(),
	instituicao: varchar({ length: 255 }),
	cargo: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInicio: date("data_inicio", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataFim: date("data_fim", { mode: 'string' }),
	ativo: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const obstetricia = mysqlTable("obstetricia", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	tipoRegistro: mysqlEnum("tipo_registro", ['Pré-natal','Parto','Puerpério','Aborto']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataRegistro: date("data_registro", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dum: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dpp: date({ mode: 'string' }),
	idadeGestacional: varchar("idade_gestacional", { length: 20 }),
	tipoParto: mysqlEnum("tipo_parto", ['Normal','Cesárea','Fórceps','Vácuo']),
	dataParto: timestamp("data_parto", { mode: 'string' }),
	hospital: varchar({ length: 255 }),
	pesoRn: decimal("peso_rn", { precision: 5, scale: 0 }),
	apgar1: int("apgar_1"),
	apgar5: int("apgar_5"),
	sexoRn: mysqlEnum("sexo_rn", ['M','F']),
	observacoes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const pacienteAutorizacoes = mysqlTable("paciente_autorizacoes", {
	id: int().autoincrement().notNull(),
	tenantOrigemId: int("tenant_origem_id").default(1).notNull(),
	tenantDestinoId: int("tenant_destino_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull(),
	criadoPorUserId: int("criado_por_user_id").default(1).notNull(),
	dataInicio: datetime("data_inicio", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	dataFim: datetime("data_fim", { mode: 'string'}),
	motivo: text(),
	status: mysqlEnum(['pendente','ativa','revogada','expirada','rejeitada']).default('pendente'),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	tipoAutorizacao: mysqlEnum("tipo_autorizacao", ['leitura','escrita','completo']).default('leitura'),
	escopoAutorizacao: mysqlEnum("escopo_autorizacao", ['prontuario','atendimentos','exames','documentos','completo']).default('completo'),
	consentimentoLgpd: tinyint("consentimento_lgpd").default(0),
	dataConsentimento: timestamp("data_consentimento", { mode: 'string' }),
	ipConsentimento: varchar("ip_consentimento", { length: 45 }),
},
(table) => [
	index("idx_paciente_autorizacoes_paciente").on(table.pacienteId),
]);

export const pacientes = mysqlTable("pacientes", {
	id: int().autoincrement().notNull(),
	idPaciente: varchar("id_paciente", { length: 64 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInclusao: date("data_inclusao", { mode: 'string' }),
	pastaPaciente: varchar("pasta_paciente", { length: 255 }),
	nome: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataNascimento: date("data_nascimento", { mode: 'string' }),
	sexo: mysqlEnum(['M','F','Outro']),
	cpf: varchar({ length: 14 }),
	nomeMae: varchar("nome_mae", { length: 255 }),
	email: varchar({ length: 320 }),
	telefone: varchar({ length: 20 }),
	endereco: varchar({ length: 500 }),
	bairro: varchar({ length: 100 }),
	cep: varchar({ length: 10 }),
	cidade: varchar({ length: 100 }),
	uf: varchar({ length: 2 }),
	pais: varchar({ length: 100 }).default('Brasil'),
	operadora1: varchar("operadora_1", { length: 100 }),
	planoModalidade1: varchar("plano_modalidade_1", { length: 100 }),
	matriculaConvenio1: varchar("matricula_convenio_1", { length: 100 }),
	vigente1: varchar("vigente_1", { length: 50 }),
	privativo1: varchar("privativo_1", { length: 50 }),
	operadora2: varchar("operadora_2", { length: 100 }),
	planoModalidade2: varchar("plano_modalidade_2", { length: 100 }),
	matriculaConvenio2: varchar("matricula_convenio_2", { length: 100 }),
	vigente2: varchar("vigente_2", { length: 50 }),
	privativo2: varchar("privativo_2", { length: 50 }),
	obitoPerda: varchar("obito_perda", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataObitoLastFu: date("data_obito_last_fu", { mode: 'string' }),
	statusCaso: varchar("status_caso", { length: 50 }).default('Ativo'),
	grupoDiagnostico: varchar("grupo_diagnostico", { length: 100 }),
	diagnosticoEspecifico: text("diagnostico_especifico"),
	tempoSeguimentoAnos: decimal("tempo_seguimento_anos", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	deletedBy: int("deleted_by"),
	responsavelNome: varchar("responsavel_nome", { length: 255 }),
	responsavelParentesco: varchar("responsavel_parentesco", { length: 100 }),
	responsavelTelefone: varchar("responsavel_telefone", { length: 20 }),
	responsavelEmail: varchar("responsavel_email", { length: 320 }),
	tenantId: int("tenant_id").default(1),
	codigoLegado: varchar("codigo_legado", { length: 64 }),
	// Campos criptografados para PII
	cpfEncrypted: text("cpf_encrypted"),
	cpfHash: varchar("cpf_hash", { length: 100 }),
	emailEncrypted: text("email_encrypted"),
	emailHash: varchar("email_hash", { length: 100 }),
	telefoneEncrypted: text("telefone_encrypted"),
	responsavelTelefoneEncrypted: text("responsavel_telefone_encrypted"),
	responsavelEmailEncrypted: text("responsavel_email_encrypted"),
},
(table) => [
	index("id_paciente").on(table.idPaciente),
	index("idx_pacientes_tenant").on(table.tenantId),
	index("idx_pacientes_tenant_id_paciente").on(table.tenantId, table.idPaciente),
	index("idx_pacientes_tenant_nome").on(table.tenantId, table.nome),
	index("idx_pacientes_tenant_cpf").on(table.tenantId, table.cpf),
	index("idx_pacientes_nome").on(table.tenantId, table.nome),
	index("idx_pacientes_status").on(table.tenantId, table.statusCaso, table.deletedAt),
]);

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id),
	token: varchar({ length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("token").on(table.token),
]);

export const patologias = mysqlTable("patologias", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataColeta: date("data_coleta", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataResultado: date("data_resultado", { mode: 'string' }),
	tipoExame: mysqlEnum("tipo_exame", ['Anatomopatológico','Citopatológico','Imunohistoquímica','Hibridização in situ','Biópsia Líquida','Outro']).notNull(),
	origemMaterial: varchar("origem_material", { length: 255 }),
	tipoProcedimento: varchar("tipo_procedimento", { length: 255 }),
	laboratorio: varchar({ length: 255 }),
	patologistaResponsavel: varchar("patologista_responsavel", { length: 255 }),
	descricaoMacroscopica: text("descricao_macroscopica"),
	descricaoMicroscopica: text("descricao_microscopica"),
	diagnostico: text(),
	conclusao: text(),
	estadiamentoTnm: varchar("estadiamento_tnm", { length: 50 }),
	grauHistologico: varchar("grau_histologico", { length: 50 }),
	margemCirurgica: varchar("margem_cirurgica", { length: 100 }),
	invasaoLinfovascular: tinyint("invasao_linfovascular"),
	invasaoPerineural: tinyint("invasao_perineural"),
	ki67: varchar({ length: 20 }),
	receptorEstrogeno: varchar("receptor_estrogeno", { length: 50 }),
	receptorProgesterona: varchar("receptor_progesterona", { length: 50 }),
	her2: varchar({ length: 50 }),
	pdl1: varchar({ length: 50 }),
	outrosMarcadores: text("outros_marcadores"),
	arquivoLaudoUrl: varchar("arquivo_laudo_url", { length: 500 }),
	arquivoLaminasUrl: varchar("arquivo_laminas_url", { length: 500 }),
	observacoes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const problemasAtivos = mysqlTable("problemas_ativos", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	descricao: varchar({ length: 500 }).notNull(),
	cid10: varchar({ length: 20 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataInicio: date("data_inicio", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataResolucao: date("data_resolucao", { mode: 'string' }),
	ativo: tinyint().default(1).notNull(),
	observacoes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const profissionais = mysqlTable("profissionais", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	nome: varchar({ length: 255 }).notNull(),
	crm: varchar({ length: 20 }),
	especialidade: varchar({ length: 100 }),
	userId: int("user_id").references(() => users.id),
	corAgenda: varchar("cor_agenda", { length: 7 }).default('#3B82F6'),
	duracaoConsultaPadrao: int("duracao_consulta_padrao").default(30),
	ativo: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	duracaoSlotAgenda: int("duracao_slot_agenda").default(30),
});

export const resultadosLaboratoriais = mysqlTable("resultados_laboratoriais", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	documentoExternoId: int("documento_externo_id").references(() => documentosExternos.id),
	examePadronizadoId: int("exame_padronizado_id").references(() => examesPadronizados.id),
	nomeExameOriginal: varchar("nome_exame_original", { length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataColeta: date("data_coleta", { mode: 'string' }).notNull(),
	resultado: varchar({ length: 100 }).notNull(),
	resultadoNumerico: decimal("resultado_numerico", { precision: 15, scale: 6 }),
	unidade: varchar({ length: 50 }),
	valorReferenciaTexto: varchar("valor_referencia_texto", { length: 255 }),
	valorReferenciaMin: decimal("valor_referencia_min", { precision: 15, scale: 6 }),
	valorReferenciaMax: decimal("valor_referencia_max", { precision: 15, scale: 6 }),
	foraReferencia: tinyint("fora_referencia").default(0),
	tipoAlteracao: mysqlEnum("tipo_alteracao", ['Normal','Aumentado','Diminuído']).default('Normal'),
	laboratorio: varchar({ length: 255 }),
	extraidoPorIa: tinyint("extraido_por_ia").default(1),
	confiancaExtracao: decimal("confianca_extracao", { precision: 3, scale: 2 }),
	revisadoManualmente: tinyint("revisado_manualmente").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const resumoClinico = mysqlTable("resumo_clinico", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	historiaClinica: text("historia_clinica"),
	antecedentesPessoais: text("antecedentes_pessoais"),
	antecedentesFamiliares: text("antecedentes_familiares"),
	habitos: text(),
	gestacoes: int(),
	partos: int(),
	abortos: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dum: date({ mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	pesoAtual: decimal("peso_atual", { precision: 5, scale: 2 }),
	altura: decimal({ precision: 3, scale: 2 }),
	imc: decimal({ precision: 4, scale: 1 }),
},
(table) => [
	index("paciente_id").on(table.pacienteId),
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const solicitacoesCirurgicas = mysqlTable("solicitacoes_cirurgicas", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").notNull().references(() => tenants.id),
	idSolicitacao: varchar("id_solicitacao", { length: 20 }).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	pacienteNome: varchar("paciente_nome", { length: 255 }),
	procedimento: varchar({ length: 500 }).notNull(),
	codigoProcedimento: varchar("codigo_procedimento", { length: 50 }),
	lateralidade: mysqlEnum(['Direita','Esquerda','Bilateral','N/A']).default('N/A'),
	convenio: varchar({ length: 100 }),
	numeroCarteirinha: varchar("numero_carteirinha", { length: 50 }),
	plano: varchar({ length: 100 }),
	hospital: varchar({ length: 255 }),
	salaOperatoria: varchar("sala_operatoria", { length: 50 }),
	dataSolicitacao: timestamp("data_solicitacao", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataPrevista: date("data_prevista", { mode: 'string' }),
	horaPrevistoInicio: varchar("hora_previsto_inicio", { length: 5 }),
	horaPrevistoFim: varchar("hora_previsto_fim", { length: 5 }),
	tempoSalaMinutos: int("tempo_sala_minutos").default(120),
	cirurgiaoId: int("cirurgiao_id").references(() => users.id),
	cirurgiaoNome: varchar("cirurgiao_nome", { length: 255 }),
	auxiliar1: varchar("auxiliar_1", { length: 255 }),
	auxiliar2: varchar("auxiliar_2", { length: 255 }),
	anestesista: varchar({ length: 255 }),
	tipoAnestesia: varchar("tipo_anestesia", { length: 100 }),
	materiaisEspeciais: longtext("materiais_especiais"),
	opme: longtext(),
	exameComprobatorioUrl: varchar("exame_comprobatorio_url", { length: 500 }),
	exameComprobatorioTipo: varchar("exame_comprobatorio_tipo", { length: 100 }),
	guiaPdfUrl: varchar("guia_pdf_url", { length: 500 }),
	guiaInternacaoUrl: varchar("guia_internacao_url", { length: 500 }),
	guiaOpmeUrl: varchar("guia_opme_url", { length: 500 }),
	guiasEnviadasEm: timestamp("guias_enviadas_em", { mode: 'string' }),
	guiasEnviadasPara: varchar("guias_enviadas_para", { length: 255 }),
	numeroAutorizacao: varchar("numero_autorizacao", { length: 50 }),
	dataAutorizacao: timestamp("data_autorizacao", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	validadeAutorizacao: date("validade_autorizacao", { mode: 'string' }),
	observacoesAutorizacao: longtext("observacoes_autorizacao"),
	dataConfirmacao: timestamp("data_confirmacao", { mode: 'string' }),
	confirmadoPor: varchar("confirmado_por", { length: 255 }),
	status: mysqlEnum(['Pendente de Guias','Guias Geradas','Guias Enviadas','Em Análise','Autorizada','Negada','Confirmada','Realizada','Cancelada']).default('Pendente de Guias'),
	indicacaoCirurgica: longtext("indicacao_cirurgica"),
	observacoes: longtext(),
	agendamentoId: int("agendamento_id").references(() => agendamentos.id),
	cirurgiaId: int("cirurgia_id").references(() => cirurgias.id),
	criadoPor: varchar("criado_por", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("id_solicitacao").on(table.idSolicitacao),
]);

export const tenants = mysqlTable("tenants", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	cnpj: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	telefone: varchar({ length: 20 }),
	endereco: text(),
	logoUrl: varchar("logo_url", { length: 500 }),
	plano: mysqlEnum(['free','basic','professional','enterprise']).default('free'),
	status: mysqlEnum(['ativo','inativo','suspenso']).default('ativo'),
	dataExpiracaoPlano: datetime("data_expiracao_plano", { mode: 'string'}),
	maxUsuarios: int("max_usuarios").default(5),
	maxPacientes: int("max_pacientes").default(100),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("slug").on(table.slug),
]);

export const terapias = mysqlTable("terapias", {
	id: int().autoincrement().notNull(),
	tenantId: int("tenant_id").default(1).notNull(),
	pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
	dataTerapia: timestamp("data_terapia", { mode: 'string' }).notNull(),
	tipoTerapia: mysqlEnum("tipo_terapia", ['Quimioterapia','Imunoterapia','Terapia Alvo','Imunobiológico','Infusão','Transfusão','Outro']).notNull(),
	protocolo: varchar({ length: 255 }),
	ciclo: int(),
	dia: int(),
	medicamentos: text(),
	local: varchar({ length: 255 }),
	preQuimio: text("pre_quimio"),
	intercorrencias: text(),
	observacoes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tenant_paciente").on(table.tenantId, table.pacienteId),
]);

export const twoFactorAuth = mysqlTable("two_factor_auth", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	secret: varchar({ length: 255 }).notNull(),
	isEnabled: tinyint("is_enabled").default(0).notNull(),
	backupCodes: text("backup_codes"),
	enabledAt: timestamp("enabled_at", { mode: 'string' }),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_two_factor_auth_user_id").on(table.userId),
	index("user_id").on(table.userId),
]);

export const userCredentials = mysqlTable("user_credentials", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	username: varchar({ length: 64 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	passwordChangedAt: timestamp("password_changed_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	failedLoginAttempts: int("failed_login_attempts").default(0),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	mustChangePassword: tinyint("must_change_password").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_user_credentials_user_id").on(table.userId),
	index("idx_user_credentials_username").on(table.username),
	index("username").on(table.username),
]);

export const userPasswords = mysqlTable("user_passwords", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	salt: varchar({ length: 64 }).notNull(),
	lastChangedAt: timestamp("last_changed_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	mustChangeOnLogin: tinyint("must_change_on_login").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_id").on(table.userId),
]);

export const userProfilePhotos = mysqlTable("user_profile_photos", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id),
	fotoUrl: varchar("foto_url", { length: 500 }).notNull(),
	fotoKey: varchar("foto_key", { length: 255 }).notNull(),
	fotoNome: varchar("foto_nome", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("user_id").on(table.userId),
]);

export const userProfiles = mysqlTable("user_profiles", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	cpf: varchar({ length: 14 }),
	nomeCompleto: varchar("nome_completo", { length: 255 }),
	email: varchar({ length: 320 }),
	perfilAtivo: mysqlEnum("perfil_ativo", ['admin_master','medico','secretaria','auditor','paciente']).default('paciente').notNull(),
	isAdminMaster: tinyint("is_admin_master").default(0),
	isMedico: tinyint("is_medico").default(0),
	isSecretaria: tinyint("is_secretaria").default(0),
	isAuditor: tinyint("is_auditor").default(0).notNull(),
	isPaciente: tinyint("is_paciente").default(1).notNull(),
	crm: varchar({ length: 20 }),
	especialidade: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	especialidadePrincipal: varchar("especialidade_principal", { length: 100 }),
	especialidadeSecundaria: varchar("especialidade_secundaria", { length: 100 }),
	areaAtuacao: varchar("area_atuacao", { length: 100 }),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("unique_cpf").on(table.cpf),
	index("unique_user_id").on(table.userId),
]);

export const userSessions = mysqlTable("user_sessions", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_user_sessions_user_id").on(table.userId),
	index("idx_user_sessions_token").on(table.sessionToken),
	index("session_token").on(table.sessionToken),
]);

export const userSettings = mysqlTable("user_settings", {
	id: int().autoincrement().notNull(),
	userProfileId: int("user_profile_id").notNull(),
	categoria: varchar({ length: 50 }).notNull(),
	chave: varchar({ length: 100 }).notNull(),
	valor: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("unique_setting").on(table.userProfileId, table.categoria, table.chave),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const vinculoSecretariaMedico = mysqlTable("vinculo_secretaria_medico", {
	id: int().autoincrement().notNull(),
	secretariaUserId: varchar("secretaria_user_id", { length: 255 }).notNull(),
	medicoUserId: varchar("medico_user_id", { length: 255 }).notNull(),
	dataInicio: datetime("data_inicio", { mode: 'string'}).notNull(),
	dataValidade: datetime("data_validade", { mode: 'string'}).notNull(),
	status: mysqlEnum(['ativo','pendente_renovacao','expirado','cancelado']).default('ativo'),
	notificacaoEnviada: tinyint("notificacao_enviada").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	tenantId: int("tenant_id").default(1),
},
(table) => [
	index("unique_vinculo").on(table.secretariaUserId, table.medicoUserId),
]);


/**
 * Tabela de Delegados de Agenda - Permite que médicos deleguem acesso à sua agenda
 */
export const delegadosAgenda = mysqlTable("delegados_agenda", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1).references(() => tenants.id),
  
  // Médico que está delegando acesso
  medicoUserId: int("medico_user_id").notNull().references(() => users.id),
  
  // Email do delegado (pode não ser usuário do sistema ainda)
  delegadoEmail: varchar("delegado_email", { length: 320 }).notNull(),
  
  // Usuário delegado (preenchido quando o delegado aceita o convite)
  delegadoUserId: int("delegado_user_id").references(() => users.id),
  
  // Tipo de permissão (legado - para compatibilidade)
  permissao: varchar("permissao", { length: 50 }).default("visualizar"),
  
  // Período de validade da delegação
  dataInicio: timestamp("data_inicio", { mode: "string" }),
  dataFim: timestamp("data_fim", { mode: "string" }),
  
  // Permissões granulares
  podeVisualizar: boolean("pode_visualizar").default(true),
  podeAgendar: boolean("pode_agendar").default(false),
  podeCancelar: boolean("pode_cancelar").default(false),
  podeEditar: boolean("pode_editar").default(false),
  
  // Status
  ativo: boolean("ativo").default(true),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantMedicoIdx: index("idx_delegados_tenant_medico").on(table.tenantId, table.medicoUserId),
  tenantDelegadoIdx: index("idx_delegados_tenant_delegado").on(table.tenantId, table.delegadoUserId),
  uniqueDelegacao: index("idx_delegados_unique").on(table.medicoUserId, table.delegadoEmail),
}));

export type DelegadoAgenda = typeof delegadosAgenda.$inferSelect;
export type InsertDelegadoAgenda = typeof delegadosAgenda.$inferInsert;


// Tipos inferidos para as tabelas principais
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

export type Atendimento = typeof atendimentos.$inferSelect;
export type InsertAtendimento = typeof atendimentos.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

export type ResumoClinico = typeof resumoClinico.$inferSelect;
export type InsertResumoClinico = typeof resumoClinico.$inferInsert;

export type ProblemaAtivo = typeof problemasAtivos.$inferSelect;
export type InsertProblemaAtivo = typeof problemasAtivos.$inferInsert;

export type Alergia = typeof alergias.$inferSelect;
export type InsertAlergia = typeof alergias.$inferInsert;

export type MedicamentoUso = typeof medicamentosUso.$inferSelect;
export type InsertMedicamentoUso = typeof medicamentosUso.$inferInsert;

export type Evolucao = typeof evolucoes.$inferSelect;
export type InsertEvolucao = typeof evolucoes.$inferInsert;

export type Internacao = typeof internacoes.$inferSelect;
export type InsertInternacao = typeof internacoes.$inferInsert;

export type Cirurgia = typeof cirurgias.$inferSelect;
export type InsertCirurgia = typeof cirurgias.$inferInsert;

export type ExameLaboratorial = typeof examesLaboratoriais.$inferSelect;
export type InsertExameLaboratorial = typeof examesLaboratoriais.$inferInsert;

export type ExameImagem = typeof examesImagem.$inferSelect;
export type InsertExameImagem = typeof examesImagem.$inferInsert;

export type Documento = typeof documentosMedicos.$inferSelect;
export type InsertDocumento = typeof documentosMedicos.$inferInsert;

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = typeof agendamentos.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type BackupHistory = typeof backupHistory.$inferSelect;
export type InsertBackupHistory = typeof backupHistory.$inferInsert;

export type BackupConfig = typeof backupConfig.$inferSelect;
export type InsertBackupConfig = typeof backupConfig.$inferInsert;


export type Endoscopia = typeof endoscopias.$inferSelect;
export type InsertEndoscopia = typeof endoscopias.$inferInsert;

export type Cardiologia = typeof cardiologia.$inferSelect;
export type InsertCardiologia = typeof cardiologia.$inferInsert;

export type Terapia = typeof terapias.$inferSelect;
export type InsertTerapia = typeof terapias.$inferInsert;

export type Obstetricia = typeof obstetricia.$inferSelect;
export type InsertObstetricia = typeof obstetricia.$inferInsert;

export type DocumentoMedico = typeof documentosMedicos.$inferSelect;
export type InsertDocumentoMedico = typeof documentosMedicos.$inferInsert;

export type Patologia = typeof patologias.$inferSelect;
export type InsertPatologia = typeof patologias.$inferInsert;

export type Profissional = typeof profissionais.$inferSelect;
export type InsertProfissional = typeof profissionais.$inferInsert;

export type HistoricoMedida = typeof historicoMedidas.$inferSelect;
export type InsertHistoricoMedida = typeof historicoMedidas.$inferInsert;

export type VinculoSecretariaMedico = typeof vinculoSecretariaMedico.$inferSelect;
export type InsertVinculoSecretariaMedico = typeof vinculoSecretariaMedico.$inferInsert;

export type HistoricoVinculo = typeof historicoVinculo.$inferSelect;
export type InsertHistoricoVinculo = typeof historicoVinculo.$inferInsert;

export type ExameFavorito = typeof examesFavoritos.$inferSelect;
export type InsertExameFavorito = typeof examesFavoritos.$inferInsert;

export type PacienteAutorizacao = typeof pacienteAutorizacoes.$inferSelect;
export type InsertPacienteAutorizacao = typeof pacienteAutorizacoes.$inferInsert;

export type CrossTenantAccessLog = typeof crossTenantAccessLogs.$inferSelect;
export type InsertCrossTenantAccessLog = typeof crossTenantAccessLogs.$inferInsert;


export type BloqueioHorario = typeof bloqueiosHorario.$inferSelect;
export type InsertBloqueioHorario = typeof bloqueiosHorario.$inferInsert;

export type HistoricoAgendamento = typeof historicoAgendamentos.$inferSelect;
export type InsertHistoricoAgendamento = typeof historicoAgendamentos.$inferInsert;


export type DocumentoExterno = typeof documentosExternos.$inferSelect;
export type InsertDocumentoExterno = typeof documentosExternos.$inferInsert;

export type ResultadoLaboratorial = typeof resultadosLaboratoriais.$inferSelect;
export type InsertResultadoLaboratorial = typeof resultadosLaboratoriais.$inferInsert;

export type ExamePadronizado = typeof examesPadronizados.$inferSelect;
export type InsertExamePadronizado = typeof examesPadronizados.$inferInsert;
