# 🎨 MANIFESTO DE IDENTIDADE VISUAL GORGEN

> **Documento de Referência** | Versão 1.0 | Janeiro 2026

Este documento define a identidade visual oficial do sistema Gorgen, incluindo paleta de cores, tipografia e diretrizes de uso.

---

## 1. FILOSOFIA DE DESIGN

O design do Gorgen foi concebido para transmitir:

- **Confiança** - Cores sóbrias e profissionais adequadas ao ambiente médico
- **Clareza** - Tipografia legível para longas sessões de trabalho
- **Acessibilidade** - Contraste adequado para reduzir fadiga visual
- **Modernidade** - Interface contemporânea sem ser excessivamente minimalista

---

## 2. PALETA DE CORES

### 2.1 Cor Primária: Azul Claro

A cor primária do Gorgen é um **Azul Claro** (#6B8CBE), escolhido por:
- Transmitir profissionalismo e confiança
- Reduzir fadiga visual em uso prolongado
- Harmonizar com ambientes de saúde

| Variação | Código Hex | Uso |
|----------|------------|-----|
| **Primary 50** | `#F5F7FA` | Backgrounds sutis |
| **Primary 100** | `#E8EDF5` | Hover states, sidebar |
| **Primary 200** | `#D1DBEA` | Bordas, divisores |
| **Primary 300** | `#A8BEDA` | Elementos desabilitados |
| **Primary 400** | `#8BA3C9` | Dark mode primary |
| **Primary 500** | `#6B8CBE` | **Cor principal** |
| **Primary 600** | `#5A7DB0` | Hover em botões |
| **Primary 700** | `#4A6A9A` | Textos de destaque |
| **Primary 800** | `#3B5580` | Elementos escuros |
| **Primary 900** | `#2E4366` | Headers, títulos |
| **Primary 950** | `#1E2D45` | Dark mode background |

### 2.2 Cor de Destaque (Accent): Rosa/Bordô

Cor complementar harmônica com o azul, usada para destaques e alertas suaves.

| Variação | Código Hex | Uso |
|----------|------------|-----|
| **Accent 100** | `#F9E8EB` | Background de badges |
| **Accent 400** | `#D08A96` | Dark mode accent |
| **Accent 500** | `#BE6B7D` | Cor de destaque principal |
| **Accent 600** | `#A85A6B` | Hover em elementos accent |

### 2.3 Cores Complementares

| Nome | Código Hex | Uso |
|------|------------|-----|
| **Purple** | `#8E7DBE` | Gráficos, categorias |
| **Gold** | `#BEA06B` | Destaques premium |
| **Cyan** | `#6BB0BE` | Informações, links |
| **Gray Medium** | `#8A8A8A` | Textos secundários |
| **Gray Light** | `#ABABAB` | Placeholders |

### 2.4 Cores Semânticas

| Função | Cor Principal | Cor de Fundo | Uso |
|--------|---------------|--------------|-----|
| **Success** | `#10B981` | `#D1FAE5` | Confirmações, sucesso |
| **Warning** | `#F59E0B` | `#FEF3C7` | Alertas, atenção |
| **Error** | `#EF4444` | `#FEE2E2` | Erros, exclusões |
| **Info** | `#3B82F6` | `#DBEAFE` | Informações, dicas |

### 2.5 Cores Neutras

| Variação | Código Hex | Uso |
|----------|------------|-----|
| **Gray 50** | `#F9FAFB` | Background principal |
| **Gray 100** | `#F3F4F6` | Cards, containers |
| **Gray 200** | `#E5E7EB` | Bordas, divisores |
| **Gray 300** | `#D1D5DB` | Inputs desabilitados |
| **Gray 400** | `#9CA3AF` | Placeholders |
| **Gray 500** | `#6B7280` | Textos secundários |
| **Gray 700** | `#374151` | Textos principais |
| **Gray 900** | `#111827` | Títulos, headers |

### 2.6 Paleta para Gráficos

Cores otimizadas para visualização de dados:

| Posição | Light Mode | Dark Mode | Uso sugerido |
|---------|------------|-----------|--------------|
| Chart 1 | `#6B8CBE` | `#8BA3C9` | Série principal |
| Chart 2 | `#BE6B7D` | `#D08A96` | Série secundária |
| Chart 3 | `#8E7DBE` | `#A899D0` | Série terciária |
| Chart 4 | `#BEA06B` | `#D0BA8A` | Série quaternária |
| Chart 5 | `#6BB0BE` | `#8AC9D0` | Série quinária |

---

## 3. TIPOGRAFIA

### 3.1 Família Tipográfica: Inter

O Gorgen utiliza a fonte **Inter** como tipografia principal, escolhida por:
- Excelente legibilidade em telas
- Ampla variedade de pesos
- Otimizada para interfaces digitais
- Licença open source (Google Fonts)

**CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Escala Tipográfica

| Elemento | Peso | Tamanho | Line Height | Uso |
|----------|------|---------|-------------|-----|
| **Display** | 700 (Bold) | 48px | 1.1 | Landing page hero |
| **H1** | 700 (Bold) | 32px | 1.2 | Títulos de página |
| **H2** | 600 (Semibold) | 24px | 1.3 | Seções principais |
| **H3** | 600 (Semibold) | 20px | 1.4 | Subtítulos |
| **H4** | 500 (Medium) | 18px | 1.4 | Cards, labels |
| **Body** | 400 (Regular) | 16px | 1.5 | Texto principal |
| **Body Small** | 400 (Regular) | 14px | 1.5 | Texto secundário |
| **Caption** | 400 (Regular) | 12px | 1.4 | Legendas, hints |
| **Label** | 500 (Medium) | 14px | 1.4 | Labels de formulário |

### 3.3 Pesos Disponíveis

| Peso | Valor | Uso |
|------|-------|-----|
| **Light** | 300 | Textos decorativos |
| **Regular** | 400 | Corpo de texto |
| **Medium** | 500 | Labels, botões |
| **Semibold** | 600 | Subtítulos, destaques |
| **Bold** | 700 | Títulos, headers |

---

## 4. APLICAÇÕES

### 4.1 Light Mode (Padrão)

```css
--background: #FFFFFF;
--foreground: #111827;
--primary: #6B8CBE;
--primary-foreground: #FFFFFF;
--card: #FFFFFF;
--card-foreground: #111827;
--border: #E5E7EB;
```

### 4.2 Dark Mode

```css
--background: #0D1729;
--foreground: #F3F4F6;
--primary: #8BA3C9;
--primary-foreground: #1E2D45;
--card: #152238;
--card-foreground: #F3F4F6;
--border: #1A2B47;
```

### 4.3 Sidebar

| Elemento | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `#F5F7FA` | `#1E2D45` |
| Foreground | `#111827` | `#F3F4F6` |
| Primary | `#5A7DB0` | `#A8BEDA` |
| Accent | `#E8EDF5` | `#2E4366` |
| Border | `#D1DBEA` | `#2E4366` |

---

## 5. COMPONENTES VISUAIS

### 5.1 Bordas e Raios

| Elemento | Raio |
|----------|------|
| **Botões pequenos** | 4px (0.25rem) |
| **Botões, inputs** | 6px (0.375rem) |
| **Cards** | 8px (0.5rem) |
| **Modais** | 12px (0.75rem) |
| **Badges** | 9999px (full) |

### 5.2 Sombras

| Tipo | Valor CSS |
|------|-----------|
| **Elevação baixa** | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| **Elevação alta** | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |

### 5.3 Badges Semânticos

```css
.badge-success { background: #D1FAE5; color: #065F46; }
.badge-warning { background: #FEF3C7; color: #92400E; }
.badge-error   { background: #FEE2E2; color: #991B1B; }
.badge-info    { background: #DBEAFE; color: #1E40AF; }
```

---

## 6. DIRETRIZES DE USO

### 6.1 Contraste e Acessibilidade

- Manter ratio de contraste mínimo de **4.5:1** para textos
- Usar cores semânticas consistentemente
- Evitar usar apenas cor para transmitir informação

### 6.2 Consistência

- Usar a paleta primária para ações principais
- Usar cores de destaque com moderação
- Manter hierarquia visual através de pesos tipográficos

### 6.3 Contexto Médico

- Evitar vermelho excessivo (associação com emergência)
- Preferir tons suaves e profissionais
- Garantir legibilidade em ambientes com iluminação variada

---

## 7. ARQUIVOS DE REFERÊNCIA

| Arquivo | Localização |
|---------|-------------|
| CSS Variables | `client/src/index.css` |
| Fonte Inter | Google Fonts CDN |
| Componentes UI | `client/src/components/ui/` |

---

**Gorgen Design System v1.0**
*Gestão em Saúde com Arquitetura de Rede Social*
