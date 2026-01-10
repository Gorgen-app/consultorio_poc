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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medico_documentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`salt` varchar(64) NOT NULL,
	`last_changed_at` timestamp NOT NULL DEFAULT (now()),
	`must_change_on_login` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_passwords_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_passwords_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_profile_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`foto_url` varchar(500) NOT NULL,
	`foto_key` varchar(255) NOT NULL,
	`foto_nome` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profile_photos_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profile_photos_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `medico_links` ADD `instagram` varchar(200);--> statement-breakpoint
ALTER TABLE `medico_links` ADD `facebook` varchar(500);--> statement-breakpoint
ALTER TABLE `medico_links` ADD `twitter` varchar(200);--> statement-breakpoint
ALTER TABLE `medico_links` ADD `tiktok` varchar(200);--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_passwords` ADD CONSTRAINT `user_passwords_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profile_photos` ADD CONSTRAINT `user_profile_photos_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `rg`;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `rg_uf`;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `rg_orgao_emissor`;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `rg_data_emissao`;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `rg_digitalizado_url`;--> statement-breakpoint
ALTER TABLE `medico_documentacao` DROP COLUMN `cpf_digitalizado_url`;