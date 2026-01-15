# 📅 CRONOGRAMA DE SEGURANÇA - GORGEN 2026

> **Documento de Cronograma** | Versão 1.0 | Data: 11/01/2026

Este cronograma detalha as atividades necessárias para tornar o Gorgen seguro para publicação pública, com base na avaliação de segurança realizada em 11/01/2026.

---

## 🎯 OBJETIVO

Elevar o Scorecard de Segurança de **5.55/10** para **8.0/10** em 6 semanas, eliminando todos os bloqueadores críticos para publicação pública.

---

## 📊 VISÃO GERAL

| Semana | Período | Foco Principal | Entregáveis |
|--------|---------|----------------|-------------|
| 1 | 13-17/01 | Rate Limiting | Proteção contra ataques |
| 2 | 20-24/01 | Criptografia | Dados sensíveis protegidos |
| 3 | 27-31/01 | Backup | Backup automatizado |
| 4 | 03-07/02 | DR + MFA | Plano de recuperação |
| 5 | 10-14/02 | Pentest | Teste de penetração |
| 6 | 17-21/02 | Correções | Vulnerabilidades corrigidas |

**Data estimada de publicação:** 24/02/2026

---

## 📋 SEMANA 1: RATE LIMITING E HEADERS (13-17/01/2026)

### Objetivo
Proteger o sistema contra ataques de força bruta e injeção de scripts.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 1.1 | Implementar rate limiting por IP (100 req/min) | Dev | 14/01 | ⬜ |
| 1.2 | Implementar rate limiting por usuário (200 req/min) | Dev | 14/01 | ⬜ |
| 1.3 | Bloquear IP após 5 tentativas de login falhas | Dev | 15/01 | ⬜ |
| 1.4 | Configurar Content Security Policy (CSP) | Dev | 15/01 | ⬜ |
| 1.5 | Adicionar X-Frame-Options: DENY | Dev | 16/01 | ⬜ |
| 1.6 | Adicionar X-Content-Type-Options: nosniff | Dev | 16/01 | ⬜ |
| 1.7 | Adicionar Strict-Transport-Security | Dev | 16/01 | ⬜ |
| 1.8 | Testes de rate limiting | Dev | 17/01 | ⬜ |
| 1.9 | Documentar configurações | Dev | 17/01 | ⬜ |

### Critérios de Aceite
- [ ] Rate limiting funcionando em produção
- [ ] Testes automatizados passando
- [ ] Headers de segurança configurados
- [ ] Documentação atualizada

### Impacto no Scorecard
- Segurança Web: 5/10 → 7/10 (+0.2 no total)

---

## 📋 SEMANA 2: CRIPTOGRAFIA EM REPOUSO (20-24/01/2026)

### Objetivo
Proteger dados sensíveis (CPF, dados médicos) com criptografia AES-256.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 2.1 | Definir campos a serem criptografados | Dr. André | 20/01 | ⬜ |
| 2.2 | Implementar módulo de criptografia AES-256 | Dev | 21/01 | ⬜ |
| 2.3 | Criar sistema de gerenciamento de chaves | Dev | 21/01 | ⬜ |
| 2.4 | Implementar rotação de chaves | Dev | 22/01 | ⬜ |
| 2.5 | Criar script de migração de dados existentes | Dev | 22/01 | ⬜ |
| 2.6 | Executar migração em ambiente de teste | Dev | 23/01 | ⬜ |
| 2.7 | Executar migração em produção | Dev | 23/01 | ⬜ |
| 2.8 | Validar integridade dos dados | Dev | 24/01 | ⬜ |
| 2.9 | Documentar processo de criptografia | Dev | 24/01 | ⬜ |

### Campos a Criptografar
- `pacientes.cpf`
- `pacientes.rg`
- `pacientes.telefone`
- `pacientes.email`
- `pacientes.endereco`
- `evolucoes.subjetivo` (queixa do paciente)
- `evolucoes.objetivo` (exame físico)
- `evolucoes.avaliacao` (diagnóstico)
- `evolucoes.plano` (conduta)

### Critérios de Aceite
- [ ] Todos os campos sensíveis criptografados
- [ ] Chaves armazenadas de forma segura
- [ ] Migração concluída sem perda de dados
- [ ] Performance aceitável (< 100ms overhead)

### Impacto no Scorecard
- Criptografia: 3/10 → 8/10 (+0.75 no total)

---

## 📋 SEMANA 3: BACKUP AUTOMATIZADO (27-31/01/2026)

### Objetivo
Implementar backup automatizado com redundância geográfica.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 3.1 | Pesquisar soluções de backup (AWS, GCP, Azure) | Dev | 27/01 | ⬜ |
| 3.2 | Configurar backup diário do banco (TiDB) | Dev | 28/01 | ⬜ |
| 3.3 | Configurar backup incremental do S3 | Dev | 28/01 | ⬜ |
| 3.4 | Configurar armazenamento em região secundária | Dev | 29/01 | ⬜ |
| 3.5 | Implementar retenção de 30 dias | Dev | 29/01 | ⬜ |
| 3.6 | Configurar alertas de falha de backup | Dev | 30/01 | ⬜ |
| 3.7 | Documentar processo de backup | Dev | 30/01 | ⬜ |
| 3.8 | Realizar primeiro backup completo | Dev | 31/01 | ⬜ |
| 3.9 | Validar integridade do backup | Dev | 31/01 | ⬜ |

### Configuração de Backup

| Tipo | Frequência | Retenção | Região |
|------|------------|----------|--------|
| Full (banco) | Diário 03:00 | 30 dias | São Paulo |
| Full (banco) | Semanal | 90 dias | Virginia |
| Incremental (S3) | A cada 6h | 30 dias | São Paulo |
| Full (S3) | Semanal | 90 dias | Virginia |

### Critérios de Aceite
- [ ] Backup diário funcionando
- [ ] Redundância geográfica configurada
- [ ] Alertas de falha configurados
- [ ] Documentação completa

### Impacto no Scorecard
- Backup/DR: 2/10 → 6/10 (+0.8 no total)

---

## 📋 SEMANA 4: DR E MFA (03-07/02/2026)

### Objetivo
Criar plano de recuperação de desastres e implementar autenticação de dois fatores.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 4.1 | Documentar plano de DR | Dev | 03/02 | ⬜ |
| 4.2 | Definir RTO (4h) e RPO (24h) | Dr. André | 03/02 | ⬜ |
| 4.3 | Criar runbook de recuperação | Dev | 04/02 | ⬜ |
| 4.4 | Realizar teste de recuperação | Dev | 04/02 | ⬜ |
| 4.5 | Implementar MFA com TOTP | Dev | 05/02 | ⬜ |
| 4.6 | Integrar Google Authenticator | Dev | 05/02 | ⬜ |
| 4.7 | Tornar MFA obrigatório para admin_master | Dev | 06/02 | ⬜ |
| 4.8 | Criar alertas de acessos suspeitos | Dev | 06/02 | ⬜ |
| 4.9 | Documentar processo de MFA | Dev | 07/02 | ⬜ |

### Plano de DR - Resumo

| Cenário | Ação | Tempo Estimado |
|---------|------|----------------|
| Banco indisponível | Restaurar backup mais recente | 2-4h |
| S3 indisponível | Failover para região secundária | 1h |
| Aplicação corrompida | Rollback para checkpoint anterior | 30min |
| Ataque cibernético | Isolar, investigar, restaurar | 4-8h |

### Critérios de Aceite
- [ ] Plano de DR documentado e aprovado
- [ ] Teste de recuperação bem-sucedido
- [ ] MFA funcionando para todos os perfis
- [ ] MFA obrigatório para admin_master

### Impacto no Scorecard
- Backup/DR: 6/10 → 8/10 (+0.4 no total)
- Controle de Acesso: 8/10 → 9/10 (+0.15 no total)

---

## 📋 SEMANA 5: PENTEST (10-14/02/2026)

### Objetivo
Realizar teste de penetração profissional para identificar vulnerabilidades.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 5.1 | Selecionar empresa de pentest | Dr. André | 10/02 | ⬜ |
| 5.2 | Assinar contrato e NDA | Dr. André | 10/02 | ⬜ |
| 5.3 | Preparar ambiente de teste | Dev | 11/02 | ⬜ |
| 5.4 | Kick-off com equipe de pentest | Todos | 11/02 | ⬜ |
| 5.5 | Execução do pentest | Pentest | 12-13/02 | ⬜ |
| 5.6 | Receber relatório preliminar | Pentest | 13/02 | ⬜ |
| 5.7 | Reunião de apresentação de resultados | Todos | 14/02 | ⬜ |
| 5.8 | Receber relatório final | Pentest | 14/02 | ⬜ |
| 5.9 | Priorizar correções | Dev | 14/02 | ⬜ |

### Escopo do Pentest

| Área | Incluído | Observação |
|------|----------|------------|
| Aplicação web | ✅ | OWASP Top 10 |
| API tRPC | ✅ | Autenticação, autorização |
| Banco de dados | ✅ | SQL injection |
| Infraestrutura | ⚠️ | Limitado (Manus) |
| Engenharia social | ❌ | Fora do escopo |

### Critérios de Aceite
- [ ] Pentest concluído
- [ ] Relatório final recebido
- [ ] Vulnerabilidades classificadas por severidade
- [ ] Plano de correção definido

---

## 📋 SEMANA 6: CORREÇÕES E VALIDAÇÃO (17-21/02/2026)

### Objetivo
Corrigir vulnerabilidades encontradas no pentest e validar segurança.

### Tarefas

| # | Tarefa | Responsável | Prazo | Status |
|---|--------|-------------|-------|--------|
| 6.1 | Corrigir vulnerabilidades críticas | Dev | 17-18/02 | ⬜ |
| 6.2 | Corrigir vulnerabilidades altas | Dev | 18-19/02 | ⬜ |
| 6.3 | Corrigir vulnerabilidades médias | Dev | 19-20/02 | ⬜ |
| 6.4 | Revalidar correções com pentest | Pentest | 20/02 | ⬜ |
| 6.5 | Atualizar documentação de segurança | Dev | 20/02 | ⬜ |
| 6.6 | Calcular novo Scorecard | Dev | 21/02 | ⬜ |
| 6.7 | Reunião de aprovação para publicação | Todos | 21/02 | ⬜ |
| 6.8 | Preparar ambiente de produção | Dev | 21/02 | ⬜ |
| 6.9 | Documentar lições aprendidas | Dev | 21/02 | ⬜ |

### Critérios de Aceite
- [ ] Zero vulnerabilidades críticas
- [ ] Zero vulnerabilidades altas
- [ ] Scorecard ≥ 8.0/10
- [ ] Aprovação formal para publicação

---

## 📊 EVOLUÇÃO DO SCORECARD

| Semana | Ação | Score Anterior | Score Novo |
|--------|------|----------------|------------|
| 0 | Baseline | - | 5.55 |
| 1 | Rate Limiting + Headers | 5.55 | 5.75 |
| 2 | Criptografia | 5.75 | 6.50 |
| 3 | Backup | 6.50 | 7.30 |
| 4 | DR + MFA | 7.30 | 7.85 |
| 5-6 | Pentest + Correções | 7.85 | 8.50+ |

---

## 🚨 RISCOS E CONTINGÊNCIAS

| Risco | Probabilidade | Impacto | Contingência |
|-------|---------------|---------|--------------|
| Atraso no pentest | Média | Alto | Ter empresa backup |
| Vulnerabilidade crítica no pentest | Alta | Alto | Semana extra para correções |
| Migração de criptografia falha | Baixa | Crítico | Backup antes da migração |
| Custo acima do orçamento | Média | Médio | Buffer de 20% |

---

## 💰 ORÇAMENTO DETALHADO

| Item | Semana | Custo |
|------|--------|-------|
| Rate limiting (Redis) | 1 | R$ 200/mês |
| Backup redundante | 3 | R$ 500/mês |
| Pentest profissional | 5 | R$ 20.000 |
| Correções emergenciais | 6 | R$ 5.000 |
| **Total único** | - | **R$ 25.000** |
| **Total recorrente** | - | **R$ 700/mês** |

---

## ✅ CHECKLIST DE PUBLICAÇÃO

Antes de publicar, todos os itens devem estar marcados:

### Segurança
- [ ] Rate limiting implementado
- [ ] Headers de segurança configurados
- [ ] Dados sensíveis criptografados
- [ ] Backup automatizado funcionando
- [ ] Plano de DR documentado e testado
- [ ] MFA implementado
- [ ] Pentest concluído sem vulnerabilidades críticas
- [ ] Scorecard ≥ 8.0/10

### Conformidade
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Termo de consentimento LGPD
- [ ] DPO designado (ou justificativa)

### Operacional
- [ ] Monitoramento configurado
- [ ] Alertas de segurança ativos
- [ ] Runbook de incidentes documentado
- [ ] Equipe de suporte treinada

---

**Documento preparado por:** Manus AI  
**Data:** 11/01/2026  
**Próxima revisão:** 17/01/2026 (início Semana 1)
