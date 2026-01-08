CREATE TABLE `alergias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`tipo` enum('Medicamento','Alimento','Ambiental','Outro') NOT NULL,
	`substancia` varchar(255) NOT NULL,
	`reacao` varchar(500),
	`gravidade` enum('Leve','Moderada','Grave'),
	`confirmada` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alergias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cardiologia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('ECG','Ecocardiograma','Teste Ergométrico','Holter 24h','MAPA','Cintilografia Miocárdica','Cateterismo','Angiotomografia','Outro') NOT NULL,
	`clinica_servico` varchar(255),
	`medico_executor` varchar(255),
	`indicacao` text,
	`descricao` text,
	`conclusao` text,
	`feve` decimal(4,1),
	`ddve` decimal(4,1),
	`dsve` decimal(4,1),
	`ae` decimal(4,1),
	`arquivo_laudo_url` varchar(500),
	`arquivo_exame_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cardiologia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cirurgias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`internacao_id` int,
	`data_cirurgia` timestamp NOT NULL,
	`procedimento` varchar(500) NOT NULL,
	`codigos_cbhpm` text,
	`hospital` varchar(255),
	`sala_operatoria` varchar(50),
	`cirurgiao_responsavel` varchar(255),
	`equipe` text,
	`anestesista` varchar(255),
	`tipo_anestesia` varchar(100),
	`indicacao` text,
	`descricao_cirurgica` text,
	`achados` text,
	`complicacoes` text,
	`duracao_minutos` int,
	`sangramento` varchar(100),
	`status` enum('Agendada','Realizada','Cancelada','Adiada') DEFAULT 'Agendada',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cirurgias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentos_medicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`evolucao_id` int,
	`tipo` enum('Receita','Receita Especial','Solicitação de Exames','Atestado Comparecimento','Atestado Afastamento','Laudo Médico','Relatório Médico','Protocolo Cirurgia','Guia SADT','Guia Internação','Outro') NOT NULL,
	`data_emissao` timestamp NOT NULL,
	`conteudo` text,
	`medicamentos` text,
	`cid10` varchar(20),
	`dias_afastamento` int,
	`data_inicio` date,
	`data_fim` date,
	`exames_solicitados` text,
	`justificativa` text,
	`procedimento_proposto` varchar(500),
	`data_prevista` date,
	`hospital_previsto` varchar(255),
	`profissional_id` int,
	`profissional_nome` varchar(255),
	`crm` varchar(20),
	`arquivo_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentos_medicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endoscopias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('EDA','Colonoscopia','Retossigmoidoscopia','CPRE','Ecoendoscopia','Enteroscopia','Outro') NOT NULL,
	`clinica_servico` varchar(255),
	`medico_executor` varchar(255),
	`indicacao` text,
	`preparo` varchar(255),
	`sedacao` varchar(255),
	`descricao` text,
	`conclusao` text,
	`biopsia` boolean DEFAULT false,
	`local_biopsia` varchar(255),
	`resultado_biopsia` text,
	`arquivo_laudo_url` varchar(500),
	`arquivo_imagens_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endoscopias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evolucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`atendimento_id` int,
	`data_evolucao` timestamp NOT NULL,
	`tipo` enum('Consulta','Retorno','Urgência','Teleconsulta','Parecer') DEFAULT 'Consulta',
	`subjetivo` text,
	`objetivo` text,
	`avaliacao` text,
	`plano` text,
	`pressao_arterial` varchar(20),
	`frequencia_cardiaca` int,
	`temperatura` decimal(4,1),
	`peso` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`profissional_id` int,
	`profissional_nome` varchar(255),
	`assinado` boolean DEFAULT false,
	`data_assinatura` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evolucoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_imagem` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_exame` date NOT NULL,
	`tipo_exame` enum('Raio-X','Tomografia','Ressonância','Ultrassonografia','Mamografia','Densitometria','PET-CT','Cintilografia','Outro') NOT NULL,
	`regiao` varchar(255) NOT NULL,
	`clinica_servico` varchar(255),
	`medico_solicitante` varchar(255),
	`medico_laudador` varchar(255),
	`indicacao` text,
	`laudo` text,
	`conclusao` text,
	`arquivo_laudo_url` varchar(500),
	`arquivo_imagem_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_imagem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exames_laboratoriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_coleta` date NOT NULL,
	`data_resultado` date,
	`laboratorio` varchar(255),
	`tipo_exame` varchar(255) NOT NULL,
	`exame` varchar(255) NOT NULL,
	`resultado` text,
	`valor_referencia` varchar(255),
	`unidade` varchar(50),
	`alterado` boolean DEFAULT false,
	`observacoes` text,
	`arquivo_url` varchar(500),
	`arquivo_nome` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_laboratoriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`hospital` varchar(255) NOT NULL,
	`setor` varchar(100),
	`leito` varchar(50),
	`data_admissao` timestamp NOT NULL,
	`data_alta` timestamp,
	`motivo_internacao` text,
	`diagnostico_admissao` varchar(500),
	`cid10_admissao` varchar(20),
	`diagnostico_alta` varchar(500),
	`cid10_alta` varchar(20),
	`tipo_alta` enum('Melhorado','Curado','Transferido','Óbito','Evasão','A pedido'),
	`resumo_internacao` text,
	`complicacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicamentos_uso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`medicamento` varchar(255) NOT NULL,
	`principio_ativo` varchar(255),
	`dosagem` varchar(100),
	`posologia` varchar(255),
	`via_administracao` varchar(50),
	`data_inicio` date,
	`data_fim` date,
	`motivo_uso` varchar(255),
	`prescrito_por` varchar(255),
	`ativo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicamentos_uso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obstetricia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`tipo_registro` enum('Pré-natal','Parto','Puerpério','Aborto') NOT NULL,
	`data_registro` date NOT NULL,
	`dum` date,
	`dpp` date,
	`idade_gestacional` varchar(20),
	`tipo_parto` enum('Normal','Cesárea','Fórceps','Vácuo'),
	`data_parto` timestamp,
	`hospital` varchar(255),
	`peso_rn` decimal(5,0),
	`apgar_1` int,
	`apgar_5` int,
	`sexo_rn` enum('M','F'),
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obstetricia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `problemas_ativos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`cid10` varchar(20),
	`data_inicio` date,
	`data_resolucao` date,
	`ativo` boolean NOT NULL DEFAULT true,
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problemas_ativos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_clinico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`historia_clinica` text,
	`antecedentes_pessoais` text,
	`antecedentes_familiares` text,
	`habitos` text,
	`gestacoes` int,
	`partos` int,
	`abortos` int,
	`dum` date,
	`peso_atual` decimal(5,2),
	`altura` decimal(3,2),
	`imc` decimal(4,1),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumo_clinico_id` PRIMARY KEY(`id`),
	CONSTRAINT `resumo_clinico_paciente_id_unique` UNIQUE(`paciente_id`)
);
--> statement-breakpoint
CREATE TABLE `terapias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`data_terapia` timestamp NOT NULL,
	`tipo_terapia` enum('Quimioterapia','Imunoterapia','Terapia Alvo','Imunobiológico','Infusão','Transfusão','Outro') NOT NULL,
	`protocolo` varchar(255),
	`ciclo` int,
	`dia` int,
	`medicamentos` text,
	`local` varchar(255),
	`pre_quimio` text,
	`intercorrencias` text,
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `terapias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_nome` varchar(255);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_parentesco` varchar(100);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `responsavel_email` varchar(320);--> statement-breakpoint
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardiologia` ADD CONSTRAINT `cardiologia_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cirurgias` ADD CONSTRAINT `cirurgias_internacao_id_internacoes_id_fk` FOREIGN KEY (`internacao_id`) REFERENCES `internacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_evolucao_id_evolucoes_id_fk` FOREIGN KEY (`evolucao_id`) REFERENCES `evolucoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos_medicos` ADD CONSTRAINT `documentos_medicos_profissional_id_users_id_fk` FOREIGN KEY (`profissional_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endoscopias` ADD CONSTRAINT `endoscopias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_atendimento_id_atendimentos_id_fk` FOREIGN KEY (`atendimento_id`) REFERENCES `atendimentos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_profissional_id_users_id_fk` FOREIGN KEY (`profissional_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_imagem` ADD CONSTRAINT `exames_imagem_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exames_laboratoriais` ADD CONSTRAINT `exames_laboratoriais_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internacoes` ADD CONSTRAINT `internacoes_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicamentos_uso` ADD CONSTRAINT `medicamentos_uso_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obstetricia` ADD CONSTRAINT `obstetricia_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problemas_ativos` ADD CONSTRAINT `problemas_ativos_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumo_clinico` ADD CONSTRAINT `resumo_clinico_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terapias` ADD CONSTRAINT `terapias_paciente_id_pacientes_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE no action ON UPDATE no action;