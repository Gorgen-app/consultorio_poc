# 🎨 Paleta de Cores do GORGEN

> **Documento de Referência** | Versão 3.9.6 | Atualizado em 18/01/2026

Este documento lista todas as cores utilizadas atualmente no sistema Gorgen e suas aplicações.

---

## 📋 Índice

1. [Cor Primária](#1-cor-primária)
2. [Cores de Texto](#2-cores-de-texto)
3. [Cores de Background](#3-cores-de-background)
4. [Cores Semânticas](#4-cores-semânticas)
5. [Cores de Gráficos](#5-cores-de-gráficos)
6. [Cores de Tipo de Compromisso (Agenda)](#6-cores-de-tipo-de-compromisso-agenda)
7. [Cores de Status de Agendamento](#7-cores-de-status-de-agendamento)
8. [Cores Complementares](#8-cores-complementares)
9. [Cores Neutras](#9-cores-neutras)
10. [Cores de Widgets](#10-cores-de-widgets)

---

## 1. Cor Primária

A cor primária do Gorgen é baseada na **Paleta Opção B - Azul Claro**.

| Código | Nome | Aplicação |
|--------|------|-----------|
| `#6B8CBE` | **Azul Claro Principal** | Botões primários, links, bordas de foco, ícones de destaque |
| `#5A7DB0` | Azul Claro 600 | Sidebar primária, hover de botões |
| `#4A6A9A` | Azul Claro 700 | Texto de destaque (substituído por #0056A4) |
| `#3B5580` | Azul Claro 800 | Títulos escuros |
| `#2E4366` | Azul Claro 900 | Texto muito escuro |
| `#1E2D45` | Azul Claro 950 | Background sidebar dark |

### Escala Completa da Cor Primária

| Código | Variável CSS | Aplicação |
|--------|--------------|-----------|
| `#F5F7FA` | `--gorgen-primary-50` | Background de widgets, sidebar light |
| `#E8EDF5` | `--gorgen-primary-100` | Background de hover, accent light |
| `#D1DBEA` | `--gorgen-primary-200` | Bordas sutis |
| `#A8BEDA` | `--gorgen-primary-300` | Bordas de destaque |
| `#8BA3C9` | `--gorgen-primary-400` | Ícones secundários |
| `#6B8CBE` | `--gorgen-primary-500` | **Cor primária principal** |
| `#5A7DB0` | `--gorgen-primary-600` | Hover de botões |
| `#4A6A9A` | `--gorgen-primary-700` | Texto de destaque |
| `#3B5580` | `--gorgen-primary-800` | Títulos |
| `#2E4366` | `--gorgen-primary-900` | Texto escuro |
| `#1E2D45` | `--gorgen-primary-950` | Background dark |

---

## 2. Cores de Texto

| Código | Nome | Aplicação |
|--------|------|-----------|
| `#0056A4` | **Azul de Alto Contraste** | Links, nomes de pacientes, texto azul clicável |
| `#111827` | Foreground | Texto principal (body) |
| `#374151` | Secondary Foreground | Texto secundário |
| `#6B7280` | Muted Foreground | Texto desabilitado, placeholders |
| `#1E293B` | Widget Title | Títulos de widgets (slate-800) |
| `#475569` | Widget Description | Descrições de widgets (slate-600) |
| `#334155` | Widget Label | Labels de widgets (slate-700) |
| `#0F172A` | Widget Value | Valores numéricos de widgets (slate-900) |
| `#64748B` | Widget Icon | Ícones de widgets (slate-500) |

---

## 3. Cores de Background

| Código | Nome | Aplicação |
|--------|------|-----------|
| `#FFFFFF` | Background | Fundo principal da aplicação |
| `#F5F7FA` | Sidebar | Fundo da sidebar e widgets |
| `#F3F4F6` | Secondary | Cards secundários, muted areas |
| `#E8EDF5` | Sidebar Accent | Hover de itens na sidebar |
| `#E5E7EB` | Border | Bordas padrão |

---

## 4. Cores Semânticas

### Sucesso (Success)
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#10B981` | Success | Ícones de sucesso, badges de confirmação |
| `#D1FAE5` | Success Light | Background de badges de sucesso |
| `#065F46` | Success Text | Texto em badges de sucesso |

### Aviso (Warning)
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#F59E0B` | Warning | Ícones de aviso, alertas |
| `#FEF3C7` | Warning Light | Background de badges de aviso |
| `#92400E` | Warning Text | Texto em badges de aviso |

### Erro (Error)
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#EF4444` | Error | Ícones de erro, botões destrutivos |
| `#FEE2E2` | Error Light | Background de badges de erro |
| `#991B1B` | Error Text | Texto em badges de erro |

### Informação (Info)
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#3B82F6` | Info | Ícones de informação |
| `#DBEAFE` | Info Light | Background de badges de info |
| `#1E40AF` | Info Text | Texto em badges de info |

---

## 5. Cores de Gráficos

| Código | Variável | Aplicação |
|--------|----------|-----------|
| `#6B8CBE` | `--chart-1` | Gráfico principal (ex: UNIMED) |
| `#BE6B7D` | `--chart-2` | Gráfico secundário (ex: Particular) |
| `#8E7DBE` | `--chart-3` | Gráfico terciário (ex: IPE SAÚDE) |
| `#BEA06B` | `--chart-4` | Gráfico quaternário |
| `#6BB0BE` | `--chart-5` | Gráfico quinário |

---

## 6. Cores de Tipo de Compromisso (Agenda)

| Código | Tipo | Aplicação |
|--------|------|-----------|
| `#6B8CBE` | **Consulta** | Background de eventos de consulta |
| `#BE6B7D` | **Cirurgia** | Background de eventos de cirurgia |
| `#8E7DBE` | **Visita internado** | Background de eventos de visita |
| `#BEA06B` | **Procedimento em consultório** | Background de eventos de procedimento |
| `#6BB0BE` | **Exame** | Background de eventos de exame |
| `#8A8A8A` | **Reunião** | Background de eventos de reunião |
| `#ABABAB` | **Bloqueio** | Background de eventos de bloqueio |

---

## 7. Cores de Status de Agendamento

| Status | Cor do Texto | Background | Aplicação |
|--------|--------------|------------|-----------|
| **Agendado** | `#0056A4` | `bg-blue-500` | Status inicial de agendamento |
| **Confirmado** | `text-green-600` | `bg-green-500` | Paciente confirmou presença |
| **Aguardando** | `text-yellow-600` | `bg-yellow-500` | Paciente na sala de espera |
| **Em atendimento** | `text-purple-600` | `bg-purple-500` | Consulta em andamento |
| **Encerrado** | `text-gray-600` | `bg-gray-500` | Consulta finalizada |
| **Falta** | `text-orange-600` | `bg-orange-500` | Paciente não compareceu |
| **Transferido** | `text-amber-600` | `bg-amber-500` | Agendamento transferido |
| **Cancelado** | `text-red-600` | `bg-red-400` | Agendamento cancelado |

---

## 8. Cores Complementares

| Código | Nome | Aplicação |
|--------|------|-----------|
| `#8E7DBE` | **Roxo** | Gráficos, badges de categoria |
| `#BEA06B` | **Dourado** | Gráficos, badges de destaque |
| `#6BB0BE` | **Ciano** | Gráficos, badges de informação |
| `#BE6B7D` | **Rosa/Bordô** | Accent, gráficos secundários |

---

## 9. Cores Neutras

| Código | Nome | Aplicação |
|--------|------|-----------|
| `#F9FAFB` | Gray 50 | Background muito claro |
| `#F3F4F6` | Gray 100 | Background claro |
| `#E5E7EB` | Gray 200 | Bordas, divisores |
| `#D1D5DB` | Gray 300 | Bordas de destaque |
| `#9CA3AF` | Gray 400 | Texto desabilitado |
| `#6B7280` | Gray 500 | Texto secundário |
| `#374151` | Gray 700 | Texto principal |
| `#111827` | Gray 900 | Texto escuro |
| `#8A8A8A` | Gray Medium | Ícones, reuniões |
| `#ABABAB` | Gray Light | Bloqueios, elementos inativos |

---

## 10. Cores de Widgets

### Light Mode
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#1E293B` | Widget Title | Títulos de widgets |
| `#475569` | Widget Description | Descrições de widgets |
| `#334155` | Widget Label | Labels de widgets |
| `#0F172A` | Widget Value | Valores numéricos |
| `#64748B` | Widget Icon | Ícones de widgets |
| `#E2E8F0` | Widget Border | Bordas de widgets |

### Dark Mode
| Código | Nome | Aplicação |
|--------|------|-----------|
| `#F1F5F9` | Widget Title | Títulos de widgets (dark) |
| `#CBD5E1` | Widget Description | Descrições de widgets (dark) |
| `#E2E8F0` | Widget Label | Labels de widgets (dark) |
| `#FFFFFF` | Widget Value | Valores numéricos (dark) |
| `#94A3B8` | Widget Icon | Ícones de widgets (dark) |
| `#334155` | Widget Border | Bordas de widgets (dark) |

---

## 📝 Notas de Implementação

1. **Texto Azul Clicável**: Sempre usar `#0056A4` para links e texto azul interativo (maior contraste de leitura)
2. **Backgrounds de Widgets**: Usar `bg-sidebar` (`#F5F7FA`) para fundo de widgets
3. **Bordas de Widgets**: Usar `border-slate-200` para bordas sutis
4. **Gráficos**: Usar a escala `--chart-1` a `--chart-5` para consistência visual
5. **Status de Agendamento**: Cada status tem cor de texto, background e light background definidos

---

## 🔄 Histórico de Alterações

| Versão | Data | Alteração |
|--------|------|-----------|
| 3.9.5 | 18/01/2026 | Introdução da cor `#0056A4` para texto azul de alto contraste |
| 3.9.6 | 18/01/2026 | Atualização de todas as ocorrências de texto azul para `#0056A4` |
| 3.8.0 | 17/01/2026 | Implementação da Paleta Opção B (#6B8CBE) |
| 3.8.1 | 17/01/2026 | Fundo de widgets com `bg-sidebar` |
| 3.8.2 | 17/01/2026 | Bordas sutis e contraste de texto melhorado |
