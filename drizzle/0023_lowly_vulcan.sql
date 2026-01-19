ALTER TABLE `pacientes` ADD `cpf_encrypted` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `cpf_hash` varchar(100);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_telefone_encrypted` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_email_encrypted` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `email_encrypted` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `email_hash` varchar(100);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `telefone_encrypted` text;--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_cpf_hash` ON `pacientes` (`tenant_id`,`cpf_hash`);--> statement-breakpoint
CREATE INDEX `idx_pacientes_tenant_email_hash` ON `pacientes` (`tenant_id`,`email_hash`);