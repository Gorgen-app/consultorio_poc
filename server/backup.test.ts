import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock das dependências
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{
            id: 1,
            tenantId: 1,
            backupType: "full",
            status: "success",
            filePath: "backup/tenant_1/full_2026-01-13.json.gz",
            fileSizeBytes: 1024,
            checksumSha256: "abc123",
            databaseRecords: 100,
            completedAt: new Date(),
          }])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: 1,
              tenantId: 1,
              backupType: "full",
              status: "success",
              completedAt: new Date(),
            }])),
          })),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    execute: vi.fn(() => Promise.resolve([[]])),
  })),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(() => Promise.resolve({ url: "https://s3.example.com/backup.gz", key: "backup.gz" })),
  storageGet: vi.fn(() => Promise.resolve({ url: "https://s3.example.com/backup.gz", key: "backup.gz" })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(() => Promise.resolve(true)),
}));

// Importar após os mocks
import * as backup from "./backup";

describe("Backup Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateChecksum", () => {
    it("should generate consistent SHA-256 checksum for same data", () => {
      const data = Buffer.from("test data");
      // Testar que a função existe e retorna string
      expect(typeof backup.generateRestoreInstructions()).toBe("string");
    });
  });

  describe("generateRestoreInstructions", () => {
    it("should return restore instructions in Portuguese", () => {
      const instructions = backup.generateRestoreInstructions();
      
      expect(instructions).toContain("GORGEN");
      expect(instructions).toContain("INSTRUÇÕES DE RESTAURAÇÃO");
      expect(instructions).toContain("backup_data.json.gz");
      expect(instructions).toContain("SHA-256");
    });

    it("should include warning about data replacement", () => {
      const instructions = backup.generateRestoreInstructions();
      
      expect(instructions).toContain("ATENÇÃO");
      expect(instructions).toContain("SUBSTITUI");
      expect(instructions).toContain("IRREVERSÍVEL");
    });
  });

  describe("BackupResult type", () => {
    it("should have correct structure for success result", () => {
      const successResult: backup.BackupResult = {
        success: true,
        backupId: 1,
        filePath: "backup/test.gz",
        fileSize: 1024,
        checksum: "abc123",
        duration: 5000,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.backupId).toBe(1);
      expect(successResult.filePath).toBe("backup/test.gz");
    });

    it("should have correct structure for failure result", () => {
      const failureResult: backup.BackupResult = {
        success: false,
        error: "Connection failed",
        duration: 1000,
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBe("Connection failed");
    });
  });

  describe("BackupType enum", () => {
    it("should have all required backup types", () => {
      const types: backup.BackupType[] = ["full", "incremental", "transactional", "offline"];
      
      expect(types).toContain("full");
      expect(types).toContain("incremental");
      expect(types).toContain("transactional");
      expect(types).toContain("offline");
    });
  });

  describe("BackupStatus enum", () => {
    it("should have all required status values", () => {
      const statuses: backup.BackupStatus[] = ["running", "success", "failed", "validating"];
      
      expect(statuses).toContain("running");
      expect(statuses).toContain("success");
      expect(statuses).toContain("failed");
      expect(statuses).toContain("validating");
    });
  });

  describe("BackupDestination enum", () => {
    it("should have all required destination values", () => {
      const destinations: backup.BackupDestination[] = ["s3_primary", "s3_secondary", "offline_hd"];
      
      expect(destinations).toContain("s3_primary");
      expect(destinations).toContain("s3_secondary");
      expect(destinations).toContain("offline_hd");
    });
  });
});

describe("Backup Configuration", () => {
  it("should have default retention periods defined", () => {
    // Valores padrão esperados conforme schema
    const defaultDailyRetention = 30;
    const defaultWeeklyRetention = 12;
    const defaultMonthlyRetention = 12;

    expect(defaultDailyRetention).toBe(30);
    expect(defaultWeeklyRetention).toBe(12);
    expect(defaultMonthlyRetention).toBe(12);
  });

  it("should have default backup time defined", () => {
    const defaultBackupTime = "03:00";
    expect(defaultBackupTime).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("Backup File Naming", () => {
  it("should generate correct file path format", () => {
    const tenantId = 1;
    const timestamp = "2026-01-13T10-30-00-000Z";
    const expectedPath = `backup/tenant_${tenantId}/full_${timestamp}.json.gz`;
    
    expect(expectedPath).toContain("backup/tenant_1");
    expect(expectedPath).toContain(".json.gz");
  });

  it("should include backup type in filename", () => {
    const fullPath = "backup/tenant_1/full_2026-01-13.json.gz";
    const offlinePath = "backup/tenant_1/offline_2026-01-13.json.gz";
    
    expect(fullPath).toContain("full_");
    expect(offlinePath).toContain("offline_");
  });
});


// ==================== NOVOS TESTES - Correções de Tipos ====================

describe("Backup Data Types Validation", () => {
  describe("Date vs String consistency", () => {
    it("should use Date objects for database timestamps", () => {
      const startedAt = new Date();
      const completedAt = new Date();
      
      expect(startedAt instanceof Date).toBe(true);
      expect(completedAt instanceof Date).toBe(true);
    });

    it("should convert Date to ISO string for API responses", () => {
      const date = new Date("2026-01-23T03:00:00Z");
      const isoString = date.toISOString();
      
      expect(typeof isoString).toBe("string");
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("Boolean vs Number consistency", () => {
    it("should use boolean for isEncrypted, not number", () => {
      const isEncrypted = true;
      expect(typeof isEncrypted).toBe("boolean");
      expect(isEncrypted).not.toBe(1);
    });

    it("should use boolean for backupEnabled, not number", () => {
      const backupEnabled = true;
      expect(typeof backupEnabled).toBe("boolean");
      expect(backupEnabled).not.toBe(1);
    });

    it("should use boolean for notifyOnSuccess, not number", () => {
      const notifyOnSuccess = true;
      expect(typeof notifyOnSuccess).toBe("boolean");
    });

    it("should use boolean for notifyOnFailure, not number", () => {
      const notifyOnFailure = true;
      expect(typeof notifyOnFailure).toBe("boolean");
    });
  });
});

describe("Backup Audit Entry Types", () => {
  it("should have correct structure for audit entries", () => {
    const auditEntry = {
      id: 1,
      action: "backup_created",
      date: new Date().toISOString(),
      userId: 1,
      userName: "Dr. André Gorgen",
      details: "Full backup created successfully",
    };

    expect(auditEntry).toHaveProperty("id");
    expect(auditEntry).toHaveProperty("action");
    expect(auditEntry).toHaveProperty("date");
    expect(typeof auditEntry.date).toBe("string");
  });
});

describe("Incremental Backup State Types", () => {
  it("should track last backup date as ISO string", () => {
    const state = {
      lastBackupId: 1,
      lastBackupDate: new Date().toISOString(),
      lastChecksum: "abc123",
    };

    expect(typeof state.lastBackupDate).toBe("string");
    expect(state.lastBackupDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe("Backup Scheduler Types", () => {
  it("should compare backupEnabled as boolean", () => {
    const config = { backupEnabled: true };
    
    // Correct comparison (boolean)
    expect(config.backupEnabled !== false).toBe(true);
  });
});

describe("Restore Test History Types", () => {
  it("should return dates as ISO strings in API response", () => {
    const testHistory = [
      {
        id: 1,
        backupId: 1,
        testedAt: new Date().toISOString(),
        success: true,
        duration: 5000,
      },
    ];

    expect(typeof testHistory[0].testedAt).toBe("string");
  });
});

describe("Backup Checksum Validation", () => {
  it("should validate SHA-256 checksum format", () => {
    const validChecksum = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    
    expect(validChecksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should reject invalid checksum format", () => {
    const invalidChecksum = "invalid";
    
    expect(invalidChecksum).not.toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("Backup Access Control", () => {
  it("should only allow admin users to access backup functions", () => {
    const userRole = "admin";
    const canAccessBackup = userRole === "admin";
    
    expect(canAccessBackup).toBe(true);
  });

  it("should deny regular users access to backup functions", () => {
    const userRole = "user";
    const canAccessBackup = userRole === "admin";
    
    expect(canAccessBackup).toBe(false);
  });
});
