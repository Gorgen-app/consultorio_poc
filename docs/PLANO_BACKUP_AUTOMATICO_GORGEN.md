# 📦 PLANO DE IMPLEMENTAÇÃO DE BACKUP AUTOMÁTICO

> **GORGEN - Aplicativo de Gestão em Saúde**  
> Versão 1.0 | Data: 13/01/2026  
> Autor: Manus AI

---

## 1. RESUMO EXECUTIVO

Este documento apresenta o planejamento completo para implementação de um sistema de backup automático para o GORGEN, garantindo a preservação e recuperabilidade de todos os dados do sistema em conformidade com os pilares fundamentais de **Imutabilidade e Preservação Histórica**.

**Objetivo:** Implementar backup automático diário com retenção de 90 dias, garantindo recuperação de dados em caso de falhas, ataques ou erros humanos.

**Prazo estimado:** 5 dias úteis (40 horas)

**Prioridade:** CRÍTICA - Risco atual de perda irreversível de dados

---

## 2. ESCOPO DO BACKUP

### 2.1 Dados a serem protegidos

| Tipo de Dado | Localização | Volume Estimado | Criticidade |
|--------------|-------------|-----------------|-------------|
| Banco de dados MySQL/TiDB | DATABASE_URL | ~500MB (atual) | CRÍTICA |
| Documentos e anexos | S3 Storage | ~2GB (atual) | ALTA |
| Configurações do sistema | Arquivos .env | <1MB | MÉDIA |
| Logs de auditoria | Tabela audit_logs | ~100MB | ALTA |

### 2.2 Dados excluídos do backup

- Cache temporário
- Sessões de usuário
- Arquivos de build (node_modules, dist)
- Logs de desenvolvimento

---

## 3. ESTRATÉGIA DE BACKUP

### 3.1 Tipos de Backup

| Tipo | Frequência | Retenção | Descrição |
|------|------------|----------|-----------|
| **Completo** | Semanal (domingo 03:00) | 12 semanas | Dump completo do banco + todos os arquivos S3 |
| **Incremental** | Diário (03:00) | 30 dias | Apenas alterações desde último backup |
| **Transacional** | Contínuo | 7 dias | Binary logs do MySQL para point-in-time recovery |
| **Offline (HD Externo)** | Mensal (1º domingo) | Permanente | Backup air-gapped em hard drive físico externo |

### 3.2 Política de Retenção

```
Backups diários: 30 dias
Backups semanais: 12 semanas (3 meses)
Backups mensais: 12 meses
Backups anuais: 7 anos (conformidade LGPD/CFM)
Backups offline (HD): Permanente (armazenamento físico seguro)
```

### 3.3 Destinos de Armazenamento

| Destino | Propósito | Redundância |
|---------|-----------|-------------|
| S3 Bucket Principal | Backup primário | Região principal |
| S3 Bucket Secundário | Disaster Recovery | Região alternativa |
| **Hard Drive Externo** | Backup air-gapped (anti-holocausto zumbi) | Físico, offline |
| Download Manual | Backup sob demanda | Conforme necessidade |

### 3.4 Backup Offline em Hard Drive Externo

> **Justificativa:** Proteção contra cenários catastróficos onde toda a infraestrutura cloud pode estar indisponível (ataques ransomware em larga escala, falhas de datacenter, desastres naturais, ou... holocaustos zumbis).

**Especificações do HD Externo:**
- Capacidade mínima recomendada: 1TB
- Interface: USB 3.0 ou superior
- Criptografia: BitLocker ou VeraCrypt (AES-256)
- Armazenamento: Cofre ou local seguro, fora do consultório

**Procedimento Mensal:**
1. Sistema gera notificação no 1º domingo do mês
2. Administrador conecta HD externo ao computador
3. Sistema executa backup completo criptografado
4. Verificação de integridade (checksum)
5. HD é desconectado e armazenado em local seguro
6. Registro no log de auditoria

**Estrutura de Pastas no HD:**
```
GORGEN_BACKUP/
├── 2026-01/
│   ├── gorgen_full_20260105.sql.gz.enc
│   ├── gorgen_files_20260105.tar.gz.enc
│   ├── checksum.sha256
│   └── manifest.json
├── 2026-02/
│   └── ...
└── RESTORE_INSTRUCTIONS.md
```

---

## 4. ARQUITETURA TÉCNICA

### 4.1 Componentes do Sistema de Backup

```
┌─────────────────────────────────────────────────────────────┐
│                    GORGEN BACKUP SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Scheduler  │───▶│ Backup Job   │───▶│  S3 Storage  │  │
│  │   (Cron)     │    │   Manager    │    │   (Primary)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         │                   ▼                    ▼          │
│         │            ┌──────────────┐    ┌──────────────┐  │
│         │            │  Validator   │    │  S3 Storage  │  │
│         │            │  (Checksum)  │    │  (Secondary) │  │
│         │            └──────────────┘    └──────────────┘  │
│         │                   │                              │
│         ▼                   ▼                              │
│  ┌──────────────┐    ┌──────────────┐                     │
│  │  Notifier    │◀───│   Logger     │                     │
│  │  (Alerts)    │    │  (Audit)     │                     │
│  └──────────────┘    └──────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Fluxo de Backup

1. **Trigger:** Cron job dispara às 03:00 (horário de menor uso)
2. **Lock:** Sistema entra em modo de backup (read-only opcional)
3. **Dump:** mysqldump exporta banco de dados com compressão
4. **Upload:** Arquivo enviado para S3 com versionamento
5. **Validate:** Checksum MD5/SHA256 verificado
6. **Replicate:** Cópia enviada para bucket secundário
7. **Notify:** Notificação de sucesso/falha enviada
8. **Cleanup:** Backups antigos removidos conforme política

---

## 5. IMPLEMENTAÇÃO TÉCNICA

### 5.1 Estrutura de Arquivos

```
server/
├── backup/
│   ├── backupManager.ts      # Gerenciador principal
│   ├── databaseBackup.ts     # Backup do banco de dados
│   ├── storageBackup.ts      # Backup de arquivos S3
│   ├── backupValidator.ts    # Validação de integridade
│   ├── backupNotifier.ts     # Notificações
│   ├── backupScheduler.ts    # Agendamento
│   └── backupRestore.ts      # Restauração
├── routers.ts                # + rotas de backup (admin)
```

### 5.2 Schema do Banco (Nova Tabela)

```sql
CREATE TABLE backup_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  backup_type ENUM('full', 'incremental', 'transactional') NOT NULL,
  status ENUM('running', 'success', 'failed', 'validating') NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT NULL,
  checksum_sha256 VARCHAR(64) NULL,
  error_message TEXT NULL,
  created_by INT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_backup_date (started_at),
  INDEX idx_backup_status (status)
);
```

### 5.3 Endpoints da API

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/api/backup/trigger` | Dispara backup manual | admin |
| GET | `/api/backup/history` | Lista histórico de backups | admin |
| GET | `/api/backup/status` | Status do último backup | admin |
| POST | `/api/backup/restore/:id` | Restaura backup específico | master |
| GET | `/api/backup/download/:id` | Download de backup | master |

---

## 6. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Infraestrutura (Dia 1)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Criar estrutura de pastas e arquivos | 2h | Dev |
| Configurar bucket S3 secundário | 1h | Dev |
| Criar tabela backup_history | 1h | Dev |
| Configurar variáveis de ambiente | 1h | Dev |
| **Subtotal** | **5h** | |

### Fase 2: Backup do Banco de Dados (Dia 2)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Implementar databaseBackup.ts | 4h | Dev |
| Implementar compressão gzip | 1h | Dev |
| Implementar upload para S3 | 2h | Dev |
| Testes unitários | 2h | Dev |
| **Subtotal** | **9h** | |

### Fase 3: Backup de Arquivos (Dia 3)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Implementar storageBackup.ts | 3h | Dev |
| Sincronização incremental S3 | 2h | Dev |
| Implementar backupValidator.ts | 2h | Dev |
| Testes unitários | 2h | Dev |
| **Subtotal** | **9h** | |

### Fase 4: Automação e Notificações (Dia 4)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Implementar backupScheduler.ts | 2h | Dev |
| Implementar backupNotifier.ts | 2h | Dev |
| Configurar cron jobs | 1h | Dev |
| Implementar rotas da API | 2h | Dev |
| Testes de integração | 2h | Dev |
| **Subtotal** | **9h** | |

### Fase 5: Restauração e Documentação (Dia 5)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Implementar backupRestore.ts | 3h | Dev |
| Testes de restauração completa | 3h | Dev |
| Documentação de procedimentos | 2h | Dev |
| Revisão final e deploy | 2h | Dev |
| **Subtotal** | **10h** | |

### Fase 6: Backup Offline em HD Externo (Dia 6)

| Tarefa | Tempo | Responsável |
|--------|-------|-------------|
| Implementar offlineBackup.ts | 3h | Dev |
| Interface de notificação mensal | 2h | Dev |
| Criptografia AES-256 do backup | 2h | Dev |
| Página de download/gravação em HD | 2h | Dev |
| Documentação de procedimento offline | 1h | Dev |
| **Subtotal** | **10h** | |

### Resumo do Cronograma

| Fase | Dias | Horas | Status |
|------|------|-------|--------|
| Fase 1: Infraestrutura | 1 | 5h | ⬜ Pendente |
| Fase 2: Backup BD | 2 | 9h | ⬜ Pendente |
| Fase 3: Backup Arquivos | 3 | 9h | ⬜ Pendente |
| Fase 4: Automação | 4 | 9h | ⬜ Pendente |
| Fase 5: Restauração | 5 | 10h | ⬜ Pendente |
| Fase 6: Backup Offline (HD) | 6 | 10h | ⬜ Pendente |
| **TOTAL** | **6 dias** | **52h** | |

---

## 7. TESTES E VALIDAÇÃO

### 7.1 Testes Obrigatórios

| Teste | Critério de Sucesso | Frequência |
|-------|---------------------|------------|
| Backup completo executa sem erros | Status = success | Diário |
| Checksum válido após upload | SHA256 match | Cada backup |
| Restauração em ambiente de teste | Dados íntegros | Semanal |
| Notificação de falha enviada | Email recebido em <5min | Simulado mensal |
| Tempo de backup < 30 minutos | Duration < 1800s | Cada backup |
| Replicação para bucket secundário | Arquivo existe | Cada backup |

### 7.2 Simulação de Disaster Recovery

**Frequência:** Trimestral

**Procedimento:**
1. Criar ambiente de teste isolado
2. Restaurar último backup completo
3. Validar integridade de todos os dados
4. Medir tempo total de recuperação (RTO)
5. Documentar resultados

**Meta:** RTO < 4 horas, RPO < 24 horas

---

## 8. MONITORAMENTO E ALERTAS

### 8.1 Métricas Monitoradas

| Métrica | Threshold | Ação |
|---------|-----------|------|
| Backup não executado em 24h | > 24h | Alerta CRÍTICO |
| Tamanho do backup anormal | ±30% da média | Alerta WARNING |
| Tempo de backup excessivo | > 30 min | Alerta WARNING |
| Falha de upload S3 | Qualquer | Alerta CRÍTICO |
| Espaço em disco < 20% | < 20% | Alerta WARNING |
| Checksum inválido | Qualquer | Alerta CRÍTICO |

### 8.2 Canais de Notificação

| Canal | Tipo de Alerta | Destinatário |
|-------|----------------|--------------|
| Email | Todos | Dr. André Gorgen |
| Notificação in-app | Críticos | Administradores |
| Log de auditoria | Todos | Sistema |

---

## 9. SEGURANÇA

### 9.1 Criptografia

| Componente | Método | Chave |
|------------|--------|-------|
| Backup em trânsito | TLS 1.3 | Certificado SSL |
| Backup em repouso | AES-256 | KMS gerenciado |
| Credenciais | Variáveis de ambiente | Secrets Manager |

### 9.2 Controle de Acesso

| Ação | Permissão Mínima |
|------|------------------|
| Visualizar histórico | admin |
| Disparar backup manual | admin |
| Download de backup | master |
| Restaurar backup | master |
| Excluir backup | master (com confirmação) |

---

## 10. CUSTOS ESTIMADOS

### 10.1 Armazenamento S3

| Item | Volume | Custo Mensal |
|------|--------|--------------|
| Backups diários (30 dias) | ~15GB | ~$0.35 |
| Backups semanais (12 semanas) | ~6GB | ~$0.14 |
| Backups mensais (12 meses) | ~6GB | ~$0.14 |
| Replicação (região secundária) | ~27GB | ~$0.63 |
| **Total estimado** | **~54GB** | **~$1.26/mês** |

### 10.2 Transferência de Dados

| Item | Volume | Custo Mensal |
|------|--------|--------------|
| Upload para S3 | ~15GB | Gratuito |
| Download (restauração) | ~500MB | ~$0.05 |
| Replicação entre regiões | ~15GB | ~$0.30 |
| **Total estimado** | | **~$0.35/mês** |

**Custo total mensal estimado: ~$1.61**

---

## 11. PROCEDIMENTO DE RESTAURAÇÃO

### 11.1 Restauração Completa (Disaster Recovery)

```bash
# 1. Identificar backup mais recente
GET /api/backup/history?status=success&limit=1

# 2. Download do backup
GET /api/backup/download/{backup_id}

# 3. Verificar integridade
sha256sum backup_file.sql.gz

# 4. Restaurar banco de dados
gunzip -c backup_file.sql.gz | mysql -u user -p database

# 5. Sincronizar arquivos S3
aws s3 sync s3://backup-bucket/files s3://production-bucket/files

# 6. Validar dados
SELECT COUNT(*) FROM pacientes;
SELECT COUNT(*) FROM atendimentos;
```

### 11.2 Restauração Pontual (Point-in-Time)

```bash
# 1. Restaurar último backup completo anterior ao ponto desejado
# 2. Aplicar binary logs até o timestamp desejado
mysqlbinlog --stop-datetime="2026-01-13 10:00:00" binlog.000001 | mysql -u user -p
```

---

## 12. CHECKLIST DE IMPLEMENTAÇÃO

### Infraestrutura
- [ ] Criar bucket S3 secundário para disaster recovery
- [ ] Configurar políticas de lifecycle no S3
- [ ] Criar tabela backup_history no banco
- [ ] Configurar variáveis de ambiente (BACKUP_S3_BUCKET, etc.)

### Desenvolvimento
- [ ] Implementar backupManager.ts
- [ ] Implementar databaseBackup.ts
- [ ] Implementar storageBackup.ts
- [ ] Implementar backupValidator.ts
- [ ] Implementar backupNotifier.ts
- [ ] Implementar backupScheduler.ts
- [ ] Implementar backupRestore.ts
- [ ] Adicionar rotas de backup no routers.ts

### Testes
- [ ] Testes unitários para cada módulo
- [ ] Teste de backup completo
- [ ] Teste de restauração em ambiente isolado
- [ ] Teste de notificação de falha
- [ ] Teste de validação de checksum

### Documentação
- [ ] Documentar procedimento de restauração
- [ ] Criar runbook de emergência
- [ ] Treinar equipe no processo de restore

### Backup Offline (HD Externo)
- [ ] Implementar offlineBackup.ts
- [ ] Interface de notificação mensal (1º domingo)
- [ ] Criptografia AES-256 para arquivos de backup
- [ ] Página de download/gravação em HD
- [ ] Gerar arquivo RESTORE_INSTRUCTIONS.md no backup
- [ ] Documentar procedimento de armazenamento seguro

### Monitoramento
- [ ] Configurar alertas de falha
- [ ] Dashboard de status de backups
- [ ] Relatório semanal de backups
- [ ] Lembrete mensal de backup offline

---

## 13. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Falha no upload S3 | Baixa | Alto | Retry automático + notificação |
| Backup corrompido | Baixa | Crítico | Validação de checksum |
| Credenciais expostas | Baixa | Crítico | Secrets Manager + rotação |
| Espaço insuficiente | Média | Médio | Monitoramento + alertas |
| Tempo de restore longo | Média | Alto | Testes regulares + otimização |

---

## 14. APROVAÇÕES

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Solicitante | Dr. André Gorgen | ___/___/2026 | __________ |
| Desenvolvedor | Manus AI | 13/01/2026 | ✓ |
| Revisor Técnico | | ___/___/2026 | __________ |

---

## 15. REFERÊNCIAS

1. AWS S3 Best Practices for Backup - https://aws.amazon.com/s3/
2. MySQL Backup and Recovery - https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html
3. LGPD - Lei Geral de Proteção de Dados - http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
4. CFM - Resolução sobre Prontuário Eletrônico - https://portal.cfm.org.br/

---

*Documento gerado automaticamente pelo sistema GORGEN*  
*Última atualização: 13/01/2026*
