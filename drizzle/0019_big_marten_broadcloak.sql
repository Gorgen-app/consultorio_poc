ALTER TABLE `agendamentos` MODIFY COLUMN `status` enum('Agendado','Confirmado','Aguardando','Em atendimento','Encerrado','Cancelado','Falta','Transferido') NOT NULL DEFAULT 'Agendado';--> statement-breakpoint
ALTER TABLE `historico_agendamentos` MODIFY COLUMN `tipo_alteracao` enum('Criação','Confirmação','Cancelamento','Reagendamento','Realização','Falta','Edição','Transferência','Paciente Chegou','Atendimento Iniciado','Encerramento','Reativação') NOT NULL;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `transferido_para_id` int;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `transferido_em` timestamp;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `transferido_por` varchar(255);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `paciente_chegou_em` timestamp;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `paciente_chegou_registrado_por` varchar(255);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `atendimento_iniciado_em` timestamp;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `atendimento_iniciado_por` varchar(255);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `encerrado_em` timestamp;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD `encerrado_por` varchar(255);--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_transferido_para_id_agendamentos_id_fk` FOREIGN KEY (`transferido_para_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;