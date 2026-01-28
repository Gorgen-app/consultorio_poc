CREATE TABLE `configuracoes_duracao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`tipo_compromisso` varchar(100) NOT NULL,
	`duracao_minutos` int NOT NULL DEFAULT 30,
	`local_padrao` varchar(100),
	`cor` varchar(20),
	`ativo` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoes_duracao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `configuracoes_duracao` ADD CONSTRAINT `configuracoes_duracao_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_config_duracao_tenant_tipo` ON `configuracoes_duracao` (`tenant_id`,`tipo_compromisso`);