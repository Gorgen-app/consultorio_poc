CREATE TABLE `agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`id_agendamento` varchar(20) NOT NULL,
	`tipo_compromisso` enum('Consulta','Cirurgia','Visita internado','Procedimento em consultório','Exame','Reunião','Bloqueio') NOT NULL,
	`paciente_id` int,
	`paciente_nome` varchar(255),
	`data_hora_inicio` timestamp NOT NULL,
	`data_hora_fim` timestamp NOT NULL,
	`local` varchar(100),
	`status` enum('Agendado','Confirmado','Realizado','Cancelado','Reagendado','Faltou') NOT NULL DEFAULT 'Agendado',
	`titulo` varchar(255),
	`descricao` text,
	`reagendado_de` int,
	`cancelado_em` timestamp,
	`cancelado_por` varchar(255),
	`motivo_cancelamento` text,
	`confirmado_em` timestamp,
	`confirmado_por` varchar(255),
	`realizado_em` timestamp,
	`realizado_por` varchar(255),
	`marcado_falta_em` timestamp,
	`marcado_falta_por` varchar(255),
	`atendimento_id` int,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`google_uid` varchar(255),
	`importado_de` varchar(50),
	`convenio` varchar(100),
	`cpf_paciente` varchar(14),
	`telefone_paciente` varchar(20),
	`email_paciente` varchar(255),
	CONSTRAINT `agendamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `agendamentos_id_agendamento_unique` UNIQUE(`id_agendamento`)
);
--> statement-breakpoint
CREATE TABLE `alergias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`tipo` enum('Medicamento','Alimento','Ambiental','Outro') NOT NULL,
	`substancia` varchar(255) NOT NULL,
	`reacao` varchar(500),
	`gravidade` enum('Leve','Moderada','Grave'),
	`confirmada` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alergias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atendimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`atendimento` varchar(64) NOT NULL,
	`paciente_id` int NOT NULL,
	`data_atendimento` timestamp NOT NULL,
	`semana` int,
	`tipo_atendimento` varchar(100),
	`procedimento` varchar(255),
	`codigos_cbhpm` text,
	`nome_paciente` varchar(255),
	`local` varchar(100),
	`convenio` varchar(100),
	`plano_convenio` varchar(100),
	`pagamento_efetivado` boolean DEFAULT false,
	`pagamento_postergado` varchar(50),
	`data_envio_faturamento` date,
	`data_esperada_pagamento` date,
	`faturamento_previsto` decimal(10,2),
	`registro_manual_valor_hm` decimal(10,2),
	`faturamento_previsto_final` decimal(10,2),
	`data_pagamento` date,
	`nota_fiscal_correspondente` varchar(100),
	`observacoes` text,
	`faturamento_leticia` decimal(10,2),
	`faturamento_ag_lu` decimal(10,2),
	`mes` int,
	`ano` int,
	`trimestre` varchar(10),
	`trimestre_ano` varchar(20),
	`deleted_at` timestamp,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atendimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`user_id` int,
	`user_name` varchar(255),
	`user_email` varchar(320),
	`action` enum('CREATE','UPDATE','DELETE','RESTORE','VIEW','EXPORT','LOGIN','LOGOUT','AUTHORIZE','REVOKE') NOT NULL,
	`entity_type` enum('paciente','atendimento','user','prontuario','documento','autorizacao','tenant','session') NOT NULL,
	`entity_id` int NOT NULL,
	`entity_identifier` varchar(100),
	`old_values` json,
	`new_values` json,
	`changed_fields` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `bloqueios_horario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`id_bloqueio` varchar(20) NOT NULL,
	`data_hora_inicio` timestamp NOT NULL,
	`data_hora_fim` timestamp NOT NULL,
	`tipo_bloqueio` enum('Férias','Feriado','Reunião fixa','Congresso','Particular','Outro') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`recorrente` boolean DEFAULT false,
	`padrao_recorrencia` varchar(100),
	`cancelado` boolean DEFAULT false,
	`cancelado_em` timestamp,
	`cancelado_por` varchar(255),
	`motivo_cancelamento` text,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bloqueios_horario_id` PRIMARY KEY(`id`),
	CONSTRAINT `bloqueios_horario_id_bloqueio_unique` UNIQUE(`id_bloqueio`)
);
--> statement-breakpoint
CREATE TABLE `cardiologia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('ECG','Ecocardiograma','Teste Ergométrico','Holter 24h','MAPA','Cintilografia Miocárdica','Cateterismo','Angiotomografia','Outro') NOT NULL,
	`clinica_servico` varchar(255),
	`medico_executor` varchar(255),
	`indicacao` text,
	`descricao` text,
	`conclusao` text,
	`feve` decimal(4,1),
	`ddve` decimal(4,1),
	`dsve` decimal(4,1),
	`ae` decimal(4,1),
	`arquivo_laudo_url` varchar(500),
	`arquivo_exame_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cardiologia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cirurgias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`internacao_id` int,
	`data_cirurgia` timestamp NOT NULL,
	`procedimento` varchar(500) NOT NULL,
	`codigos_cbhpm` text,
	`hospital` varchar(255),
	`sala_operatoria` varchar(50),
	`cirurgiao_responsavel` varchar(255),
	`equipe` text,
	`anestesista` varchar(255),
	`tipo_anestesia` varchar(100),
	`indicacao` text,
	`descricao_cirurgica` text,
	`achados` text,
	`complicacoes` text,
	`duracao_minutos` int,
	`sangramento` varchar(100),
	`status` enum('Agendada','Realizada','Cancelada','Adiada') DEFAULT 'Agendada',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cirurgias_id` PRIMARY KEY(`id`)
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
CREATE TABLE `documentos_externos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`categoria_documento` enum('Evolução','Internação','Cirurgia','Exame Laboratorial','Exame de Imagem','Endoscopia','Cardiologia','Patologia') NOT NULL,
	`evolucao_id` int,
	`internacao_id` int,
	`cirurgia_id` int,
	`exame_laboratorial_id` int,
	`exame_imagem_id` int,
	`endoscopia_id` int,
	`cardiologia_id` int,
	`patologia_id` int,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`data_documento` date,
	`arquivo_original_url` varchar(500) NOT NULL,
	`arquivo_original_nome` varchar(255) NOT NULL,
	`arquivo_original_tipo` varchar(50),
	`arquivo_original_tamanho` int,
	`arquivo_pdf_url` varchar(500),
	`arquivo_pdf_nome` varchar(255),
	`texto_ocr` text,
	`interpretacao_ia` text,
	`data_interpretacao` timestamp,
	`upload_por` varchar(255) NOT NULL,
	`upload_em` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentos_externos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentos_medicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`evolucao_id` int,
	`tipo` enum('Receita','Receita Especial','Solicitação de Exames','Atestado Comparecimento','Atestado Afastamento','Laudo Médico','Relatório Médico','Protocolo Cirurgia','Guia SADT','Guia Internação','Outro') NOT NULL,
	`data_emissao` timestamp NOT NULL,
	`conteudo` text,
	`medicamentos` text,
	`cid10` varchar(20),
	`dias_afastamento` int,
	`data_inicio` date,
	`data_fim` date,
	`exames_solicitados` text,
	`justificativa` text,
	`procedimento_proposto` varchar(500),
	`data_prevista` date,
	`hospital_previsto` varchar(255),
	`profissional_id` int,
	`profissional_nome` varchar(255),
	`crm` varchar(20),
	`arquivo_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentos_medicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endoscopias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('EDA','Colonoscopia','Retossigmoidoscopia','CPRE','Ecoendoscopia','Enteroscopia','Outro') NOT NULL,
	`clinica_servico` varchar(255),
	`medico_executor` varchar(255),
	`indicacao` text,
	`preparo` varchar(255),
	`sedacao` varchar(255),
	`descricao` text,
	`conclusao` text,
	`biopsia` boolean DEFAULT false,
	`local_biopsia` varchar(255),
	`resultado_biopsia` text,
	`arquivo_laudo_url` varchar(500),
	`arquivo_imagens_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endoscopias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evolucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`atendimento_id` int,
	`data_evolucao` timestamp NOT NULL,
	`tipo` enum('Consulta','Retorno','Urgência','Teleconsulta','Parecer') DEFAULT 'Consulta',
	`subjetivo` text,
	`objetivo` text,
	`avaliacao` text,
	`plano` text,
	`pressao_arterial` varchar(20),
	`frequencia_cardiaca` int,
	`temperatura` decimal(4,1),
	`peso` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`profissional_id` int,
	`profissional_nome` varchar(255),
	`assinado` boolean DEFAULT false,
	`data_assinatura` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evolucoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_favoritos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`nome_exame` varchar(255) NOT NULL,
	`categoria` varchar(100) DEFAULT 'Geral',
	`ordem` int DEFAULT 0,
	`ativo` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_favoritos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_imagem` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('Raio-X','Tomografia','Ressonância','Ultrassonografia','Mamografia','Densitometria','PET-CT','Cintilografia','Outro') NOT NULL,
	`regiao` varchar(255) NOT NULL,
	`clinica_servico` varchar(255),
	`medico_solicitante` varchar(255),
	`medico_laudador` varchar(255),
	`indicacao` text,
	`laudo` text,
	`conclusao` text,
	`arquivo_laudo_url` varchar(500),
	`arquivo_imagem_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_imagem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_laboratoriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_coleta` date NOT NULL,
	`data_resultado` date,
	`laboratorio` varchar(255),
	`tipo_exame` varchar(255) NOT NULL,
	`exame` varchar(255) NOT NULL,
	`resultado` text,
	`valor_referencia` varchar(255),
	`unidade` varchar(50),
	`alterado` boolean DEFAULT false,
	`observacoes` text,
	`arquivo_url` varchar(500),
	`arquivo_nome` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_laboratoriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_padronizados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('Hemograma','Bioquímica','Função Renal','Função Hepática','Perfil Lipídico','Coagulação','Hormônios','Marcadores Tumorais','Eletrólitos','Urinálise','Sorologias','Metabolismo do Ferro','Vitaminas','Outros') NOT NULL,
	`unidade_padrao` varchar(50),
	`valor_ref_min_masculino` decimal(10,4),
	`valor_ref_max_masculino` decimal(10,4),
	`valor_ref_min_feminino` decimal(10,4),
	`valor_ref_max_feminino` decimal(10,4),
	`sinonimos` text,
	`descricao` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_padronizados_id` PRIMARY KEY(`id`),
	CONSTRAINT `exames_padronizados_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `historico_agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`agendamento_id` int NOT NULL,
	`tipo_alteracao` enum('Criação','Confirmação','Cancelamento','Reagendamento','Realização','Falta','Edição') NOT NULL,
	`descricao_alteracao` text,
	`valores_anteriores` json,
	`valores_novos` json,
	`realizado_por` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_agendamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_medidas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_medicao` timestamp NOT NULL,
	`peso` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`pressao_sistolica` int,
	`pressao_diastolica` int,
	`frequencia_cardiaca` int,
	`temperatura` decimal(3,1),
	`saturacao` int,
	`observacoes` text,
	`registrado_por` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `historico_medidas_id` PRIMARY KEY(`id`)
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
CREATE TABLE `historico_vinculo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`vinculo_id` int NOT NULL,
	`acao` enum('criado','renovado','expirado','cancelado') NOT NULL,
	`data_acao` datetime DEFAULT CURRENT_TIMESTAMP,
	`observacao` text,
	CONSTRAINT `historico_vinculo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`hospital` varchar(255) NOT NULL,
	`setor` varchar(100),
	`leito` varchar(50),
	`data_admissao` timestamp NOT NULL,
	`data_alta` timestamp,
	`motivo_internacao` text,
	`diagnostico_admissao` varchar(500),
	`cid10_admissao` varchar(20),
	`diagnostico_alta` varchar(500),
	`cid10_alta` varchar(20),
	`tipo_alta` enum('Melhorado','Curado','Transferido','Óbito','Evasão','A pedido'),
	`resumo_internacao` text,
	`complicacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicamentos_uso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`medicamento` varchar(255) NOT NULL,
	`principio_ativo` varchar(255),
	`dosagem` varchar(100),
	`posologia` varchar(255),
	`via_administracao` varchar(50),
	`data_inicio` date,
	`data_fim` date,
	`motivo_uso` varchar(255),
	`prescrito_por` varchar(255),
	`ativo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicamentos_uso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obstetricia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`tipo_registro` enum('Pré-natal','Parto','Puerpério','Aborto') NOT NULL,
	`data_registro` date NOT NULL,
	`dum` date,
	`dpp` date,
	`idade_gestacional` varchar(20),
	`tipo_parto` enum('Normal','Cesárea','Fórceps','Vácuo'),
	`data_parto` timestamp,
	`hospital` varchar(255),
	`peso_rn` decimal(5,0),
	`apgar_1` int,
	`apgar_5` int,
	`sexo_rn` enum('M','F'),
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obstetricia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paciente_autorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_origem_id` int NOT NULL,
	`tenant_destino_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`criado_por_user_id` int NOT NULL,
	`tipo_autorizacao` enum('leitura','escrita','completo') DEFAULT 'leitura',
	`escopo_autorizacao` enum('prontuario','atendimentos','exames','documentos','completo') DEFAULT 'completo',
	`data_inicio` timestamp DEFAULT (now()),
	`data_fim` timestamp,
	`motivo` text,
	`status` enum('pendente','ativa','revogada','expirada','rejeitada') DEFAULT 'pendente',
	`consentimento_lgpd` boolean DEFAULT false,
	`data_consentimento` timestamp,
	`ip_consentimento` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paciente_autorizacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pacientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`id_paciente` varchar(64) NOT NULL,
	`codigo_legado` varchar(64),
	`data_inclusao` date,
	`pasta_paciente` varchar(255),
	`nome` varchar(255) NOT NULL,
	`data_nascimento` date,
	`sexo` enum('M','F','Outro'),
	`cpf` varchar(14),
	`nome_mae` varchar(255),
	`responsavel_nome` varchar(255),
	`responsavel_parentesco` varchar(100),
	`responsavel_telefone` varchar(20),
	`responsavel_email` varchar(320),
	`email` varchar(320),
	`telefone` varchar(20),
	`endereco` varchar(500),
	`bairro` varchar(100),
	`cep` varchar(10),
	`cidade` varchar(100),
	`uf` varchar(2),
	`pais` varchar(100) DEFAULT 'Brasil',
	`operadora_1` varchar(100),
	`plano_modalidade_1` varchar(100),
	`matricula_convenio_1` varchar(100),
	`vigente_1` varchar(50),
	`privativo_1` varchar(50),
	`operadora_2` varchar(100),
	`plano_modalidade_2` varchar(100),
	`matricula_convenio_2` varchar(100),
	`vigente_2` varchar(50),
	`privativo_2` varchar(50),
	`obito_perda` varchar(100),
	`data_obito_last_fu` date,
	`status_caso` varchar(50) DEFAULT 'Ativo',
	`grupo_diagnostico` varchar(100),
	`diagnostico_especifico` text,
	`tempo_seguimento_anos` decimal(10,2),
	`deleted_at` timestamp,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pacientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patologias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_coleta` date NOT NULL,
	`data_resultado` date,
	`tipo_exame` enum('Anatomopatológico','Citopatológico','Imunohistoquímica','Hibridização in situ','Biópsia Líquida','Outro') NOT NULL,
	`origem_material` varchar(255),
	`tipo_procedimento` varchar(255),
	`laboratorio` varchar(255),
	`patologista_responsavel` varchar(255),
	`descricao_macroscopica` text,
	`descricao_microscopica` text,
	`diagnostico` text,
	`conclusao` text,
	`estadiamento_tnm` varchar(50),
	`grau_histologico` varchar(50),
	`margem_cirurgica` varchar(100),
	`invasao_linfovascular` boolean,
	`invasao_perineural` boolean,
	`ki67` varchar(20),
	`receptor_estrogeno` varchar(50),
	`receptor_progesterona` varchar(50),
	`her2` varchar(50),
	`pdl1` varchar(50),
	`outros_marcadores` text,
	`arquivo_laudo_url` varchar(500),
	`arquivo_laminas_url` varchar(500),
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patologias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `problemas_ativos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`cid10` varchar(20),
	`data_inicio` date,
	`data_resolucao` date,
	`ativo` boolean NOT NULL DEFAULT true,
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problemas_ativos_id` PRIMARY KEY(`id`)
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
	`duracao_slot_agenda` int DEFAULT 30,
	`ativo` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profissionais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resultados_laboratoriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`documento_externo_id` int,
	`exame_padronizado_id` int,
	`nome_exame_original` varchar(255) NOT NULL,
	`data_coleta` date NOT NULL,
	`resultado` varchar(100) NOT NULL,
	`resultado_numerico` decimal(15,6),
	`unidade` varchar(50),
	`valor_referencia_texto` varchar(255),
	`valor_referencia_min` decimal(15,6),
	`valor_referencia_max` decimal(15,6),
	`fora_referencia` boolean DEFAULT false,
	`tipo_alteracao` enum('Normal','Aumentado','Diminuído') DEFAULT 'Normal',
	`laboratorio` varchar(255),
	`extraido_por_ia` boolean DEFAULT true,
	`confianca_extracao` decimal(3,2),
	`revisado_manualmente` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resultados_laboratoriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_clinico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`historia_clinica` text,
	`antecedentes_pessoais` text,
	`antecedentes_familiares` text,
	`habitos` text,
	`gestacoes` int,
	`partos` int,
	`abortos` int,
	`dum` date,
	`peso_atual` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumo_clinico_id` PRIMARY KEY(`id`),
	CONSTRAINT `resumo_clinico_paciente_id_unique` UNIQUE(`paciente_id`)
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
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`cnpj` varchar(20),
	`email` varchar(255),
	`telefone` varchar(20),
	`endereco` text,
	`logo_url` varchar(500),
	`plano` enum('free','basic','professional','enterprise') DEFAULT 'free',
	`status` enum('ativo','inativo','suspenso') DEFAULT 'ativo',
	`data_expiracao_plano` timestamp,
	`max_usuarios` int DEFAULT 5,
	`max_pacientes` int DEFAULT 100,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `terapias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`data_terapia` timestamp NOT NULL,
	`tipo_terapia` enum('Quimioterapia','Imunoterapia','Terapia Alvo','Imunobiológico','Infusão','Transfusão','Outro') NOT NULL,
	`protocolo` varchar(255),
	`ciclo` int,
	`dia` int,
	`medicamentos` text,
	`local` varchar(255),
	`pre_quimio` text,
	`intercorrencias` text,
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `terapias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`user_id` int NOT NULL,
	`cpf` varchar(14),
	`nome_completo` varchar(255),
	`email` varchar(320),
	`perfil_ativo` enum('admin_master','medico','secretaria','auditor','paciente') NOT NULL DEFAULT 'paciente',
	`is_admin_master` boolean NOT NULL DEFAULT false,
	`is_medico` boolean NOT NULL DEFAULT false,
	`is_secretaria` boolean NOT NULL DEFAULT false,
	`is_auditor` boolean NOT NULL DEFAULT false,
	`is_paciente` boolean NOT NULL DEFAULT true,
	`crm` varchar(20),
	`especialidade` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `user_profiles_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_profile_id` int NOT NULL,
	`categoria` varchar(50) NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vinculo_secretaria_medico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`secretaria_user_id` varchar(255) NOT NULL,
	`medico_user_id` varchar(255) NOT NULL,
	`data_inicio` datetime NOT NULL,
	`data_validade` datetime NOT NULL,
	`status` enum('ativo','pendente_renovacao','expirado','cancelado') DEFAULT 'ativo',
	`notificacao_enviada` boolean DEFAULT false,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vinculo_secretaria_medico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_reagendado_de_agendamentos_id_fk` FOREIGN KEY (`reagendado_de`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_atendimento_id_atendimentos_id_fk` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_config` ADD CONSTRAINT `backup_config_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_history` ADD CONSTRAINT `backup_history_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backup_history` ADD CONSTRAINT `backup_history_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD CONSTRAINT `bloqueios_horario_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD CONSTRAINT `cardiologia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD CONSTRAINT `cardiologia_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_internacao_id_internacoes_id_fk` FOREIGN KEY (`internacao_id`) REFERENCES `internacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_autorizacao_id_paciente_autorizacoes_id_fk` FOREIGN KEY (`autorizacao_id`) REFERENCES `paciente_autorizacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_tenant_origem_id_tenants_id_fk` FOREIGN KEY (`tenant_origem_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cross_tenant_access_logs` ADD CONSTRAINT `cross_tenant_access_logs_tenant_destino_id_tenants_id_fk` FOREIGN KEY (`tenant_destino_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD CONSTRAINT `dashboard_configs_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_configs` ADD CONSTRAINT `dashboard_configs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_evolucao_id_evolucoes_id_fk` FOREIGN KEY (`evolucao_id`) REFERENCES `evolucoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_internacao_id_internacoes_id_fk` FOREIGN KEY (`internacao_id`) REFERENCES `internacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_laboratorial_id_exames_laboratoriais_id_fk` FOREIGN KEY (`exame_laboratorial_id`) REFERENCES `exames_laboratoriais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_imagem_id_exames_imagem_id_fk` FOREIGN KEY (`exame_imagem_id`) REFERENCES `exames_imagem`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_endoscopia_id_endoscopias_id_fk` FOREIGN KEY (`endoscopia_id`) REFERENCES `endoscopias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cardiologia_id_cardiologia_id_fk` FOREIGN KEY (`cardiologia_id`) REFERENCES `cardiologia`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_evolucao_id_evolucoes_id_fk` FOREIGN KEY (`evolucao_id`) REFERENCES `evolucoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_profissional_id_users_id_fk` FOREIGN KEY (`profissional_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD CONSTRAINT `endoscopias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD CONSTRAINT `endoscopias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_atendimento_id_atendimentos_id_fk` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_profissional_id_users_id_fk` FOREIGN KEY (`profissional_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_favoritos` ADD CONSTRAINT `exames_favoritos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD CONSTRAINT `exames_imagem_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD CONSTRAINT `exames_imagem_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD CONSTRAINT `exames_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD CONSTRAINT `exames_laboratoriais_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD CONSTRAINT `exames_padronizados_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD CONSTRAINT `historico_agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD CONSTRAINT `historico_agendamentos_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD CONSTRAINT `historico_medidas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_solicitacao_cirurgica` ADD CONSTRAINT `historico_solicitacao_cirurgica_solicitacao_id_solicitacoes_cirurgicas_id_fk` FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes_cirurgicas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD CONSTRAINT `historico_vinculo_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internacoes` ADD CONSTRAINT `internacoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internacoes` ADD CONSTRAINT `internacoes_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD CONSTRAINT `medicamentos_uso_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD CONSTRAINT `medicamentos_uso_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD CONSTRAINT `obstetricia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD CONSTRAINT `obstetricia_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_origem_id_tenants_id_fk` FOREIGN KEY (`tenant_origem_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paciente_autorizacoes` ADD CONSTRAINT `paciente_autorizacoes_tenant_destino_id_tenants_id_fk` FOREIGN KEY (`tenant_destino_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patologias` ADD CONSTRAINT `patologias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patologias` ADD CONSTRAINT `patologias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD CONSTRAINT `problemas_ativos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD CONSTRAINT `problemas_ativos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_documento_externo_id_documentos_externos_id_fk` FOREIGN KEY (`documento_externo_id`) REFERENCES `documentos_externos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_exame_padronizado_id_exames_padronizados_id_fk` FOREIGN KEY (`exame_padronizado_id`) REFERENCES `exames_padronizados`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgiao_id_users_id_fk` FOREIGN KEY (`cirurgiao_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solicitacoes_cirurgicas` ADD CONSTRAINT `solicitacoes_cirurgicas_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terapias` ADD CONSTRAINT `terapias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terapias` ADD CONSTRAINT `terapias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` ADD CONSTRAINT `vinculo_secretaria_medico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant` ON `atendimentos` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_atendimento` ON `atendimentos` (`tenant_id`,`atendimento`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_paciente` ON `atendimentos` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_data` ON `atendimentos` (`tenant_id`,`data_atendimento`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant` ON `pacientes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_id_paciente` ON `pacientes` (`tenant_id`,`id_paciente`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_nome` ON `pacientes` (`tenant_id`,`nome`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_cpf` ON `pacientes` (`tenant_id`,`cpf`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;