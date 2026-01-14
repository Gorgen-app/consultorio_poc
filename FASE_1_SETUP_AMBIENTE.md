# Fase 1: Configuração do Ambiente de Desenvolvimento - Agenda v2.0

**Data de Início:** 14 de janeiro de 2026  
**Status:** Em Progresso  
**Responsável:** Manus AI

---

## Objetivo da Fase 1

Configurar o ambiente de desenvolvimento, criar o schema do banco de dados, implementar serviços de domínio e preparar a infraestrutura para as fases subsequentes.

---

## Tarefas da Fase 1

### 1.1 Preparação do Ambiente

- [x] Verificar dependências do projeto (Node.js, pnpm, TypeScript)
- [x] Confirmar servidor de desenvolvimento rodando
- [x] Validar banco de dados TiDB conectado
- [ ] Instalar dependências adicionais se necessário (uuid, date-fns)

### 1.2 Schema do Banco de Dados

- [ ] Criar tabela `calendars` (calendários por profissional)
- [ ] Criar tabela `events` (eventos genéricos)
- [ ] Criar tabela `consultations` (especialização para consultas)
- [ ] Criar tabela `consultation_status_log` (auditoria de mudanças)
- [ ] Criar tabela `calendar_acl` (controle de acesso)
- [ ] Criar tabela `audit_log` (auditoria geral)
- [ ] Criar índices para otimização de queries

### 1.3 Serviços de Domínio

- [ ] Implementar `consultationStateMachine.ts` com máquina de estados
- [ ] Implementar `availabilityService.ts` para verificar disponibilidade
- [ ] Implementar `recurrenceService.ts` para eventos recorrentes
- [ ] Implementar `timezoneService.ts` para gerenciar timezones

### 1.4 Camada de Acesso a Dados

- [ ] Criar funções em `server/db.ts` para operações CRUD
- [ ] Implementar queries otimizadas com índices
- [ ] Criar funções de auditoria

### 1.5 Procedures tRPC

- [ ] Criar router `agenda.ts` com procedures básicos
- [ ] Integrar router ao `appRouter` principal
- [ ] Testar procedures com vitest

### 1.6 Validação

- [ ] Executar testes unitários
- [ ] Verificar compilação TypeScript
- [ ] Validar conexão com banco de dados
- [ ] Fazer checkpoint

---

## Estrutura de Arquivos

```
consultorio_poc/
├── drizzle/
│   └── schema.ts                    # Schema atualizado com tabelas de agenda
├── server/
│   ├── db.ts                        # Funções de acesso a dados
│   ├── routers.ts                   # Router principal (adicionar agenda)
│   ├── routers/
│   │   └── agenda.ts                # Router de agenda (novo)
│   └── services/
│       ├── consultationStateMachine.ts  # Máquina de estados (novo)
│       ├── availabilityService.ts       # Verificação de disponibilidade (novo)
│       ├── recurrenceService.ts         # Eventos recorrentes (novo)
│       └── timezoneService.ts           # Gerenciamento de timezones (novo)
└── client/
    └── src/
        └── pages/
            └── Agenda.tsx           # Página de agenda (será atualizada)
```

---

## Especificações Técnicas

### Tabela: calendars

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | VARCHAR(36) | UUID primário |
| tenant_id | VARCHAR(36) | ID do consultório |
| name | VARCHAR(255) | Nome do calendário |
| description | TEXT | Descrição |
| timezone | VARCHAR(50) | Timezone (ex: America/Sao_Paulo) |
| color | VARCHAR(7) | Cor para visualização (#RRGGBB) |
| created_at | DATETIME | Data de criação |
| updated_at | DATETIME | Data de atualização |

### Tabela: events

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | VARCHAR(36) | UUID primário |
| calendar_id | VARCHAR(36) | FK para calendars |
| title | VARCHAR(255) | Título do evento |
| category | ENUM | Tipo: consulta, cirurgia, procedimento, etc |
| description | TEXT | Descrição detalhada |
| start_at | DATETIME | Início do evento |
| end_at | DATETIME | Fim do evento |
| timezone | VARCHAR(50) | Timezone do evento |
| all_day | BOOLEAN | Se é evento de dia inteiro |
| visibility | ENUM | public, private, confidential |
| busy_status | ENUM | busy, free, tentative |
| etag | VARCHAR(64) | Para sincronização com Google Calendar |
| created_at | DATETIME | Data de criação |
| updated_at | DATETIME | Data de atualização |
| created_by | VARCHAR(36) | ID do usuário que criou |

### Tabela: consultations

| Campo | Tipo | Descrição |
|-------|------|-----------|
| event_id | VARCHAR(36) | FK para events (PK) |
| patient_id | VARCHAR(36) | ID do paciente |
| professional_id | VARCHAR(36) | ID do profissional |
| payer_type | ENUM | particular ou convenio |
| payer_id | VARCHAR(36) | ID da operadora |
| payer_name | VARCHAR(255) | Nome da operadora |
| plan_name | VARCHAR(255) | Nome do plano |
| member_id | VARCHAR(50) | Número de matrícula |
| authorization_required | BOOLEAN | Requer autorização |
| authorization_number | VARCHAR(50) | Número da autorização |
| status | ENUM | agendado, confirmado, aguardando, em_consulta, finalizado, cancelado |
| attendance_started_at | DATETIME | Quando a consulta iniciou |
| attendance_ended_at | DATETIME | Quando a consulta terminou |
| chief_complaint | VARCHAR(500) | Queixa principal |
| notes | TEXT | Notas adicionais |
| created_at | DATETIME | Data de criação |
| updated_at | DATETIME | Data de atualização |

### Máquina de Estados de Consulta

```
┌─────────────┐
│  agendado   │ ← Estado inicial
└──────┬──────┘
       │
       ├─→ confirmado ──→ aguardando ──→ em_consulta ──→ finalizado
       │
       └─→ cancelado (em qualquer momento)
```

---

## Critérios de Aceitação

- ✅ Todas as tabelas criadas com sucesso no banco de dados
- ✅ Índices criados para otimização
- ✅ Serviços de domínio implementados e testados
- ✅ Procedures tRPC funcionando corretamente
- ✅ Testes unitários passando
- ✅ TypeScript compilando sem erros
- ✅ Checkpoint salvo com sucesso

---

## Próximas Fases

- **Fase 2:** Implementar procedures tRPC avançados
- **Fase 3:** Criar componentes frontend
- **Fase 4:** Implementar workflows de consulta
- **Fase 5:** Testes e validação completa

---

## Notas

- O sistema usa TiDB como banco de dados
- Todos os IDs são UUIDs (v4)
- Timezone padrão: America/Sao_Paulo
- Slots de agenda: 30 minutos (configurável por profissional)
- Duração de consulta: Configurável por profissional (padrão 30min)
