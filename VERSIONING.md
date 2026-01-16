# Política de Versionamento do GORGEN

## Formato: X.Y.Z

- **X (Major)** - Alterado apenas pelo Dr. André Gorgen. Indica mudanças estruturais significativas.
- **Y (Minor)** - Alterado apenas pelo Dr. André Gorgen. Indica novas funcionalidades ou módulos.
- **Z (Patch)** - Incrementado automaticamente após cada alteração/correção. Gerenciado pelo desenvolvedor.

## Versão Atual: 3.4.0

## Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 3.4.0 | 15/01/2026 | Deploy com Design System v2, KPIs com indicadores de variação |
| 3.3.0 | - | Versão anterior |

## Regra de Incremento Automático

Após cada checkpoint salvo com alterações, o desenvolvedor deve:
1. Incrementar o último dígito (Z) da versão
2. Atualizar o `VITE_APP_TITLE` no Management UI → Settings → Secrets
3. Atualizar o campo `version` no `package.json`

Exemplo: 3.4.0 → 3.4.1 → 3.4.2 → ...
