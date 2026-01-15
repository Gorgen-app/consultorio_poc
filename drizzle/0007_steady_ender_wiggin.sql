CREATE TABLE `exames_padronizados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('Hemograma','Bioquímica','Função Renal','Função Hepática','Perfil Lipídico','Coagulação','Hormônios','Marcadores Tumorais','Eletrólitos','Urinálise','Sorologias','Metabolismo do Ferro','Vitaminas','Outros') NOT NULL,
	`unidade_padrao` varchar(50),
	`valor_ref_min_masculino` decimal(10,4),
	`valor_ref_max_masculino` decimal(10,4),
	`valor_ref_min_feminino` decimal(10,4),
	`valor_ref_max_feminino` decimal(10,4),
	`sinonimos` text,
	`descricao` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_padronizados_id` PRIMARY KEY(`id`),
	CONSTRAINT `exames_padronizados_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `resultados_laboratoriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`documento_externo_id` int,
	`exame_padronizado_id` int,
	`nome_exame_original` varchar(255) NOT NULL,
	`data_coleta` date NOT NULL,
	`resultado` varchar(100) NOT NULL,
	`resultado_numerico` decimal(15,6),
	`unidade` varchar(50),
	`valor_referencia_texto` varchar(255),
	`valor_referencia_min` decimal(15,6),
	`valor_referencia_max` decimal(15,6),
	`fora_referencia` boolean DEFAULT false,
	`tipo_alteracao` enum('Normal','Aumentado','Diminuído') DEFAULT 'Normal',
	`laboratorio` varchar(255),
	`extraido_por_ia` boolean DEFAULT true,
	`confianca_extracao` decimal(3,2),
	`revisado_manualmente` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resultados_laboratoriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_documento_externo_id_documentos_externos_id_fk` FOREIGN KEY (`documento_externo_id`) REFERENCES `documentos_externos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultados_laboratoriais` ADD CONSTRAINT `resultados_laboratoriais_exame_padronizado_id_exames_padronizados_id_fk` FOREIGN KEY (`exame_padronizado_id`) REFERENCES `exames_padronizados`(`id`) ON DELETE no action ON UPDATE no action;