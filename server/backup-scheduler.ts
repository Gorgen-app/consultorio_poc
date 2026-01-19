/**
 * GORGEN - Sistema de Agendamento de Backup Automático
 * 
 * Pilar Fundamental: Imutabilidade e Preservação Histórica
 * "Em saúde, a informação é o retrato do momento do paciente. Todo dado inserido é perpétuo."
 * 
 * Este módulo implementa:
 * - Agendamento automático de backups diários (03:00)
 * - Execução automática de política de retenção
 * - Testes de restauração semanais
 * - Monitoramento e logging de todas as operações
 * - Notificações por e-mail após cada operação
 * 
 * Requisitos do Projeto:
 * - Backup diário às 03:00
 * - Relatório enviado automaticamente por e-mail após conclusão
 * - Funcionalidade restrita ao usuário Master/Administrador
 */

import cron, { ScheduledTask as CronScheduledTask } from "node-cron";
import { getDb } from "./db";
import { backupConfig, tenants } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  executeFullBackup,
  executeIncrementalBackup,
  cleanupOldBackups,
  runScheduledRestoreTest,
  runIntegrityCheck,
  generateMonthlyAuditReport,
  sendBackupEmailNotification,
  getBackupConfig,
} from "./backup";

// ==========================================
// CONFIGURAÇÕES DO SCHEDULER
// ==========================================

interface SchedulerConfig {
  enabled: boolean;
  dailyBackupCron: string;      // Cron expression para backup diário
  weeklyTestCron: string;       // Cron expression para teste de restauração semanal
  monthlyReportCron: string;    // Cron expression para relatório mensal
  cleanupCron: string;          // Cron expression para limpeza de backups antigos
  integrityCheckCron: string;   // Cron expression para verificação de integridade
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  dailyBackupCron: "0 3 * * *",           // Todos os dias às 03:00
  weeklyTestCron: "0 4 * * 0",            // Domingos às 04:00
  monthlyReportCron: "0 5 1 * *",         // Dia 1 de cada mês às 05:00
  cleanupCron: "0 2 * * *",               // Todos os dias às 02:00
  integrityCheckCron: "0 6 * * 1",        // Segundas-feiras às 06:00
};

// ==========================================
// ESTADO DO SCHEDULER
// ==========================================

interface ScheduledTask {
  name: string;
  task: CronScheduledTask;
  cronExpression: string;
  lastRun?: Date;
  lastStatus?: "success" | "failed";
  lastError?: string;
}

const scheduledTasks: Map<string, ScheduledTask> = new Map();
let isInitialized = false;

// ==========================================
// FUNÇÕES DE LOGGING
// ==========================================

function logScheduler(level: "info" | "warn" | "error", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[BackupScheduler][${timestamp}]`;
  
  switch (level) {
    case "info":
      console.log(`${prefix} INFO: ${message}`, data || "");
      break;
    case "warn":
      console.warn(`${prefix} WARN: ${message}`, data || "");
      break;
    case "error":
      console.error(`${prefix} ERROR: ${message}`, data || "");
      break;
  }
}

// ==========================================
// FUNÇÕES DE EXECUÇÃO DE TAREFAS
// ==========================================

/**
 * Obtém todos os tenants ativos que têm backup habilitado
 */
async function getActiveTenantsWithBackup(): Promise<number[]> {
  const db = await getDb();
  if (!db) {
    logScheduler("error", "Database não disponível");
    return [];
  }

  try {
    // Buscar todos os tenants ativos
    const activeTenantsResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.status, "ativo"));

    const tenantIds: number[] = [];

    // Para cada tenant, verificar se o backup está habilitado
    for (const tenant of activeTenantsResult) {
      const config = await getBackupConfig(tenant.id);
      // Se não há configuração ou backup está habilitado (padrão = true)
      // backupEnabled é armazenado como TINYINT (0/1) no MySQL
      if (!config || config.backupEnabled !== 0) {
        tenantIds.push(tenant.id);
      }
    }

    return tenantIds;
  } catch (error) {
    logScheduler("error", "Erro ao buscar tenants ativos", error);
    return [];
  }
}

/**
 * Executa backup diário para todos os tenants ativos
 */
async function runDailyBackup(): Promise<void> {
  logScheduler("info", "Iniciando backup diário automático");
  
  const tenantIds = await getActiveTenantsWithBackup();
  
  if (tenantIds.length === 0) {
    logScheduler("warn", "Nenhum tenant ativo encontrado para backup");
    return;
  }

  logScheduler("info", `Executando backup para ${tenantIds.length} tenant(s)`);

  for (const tenantId of tenantIds) {
    try {
      logScheduler("info", `Iniciando backup para tenant ${tenantId}`);
      
      const result = await executeFullBackup(
        tenantId,
        "scheduled",
        undefined, // userId - sistema
        { ipAddress: "127.0.0.1", userAgent: "GORGEN-BackupScheduler/1.0" }
      );

      if (result.success) {
        logScheduler("info", `Backup concluído para tenant ${tenantId}`, {
          backupId: result.backupId,
          fileSize: result.fileSize,
          duration: result.duration,
        });

        // Enviar e-mail de notificação
        const config = await getBackupConfig(tenantId);
        if (config?.notificationEmail) {
          await sendBackupEmailNotification({
            email: config.notificationEmail,
            success: true,
            tenantId,
            backupType: "full",
            records: undefined, // Será preenchido pela função
            fileSize: result.fileSize,
            duration: result.duration,
            encrypted: true,
          });
        }
      } else {
        logScheduler("error", `Falha no backup para tenant ${tenantId}`, {
          error: result.error,
        });

        // Notificar falha
        const config = await getBackupConfig(tenantId);
        if (config?.notificationEmail && config.notifyOnFailure) {
          await sendBackupEmailNotification({
            email: config.notificationEmail,
            success: false,
            tenantId,
            backupType: "full",
            errorMessage: result.error,
          });
        }
      }
    } catch (error) {
      logScheduler("error", `Exceção durante backup do tenant ${tenantId}`, error);
    }
  }

  logScheduler("info", "Backup diário automático concluído");
  
  // Atualizar estado da tarefa
  const task = scheduledTasks.get("daily-backup");
  if (task) {
    task.lastRun = new Date();
    task.lastStatus = "success";
  }
}

/**
 * Executa limpeza de backups antigos para todos os tenants
 */
async function runCleanup(): Promise<void> {
  logScheduler("info", "Iniciando limpeza de backups antigos");
  
  const tenantIds = await getActiveTenantsWithBackup();
  
  for (const tenantId of tenantIds) {
    try {
      const removedCount = await cleanupOldBackups(tenantId);
      if (removedCount > 0) {
        logScheduler("info", `Removidos ${removedCount} backups antigos do tenant ${tenantId}`);
      }
    } catch (error) {
      logScheduler("error", `Erro na limpeza do tenant ${tenantId}`, error);
    }
  }

  logScheduler("info", "Limpeza de backups concluída");
  
  const task = scheduledTasks.get("cleanup");
  if (task) {
    task.lastRun = new Date();
    task.lastStatus = "success";
  }
}

/**
 * Executa teste de restauração semanal para todos os tenants
 */
async function runWeeklyRestoreTest(): Promise<void> {
  logScheduler("info", "Iniciando teste de restauração semanal");
  
  const tenantIds = await getActiveTenantsWithBackup();
  
  for (const tenantId of tenantIds) {
    try {
      logScheduler("info", `Executando teste de restauração para tenant ${tenantId}`);
      
      const result = await runScheduledRestoreTest(tenantId);
      
      if (result.success) {
        logScheduler("info", `Teste de restauração aprovado para tenant ${tenantId}`, {
          validations: result.summary?.passedValidations,
          duration: result.duration,
        });
      } else {
        logScheduler("warn", `Teste de restauração falhou para tenant ${tenantId}`, {
          error: result.error,
          failedValidations: result.summary?.failedValidations,
        });
      }
    } catch (error) {
      logScheduler("error", `Exceção no teste de restauração do tenant ${tenantId}`, error);
    }
  }

  logScheduler("info", "Teste de restauração semanal concluído");
  
  const task = scheduledTasks.get("weekly-restore-test");
  if (task) {
    task.lastRun = new Date();
    task.lastStatus = "success";
  }
}

/**
 * Executa verificação de integridade semanal
 */
async function runWeeklyIntegrityCheck(): Promise<void> {
  logScheduler("info", "Iniciando verificação de integridade semanal");
  
  const tenantIds = await getActiveTenantsWithBackup();
  
  for (const tenantId of tenantIds) {
    try {
      const result = await runIntegrityCheck(tenantId, 30);
      
      logScheduler("info", `Verificação de integridade para tenant ${tenantId}`, {
        totalChecked: result.totalChecked,
        validCount: result.validCount,
        invalidCount: result.invalidCount,
      });

      if (result.invalidCount > 0) {
        logScheduler("warn", `${result.invalidCount} backups inválidos encontrados para tenant ${tenantId}`);
      }
    } catch (error) {
      logScheduler("error", `Erro na verificação de integridade do tenant ${tenantId}`, error);
    }
  }

  logScheduler("info", "Verificação de integridade concluída");
  
  const task = scheduledTasks.get("integrity-check");
  if (task) {
    task.lastRun = new Date();
    task.lastStatus = "success";
  }
}

/**
 * Gera relatório de auditoria mensal para todos os tenants
 */
async function runMonthlyAuditReport(): Promise<void> {
  logScheduler("info", "Iniciando geração de relatório de auditoria mensal");
  
  const tenantIds = await getActiveTenantsWithBackup();
  
  for (const tenantId of tenantIds) {
    try {
      const report = await generateMonthlyAuditReport(tenantId);
      
      logScheduler("info", `Relatório de auditoria gerado para tenant ${tenantId}`, {
        totalBackups: report.summary.totalBackups,
        successRate: ((report.summary.successfulBackups / report.summary.totalBackups) * 100).toFixed(1) + "%",
        encryptionRate: (report.summary.encryptionRate * 100).toFixed(1) + "%",
      });
    } catch (error) {
      logScheduler("error", `Erro ao gerar relatório do tenant ${tenantId}`, error);
    }
  }

  logScheduler("info", "Geração de relatórios de auditoria concluída");
  
  const task = scheduledTasks.get("monthly-report");
  if (task) {
    task.lastRun = new Date();
    task.lastStatus = "success";
  }
}

// ==========================================
// FUNÇÕES DE GERENCIAMENTO DO SCHEDULER
// ==========================================

/**
 * Inicializa o scheduler de backup
 */
export function initializeBackupScheduler(config: Partial<SchedulerConfig> = {}): void {
  if (isInitialized) {
    logScheduler("warn", "Scheduler já está inicializado");
    return;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    logScheduler("info", "Scheduler de backup está desabilitado");
    return;
  }

  logScheduler("info", "Inicializando scheduler de backup automático");

  // Validar expressões cron
  const cronExpressions = [
    { name: "dailyBackupCron", expr: finalConfig.dailyBackupCron },
    { name: "weeklyTestCron", expr: finalConfig.weeklyTestCron },
    { name: "monthlyReportCron", expr: finalConfig.monthlyReportCron },
    { name: "cleanupCron", expr: finalConfig.cleanupCron },
    { name: "integrityCheckCron", expr: finalConfig.integrityCheckCron },
  ];

  for (const { name, expr } of cronExpressions) {
    if (!cron.validate(expr)) {
      logScheduler("error", `Expressão cron inválida para ${name}: ${expr}`);
      return;
    }
  }

  // Agendar backup diário às 03:00
  const dailyBackupTask = cron.schedule(finalConfig.dailyBackupCron, runDailyBackup, {
    timezone: "America/Sao_Paulo",
  });
  scheduledTasks.set("daily-backup", {
    name: "Backup Diário",
    task: dailyBackupTask,
    cronExpression: finalConfig.dailyBackupCron,
  });

  // Agendar limpeza diária às 02:00
  const cleanupTask = cron.schedule(finalConfig.cleanupCron, runCleanup, {
    timezone: "America/Sao_Paulo",
  });
  scheduledTasks.set("cleanup", {
    name: "Limpeza de Backups",
    task: cleanupTask,
    cronExpression: finalConfig.cleanupCron,
  });

  // Agendar teste de restauração semanal (domingos às 04:00)
  const weeklyTestTask = cron.schedule(finalConfig.weeklyTestCron, runWeeklyRestoreTest, {
    timezone: "America/Sao_Paulo",
  });
  scheduledTasks.set("weekly-restore-test", {
    name: "Teste de Restauração Semanal",
    task: weeklyTestTask,
    cronExpression: finalConfig.weeklyTestCron,
  });

  // Agendar verificação de integridade semanal (segundas às 06:00)
  const integrityTask = cron.schedule(finalConfig.integrityCheckCron, runWeeklyIntegrityCheck, {
    timezone: "America/Sao_Paulo",
  });
  scheduledTasks.set("integrity-check", {
    name: "Verificação de Integridade",
    task: integrityTask,
    cronExpression: finalConfig.integrityCheckCron,
  });

  // Agendar relatório mensal (dia 1 às 05:00)
  const monthlyReportTask = cron.schedule(finalConfig.monthlyReportCron, runMonthlyAuditReport, {
    timezone: "America/Sao_Paulo",
  });
  scheduledTasks.set("monthly-report", {
    name: "Relatório Mensal de Auditoria",
    task: monthlyReportTask,
    cronExpression: finalConfig.monthlyReportCron,
  });

  isInitialized = true;
  logScheduler("info", "Scheduler de backup inicializado com sucesso", {
    tasks: Array.from(scheduledTasks.keys()),
  });
}

/**
 * Para o scheduler de backup
 */
export function stopBackupScheduler(): void {
  if (!isInitialized) {
    logScheduler("warn", "Scheduler não está inicializado");
    return;
  }

  logScheduler("info", "Parando scheduler de backup");

  for (const [name, { task }] of Array.from(scheduledTasks.entries())) {
    task.stop();
    logScheduler("info", `Tarefa ${name} parada`);
  }

  scheduledTasks.clear();
  isInitialized = false;

  logScheduler("info", "Scheduler de backup parado");
}

/**
 * Obtém o status do scheduler
 */
export function getSchedulerStatus(): {
  initialized: boolean;
  tasks: Array<{
    name: string;
    cronExpression: string;
    lastRun?: Date;
    lastStatus?: string;
    lastError?: string;
  }>;
} {
  return {
    initialized: isInitialized,
    tasks: Array.from(scheduledTasks.entries()).map(([key, task]) => ({
      name: task.name,
      cronExpression: task.cronExpression,
      lastRun: task.lastRun,
      lastStatus: task.lastStatus,
      lastError: task.lastError,
    })),
  };
}

/**
 * Executa uma tarefa manualmente (para testes ou execução imediata)
 */
export async function runTaskManually(
  taskName: "daily-backup" | "cleanup" | "weekly-restore-test" | "integrity-check" | "monthly-report"
): Promise<void> {
  logScheduler("info", `Execução manual da tarefa: ${taskName}`);

  switch (taskName) {
    case "daily-backup":
      await runDailyBackup();
      break;
    case "cleanup":
      await runCleanup();
      break;
    case "weekly-restore-test":
      await runWeeklyRestoreTest();
      break;
    case "integrity-check":
      await runWeeklyIntegrityCheck();
      break;
    case "monthly-report":
      await runMonthlyAuditReport();
      break;
    default:
      logScheduler("error", `Tarefa desconhecida: ${taskName}`);
  }
}

// ==========================================
// EXPORTAÇÕES PARA TESTES
// ==========================================

export const __test__ = {
  runDailyBackup,
  runCleanup,
  runWeeklyRestoreTest,
  runWeeklyIntegrityCheck,
  runMonthlyAuditReport,
  getActiveTenantsWithBackup,
};
