/**
 * GORGEN - Inicialização do Sistema de Backup Automático
 * 
 * ARQUITETURA HÍBRIDA (v2.0)
 * ==========================
 * O agendamento de backups é feito por um CRON JOB EXTERNO (GitHub Actions),
 * que chama os endpoints /api/cron/* do servidor. Isso elimina o ponto único
 * de falha do scheduler interno e aumenta a confiabilidade do sistema.
 * 
 * O scheduler interno (node-cron) foi DESATIVADO. As funções de backup
 * continuam disponíveis e são chamadas pelos endpoints em cron-router.ts.
 * 
 * Requisitos:
 * - Backup diário às 03:00 (horário de Brasília) - via GitHub Actions
 * - Relatório enviado por e-mail após conclusão
 * - Funcionalidade restrita ao usuário Master/Administrador
 * 
 * Configuração necessária:
 * - CRON_SECRET: Token de autenticação para os endpoints de cron
 * - GitHub Secrets: GORGEN_API_URL, CRON_SECRET
 */

import { getSchedulerStatus } from "../backup-scheduler";

// Flag para indicar que o sistema está em modo híbrido (agendador externo)
const HYBRID_MODE = true;

/**
 * Inicializa o sistema de backup automático
 * 
 * Na arquitetura híbrida, esta função apenas verifica se o sistema está
 * pronto para receber chamadas externas. O agendamento é feito pelo
 * GitHub Actions.
 */
export function initializeBackupSystem(): void {
  console.log("[GORGEN] Inicializando sistema de backup automático...");
  console.log("[GORGEN] Modo: HÍBRIDO (Agendador Externo via GitHub Actions)");
  
  // Verificar se CRON_SECRET está configurado
  const cronSecretConfigured = !!process.env.CRON_SECRET;
  
  if (!cronSecretConfigured) {
    console.warn("[GORGEN] ⚠️  ATENÇÃO: CRON_SECRET não está configurado!");
    console.warn("[GORGEN] ⚠️  Os endpoints /api/cron/* não funcionarão corretamente.");
    console.warn("[GORGEN] ⚠️  Configure a variável de ambiente CRON_SECRET.");
  } else {
    console.log("[GORGEN] ✅ CRON_SECRET configurado");
  }
  
  // Verificar ambiente
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[GORGEN] Ambiente: ${isProduction ? "PRODUÇÃO" : "DESENVOLVIMENTO"}`);
  
  // Listar endpoints disponíveis para o agendador externo
  console.log("[GORGEN] Endpoints disponíveis para GitHub Actions:");
  console.log("[GORGEN]   - GET  /api/cron/health          (Verificar saúde)");
  console.log("[GORGEN]   - POST /api/cron/backup/daily    (Backup diário)");
  console.log("[GORGEN]   - POST /api/cron/backup/cleanup  (Limpeza)");
  console.log("[GORGEN]   - POST /api/cron/restore-test    (Teste de restauração)");
  console.log("[GORGEN]   - POST /api/cron/integrity-check (Verificação de integridade)");
  console.log("[GORGEN]   - POST /api/cron/audit-report    (Relatório de auditoria)");
  
  // Informar sobre o agendamento externo
  console.log("[GORGEN] ");
  console.log("[GORGEN] 📅 Agendamento (via GitHub Actions):");
  console.log("[GORGEN]   - Backup Diário:        03:00 BRT (todos os dias)");
  console.log("[GORGEN]   - Limpeza:              Após backup diário");
  console.log("[GORGEN]   - Teste de Restauração: 04:00 BRT (domingos)");
  console.log("[GORGEN]   - Relatório de Auditoria: 06:00 BRT (dia 1 de cada mês)");
  console.log("[GORGEN] ");
  console.log("[GORGEN] Sistema de backup pronto para receber chamadas externas.");
}

/**
 * Para o sistema de backup (para uso em testes ou shutdown graceful)
 * 
 * Na arquitetura híbrida, não há scheduler interno para parar.
 * Esta função é mantida para compatibilidade.
 */
export function shutdownBackupSystem(): void {
  console.log("[GORGEN] Parando sistema de backup automático...");
  
  if (!HYBRID_MODE) {
    // Código legado - só executa se não estiver em modo híbrido
    const { stopBackupScheduler } = require("../backup-scheduler");
    stopBackupScheduler();
  }
  
  console.log("[GORGEN] Sistema de backup parado");
}

/**
 * Obtém informações sobre o status do sistema de backup
 */
export function getBackupSystemInfo(): {
  enabled: boolean;
  mode: string;
  environment: string;
  cronSecretConfigured: boolean;
  endpoints: string[];
} {
  return {
    enabled: true,
    mode: HYBRID_MODE ? "hybrid" : "internal",
    environment: process.env.NODE_ENV || "development",
    cronSecretConfigured: !!process.env.CRON_SECRET,
    endpoints: [
      "/api/cron/health",
      "/api/cron/backup/daily",
      "/api/cron/backup/cleanup",
      "/api/cron/restore-test",
      "/api/cron/integrity-check",
      "/api/cron/audit-report",
    ],
  };
}
