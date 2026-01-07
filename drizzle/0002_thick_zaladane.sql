CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`user_name` varchar(255),
	`user_email` varchar(320),
	`action` enum('CREATE','UPDATE','DELETE','RESTORE') NOT NULL,
	`entity_type` enum('paciente','atendimento','user') NOT NULL,
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
ALTER TABLE `atendimentos` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `deleted_by` int;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `deleted_by` int;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;