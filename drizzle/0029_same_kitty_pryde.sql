CREATE INDEX `idx_agendamentos_tenant_data` ON `agendamentos` (`tenant_id`,`data_hora_inicio`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_data_status` ON `agendamentos` (`data_hora_inicio`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_paciente` ON `agendamentos` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_google_uid` ON `agendamentos` (`google_uid`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_entity` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_user_date` ON `audit_log` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_tenant_date` ON `audit_log` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_docs_medicos_paciente_tipo` ON `documentos_medicos` (`paciente_id`,`tipo`);--> statement-breakpoint
CREATE INDEX `idx_docs_medicos_paciente_data` ON `documentos_medicos` (`paciente_id`,`data_emissao`);--> statement-breakpoint
CREATE INDEX `idx_evolucoes_paciente_data` ON `evolucoes` (`paciente_id`,`data_evolucao`);--> statement-breakpoint
CREATE INDEX `idx_evolucoes_tenant_paciente` ON `evolucoes` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_resultados_lab_paciente_data` ON `resultados_laboratoriais` (`paciente_id`,`data_coleta`);--> statement-breakpoint
CREATE INDEX `idx_resultados_lab_paciente_exame` ON `resultados_laboratoriais` (`paciente_id`,`nome_exame_original`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_tenant` ON `user_profiles` (`tenant_id`);