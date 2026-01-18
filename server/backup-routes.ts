/**
 * GORGEN - Rotas de Administração do Sistema de Backup
 * 
 * Este módulo adiciona rotas para monitoramento e controle do scheduler de backup.
 * Todas as rotas são restritas ao usuário Master/Administrador.
 */

import { z } from "zod";
import { router, adminMasterProcedure } from "./routers";
import {
  getSchedulerStatus,
  runTaskManually,
  initializeBackupScheduler,
  stopBackupScheduler,
} from "./backup-scheduler";
import { getBackupSystemInfo } from "./_core/backup-init";

/**
 * Router para administração do scheduler de backup
 * Todas as rotas requerem perfil admin_master
 */
export const backupSchedulerRouter = router({
  /**
   * Obtém o status atual do scheduler
   */
  getStatus: adminMasterProcedure
    .query(async () => {
      return getBackupSystemInfo();
    }),

  /**
   * Obtém status detalhado de todas as tarefas
   */
  getDetailedStatus: adminMasterProcedure
    .query(async () => {
      return getSchedulerStatus();
    }),

  /**
   * Executa uma tarefa manualmente
   */
  runTask: adminMasterProcedure
    .input(z.object({
      taskName: z.enum([
        "daily-backup",
        "cleanup",
        "weekly-restore-test",
        "integrity-check",
        "monthly-report",
      ]),
    }))
    .mutation(async ({ input }) => {
      await runTaskManually(input.taskName);
      return { success: true, message: `Tarefa ${input.taskName} executada` };
    }),

  /**
   * Reinicia o scheduler (para aplicar novas configurações)
   */
  restart: adminMasterProcedure
    .mutation(async () => {
      stopBackupScheduler();
      initializeBackupScheduler();
      return { success: true, message: "Scheduler reiniciado" };
    }),

  /**
   * Para o scheduler (uso emergencial)
   */
  stop: adminMasterProcedure
    .mutation(async () => {
      stopBackupScheduler();
      return { success: true, message: "Scheduler parado" };
    }),

  /**
   * Inicia o scheduler
   */
  start: adminMasterProcedure
    .mutation(async () => {
      initializeBackupScheduler();
      return { success: true, message: "Scheduler iniciado" };
    }),
});

export type BackupSchedulerRouter = typeof backupSchedulerRouter;
