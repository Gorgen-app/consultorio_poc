# Manual de Backup e Restauração do GORGEN

> **Versão:** 3.9.30 | **Data:** 26 de Janeiro de 2026 | **Autor:** Equipe GORGEN

Este documento descreve os procedimentos completos de backup e restauração do sistema GORGEN, incluindo configuração, operação, monitoramento e recuperação de desastres.

---

## Índice

1. [Visão Geral do Sistema de Backup](#1-visão-geral-do-sistema-de-backup)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Tipos de Backup](#3-tipos-de-backup)
4. [Agendamento Automático](#4-agendamento-automático)
5. [Procedimentos de Backup Manual](#5-procedimentos-de-backup-manual)
6. [Procedimentos de Restauração](#6-procedimentos-de-restauração)
7. [Verificação de Integridade](#7-verificação-de-integridade)
8. [Monitoramento e Alertas](#8-monitoramento-e-alertas)
9. [Recuperação de Desastres](#9-recuperação-de-desastres)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Visão Geral do Sistema de Backup

O sistema de backup do GORGEN foi projetado seguindo os pilares fundamentais do sistema, especialmente o princípio de **Imutabilidade e Preservação Histórica**. Todo dado inserido no GORGEN é perpétuo, e o sistema de backup garante que essa informação possa ser recuperada em qualquer cenário.

### Características Principais

| Característica | Descrição |
|----------------|-----------|
| **Criptografia** | AES-256-GCM com chaves derivadas por tenant |
| **Compressão** | GZIP para redução de tamanho |
| **Verificação** | SHA-256 checksum para integridade |
| **Multi-tenant** | Backups isolados por tenant |
| **Retenção** | 30 dias para backups diários |
| **Armazenamento** | Manus Storage Proxy (S3-compatible) |

---

## 2. Arquitetura Técnica

### Fluxo de Backup

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Banco MySQL   │────▶│   Exportação    │────▶│   Compressão    │
│   (TiDB)        │     │   JSON          │     │   GZIP          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   S3 Storage    │◀────│   Upload        │◀────│   Criptografia  │
│   (Manus Proxy) │     │                 │     │   AES-256-GCM   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Componentes do Sistema

| Componente | Arquivo | Função |
|------------|---------|--------|
| Core de Backup | `server/backup.ts` | Funções de backup/restore |
| Scheduler | `server/backup-scheduler.ts` | Agendamento automático |
| Rotas tRPC | `server/backup-routes.ts` | API para administração |
| Rotas Cron | `server/cron-router.ts` | Endpoints para GitHub Actions |
| Inicialização | `server/_core/backup-init.ts` | Setup do sistema |

---

## 3. Tipos de Backup

### 3.1 Backup Completo (Full)

Exporta todos os dados do tenant, incluindo todas as tabelas e registros.

**Quando usar:**
- Backup diário programado
- Antes de migrações importantes
- Recuperação de desastres

**Estrutura do arquivo:**
```json
{
  "version": "3.0",
  "type": "full",
  "tenantId": 1,
  "createdAt": "2026-01-26T03:00:00.000Z",
  "tables": {
    "pacientes": { "count": 150, "records": [...] },
    "atendimentos": { "count": 500, "records": [...] }
  },
  "metadata": {
    "totalTables": 25,
    "totalRecords": 5000,
    "gorgenVersion": "2.15"
  }
}
```

### 3.2 Backup Incremental

Exporta apenas os dados modificados desde o último backup.

**Quando usar:**
- Backups frequentes durante o dia
- Redução de tempo e espaço de armazenamento

**Vantagens:**
- Mais rápido que backup completo
- Menor uso de banda e armazenamento
- Permite restauração pontual

### 3.3 Backup Offline (Portátil)

Gera um arquivo ZIP com instruções de restauração para uso externo.

**Quando usar:**
- Exportação para auditoria
- Transferência entre ambientes
- Backup local adicional

---

## 4. Agendamento Automático

### Tarefas Agendadas

| Tarefa | Horário (BRT) | Frequência | Descrição |
|--------|---------------|------------|-----------|
| Backup Diário | 03:00 | Diário | Backup completo de todos os tenants |
| Limpeza | 04:00 | Diário | Remove backups com mais de 30 dias |
| Teste de Restauração | 04:00 | Semanal (Dom) | Valida integridade dos backups |
| Verificação de Integridade | 05:00 | Semanal (Qua) | Verifica checksums |
| Relatório de Auditoria | 06:00 | Mensal (Dia 1) | Gera relatório completo |

### Configuração via GitHub Actions

Os backups são executados via GitHub Actions para garantir execução independente do servidor principal.

**Arquivo:** `.github/workflows/backup-daily.yml`

**Secrets necessários:**
- `GORGEN_API_URL`: URL da API em produção
- `CRON_SECRET`: Token de autenticação

---

## 5. Procedimentos de Backup Manual

### 5.1 Via Interface Administrativa

1. Acesse o GORGEN como **admin_master**
2. Navegue para **Configurações > Backup**
3. Clique em **"Executar Backup Agora"**
4. Aguarde a conclusão e verifique o status

### 5.2 Via API (tRPC)

```typescript
// Executar backup manual
const result = await trpc.backupScheduler.runTask.mutate({
  taskName: "daily-backup"
});
```

### 5.3 Via Endpoint Cron

```bash
curl -X POST "https://www.gorgen.com.br/api/cron/backup/daily" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 6. Procedimentos de Restauração

### 6.1 Restauração Completa

**ATENÇÃO:** Este procedimento sobrescreve todos os dados do tenant.

1. **Identificar o backup a restaurar:**
   ```sql
   SELECT id, tenant_id, type, status, created_at 
   FROM backup_history 
   WHERE tenant_id = ? AND status = 'completed'
   ORDER BY created_at DESC;
   ```

2. **Executar restauração:**
   ```typescript
   await backup.restoreBackup(backupId, tenantId, {
     dryRun: false,
     validateOnly: false
   });
   ```

3. **Verificar integridade após restauração:**
   ```typescript
   const result = await backup.testRestoreBackup(tenantId);
   console.log(result.validations);
   ```

### 6.2 Restauração de Tabela Específica

Para restaurar apenas uma tabela específica:

1. Baixe o backup completo
2. Extraia os dados da tabela desejada
3. Importe manualmente via SQL

### 6.3 Restauração Pontual (Point-in-Time)

Usando backups incrementais:

1. Restaure o último backup completo
2. Aplique os backups incrementais em ordem cronológica
3. Pare no ponto desejado

---

## 7. Verificação de Integridade

### Validações Executadas

| Validação | Descrição | Criticidade |
|-----------|-----------|-------------|
| Existência do Arquivo | Verifica se o backup existe no storage | Alta |
| Download | Testa download do arquivo | Alta |
| Descompressão | Valida integridade GZIP | Alta |
| Descriptografia | Testa chave de criptografia | Alta |
| Parsing JSON | Valida estrutura do JSON | Alta |
| Checksum | Compara SHA-256 | Média |
| Schema | Verifica tabelas críticas | Alta |
| Integridade de Dados | Valida campos obrigatórios | Média |

### Executar Verificação Manual

```bash
curl -X POST "https://www.gorgen.com.br/api/cron/integrity-check" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 8. Monitoramento e Alertas

### Endpoints de Monitoramento

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/cron/health` | GET | Status do sistema de backup |
| `/api/cron/backup/status` | GET | Status do último backup |

### Alertas Configurados

- **Falha de Backup:** Notificação imediata ao admin_master
- **Espaço em Disco:** Alerta quando < 20% disponível
- **Falha de Restauração:** Notificação com detalhes do erro

### Verificação Diária Automática

Uma tarefa agendada verifica diariamente às 08:00 (BRT) se o backup das últimas 24 horas foi executado com sucesso.

---

## 9. Recuperação de Desastres

### Cenário 1: Perda Total do Banco de Dados

1. Provisione novo banco de dados
2. Configure variáveis de ambiente
3. Execute migrations: `pnpm db:push`
4. Restaure o último backup completo
5. Verifique integridade

### Cenário 2: Corrupção de Dados

1. Identifique o momento da corrupção
2. Localize o último backup válido anterior
3. Execute restauração pontual
4. Valide dados restaurados

### Cenário 3: Falha do Storage (S3)

1. Verifique backups locais (se existirem)
2. Contate suporte Manus para recuperação
3. Restaure de backup alternativo

### RTO e RPO

| Métrica | Valor | Descrição |
|---------|-------|-----------|
| **RPO** | 24 horas | Perda máxima de dados |
| **RTO** | 4 horas | Tempo máximo de recuperação |

---

## 10. Troubleshooting

### Erro: "Falha na descompressão"

**Causa:** Arquivo corrompido durante download ou armazenamento.

**Solução:**
1. Verifique checksum do arquivo
2. Tente baixar novamente
3. Use backup anterior se persistir

### Erro: "Chave de criptografia inválida"

**Causa:** Variável `ENCRYPTION_MASTER_KEY` incorreta ou ausente.

**Solução:**
1. Verifique configuração de secrets
2. Confirme que a chave é a mesma usada no backup

### Erro: "Tabela crítica ausente"

**Causa:** Backup incompleto ou schema desatualizado.

**Solução:**
1. Execute migrations: `pnpm db:push`
2. Tente restauração novamente
3. Use backup mais recente

### Erro: "Timeout durante backup"

**Causa:** Volume de dados muito grande ou conexão lenta.

**Solução:**
1. Aumente timeout nas configurações
2. Execute em horário de menor uso
3. Considere backup incremental

---

## Apêndice A: Comandos Úteis

```bash
# Verificar status do sistema de backup
curl -s "https://www.gorgen.com.br/api/cron/health" \
  -H "Authorization: Bearer $CRON_SECRET" | jq

# Executar backup manual
curl -X POST "https://www.gorgen.com.br/api/cron/backup/daily" \
  -H "Authorization: Bearer $CRON_SECRET"

# Executar teste de restauração
curl -X POST "https://www.gorgen.com.br/api/cron/restore-test" \
  -H "Authorization: Bearer $CRON_SECRET"

# Gerar relatório de auditoria
curl -X POST "https://www.gorgen.com.br/api/cron/audit-report" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Apêndice B: Estrutura de Diretórios

```
server/
├── backup.ts                 # Core de backup/restore
├── backup-scheduler.ts       # Agendamento automático
├── backup-routes.ts          # Rotas tRPC para admin
├── cron-router.ts            # Endpoints para GitHub Actions
├── backup.test.ts            # Testes unitários
├── backup-crypto.test.ts     # Testes de criptografia
└── _core/
    └── backup-init.ts        # Inicialização do sistema

.github/workflows/
├── backup-daily.yml          # Workflow de backup diário
├── backup-restore-test.yml   # Workflow de teste semanal
└── backup-audit-report.yml   # Workflow de relatório mensal
```

---

## Histórico de Revisões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 26/01/2026 | Equipe GORGEN | Versão inicial |

---

*Este documento é parte da documentação oficial do sistema GORGEN e deve ser mantido atualizado conforme alterações no sistema de backup.*
