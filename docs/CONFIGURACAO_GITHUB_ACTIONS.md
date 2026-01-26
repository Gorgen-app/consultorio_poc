# GORGEN - Configuração do GitHub Actions para Backup

**Versão:** 1.0  
**Data:** 25 de Janeiro de 2026  
**Autor:** Manus AI

---

## Visão Geral

Este documento descreve como configurar os GitHub Actions secrets necessários para habilitar os workflows de backup automático do GORGEN.

---

## Pré-requisitos

1. **Acesso administrativo** ao repositório `andre-gorgen/consultorio_poc`
2. **GitHub CLI (gh)** instalado (para configuração automatizada)
3. **CRON_SECRET** do ambiente de produção do GORGEN

---

## Método 1: Configuração Automatizada (Recomendado)

### Passo 1: Instalar GitHub CLI

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli
```

### Passo 2: Autenticar no GitHub

```bash
gh auth login
```

Siga as instruções para autenticar com sua conta GitHub.

### Passo 3: Executar Script de Configuração

```bash
cd /caminho/para/consultorio_poc
./scripts/setup-github-secrets.sh
```

O script irá solicitar:
- **GORGEN_API_URL**: URL da API em produção (padrão: `https://www.gorgen.com.br`)
- **CRON_SECRET**: Token de autenticação (obrigatório)
- **SLACK_WEBHOOK_URL**: Webhook do Slack para notificações (opcional)

---

## Método 2: Configuração Manual

### Passo 1: Acessar Configurações do Repositório

1. Acesse: https://github.com/andre-gorgen/consultorio_poc/settings/secrets/actions
2. Clique em **"New repository secret"**

### Passo 2: Adicionar Secrets

| Nome do Secret | Valor | Obrigatório |
|----------------|-------|-------------|
| `GORGEN_API_URL` | `https://www.gorgen.com.br` | ✅ Sim |
| `CRON_SECRET` | Token de autenticação do GORGEN | ✅ Sim |
| `SLACK_WEBHOOK_URL` | URL do webhook do Slack | ❌ Não |

### Passo 3: Verificar Configuração

Após adicionar os secrets, verifique se aparecem na lista em:
https://github.com/andre-gorgen/consultorio_poc/settings/secrets/actions

---

## Secrets Detalhados

### GORGEN_API_URL

**Descrição:** URL base da API do GORGEN em produção.

**Formato:** `https://dominio.com.br`

**Exemplo:** `https://www.gorgen.com.br`

**Uso nos Workflows:**
- Endpoint de health check: `$GORGEN_API_URL/api/cron/health`
- Endpoint de backup: `$GORGEN_API_URL/api/cron/backup/daily`
- Endpoint de limpeza: `$GORGEN_API_URL/api/cron/backup/cleanup`

---

### CRON_SECRET

**Descrição:** Token de autenticação para endpoints protegidos de cron.

**Formato:** String alfanumérica (recomendado: 32+ caracteres)

**Como obter:**
1. Acesse o painel de administração do GORGEN
2. Vá em Configurações > Backup > Segurança
3. Copie o valor de `CRON_SECRET`

Ou verifique nas variáveis de ambiente do servidor de produção.

**Uso nos Workflows:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" ...
```

---

### SLACK_WEBHOOK_URL (Opcional)

**Descrição:** URL do webhook do Slack para receber notificações de backup.

**Formato:** `https://hooks.slack.com/services/T.../B.../...`

**Como obter:**
1. Acesse: https://api.slack.com/apps
2. Crie um novo app ou use um existente
3. Ative "Incoming Webhooks"
4. Adicione um webhook ao canal desejado
5. Copie a URL do webhook

**Notificações enviadas:**
- ✅ Backup concluído com sucesso
- ❌ Falha no backup (com detalhes)

---

## Workflows Disponíveis

### 1. Backup Diário (`backup-daily.yml`)

**Agendamento:** Todos os dias às 03:00 (Brasília) / 06:00 UTC

**Tarefas:**
1. Verificar saúde do serviço
2. Executar backup completo
3. Limpar backups antigos
4. Notificar resultado

**Execução Manual:**
1. Acesse: https://github.com/andre-gorgen/consultorio_poc/actions
2. Selecione "🗄️ Backup Diário"
3. Clique em "Run workflow"

---

### 2. Teste de Restauração (`backup-restore-test.yml`)

**Agendamento:** Todos os domingos às 04:00 (Brasília)

**Tarefas:**
1. Executar teste de restauração em ambiente isolado
2. Validar integridade dos dados
3. Reportar resultado

---

### 3. Relatório de Auditoria (`backup-audit-report.yml`)

**Agendamento:** Dia 1 de cada mês às 05:00 (Brasília)

**Tarefas:**
1. Gerar relatório mensal de backups
2. Calcular estatísticas de conformidade
3. Enviar relatório por e-mail

---

## Verificação da Configuração

### Via GitHub CLI

```bash
gh secret list --repo andre-gorgen/consultorio_poc
```

Deve mostrar:
```
NAME                 UPDATED
CRON_SECRET          2026-01-25
GORGEN_API_URL       2026-01-25
SLACK_WEBHOOK_URL    2026-01-25  (se configurado)
```

### Via Interface Web

1. Acesse: https://github.com/andre-gorgen/consultorio_poc/settings/secrets/actions
2. Verifique se os secrets estão listados

---

## Troubleshooting

### Erro: "Resource not accessible by integration"

**Causa:** Token sem permissão para gerenciar secrets.

**Solução:** Use um Personal Access Token (PAT) com escopo `repo` ou configure manualmente via interface web.

---

### Erro: "GORGEN_API_URL não configurado"

**Causa:** Secret não foi adicionado ou nome incorreto.

**Solução:** Verifique se o secret foi criado com o nome exato `GORGEN_API_URL` (case-sensitive).

---

### Erro: "CRON_SECRET não configurado"

**Causa:** Secret não foi adicionado.

**Solução:** Adicione o secret `CRON_SECRET` com o valor correto do ambiente de produção.

---

### Backup falha com "Unauthorized"

**Causa:** CRON_SECRET incorreto ou expirado.

**Solução:** Verifique se o valor do secret corresponde ao configurado no servidor de produção.

---

## Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do workflow em: https://github.com/andre-gorgen/consultorio_poc/actions
2. Consulte a documentação do sistema de backup: `docs/GORGEN_Relatorio_Backup_Integridade_v2.0.md`
3. Entre em contato com o suporte técnico

---

**Documento gerado automaticamente pelo GORGEN**
