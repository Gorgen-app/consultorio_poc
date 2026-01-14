CREATE TABLE `backup_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`backup_enabled` boolean DEFAULT true,
	`daily_backup_time` varchar(5) DEFAULT '03:00',
	`weekly_backup_day` int DEFAULT 0,
	`monthly_backup_day` int DEFAULT 1,
	`daily_retention_days` int DEFAULT 30,
	`weekly_retention_weeks` int DEFAULT 12,
	`monthly_retention_months` int DEFAULT 12,
	`notify_on_success` boolean DEFAULT false,
	`notify_on_failure` boolean DEFAULT true,
	`notification_email` varchar(255),
	`offline_backup_enabled` boolean DEFAULT true,
	`offline_backup_reminder_day` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `backup_config_tenant_id_unique` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `backup_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`backup_type` enum('full','incremental','transactional','offline') NOT NULL,
	`status` enum('running','success','failed','validating') NOT NULL DEFAULT 'running',
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`file_path` varchar(500) NOT NULL,
	`file_size_bytes` bigint,
	`checksum_sha256` varchar(64),
	`destination` enum('s3_primary','s3_secondary','offline_hd') DEFAULT 's3_primary',
	`database_records` int,
	`files_count` int,
	`error_message` text,
	`triggered_by` enum('scheduled','manual','system') DEFAULT 'scheduled',
	`created_by_user_id` int,
	`user_ip_address` varchar(45),
	`user_agent` varchar(500),
	`is_encrypted` boolean DEFAULT false,
	`encryption_algorithm` varchar(50),
	`last_verified_at` timestamp,
	`verification_status` enum('pending','valid','invalid','error') DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cross_tenant_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`autorizacao_id` int NOT NULL,
	`tenant_origem_id` int NOT NULL,
	`tenant_destino_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`user_id` int NOT NULL,
	`tipo_acao` enum('visualizacao','download','impressao','criacao','edicao','exportacao') NOT NULL,
	`recurso_tipo` varchar(50) NOT NULL,
	`recurso_id` int,
	`detalhes` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cross_tenant_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` int NOT NULL,
	`metricas_selecionadas` text NOT NULL,
	`ordem_metricas` text,
	`periodo_default` enum('7d','30d','3m','6m','1a','3a','5a','todo') DEFAULT '30d',
	`layout_colunas` int DEFAULT 3,
	`tema_graficos` enum('padrao','escuro','colorido') DEFAULT 'padrao',
	`widget_sizes` text,
	`widget_periods` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_solicitacao_cirurgica` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`solicitacao_id` int NOT NULL,
	`status_anterior` varchar(50),
	`status_novo` varchar(50) NOT NULL,
	`observacao` text,
	`alterado_por` varchar(255),
	`alterado_em` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	CONSTRAINT `historico_solicitacao_cirurgica_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profissionais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`crm` varchar(20),
	`especialidade` varchar(100),
	`user_id` int,
	`cor_agenda` varchar(7) DEFAULT '#3B82F6',
	`duracao_consulta_padrao` int DEFAULT 30,
	`ativo` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profissionais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solicitacoes_cirurgicas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`id_solicitacao` varchar(20) NOT NULL,
	`paciente_id` int NOT NULL,
	`paciente_nome` varchar(255),
	`procedimento` varchar(500) NOT NULL,
	`codigo_procedimento` varchar(50),
	`lateralidade` enum('Direita','Esquerda','Bilateral','N/A') DEFAULT 'N/A',
	`convenio` varchar(100),
	`numero_carteirinha` varchar(50),
	`plano` varchar(100),
	`hospital` varchar(255),
	`sala_operatoria` varchar(50),
	`data_solicitacao` timestamp NOT NULL DEFAULT (now()),
	`data_prevista` date,
	`hora_previsto_inicio` varchar(5),
	`hora_previsto_fim` varchar(5),
	`tempo_sala_minutos` int DEFAULT 120,
	`cirurgiao_id` int,
	`cirurgiao_nome` varchar(255),
	`auxiliar_1` varchar(255),
	`auxiliar_2` varchar(255),
	`anestesista` varchar(255),
	`tipo_anestesia` varchar(100),
	`materiais_especiais` text,
	`opme` text,
	`exame_comprobatorio_url` varchar(500),
	`exame_comprobatorio_tipo` varchar(100),
	`guia_pdf_url` varchar(500),
	`guia_internacao_url` varchar(500),
	`guia_opme_url` varchar(500),
	`guias_enviadas_em` timestamp,
	`guias_enviadas_para` varchar(255),
	`numero_autorizacao` varchar(50),
	`data_autorizacao` timestamp,
	`validade_autorizacao` date,
	`observacoes_autorizacao` text,
	`data_confirmacao` timestamp,
	`confirmado_por` varchar(255),
	`status_solicitacao_cirurgica` enum('Pendente de Guias','Guias Geradas','Guias Enviadas','Em Análise','Autorizada','Negada','Confirmada','Realizada','Cancelada') NOT NULL DEFAULT 'Pendente de Guias',
	`indicacao_cirurgica` text,
	`observacoes` text,
	`agendamento_id` int,
	`cirurgia_id` int,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solicitacoes_cirurgicas_id` PRIMARY KEY(`id`),
	CONSTRAINT `solicitacoes_cirurgicas_id_solicitacao_unique` UNIQUE(`id_solicitacao`)
);
--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `status` enum('pendente','ativa','revogada','expirada','rejeitada') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `google_uid` varchar(255);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `importado_de` varchar(50);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `convenio` varchar(100);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `cpf_paciente` varchar(14);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `telefone_paciente` varchar(20);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `email_paciente` varchar(255);--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `tenant_origem_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `tenant_destino_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `criado_por_user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `tipo_autorizacao` enum('leitura','escrita','completo') DEFAULT 'leitura';--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `escopo_autorizacao` enum('prontuario','atendimentos','exames','documentos','completo') DEFAULT 'completo';--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `consentimento_lgpd` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `data_consentimento` timestamp;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD `ip_consentimento` varchar(45);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `codigo_legado` varchar(64);--> statement-breakpoint
ALTER TABLE `backup_config` ADD CONSTRAINT `backup_config_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_history` ADD CONSTRAINT `backup_history_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_history` ADD CONSTRAINT `backup_history_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_autorizacao_id_paciente_autorizacoes_id_fk` FOREIGN KEY (`autorizacao_id`) REFERENCES `paciente_autorizacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_tenant_origem_id_tenants_id_fk` FOREIGN KEY (`tenant_origem_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_tenant_destino_id_tenants_id_fk` FOREIGN KEY (`tenant_destino_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD CONSTRAINT `dashboard_configs_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD CONSTRAINT `dashboard_configs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_solicitacao_id_solicitacoes_cirurgicas_id_fk` FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes_cirurgicas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgiao_id_users_id_fk` FOREIGN KEY (`cirurgiao_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_origem_id_tenants_id_fk` FOREIGN KEY (`tenant_origem_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_destino_id_tenants_id_fk` FOREIGN KEY (`tenant_destino_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP COLUMN `tenant_id`;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP COLUMN `autorizado_por_user_id`;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP COLUMN `autorizado_para_user_id`;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP COLUMN `tipo_acesso`;