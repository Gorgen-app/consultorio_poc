# 📊 PERGUNTAS DE VERIFICAÇÃO - CICLO 2

> **Data:** 19 de Janeiro de 2026
> **Versão:** GORGEN v3.9.8
> **Foco:** Conformidade Regulatória e Funcionalidades Pendentes

---

## 🔍 PERGUNTAS DE VERIFICAÇÃO - CICLO 2

Baseado nos resultados do Ciclo 1, as perguntas do Ciclo 2 focam em:
1. Conformidade com LGPD e CFM
2. Funcionalidades críticas ausentes
3. Estimativa de timeline realista

---

### Pergunta 6: O sistema atende aos requisitos da LGPD para portabilidade de dados (Art. 18, V)?

**Hipótese a testar:** Sem exportação de dados implementada, o sistema pode estar em não conformidade com a LGPD.

**Análise:**

A LGPD (Lei 13.709/2018) estabelece em seu Art. 18, inciso V:
> "O titular dos dados pessoais tem direito a obter do controlador [...] a portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa"

**Verificação no GORGEN:**
- ❌ Exportação para Excel não implementada
- ❌ Exportação de prontuário em PDF não implementada
- ❌ API de exportação de dados pessoais não implementada
- ⚠️ Backup pode ser usado como workaround, mas não é user-friendly

**Veredicto:** **NÃO CONFORME** - O sistema não oferece mecanismo para o paciente exercer seu direito de portabilidade de dados.

**Impacto Legal:** ALTO - Multas de até 2% do faturamento ou R$ 50 milhões por infração.

---

### Pergunta 7: O sistema atende aos requisitos do CFM para prontuário eletrônico (Resolução CFM 1.821/2007)?

**Hipótese a testar:** O sistema pode não atender todos os requisitos técnicos do CFM para PEP.

**Análise:**

A Resolução CFM 1.821/2007 estabelece requisitos para Prontuário Eletrônico do Paciente (PEP):

| Requisito CFM | Status no GORGEN | Observação |
|---------------|------------------|------------|
| Identificação única do paciente | ✅ | ID sequencial implementado |
| Registro de data/hora de cada entrada | ✅ | Timestamps em todas as tabelas |
| Identificação do profissional responsável | ⚠️ | Parcial - não há assinatura digital |
| Impossibilidade de alteração após assinatura | ⚠️ | Edição permitida sem versionamento |
| Backup e recuperação | ✅ | Sistema robusto implementado |
| Controle de acesso | ✅ | RBAC com 5 perfis |
| Auditoria de acessos | ⚠️ | CRUD auditado, visualização não |
| Certificação digital ICP-Brasil | ❌ | Não implementado |
| Nível de Garantia de Segurança 2 (NGS2) | ❌ | Não certificado |

**Veredicto:** **PARCIALMENTE CONFORME** - O sistema atende requisitos básicos, mas falta:
1. Assinatura digital com certificado ICP-Brasil
2. Versionamento de edições (imutabilidade)
3. Auditoria de visualizações

**Impacto:** MÉDIO - Pode ser usado internamente, mas não atende requisitos para substituir prontuário físico.

---

### Pergunta 8: Qual é o esforço real para implementar as funcionalidades críticas ausentes?

**Análise de Esforço:**

| Funcionalidade | Complexidade | Esforço Estimado | Dependências |
|----------------|--------------|------------------|--------------|
| Criptografia de campos PII | ALTA | 40-60h | Migração de dados |
| Exportação para Excel | MÉDIA | 16-24h | Biblioteca xlsx já instalada |
| Geração de PDF (receitas/atestados) | ALTA | 40-60h | Templates, layout |
| Auditoria de visualizações | BAIXA | 8-12h | Middleware simples |
| Versionamento de edições | MÉDIA | 24-32h | Tabela de histórico |
| Rate limiting em auth | BAIXA | 4-8h | Já existe, só aplicar |

**Total Estimado:** 132-196 horas (3-5 semanas de desenvolvimento)

---

### Pergunta 9: O sistema possui mecanismos adequados para consentimento LGPD?

**Análise:**

| Mecanismo | Status | Observação |
|-----------|--------|------------|
| Termo de consentimento | ⚠️ | Existe campo, mas não é obrigatório |
| Registro de IP do consentimento | ✅ | Campo ip_consentimento na tabela |
| Data do consentimento | ✅ | Campo data_consentimento |
| Revogação de consentimento | ⚠️ | Não há interface para paciente revogar |
| Finalidade específica | ❌ | Não há granularidade de consentimento |

**Veredicto:** **PARCIALMENTE CONFORME** - Estrutura existe, mas falta interface e obrigatoriedade.

---

### Pergunta 10: O sistema está preparado para escalar com múltiplos tenants em produção?

**Análise:**

| Aspecto | Status | Observação |
|---------|--------|------------|
| Isolamento de dados | ✅ | tenantId em todas as tabelas |
| Índices por tenant | ✅ | Índices compostos implementados |
| Rate limiting por tenant | ✅ | 1000 req/min por clínica |
| Backup por tenant | ✅ | Backups separados |
| Configuração por tenant | ✅ | Tabela backupConfig |
| Cross-tenant controlado | ✅ | Autorizações e logs |

**Veredicto:** **ADEQUADO** - Arquitetura multi-tenant bem implementada.

---

## 📊 RESUMO DO CICLO 2

| Pergunta | Área | Veredicto | Prioridade |
|----------|------|-----------|------------|
| 6 | LGPD (Portabilidade) | **NÃO CONFORME** | **CRÍTICA** |
| 7 | CFM (PEP) | Parcialmente Conforme | ALTA |
| 8 | Esforço de Implementação | 132-196h | - |
| 9 | LGPD (Consentimento) | Parcialmente Conforme | MÉDIA |
| 10 | Escalabilidade | Adequado | BAIXA |

---

## 🚨 CONCLUSÃO DOS CICLOS 1 E 2

### Vulnerabilidades Críticas Identificadas

1. **Dados PII em texto plano** (Ciclo 1, Pergunta 4)
   - CPF, telefone, dados médicos não criptografados
   - Risco: Vazamento total em caso de breach

2. **Não conformidade com LGPD - Portabilidade** (Ciclo 2, Pergunta 6)
   - Paciente não consegue exportar seus dados
   - Risco: Multas de até R$ 50 milhões

3. **Funcionalidades clínicas ausentes** (Ciclo 1, Pergunta 5)
   - Geração de receitas e atestados não implementada
   - Risco: Sistema inutilizável na prática clínica

### Recomendação Final

O sistema GORGEN v3.9.8 **NÃO ESTÁ PRONTO** para lançamento público devido às vulnerabilidades críticas identificadas. Recomenda-se:

1. **Fase Imediata (4-6 semanas):** Implementar criptografia de PII e exportação de dados
2. **Fase Intermediária (4-6 semanas):** Implementar geração de documentos médicos
3. **Fase de Conformidade (2-4 semanas):** Auditoria de visualizações e versionamento
4. **Lançamento Beta:** Após conclusão das fases acima (~12-16 semanas)

---

*Documento gerado em 19/01/2026 - Ciclo 2 de Verificação*
