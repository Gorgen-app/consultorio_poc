# Projeto de Reestruturação do Dashboard - GORGEN v3.0

> **Documento de Especificação Técnica**  
> Versão: 1.0 | Data: 13/01/2026  
> Status: Aguardando Aprovação

---

## 1. Resumo Executivo

Este documento consolida todos os requisitos, padrões de conduta e especificações técnicas para a reestruturação completa do Dashboard do sistema Gorgen. O objetivo é criar uma interface limpa, funcional e alinhada com os pilares fundamentais do sistema.

---

## 2. Problemas Identificados na Versão Atual

| Problema | Descrição | Impacto |
|----------|-----------|---------|
| Formatação monetária inconsistente | Valores não seguem padrão brasileiro (R$ X.XXX,XX) | Confusão na leitura de dados financeiros |
| Agrupamento de categorias não aplicado | Convênios com <5% não são agrupados como "Outros" | Gráficos poluídos e difíceis de interpretar |
| Layout da galeria de widgets confuso | Texto "No Dashboard" redundante, scroll não funciona | Experiência de usuário prejudicada |
| Seletor de tempo global desnecessário | Cada widget já tem seu próprio controle de período | Interface poluída |
| Botão "Salvar" sem função clara | Confunde o usuário sobre quando salvar | Incerteza na operação |

---

## 3. Requisitos Consolidados

### 3.1 Header do Dashboard

O header deve conter apenas:
- **Título**: "Dashboard"
- **Subtítulo**: Contador de widgets e slots utilizados (ex: "16 widgets · 16/12 slots utilizados")
- **Ícone de engrenagem**: Único botão para acessar configurações de widgets

**Elementos removidos:**
- Seletor de tempo global (cada widget tem o seu)
- Botão "Salvar" (auto-save ou desnecessário)

### 3.2 Formatação de Valores

| Tipo de Dado | Formato | Exemplo |
|--------------|---------|---------|
| Monetário | R$ X.XXX,XX | R$ 18.362,92 |
| Percentual | XX,X% | 51,0% |
| Inteiro | X.XXX | 21.647 |
| Decimal | X,XX | 0,5 |

**Implementação técnica:**
```typescript
// Monetário
new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

// Percentual
new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(valor / 100)

// Inteiro
new Intl.NumberFormat('pt-BR').format(valor)
```

### 3.3 Regra de Agrupamento "Outros"

**Padrão de conduta obrigatório:** Sempre que uma variável categórica tiver categorias com menos de 5% do total, agrupar essas categorias sob o nome "Outros".

**Aplicação:**
- Distribuição por Convênio (pacientes)
- Distribuição por Convênio (atendimentos)
- Distribuição por Convênio (faturamento)
- Distribuição por Cidade
- Distribuição por Sexo
- Qualquer outro gráfico de pizza ou barra com categorias

**Algoritmo:**
```typescript
function agruparCategoriasOutros(dados: Array<{nome: string, valor: number}>, limitePercentual = 5) {
  const total = dados.reduce((acc, item) => acc + item.valor, 0);
  if (total === 0) return dados;
  
  const limiteAbsoluto = (limitePercentual / 100) * total;
  const categoriasGrandes = [];
  let somaOutros = 0;
  
  for (const item of dados) {
    if (item.valor >= limiteAbsoluto) {
      categoriasGrandes.push(item);
    } else {
      somaOutros += item.valor;
    }
  }
  
  if (somaOutros > 0) {
    categoriasGrandes.push({ nome: 'Outros', valor: somaOutros });
  }
  
  return categoriasGrandes;
}
```

### 3.4 Galeria de Widgets (Configuração)

**Layout:**
- Modal centralizado com overlay escuro
- Todos os widgets lado a lado em grid responsivo
- Sem separação por categoria/grupo de métricas
- Busca por nome do widget

**Indicação de seleção:**
- Widget selecionado: borda azul + ícone de check
- Widget não selecionado: borda cinza clara
- **Removido**: Texto "No Dashboard" (redundante)

**Interação:**
- Clique para selecionar/desselecionar
- Contador de slots utilizados visível
- Botão "Concluído" para fechar

### 3.5 Widgets Disponíveis

| ID | Nome | Categoria | Tipo Gráfico | Tamanhos |
|----|------|-----------|--------------|----------|
| pop_total_ativos | Total de Pacientes Ativos | População | Número | micro, pequeno |
| pop_novos_pacientes | Novos Pacientes | População | Linha | pequeno, médio, grande |
| pop_dist_sexo | Distribuição por Sexo | População | Pizza | pequeno, médio |
| pop_dist_faixa_etaria | Distribuição por Faixa Etária | População | Barra | pequeno, médio, grande |
| pop_dist_cidade | Distribuição Geográfica | População | Barra | médio, grande |
| pop_taxa_retencao | Taxa de Retenção | População | Gauge | pequeno, médio |
| pop_tempo_acompanhamento | Tempo Médio de Acompanhamento | População | Número | micro, pequeno |
| atd_total | Total de Atendimentos | Atendimentos | Número | micro, pequeno |
| atd_evolucao | Evolução de Atendimentos | Atendimentos | Linha | pequeno, médio, grande |
| fin_faturamento_total | Faturamento Total | Financeiro | Número | pequeno, médio |
| fin_faturamento_convenio | Faturamento por Convênio | Financeiro | Pizza | pequeno, médio, grande |
| fin_taxa_recebimento | Taxa de Recebimento | Financeiro | Gauge | pequeno, médio |

### 3.6 Sistema de Slots

| Tamanho | Custo em Slots | Dimensão Visual |
|---------|----------------|-----------------|
| Micro | 0.5 | 1/4 de coluna |
| Pequeno | 1 | 1/2 coluna |
| Médio | 2 | 1 coluna |
| Grande | 4 | 2 colunas |

**Limite total:** 12 slots por Dashboard

---

## 4. Arquitetura Proposta

### 4.1 Estrutura de Arquivos

```
client/src/
├── pages/
│   └── Dashboard.tsx          # Página principal (simplificada)
├── components/
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx    # Header com título e engrenagem
│   │   ├── DashboardGrid.tsx      # Grid de widgets com drag-and-drop
│   │   ├── WidgetCard.tsx         # Card individual de widget
│   │   └── WidgetGallery.tsx      # Modal de configuração
│   └── widgets/
│       ├── NumeroWidget.tsx       # Widget de número simples
│       ├── GraficoLinhaWidget.tsx # Widget de gráfico de linha
│       ├── GraficoPizzaWidget.tsx # Widget de gráfico de pizza
│       ├── GraficoBarraWidget.tsx # Widget de gráfico de barra
│       └── GaugeWidget.tsx        # Widget de gauge/medidor
server/
├── dashboardMetricas.ts       # Funções de métricas (com agrupamento)
└── routers.ts                 # Endpoints tRPC
```

### 4.2 Fluxo de Dados

1. **Carregamento**: Dashboard carrega configuração do usuário do banco
2. **Renderização**: Grid renderiza widgets baseado na configuração
3. **Dados**: Cada widget faz sua própria query com período individual
4. **Agrupamento**: Backend aplica regra de "Outros" antes de retornar dados
5. **Formatação**: Frontend formata valores conforme tipo (monetário, percentual, etc.)

---

## 5. Checklist de Implementação

### Fase 1: Limpeza e Preparação
- [ ] Remover código legado do Dashboard atual
- [ ] Criar estrutura de componentes modular
- [ ] Implementar função de agrupamento no backend

### Fase 2: Backend
- [ ] Aplicar agrupamento em todas as queries de distribuição
- [ ] Verificar formatação de retorno das métricas
- [ ] Criar testes para função de agrupamento

### Fase 3: Frontend - Estrutura
- [ ] Criar DashboardHeader simplificado
- [ ] Criar DashboardGrid com sistema de slots
- [ ] Criar WidgetCard com controles individuais

### Fase 4: Frontend - Widgets
- [ ] Implementar NumeroWidget com formatação correta
- [ ] Implementar GraficoPizzaWidget com legenda
- [ ] Implementar GraficoBarraWidget horizontal
- [ ] Implementar GraficoLinhaWidget com área
- [ ] Implementar GaugeWidget circular

### Fase 5: Frontend - Galeria
- [ ] Criar modal de galeria com grid simples
- [ ] Implementar seleção visual (borda azul + check)
- [ ] Implementar busca por nome
- [ ] Implementar contador de slots

### Fase 6: Testes e Validação
- [ ] Testar formatação monetária em todos os widgets
- [ ] Testar agrupamento "Outros" em todos os gráficos
- [ ] Testar responsividade em diferentes telas
- [ ] Validar com usuário final

---

## 6. Critérios de Aceite

1. **Formatação monetária**: Todos os valores em R$ devem usar ponto para milhares e vírgula para decimais
2. **Agrupamento**: Nenhum gráfico deve exibir categorias com menos de 5% individualmente
3. **Interface limpa**: Header apenas com título e engrenagem
4. **Galeria funcional**: Scroll funcionando, seleção clara, sem texto redundante
5. **Performance**: Dashboard deve carregar em menos de 3 segundos

---

## 7. Próximos Passos

Após aprovação deste documento:

1. Criar branch de desenvolvimento `feature/dashboard-v3`
2. Implementar backend com agrupamento
3. Implementar frontend modular
4. Testes unitários e de integração
5. Validação com usuário
6. Merge para produção

---

**Aguardando aprovação para iniciar implementação.**
