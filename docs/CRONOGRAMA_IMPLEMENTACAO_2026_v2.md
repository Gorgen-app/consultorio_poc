# CRONOGRAMA DE IMPLEMENTAÇÃO - GORGEN 2026 (Revisão 2)

**Atualizado em:** 19 de Janeiro de 2026  
**Versão Base:** 3.9.8  
**Autor:** Manus AI

---

## Visão Geral do Timeline

```
Janeiro 2026     Fevereiro 2026    Março 2026       Abril 2026       Maio 2026        Junho 2026
|----------------|-----------------|-----------------|-----------------|-----------------|
   FASE 1            FASE 1             FASE 2           FASE 2           FASE 3          LANÇAMENTO
   Segurança         Segurança          Funcionalidades  Funcionalidades  Conformidade    Produção
   Crítica           Crítica            Clínicas         Clínicas
```

---

## Fase 1: Correções Críticas de Segurança

**Período:** 20/01/2026 - 02/03/2026 (6 semanas)  
**Objetivo:** Resolver vulnerabilidades de segurança e implementar exportação de dados

### Semana 1-2 (20/01 - 02/02): Criptografia de Campos PII

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Criar funções encrypt/decrypt para CPF, telefone, email | 12h | Pendente |
| Criar migration para adicionar campos criptografados | 8h | Pendente |
| Implementar criptografia transparente no Drizzle ORM | 16h | Pendente |
| Migrar dados existentes para formato criptografado | 16h | Pendente |
| Atualizar queries para descriptografar na leitura | 8h | Pendente |
| Testes de integridade dos dados | 8h | Pendente |

**Entregável:** Todos os dados PII criptografados com AES-256-GCM no banco de dados.

### Semana 3-4 (03/02 - 16/02): Exportação para Excel

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Implementar exportação de pacientes (com filtros) | 8h | Pendente |
| Implementar exportação de atendimentos (com filtros) | 8h | Pendente |
| Implementar exportação de métricas do dashboard | 8h | Pendente |
| Formatação profissional (cabeçalhos, larguras, estilos) | 8h | Pendente |
| Botões de exportação na interface | 4h | Pendente |

**Entregável:** Exportação funcional para Excel em todas as listagens principais.

### Semana 5-6 (17/02 - 02/03): Rate Limiting e Segurança

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Aplicar sensitiveRateLimiter aos endpoints de auth | 4h | Pendente |
| Corrigir warning de IPv6 no rate limiter | 4h | Pendente |
| Implementar rate limiting específico para reset de senha | 4h | Pendente |
| Testes de penetração básicos | 16h | Pendente |
| Documentação de segurança | 8h | Pendente |

**Entregável:** Rate limiting corrigido e documentado.

---

## Fase 2: Funcionalidades Clínicas

**Período:** 03/03/2026 - 13/04/2026 (6 semanas)  
**Objetivo:** Implementar geração de documentos médicos

### Semana 7-8 (03/03 - 16/03): Engine de Templates PDF

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Configurar biblioteca de geração de PDF (react-pdf ou pdfkit) | 8h | Pendente |
| Criar engine de templates com variáveis dinâmicas | 16h | Pendente |
| Implementar template de Receita Simples | 8h | Pendente |
| Implementar template de Receita Especial (controlados) | 8h | Pendente |

**Entregável:** Engine de templates funcional com receitas médicas.

### Semana 9-10 (17/03 - 30/03): Atestados e Laudos

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Implementar template de Atestado de Comparecimento | 4h | Pendente |
| Implementar template de Atestado de Afastamento | 4h | Pendente |
| Implementar template de Solicitação de Exames | 6h | Pendente |
| Implementar template de Laudo/Relatório Médico | 8h | Pendente |
| Interface de seleção e preenchimento de documentos | 12h | Pendente |

**Entregável:** Todos os tipos de documentos médicos implementados.

### Semana 11-12 (31/03 - 13/04): Templates Configuráveis

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Editor de templates (cabeçalho, rodapé, logo) | 16h | Pendente |
| Sistema de variáveis dinâmicas (paciente, médico, data) | 8h | Pendente |
| Preview em tempo real | 8h | Pendente |
| Impressão direta do navegador | 4h | Pendente |

**Entregável:** Sistema completo de documentos médicos com templates configuráveis.

---

## Fase 3: Conformidade Regulatória

**Período:** 14/04/2026 - 11/05/2026 (4 semanas)  
**Objetivo:** Garantir conformidade com LGPD e CFM

### Semana 13 (14/04 - 20/04): Auditoria de Visualizações

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Criar tabela de logs de visualização | 4h | Pendente |
| Implementar middleware de auditoria de visualização | 8h | Pendente |
| Interface de consulta de logs (admin) | 8h | Pendente |

**Entregável:** Rastreamento completo de quem visualizou cada prontuário.

### Semana 14 (21/04 - 27/04): Versionamento de Edições

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Criar tabela de histórico de versões | 8h | Pendente |
| Implementar trigger de versionamento antes de edições | 12h | Pendente |
| Interface de visualização de histórico | 12h | Pendente |

**Entregável:** Imutabilidade de dados com histórico de versões.

### Semana 15 (28/04 - 04/05): Consentimento LGPD

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Tornar consentimento obrigatório no cadastro | 4h | Pendente |
| Interface para paciente visualizar/revogar consentimento | 8h | Pendente |
| Granularidade de consentimento por finalidade | 8h | Pendente |

**Entregável:** Sistema de consentimento em conformidade com LGPD.

### Semana 16 (05/05 - 11/05): Testes e Validação

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Testes de penetração completos | 16h | Pendente |
| Validação de conformidade LGPD | 8h | Pendente |
| Validação de conformidade CFM | 8h | Pendente |
| Correção de vulnerabilidades encontradas | 16h | Pendente |

**Entregável:** Relatório de conformidade e segurança.

---

## Fase 4: Preparação para Lançamento

**Período:** 12/05/2026 - 15/06/2026 (5 semanas)  
**Objetivo:** Preparar ambiente de produção e documentação

### Semana 17-18 (12/05 - 25/05): Documentação

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Manual do usuário (PDF) | 16h | Pendente |
| FAQ com perguntas frequentes | 8h | Pendente |
| Vídeos tutoriais (5-10 min cada) | 16h | Pendente |
| Política de privacidade e termos de uso | 8h | Pendente |

### Semana 19 (26/05 - 01/06): Beta Restrito

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Configurar ambiente de beta | 8h | Pendente |
| Convidar 5 usuários para teste | - | Pendente |
| Coletar feedback e bugs | - | Pendente |
| Correções prioritárias | 16h | Pendente |

### Semana 20-21 (02/06 - 15/06): Lançamento

| Tarefa | Esforço | Status |
|--------|---------|--------|
| Configurar ambiente de produção final | 8h | Pendente |
| Configurar monitoramento (uptime, erros) | 8h | Pendente |
| Configurar alertas de segurança | 4h | Pendente |
| Lançamento beta público (01/06) | - | Pendente |
| Monitoramento intensivo | - | Pendente |
| Lançamento produção (15/06) | - | Pendente |

---

## Marcos de Lançamento

| Marco | Data | Descrição |
|-------|------|-----------|
| Conclusão Fase 1 | 02/03/2026 | Segurança crítica resolvida |
| Conclusão Fase 2 | 13/04/2026 | Funcionalidades clínicas implementadas |
| Conclusão Fase 3 | 11/05/2026 | Conformidade regulatória |
| **Beta Restrito** | 18/05/2026 | Até 5 usuários convidados |
| **Beta Público** | 01/06/2026 | Registro aberto com limitações |
| **Lançamento Produção** | 15/06/2026 | Versão estável para uso geral |

---

## Resumo de Esforço

| Fase | Semanas | Horas Estimadas |
|------|---------|-----------------|
| Fase 1: Segurança Crítica | 6 | 136h |
| Fase 2: Funcionalidades Clínicas | 6 | 118h |
| Fase 3: Conformidade | 4 | 104h |
| Fase 4: Preparação | 5 | 92h |
| **TOTAL** | **21** | **450h** |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Migração de dados PII falha | Média | Alto | Backup completo antes, rollback preparado |
| Vulnerabilidades no pentest | Alta | Alto | Reservar 2 semanas para correções |
| Atraso na geração de PDF | Média | Médio | Usar biblioteca madura (pdfkit) |
| Feedback negativo no beta | Média | Médio | Período de beta restrito antes |

---

## Notas Importantes

1. **Priorização Absoluta:** A Fase 1 (segurança) deve ser concluída antes de qualquer outra implementação.

2. **Uso Interno:** O sistema pode ser usado internamente para testes durante as fases 1-3, mas sem dados reais de pacientes.

3. **Conformidade Legal:** Consultar assessoria jurídica antes do lançamento público.

4. **Versionamento:** Manter regra 3.9.x até autorização para 4.0.

5. **Backup:** Manter backups diários durante todo o período de desenvolvimento.

---

*Documento atualizado por Manus AI em 19 de Janeiro de 2026*
