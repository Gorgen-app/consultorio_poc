ALTER TABLE `atendimentos` DROP INDEX `atendimentos_atendimento_unique`;--> statement-breakpoint
ALTER TABLE `pacientes` DROP INDEX `pacientes_id_paciente_unique`;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `tenant_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `tenant_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant` ON `atendimentos` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_atendimento` ON `atendimentos` (`tenant_id`,`atendimento`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_paciente` ON `atendimentos` (`tenant_id`,`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_atendimentos_tenant_data` ON `atendimentos` (`tenant_id`,`data_atendimento`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant` ON `pacientes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_id_paciente` ON `pacientes` (`tenant_id`,`id_paciente`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_nome` ON `pacientes` (`tenant_id`,`nome`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_cpf` ON `pacientes` (`tenant_id`,`cpf`);