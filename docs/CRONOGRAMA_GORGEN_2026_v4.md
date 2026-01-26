# Cronograma de Implementação GORGEN 2026 (v4.0)

> **Documento de Planejamento** | Versão 4.0 | 25 de Janeiro de 2026
> 
> **Autor:** Manus AI

---

## Sumário Executivo

Este cronograma atualizado reflete o status real do desenvolvimento do Gorgen após avaliação completa com metodologia de cadeia de verificação de fatos realizada em 25/01/2026. O sistema encontra-se em estágio de **Beta Avançado (70-75%)** com scorecard de segurança de **6.36/10**.

---

## Status Atual (25/01/2026)

| Métrica | Valor |
|---------|-------|
| Versão | 3.9.27 |
| Linhas de Código | 74.762 |
| Arquivos TS/TSX | 244 |
| Tabelas no Schema | 43 |
| Testes Automatizados | 489 (92% passando) |
| Páginas Frontend | 29 |
| Componentes | 17 |
| Scorecard Segurança | 6.36/10 |

---

## Fase 1: Correções Críticas (Semanas 5-6)

**Período:** 27/01/2026 - 07/02/2026

### Semana 5 (27-31/01): Backup e Testes

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Verificar configuração de GitHub Secrets (GORGEN_API_URL, CRON_SECRET) | 1h | 27/01 | DevOps |
| Executar workflow de backup manualmente para validar | 1h | 27/01 | DevOps |
| Verificar histórico de execuções no GitHub Actions | 1h | 27/01 | DevOps |
| Corrigir testes de autenticação (localAuth → auth) | 4h | 28/01 | Backend |
| Executar suite completa de testes e documentar resultados | 2h | 28/01 | QA |
| Desabilitar ou isolar módulo de extração de exames | 2h | 29/01 | Backend |
| Testar restauração de backup em ambiente de staging | 4h | 30/01 | DevOps |
| Documentar processo de backup/restore | 2h | 31/01 | Docs |

**Entregáveis:**
- Backup automatizado funcionando e validado
- Testes de autenticação corrigidos (100% passando)
- Módulo de extração isolado
- Documentação de backup/restore

### Semana 6 (03-07/02): Criptografia

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Criar migração de schema para campos criptografados | 4h | 03/02 | Backend |
| Testar migração em ambiente de desenvolvimento | 2h | 03/02 | Backend |
| Executar migração em staging | 2h | 04/02 | DevOps |
| Executar script de criptografia de dados (dry-run) | 2h | 04/02 | Backend |
| Executar migração de criptografia em staging | 4h | 05/02 | Backend |
| Validar integridade dos dados migrados | 4h | 05/02 | QA |
| Executar migração em produção | 4h | 06/02 | DevOps |
| Validar integridade em produção | 4h | 07/02 | QA |

**Entregáveis:**
- Campos PII criptografados em repouso
- Validação de integridade completa
- Documentação de processo de criptografia

---

## Fase 2: Segurança Avançada (Semanas 7-8)

**Período:** 10/02/2026 - 21/02/2026

### Semana 7 (10-14/02): MFA e Preparação Pentest

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Implementar MFA com TOTP para admin_master | 8h | 10-11/02 | Backend |
| Integrar biblioteca de geração de QR Code | 2h | 11/02 | Backend |
| Criar interface de configuração de MFA | 4h | 12/02 | Frontend |
| Testar fluxo completo de MFA | 4h | 13/02 | QA |
| Selecionar empresa de pentest | 2h | 13/02 | Gestão |
| Preparar ambiente isolado para pentest | 4h | 14/02 | DevOps |

**Entregáveis:**
- MFA funcionando para admin_master
- Ambiente de pentest preparado
- Contrato com empresa de pentest

### Semana 8 (17-21/02): Pentest e Correções

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Kick-off com equipe de pentest | 2h | 17/02 | Gestão |
| Execução do pentest (OWASP Top 10) | - | 17-19/02 | Externo |
| Receber relatório preliminar | - | 19/02 | Gestão |
| Corrigir vulnerabilidades críticas | 8h | 19-20/02 | Backend |
| Corrigir vulnerabilidades altas | 8h | 20/02 | Backend |
| Revalidar correções com equipe de pentest | 4h | 21/02 | Externo |
| Receber relatório final | - | 21/02 | Gestão |

**Entregáveis:**
- Relatório de pentest
- Vulnerabilidades críticas e altas corrigidas
- Scorecard ≥ 8.0/10

---

## Fase 3: Conformidade e Beta (Semanas 9-10)

**Período:** 24/02/2026 - 07/03/2026

### Semana 9 (24-28/02): Documentação e Conformidade

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Redigir Política de Privacidade | 4h | 24/02 | Jurídico |
| Redigir Termos de Uso | 4h | 24/02 | Jurídico |
| Criar Termo de Consentimento LGPD | 2h | 25/02 | Jurídico |
| Implementar banner de cookies | 2h | 25/02 | Frontend |
| Criar manual do usuário (Médico) | 8h | 26-27/02 | Docs |
| Criar manual do usuário (Secretária) | 4h | 27/02 | Docs |
| Criar manual do usuário (Paciente) | 4h | 28/02 | Docs |

**Entregáveis:**
- Documentos legais publicados
- Manuais do usuário (3 versões)
- Banner de cookies implementado

### Semana 10 (03-07/03): Lançamento Beta Fechado

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Configurar monitoramento de produção | 4h | 03/03 | DevOps |
| Configurar alertas de segurança | 2h | 03/03 | DevOps |
| Criar runbook de incidentes | 4h | 04/03 | DevOps |
| Treinar equipe de suporte | 4h | 04/03 | Gestão |
| Importar dados históricos (21.000+ pacientes) | 8h | 05/03 | Backend |
| Validar integridade da importação | 4h | 05/03 | QA |
| Reunião de aprovação para lançamento | 2h | 06/03 | Gestão |
| Deploy em produção | 4h | 06/03 | DevOps |
| **Lançamento Beta Fechado** | - | **07/03** | - |

**Entregáveis:**
- Sistema em produção com dados reais
- Monitoramento e alertas configurados
- Beta fechado lançado

---

## Fase 4: Estabilização e Lançamento Público (Semanas 11-14)

**Período:** 10/03/2026 - 04/04/2026

### Semanas 11-12 (10-21/03): Estabilização

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Monitorar métricas de produção | Contínuo | 10-21/03 | DevOps |
| Coletar feedback de usuários beta | Contínuo | 10-21/03 | Produto |
| Corrigir bugs reportados | Variável | 10-21/03 | Backend |
| Otimizar performance | 8h | 17-18/03 | Backend |
| Realizar teste de carga | 4h | 19/03 | QA |
| Ajustar infraestrutura conforme necessário | Variável | 20-21/03 | DevOps |

### Semanas 13-14 (24/03-04/04): Lançamento Público

| Tarefa | Esforço | Prazo | Responsável |
|--------|---------|-------|-------------|
| Revisão final de segurança | 4h | 24/03 | Segurança |
| Atualizar documentação | 4h | 24/03 | Docs |
| Preparar materiais de marketing | 4h | 25/03 | Marketing |
| Configurar onboarding para novos usuários | 4h | 25/03 | Frontend |
| Reunião final de aprovação | 2h | 26/03 | Gestão |
| Remover restrições de beta | 2h | 27/03 | DevOps |
| **Lançamento Público** | - | **04/04/2026** | - |

---

## Orçamento Estimado

| Item | Tipo | Custo |
|------|------|-------|
| Pentest profissional | Único | R$ 15.000 - R$ 25.000 |
| Assessoria jurídica LGPD | Único | R$ 3.000 - R$ 5.000 |
| Infraestrutura adicional (staging) | Mensal | R$ 500/mês |
| Backup redundante (S3) | Mensal | R$ 300/mês |
| Monitoramento (Datadog/similar) | Mensal | R$ 200/mês |
| **Total único** | - | **R$ 18.000 - R$ 30.000** |
| **Total recorrente** | - | **R$ 1.000/mês** |

---

## Marcos Principais

| Marco | Data | Status |
|-------|------|--------|
| Backup automatizado validado | 31/01/2026 | ⬜ |
| Criptografia em repouso completa | 07/02/2026 | ⬜ |
| MFA implementado | 14/02/2026 | ⬜ |
| Pentest concluído | 21/02/2026 | ⬜ |
| Documentação completa | 28/02/2026 | ⬜ |
| **Lançamento Beta Fechado** | **07/03/2026** | ⬜ |
| Dados históricos importados | 07/03/2026 | ⬜ |
| Teste de carga realizado | 19/03/2026 | ⬜ |
| **Lançamento Público** | **04/04/2026** | ⬜ |

---

## Evolução do Scorecard

| Semana | Ação | Score Anterior | Score Novo |
|--------|------|----------------|------------|
| 5 (atual) | Baseline | - | 6.36 |
| 5 | Backup validado + Testes corrigidos | 6.36 | 7.00 |
| 6 | Criptografia em repouso | 7.00 | 7.50 |
| 7 | MFA implementado | 7.50 | 8.00 |
| 8 | Pentest + Correções | 8.00 | 8.50+ |
| 9-10 | Conformidade + Lançamento | 8.50 | 9.0+ |

---

## Riscos e Contingências

| Risco | Probabilidade | Impacto | Contingência |
|-------|---------------|---------|--------------|
| Vulnerabilidade crítica no pentest | Alta | Alto | Semana extra para correções |
| Atraso na migração de criptografia | Média | Alto | Priorizar campos mais sensíveis |
| Problemas na importação de dados | Média | Médio | Importação em lotes menores |
| Custo de pentest acima do orçamento | Média | Médio | Negociar escopo ou buscar alternativas |
| Falhas de integração com GitHub Actions | Baixa | Alto | Fallback para scheduler interno |

---

## Checklist de Lançamento

### Segurança (Obrigatório)
- [ ] Backup automatizado funcionando e testado
- [ ] Teste de restauração validado
- [ ] Dados sensíveis criptografados em repouso
- [ ] MFA implementado para admin_master
- [ ] Pentest concluído sem vulnerabilidades críticas
- [ ] Scorecard ≥ 8.0/10

### Conformidade (Obrigatório)
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Termo de consentimento LGPD
- [ ] Banner de cookies implementado

### Operacional (Obrigatório)
- [ ] Monitoramento configurado
- [ ] Alertas de segurança ativos
- [ ] Runbook de incidentes documentado
- [ ] Equipe de suporte treinada
- [ ] Dados históricos importados

### Documentação (Recomendado)
- [ ] Manual do usuário (Médico)
- [ ] Manual do usuário (Secretária)
- [ ] Manual do usuário (Paciente)
- [ ] Documentação de API

---

**Documento preparado por:** Manus AI  
**Data:** 25/01/2026  
**Próxima revisão:** 07/02/2026 (após Fase 1)
