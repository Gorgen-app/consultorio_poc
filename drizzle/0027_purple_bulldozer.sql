CREATE TABLE `textos_padrao_evolucao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tenant_id` int NOT NULL,
	`subjetivo_padrao` text,
	`objetivo_padrao` text,
	`avaliacao_padrao` text,
	`plano_padrao` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `textos_padrao_evolucao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `textos_padrao_evolucao` ADD CONSTRAINT `textos_padrao_evolucao_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `textos_padrao_evolucao` ADD CONSTRAINT `textos_padrao_evolucao_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;