# GORGEN - Proposta de Precificação

> **Documento Comercial** | Versão 1.0 | 19 de Janeiro de 2026

---

## 1. Filosofia de Precificação

### 1.1 Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Pacientes = No-brainer** | Preço tão baixo que não há hesitação |
| **Médicos = Valor Premium** | Preço justo pelo valor entregue, com incentivo anual |
| **Secretárias = Gratuito** | Incluídas no plano do médico (com limite) |
| **Simplicidade** | Poucos planos, fácil de entender |

### 1.2 Modelo de Negócio

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE RECEITA GORGEN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MÉDICOS (Receita Principal)                                    │
│  ├── Assinatura mensal ou anual                                 │
│  ├── Desconto significativo no anual (fidelização)              │
│  └── Upsell para planos maiores conforme crescimento            │
│                                                                  │
│  PACIENTES (Volume + Engajamento)                               │
│  ├── Preço simbólico (café por mês)                             │
│  ├── Gera engajamento e dados                                   │
│  └── Potencial para serviços adicionais futuros                 │
│                                                                  │
│  SECRETÁRIAS (Gratuito)                                         │
│  ├── Incluídas no plano do médico                               │
│  ├── Limite por plano (incentiva upgrade)                       │
│  └── Reduz fricção de adoção                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Planos para Médicos

### 2.1 Estrutura de Planos

| Plano | Público-Alvo | Mensal | Anual | Economia |
|-------|--------------|--------|-------|----------|
| **Essencial** | Médico autônomo iniciante | R$ 197/mês | R$ 1.770/ano (R$ 147,50/mês) | 25% |
| **Profissional** | Consultório estabelecido | R$ 347/mês | R$ 2.997/ano (R$ 249,75/mês) | 28% |
| **Clínica** | Múltiplos médicos | R$ 597/mês | R$ 4.997/ano (R$ 416,42/mês) | 30% |
| **Enterprise** | Hospitais/Redes | Sob consulta | Sob consulta | Negociável |

### 2.2 Detalhamento dos Planos

#### Plano Essencial - R$ 197/mês (ou R$ 1.770/ano)

| Recurso | Limite |
|---------|--------|
| Usuários médicos | 1 |
| Secretárias incluídas | 1 |
| Pacientes ativos | 500 |
| Armazenamento | 5 GB |
| Prontuário eletrônico | ✅ |
| Agenda | ✅ |
| Evoluções SOAP | ✅ |
| Prescrições | ✅ |
| Atestados | ✅ |
| Faturamento básico | ✅ |
| Relatórios | Básicos |
| Suporte | Email |

#### Plano Profissional - R$ 347/mês (ou R$ 2.997/ano)

| Recurso | Limite |
|---------|--------|
| Usuários médicos | 1 |
| Secretárias incluídas | 2 |
| Pacientes ativos | Ilimitado |
| Armazenamento | 20 GB |
| Tudo do Essencial | ✅ |
| Integração convênios | ✅ |
| Guias TISS automáticas | ✅ |
| Relatórios avançados | ✅ |
| Backup automático | ✅ |
| Assinatura digital | ✅ |
| Suporte | Email + Chat |

#### Plano Clínica - R$ 597/mês (ou R$ 4.997/ano)

| Recurso | Limite |
|---------|--------|
| Usuários médicos | 5 |
| Secretárias incluídas | 5 |
| Pacientes ativos | Ilimitado |
| Armazenamento | 100 GB |
| Tudo do Profissional | ✅ |
| Multi-agenda | ✅ |
| Gestão financeira completa | ✅ |
| Dashboard gerencial | ✅ |
| API de integração | ✅ |
| Usuários adicionais | R$ 97/mês cada |
| Suporte | Prioritário |

#### Plano Enterprise - Sob Consulta

| Recurso | Limite |
|---------|--------|
| Usuários | Ilimitado |
| Armazenamento | Ilimitado |
| Tudo do Clínica | ✅ |
| Customizações | ✅ |
| Integração HL7/FHIR | ✅ |
| SLA garantido | ✅ |
| Gerente de conta | ✅ |
| Treinamento presencial | ✅ |

### 2.3 Tabela Comparativa Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLANOS PARA MÉDICOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │  ESSENCIAL  │  │ PROFISSIONAL│  │   CLÍNICA   │  │ENTERPRISE│
│  │             │  │             │  │             │  │         ││
│  │  R$ 197     │  │  R$ 347     │  │  R$ 597     │  │ Consulte││
│  │  /mês       │  │  /mês       │  │  /mês       │  │         ││
│  │             │  │             │  │             │  │         ││
│  │  ou         │  │  ou         │  │  ou         │  │         ││
│  │  R$ 1.770   │  │  R$ 2.997   │  │  R$ 4.997   │  │         ││
│  │  /ano       │  │  /ano       │  │  /ano       │  │         ││
│  │  (25% off)  │  │  (28% off)  │  │  (30% off)  │  │         ││
│  │             │  │             │  │             │  │         ││
│  │ 1 médico    │  │ 1 médico    │  │ 5 médicos   │  │Ilimitado││
│  │ 1 secretária│  │ 2 secretárias│ │ 5 secretárias│ │Ilimitado││
│  │ 500 pac.    │  │ Ilimitado   │  │ Ilimitado   │  │Ilimitado││
│  │             │  │             │  │             │  │         ││
│  │ [Começar]   │  │ [Começar]   │  │ [Começar]   │  │[Contato]││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Plano para Pacientes

### 3.1 Filosofia "No-Brainer"

O objetivo é que o paciente pense: *"Por esse preço, não tenho motivo para não assinar."*

### 3.2 Proposta de Preço

| Plano | Mensal | Anual | Economia |
|-------|--------|-------|----------|
| **Paciente** | R$ 9,90/mês | R$ 89,90/ano (R$ 7,49/mês) | 24% |

**Comparativo de Valor:**
- Preço de um café especial por mês
- Menos que uma passagem de ônibus
- Acesso a todo o histórico médico

### 3.3 Funcionalidades do Plano Paciente

| Recurso | Incluído |
|---------|----------|
| Acesso ao próprio prontuário | ✅ |
| Histórico de consultas | ✅ |
| Resultados de exames | ✅ |
| Prescrições e receitas | ✅ |
| Atestados | ✅ |
| Agendamento online | ✅ |
| Autorizar/revogar médicos | ✅ |
| Exportar dados (LGPD) | ✅ |
| Lembretes de consulta | ✅ |
| Chat com secretária | ✅ |

### 3.4 Estratégia de Conversão

```
┌─────────────────────────────────────────────────────────────────┐
│                 FUNIL DE CONVERSÃO PACIENTE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CADASTRO GRATUITO                                           │
│     └── Médico cadastra paciente no sistema                     │
│                                                                  │
│  2. CONVITE POR EMAIL                                           │
│     └── "Acesse seu prontuário no Gorgen"                       │
│                                                                  │
│  3. PRIMEIRO ACESSO GRÁTIS                                      │
│     └── 30 dias para experimentar                               │
│                                                                  │
│  4. CONVERSÃO                                                   │
│     └── "Continue acessando por apenas R$ 9,90/mês"             │
│                                                                  │
│  5. RETENÇÃO                                                    │
│     └── Valor percebido > Custo                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Secretárias - Gratuito

### 4.1 Modelo

| Plano do Médico | Secretárias Incluídas | Adicional |
|-----------------|----------------------|-----------|
| Essencial | 1 | R$ 47/mês cada |
| Profissional | 2 | R$ 47/mês cada |
| Clínica | 5 | R$ 47/mês cada |
| Enterprise | Ilimitado | Incluído |

### 4.2 Justificativa

- **Reduz fricção**: Médico não precisa pagar extra para ter secretária
- **Incentiva upgrade**: Limite baixo no Essencial força upgrade
- **Valor percebido**: Secretária "grátis" aumenta percepção de valor

---

## 5. Período de Teste

### 5.1 Proposta

| Perfil | Período Grátis | Cartão Necessário |
|--------|----------------|-------------------|
| Médico | 14 dias | Não |
| Paciente | 30 dias | Não |

### 5.2 Estratégia

- **Médicos**: 14 dias é suficiente para avaliar, cria urgência
- **Pacientes**: 30 dias permite experiência completa, aumenta conversão
- **Sem cartão**: Remove barreira de entrada, aumenta trials

---

## 6. Projeção de Receita

### 6.1 Cenário Conservador

| Marco | Data | Médicos | Pacientes | MRR Estimado |
|-------|------|---------|-----------|--------------|
| Beta | 01/02 | 2 | 50 | R$ 890 |
| Expansão | 28/02 | 5 | 200 | R$ 3.465 |
| 100 usuários | 01/07 | 15 | 85 | R$ 6.000 |
| 600 usuários | 01/01/27 | 80 | 520 | R$ 33.000 |

**Premissas:**
- 80% dos médicos no plano Essencial inicialmente
- 50% dos pacientes convertem após trial
- Churn de 5% ao mês

### 6.2 Cenário Otimista

| Marco | Data | Médicos | Pacientes | MRR Estimado |
|-------|------|---------|-----------|--------------|
| Beta | 01/02 | 2 | 100 | R$ 1.385 |
| Expansão | 28/02 | 8 | 400 | R$ 6.720 |
| 100 usuários | 01/07 | 25 | 75 | R$ 9.500 |
| 600 usuários | 01/01/27 | 120 | 480 | R$ 50.000 |

---

## 7. Comparativo de Mercado

### 7.1 Concorrentes

| Sistema | Preço Médico | Preço Paciente | Observação |
|---------|--------------|----------------|------------|
| iClinic | R$ 199-599/mês | N/A | Sem portal paciente |
| Doctoralia | R$ 299-799/mês | Grátis | Foco em agendamento |
| Amplimed | R$ 149-449/mês | N/A | Básico |
| **GORGEN** | R$ 197-597/mês | R$ 9,90/mês | Completo + Portal |

### 7.2 Diferenciais Competitivos

| Diferencial | GORGEN | Concorrentes |
|-------------|--------|--------------|
| Portal do Paciente | ✅ Pago (barato) | ❌ ou Grátis limitado |
| Secretárias inclusas | ✅ | ❌ Cobram extra |
| Conformidade LGPD | ✅ Nativo | ⚠️ Parcial |
| Criptografia PII | ✅ AES-256 | ⚠️ Variável |
| Backup automático | ✅ Diário | ⚠️ Variável |
| Multi-tenant | ✅ | ⚠️ Limitado |

---

## 8. Recomendações

### 8.1 Para Lançamento Beta (Fev/2026)

| Decisão | Recomendação |
|---------|--------------|
| Cobrar médicos? | **Não** - Trial estendido de 60 dias |
| Cobrar pacientes? | **Não** - Grátis até 01/04 |
| Motivo | Validar produto antes de monetizar |

### 8.2 Para Go-Live Comercial (Abr/2026)

| Decisão | Recomendação |
|---------|--------------|
| Cobrar médicos? | **Sim** - Planos conforme tabela |
| Cobrar pacientes? | **Sim** - R$ 9,90/mês |
| Desconto early adopters? | **Sim** - 50% no primeiro ano |

### 8.3 Promoção de Lançamento Sugerida

```
┌─────────────────────────────────────────────────────────────────┐
│              🚀 PROMOÇÃO DE LANÇAMENTO GORGEN                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MÉDICOS EARLY ADOPTERS (até 01/04/2026)                        │
│  ─────────────────────────────────────────                      │
│  • 60 dias grátis para testar                                   │
│  • 50% de desconto no primeiro ano                              │
│  • Preço travado para sempre                                    │
│                                                                  │
│  Essencial: R$ 98,50/mês → R$ 885/ano                          │
│  Profissional: R$ 173,50/mês → R$ 1.498/ano                    │
│  Clínica: R$ 298,50/mês → R$ 2.498/ano                         │
│                                                                  │
│  PACIENTES                                                      │
│  ─────────────────────────────────────────                      │
│  • Grátis até 01/04/2026                                        │
│  • Depois: R$ 9,90/mês ou R$ 89,90/ano                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Questões para Decisão do CEO

| # | Questão | Opções |
|---|---------|--------|
| 1 | Preços estão adequados? | Ajustar valores |
| 2 | Desconto anual de 25-30% é suficiente? | Aumentar/diminuir |
| 3 | R$ 9,90/mês para pacientes é "no-brainer"? | Ajustar |
| 4 | Cobrar durante beta ou só após? | Beta grátis vs pago |
| 5 | Limite de secretárias por plano? | 1/2/5 ou outros |

---

**Aguardo sua aprovação ou ajustes nos valores.**

*Documento preparado por Manus AI em 19 de Janeiro de 2026*
