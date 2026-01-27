CREATE TABLE `prontuario_acessos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`user_name` varchar(255),
	`paciente_id` int NOT NULL,
	`acessado_em` timestamp NOT NULL DEFAULT (now()),
	`ip_origem` varchar(45),
	`user_agent` varchar(500),
	CONSTRAINT `prontuario_acessos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `prontuario_acessos` ADD CONSTRAINT `prontuario_acessos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prontuario_acessos` ADD CONSTRAINT `prontuario_acessos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_prontuario_acessos_user` ON `prontuario_acessos` (`user_id`,`acessado_em`);--> statement-breakpoint
CREATE INDEX `idx_prontuario_acessos_paciente` ON `prontuario_acessos` (`paciente_id`);