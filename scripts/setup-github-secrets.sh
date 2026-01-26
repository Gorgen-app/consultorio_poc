#!/bin/bash

# =============================================================================
# GORGEN - Script de Configuração de GitHub Actions Secrets
# =============================================================================
# Este script configura automaticamente os secrets necessários para os
# workflows de backup do GitHub Actions.
#
# Pré-requisitos:
#   1. GitHub CLI (gh) instalado: https://cli.github.com/
#   2. Autenticado no GitHub: gh auth login
#   3. Permissões de admin no repositório
#
# Uso:
#   chmod +x scripts/setup-github-secrets.sh
#   ./scripts/setup-github-secrets.sh
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
REPO="andre-gorgen/consultorio_poc"

echo -e "${BLUE}"
echo "============================================================"
echo "  GORGEN - Configuração de GitHub Actions Secrets"
echo "============================================================"
echo -e "${NC}"

# Verificar se gh está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) não está instalado.${NC}"
    echo ""
    echo "Instale seguindo as instruções em: https://cli.github.com/"
    echo ""
    echo "  macOS:   brew install gh"
    echo "  Ubuntu:  sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI encontrado${NC}"

# Verificar autenticação
echo ""
echo -e "${YELLOW}📋 Verificando autenticação no GitHub...${NC}"

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GitHub.${NC}"
    echo ""
    echo "Execute: gh auth login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Autenticado no GitHub${NC}"

# Verificar acesso ao repositório
echo ""
echo -e "${YELLOW}📋 Verificando acesso ao repositório $REPO...${NC}"

if ! gh repo view "$REPO" &> /dev/null; then
    echo -e "${RED}❌ Não foi possível acessar o repositório $REPO${NC}"
    echo ""
    echo "Verifique se você tem permissões de admin no repositório."
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Acesso ao repositório confirmado${NC}"

# Coletar valores dos secrets
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Configuração dos Secrets${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# GORGEN_API_URL
echo -e "${YELLOW}1. GORGEN_API_URL${NC}"
echo "   URL da API do GORGEN em produção"
echo "   Exemplo: https://www.gorgen.com.br"
echo ""
read -p "   Digite a URL (ou pressione Enter para usar o padrão): " GORGEN_API_URL
GORGEN_API_URL=${GORGEN_API_URL:-"https://www.gorgen.com.br"}
echo ""

# CRON_SECRET
echo -e "${YELLOW}2. CRON_SECRET${NC}"
echo "   Token de autenticação para endpoints de cron"
echo "   Este valor deve corresponder ao CRON_SECRET configurado no servidor"
echo ""
read -sp "   Digite o CRON_SECRET: " CRON_SECRET
echo ""

if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ CRON_SECRET é obrigatório${NC}"
    exit 1
fi
echo ""

# SLACK_WEBHOOK_URL (opcional)
echo -e "${YELLOW}3. SLACK_WEBHOOK_URL (opcional)${NC}"
echo "   Webhook do Slack para notificações de backup"
echo "   Deixe em branco se não quiser notificações no Slack"
echo ""
read -p "   Digite o Webhook URL (ou pressione Enter para pular): " SLACK_WEBHOOK_URL
echo ""

# Confirmar configuração
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Resumo da Configuração${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo -e "   GORGEN_API_URL:    ${GREEN}$GORGEN_API_URL${NC}"
echo -e "   CRON_SECRET:       ${GREEN}********${NC}"
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo -e "   SLACK_WEBHOOK_URL: ${GREEN}Configurado${NC}"
else
    echo -e "   SLACK_WEBHOOK_URL: ${YELLOW}Não configurado${NC}"
fi
echo ""

read -p "Confirma a configuração? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Configuração cancelada.${NC}"
    exit 0
fi

# Configurar secrets
echo ""
echo -e "${YELLOW}📋 Configurando secrets no GitHub...${NC}"
echo ""

# GORGEN_API_URL
echo -n "   Configurando GORGEN_API_URL... "
if echo "$GORGEN_API_URL" | gh secret set GORGEN_API_URL --repo "$REPO"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    exit 1
fi

# CRON_SECRET
echo -n "   Configurando CRON_SECRET... "
if echo "$CRON_SECRET" | gh secret set CRON_SECRET --repo "$REPO"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    exit 1
fi

# SLACK_WEBHOOK_URL (se fornecido)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo -n "   Configurando SLACK_WEBHOOK_URL... "
    if echo "$SLACK_WEBHOOK_URL" | gh secret set SLACK_WEBHOOK_URL --repo "$REPO"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        exit 1
    fi
fi

# Verificar secrets configurados
echo ""
echo -e "${YELLOW}📋 Verificando secrets configurados...${NC}"
echo ""
gh secret list --repo "$REPO"

# Sucesso
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  ✅ Configuração Concluída com Sucesso!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Os GitHub Actions secrets foram configurados."
echo ""
echo "Próximos passos:"
echo "  1. Os workflows de backup serão executados automaticamente às 03:00 (Brasília)"
echo "  2. Você pode executar manualmente em: Actions > 🗄️ Backup Diário > Run workflow"
echo "  3. Verifique os logs em: https://github.com/$REPO/actions"
echo ""
echo -e "${BLUE}============================================================${NC}"
