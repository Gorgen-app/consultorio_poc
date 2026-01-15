# 🏥 JORNADA DO PACIENTE NO GORGEN

> **Documento de Arquitetura** | Versão 1.0 | Atualizado em 14/01/2026

Este documento define a filosofia, fluxos e relacionamentos entre os módulos do sistema Gorgen, garantindo uma experiência harmônica e integrada para o acompanhamento completo da jornada do paciente.

---

## 1. VISÃO GERAL DA JORNADA

A jornada do paciente no Gorgen é um **ciclo contínuo** que abrange desde o primeiro contato até o monitoramento de saúde fora do ambiente de atendimento:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CICLO DA JORNADA DO PACIENTE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│    │   PRIMEIRO   │────▶│  AGENDAMENTO │────▶│   CRIAÇÃO    │              │
│    │   CONTATO    │     │   CONSULTA   │     │  PRONTUÁRIO  │              │
│    └──────────────┘     └──────────────┘     └──────────────┘              │
│                                                      │                      │
│                                                      ▼                      │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│    │   CONSULTA   │────▶│    LINHA     │◀────│  ATENDIMENTO │              │
│    │   REVISÃO    │     │  DE CUIDADO  │     │   CONSULTA   │              │
│    └──────────────┘     └──────────────┘     └──────────────┘              │
│           ▲                                          │                      │
│           │                                          ▼                      │
│           │             ┌──────────────┐     ┌──────────────┐              │
│           │             │  NOTA FISCAL │◀────│   PEDIDO     │              │
│           │             │              │     │   EXAMES     │              │
│           │             └──────────────┘     └──────────────┘              │
│           │                    ▲                     │                      │
│           │                    │                     ▼                      │
│           │             ┌──────────────┐     ┌──────────────┐              │
│           │             │ FATURAMENTO  │◀────│  PRESCRIÇÃO  │              │
│           │             │              │     │   MÉDICA     │              │
│           │             └──────────────┘     └──────────────┘              │
│           │                    ▲                     │                      │
│           │                    │                     ▼                      │
│           │             ┌──────────────┐     ┌──────────────┐              │
│           └─────────────│   CIRURGIA   │◀────│  AGENDAMENTO │              │
│                         │              │     │  CIRÚRGICO   │              │
│                         └──────────────┘     └──────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TIPOS DE ATENDIMENTO

| Tipo | Descrição | % do Total | Fluxo |
|------|-----------|------------|-------|
| **Consulta** | Porta de entrada principal | ~80% | Agendamento → Consulta → Faturamento |
| **Cirurgia** | Procedimentos cirúrgicos | ~10% | Consulta → Agendamento Cirúrgico → Cirurgia → Faturamento |
| **Procedimento** | Procedimentos em consultório | ~5% | Agendamento → Procedimento → Faturamento |
| **Visita Hospitalar** | Visita a paciente internado | ~3% | Registro → Visita → Faturamento |
| **Exames** | Exames diagnósticos | ~2% | Pedido → Agendamento → Exame → Resultado |

---

## 3. RELACIONAMENTO ENTRE MÓDULOS

### 3.1 Diagrama de Venn (Prontuário, Agenda, Atendimentos)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRONTUÁRIO                              │
│   (Contém todo o histórico clínico do paciente)                 │
│                                                                 │
│    ┌───────────────────────────────────────────┐                │
│    │              AGENDA                        │                │
│    │   (Organiza compromissos no tempo)         │                │
│    │                                            │                │
│    │    ┌─────────────────────────────┐        │                │
│    │    │    ETAPA DO ATENDIMENTO     │        │                │
│    │    │   (Intersecção: agendamento │        │                │
│    │    │    que vira atendimento)    │        │                │
│    │    └─────────────────────────────┘        │                │
│    │                                            │                │
│    └───────────────────────────────────────────┘                │
│                                                                 │
│    ┌───────────────────────────────────────────┐                │
│    │            ATENDIMENTOS                    │                │
│    │   (Registros de serviços prestados)        │                │
│    │   (Faturamento, procedimentos, etc.)       │                │
│    └───────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Regras de Relacionamento

| Regra | Descrição |
|-------|-----------|
| **Agenda → Atendimento** | Todo atendimento DEVE ter um registro na agenda |
| **Agenda ≠ Atendimento** | Nem todo agendamento é atendimento (ex: reunião, compromisso pessoal) |
| **Prontuário ⊃ Agenda** | A agenda está contida no contexto do prontuário |
| **Prontuário ⊃ Atendimentos** | Os atendimentos fazem parte do prontuário |
| **Agenda ∩ Atendimentos** | A intersecção é a "Etapa do Atendimento" (agendamento que se torna atendimento) |

---

## 4. FLUXOS DETALHADOS

### 4.1 Fluxo de Consulta (80% dos atendimentos)

```
AGENDAMENTO ──────▶ CONSULTA ──────▶ FATURAMENTO
     │                  │                 │
     │                  ▼                 ▼
     │           ┌─────────────┐    ┌─────────────┐
     │           │ Pedido de   │    │ Nota Fiscal │
     │           │ Exames      │    └─────────────┘
     │           │ Prescrição  │
     │           │ Atestados   │
     │           │ Laudos      │
     │           └─────────────┘
     │                  │
     │                  ▼
     │           ┌─────────────┐
     │           │ Agendamento │
     │           │ Cirúrgico   │
     │           └─────────────┘
     │                  │
     │                  ▼
     │           ┌─────────────┐
     └──────────▶│ Revisão     │ (Ciclo reinicia)
                 └─────────────┘
```

### 4.2 Fluxo de Cirurgia

```
CONSULTA ──────▶ AGENDAMENTO CIRÚRGICO ──────▶ CIRURGIA ──────▶ FATURAMENTO
                         │                         │
                         ▼                         ▼
                  ┌─────────────┐           ┌─────────────┐
                  │ Autorização │           │ Visitas     │
                  │ Convênio    │           │ Hospitalares│
                  │ Reserva     │           └─────────────┘
                  │ Centro Cir. │
                  │ Equipe      │
                  └─────────────┘
```

### 4.3 Fluxo de Exames

```
CONSULTA ──────▶ PEDIDO EXAME ──────▶ AGENDAMENTO ──────▶ EXAME ──────▶ RESULTADO
                      │                                                    │
                      ▼                                                    ▼
               ┌─────────────┐                                      ┌─────────────┐
               │ Guia TISS   │                                      │ Laudo       │
               │ Autorização │                                      │ Prontuário  │
               └─────────────┘                                      └─────────────┘
```

---

## 5. CICLO CONTÍNUO DE ATENDIMENTOS

O diagrama circular ilustra como os diferentes tipos de atendimento se conectam:

```
                        AGENDAMENTO
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │                                        │
        ▼                                        │
    CONSULTA ────────────────────────────────────┤
        │                                        │
        ├──────▶ PROCEDIMENTO ──────────────────▶│
        │              │                         │
        │              ▼                         │
        ├──────▶ EXAMES ────────────────────────▶│
        │              │                         │
        │              ▼                         │
        ├──────▶ VISITA INTERNADO ──────────────▶│
        │              │                         │
        │              ▼                         │
        └──────▶ AGENDAMENTO CIRÚRGICO          │
                       │                         │
                       ▼                         │
                   CIRURGIA ────────────────────▶│
                       │                         │
                       ▼                         │
               ATENDIMENTOS                      │
                    ║                            │
                    ║                            │
               FATURAMENTO ─────────────────────▶│
                                                 │
                                                 ▼
                                        (Ciclo reinicia)
```

---

## 6. PRINCÍPIOS DE INTEGRAÇÃO

### 6.1 Harmonia entre Módulos

> **"A agenda é a primeira etapa de muitos atendimentos"**

| Princípio | Implementação |
|-----------|---------------|
| **Agenda como porta de entrada** | Todo atendimento começa com um agendamento |
| **Prontuário como contexto** | Agenda e atendimentos existem dentro do prontuário |
| **Fluxo contínuo** | Cada etapa alimenta a próxima automaticamente |
| **Rastreabilidade** | Cada ação é registrada e vinculada ao histórico |
| **Imutabilidade** | Nenhum registro é apagado, apenas marcado como cancelado/reagendado |

### 6.2 Regras de Negócio

1. **Não existe atendimento sem agendamento**
   - Todo atendimento DEVE ter um registro correspondente na agenda
   - O agendamento é criado primeiro, depois convertido em atendimento

2. **Agendamentos podem existir sem atendimento**
   - Reuniões da clínica
   - Compromissos particulares
   - Bloqueios de horário
   - Eventos administrativos

3. **Linha de Cuidado**
   - Após atendimento, paciente é classificado em uma linha de cuidado
   - Monitoramento de saúde fora do ambiente de atendimento
   - Alertas e lembretes para acompanhamento

---

## 7. ESTRUTURA DE DADOS PROPOSTA

### 7.1 Tabela: agendamentos

```sql
CREATE TABLE agendamentos (
  id INT PRIMARY KEY,
  paciente_id INT NULL,           -- NULL para compromissos não-clínicos
  data_hora DATETIME NOT NULL,
  duracao_minutos INT DEFAULT 30,
  tipo ENUM('consulta', 'cirurgia', 'procedimento', 'exame', 'visita', 'reuniao', 'bloqueio', 'pessoal'),
  status ENUM('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'reagendado'),
  atendimento_id INT NULL,        -- Vincula ao atendimento quando realizado
  local VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 7.2 Relacionamento Agenda ↔ Atendimento

```
agendamentos.atendimento_id ──────▶ atendimentos.id
```

Quando um agendamento é concluído, ele é vinculado ao atendimento correspondente, mantendo a rastreabilidade completa.

---

## 8. PRÓXIMOS PASSOS DE IMPLEMENTAÇÃO

1. [ ] Refatorar tabela de agendamentos para suportar tipos não-clínicos
2. [ ] Criar vínculo bidirecional entre agendamentos e atendimentos
3. [ ] Implementar fluxo de conversão agendamento → atendimento
4. [ ] Criar visualização unificada na agenda (todos os tipos)
5. [ ] Implementar linha de cuidado para monitoramento pós-atendimento
6. [ ] Criar fluxo de agendamento cirúrgico completo
7. [ ] Implementar pedido e acompanhamento de exames

---

*Documento criado com base nos diagramas e filosofia definidos pelo Dr. André Gorgen em 14/01/2026.*
