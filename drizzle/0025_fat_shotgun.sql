DROP TABLE `auth_logs`;--> statement-breakpoint
DROP TABLE `calendar_acl`;--> statement-breakpoint
DROP TABLE `calendars`;--> statement-breakpoint
DROP TABLE `consultation_status_log`;--> statement-breakpoint
DROP TABLE `consultations`;--> statement-breakpoint
DROP TABLE `delegados_agenda`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `google_calendar_config`;--> statement-breakpoint
DROP TABLE `google_calendar_sync`;--> statement-breakpoint
DROP TABLE `historico_solicitacao_cirurgica`;--> statement-breakpoint
DROP TABLE `medico_bancario`;--> statement-breakpoint
DROP TABLE `medico_cadastro_pessoal`;--> statement-breakpoint
DROP TABLE `medico_conflito_interesses`;--> statement-breakpoint
DROP TABLE `medico_conselho`;--> statement-breakpoint
DROP TABLE `medico_credenciamento`;--> statement-breakpoint
DROP TABLE `medico_documentacao`;--> statement-breakpoint
DROP TABLE `medico_documentos`;--> statement-breakpoint
DROP TABLE `medico_endereco`;--> statement-breakpoint
DROP TABLE `medico_especializacoes`;--> statement-breakpoint
DROP TABLE `medico_formacoes`;--> statement-breakpoint
DROP TABLE `medico_historico_profissional`;--> statement-breakpoint
DROP TABLE `medico_links`;--> statement-breakpoint
DROP TABLE `medico_pos_graduacao`;--> statement-breakpoint
DROP TABLE `medico_recomendacoes`;--> statement-breakpoint
DROP TABLE `medico_vacinas`;--> statement-breakpoint
DROP TABLE `medico_vinculos`;--> statement-breakpoint
DROP TABLE `password_reset_tokens`;--> statement-breakpoint
DROP TABLE `profissionais`;--> statement-breakpoint
DROP TABLE `solicitacoes_cirurgicas`;--> statement-breakpoint
DROP TABLE `two_factor_auth`;--> statement-breakpoint
DROP TABLE `user_credentials`;--> statement-breakpoint
DROP TABLE `user_passwords`;--> statement-breakpoint
DROP TABLE `user_profile_photos`;--> statement-breakpoint
DROP TABLE `user_sessions`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP FOREIGN KEY `agendamentos_profissional_id_profissionais_id_fk`;
--> statement-breakpoint
ALTER TABLE `agendamentos` DROP FOREIGN KEY `fk_2`;
--> statement-breakpoint
ALTER TABLE `atendimentos` DROP FOREIGN KEY `atendimentos_paciente_id_pacientes_id_fk`;
--> statement-breakpoint
ALTER TABLE `historico_medidas` DROP FOREIGN KEY `historico_medidas_paciente_id_pacientes_id_fk`;
--> statement-breakpoint
ALTER TABLE `historico_vinculo` DROP FOREIGN KEY `historico_vinculo_vinculo_id_vinculo_secretaria_medico_id_fk`;
--> statement-breakpoint
DROP INDEX `id_agendamento` ON `agendamentos`;--> statement-breakpoint
DROP INDEX `idx_agendamentos_tenant_data` ON `agendamentos`;--> statement-breakpoint
DROP INDEX `idx_agendamentos_status` ON `agendamentos`;--> statement-breakpoint
DROP INDEX `idx_agendamentos_paciente` ON `agendamentos`;--> statement-breakpoint
DROP INDEX `idx_agendamentos_profissional` ON `agendamentos`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `alergias`;--> statement-breakpoint
DROP INDEX `atendimento` ON `atendimentos`;--> statement-breakpoint
DROP INDEX `idx_atendimentos_metricas` ON `atendimentos`;--> statement-breakpoint
DROP INDEX `tenant_id` ON `backup_config`;--> statement-breakpoint
DROP INDEX `id_bloqueio` ON `bloqueios_horario`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `cardiologia`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `cirurgias`;--> statement-breakpoint
DROP INDEX `idx_cross_tenant_logs_autorizacao` ON `cross_tenant_access_logs`;--> statement-breakpoint
DROP INDEX `idx_cross_tenant_logs_paciente` ON `cross_tenant_access_logs`;--> statement-breakpoint
DROP INDEX `idx_cross_tenant_logs_user` ON `cross_tenant_access_logs`;--> statement-breakpoint
DROP INDEX `idx_cross_tenant_logs_created` ON `cross_tenant_access_logs`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `documentos_externos`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `documentos_medicos`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `endoscopias`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `evolucoes`;--> statement-breakpoint
DROP INDEX `unique_user_exame` ON `exames_favoritos`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `exames_imagem`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `exames_laboratoriais`;--> statement-breakpoint
DROP INDEX `nome` ON `exames_padronizados`;--> statement-breakpoint
DROP INDEX `idx_paciente_data` ON `historico_medidas`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `internacoes`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `medicamentos_uso`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `obstetricia`;--> statement-breakpoint
DROP INDEX `idx_paciente_autorizacoes_paciente` ON `paciente_autorizacoes`;--> statement-breakpoint
DROP INDEX `id_paciente` ON `pacientes`;--> statement-breakpoint
DROP INDEX `idx_pacientes_nome` ON `pacientes`;--> statement-breakpoint
DROP INDEX `idx_pacientes_status` ON `pacientes`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `patologias`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `problemas_ativos`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `resultados_laboratoriais`;--> statement-breakpoint
DROP INDEX `paciente_id` ON `resumo_clinico`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `resumo_clinico`;--> statement-breakpoint
DROP INDEX `slug` ON `tenants`;--> statement-breakpoint
DROP INDEX `idx_tenant_paciente` ON `terapias`;--> statement-breakpoint
DROP INDEX `unique_cpf` ON `user_profiles`;--> statement-breakpoint
DROP INDEX `unique_user_id` ON `user_profiles`;--> statement-breakpoint
DROP INDEX `unique_setting` ON `user_settings`;--> statement-breakpoint
DROP INDEX `users_openId_unique` ON `users`;--> statement-breakpoint
DROP INDEX `unique_vinculo` ON `vinculo_secretaria_medico`;--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `status` enum('Agendado','Confirmado','Aguardando','Em atendimento','Realizado','Cancelado','Reagendado','Faltou') NOT NULL DEFAULT 'Agendado';--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `confirmada` boolean;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `confirmada` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `pagamento_efetivado` boolean;--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `pagamento_efetivado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `backup_enabled` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_success` boolean;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_success` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_failure` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `offline_backup_enabled` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `is_encrypted` boolean;--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `is_encrypted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `recorrente` boolean;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `recorrente` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `cancelado` boolean;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `cancelado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cardiologia` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cardiologia` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cirurgias` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cirurgias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `dashboard_configs` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `dashboard_configs` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `upload_em` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `documentos_medicos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos_medicos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `biopsia` boolean;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `biopsia` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `assinado` boolean;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `assinado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `ativo` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_imagem` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_imagem` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `alterado` boolean;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `alterado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `exames_padronizados` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_padronizados` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `tipo_alteracao` enum('Criação','Confirmação','Cancelamento','Reagendamento','Realização','Falta','Edição') NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `data_medicao` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_vinculo` MODIFY COLUMN `data_acao` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `historico_vinculo` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `internacoes` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `internacoes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `ativo` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `obstetricia` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `obstetricia` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `tenant_origem_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `tenant_destino_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `criado_por_user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `data_inicio` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `data_fim` timestamp;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `consentimento_lgpd` boolean;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `consentimento_lgpd` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `invasao_linfovascular` boolean;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `invasao_perineural` boolean;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `ativo` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `fora_referencia` boolean;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `fora_referencia` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `extraido_por_ia` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `revisado_manualmente` boolean;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `revisado_manualmente` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `resumo_clinico` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `resumo_clinico` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `data_expiracao_plano` timestamp;--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `terapias` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `terapias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_admin_master` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_admin_master` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_medico` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_medico` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_secretaria` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_secretaria` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_auditor` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_auditor` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_paciente` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `notificacao_enviada` boolean;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `notificacao_enviada` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `alergias` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `atendimentos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `audit_log` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `backup_config` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `backup_history` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `cardiologia` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `cirurgias` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `endoscopias` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `evolucoes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `exames_favoritos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `internacoes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `obstetricia` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `pacientes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `patologias` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `tenants` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `terapias` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_settings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_id_agendamento_unique` UNIQUE(`id_agendamento`);--> statement-breakpoint
ALTER TABLE `backup_config` ADD CONSTRAINT `backup_config_tenant_id_unique` UNIQUE(`tenant_id`);--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD CONSTRAINT `bloqueios_horario_id_bloqueio_unique` UNIQUE(`id_bloqueio`);--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD CONSTRAINT `exames_padronizados_nome_unique` UNIQUE(`nome`);--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_paciente_id_unique` UNIQUE(`paciente_id`);--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_cpf_unique` UNIQUE(`cpf`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_reagendado_de_agendamentos_id_fk` FOREIGN KEY (`reagendado_de`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD CONSTRAINT `bloqueios_horario_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD CONSTRAINT `cardiologia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_evolucao_id_evolucoes_id_fk` FOREIGN KEY (`evolucao_id`) REFERENCES `evolucoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_internacao_id_internacoes_id_fk` FOREIGN KEY (`internacao_id`) REFERENCES `internacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_laboratorial_id_exames_laboratoriais_id_fk` FOREIGN KEY (`exame_laboratorial_id`) REFERENCES `exames_laboratoriais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_imagem_id_exames_imagem_id_fk` FOREIGN KEY (`exame_imagem_id`) REFERENCES `exames_imagem`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_endoscopia_id_endoscopias_id_fk` FOREIGN KEY (`endoscopia_id`) REFERENCES `endoscopias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cardiologia_id_cardiologia_id_fk` FOREIGN KEY (`cardiologia_id`) REFERENCES `cardiologia`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD CONSTRAINT `endoscopias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_favoritos` ADD CONSTRAINT `exames_favoritos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD CONSTRAINT `exames_imagem_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD CONSTRAINT `exames_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD CONSTRAINT `exames_padronizados_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD CONSTRAINT `historico_agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD CONSTRAINT `historico_medidas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD CONSTRAINT `historico_vinculo_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internacoes` ADD CONSTRAINT `internacoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD CONSTRAINT `medicamentos_uso_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD CONSTRAINT `obstetricia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_origem_id_tenants_id_fk` FOREIGN KEY (`tenant_origem_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_destino_id_tenants_id_fk` FOREIGN KEY (`tenant_destino_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patologias` ADD CONSTRAINT `patologias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD CONSTRAINT `problemas_ativos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terapias` ADD CONSTRAINT `terapias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` ADD CONSTRAINT `vinculo_secretaria_medico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `profissional_id`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `transferido_para_id`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `transferido_em`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `transferido_por`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `paciente_chegou_em`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `paciente_chegou_registrado_por`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `atendimento_iniciado_em`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `atendimento_iniciado_por`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `encerrado_em`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `encerrado_por`;--> statement-breakpoint
ALTER TABLE `dashboard_configs` DROP COLUMN `tamanhos_widgets`;--> statement-breakpoint
ALTER TABLE `dashboard_configs` DROP COLUMN `periodos_individuais`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `cpf_encrypted`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `cpf_hash`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `email_encrypted`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `email_hash`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `telefone_encrypted`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `responsavel_telefone_encrypted`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP COLUMN `responsavel_email_encrypted`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP COLUMN `especialidade_principal`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP COLUMN `especialidade_secundaria`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP COLUMN `area_atuacao`;