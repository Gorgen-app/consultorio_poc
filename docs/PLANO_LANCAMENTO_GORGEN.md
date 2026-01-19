# GORGEN - Plano de Lançamento e Roadmap 2026

> **Documento Estratégico** | Versão 1.0 | 19 de Janeiro de 2026

---

## 1. Metas e Marcos

### 1.1 Cronograma de Lançamento

| Data | Marco | Descrição |
|------|-------|-----------|
| **22/01/2026** | 🟢 Secretária Onboarding | Primeira usuária além do Admin |
| **26/01/2026** | 🟢 Beta Dr. André | Atendimento real de pacientes |
| **~25/01/2026** | 🌐 Domínio | www.gorgen.com.br ativo |
| **01/02/2026** | 🟢 Dra. Letícia | Primeira médica externa |
| **28/02/2026** | 🟡 Beta Expandido | 3-5 médicos em teste |
| **01/07/2026** | 🟡 100 Usuários | Meta de crescimento |
| **01/01/2027** | 🔴 600 Usuários | Meta anual |

### 1.2 Dias Úteis Disponíveis

| Marco | Data | Dias Úteis | Status |
|-------|------|------------|--------|
| Secretária | 22/01 | **3 dias** | 🔴 CRÍTICO |
| Beta Dr. André | 26/01 | **7 dias** | 🔴 CRÍTICO |
| Domínio | ~25/01 | **6 dias** | 🟡 IMPORTANTE |
| Dra. Letícia | 01/02 | **13 dias** | 🟢 VIÁVEL |

---

## 2. Sprint 1: Secretária Onboarding (19-22/01)

### 2.1 Funcionalidades OBRIGATÓRIAS

| # | Funcionalidade | Esforço | Prioridade |
|---|----------------|---------|------------|
| 1 | **Login com usuário/senha** | 4h | P0 |
| 2 | **Criar usuário secretária** | 1h | P0 |
| 3 | **Perfil de secretária** (acesso limitado) | 2h | P0 |
| 4 | **Página inicial após login** | 2h | P0 |

### 2.2 Funcionalidades DESEJÁVEIS

| # | Funcionalidade | Esforço | Prioridade |
|---|----------------|---------|------------|
| 5 | Recuperação de senha | 3h | P1 |
| 6 | Vínculo secretária-médico | 2h | P1 |

### 2.3 Cronograma Detalhado

| Dia | Data | Tarefas |
|-----|------|---------|
| **Dia 1** | 19/01 (Dom) | Implementar autenticação local (login/senha) |
| **Dia 2** | 20/01 (Seg) | Criar perfil de secretária + permissões |
| **Dia 3** | 21/01 (Ter) | Criar usuário da secretária + testes |
| **Dia 4** | 22/01 (Qua) | **ONBOARDING SECRETÁRIA** |

### 2.4 Checklist de Entrega - 22/01

- [ ] Secretária consegue fazer login com email/senha
- [ ] Secretária vê dashboard simplificado
- [ ] Secretária pode acessar lista de pacientes
- [ ] Secretária pode acessar agenda
- [ ] Secretária NÃO vê módulo financeiro (se configurado)
- [ ] Secretária NÃO pode excluir registros

---

## 3. Sprint 2: Beta Dr. André (22-26/01)

### 3.1 Funcionalidades OBRIGATÓRIAS

| # | Funcionalidade | Esforço | Prioridade |
|---|----------------|---------|------------|
| 1 | **Evolução médica básica** | 6h | P0 |
| 2 | **Visualização de prontuário completo** | 4h | P0 |
| 3 | **Registro de atendimento vinculado** | 2h | P0 |
| 4 | **Migração de criptografia PII** | 4h | P0 |

### 3.2 Funcionalidades DESEJÁVEIS

| # | Funcionalidade | Esforço | Prioridade |
|---|----------------|---------|------------|
| 5 | Prescrição simples (texto) | 3h | P1 |
| 6 | Atestado simples (texto) | 2h | P1 |
| 7 | CID-10 autocomplete | 4h | P1 |

### 3.3 Cronograma Detalhado

| Dia | Data | Tarefas |
|-----|------|---------|
| **Dia 4** | 22/01 (Qua) | Schema de evoluções + API tRPC |
| **Dia 5** | 23/01 (Qui) | Interface de evolução (SOAP) |
| **Dia 6** | 24/01 (Sex) | Integração prontuário + testes |
| **Dia 7** | 25/01 (Sáb) | Migração PII + ajustes finais |
| **Dia 8** | 26/01 (Dom) | **BETA DR. ANDRÉ - GO LIVE** |

### 3.4 Checklist de Entrega - 26/01

- [ ] Dr. André consegue registrar evolução SOAP
- [ ] Evoluções aparecem no histórico do paciente
- [ ] Dados PII criptografados (21.644 pacientes)
- [ ] Prontuário mostra timeline completa
- [ ] Sistema estável para uso diário

---

## 4. Sprint 3: Domínio e Landing Page (20-25/01)

### 4.1 Tarefas de Infraestrutura

| # | Tarefa | Responsável | Prazo |
|---|--------|-------------|-------|
| 1 | Registrar domínio gorgen.com.br | CEO | 20/01 |
| 2 | Configurar DNS | Manus/CEO | 21/01 |
| 3 | Criar landing page pública | Manus AI | 22/01 |
| 4 | Configurar SSL/HTTPS | Automático | 23/01 |
| 5 | Testar domínio | CEO | 24/01 |
| 6 | Go live domínio | - | 25/01 |

### 4.2 Landing Page - Conteúdo

```
┌─────────────────────────────────────────────────────────────────┐
│                        www.gorgen.com.br                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      HERO SECTION                           ││
│  │                                                             ││
│  │  GORGEN                                                     ││
│  │  Aplicativo de Gestão em Saúde                             ││
│  │                                                             ││
│  │  Simplifique a gestão do seu consultório médico            ││
│  │  com segurança, conformidade e eficiência.                 ││
│  │                                                             ││
│  │  [Entrar]  [Criar Conta]                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      FUNCIONALIDADES                        ││
│  │                                                             ││
│  │  📋 Prontuário       📅 Agenda        💰 Faturamento       ││
│  │     Eletrônico          Inteligente       Automatizado     ││
│  │                                                             ││
│  │  🔒 Segurança        📊 Relatórios    👥 Multi-usuário     ││
│  │     LGPD               Gerenciais        Colaborativo      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                         PLANOS                              ││
│  │                                                             ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                     ││
│  │  │ STARTER │  │  PRO    │  │ CLÍNICA │                     ││
│  │  │         │  │         │  │         │                     ││
│  │  │ R$ XX   │  │ R$ XX   │  │ R$ XX   │                     ││
│  │  │ /mês    │  │ /mês    │  │ /mês    │                     ││
│  │  │         │  │         │  │         │                     ││
│  │  │[Começar]│  │[Começar]│  │[Contato]│                     ││
│  │  └─────────┘  └─────────┘  └─────────┘                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                         RODAPÉ                              ││
│  │  © 2026 Gorgen | Termos | Privacidade | Contato            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Planos de Assinatura (Sugestão)

| Plano | Público | Preço Sugerido | Funcionalidades |
|-------|---------|----------------|-----------------|
| **Starter** | Médico autônomo | R$ 149/mês | 1 usuário, 500 pacientes, prontuário básico |
| **Pro** | Consultório pequeno | R$ 299/mês | 3 usuários, ilimitado, agenda, faturamento |
| **Clínica** | Clínicas | R$ 599/mês | 10 usuários, multi-médico, relatórios avançados |
| **Enterprise** | Hospitais | Sob consulta | Ilimitado, API, suporte dedicado |

**Nota**: Preços são sugestões. CEO deve definir valores finais.

---

## 5. Sprint 4: Dra. Letícia (26/01-01/02)

### 5.1 Funcionalidades OBRIGATÓRIAS

| # | Funcionalidade | Esforço | Prioridade |
|---|----------------|---------|------------|
| 1 | **Perfil de médico colaborador** | 3h | P0 |
| 2 | **Criar usuário Dra. Letícia** | 1h | P0 |
| 3 | **Controle de acesso por paciente** | 4h | P0 |
| 4 | **Página de signup** | 4h | P0 |

### 5.2 Decisão Necessária: Modelo de Tenant

**Opção A: Dra. Letícia no mesmo tenant**
- Vantagens: Compartilha pacientes, implementação simples
- Desvantagens: Menos isolamento

**Opção B: Dra. Letícia em tenant próprio**
- Vantagens: Independência total, modelo SaaS real
- Desvantagens: Mais complexo, pacientes duplicados

**Recomendação**: Opção B (tenant próprio) para validar o modelo de negócio SaaS.

### 5.3 Cronograma Detalhado

| Dia | Data | Tarefas |
|-----|------|---------|
| **Dia 8** | 26/01 (Dom) | Beta Dr. André ativo |
| **Dia 9** | 27/01 (Seg) | Perfil médico colaborador |
| **Dia 10** | 28/01 (Ter) | Página de signup |
| **Dia 11** | 29/01 (Qua) | Fluxo de onboarding |
| **Dia 12** | 30/01 (Qui) | Testes com Dra. Letícia |
| **Dia 13** | 31/01 (Sex) | Ajustes finais |
| **Dia 14** | 01/02 (Sáb) | **DRA. LETÍCIA - GO LIVE** |

### 5.4 Checklist de Entrega - 01/02

- [ ] Dra. Letícia consegue criar conta via signup
- [ ] Dra. Letícia tem seu próprio tenant
- [ ] Dra. Letícia pode cadastrar pacientes
- [ ] Dra. Letícia pode registrar evoluções
- [ ] Sistema de planos visível (mesmo que não cobrado ainda)

---

## 6. Roadmap Trimestral

### Q1 2026 (Jan-Mar)

| Mês | Foco | Entregáveis |
|-----|------|-------------|
| **Janeiro** | MVP Beta | Login, Prontuário, Evoluções, Domínio |
| **Fevereiro** | Expansão Beta | 3-5 médicos, Prescrições, Atestados |
| **Março** | Estabilização | Correções, Performance, Documentação |

### Q2 2026 (Abr-Jun)

| Mês | Foco | Entregáveis |
|-----|------|-------------|
| **Abril** | Faturamento | Guias TISS, Integração convênios |
| **Maio** | Portal Paciente | Acesso paciente, Agendamento online |
| **Junho** | Marketing | Campanhas, Meta 100 usuários |

### Q3-Q4 2026 (Jul-Dez)

| Período | Foco | Meta |
|---------|------|------|
| **Q3** | Crescimento | 100 → 300 usuários |
| **Q4** | Escala | 300 → 600 usuários |

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Atraso no domínio | Média | Alto | Iniciar registro HOJE |
| Bugs críticos no beta | Alta | Alto | Testes intensivos 24-25/01 |
| Secretária não se adapta | Baixa | Médio | Treinamento presencial |
| Dra. Letícia desiste | Baixa | Médio | Suporte dedicado |
| Sobrecarga de trabalho | Alta | Alto | Priorizar P0, adiar P1 |

---

## 8. Ações Imediatas (Hoje - 19/01)

| # | Ação | Responsável | Prazo |
|---|------|-------------|-------|
| 1 | **Registrar domínio gorgen.com.br** | CEO | Hoje |
| 2 | Aprovar modelo de tenant para Dra. Letícia | CEO | Hoje |
| 3 | Definir preços dos planos | CEO | 20/01 |
| 4 | Iniciar implementação de login local | Manus AI | Hoje |
| 5 | Coletar dados da secretária (nome, email) | CEO | 20/01 |
| 6 | Coletar dados da Dra. Letícia (nome, email, CRM) | CEO | 25/01 |

---

## 9. Definições Pendentes do CEO

### 9.1 Urgentes (Hoje)

| # | Questão | Opções |
|---|---------|--------|
| 1 | **Nome da secretária** | Para criar usuário |
| 2 | **Email da secretária** | Para login |
| 3 | **Modelo Dra. Letícia** | A) Mesmo tenant ou B) Tenant próprio |

### 9.2 Esta Semana

| # | Questão | Opções |
|---|---------|--------|
| 4 | **Preços dos planos** | Starter, Pro, Clínica |
| 5 | **Período de teste grátis** | 7, 14 ou 30 dias? |
| 6 | **Secretária vê financeiro?** | Sim/Não |

---

## 10. Resumo Executivo

### O que será entregue:

| Data | Entrega |
|------|---------|
| **22/01** | Sistema com login local + usuário secretária |
| **25/01** | Domínio www.gorgen.com.br ativo |
| **26/01** | Prontuário com evoluções + Dr. André operacional |
| **01/02** | Signup público + Dra. Letícia operacional |

### O que NÃO será entregue até 01/02:

- Cobrança automática (planos serão visuais apenas)
- Assinatura digital
- Integração com convênios
- Portal do paciente
- App mobile

### Compromisso:

Com foco total nas próximas 2 semanas, é **viável** cumprir o cronograma proposto, desde que:
1. Domínio seja registrado HOJE
2. Decisões pendentes sejam tomadas até 20/01
3. Funcionalidades P1 sejam adiadas se necessário

---

**Aguardo aprovação para iniciar a implementação.**

*Documento preparado por Manus AI em 19 de Janeiro de 2026*
