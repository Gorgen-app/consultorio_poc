ALTER TABLE `evolucoes` ADD `status_assinatura` enum('rascunho','pendente_assinatura','assinado') DEFAULT 'rascunho';--> statement-breakpoint
ALTER TABLE `evolucoes` ADD `assinado_por_id` int;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD `assinado_por_nome` varchar(255);--> statement-breakpoint
ALTER TABLE `evolucoes` ADD `atendimento_encerrado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD `data_encerramento_atendimento` timestamp;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_assinado_por_id_users_id_fk` FOREIGN KEY (`assinado_por_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;