CREATE TABLE `cep_coordenadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cep` varchar(10) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`endereco_formatado` varchar(500),
	`cidade` varchar(100),
	`uf` varchar(2),
	`status` enum('sucesso','nao_encontrado','erro','pendente') DEFAULT 'pendente',
	`fonte` varchar(50) DEFAULT 'google_maps',
	`tentativas` int DEFAULT 0,
	`ultimo_erro` text,
	`geocodificado_em` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cep_coordenadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `cep_coordenadas_cep_unique` UNIQUE(`cep`)
);
--> statement-breakpoint
CREATE INDEX `idx_cep_coord_status` ON `cep_coordenadas` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cep_coord_cidade` ON `cep_coordenadas` (`cidade`);--> statement-breakpoint
CREATE INDEX `idx_cep_coord_uf` ON `cep_coordenadas` (`uf`);