import { relations } from "drizzle-orm/relations";
import { pacientes, agendamentos, atendimentos, profissionais, alergias, users, auditLog, authLogs, tenants, backupConfig, backupHistory, cardiologia, cirurgias, internacoes, events, consultationStatusLog, consultations, pacienteAutorizacoes, crossTenantAccessLogs, dashboardConfigs, documentosExternos, documentosMedicos, evolucoes, endoscopias, calendars, examesImagem, examesLaboratoriais, historicoAgendamentos, historicoMedidas, historicoSolicitacaoCirurgica, solicitacoesCirurgicas, vinculoSecretariaMedico, historicoVinculo, medicamentosUso, obstetricia, passwordResetTokens, patologias, problemasAtivos, resultadosLaboratoriais, examesPadronizados, resumoClinico, terapias, twoFactorAuth, userCredentials, userPasswords, userProfilePhotos, userSessions } from "./schema";

export const agendamentosRelations = relations(agendamentos, ({one, many}) => ({
	paciente: one(pacientes, {
		fields: [agendamentos.pacienteId],
		references: [pacientes.id]
	}),
	agendamento: one(agendamentos, {
		fields: [agendamentos.reagendadoDe],
		references: [agendamentos.id],
		relationName: "agendamentos_reagendadoDe_agendamentos_id"
	}),
	agendamentos: many(agendamentos, {
		relationName: "agendamentos_reagendadoDe_agendamentos_id"
	}),
	atendimento: one(atendimentos, {
		fields: [agendamentos.atendimentoId],
		references: [atendimentos.id]
	}),
	profissionai: one(profissionais, {
		fields: [agendamentos.profissionalId],
		references: [profissionais.id]
	}),
	historicoAgendamentos: many(historicoAgendamentos),
	solicitacoesCirurgicas: many(solicitacoesCirurgicas),
}));

export const pacientesRelations = relations(pacientes, ({many}) => ({
	agendamentos: many(agendamentos),
	alergias: many(alergias),
	atendimentos: many(atendimentos),
	cardiologias: many(cardiologia),
	cirurgias: many(cirurgias),
	documentosExternos: many(documentosExternos),
	documentosMedicos: many(documentosMedicos),
	endoscopias: many(endoscopias),
	evolucoes: many(evolucoes),
	examesImagems: many(examesImagem),
	examesLaboratoriais: many(examesLaboratoriais),
	historicoMedidas: many(historicoMedidas),
	internacoes: many(internacoes),
	medicamentosUsos: many(medicamentosUso),
	obstetricias: many(obstetricia),
	patologias: many(patologias),
	problemasAtivos: many(problemasAtivos),
	resultadosLaboratoriais: many(resultadosLaboratoriais),
	resumoClinicos: many(resumoClinico),
	solicitacoesCirurgicas: many(solicitacoesCirurgicas),
	terapias: many(terapias),
}));

export const atendimentosRelations = relations(atendimentos, ({one, many}) => ({
	agendamentos: many(agendamentos),
	paciente: one(pacientes, {
		fields: [atendimentos.pacienteId],
		references: [pacientes.id]
	}),
	evolucoes: many(evolucoes),
}));

export const profissionaisRelations = relations(profissionais, ({one, many}) => ({
	agendamentos: many(agendamentos),
	tenant: one(tenants, {
		fields: [profissionais.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [profissionais.userId],
		references: [users.id]
	}),
}));

export const alergiasRelations = relations(alergias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [alergias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(users, {
		fields: [auditLog.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	auditLogs: many(auditLog),
	authLogs: many(authLogs),
	backupHistories: many(backupHistory),
	dashboardConfigs: many(dashboardConfigs),
	documentosMedicos: many(documentosMedicos),
	evolucoes: many(evolucoes),
	passwordResetTokens: many(passwordResetTokens),
	profissionais: many(profissionais),
	solicitacoesCirurgicas: many(solicitacoesCirurgicas),
	twoFactorAuths: many(twoFactorAuth),
	userCredentials: many(userCredentials),
	userPasswords: many(userPasswords),
	userProfilePhotos: many(userProfilePhotos),
	userSessions: many(userSessions),
}));

export const authLogsRelations = relations(authLogs, ({one}) => ({
	user: one(users, {
		fields: [authLogs.userId],
		references: [users.id]
	}),
}));

export const backupConfigRelations = relations(backupConfig, ({one}) => ({
	tenant: one(tenants, {
		fields: [backupConfig.tenantId],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	backupConfigs: many(backupConfig),
	backupHistories: many(backupHistory),
	crossTenantAccessLogs_tenantOrigemId: many(crossTenantAccessLogs, {
		relationName: "crossTenantAccessLogs_tenantOrigemId_tenants_id"
	}),
	crossTenantAccessLogs_tenantDestinoId: many(crossTenantAccessLogs, {
		relationName: "crossTenantAccessLogs_tenantDestinoId_tenants_id"
	}),
	dashboardConfigs: many(dashboardConfigs),
	historicoSolicitacaoCirurgicas: many(historicoSolicitacaoCirurgica),
	profissionais: many(profissionais),
	solicitacoesCirurgicas: many(solicitacoesCirurgicas),
}));

export const backupHistoryRelations = relations(backupHistory, ({one}) => ({
	tenant: one(tenants, {
		fields: [backupHistory.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [backupHistory.createdByUserId],
		references: [users.id]
	}),
}));

export const cardiologiaRelations = relations(cardiologia, ({one}) => ({
	paciente: one(pacientes, {
		fields: [cardiologia.pacienteId],
		references: [pacientes.id]
	}),
}));

export const cirurgiasRelations = relations(cirurgias, ({one, many}) => ({
	paciente: one(pacientes, {
		fields: [cirurgias.pacienteId],
		references: [pacientes.id]
	}),
	internacoe: one(internacoes, {
		fields: [cirurgias.internacaoId],
		references: [internacoes.id]
	}),
	solicitacoesCirurgicas: many(solicitacoesCirurgicas),
}));

export const internacoesRelations = relations(internacoes, ({one, many}) => ({
	cirurgias: many(cirurgias),
	paciente: one(pacientes, {
		fields: [internacoes.pacienteId],
		references: [pacientes.id]
	}),
}));

export const consultationStatusLogRelations = relations(consultationStatusLog, ({one}) => ({
	event: one(events, {
		fields: [consultationStatusLog.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	consultationStatusLogs: many(consultationStatusLog),
	consultations: many(consultations),
	calendar: one(calendars, {
		fields: [events.calendarId],
		references: [calendars.id]
	}),
}));

export const consultationsRelations = relations(consultations, ({one}) => ({
	event: one(events, {
		fields: [consultations.eventId],
		references: [events.id]
	}),
}));

export const crossTenantAccessLogsRelations = relations(crossTenantAccessLogs, ({one}) => ({
	pacienteAutorizacoe: one(pacienteAutorizacoes, {
		fields: [crossTenantAccessLogs.autorizacaoId],
		references: [pacienteAutorizacoes.id]
	}),
	tenant_tenantOrigemId: one(tenants, {
		fields: [crossTenantAccessLogs.tenantOrigemId],
		references: [tenants.id],
		relationName: "crossTenantAccessLogs_tenantOrigemId_tenants_id"
	}),
	tenant_tenantDestinoId: one(tenants, {
		fields: [crossTenantAccessLogs.tenantDestinoId],
		references: [tenants.id],
		relationName: "crossTenantAccessLogs_tenantDestinoId_tenants_id"
	}),
}));

export const pacienteAutorizacoesRelations = relations(pacienteAutorizacoes, ({many}) => ({
	crossTenantAccessLogs: many(crossTenantAccessLogs),
}));

export const dashboardConfigsRelations = relations(dashboardConfigs, ({one}) => ({
	tenant: one(tenants, {
		fields: [dashboardConfigs.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [dashboardConfigs.userId],
		references: [users.id]
	}),
}));

export const documentosExternosRelations = relations(documentosExternos, ({one, many}) => ({
	paciente: one(pacientes, {
		fields: [documentosExternos.pacienteId],
		references: [pacientes.id]
	}),
	resultadosLaboratoriais: many(resultadosLaboratoriais),
}));

export const documentosMedicosRelations = relations(documentosMedicos, ({one}) => ({
	paciente: one(pacientes, {
		fields: [documentosMedicos.pacienteId],
		references: [pacientes.id]
	}),
	evolucoe: one(evolucoes, {
		fields: [documentosMedicos.evolucaoId],
		references: [evolucoes.id]
	}),
	user: one(users, {
		fields: [documentosMedicos.profissionalId],
		references: [users.id]
	}),
}));

export const evolucoesRelations = relations(evolucoes, ({one, many}) => ({
	documentosMedicos: many(documentosMedicos),
	paciente: one(pacientes, {
		fields: [evolucoes.pacienteId],
		references: [pacientes.id]
	}),
	atendimento: one(atendimentos, {
		fields: [evolucoes.atendimentoId],
		references: [atendimentos.id]
	}),
	user: one(users, {
		fields: [evolucoes.profissionalId],
		references: [users.id]
	}),
}));

export const endoscopiasRelations = relations(endoscopias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [endoscopias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const calendarsRelations = relations(calendars, ({many}) => ({
	events: many(events),
}));

export const examesImagemRelations = relations(examesImagem, ({one}) => ({
	paciente: one(pacientes, {
		fields: [examesImagem.pacienteId],
		references: [pacientes.id]
	}),
}));

export const examesLaboratoriaisRelations = relations(examesLaboratoriais, ({one}) => ({
	paciente: one(pacientes, {
		fields: [examesLaboratoriais.pacienteId],
		references: [pacientes.id]
	}),
}));

export const historicoAgendamentosRelations = relations(historicoAgendamentos, ({one}) => ({
	agendamento: one(agendamentos, {
		fields: [historicoAgendamentos.agendamentoId],
		references: [agendamentos.id]
	}),
}));

export const historicoMedidasRelations = relations(historicoMedidas, ({one}) => ({
	paciente: one(pacientes, {
		fields: [historicoMedidas.pacienteId],
		references: [pacientes.id]
	}),
}));

export const historicoSolicitacaoCirurgicaRelations = relations(historicoSolicitacaoCirurgica, ({one}) => ({
	tenant: one(tenants, {
		fields: [historicoSolicitacaoCirurgica.tenantId],
		references: [tenants.id]
	}),
	solicitacoesCirurgica: one(solicitacoesCirurgicas, {
		fields: [historicoSolicitacaoCirurgica.solicitacaoId],
		references: [solicitacoesCirurgicas.id]
	}),
}));

export const solicitacoesCirurgicasRelations = relations(solicitacoesCirurgicas, ({one, many}) => ({
	historicoSolicitacaoCirurgicas: many(historicoSolicitacaoCirurgica),
	tenant: one(tenants, {
		fields: [solicitacoesCirurgicas.tenantId],
		references: [tenants.id]
	}),
	paciente: one(pacientes, {
		fields: [solicitacoesCirurgicas.pacienteId],
		references: [pacientes.id]
	}),
	user: one(users, {
		fields: [solicitacoesCirurgicas.cirurgiaoId],
		references: [users.id]
	}),
	agendamento: one(agendamentos, {
		fields: [solicitacoesCirurgicas.agendamentoId],
		references: [agendamentos.id]
	}),
	cirurgia: one(cirurgias, {
		fields: [solicitacoesCirurgicas.cirurgiaId],
		references: [cirurgias.id]
	}),
}));

export const historicoVinculoRelations = relations(historicoVinculo, ({one}) => ({
	vinculoSecretariaMedico: one(vinculoSecretariaMedico, {
		fields: [historicoVinculo.vinculoId],
		references: [vinculoSecretariaMedico.id]
	}),
}));

export const vinculoSecretariaMedicoRelations = relations(vinculoSecretariaMedico, ({many}) => ({
	historicoVinculos: many(historicoVinculo),
}));

export const medicamentosUsoRelations = relations(medicamentosUso, ({one}) => ({
	paciente: one(pacientes, {
		fields: [medicamentosUso.pacienteId],
		references: [pacientes.id]
	}),
}));

export const obstetriciaRelations = relations(obstetricia, ({one}) => ({
	paciente: one(pacientes, {
		fields: [obstetricia.pacienteId],
		references: [pacientes.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const patologiasRelations = relations(patologias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [patologias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const problemasAtivosRelations = relations(problemasAtivos, ({one}) => ({
	paciente: one(pacientes, {
		fields: [problemasAtivos.pacienteId],
		references: [pacientes.id]
	}),
}));

export const resultadosLaboratoriaisRelations = relations(resultadosLaboratoriais, ({one}) => ({
	paciente: one(pacientes, {
		fields: [resultadosLaboratoriais.pacienteId],
		references: [pacientes.id]
	}),
	documentosExterno: one(documentosExternos, {
		fields: [resultadosLaboratoriais.documentoExternoId],
		references: [documentosExternos.id]
	}),
	examesPadronizado: one(examesPadronizados, {
		fields: [resultadosLaboratoriais.examePadronizadoId],
		references: [examesPadronizados.id]
	}),
}));

export const examesPadronizadosRelations = relations(examesPadronizados, ({many}) => ({
	resultadosLaboratoriais: many(resultadosLaboratoriais),
}));

export const resumoClinicoRelations = relations(resumoClinico, ({one}) => ({
	paciente: one(pacientes, {
		fields: [resumoClinico.pacienteId],
		references: [pacientes.id]
	}),
}));

export const terapiasRelations = relations(terapias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [terapias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const twoFactorAuthRelations = relations(twoFactorAuth, ({one}) => ({
	user: one(users, {
		fields: [twoFactorAuth.userId],
		references: [users.id]
	}),
}));

export const userCredentialsRelations = relations(userCredentials, ({one}) => ({
	user: one(users, {
		fields: [userCredentials.userId],
		references: [users.id]
	}),
}));

export const userPasswordsRelations = relations(userPasswords, ({one}) => ({
	user: one(users, {
		fields: [userPasswords.userId],
		references: [users.id]
	}),
}));

export const userProfilePhotosRelations = relations(userProfilePhotos, ({one}) => ({
	user: one(users, {
		fields: [userProfilePhotos.userId],
		references: [users.id]
	}),
}));

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));