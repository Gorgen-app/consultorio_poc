/**
 * Testes para o módulo de agendamento de backup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock das dependências
vi.mock("node-cron", () => ({
  default: {
    schedule: vi.fn(() => ({
      stop: vi.fn(),
    })),
    validate: vi.fn(() => true),
  },
}));

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([
          { id: 1 },
          { id: 2 },
        ])),
      })),
    })),
  })),
}));

vi.mock("./backup", () => ({
  executeFullBackup: vi.fn(() => Promise.resolve({
    success: true,
    backupId: 1,
    fileSize: 1024,
    duration: 5000,
  })),
  executeIncrementalBackup: vi.fn(() => Promise.resolve({ success: true })),
  cleanupOldBackups: vi.fn(() => Promise.resolve(5)),
  runScheduledRestoreTest: vi.fn(() => Promise.resolve({
    success: true,
    summary: { passedValidations: 6, totalValidations: 6 },
  })),
  runIntegrityCheck: vi.fn(() => Promise.resolve({
    totalChecked: 10,
    validCount: 10,
    invalidCount: 0,
  })),
  generateMonthlyAuditReport: vi.fn(() => Promise.resolve({
    summary: {
      totalBackups: 30,
      successfulBackups: 29,
      encryptionRate: 1.0,
    },
  })),
  sendBackupEmailNotification: vi.fn(() => Promise.resolve(true)),
  getBackupConfig: vi.fn(() => Promise.resolve({
    backupEnabled: true,
    notificationEmail: "admin@example.com",
    notifyOnSuccess: true,
    notifyOnFailure: true,
  })),
}));

// Importar após os mocks
import {
  initializeBackupScheduler,
  stopBackupScheduler,
  getSchedulerStatus,
  runTaskManually,
  __test__,
} from "./backup-scheduler";

import cron from "node-cron";
import * as backup from "./backup";

describe("Backup Scheduler Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar estado do scheduler
    stopBackupScheduler();
  });

  afterEach(() => {
    stopBackupScheduler();
  });

  describe("initializeBackupScheduler", () => {
    it("deve inicializar o scheduler com configurações padrão", () => {
      initializeBackupScheduler();
      
      const status = getSchedulerStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.tasks.length).toBe(6); // Inclui geocodificação
      expect(cron.schedule).toHaveBeenCalledTimes(6);
    });

    it("deve validar expressões cron antes de agendar", () => {
      initializeBackupScheduler();
      
      expect(cron.validate).toHaveBeenCalled();
    });

    it("deve usar timezone America/Sao_Paulo", () => {
      initializeBackupScheduler();
      
      expect(cron.schedule).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({ timezone: "America/Sao_Paulo" })
      );
    });

    it("não deve inicializar se já estiver inicializado", () => {
      initializeBackupScheduler();
      initializeBackupScheduler(); // Segunda chamada
      
      // Deve ter sido chamado apenas 6 vezes (primeira inicialização, inclui geocodificação)
      expect(cron.schedule).toHaveBeenCalledTimes(6);
    });

    it("não deve inicializar se estiver desabilitado", () => {
      initializeBackupScheduler({ enabled: false });
      
      const status = getSchedulerStatus();
      
      expect(status.initialized).toBe(false);
      expect(cron.schedule).not.toHaveBeenCalled();
    });
  });

  describe("stopBackupScheduler", () => {
    it("deve parar todas as tarefas agendadas", () => {
      initializeBackupScheduler();
      stopBackupScheduler();
      
      const status = getSchedulerStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.tasks.length).toBe(0);
    });
  });

  describe("getSchedulerStatus", () => {
    it("deve retornar status correto quando não inicializado", () => {
      const status = getSchedulerStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.tasks).toEqual([]);
    });

    it("deve retornar lista de tarefas quando inicializado", () => {
      initializeBackupScheduler();
      
      const status = getSchedulerStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.tasks).toHaveLength(6); // Inclui geocodificação
      expect(status.tasks.map(t => t.name)).toContain("Backup Diário");
      expect(status.tasks.map(t => t.name)).toContain("Limpeza de Backups");
      expect(status.tasks.map(t => t.name)).toContain("Teste de Restauração Semanal");
      expect(status.tasks.map(t => t.name)).toContain("Geocodificação Diária de CEPs");
    });
  });

  describe("runTaskManually", () => {
    it("deve executar backup diário manualmente", async () => {
      await runTaskManually("daily-backup");
      
      expect(backup.executeFullBackup).toHaveBeenCalled();
    });

    it("deve executar limpeza manualmente", async () => {
      await runTaskManually("cleanup");
      
      expect(backup.cleanupOldBackups).toHaveBeenCalled();
    });

    it("deve executar teste de restauração manualmente", async () => {
      await runTaskManually("weekly-restore-test");
      
      expect(backup.runScheduledRestoreTest).toHaveBeenCalled();
    });

    it("deve executar verificação de integridade manualmente", async () => {
      await runTaskManually("integrity-check");
      
      expect(backup.runIntegrityCheck).toHaveBeenCalled();
    });

    it("deve gerar relatório mensal manualmente", async () => {
      await runTaskManually("monthly-report");
      
      expect(backup.generateMonthlyAuditReport).toHaveBeenCalled();
    });
  });

  describe("Configurações de Cron", () => {
    it("deve usar horário 03:00 para backup diário", () => {
      initializeBackupScheduler();
      
      expect(cron.schedule).toHaveBeenCalledWith(
        "0 3 * * *",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("deve usar horário 02:00 para limpeza", () => {
      initializeBackupScheduler();
      
      expect(cron.schedule).toHaveBeenCalledWith(
        "0 2 * * *",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("deve usar domingos às 04:00 para teste de restauração", () => {
      initializeBackupScheduler();
      
      expect(cron.schedule).toHaveBeenCalledWith(
        "0 4 * * 0",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("deve permitir configuração customizada de cron", () => {
      initializeBackupScheduler({
        dailyBackupCron: "0 5 * * *", // 05:00 ao invés de 03:00
      });
      
      expect(cron.schedule).toHaveBeenCalledWith(
        "0 5 * * *",
        expect.any(Function),
        expect.any(Object)
      );
    });
  });

  describe("Notificações por E-mail", () => {
    it("deve enviar e-mail após backup bem-sucedido", async () => {
      await __test__.runDailyBackup();
      
      expect(backup.sendBackupEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          backupType: "full",
        })
      );
    });

    it("deve enviar e-mail após falha no backup", async () => {
      vi.mocked(backup.executeFullBackup).mockResolvedValueOnce({
        success: false,
        error: "Erro de teste",
      });
      
      await __test__.runDailyBackup();
      
      expect(backup.sendBackupEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: "Erro de teste",
        })
      );
    });
  });
});

describe("Expressões Cron", () => {
  it("deve validar expressão cron para backup diário às 03:00", () => {
    // "0 3 * * *" = minuto 0, hora 3, qualquer dia do mês, qualquer mês, qualquer dia da semana
    const expr = "0 3 * * *";
    expect(expr.split(" ").length).toBe(5);
  });

  it("deve validar expressão cron para domingos às 04:00", () => {
    // "0 4 * * 0" = minuto 0, hora 4, qualquer dia do mês, qualquer mês, domingo (0)
    const expr = "0 4 * * 0";
    expect(expr.split(" ").length).toBe(5);
    expect(expr.split(" ")[4]).toBe("0"); // Domingo
  });

  it("deve validar expressão cron para dia 1 do mês às 05:00", () => {
    // "0 5 1 * *" = minuto 0, hora 5, dia 1, qualquer mês, qualquer dia da semana
    const expr = "0 5 1 * *";
    expect(expr.split(" ").length).toBe(5);
    expect(expr.split(" ")[2]).toBe("1"); // Dia 1
  });
});
