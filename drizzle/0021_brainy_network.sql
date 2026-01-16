CREATE TABLE `google_calendar_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` int NOT NULL,
	`sync_enabled` boolean NOT NULL DEFAULT false,
	`sync_direction` enum('bidirectional','to_google_only','from_google_only') DEFAULT 'bidirectional',
	`google_calendar_id` varchar(255) DEFAULT 'primary',
	`sync_consultas` boolean DEFAULT true,
	`sync_cirurgias` boolean DEFAULT true,
	`sync_reunioes` boolean DEFAULT true,
	`sync_bloqueios` boolean DEFAULT false,
	`sync_outros` boolean DEFAULT true,
	`include_patient_name` boolean DEFAULT false,
	`include_patient_phone` boolean DEFAULT false,
	`event_visibility` enum('default','public','private') DEFAULT 'private',
	`last_full_sync_at` timestamp,
	`last_incremental_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_calendar_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`agendamento_id` int NOT NULL,
	`google_event_id` varchar(255) NOT NULL,
	`google_calendar_id` varchar(255) DEFAULT 'primary',
	`sync_status` enum('synced','pending_to_google','pending_from_google','conflict','error') NOT NULL DEFAULT 'synced',
	`last_sync_direction` enum('to_google','from_google'),
	`last_sync_at` timestamp,
	`google_updated_at` timestamp,
	`gorgen_updated_at` timestamp,
	`error_message` text,
	`error_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `google_calendar_config` ADD CONSTRAINT `google_calendar_config_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_calendar_config` ADD CONSTRAINT `google_calendar_config_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_calendar_sync` ADD CONSTRAINT `google_calendar_sync_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_calendar_sync` ADD CONSTRAINT `google_calendar_sync_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_gcal_config_tenant_user` ON `google_calendar_config` (`tenant_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_tenant` ON `google_calendar_sync` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_agendamento` ON `google_calendar_sync` (`agendamento_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_google_event` ON `google_calendar_sync` (`google_event_id`);--> statement-breakpoint
CREATE INDEX `idx_gcal_sync_status` ON `google_calendar_sync` (`sync_status`);