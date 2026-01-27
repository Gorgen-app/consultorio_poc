CREATE TABLE `endereco_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`paciente_id` int NOT NULL,
	`endereco` varchar(500),
	`endereco_numero` varchar(20),
	`endereco_complemento` varchar(100),
	`bairro` varchar(100),
	`cep` varchar(10),
	`cidade` varchar(100),
	`uf` varchar(2),
	`pais` varchar(100),
	`tipo_alteracao` enum('criacao','atualizacao') NOT NULL DEFAULT 'atualizacao',
	`motivo_alteracao` text,
	`alterado_por_user_id` int,
	`alterado_por_nome` varchar(255),
	`ip_origem` varchar(45),
	`data_alteracao` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `endereco_historico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `endereco_historico` ADD CONSTRAINT `endereco_historico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endereco_historico` ADD CONSTRAINT `endereco_historico_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;