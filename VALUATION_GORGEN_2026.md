# 💰 VALUATION DO GORGEN - ANÁLISE DE VALOR

> **Documento de Valuation** | Versão 1.0 | Data: 23/01/2026

Este documento apresenta uma análise de valuation do sistema Gorgen, considerando o estágio atual de desenvolvimento, o mercado de software de gestão em saúde e metodologias padrão de avaliação de empresas SaaS.

---

## 1. CONTEXTO DE MERCADO

### Mercado Global de Software de Gestão de Práticas Médicas

O mercado de software de gestão de práticas médicas (Medical Practice Management Software) apresenta crescimento robusto e consistente. De acordo com pesquisas de mercado recentes, este segmento foi avaliado entre USD 8.87 bilhões e USD 15.31 bilhões em 2024-2025, com projeções de crescimento para USD 18-21 bilhões até 2032, representando um CAGR (taxa de crescimento anual composta) de 8.7% a 15.47%.

O mercado de EHR/EMR (Electronic Health Records / Electronic Medical Records) é ainda maior, avaliado em USD 29.8 bilhões em 2025 com projeção de USD 50 bilhões até 2034, crescendo a um CAGR de 6.3%.

### Múltiplos de Valuation para SaaS em Saúde

Com base em dados de mercado de 2025-2026, os múltiplos de valuation para empresas SaaS variam significativamente conforme o estágio de desenvolvimento e métricas de crescimento. A tabela abaixo apresenta os múltiplos medianos observados no mercado.

| Categoria | Múltiplo EV/Receita | Múltiplo EV/ARR |
|-----------|---------------------|-----------------|
| SaaS Geral (mediana) | 7.0x | 6.0-7.0x |
| SaaS Healthcare | 8.2x | 7.0-9.0x |
| SaaS Alto Crescimento (>40%) | 10.0-15.0x | 10.0-12.0x |
| SaaS Estágio Inicial | 3.0-5.0x | 2.5-4.0x |

O setor de healthcare technology (HealthTech) apresenta múltiplos premium em relação ao SaaS geral, refletindo a natureza regulada do mercado, barreiras de entrada elevadas e alta retenção de clientes.

---

## 2. METODOLOGIAS DE VALUATION

Para avaliar o Gorgen, utilizaremos três metodologias complementares que são padrão no mercado de software.

### 2.1 Método do Custo de Reposição

Este método estima o valor com base no custo de desenvolver um sistema equivalente do zero.

### 2.2 Método de Múltiplos de Receita

Este método aplica múltiplos de mercado à receita anual recorrente (ARR) projetada.

### 2.3 Método de Fluxo de Caixa Descontado (DCF)

Este método projeta fluxos de caixa futuros e os desconta a valor presente.

---

## 3. VALUATION PELO MÉTODO DO CUSTO DE REPOSIÇÃO

### Inventário de Desenvolvimento

| Componente | Linhas de Código | Complexidade | Custo Estimado |
|------------|------------------|--------------|----------------|
| Backend (tRPC + Express) | ~25.000 | Alta | R$ 250.000 |
| Frontend (React + TypeScript) | ~30.000 | Alta | R$ 300.000 |
| Schema de Banco (38 tabelas) | ~5.000 | Média | R$ 50.000 |
| Sistema de Segurança | ~5.000 | Muito Alta | R$ 100.000 |
| Testes Automatizados (431) | ~5.000 | Média | R$ 50.000 |
| Documentação | - | Média | R$ 30.000 |
| **Total Código** | **~70.000** | - | **R$ 780.000** |

### Custos Adicionais de Desenvolvimento

| Item | Custo Estimado |
|------|----------------|
| Arquitetura e Design | R$ 100.000 |
| UX/UI Design | R$ 80.000 |
| Pesquisa e Conformidade (LGPD, CFM) | R$ 50.000 |
| Infraestrutura e DevOps | R$ 40.000 |
| Gestão de Projeto | R$ 50.000 |
| **Total Adicional** | **R$ 320.000** |

### Valor pelo Custo de Reposição

| Componente | Valor |
|------------|-------|
| Desenvolvimento de Código | R$ 780.000 |
| Custos Adicionais | R$ 320.000 |
| **Custo Total de Reposição** | **R$ 1.100.000** |

Este valor representa o custo mínimo para recriar o sistema do zero, assumindo uma equipe experiente e sem atrasos. Na prática, projetos de software frequentemente excedem orçamentos em 50-100%, o que elevaria o custo real para R$ 1.650.000 a R$ 2.200.000.

---

## 4. VALUATION PELO MÉTODO DE MÚLTIPLOS DE RECEITA

### Projeção de Receita (Cenário Conservador)

Considerando o modelo de negócio SaaS multi-tenant do Gorgen, projetamos a receita com base em planos de assinatura.

| Plano | Preço Mensal | Ano 1 (clientes) | Ano 2 (clientes) | Ano 3 (clientes) |
|-------|--------------|------------------|------------------|------------------|
| Free | R$ 0 | 50 | 100 | 150 |
| Basic | R$ 199 | 10 | 30 | 60 |
| Professional | R$ 499 | 5 | 15 | 35 |
| Enterprise | R$ 999 | 1 | 5 | 15 |

### Receita Anual Recorrente (ARR) Projetada

| Ano | Clientes Pagantes | MRR | ARR |
|-----|-------------------|-----|-----|
| Ano 1 | 16 | R$ 5.483 | R$ 65.796 |
| Ano 2 | 50 | R$ 18.425 | R$ 221.100 |
| Ano 3 | 110 | R$ 44.355 | R$ 532.260 |

### Aplicação de Múltiplos

Para uma empresa SaaS em estágio inicial no setor de healthcare, aplicamos múltiplos conservadores.

| Cenário | Múltiplo ARR | ARR Ano 3 | Valuation |
|---------|--------------|-----------|-----------|
| Pessimista | 3.0x | R$ 532.260 | R$ 1.596.780 |
| Base | 5.0x | R$ 532.260 | R$ 2.661.300 |
| Otimista | 8.0x | R$ 532.260 | R$ 4.258.080 |

---

## 5. VALUATION PELO MÉTODO DCF (SIMPLIFICADO)

### Premissas

| Parâmetro | Valor |
|-----------|-------|
| Taxa de Desconto (WACC) | 25% (alto risco, estágio inicial) |
| Taxa de Crescimento Terminal | 5% |
| Margem EBITDA Estabilizada | 30% |
| Período de Projeção | 5 anos |

### Projeção de Fluxo de Caixa

| Ano | Receita | EBITDA (30%) | FCF Estimado |
|-----|---------|--------------|--------------|
| 1 | R$ 65.796 | R$ 19.739 | R$ 15.000 |
| 2 | R$ 221.100 | R$ 66.330 | R$ 50.000 |
| 3 | R$ 532.260 | R$ 159.678 | R$ 120.000 |
| 4 | R$ 958.068 | R$ 287.420 | R$ 216.000 |
| 5 | R$ 1.532.909 | R$ 459.873 | R$ 345.000 |

### Valor Presente dos Fluxos

| Ano | FCF | Fator de Desconto | VP |
|-----|-----|-------------------|-----|
| 1 | R$ 15.000 | 0.80 | R$ 12.000 |
| 2 | R$ 50.000 | 0.64 | R$ 32.000 |
| 3 | R$ 120.000 | 0.51 | R$ 61.200 |
| 4 | R$ 216.000 | 0.41 | R$ 88.560 |
| 5 | R$ 345.000 | 0.33 | R$ 113.850 |
| **Soma VP** | - | - | **R$ 307.610** |

### Valor Terminal

O valor terminal representa o valor da empresa após o período de projeção, assumindo crescimento perpétuo.

Valor Terminal = FCF Ano 5 × (1 + g) / (WACC - g)
Valor Terminal = R$ 345.000 × 1.05 / (0.25 - 0.05)
Valor Terminal = R$ 362.250 / 0.20
Valor Terminal = R$ 1.811.250

VP do Valor Terminal = R$ 1.811.250 × 0.33 = R$ 597.713

### Valuation DCF Total

| Componente | Valor |
|------------|-------|
| VP dos Fluxos de Caixa | R$ 307.610 |
| VP do Valor Terminal | R$ 597.713 |
| **Valuation DCF** | **R$ 905.323** |

---

## 6. SÍNTESE DO VALUATION

### Comparativo das Metodologias

| Metodologia | Valuation |
|-------------|-----------|
| Custo de Reposição | R$ 1.100.000 - R$ 2.200.000 |
| Múltiplos de Receita (Base) | R$ 2.661.300 |
| DCF | R$ 905.323 |

### Valuation Consolidado

Considerando as três metodologias e ponderando-as conforme relevância para o estágio atual do Gorgen, chegamos ao seguinte valuation consolidado.

| Metodologia | Peso | Valuation | Contribuição |
|-------------|------|-----------|--------------|
| Custo de Reposição | 40% | R$ 1.650.000 | R$ 660.000 |
| Múltiplos de Receita | 35% | R$ 2.661.300 | R$ 931.455 |
| DCF | 25% | R$ 905.323 | R$ 226.331 |
| **VALUATION PONDERADO** | **100%** | - | **R$ 1.817.786** |

### Faixa de Valuation Recomendada

| Cenário | Valuation |
|---------|-----------|
| Mínimo | R$ 1.200.000 |
| Base | R$ 1.800.000 |
| Máximo | R$ 2.800.000 |

---

## 7. FATORES QUE IMPACTAM O VALUATION

### Fatores Positivos (Upside)

| Fator | Impacto Potencial |
|-------|-------------------|
| Arquitetura multi-tenant escalável | +20% a +30% |
| Conformidade LGPD/CFM implementada | +15% a +25% |
| Mercado de healthcare em crescimento | +10% a +20% |
| Propriedade intelectual única | +10% a +15% |
| 65.000+ linhas de código testado | +10% a +15% |

### Fatores Negativos (Downside)

| Fator | Impacto Potencial |
|-------|-------------------|
| Estágio pré-receita | -30% a -40% |
| Dependência de um único desenvolvedor | -20% a -30% |
| Mercado brasileiro limitado | -10% a -20% |
| Competição de players estabelecidos | -10% a -15% |
| Necessidade de investimento adicional | -10% a -15% |

---

## 8. COMPARÁVEIS DE MERCADO

### Empresas Comparáveis no Brasil

| Empresa | Segmento | Valuation Estimado | Múltiplo ARR |
|---------|----------|-------------------|--------------|
| iClinic | Gestão de Clínicas | R$ 50-100M | 8-10x |
| Doctoralia | Agendamento | R$ 200-400M | 10-15x |
| Amplimed | Prontuário | R$ 30-60M | 6-8x |
| Feegow | Gestão Integrada | R$ 40-80M | 7-9x |

### Posicionamento do Gorgen

O Gorgen se posiciona como uma solução de nicho para consultórios médicos individuais e pequenas clínicas, com diferencial na arquitetura multi-tenant e conformidade regulatória. Comparado aos players estabelecidos, o Gorgen está em estágio inicial, mas com fundamentos técnicos sólidos.

---

## 9. RECOMENDAÇÕES

### Para Maximizar o Valuation

1. **Completar o lançamento público** até março/2026 para validar o modelo de negócio
2. **Adquirir primeiros clientes pagantes** para demonstrar tração
3. **Documentar métricas de retenção** (churn, LTV, CAC)
4. **Expandir equipe** para reduzir dependência de pessoa-chave
5. **Buscar certificações** (ISO 27001, SOC 2) para aumentar credibilidade

### Próximos Passos para Captação

| Etapa | Prazo | Objetivo |
|-------|-------|----------|
| Lançamento Beta | Mar/2026 | Validar produto |
| 50 clientes pagantes | Jun/2026 | Provar tração |
| Seed Round | Set/2026 | R$ 500K - R$ 1M |
| 200 clientes | Dez/2026 | Escalar |
| Series A | 2027 | R$ 3M - R$ 5M |

---

## 10. CONCLUSÃO

O Gorgen possui um valuation estimado entre **R$ 1.200.000 e R$ 2.800.000** no estágio atual, com valor base de **R$ 1.800.000**. Este valor reflete o investimento significativo em desenvolvimento (65.000+ linhas de código), a arquitetura técnica robusta (multi-tenant, segurança, conformidade) e o potencial de mercado do setor de healthcare.

O valuation pode aumentar significativamente (2x a 5x) nos próximos 12-24 meses com a validação do modelo de negócio, aquisição de clientes pagantes e demonstração de métricas de crescimento.

---

**Documento preparado por:** Manus AI  
**Data:** 23/01/2026  
**Disclaimer:** Esta análise é baseada em informações disponíveis e projeções. Valores reais podem variar significativamente conforme condições de mercado e execução do negócio.
