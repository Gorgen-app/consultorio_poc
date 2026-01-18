/**
 * GORGEN - Inicialização do Sistema de Backup Automático
 * 
 * Este módulo é responsável por inicializar o scheduler de backup
 * quando o servidor é iniciado. Deve ser importado no index.ts principal.
 * 
 * Requisitos:
 * - Backup diário às 03:00 (horário de Brasília)
 * - Relatório enviado por e-mail após conclusão
 * - Funcionalidade restrita ao usuário Master/Administrador
 */

import { initializeBackupScheduler, getSchedulerStatus } from "../backup-scheduler";

/**
 * Inicializa o sistema de backup automático
 * Deve ser chamado após o servidor estar pronto
 */
export function initializeBackupSystem(): void {
  console.log("[GORGEN] Inicializando sistema de backup automático...");
  
  // Verificar se estamos em ambiente de produção ou desenvolvimento
  const isProduction = process.env.NODE_ENV === "production";
  const enableScheduler = process.env.BACKUP_SCHEDULER_ENABLED !== "false";
  
  if (!enableScheduler) {
    console.log("[GORGEN] Scheduler de backup desabilitado via variável de ambiente");
    return;
  }
  
  // Configurações baseadas no ambiente
  const config = {
    enabled: true,
    // Em desenvolvimento, podemos usar horários diferentes para testes
    dailyBackupCron: process.env.BACKUP_DAILY_CRON || "0 3 * * *",
    weeklyTestCron: process.env.BACKUP_WEEKLY_TEST_CRON || "0 4 * * 0",
    monthlyReportCron: process.env.BACKUP_MONTHLY_REPORT_CRON || "0 5 1 * *",
    cleanupCron: process.env.BACKUP_CLEANUP_CRON || "0 2 * * *",
    integrityCheckCron: process.env.BACKUP_INTEGRITY_CRON || "0 6 * * 1",
  };
  
  try {
    initializeBackupScheduler(config);
    
    const status = getSchedulerStatus();
    
    console.log("[GORGEN] Sistema de backup automático inicializado com sucesso");
    console.log(`[GORGEN] Ambiente: ${isProduction ? "PRODUÇÃO" : "DESENVOLVIMENTO"}`);
    console.log(`[GORGEN] Tarefas agendadas: ${status.tasks.length}`);
    
    // Listar tarefas agendadas
    for (const task of status.tasks) {
      console.log(`[GORGEN]   - ${task.name}: ${task.cronExpression}`);
    }
    
    // Informar próxima execução do backup diário
    console.log("[GORGEN] Próximo backup diário: 03:00 (horário de Brasília)");
    
  } catch (error) {
    console.error("[GORGEN] Erro ao inicializar sistema de backup:", error);
    
    // Em produção, não devemos falhar silenciosamente
    if (isProduction) {
      console.error("[GORGEN] ATENÇÃO: Sistema de backup não está funcionando!");
      // Aqui poderíamos enviar um alerta para o administrador
    }
  }
}

/**
 * Para o sistema de backup (para uso em testes ou shutdown graceful)
 */
export function shutdownBackupSystem(): void {
  console.log("[GORGEN] Parando sistema de backup automático...");
  
  const { stopBackupScheduler } = require("../backup-scheduler");
  stopBackupScheduler();
  
  console.log("[GORGEN] Sistema de backup parado");
}

/**
 * Obtém informações sobre o status do sistema de backup
 */
export function getBackupSystemInfo(): {
  enabled: boolean;
  environment: string;
  tasks: Array<{
    name: string;
    schedule: string;
    lastRun?: Date;
    status?: string;
  }>;
} {
  const status = getSchedulerStatus();
  
  return {
    enabled: status.initialized,
    environment: process.env.NODE_ENV || "development",
    tasks: status.tasks.map(task => ({
      name: task.name,
      schedule: task.cronExpression,
      lastRun: task.lastRun,
      status: task.lastStatus,
    })),
  };
}
