# 📋 PLANEJAMENTO GORGEN - VERSÃO 2.0

> **Documento de Planejamento Estratégico** | Versão 2.0 | Atualizado em 11/01/2026

Este documento consolida o planejamento completo do projeto Gorgen, incluindo a avaliação de segurança realizada em 11/01/2026 e o roadmap atualizado para publicação pública.

---

## 📊 SUMÁRIO EXECUTIVO

O **Gorgen** é um sistema integrado de gestão em saúde desenvolvido para o consultório do Dr. André Gorgen. O projeto encontra-se em estágio avançado de desenvolvimento, com funcionalidades core implementadas, porém **não está pronto para publicação pública** devido a lacunas críticas de segurança identificadas na avaliação de 11/01/2026.

### Status Atual

| Categoria | Progresso | Observação |
|-----------|-----------|------------|
| Gestão de Pacientes | 95% | 21.644 pacientes migrados |
| Gestão de Atendimentos | 90% | 1.337 atendimentos importados |
| Prontuário Eletrônico | 85% | Funcional, falta assinatura digital |
| Multi-tenant | 80% | Arquitetura pronta, falta validação completa |
| Auditoria LGPD | 75% | Implementado, falta imutabilidade |
| Segurança Cibernética | 55% | **Bloqueador para produção** |
| Backup/DR | 20% | **Crítico - não implementado** |

### Scorecard de Segurança: 5.55/10

O sistema obteve nota **5.55/10** na avaliação de segurança, classificado como **"Parcialmente Seguro"**. Esta pontuação impede a publicação pública até que os controles críticos sejam implementados.

---

## 🏛️ PILARES FUNDAMENTAIS

O Gorgen é construído sobre 6 pilares invioláveis:

1. **Imutabilidade e Preservação Histórica** - Todo dado é perpétuo
2. **Sigilo e Confidencialidade Absoluta** - Dados sensíveis protegidos
3. **Rastreabilidade Completa** - Auditoria de todas as ações
4. **Simplicidade com Profundidade sob Demanda** - Interface intuitiva
5. **Controle de Acesso Baseado em Perfis** - 5 perfis com permissões granulares
6. **Automação e Eliminação de Duplo Trabalho** - Nenhum dado digitado duas vezes

---

## 🔒 AVALIAÇÃO DE SEGURANÇA (11/01/2026)

### Metodologia

Foi utilizada uma **cadeia de verificação** com 5 perguntas principais e 2 perguntas de reavaliação para identificar fragilidades do sistema.

### Perguntas de Verificação e Respostas

| # | Pergunta | Resposta | Status |
|---|----------|----------|--------|
| 1 | O isolamento multi-tenant está seguro? | Bem implementado, falta criptografia | ⚠️ Parcial |
| 2 | A auditoria atende LGPD? | Estruturada, falta imutabilidade | ⚠️ Parcial |
| 3 | Existem mecanismos de backup/DR? | **Não implementado** | 🔴 Crítico |
| 4 | A segurança cibernética é adequada? | Parcial, falta rate limiting e MFA | ⚠️ Parcial |
| 5 | O controle de acesso funciona? | Bem implementado | ✅ OK |

### Matriz de Riscos

| Risco | Probabilidade | Impacto | Prioridade |
|-------|---------------|---------|------------|
| Perda de dados (sem backup) | Média | Crítico | 🔴 P1 |
| Vazamento de dados (sem criptografia) | Média | Crítico | 🔴 P1 |
| Ataque de força bruta (sem rate limit) | Alta | Alto | 🔴 P1 |
| Indisponibilidade prolongada (sem DR) | Baixa | Crítico | 🟡 P2 |
| Acesso não autorizado (sem MFA) | Média | Alto | 🟡 P2 |

### Conclusão da Avaliação

> **O sistema NÃO está pronto para publicação pública.**

Os bloqueadores são:
1. Ausência de backup automatizado próprio
2. Dados sensíveis não criptografados em repouso
3. Sem rate limiting (vulnerável a ataques)
4. Sem plano de recuperação de desastres

---

## 🗓️ ROADMAP ATUALIZADO

### FASE 0: SEGURANÇA CRÍTICA (Semanas 1-6)

**Objetivo:** Implementar controles de segurança obrigatórios para publicação

#### Semana 1-2: Rate Limiting e CSP
- [ ] Implementar rate limiting por IP/usuário (100 req/min)
- [ ] Bloquear após 5 tentativas de login falhas
- [ ] Configurar Content Security Policy (CSP)
- [ ] Adicionar headers de segurança (X-Frame-Options, etc.)

#### Semana 2-3: Criptografia em Repouso
- [ ] Criptografar campos sensíveis (CPF, dados médicos)
- [ ] Implementar AES-256 com chaves gerenciadas
- [ ] Criar rotina de rotação de chaves
- [ ] Migrar dados existentes para formato criptografado

#### Semana 3-4: Backup e Recuperação
- [ ] Configurar backup diário automatizado do banco
- [ ] Implementar backup incremental de arquivos S3
- [ ] Armazenar backups em região geográfica diferente
- [ ] Documentar plano de recuperação de desastres (DR)
- [ ] Realizar primeiro teste de recuperação

#### Semana 4-5: MFA e Alertas
- [ ] Implementar MFA opcional (TOTP)
- [ ] Tornar MFA obrigatório para admin_master
- [ ] Criar alertas de acessos suspeitos
- [ ] Dashboard de monitoramento de segurança

#### Semana 5-6: Validação
- [ ] Contratar pentest (teste de penetração)
- [ ] Corrigir vulnerabilidades encontradas
- [ ] Documentar resultados
- [ ] Obter certificação de segurança

**Entrega:** Sistema pronto para publicação pública

---

### FASE 1: CONSOLIDAÇÃO (Semanas 7-10)

**Objetivo:** Finalizar funcionalidades core e preparar para escala

#### 1.1 Assinatura Digital
- [ ] Integrar certificado digital ICP-Brasil
- [ ] Assinatura de receitas e atestados
- [ ] Carimbo de tempo em documentos
- [ ] Validação de assinaturas

#### 1.2 Portal do Paciente
- [ ] Login separado para pacientes
- [ ] Visualização de exames e resultados
- [ ] Upload de documentos pelo paciente
- [ ] Agendamento online

#### 1.3 Integrações
- [ ] Integração com laboratórios (HL7/FHIR)
- [ ] Integração com sistemas de convênios (TISS)
- [ ] API pública documentada

---

### FASE 2: ESCALA (Semanas 11-16)

**Objetivo:** Preparar para múltiplos consultórios/clínicas

#### 2.1 Multi-tenant Completo
- [ ] Onboarding automatizado de novos tenants
- [ ] Branding customizado por tenant
- [ ] Planos e limites por tenant
- [ ] Faturamento por tenant

#### 2.2 Telemedicina
- [ ] Integração com videochamada
- [ ] Prescrição digital em teleconsulta
- [ ] Registro automático no prontuário

#### 2.3 App Mobile
- [ ] App nativo iOS/Android para pacientes
- [ ] Notificações push
- [ ] Acesso offline a documentos

---

## 📈 MÉTRICAS DE SUCESSO

### Métricas de Segurança (Meta para Publicação)

| Métrica | Atual | Meta | Status |
|---------|-------|------|--------|
| Scorecard de Segurança | 5.55/10 | 8.0/10 | 🔴 |
| Cobertura de Testes | 65% | 80% | 🟡 |
| Vulnerabilidades Críticas | 4 | 0 | 🔴 |
| Tempo de Recuperação (RTO) | N/A | < 4h | 🔴 |
| Ponto de Recuperação (RPO) | N/A | < 24h | 🔴 |

### Métricas de Negócio

| Métrica | Atual | Meta Q1/2026 |
|---------|-------|--------------|
| Pacientes cadastrados | 21.644 | 25.000 |
| Atendimentos registrados | 1.337 | 5.000 |
| Taxa de recebimento | 92.8% | 95% |
| Uptime do sistema | N/A | 99.5% |

---

## 💰 ORÇAMENTO ESTIMADO

### Fase 0: Segurança Crítica

| Item | Custo Estimado |
|------|----------------|
| Pentest profissional | R$ 15.000 - 30.000 |
| Certificado digital ICP-Brasil | R$ 500/ano |
| Backup em nuvem (redundante) | R$ 500/mês |
| Consultoria de segurança | R$ 5.000 - 10.000 |
| **Total Fase 0** | **R$ 21.000 - 41.000** |

### Custos Recorrentes (Pós-publicação)

| Item | Custo Mensal |
|------|--------------|
| Infraestrutura (Manus) | R$ 500 - 1.500 |
| Backup redundante | R$ 500 |
| Monitoramento de segurança | R$ 300 |
| Suporte e manutenção | R$ 2.000 |
| **Total Mensal** | **R$ 3.300 - 4.300** |

---

## 👥 EQUIPE E RESPONSABILIDADES

| Papel | Responsável | Responsabilidades |
|-------|-------------|-------------------|
| Product Owner | Dr. André Gorgen | Decisões de negócio, priorização |
| Desenvolvedor | Manus AI | Implementação, testes |
| DPO (a contratar) | - | Conformidade LGPD |
| Segurança (a contratar) | - | Pentest, auditoria |

---

## 📅 CRONOGRAMA RESUMIDO

```
Jan 2026  |  Fev 2026  |  Mar 2026  |  Abr 2026
    |          |          |          |
    v          v          v          v
[FASE 0: SEGURANÇA]      [FASE 1]   [FASE 2]
    |          |          |          |
    |-- Rate Limiting     |-- Assinatura Digital
    |-- Criptografia      |-- Portal Paciente
    |-- Backup/DR         |-- Integrações
    |-- MFA               |
    |-- Pentest           |
    |                     |
    v                     v
[PUBLICAÇÃO]         [ESCALA]
  ~Fev/2026           ~Abr/2026
```

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Atraso no pentest | Média | Alto | Agendar com antecedência |
| Custo acima do orçamento | Média | Médio | Buffer de 20% |
| Vulnerabilidade crítica no pentest | Alta | Alto | Tempo extra para correções |
| Indisponibilidade do desenvolvedor | Baixa | Alto | Documentação completa |
| Mudança regulatória (LGPD) | Baixa | Alto | Monitorar atualizações |

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. **Semana de 13/01/2026:**
   - Iniciar implementação de rate limiting
   - Pesquisar soluções de backup automatizado
   - Solicitar orçamentos de pentest

2. **Semana de 20/01/2026:**
   - Implementar criptografia de campos sensíveis
   - Configurar backup em região secundária
   - Documentar plano de DR

3. **Semana de 27/01/2026:**
   - Implementar MFA
   - Realizar primeiro teste de recuperação
   - Agendar pentest

---

## 📚 DOCUMENTOS RELACIONADOS

| Documento | Descrição |
|-----------|-----------|
| [PILARES_FUNDAMENTAIS.md](./PILARES_FUNDAMENTAIS.md) | Princípios invioláveis do sistema |
| [AVALIACAO_SEGURANCA_GORGEN.md](./AVALIACAO_SEGURANCA_GORGEN.md) | Análise completa de segurança |
| [ROADMAP.md](./ROADMAP.md) | Roadmap detalhado de funcionalidades |
| [todo.md](./todo.md) | Lista de tarefas e histórico |

---

> **"O Gorgen não é apenas um sistema de gestão. É uma filosofia de cuidado com a informação médica."**

---

**Documento preparado por:** Manus AI  
**Aprovado por:** Dr. André Gorgen  
**Data:** 11/01/2026  
**Próxima revisão:** 25/01/2026
