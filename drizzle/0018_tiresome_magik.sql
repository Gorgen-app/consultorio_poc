CREATE TABLE `delegados_agenda` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`medico_user_id` int NOT NULL,
	`delegado_user_id` int,
	`delegado_email` varchar(320) NOT NULL,
	`delegado_nome` varchar(255),
	`permissao` enum('visualizar','editar') NOT NULL DEFAULT 'visualizar',
	`data_inicio` timestamp NOT NULL DEFAULT (now()),
	`data_fim` timestamp,
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delegados_agenda_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD CONSTRAINT `delegados_agenda_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD CONSTRAINT `delegados_agenda_medico_user_id_users_id_fk` FOREIGN KEY (`medico_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `delegados_agenda` ADD CONSTRAINT `delegados_agenda_delegado_user_id_users_id_fk` FOREIGN KEY (`delegado_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_delegados_agenda_tenant` ON `delegados_agenda` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_delegados_agenda_medico` ON `delegados_agenda` (`medico_user_id`);--> statement-breakpoint
CREATE INDEX `idx_delegados_agenda_delegado` ON `delegados_agenda` (`delegado_user_id`);