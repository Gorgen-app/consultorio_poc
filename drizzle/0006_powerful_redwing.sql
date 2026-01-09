CREATE TABLE `documentos_externos` (
	`id` int AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `historico_vinculo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vinculo_id` int NOT NULL,
	`acao` enum('criado','renovado','expirado','cancelado') NOT NULL,
	`data_acao` datetime DEFAULT CURRENT_TIMESTAMP,
	`observacao` text,
	CONSTRAINT `historico_vinculo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patologias` (
	`id` int AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
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
ALTER TABLE `agendamentos` ADD `status` enum('Agendado','Confirmado','Realizado','Cancelado','Reagendado','Faltou') DEFAULT 'Agendado' NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_evolucao_id_evolucoes_id_fk` FOREIGN KEY (`evolucao_id`) REFERENCES `evolucoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_internacao_id_internacoes_id_fk` FOREIGN KEY (`internacao_id`) REFERENCES `internacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cirurgia_id_cirurgias_id_fk` FOREIGN KEY (`cirurgia_id`) REFERENCES `cirurgias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_laboratorial_id_exames_laboratoriais_id_fk` FOREIGN KEY (`exame_laboratorial_id`) REFERENCES `exames_laboratoriais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_exame_imagem_id_exames_imagem_id_fk` FOREIGN KEY (`exame_imagem_id`) REFERENCES `exames_imagem`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_endoscopia_id_endoscopias_id_fk` FOREIGN KEY (`endoscopia_id`) REFERENCES `endoscopias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_cardiologia_id_cardiologia_id_fk` FOREIGN KEY (`cardiologia_id`) REFERENCES `cardiologia`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patologias` ADD CONSTRAINT `patologias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `status_agendamento`;