# Plano Detalhado: Fase 1 - Isolamento Crítico de Dados Multi-tenant

> **Documento de Planejamento Técnico** | Versão 1.0 | 10 de Janeiro de 2026  
> **Projeto:** Gorgen - Sistema de Gestão em Saúde  
> **Objetivo:** Implementar isolamento completo de dados entre tenants

---

## Sumário Executivo

Este documento detalha o plano de implementação para a Fase 1 da arquitetura multi-tenant do Gorgen. A fase abrange a adição de `tenant_id` em todas as tabelas, criação de middleware de contexto, modificação de todas as funções de banco de dados, e criação de índices compostos para performance.

| Métrica | Valor |
|---------|-------|
| Tabelas a modificar | 32 |
| Funções de banco a atualizar | 133 |
| Procedures tRPC a atualizar | 118 |
| Sprints estimados | 4 |
| Duração total estimada | 8-12 dias |

---

## Inventário Completo

### Tabelas que Precisam de tenant_id

A análise do schema identificou 34 tabelas, das quais 32 precisam receber a coluna `tenant_id`:

| # | Tabela | Categoria | Prioridade | Status Atual |
|---|--------|-----------|------------|--------------|
| 1 | `tenants` | Sistema | N/A | ✅ Tabela mestre |
| 2 | `paciente_autorizacoes` | Segurança | N/A | ✅ Já tem tenant_id |
| 3 | `audit_log` | Auditoria | Alta | ⚠️ Tem tenant_id mas default(1) |
| 4 | `users` | Core | **CRÍTICA** | 🔴 Falta tenant_id |
| 5 | `pacientes` | Core | **CRÍTICA** | 🔴 Falta tenant_id |
| 6 | `atendimentos` | Core | **CRÍTICA** | 🔴 Falta tenant_id |
| 7 | `resumo_clinico` | Prontuário | Alta | 🔴 Falta tenant_id |
| 8 | `problemas_ativos` | Prontuário | Alta | 🔴 Falta tenant_id |
| 9 | `alergias` | Prontuário | Alta | 🔴 Falta tenant_id |
| 10 | `medicamentos_uso` | Prontuário | Alta | 🔴 Falta tenant_id |
| 11 | `evolucoes` | Prontuário | Alta | 🔴 Falta tenant_id |
| 12 | `internacoes` | Prontuário | Alta | 🔴 Falta tenant_id |
| 13 | `cirurgias` | Prontuário | Alta | 🔴 Falta tenant_id |
| 14 | `exames_laboratoriais` | Prontuário | Alta | 🔴 Falta tenant_id |
| 15 | `exames_imagem` | Prontuário | Alta | 🔴 Falta tenant_id |
| 16 | `endoscopias` | Prontuário | Alta | 🔴 Falta tenant_id |
| 17 | `cardiologia` | Prontuário | Alta | 🔴 Falta tenant_id |
| 18 | `terapias` | Prontuário | Alta | 🔴 Falta tenant_id |
| 19 | `obstetricia` | Prontuário | Alta | 🔴 Falta tenant_id |
| 20 | `documentos_medicos` | Prontuário | Alta | 🔴 Falta tenant_id |
| 21 | `historico_medidas` | Prontuário | Alta | 🔴 Falta tenant_id |
| 22 | `agendamentos` | Agenda | Alta | 🔴 Falta tenant_id |
| 23 | `bloqueios_horario` | Agenda | Alta | 🔴 Falta tenant_id |
| 24 | `historico_agendamentos` | Agenda | Alta | 🔴 Falta tenant_id |
| 25 | `user_profiles` | Usuários | **CRÍTICA** | 🔴 Falta tenant_id |
| 26 | `user_settings` | Usuários | Média | 🔴 Falta tenant_id |
| 27 | `vinculo_secretaria_medico` | Usuários | Média | 🔴 Falta tenant_id |
| 28 | `historico_vinculo` | Usuários | Média | 🔴 Falta tenant_id |
| 29 | `documentos_externos` | Documentos | Alta | 🔴 Falta tenant_id |
| 30 | `patologias` | Prontuário | Alta | 🔴 Falta tenant_id |
| 31 | `exames_padronizados` | Sistema | Baixa | 🟡 Compartilhada (sem tenant) |
| 32 | `resultados_laboratoriais` | Prontuário | Alta | 🔴 Falta tenant_id |
| 33 | `exames_favoritos` | Usuários | Média | 🔴 Falta tenant_id |

**Nota:** A tabela `exames_padronizados` é uma tabela de referência compartilhada entre todos os tenants (lista de exames padrão), portanto não precisa de tenant_id.

---

## Arquitetura da Solução

### 1. Modelo de Dados Multi-tenant

```
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT 1                                 │
│  (Dr. André Gorgen)                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ users    │  │pacientes │  │atendim.  │  │prontuário│        │
│  │tenant_id │  │tenant_id │  │tenant_id │  │tenant_id │        │
│  │   = 1    │  │   = 1    │  │   = 1    │  │   = 1    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         TENANT 2                                 │
│  (Clínica XYZ)                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ users    │  │pacientes │  │atendim.  │  │prontuário│        │
│  │tenant_id │  │tenant_id │  │tenant_id │  │tenant_id │        │
│  │   = 2    │  │   = 2    │  │   = 2    │  │   = 2    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TABELAS COMPARTILHADAS                        │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ tenants          │  │exames_padronizados│                    │
│  │ (tabela mestre)  │  │ (referência)      │                    │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Fluxo de Contexto do Tenant

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│   OAuth     │────▶│  Context    │────▶│  Procedure  │
│   HTTP      │     │   Validate  │     │  + Tenant   │     │  + Filter   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │ user_profiles│
                                        │ .tenant_id  │
                                        └─────────────┘
```

### 3. Middleware de Tenant (A ser criado)

```typescript
// server/_core/tenantContext.ts
export type TenantContext = {
  tenantId: number;
  tenantSlug: string;
  tenantPlano: string;
};

export async function getTenantFromUser(userId: number): Promise<TenantContext> {
  const profile = await getUserProfile(userId);
  if (!profile?.tenantId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Usuário sem tenant associado' });
  }
  const tenant = await getTenantById(profile.tenantId);
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantPlano: tenant.plano,
  };
}
```

---

## Plano de Sprints

### Sprint 1: Fundação (2-3 dias)

**Objetivo:** Criar infraestrutura base para multi-tenant

#### Tarefas

| # | Tarefa | Arquivo | Estimativa | Dependência |
|---|--------|---------|------------|-------------|
| 1.1 | Adicionar tenant_id na tabela `users` | schema.ts | 30min | - |
| 1.2 | Adicionar tenant_id na tabela `user_profiles` | schema.ts | 30min | 1.1 |
| 1.3 | Criar middleware `tenantContext.ts` | _core/ | 2h | 1.2 |
| 1.4 | Modificar `context.ts` para incluir tenant | _core/ | 1h | 1.3 |
| 1.5 | Criar `tenantProcedure` no trpc.ts | _core/ | 1h | 1.4 |
| 1.6 | Criar script de migração para dados existentes | scripts/ | 2h | 1.2 |
| 1.7 | Executar migração: todos os dados → tenant_id = 1 | - | 30min | 1.6 |
| 1.8 | Criar testes de integração para tenant context | tests/ | 2h | 1.5 |

**Entregáveis Sprint 1:**
- [ ] Middleware de tenant funcionando
- [ ] Usuários existentes migrados para tenant 1
- [ ] Testes de contexto passando

---

### Sprint 2: Tabelas Core (2-3 dias)

**Objetivo:** Adicionar tenant_id nas tabelas principais e modificar funções

#### Tarefas

| # | Tarefa | Arquivo | Estimativa | Dependência |
|---|--------|---------|------------|-------------|
| 2.1 | Adicionar tenant_id em `pacientes` | schema.ts | 30min | Sprint 1 |
| 2.2 | Adicionar tenant_id em `atendimentos` | schema.ts | 30min | 2.1 |
| 2.3 | Criar índice composto (tenant_id, id) em pacientes | schema.ts | 15min | 2.1 |
| 2.4 | Criar índice composto (tenant_id, id) em atendimentos | schema.ts | 15min | 2.2 |
| 2.5 | Modificar `createPaciente()` para receber tenantId | db.ts | 1h | 2.1 |
| 2.6 | Modificar `listPacientes()` para filtrar por tenantId | db.ts | 1h | 2.1 |
| 2.7 | Modificar `getPacienteById()` para validar tenant | db.ts | 30min | 2.1 |
| 2.8 | Modificar `updatePaciente()` para validar tenant | db.ts | 30min | 2.1 |
| 2.9 | Modificar `deletePaciente()` para validar tenant | db.ts | 30min | 2.1 |
| 2.10 | Modificar `createAtendimento()` para receber tenantId | db.ts | 1h | 2.2 |
| 2.11 | Modificar `listAtendimentos()` para filtrar por tenantId | db.ts | 1h | 2.2 |
| 2.12 | Modificar todas as funções de contagem | db.ts | 1h | 2.1, 2.2 |
| 2.13 | Atualizar procedures de pacientes no routers.ts | routers.ts | 2h | 2.5-2.9 |
| 2.14 | Atualizar procedures de atendimentos no routers.ts | routers.ts | 2h | 2.10-2.11 |
| 2.15 | Migrar dados existentes de pacientes para tenant 1 | scripts/ | 30min | 2.1 |
| 2.16 | Migrar dados existentes de atendimentos para tenant 1 | scripts/ | 30min | 2.2 |
| 2.17 | Criar testes de isolamento para pacientes | tests/ | 1h | 2.6 |
| 2.18 | Criar testes de isolamento para atendimentos | tests/ | 1h | 2.11 |

**Entregáveis Sprint 2:**
- [ ] Pacientes isolados por tenant
- [ ] Atendimentos isolados por tenant
- [ ] Índices de performance criados
- [ ] Testes de isolamento passando

---

### Sprint 3: Prontuário Médico (2-3 dias)

**Objetivo:** Isolar todas as tabelas do prontuário médico

#### Tarefas

| # | Tarefa | Arquivo | Estimativa | Dependência |
|---|--------|---------|------------|-------------|
| 3.1 | Adicionar tenant_id em `resumo_clinico` | schema.ts | 30min | Sprint 2 |
| 3.2 | Adicionar tenant_id em `problemas_ativos` | schema.ts | 30min | 3.1 |
| 3.3 | Adicionar tenant_id em `alergias` | schema.ts | 30min | 3.1 |
| 3.4 | Adicionar tenant_id em `medicamentos_uso` | schema.ts | 30min | 3.1 |
| 3.5 | Adicionar tenant_id em `evolucoes` | schema.ts | 30min | 3.1 |
| 3.6 | Adicionar tenant_id em `internacoes` | schema.ts | 30min | 3.1 |
| 3.7 | Adicionar tenant_id em `cirurgias` | schema.ts | 30min | 3.1 |
| 3.8 | Adicionar tenant_id em `exames_laboratoriais` | schema.ts | 30min | 3.1 |
| 3.9 | Adicionar tenant_id em `exames_imagem` | schema.ts | 30min | 3.1 |
| 3.10 | Adicionar tenant_id em `endoscopias` | schema.ts | 30min | 3.1 |
| 3.11 | Adicionar tenant_id em `cardiologia` | schema.ts | 30min | 3.1 |
| 3.12 | Adicionar tenant_id em `terapias` | schema.ts | 30min | 3.1 |
| 3.13 | Adicionar tenant_id em `obstetricia` | schema.ts | 30min | 3.1 |
| 3.14 | Adicionar tenant_id em `documentos_medicos` | schema.ts | 30min | 3.1 |
| 3.15 | Adicionar tenant_id em `historico_medidas` | schema.ts | 30min | 3.1 |
| 3.16 | Adicionar tenant_id em `documentos_externos` | schema.ts | 30min | 3.1 |
| 3.17 | Adicionar tenant_id em `patologias` | schema.ts | 30min | 3.1 |
| 3.18 | Adicionar tenant_id em `resultados_laboratoriais` | schema.ts | 30min | 3.1 |
| 3.19 | Criar índices compostos para todas as tabelas | schema.ts | 1h | 3.1-3.18 |
| 3.20 | Modificar funções de prontuário no db.ts (15 funções) | db.ts | 4h | 3.1-3.18 |
| 3.21 | Atualizar procedures de prontuário no routers.ts | routers.ts | 3h | 3.20 |
| 3.22 | Migrar dados existentes para tenant 1 | scripts/ | 1h | 3.1-3.18 |
| 3.23 | Criar testes de isolamento para prontuário | tests/ | 2h | 3.20 |

**Entregáveis Sprint 3:**
- [ ] Todas as tabelas de prontuário com tenant_id
- [ ] Funções de prontuário filtradas por tenant
- [ ] Dados migrados para tenant 1
- [ ] Testes de isolamento passando

---

### Sprint 4: Agenda e Configurações (2-3 dias)

**Objetivo:** Isolar agenda, configurações de usuário e finalizar

#### Tarefas

| # | Tarefa | Arquivo | Estimativa | Dependência |
|---|--------|---------|------------|-------------|
| 4.1 | Adicionar tenant_id em `agendamentos` | schema.ts | 30min | Sprint 3 |
| 4.2 | Adicionar tenant_id em `bloqueios_horario` | schema.ts | 30min | 4.1 |
| 4.3 | Adicionar tenant_id em `historico_agendamentos` | schema.ts | 30min | 4.1 |
| 4.4 | Adicionar tenant_id em `user_settings` | schema.ts | 30min | Sprint 1 |
| 4.5 | Adicionar tenant_id em `vinculo_secretaria_medico` | schema.ts | 30min | Sprint 1 |
| 4.6 | Adicionar tenant_id em `historico_vinculo` | schema.ts | 30min | 4.5 |
| 4.7 | Adicionar tenant_id em `exames_favoritos` | schema.ts | 30min | Sprint 1 |
| 4.8 | Criar índices compostos para agenda | schema.ts | 30min | 4.1-4.3 |
| 4.9 | Modificar funções de agenda no db.ts (10 funções) | db.ts | 2h | 4.1-4.3 |
| 4.10 | Modificar funções de configurações no db.ts (15 funções) | db.ts | 3h | 4.4-4.7 |
| 4.11 | Atualizar procedures de agenda no routers.ts | routers.ts | 2h | 4.9 |
| 4.12 | Atualizar procedures de configurações no routers.ts | routers.ts | 2h | 4.10 |
| 4.13 | Remover default(1) do audit_log | schema.ts | 15min | Sprint 1 |
| 4.14 | Modificar createAuditLog para exigir tenantId | db.ts | 30min | 4.13 |
| 4.15 | Migrar dados de agenda para tenant 1 | scripts/ | 30min | 4.1-4.3 |
| 4.16 | Migrar dados de configurações para tenant 1 | scripts/ | 30min | 4.4-4.7 |
| 4.17 | Criar testes de isolamento para agenda | tests/ | 1h | 4.9 |
| 4.18 | Criar testes de isolamento para configurações | tests/ | 1h | 4.10 |
| 4.19 | Teste de integração completo (end-to-end) | tests/ | 2h | Todas |
| 4.20 | Documentação de arquitetura atualizada | docs/ | 2h | Todas |

**Entregáveis Sprint 4:**
- [ ] Todas as tabelas com tenant_id
- [ ] Todas as funções filtradas por tenant
- [ ] Todos os dados migrados para tenant 1
- [ ] Suite completa de testes passando
- [ ] Documentação atualizada

---

## Detalhamento Técnico

### Padrão de Modificação do Schema

```typescript
// ANTES
export const pacientes = mysqlTable("pacientes", {
  id: int("id").autoincrement().primaryKey(),
  idPaciente: varchar("id_paciente", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  // ... outros campos
});

// DEPOIS
export const pacientes = mysqlTable("pacientes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id), // NOVO
  idPaciente: varchar("id_paciente", { length: 64 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  // ... outros campos
}, (table) => ({
  // Índice composto para performance
  tenantIdIdx: index("idx_pacientes_tenant").on(table.tenantId),
  tenantIdPacienteIdx: index("idx_pacientes_tenant_id_paciente").on(table.tenantId, table.idPaciente),
}));
```

### Padrão de Modificação das Funções de Banco

```typescript
// ANTES
export async function listPacientes(filters?: {
  nome?: string;
  cpf?: string;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(pacientes);
  // ... filtros
  return await query;
}

// DEPOIS
export async function listPacientes(
  tenantId: number, // NOVO: parâmetro obrigatório
  filters?: {
    nome?: string;
    cpf?: string;
  }
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(pacientes);
  
  // NOVO: Filtro obrigatório por tenant
  const conditions = [eq(pacientes.tenantId, tenantId)];
  
  if (filters?.nome) {
    conditions.push(like(pacientes.nome, `%${filters.nome}%`));
  }
  // ... outros filtros
  
  query = query.where(and(...conditions));
  return await query;
}
```

### Padrão de Modificação das Procedures

```typescript
// ANTES
pacientes: router({
  list: protectedProcedure
    .input(z.object({ nome: z.string().optional() }))
    .query(async ({ input }) => {
      return await db.listPacientes(input);
    }),
});

// DEPOIS
pacientes: router({
  list: protectedProcedure
    .input(z.object({ nome: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // NOVO: Obter tenant do contexto
      const tenantId = ctx.tenant.tenantId;
      return await db.listPacientes(tenantId, input);
    }),
});
```

### Script de Migração de Dados

```typescript
// scripts/migrate-to-tenant.ts
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrateToTenant1() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const tables = [
    'users',
    'pacientes', 
    'atendimentos',
    'resumo_clinico',
    // ... todas as tabelas
  ];
  
  for (const table of tables) {
    console.log(`Migrando ${table}...`);
    await db.execute(sql`UPDATE ${sql.identifier(table)} SET tenant_id = 1 WHERE tenant_id IS NULL`);
  }
  
  console.log('Migração concluída!');
}

migrateToTenant1();
```

---

## Checklist de Validação

### Antes de Cada Sprint

- [ ] Backup completo do banco de dados
- [ ] Testes existentes passando (88 testes)
- [ ] Ambiente de desenvolvimento funcionando

### Após Cada Sprint

- [ ] Migração de schema executada (`pnpm db:push`)
- [ ] Script de migração de dados executado
- [ ] Novos testes criados e passando
- [ ] Nenhum teste existente quebrado
- [ ] Aplicação funcionando no navegador
- [ ] Dados do Dr. André Gorgen preservados

### Validação Final (Após Sprint 4)

- [ ] Criar tenant de teste (ID = 2)
- [ ] Criar paciente no tenant 2
- [ ] Verificar que paciente não aparece no tenant 1
- [ ] Verificar que paciente do tenant 1 não aparece no tenant 2
- [ ] Testar todas as funcionalidades com ambos os tenants
- [ ] Executar teste de carga simulando 100 usuários
- [ ] Verificar logs de auditoria por tenant

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados na migração | Baixa | Alto | Backup antes de cada sprint |
| Queries sem filtro de tenant | Média | Alto | Code review obrigatório |
| Performance degradada | Média | Médio | Índices compostos |
| Testes insuficientes | Média | Alto | Cobertura mínima de 80% |
| Incompatibilidade de tipos | Baixa | Médio | TypeScript strict mode |

---

## Cronograma Estimado

```
Semana 1:
├── Dia 1-2: Sprint 1 (Fundação)
├── Dia 3-5: Sprint 2 (Tabelas Core)

Semana 2:
├── Dia 1-3: Sprint 3 (Prontuário)
├── Dia 4-5: Sprint 4 (Agenda e Config)

Semana 3:
├── Dia 1-2: Testes de integração
├── Dia 3: Documentação
├── Dia 4-5: Buffer para correções
```

**Duração Total:** 10-12 dias úteis

---

## Próximos Passos

1. **Aprovar este plano** com o Dr. André Gorgen
2. **Criar backup completo** do sistema atual
3. **Iniciar Sprint 1** com a criação do middleware de tenant
4. **Revisar progresso** ao final de cada sprint

---

## Referências

- [1] Análise Multi-tenant: `/home/ubuntu/consultorio_poc/ANALISE_MULTITENANT.md`
- [2] Schema atual: `/home/ubuntu/consultorio_poc/drizzle/schema.ts`
- [3] Funções de banco: `/home/ubuntu/consultorio_poc/server/db.ts`
- [4] Procedures tRPC: `/home/ubuntu/consultorio_poc/server/routers.ts`
- [5] Pilares Fundamentais: `/home/ubuntu/consultorio_poc/PILARES_FUNDAMENTAIS.md`

---

*Documento gerado por Manus AI | 10 de Janeiro de 2026*
