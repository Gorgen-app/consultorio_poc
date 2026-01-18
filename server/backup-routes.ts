/**
 * GORGEN - Rotas de Administração do Sistema de Backup
 * 
 * Este módulo adiciona rotas para monitoramento e controle do scheduler de backup.
 * Todas as rotas são restritas ao usuário Master/Administrador.
 */

import { z } from "zod";
import { router, tenantProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getUserProfile } from "./db";
import {
  getSchedulerStatus,
  runTaskManually,
  initializeBackupScheduler,
  stopBackupScheduler,
} from "./backup-scheduler";
import { getBackupSystemInfo } from "./_core/backup-init";

type TaskName = "daily-backup" | "cleanup" | "weekly-restore-test" | "integrity-check" | "monthly-report";

/**
 * Middleware para verificar se o usuário é admin_master
 */
const adminMasterProcedure = tenantProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Usuário não autenticado",
    });
  }

  const profile = await getUserProfile(ctx.user.id);
  if (profile?.perfilAtivo !== "admin_master") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas o administrador master pode acessar esta funcionalidade",
    });
  }
  return next({ ctx });
});

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
      const taskName = input.taskName as TaskName;
      await runTaskManually(taskName);
      return { success: true, message: `Tarefa ${taskName} executada` };
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
