CREATE TABLE `agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_agendamento` varchar(20) NOT NULL,
	`tipo_compromisso` enum('Consulta','Cirurgia','Visita internado','Procedimento em consultório','Exame','Reunião','Bloqueio') NOT NULL,
	`paciente_id` int,
	`paciente_nome` varchar(255),
	`data_hora_inicio` timestamp NOT NULL,
	`data_hora_fim` timestamp NOT NULL,
	`local` varchar(100),
	`status_agendamento` enum('Agendado','Confirmado','Realizado','Cancelado','Reagendado','Faltou') NOT NULL DEFAULT 'Agendado',
	`titulo` varchar(255),
	`descricao` text,
	`reagendado_de` int,
	`cancelado_em` timestamp,
	`cancelado_por` varchar(255),
	`motivo_cancelamento` text,
	`confirmado_em` timestamp,
	`confirmado_por` varchar(255),
	`realizado_em` timestamp,
	`realizado_por` varchar(255),
	`marcado_falta_em` timestamp,
	`marcado_falta_por` varchar(255),
	`atendimento_id` int,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agendamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `agendamentos_id_agendamento_unique` UNIQUE(`id_agendamento`)
);
--> statement-breakpoint
CREATE TABLE `bloqueios_horario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_bloqueio` varchar(20) NOT NULL,
	`data_hora_inicio` timestamp NOT NULL,
	`data_hora_fim` timestamp NOT NULL,
	`tipo_bloqueio` enum('Férias','Feriado','Reunião fixa','Congresso','Particular','Outro') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`recorrente` boolean DEFAULT false,
	`padrao_recorrencia` varchar(100),
	`cancelado` boolean DEFAULT false,
	`cancelado_em` timestamp,
	`cancelado_por` varchar(255),
	`motivo_cancelamento` text,
	`criado_por` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bloqueios_horario_id` PRIMARY KEY(`id`),
	CONSTRAINT `bloqueios_horario_id_bloqueio_unique` UNIQUE(`id_bloqueio`)
);
--> statement-breakpoint
CREATE TABLE `historico_agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agendamento_id` int NOT NULL,
	`tipo_alteracao` enum('Criação','Confirmação','Cancelamento','Reagendamento','Realização','Falta','Edição') NOT NULL,
	`descricao_alteracao` text,
	`valores_anteriores` json,
	`valores_novos` json,
	`realizado_por` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_agendamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_reagendado_de_agendamentos_id_fk` FOREIGN KEY (`reagendado_de`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_atendimento_id_atendimentos_id_fk` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historico_agendamentos` ADD CONSTRAINT `historico_agendamentos_agendamento_id_agendamentos_id_fk` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos`(`id`) ON DELETE no action ON UPDATE no action;