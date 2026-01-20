CREATE TABLE `auth_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`details` text,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `calendar_acl` (
	`id` varchar(36) NOT NULL,
	`calendar_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('owner','editor','viewer') DEFAULT 'viewer',
	`created_at` datetime DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `calendars` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`timezone` varchar(50) DEFAULT 'America/Sao_Paulo',
	`color` varchar(7) DEFAULT '#3B82F6',
	`created_at` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `consultation_status_log` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`from_status` enum('agendado','confirmado','aguardando','em_consulta','finalizado','cancelado'),
	`to_status` enum('agendado','confirmado','aguardando','em_consulta','finalizado','cancelado') NOT NULL,
	`changed_at` datetime NOT NULL,
	`changed_by_user_id` varchar(36) NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`event_id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`professional_id` varchar(36),
	`payer_type` enum('particular','convenio') DEFAULT 'particular',
	`payer_id` varchar(36),
	`payer_name` varchar(255),
	`plan_name` varchar(255),
	`member_id` varchar(50),
	`authorization_required` tinyint DEFAULT 0,
	`authorization_number` varchar(50),
	`status` enum('agendado','confirmado','aguardando','em_consulta','finalizado','cancelado') DEFAULT 'agendado',
	`attendance_started_at` datetime,
	`attendance_ended_at` datetime,
	`chief_complaint` varchar(500),
	`notes` text,
	`created_at` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`calendar_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('consulta','cirurgia','procedimento','visita_internado','exame','reuniao','outro') NOT NULL,
	`description` text,
	`start_at` datetime NOT NULL,
	`end_at` datetime NOT NULL,
	`timezone` varchar(50) DEFAULT 'America/Sao_Paulo',
	`all_day` tinyint DEFAULT 0,
	`visibility` enum('public','private','confidential') DEFAULT 'private',
	`busy_status` enum('busy','free','tentative') DEFAULT 'busy',
	`etag` varchar(64),
	`created_at` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(36)
);
--> statement-breakpoint
CREATE TABLE `google_calendar_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` int NOT NULL,
	`sync_enabled` tinyint NOT NULL DEFAULT 0,
	`sync_direction` enum('bidirectional','to_google_only','from_google_only') DEFAULT 'bidirectional',
	`google_calendar_id` varchar(255) DEFAULT 'primary',
	`sync_consultas` tinyint DEFAULT 1,
	`sync_cirurgias` tinyint DEFAULT 1,
	`sync_reunioes` tinyint DEFAULT 1,
	`sync_bloqueios` tinyint DEFAULT 0,
	`sync_outros` tinyint DEFAULT 1,
	`include_patient_name` tinyint DEFAULT 0,
	`include_patient_phone` tinyint DEFAULT 0,
	`event_visibility` enum('default','public','private') DEFAULT 'private',
	`last_full_sync_at` timestamp,
	`last_incremental_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `google_calendar_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`agendamento_id` int NOT NULL,
	`google_event_id` varchar(255) NOT NULL,
	`google_calendar_id` varchar(255) DEFAULT 'primary',
	`sync_status` enum('synced','pending_to_google','pending_from_google','conflict','error') NOT NULL DEFAULT 'synced',
	`last_sync_direction` enum('to_google','from_google'),
	`last_sync_at` timestamp,
	`google_updated_at` timestamp,
	`gorgen_updated_at` timestamp,
	`error_message` text,
	`error_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `historico_solicitacao_cirurgica` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`solicitacao_id` int NOT NULL,
	`status_anterior` varchar(50),
	`status_novo` varchar(50) NOT NULL,
	`observacao` longtext,
	`alterado_por` varchar(255),
	`alterado_em` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`ip_address` varchar(45),
	`user_agent` varchar(500)
);
--> statement-breakpoint
CREATE TABLE `medico_bancario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta_corrente` varchar(30),
	`tipo_conta` enum('Corrente','Poupança') DEFAULT 'Corrente',
	`ativo` tinyint DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_cadastro_pessoal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`nome_completo` varchar(255) NOT NULL,
	`nome_social` varchar(255),
	`sexo` enum('Masculino','Feminino','Outro'),
	`data_nascimento` date,
	`nacionalidade` varchar(100) DEFAULT 'Brasileira',
	`uf_nascimento` varchar(2),
	`cidade_nascimento` varchar(100),
	`ddd_celular` varchar(3),
	`celular` varchar(15),
	`ddd_residencial` varchar(3),
	`telefone_residencial` varchar(15),
	`ddd_comercial` varchar(3),
	`telefone_comercial` varchar(15),
	`nome_mae` varchar(255),
	`nome_pai` varchar(255),
	`estado_civil` enum('Soltei'),
	`nome_conjuge` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_conflito_interesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`ano_referencia` int NOT NULL,
	`data_preenchimento` timestamp NOT NULL,
	`declaracao_url` varchar(500),
	`tem_conflito` tinyint DEFAULT 0,
	`descricao_conflito` text,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_conselho` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`conselho` varchar(20) DEFAULT 'CRM',
	`numero_registro` varchar(20),
	`uf` varchar(2),
	`carteira_conselho_url` varchar(500),
	`certidao_rqe_url` varchar(500),
	`codigo_validacao` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_credenciamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`local_credenciamento` varchar(255) NOT NULL,
	`selecionado` tinyint DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_documentacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`rg` varchar(20),
	`rg_uf` varchar(2),
	`rg_orgao_emissor` varchar(50),
	`rg_data_emissao` date,
	`rg_digitalizado_url` varchar(500),
	`numero_pis` varchar(20),
	`numero_cns` varchar(20),
	`cpf` varchar(14),
	`cpf_digitalizado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`tipo` enum('diploma_graduacao','carteira_conselho','certificado_especializacao','certificado_residencia','certificado_mestrado','certificado_doutorado','certificado_curso','outro') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`arquivo_url` varchar(500) NOT NULL,
	`arquivo_key` varchar(255) NOT NULL,
	`arquivo_nome` varchar(255) NOT NULL,
	`arquivo_tamanho` int,
	`formacao_id` int,
	`especializacao_id` int,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`tenant_id` int DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `medico_endereco` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`logradouro` enum('Rua','Avenida','Alameda','Travessa','Praça','Estrada','Rodovia','Outro'),
	`endereco_residencial` varchar(255),
	`numero` varchar(20),
	`complemento` varchar(100),
	`bairro` varchar(100),
	`cidade` varchar(100),
	`uf` varchar(2),
	`cep` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_especializacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`especializacao` varchar(255) NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`titulo_especialista` tinyint DEFAULT 0,
	`registro_conselho` tinyint DEFAULT 0,
	`rqe` varchar(20),
	`certificado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_formacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`curso` varchar(100) NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`ano_conclusao` int,
	`certificado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_historico_profissional` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`cargo` varchar(100),
	`departamento` varchar(100),
	`data_inicio` date,
	`data_fim` date,
	`descricao_atividades` text,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`curriculo_lattes` varchar(500),
	`linkedin` varchar(500),
	`orcid` varchar(100),
	`research_gate` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`instagram` varchar(200),
	`facebook` varchar(500),
	`twitter` varchar(200),
	`tiktok` varchar(200)
);
--> statement-breakpoint
CREATE TABLE `medico_pos_graduacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`tipo` enum('Mestrado','Doutorado','Pós-Doutorado') NOT NULL,
	`programa` varchar(255) NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`ano_conclusao` int,
	`titulo_tese` varchar(500),
	`orientador` varchar(255),
	`certificado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_recomendacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`titulo` varchar(255),
	`recomendador` varchar(255),
	`instituicao` varchar(255),
	`data_emissao` date,
	`carta_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_vacinas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`vacina` varchar(100) NOT NULL,
	`data_aplicacao` date,
	`dose` varchar(50),
	`lote` varchar(50),
	`fabricante` varchar(100),
	`comprovante_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `medico_vinculos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`tipo_vinculo` varchar(100) NOT NULL,
	`instituicao` varchar(255),
	`cargo` varchar(100),
	`data_inicio` date,
	`data_fim` date,
	`ativo` tinyint DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
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
	`ativo` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`duracao_slot_agenda` int DEFAULT 30
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
	`data_solicitacao` timestamp DEFAULT 'CURRENT_TIMESTAMP',
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
	`materiais_especiais` longtext,
	`opme` longtext,
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
	`observacoes_autorizacao` longtext,
	`data_confirmacao` timestamp,
	`confirmado_por` varchar(255),
	`status` enum('Pendente de Guias','Guias Geradas','Guias Enviadas','Em Análise','Autorizada','Negada','Confirmada','Realizada','Cancelada') DEFAULT 'Pendente de Guias',
	`indicacao_cirurgica` longtext,
	`observacoes` longtext,
	`agendamento_id` int,
	`cirurgia_id` int,
	`criado_por` varchar(255),
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `two_factor_auth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`is_enabled` tinyint NOT NULL DEFAULT 0,
	`backup_codes` text,
	`enabled_at` timestamp,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`password_changed_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`failed_login_attempts` int DEFAULT 0,
	`locked_until` timestamp,
	`must_change_password` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`salt` varchar(64) NOT NULL,
	`last_changed_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`must_change_on_login` tinyint DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_profile_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`foto_url` varchar(500) NOT NULL,
	`foto_key` varchar(255) NOT NULL,
	`foto_nome` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`tenant_id` int DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_token` varchar(255) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`expires_at` timestamp NOT NULL,
	`last_activity_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
ALTER TABLE `agendamentos` DROP INDEX `agendamentos_id_agendamento_unique`;--> statement-breakpoint
ALTER TABLE `backup_config` DROP INDEX `backup_config_tenant_id_unique`;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` DROP INDEX `bloqueios_horario_id_bloqueio_unique`;--> statement-breakpoint
ALTER TABLE `exames_padronizados` DROP INDEX `exames_padronizados_nome_unique`;--> statement-breakpoint
ALTER TABLE `resumo_clinico` DROP INDEX `resumo_clinico_paciente_id_unique`;--> statement-breakpoint
ALTER TABLE `tenants` DROP INDEX `tenants_slug_unique`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP INDEX `user_profiles_user_id_unique`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP INDEX `user_profiles_cpf_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP FOREIGN KEY `agendamentos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `agendamentos` DROP FOREIGN KEY `agendamentos_reagendado_de_agendamentos_id_fk`;
--> statement-breakpoint
ALTER TABLE `agendamentos` DROP FOREIGN KEY `agendamentos_transferido_para_id_agendamentos_id_fk`;
--> statement-breakpoint
ALTER TABLE `alergias` DROP FOREIGN KEY `alergias_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `atendimentos` DROP FOREIGN KEY `atendimentos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `atendimentos` DROP FOREIGN KEY `atendimentos_paciente_id_pacientes_id_fk`;
--> statement-breakpoint
ALTER TABLE `bloqueios_horario` DROP FOREIGN KEY `bloqueios_horario_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `cardiologia` DROP FOREIGN KEY `cardiologia_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `cirurgias` DROP FOREIGN KEY `cirurgias_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_evolucao_id_evolucoes_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_internacao_id_internacoes_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_cirurgia_id_cirurgias_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_exame_laboratorial_id_exames_laboratoriais_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_exame_imagem_id_exames_imagem_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_endoscopia_id_endoscopias_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP FOREIGN KEY `documentos_externos_cardiologia_id_cardiologia_id_fk`;
--> statement-breakpoint
ALTER TABLE `documentos_medicos` DROP FOREIGN KEY `documentos_medicos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `endoscopias` DROP FOREIGN KEY `endoscopias_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `evolucoes` DROP FOREIGN KEY `evolucoes_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `exames_favoritos` DROP FOREIGN KEY `exames_favoritos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `exames_imagem` DROP FOREIGN KEY `exames_imagem_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` DROP FOREIGN KEY `exames_laboratoriais_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `exames_padronizados` DROP FOREIGN KEY `exames_padronizados_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `historico_agendamentos` DROP FOREIGN KEY `historico_agendamentos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `historico_medidas` DROP FOREIGN KEY `historico_medidas_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `historico_vinculo` DROP FOREIGN KEY `historico_vinculo_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `internacoes` DROP FOREIGN KEY `internacoes_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `medicamentos_uso` DROP FOREIGN KEY `medicamentos_uso_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `obstetricia` DROP FOREIGN KEY `obstetricia_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP FOREIGN KEY `paciente_autorizacoes_tenant_origem_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP FOREIGN KEY `paciente_autorizacoes_tenant_destino_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `pacientes` DROP FOREIGN KEY `pacientes_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `patologias` DROP FOREIGN KEY `patologias_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `problemas_ativos` DROP FOREIGN KEY `problemas_ativos_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` DROP FOREIGN KEY `resultados_laboratoriais_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `resumo_clinico` DROP FOREIGN KEY `resumo_clinico_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `terapias` DROP FOREIGN KEY `terapias_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_profiles` DROP FOREIGN KEY `user_profiles_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_settings` DROP FOREIGN KEY `user_settings_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_tenant_id_tenants_id_fk`;
--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` DROP FOREIGN KEY `vinculo_secretaria_medico_tenant_id_tenants_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_delegados_agenda_tenant` ON `delegados_agenda`;--> statement-breakpoint
DROP INDEX `idx_delegados_agenda_medico` ON `delegados_agenda`;--> statement-breakpoint
DROP INDEX `idx_delegados_agenda_delegado` ON `delegados_agenda`;--> statement-breakpoint
DROP INDEX `idx_pacientes_tenant_cpf_hash` ON `pacientes`;--> statement-breakpoint
DROP INDEX `idx_pacientes_tenant_email_hash` ON `pacientes`;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `alergias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `atendimentos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `audit_log` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `backup_config` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `backup_history` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cardiologia` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cirurgias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dashboard_configs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `documentos_externos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `documentos_medicos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `endoscopias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `evolucoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `exames_favoritos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `exames_imagem` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `exames_padronizados` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `historico_medidas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `historico_vinculo` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `internacoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `obstetricia` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pacientes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `patologias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `problemas_ativos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `resumo_clinico` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tenants` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `terapias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user_settings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `confirmada` tinyint;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `confirmada` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `alergias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `pagamento_efetivado` tinyint;--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `pagamento_efetivado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `atendimentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `backup_enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_success` tinyint;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_success` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `notify_on_failure` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `offline_backup_enabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `backup_config` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `is_encrypted` tinyint;--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `is_encrypted` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `backup_history` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `recorrente` tinyint;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `recorrente` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `cancelado` tinyint;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `cancelado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `cardiologia` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `cardiologia` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `cirurgias` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `cirurgias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `dashboard_configs` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `dashboard_configs` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `permissao` varchar(50) DEFAULT 'visualizar';--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `data_inicio` timestamp;--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `ativo` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `delegados_agenda` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `upload_em` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `documentos_externos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `documentos_medicos` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `documentos_medicos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `biopsia` tinyint;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `biopsia` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `endoscopias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `assinado` tinyint;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `assinado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `evolucoes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `ativo` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exames_favoritos` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `exames_imagem` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exames_imagem` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `alterado` tinyint;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `alterado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `exames_padronizados` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exames_padronizados` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `data_medicao` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_medidas` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `historico_vinculo` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `historico_vinculo` MODIFY COLUMN `data_acao` datetime DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `internacoes` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `internacoes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `obstetricia` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `obstetricia` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `tenant_origem_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `tenant_destino_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `criado_por_user_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `data_inicio` datetime DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `data_fim` datetime;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `consentimento_lgpd` tinyint;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `consentimento_lgpd` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `created_at` datetime DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `invasao_linfovascular` tinyint;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `invasao_perineural` tinyint;--> statement-breakpoint
ALTER TABLE `patologias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `problemas_ativos` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `fora_referencia` tinyint;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `fora_referencia` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `extraido_por_ia` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `revisado_manualmente` tinyint;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `revisado_manualmente` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resumo_clinico` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `resumo_clinico` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `data_expiracao_plano` datetime;--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `created_at` datetime DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `terapias` MODIFY COLUMN `tenant_id` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `terapias` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_admin_master` tinyint;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_admin_master` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_medico` tinyint;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_medico` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_secretaria` tinyint;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_secretaria` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_auditor` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_auditor` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `is_paciente` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `user_settings` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `tenant_id` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `notificacao_enviada` tinyint;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `notificacao_enviada` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `created_at` datetime DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `profissional_id` int;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD `tamanhos_widgets` text;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD `periodos_individuais` text;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD `pode_visualizar` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD `pode_agendar` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD `pode_cancelar` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD `pode_editar` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `especialidade_principal` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `especialidade_secundaria` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `area_atuacao` varchar(100);--> statement-breakpoint
ALTER TABLE `auth_logs` ADD CONSTRAINT `auth_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `consultation_status_log` ADD CONSTRAINT `consultation_status_log_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_calendar_id_calendars_id_fk` FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_solicitacao_id_solicitacoes_cirurgicas_id_fk` FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes_cirurgicas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgiao_id_users_id_fk` FOREIGN KEY (`cirurgiao_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factor_auth` ADD CONSTRAINT `two_factor_auth_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `user_credentials` ADD CONSTRAINT `user_credentials_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `user_passwords` ADD CONSTRAINT `user_passwords_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profile_photos` ADD CONSTRAINT `user_profile_photos_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_auth_logs_user_id` ON `auth_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_logs_action` ON `auth_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_auth_logs_created_at` ON `auth_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `unique_calendar_user` ON `calendar_acl` (`calendar_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_calendar` ON `calendar_acl` (`calendar_id`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `calendar_acl` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant` ON `calendars` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_event` ON `consultation_status_log` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_changed_at` ON `consultation_status_log` (`changed_at`);--> statement-breakpoint
CREATE INDEX `idx_changed_by` ON `consultation_status_log` (`changed_by_user_id`);--> statement-breakpoint
CREATE INDEX `idx_patient` ON `consultations` (`patient_id`);--> statement-breakpoint
CREATE INDEX `idx_professional` ON `consultations` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `consultations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_payer` ON `consultations` (`payer_id`);--> statement-breakpoint
CREATE INDEX `idx_calendar_start` ON `events` (`calendar_id`,`start_at`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `events` (`category`);--> statement-breakpoint
CREATE INDEX `idx_visibility` ON `events` (`visibility`);--> statement-breakpoint
CREATE INDEX `idx_gcal_config_tenant_user` ON `google_calendar_config` (`tenant_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_tenant` ON `google_calendar_sync` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_agendamento` ON `google_calendar_sync` (`agendamento_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_google_event` ON `google_calendar_sync` (`google_event_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_status` ON `google_calendar_sync` (`sync_status`);--> statement-breakpoint
CREATE INDEX `user_profile_id` ON `medico_cadastro_pessoal` (`user_profile_id`);--> statement-breakpoint
CREATE INDEX `user_profile_id` ON `medico_conselho` (`user_profile_id`);--> statement-breakpoint
CREATE INDEX `user_profile_id` ON `medico_documentacao` (`user_profile_id`);--> statement-breakpoint
CREATE INDEX `user_profile_id` ON `medico_endereco` (`user_profile_id`);--> statement-breakpoint
CREATE INDEX `user_profile_id` ON `medico_links` (`user_profile_id`);--> statement-breakpoint
CREATE INDEX `token` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `id_solicitacao` ON `solicitacoes_cirurgicas` (`id_solicitacao`);--> statement-breakpoint
CREATE INDEX `idx_two_factor_auth_user_id` ON `two_factor_auth` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `two_factor_auth` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_credentials_user_id` ON `user_credentials` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_credentials_username` ON `user_credentials` (`username`);--> statement-breakpoint
CREATE INDEX `username` ON `user_credentials` (`username`);--> statement-breakpoint
CREATE INDEX `user_id` ON `user_passwords` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `user_profile_photos` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_user_id` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_token` ON `user_sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `session_token` ON `user_sessions` (`session_token`);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_profissional_id_profissionais_id_fk` FOREIGN KEY (`profissional_id`) REFERENCES `profissionais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `fk_2` FOREIGN KEY (`reagendado_de`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD CONSTRAINT `historico_medidas_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD CONSTRAINT `historico_vinculo_vinculo_id_vinculo_secretaria_medico_id_fk` FOREIGN KEY (`vinculo_id`) REFERENCES `vinculo_secretaria_medico`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `id_agendamento` ON `agendamentos` (`id_agendamento`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_tenant_data` ON `agendamentos` (`tenant_id`,`data_hora_inicio`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_status` ON `agendamentos` (`status`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_paciente` ON `agendamentos` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_agendamentos_profissional` ON `agendamentos` (`profissional_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `alergias` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `atendimento` ON `atendimentos` (`atendimento`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_metricas` ON `atendimentos` (`tenant_id`,`paciente_id`,`data_atendimento`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `tenant_id` ON `backup_config` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `id_bloqueio` ON `bloqueios_horario` (`id_bloqueio`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `cardiologia` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `cirurgias` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_cross_tenant_logs_autorizacao` ON `cross_tenant_access_logs` (`autorizacao_id`);--> statement-breakpoint
CREATE INDEX `idx_cross_tenant_logs_paciente` ON `cross_tenant_access_logs` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_cross_tenant_logs_user` ON `cross_tenant_access_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cross_tenant_logs_created` ON `cross_tenant_access_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_delegados_tenant_medico` ON `delegados_agenda` (`tenant_id`,`medico_user_id`);--> statement-breakpoint
CREATE INDEX `idx_delegados_tenant_delegado` ON `delegados_agenda` (`tenant_id`,`delegado_user_id`);--> statement-breakpoint
CREATE INDEX `idx_delegados_unique` ON `delegados_agenda` (`medico_user_id`,`delegado_email`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `documentos_externos` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `documentos_medicos` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `endoscopias` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `evolucoes` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `unique_user_exame` ON `exames_favoritos` (`user_id`,`nome_exame`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `exames_imagem` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `exames_laboratoriais` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `nome` ON `exames_padronizados` (`nome`);--> statement-breakpoint
CREATE INDEX `idx_paciente_data` ON `historico_medidas` (`paciente_id`,`data_medicao`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `internacoes` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `medicamentos_uso` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `obstetricia` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_paciente_autorizacoes_paciente` ON `paciente_autorizacoes` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `id_paciente` ON `pacientes` (`id_paciente`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_nome` ON `pacientes` (`tenant_id`,`nome`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_status` ON `pacientes` (`tenant_id`,`status_caso`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `patologias` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `problemas_ativos` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `resultados_laboratoriais` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `paciente_id` ON `resumo_clinico` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `resumo_clinico` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `slug` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tenant_paciente` ON `terapias` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `unique_cpf` ON `user_profiles` (`cpf`);--> statement-breakpoint
CREATE INDEX `unique_user_id` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_setting` ON `user_settings` (`user_profile_id`,`categoria`,`chave`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `unique_vinculo` ON `vinculo_secretaria_medico` (`secretaria_user_id`,`medico_user_id`);--> statement-breakpoint
ALTER TABLE `delegados_agenda` DROP COLUMN `delegado_nome`;--> statement-breakpoint
ALTER TABLE `delegados_agenda` DROP COLUMN `criado_por`;