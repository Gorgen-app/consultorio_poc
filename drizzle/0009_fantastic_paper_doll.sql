CREATE TABLE `paciente_autorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`autorizado_por_user_id` int NOT NULL,
	`autorizado_para_user_id` int NOT NULL,
	`tipo_acesso` enum('leitura','escrita','completo') DEFAULT 'leitura',
	`data_inicio` timestamp DEFAULT (now()),
	`data_fim` timestamp,
	`motivo` text,
	`status` enum('ativo','revogado','expirado') DEFAULT 'ativo',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paciente_autorizacoes_id` PRIMARY KEY(`id`)
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
ALTER TABLE `audit_log` MODIFY COLUMN `action` enum('CREATE','UPDATE','DELETE','RESTORE','VIEW','EXPORT','LOGIN','LOGOUT','AUTHORIZE','REVOKE') NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `entity_type` enum('paciente','atendimento','user','prontuario','documento','autorizacao','tenant','session') NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` ADD `tenant_id` int DEFAULT 1 NOT NULL;