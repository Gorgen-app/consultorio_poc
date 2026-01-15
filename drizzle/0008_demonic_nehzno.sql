CREATE TABLE `exames_favoritos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`nome_exame` varchar(255) NOT NULL,
	`categoria` varchar(100) DEFAULT 'Geral',
	`ordem` int DEFAULT 0,
	`ativo` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_favoritos_id` PRIMARY KEY(`id`)
);
