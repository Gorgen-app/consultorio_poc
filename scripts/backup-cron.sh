#!/bin/bash
# =============================================================================
# GORGEN - Script de Backup via Cron
# =============================================================================
# Este script executa as tarefas de backup do sistema Gorgen.
# Pode ser usado diretamente via crontab ou como base para outros agendadores.
#
# USO:
#   ./backup-cron.sh <comando> [opções]
#
# COMANDOS:
#   daily       - Executa backup diário
#   cleanup     - Executa limpeza de backups antigos
#   restore     - Executa teste de restauração
#   audit       - Gera relatório de auditoria
#   all         - Executa todas as tarefas
#   health      - Verifica saúde do serviço
#   install     - Instala os cron jobs no sistema
#   uninstall   - Remove os cron jobs do sistema
#
# VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
#   GORGEN_API_URL  - URL base da API do Gorgen (ex: https://gorgen.com.br)
#   CRON_SECRET     - Token de autenticação para os endpoints de cron
#
# EXEMPLO:
#   export GORGEN_API_URL="https://gorgen.com.br"
#   export CRON_SECRET="seu_token_secreto"
#   ./backup-cron.sh daily
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${LOG_DIR:-/var/log/gorgen}"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d).log"

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  color="$GREEN" ;;
        WARN)  color="$YELLOW" ;;
        ERROR) color="$RED" ;;
        *)     color="$NC" ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}"
    
    # Também escreve no arquivo de log se o diretório existir
    if [ -d "$LOG_DIR" ]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

check_env() {
    if [ -z "$GORGEN_API_URL" ]; then
        log ERROR "GORGEN_API_URL não está definido"
        echo "Defina a variável de ambiente GORGEN_API_URL"
        exit 1
    fi
    
    if [ -z "$CRON_SECRET" ]; then
        log ERROR "CRON_SECRET não está definido"
        echo "Defina a variável de ambiente CRON_SECRET"
        exit 1
    fi
    
    log INFO "Configuração validada"
    log INFO "API URL: $GORGEN_API_URL"
}

call_api() {
    local endpoint="$1"
    local method="${2:-POST}"
    local timeout="${3:-300}"
    
    log INFO "Chamando API: $method $endpoint"
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" \
        -X "$method" \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        --max-time "$timeout" \
        "${GORGEN_API_URL}${endpoint}" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" != "200" ]; then
        log ERROR "Falha na requisição (HTTP $http_code)"
        echo "$body"
        return 1
    fi
    
    echo "$body"
    return 0
}

# =============================================================================
# COMANDOS PRINCIPAIS
# =============================================================================

cmd_health() {
    log INFO "Verificando saúde do serviço..."
    
    local response
    response=$(call_api "/api/cron/health" "GET" 30)
    
    if [ $? -eq 0 ]; then
        log INFO "Serviço saudável"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 0
    else
        log ERROR "Serviço não está respondendo"
        return 1
    fi
}

cmd_daily() {
    log INFO "=========================================="
    log INFO "Iniciando BACKUP DIÁRIO"
    log INFO "=========================================="
    
    local start_time=$(date +%s)
    
    local response
    response=$(call_api "/api/cron/backup/daily" "POST" 1800)
    local status=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $status -eq 0 ]; then
        local success=$(echo "$response" | jq -r '.success')
        
        if [ "$success" == "true" ]; then
            log INFO "Backup diário concluído com SUCESSO"
            log INFO "Duração: ${duration}s"
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
            return 0
        else
            log ERROR "Backup diário retornou erro"
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
            return 1
        fi
    else
        log ERROR "Falha ao executar backup diário"
        return 1
    fi
}

cmd_cleanup() {
    log INFO "=========================================="
    log INFO "Iniciando LIMPEZA DE BACKUPS"
    log INFO "=========================================="
    
    local response
    response=$(call_api "/api/cron/backup/cleanup" "POST" 600)
    local status=$?
    
    if [ $status -eq 0 ]; then
        log INFO "Limpeza concluída com SUCESSO"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 0
    else
        log WARN "Falha na limpeza de backups"
        return 1
    fi
}

cmd_restore() {
    log INFO "=========================================="
    log INFO "Iniciando TESTE DE RESTAURAÇÃO"
    log INFO "=========================================="
    
    local start_time=$(date +%s)
    
    local response
    response=$(call_api "/api/cron/restore-test" "POST" 3600)
    local status=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $status -eq 0 ]; then
        local success=$(echo "$response" | jq -r '.success')
        
        if [ "$success" == "true" ]; then
            log INFO "Teste de restauração concluído com SUCESSO"
            log INFO "Duração: ${duration}s"
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
            return 0
        else
            log ERROR "Teste de restauração FALHOU"
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
            return 1
        fi
    else
        log ERROR "Falha ao executar teste de restauração"
        return 1
    fi
}

cmd_audit() {
    log INFO "=========================================="
    log INFO "Gerando RELATÓRIO DE AUDITORIA"
    log INFO "=========================================="
    
    local response
    response=$(call_api "/api/cron/audit-report" "POST" 600)
    local status=$?
    
    if [ $status -eq 0 ]; then
        log INFO "Relatório de auditoria gerado com SUCESSO"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 0
    else
        log ERROR "Falha ao gerar relatório de auditoria"
        return 1
    fi
}

cmd_all() {
    log INFO "=========================================="
    log INFO "Executando TODAS AS TAREFAS"
    log INFO "=========================================="
    
    local failed=0
    
    cmd_daily || failed=$((failed + 1))
    cmd_cleanup || failed=$((failed + 1))
    cmd_restore || failed=$((failed + 1))
    cmd_audit || failed=$((failed + 1))
    
    if [ $failed -eq 0 ]; then
        log INFO "Todas as tarefas concluídas com SUCESSO"
        return 0
    else
        log WARN "$failed tarefa(s) falharam"
        return 1
    fi
}

cmd_install() {
    log INFO "Instalando cron jobs..."
    
    # Criar diretório de logs
    sudo mkdir -p "$LOG_DIR"
    sudo chown $(whoami):$(whoami) "$LOG_DIR"
    
    # Criar arquivo de ambiente
    local env_file="/etc/gorgen-backup.env"
    
    echo "Criando arquivo de ambiente em $env_file"
    echo "Por favor, edite o arquivo e adicione suas credenciais."
    
    sudo tee "$env_file" > /dev/null << 'EOF'
# Gorgen Backup Configuration
# Edite este arquivo com suas credenciais

GORGEN_API_URL="https://gorgen.com.br"
CRON_SECRET="seu_token_secreto_aqui"
EOF
    
    sudo chmod 600 "$env_file"
    
    # Criar script wrapper
    local wrapper_script="/usr/local/bin/gorgen-backup"
    
    sudo tee "$wrapper_script" > /dev/null << EOF
#!/bin/bash
# Gorgen Backup Wrapper
source /etc/gorgen-backup.env
export GORGEN_API_URL CRON_SECRET
exec $SCRIPT_DIR/backup-cron.sh "\$@"
EOF
    
    sudo chmod +x "$wrapper_script"
    
    # Instalar cron jobs
    local cron_entries="
# =============================================================================
# GORGEN BACKUP JOBS
# =============================================================================
# Backup diário às 03:00 (horário local)
0 3 * * * /usr/local/bin/gorgen-backup daily >> /var/log/gorgen/cron.log 2>&1

# Limpeza de backups às 05:00 (horário local)
0 5 * * * /usr/local/bin/gorgen-backup cleanup >> /var/log/gorgen/cron.log 2>&1

# Teste de restauração aos domingos às 04:00 (horário local)
0 4 * * 0 /usr/local/bin/gorgen-backup restore >> /var/log/gorgen/cron.log 2>&1

# Relatório de auditoria no dia 1 de cada mês às 06:00 (horário local)
0 6 1 * * /usr/local/bin/gorgen-backup audit >> /var/log/gorgen/cron.log 2>&1
# =============================================================================
"
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null | grep -v "gorgen-backup"; echo "$cron_entries") | crontab -
    
    log INFO "Cron jobs instalados com sucesso!"
    log INFO ""
    log INFO "IMPORTANTE: Edite o arquivo $env_file com suas credenciais:"
    log INFO "  sudo nano $env_file"
    log INFO ""
    log INFO "Para verificar os cron jobs instalados:"
    log INFO "  crontab -l"
    log INFO ""
    log INFO "Para testar a configuração:"
    log INFO "  gorgen-backup health"
}

cmd_uninstall() {
    log INFO "Removendo cron jobs..."
    
    # Remover entradas do crontab
    crontab -l 2>/dev/null | grep -v "gorgen-backup" | crontab -
    
    # Remover arquivos
    sudo rm -f /usr/local/bin/gorgen-backup
    sudo rm -f /etc/gorgen-backup.env
    
    log INFO "Cron jobs removidos com sucesso!"
    log INFO "Os logs em $LOG_DIR foram mantidos."
}

show_help() {
    echo "
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    GORGEN - Script de Backup via Cron                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

USO:
    $(basename "$0") <comando> [opções]

COMANDOS:
    daily       Executa backup diário de todos os tenants
    cleanup     Executa limpeza de backups antigos (política de retenção)
    restore     Executa teste de restauração do backup mais recente
    audit       Gera relatório de auditoria mensal
    all         Executa todas as tarefas em sequência
    health      Verifica se o serviço de scheduler está funcionando
    install     Instala os cron jobs no sistema (requer sudo)
    uninstall   Remove os cron jobs do sistema (requer sudo)
    help        Exibe esta mensagem de ajuda

VARIÁVEIS DE AMBIENTE:
    GORGEN_API_URL    URL base da API do Gorgen (obrigatório)
    CRON_SECRET       Token de autenticação (obrigatório)
    LOG_DIR           Diretório de logs (padrão: /var/log/gorgen)

EXEMPLOS:
    # Configurar variáveis de ambiente
    export GORGEN_API_URL=\"https://gorgen.com.br\"
    export CRON_SECRET=\"seu_token_secreto\"
    
    # Verificar saúde do serviço
    $(basename "$0") health
    
    # Executar backup diário
    $(basename "$0") daily
    
    # Instalar cron jobs automaticamente
    sudo $(basename "$0") install

AGENDAMENTO PADRÃO (após instalação):
    03:00       Backup diário
    04:00 Dom   Teste de restauração
    05:00       Limpeza de backups
    06:00 Dia 1 Relatório de auditoria

LOGS:
    Os logs são salvos em: $LOG_DIR/backup-YYYYMMDD.log

SUPORTE:
    Em caso de problemas, verifique:
    1. As variáveis de ambiente estão configuradas
    2. O serviço Gorgen está acessível (use: $(basename "$0") health)
    3. O token CRON_SECRET está correto
"
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    local command="${1:-help}"
    
    case "$command" in
        daily)
            check_env
            cmd_daily
            ;;
        cleanup)
            check_env
            cmd_cleanup
            ;;
        restore)
            check_env
            cmd_restore
            ;;
        audit)
            check_env
            cmd_audit
            ;;
        all)
            check_env
            cmd_all
            ;;
        health)
            check_env
            cmd_health
            ;;
        install)
            cmd_install
            ;;
        uninstall)
            cmd_uninstall
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log ERROR "Comando desconhecido: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
