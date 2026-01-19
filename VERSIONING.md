# 📋 Política de Versionamento do GORGEN

> **Documento de Referência** | Atualizado em 17/01/2026

---

## Formato: X.Y.Z

| Dígito | Nome | Responsável | Descrição |
|--------|------|-------------|-----------|
| **X** | Major | Dr. André Gorgen | Mudanças estruturais significativas, redesign completo |
| **Y** | Minor | Dr. André Gorgen | Novas funcionalidades ou módulos importantes |
| **Z** | Patch | Manus AI (automático) | Correções, ajustes e melhorias incrementais |

---

## Versão Atual: 3.9.9

---

## Regras de Incremento

### Incremento Automático (Patch - Z)
O Manus AI tem autorização para incrementar automaticamente **apenas o terceiro dígito** após cada alteração:

```
3.9.1 → 3.9.2 → 3.9.3 → 3.9.4 → ... → 3.9.12 → 3.9.13 → etc.
```

**Exemplos de alterações que incrementam o Patch:**
- Correções de bugs
- Ajustes visuais
- Melhorias de performance
- Novas funcionalidades menores
- Atualizações de documentação

### Incremento Manual (Major e Minor - X.Y)
Os dois primeiros dígitos só podem ser alterados com **autorização explícita** do Dr. André Gorgen:

- **Minor (3.x.0)**: Novas funcionalidades significativas, mudanças de design importantes
- **Major (x.0.0)**: Mudanças estruturais, breaking changes, redesign completo

---

## Procedimento de Atualização

Após cada checkpoint salvo com alterações, o desenvolvedor deve:

1. Incrementar o último dígito (Z) da versão no `package.json`
2. Atualizar o `VITE_APP_TITLE` se necessário (Management UI → Settings → Secrets)
3. Registrar a alteração no `todo.md`

---

## Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 3.9.8 | 19/01/2026 | Headers de Segurança (CSP) implementados |
| 3.9.7 | 18/01/2026 | Rate Limiting integrado ao middleware principal |
| 3.9.6 | 18/01/2026 | Correção de texto azul restante |
| 3.9.5 | 18/01/2026 | Ajuste de contraste de texto azul (#0056A4) |
| 3.9.4 | 18/01/2026 | Sistema de backup automático integrado |
| 3.9.3 | 17/01/2026 | Avaliação completa do sistema |
| 3.9.2 | 17/01/2026 | Regra de versionamento implementada |
| 3.9.1 | 17/01/2026 | Tema dark removido, apenas tema light |
| 3.9.0 | 17/01/2026 | Padronização visual completa, Design System v1.1 |
| 3.8.2 | 17/01/2026 | Bordas sutis e contraste melhorado nos widgets |
| 3.8.1 | 17/01/2026 | Widgets com fundo cinza (#F5F7FA) |
| 3.8.0 | 17/01/2026 | Paleta de cores Opção B (#6B8CBE) aplicada |
| 3.7.1 | 17/01/2026 | Correções TypeScript, build estável |
| 3.4.0 | 15/01/2026 | Deploy com Design System v2, KPIs com indicadores |

---

## Responsabilidades

| Ação | Responsável | Autorização |
|------|-------------|-------------|
| Incrementar Patch (3.9.x) | Manus AI | Automática |
| Incrementar Minor (3.x.0) | Dr. André Gorgen | Explícita |
| Incrementar Major (x.0.0) | Dr. André Gorgen | Explícita |

---

**Proprietário**: Dr. André Gorgen  
**Implementado por**: Manus AI  
**Última atualização**: 19 de Janeiro de 2026
