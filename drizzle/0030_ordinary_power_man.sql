ALTER TABLE `pacientes` MODIFY COLUMN `cpf` text;--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `email` text;--> statement-breakpoint
ALTER TABLE `pacientes` MODIFY COLUMN `telefone` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `cpf_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `email_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `telefone_hash` varchar(64);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_cpf_hash` ON `pacientes` (`tenant_id`,`cpf_hash`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_email_hash` ON `pacientes` (`tenant_id`,`email_hash`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_telefone_hash` ON `pacientes` (`tenant_id`,`telefone_hash`);