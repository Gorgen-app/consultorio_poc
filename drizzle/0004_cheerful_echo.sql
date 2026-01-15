CREATE TABLE `historico_medidas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_medicao` timestamp NOT NULL,
	`peso` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`pressao_sistolica` int,
	`pressao_diastolica` int,
	`frequencia_cardiaca` int,
	`temperatura` decimal(3,1),
	`saturacao` int,
	`observacoes` text,
	`registrado_por` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `historico_medidas_id` PRIMARY KEY(`id`)
);
