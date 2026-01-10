CREATE TABLE `medico_bancario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta_corrente` varchar(30),
	`tipo_conta` enum('Corrente','Poupança') DEFAULT 'Corrente',
	`ativo` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_bancario_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_cadastro_pessoal_id` PRIMARY KEY(`id`),
	CONSTRAINT `medico_cadastro_pessoal_user_profile_id_unique` UNIQUE(`user_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `medico_conflito_interesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`ano_referencia` int NOT NULL,
	`data_preenchimento` timestamp NOT NULL,
	`declaracao_url` varchar(500),
	`tem_conflito` boolean DEFAULT false,
	`descricao_conflito` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_conflito_interesses_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_conselho_id` PRIMARY KEY(`id`),
	CONSTRAINT `medico_conselho_user_profile_id_unique` UNIQUE(`user_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `medico_credenciamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`local_credenciamento` varchar(255) NOT NULL,
	`selecionado` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_credenciamento_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_documentacao_id` PRIMARY KEY(`id`),
	CONSTRAINT `medico_documentacao_user_profile_id_unique` UNIQUE(`user_profile_id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_endereco_id` PRIMARY KEY(`id`),
	CONSTRAINT `medico_endereco_user_profile_id_unique` UNIQUE(`user_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `medico_especializacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`especializacao` varchar(255) NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`titulo_especialista` boolean DEFAULT false,
	`registro_conselho` boolean DEFAULT false,
	`rqe` varchar(20),
	`certificado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_especializacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medico_formacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`curso` varchar(100) NOT NULL,
	`instituicao` varchar(255) NOT NULL,
	`ano_conclusao` int,
	`certificado_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_formacoes_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_historico_profissional_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medico_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`curriculo_lattes` varchar(500),
	`linkedin` varchar(500),
	`orcid` varchar(100),
	`research_gate` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `medico_links_user_profile_id_unique` UNIQUE(`user_profile_id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_pos_graduacao_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_recomendacoes_id` PRIMARY KEY(`id`)
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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_vacinas_id` PRIMARY KEY(`id`)
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
	`ativo` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_vinculos_id` PRIMARY KEY(`id`)
);
