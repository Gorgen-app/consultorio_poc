ALTER TABLE `agendamentos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `alergias` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_favoritos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `internacoes` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `patologias` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `terapias` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bloqueios_horario` ADD CONSTRAINT `bloqueios_horario_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD CONSTRAINT `cardiologia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_externos` ADD CONSTRAINT `documentos_externos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD CONSTRAINT `endoscopias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_favoritos` ADD CONSTRAINT `exames_favoritos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD CONSTRAINT `exames_imagem_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD CONSTRAINT `exames_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_padronizados` ADD CONSTRAINT `exames_padronizados_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD CONSTRAINT `historico_agendamentos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_medidas` ADD CONSTRAINT `historico_medidas_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_vinculo` ADD CONSTRAINT `historico_vinculo_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internacoes` ADD CONSTRAINT `internacoes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD CONSTRAINT `medicamentos_uso_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD CONSTRAINT `obstetricia_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patologias` ADD CONSTRAINT `patologias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD CONSTRAINT `problemas_ativos_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terapias` ADD CONSTRAINT `terapias_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinculo_secretaria_medico` ADD CONSTRAINT `vinculo_secretaria_medico_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;