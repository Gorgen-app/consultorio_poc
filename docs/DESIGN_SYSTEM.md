# 🎨 GORGEN Design System

> **Documento de Referência** | Versão 1.0 | Atualizado em 17/01/2026

Este documento define os padrões visuais e de design do sistema Gorgen, garantindo consistência visual em todas as interfaces e componentes.

---

## Índice

1. [Filosofia de Design](#1-filosofia-de-design)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Componentes de Widget](#4-componentes-de-widget)
5. [Temas Light e Dark](#5-temas-light-e-dark)
6. [Guia de Implementação](#6-guia-de-implementação)

---

## 1. Filosofia de Design

O design do Gorgen segue princípios fundamentais que priorizam a experiência do usuário em ambiente médico:

**Simplicidade com Profundidade sob Demanda**: A interface deve ser limpa e descomplicada na visualização principal, mas permitir acesso rápido a informações detalhadas com um único clique quando necessário.

**Redução de Fadiga Visual**: Cores suaves e contrastes adequados para uso prolongado, especialmente importante em ambientes clínicos onde o sistema é utilizado por longos períodos.

**Profissionalismo Médico**: Aparência elegante e profissional que transmite confiança e seriedade, adequada ao contexto de saúde.

---

## 2. Paleta de Cores

### 2.1 Cor Primária - Opção B (Azul Claro)

A paleta principal do Gorgen é baseada no **Azul Claro #6B8CBE**, escolhida por sua aparência profissional e menor fadiga visual.

| Variável | Light Mode | Dark Mode | Uso |
|----------|------------|-----------|-----|
| `--primary` | #6B8CBE | #8BA3C9 | Cor principal de destaque |
| `--primary-foreground` | #FFFFFF | #1E2D45 | Texto sobre cor primária |

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
| Fundo | #F5F7FA (light) / #1E2D45 (dark) | `bg-sidebar` |
| Borda | 1px solid | `border border-widget` |
| Cor da Borda | #E2E8F0 (light) / #334155 (dark) | `border-widget` |
| Arredondamento | 8px | `rounded-lg` |
| Sombra (hover) | shadow-md | `hover:shadow-md` |

### 4.2 Classes de Texto para Widgets

Para garantir contraste adequado em ambos os temas (light e dark), utilize as seguintes classes:

| Classe | Light Mode | Dark Mode | Uso |
|--------|------------|-----------|-----|
| `.text-widget-title` | #1E293B (slate-800) | #F1F5F9 (slate-100) | Títulos de widgets |
| `.text-widget-description` | #475569 (slate-600) | #CBD5E1 (slate-300) | Descrições |
| `.text-widget-label` | #334155 (slate-700) | #E2E8F0 (slate-200) | Labels e rótulos |
| `.text-widget-value` | #0F172A (slate-900) | #FFFFFF (white) | Valores numéricos |
| `.text-widget-icon` | #64748B (slate-500) | #94A3B8 (slate-400) | Ícones |

### 4.3 Tamanhos de Widget

| Tamanho | Dimensões | Uso |
|---------|-----------|-----|
| Micro | 1 coluna × 150px altura | Métricas numéricas simples |
| Pequeno | 1 coluna × altura automática | Gráficos pequenos |
| Médio | 2 colunas × altura automática | Gráficos médios |
| Grande | 4 colunas × altura automática | Gráficos complexos |

---

## 5. Temas Light e Dark

### 5.1 Tema Light (Padrão)

O tema light é o padrão do sistema, otimizado para uso diurno:

```css
:root {
  --background: #FFFFFF;
  --foreground: #1A2B47;
  --sidebar: #F5F7FA;
  --card: #FFFFFF;
  --border: #E2E8F0;
}
```

### 5.2 Tema Dark

O tema dark é otimizado para uso noturno ou ambientes com baixa luminosidade:

```css
.dark {
  --background: #0D1729;
  --foreground: #F3F4F6;
  --sidebar: #1E2D45;
  --card: #152238;
  --border: #334155;
}
```

### 5.3 Transição entre Temas

A transição entre temas deve ser suave:

```css
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

---

## 6. Guia de Implementação

### 6.1 Estrutura de um Widget

```tsx
<Card className="bg-sidebar border border-widget">
  <div className="p-4">
    <h3 className="text-widget-title font-semibold text-sm">
      Título do Widget
    </h3>
    <p className="text-widget-description text-xs mt-1">
      Descrição do widget
    </p>
    <div className="text-widget-value text-2xl font-bold mt-4">
      1.234
    </div>
    <span className="text-widget-label text-sm">
      unidade
    </span>
  </div>
</Card>
```

### 6.2 Estrutura de uma Tabela

```tsx
<div className="rounded-md border border-widget overflow-x-auto bg-sidebar">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-widget-label">Coluna</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="text-widget-description">Valor</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 6.3 Boas Práticas

1. **Sempre use classes semânticas**: Prefira `.text-widget-title` em vez de `text-slate-800` para garantir compatibilidade com dark mode.

2. **Mantenha consistência**: Todos os widgets devem seguir o mesmo padrão visual.

3. **Teste em ambos os temas**: Verifique se o contraste é adequado tanto no tema light quanto no dark.

4. **Evite cores hardcoded**: Use as variáveis CSS definidas para facilitar manutenção.

5. **Priorize legibilidade**: O contraste mínimo deve ser 4.5:1 para texto normal e 3:1 para texto grande.

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 17/01/2026 | Versão inicial do Design System |

---

**Autor**: Manus AI  
**Última atualização**: 17 de Janeiro de 2026
