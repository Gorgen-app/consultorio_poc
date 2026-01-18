# 🎨 GORGEN Design System

> **Documento de Referência** | Versão 1.1 | Atualizado em 17/01/2026

Este documento define os padrões visuais e de design do sistema Gorgen, garantindo consistência visual em todas as interfaces e componentes.

---

## Índice

1. [Filosofia de Design](#1-filosofia-de-design)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Componentes de Widget](#4-componentes-de-widget)
5. [Guia de Implementação](#5-guia-de-implementação)

---

## 1. Filosofia de Design

O design do Gorgen segue princípios fundamentais que priorizam a experiência do usuário em ambiente médico:

**Simplicidade com Profundidade sob Demanda**: A interface deve ser limpa e descomplicada na visualização principal, mas permitir acesso rápido a informações detalhadas com um único clique quando necessário.

**Redução de Fadiga Visual**: Cores suaves e contrastes adequados para uso prolongado, especialmente importante em ambientes clínicos onde o sistema é utilizado por longos períodos.

**Profissionalismo Médico**: Aparência elegante e profissional que transmite confiança e seriedade, adequada ao contexto de saúde.

**Tema Único (Light)**: O Gorgen utiliza exclusivamente o tema light, otimizado para ambientes clínicos com boa iluminação.

---

## 2. Paleta de Cores

### 2.1 Cor Primária - Opção B (Azul Claro)

A paleta principal do Gorgen é baseada no **Azul Claro #6B8CBE**, escolhida por sua aparência profissional e menor fadiga visual.

| Variável | Valor | Uso |
|----------|-------|-----|
| `--primary` | #6B8CBE | Cor principal de destaque |
| `--primary-foreground` | #FFFFFF | Texto sobre cor primária |
| `--background` | #FFFFFF | Fundo principal |
| `--foreground` | #1A2B47 | Texto principal |
| `--sidebar` | #F5F7FA | Fundo da sidebar e widgets |

### 2.2 Cores Complementares

| Nome | Código Hex | Variável CSS | Uso |
|------|------------|--------------|-----|
| Rosa/Bordô | #BE6B7D | `--gorgen-rose` | Cirurgias, alertas suaves |
| Roxo | #8E7DBE | `--gorgen-purple` | Visitas, categorias especiais |
| Dourado | #BEA06B | `--gorgen-gold` | Procedimentos, destaques |
| Ciano | #6BB0BE | `--gorgen-cyan` | Exames, informações |

### 2.3 Cores de Gráficos

As cores para visualizações de dados seguem uma progressão harmônica:

```css
--chart-1: #6B8CBE;  /* Azul Claro - Primário */
--chart-2: #BE6B7D;  /* Rosa/Bordô */
--chart-3: #8E7DBE;  /* Roxo */
--chart-4: #BEA06B;  /* Dourado */
--chart-5: #6BB0BE;  /* Ciano */
```

### 2.4 Cores de Tipos de Compromisso (Agenda)

| Tipo | Cor | Classe CSS |
|------|-----|------------|
| Consulta | #6B8CBE | `.bg-tipo-consulta` |
| Cirurgia | #BE6B7D | `.bg-tipo-cirurgia` |
| Visita | #8E7DBE | `.bg-tipo-visita` |
| Procedimento | #BEA06B | `.bg-tipo-procedimento` |
| Exame | #6BB0BE | `.bg-tipo-exame` |
| Reunião | #8A8A8A | `.bg-tipo-reuniao` |
| Bloqueio | #ABABAB | `.bg-tipo-bloqueio` |

### 2.5 Cores de Contraste para Texto

| Elemento | Cor | Classe Tailwind | Uso |
|----------|-----|-----------------|-----|
| Títulos | #1E293B | `text-slate-800` | Títulos de widgets e seções |
| Descrições | #475569 | `text-slate-600` | Textos auxiliares |
| Labels | #334155 | `text-slate-700` | Rótulos de campos |
| Valores | #0F172A | `text-slate-900` | Valores numéricos importantes |
| Ícones | #64748B | `text-slate-500` | Ícones e elementos secundários |

---

## 3. Tipografia

### 3.1 Família de Fontes

O Gorgen utiliza a família **Inter** como fonte principal, conhecida por sua excelente legibilidade em interfaces digitais.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Carregamento via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### 3.2 Escala Tipográfica

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| Título Principal (H1) | 32px | 700 (Bold) | Títulos de página |
| Título Secundário (H2) | 24px | 600 (Semibold) | Seções principais |
| Título de Seção (H3) | 18px | 600 (Semibold) | Subtítulos |
| Título de Widget | 14px | 600 (Semibold) | Cabeçalhos de cards |
| Corpo de Texto | 14px | 400 (Regular) | Texto padrão |
| Descrição | 12px | 400 (Regular) | Textos auxiliares |
| Label | 12px | 500 (Medium) | Rótulos de campos |
| Valor Numérico Grande | 32px | 700 (Bold) | KPIs e métricas |
| Valor Numérico Médio | 24px | 700 (Bold) | Valores em widgets |

### 3.3 Espaçamento de Linha

```css
line-height: 1.5;      /* Texto padrão */
line-height: 1.2;      /* Títulos */
line-height: 1.0;      /* Valores numéricos grandes */
```

### 3.4 Tracking (Letter Spacing)

```css
letter-spacing: -0.025em;  /* Valores numéricos grandes (tracking-tight) */
letter-spacing: 0;         /* Texto padrão */
```

---

## 4. Componentes de Widget

### 4.1 Estrutura Visual Padrão

Todos os widgets do Gorgen seguem uma estrutura visual consistente:

| Propriedade | Valor | Classe CSS |
|-------------|-------|------------|
| Fundo | #F5F7FA | `bg-sidebar` |
| Borda | 1px solid #E2E8F0 | `border border-slate-200` |
| Arredondamento | 8px | `rounded-lg` |
| Sombra (hover) | shadow-md | `hover:shadow-md` |

### 4.2 Tamanhos de Widget

| Tamanho | Dimensões | Uso |
|---------|-----------|-----|
| Micro | 1 coluna × 150px altura | Métricas numéricas simples |
| Pequeno | 1 coluna × altura automática | Gráficos pequenos |
| Médio | 2 colunas × altura automática | Gráficos médios |
| Grande | 4 colunas × altura automática | Gráficos complexos |

---

## 5. Guia de Implementação

### 5.1 Estrutura de um Widget

```tsx
<Card className="bg-sidebar border border-slate-200 rounded-lg">
  <div className="p-4">
    <h3 className="text-slate-800 font-semibold text-sm">
      Título do Widget
    </h3>
    <p className="text-slate-600 text-xs mt-1">
      Descrição do widget
    </p>
    <div className="text-slate-900 text-2xl font-bold mt-4">
      1.234
    </div>
    <span className="text-slate-700 text-sm">
      unidade
    </span>
  </div>
</Card>
```

### 5.2 Estrutura de uma Tabela

```tsx
<div className="rounded-md border border-slate-200 overflow-x-auto bg-sidebar">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-slate-700">Coluna</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="text-slate-600">Valor</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 5.3 Boas Práticas

1. **Use classes Tailwind padrão**: Prefira `text-slate-800` para títulos e `text-slate-600` para descrições.

2. **Mantenha consistência**: Todos os widgets devem seguir o mesmo padrão visual com `bg-sidebar` e `border-slate-200`.

3. **Priorize legibilidade**: O contraste mínimo deve ser 4.5:1 para texto normal e 3:1 para texto grande.

4. **Evite cores hardcoded**: Use as variáveis CSS definidas para facilitar manutenção.

5. **Siga a escala tipográfica**: Use os tamanhos e pesos definidos para manter hierarquia visual.

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.1 | 17/01/2026 | Removido suporte a dark mode; apenas tema light |
| 1.0 | 17/01/2026 | Versão inicial do Design System |

---

**Autor**: Manus AI  
**Última atualização**: 17 de Janeiro de 2026
