ALTER TABLE `documentos_medicos` ADD `status_assinatura` enum('pendente','assinado','cancelado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD `assinado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD `data_assinatura` timestamp;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD `assinado_por_id` int;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_assinado_por_id_users_id_fk` FOREIGN KEY (`assinado_por_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;