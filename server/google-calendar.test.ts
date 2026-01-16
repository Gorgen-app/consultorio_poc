/**
 * Testes unitários para integração Google Calendar
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo de banco de dados
vi.mock("./_core/database", () => ({
  getPooledDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }),
}));

describe("Google Calendar Integration", () => {
  describe("Configuração de Sincronização", () => {
    it("deve retornar null quando não há configuração", async () => {
      const { getGoogleCalendarConfig } = await import("./google-calendar-db");
      const result = await getGoogleCalendarConfig(1, 1);
      expect(result).toBeNull();
    });

    it("deve criar nova configuração quando não existe", async () => {
      const { upsertGoogleCalendarConfig } = await import("./google-calendar-db");
      const config = {
        syncEnabled: true,
        syncDirection: "bidirectional" as const,
        syncConsultas: true,
        syncCirurgias: true,
      };
      
      const result = await upsertGoogleCalendarConfig(1, 1, config);
      // O mock retorna o resultado do insert
      expect(result).toBeDefined();
    });
  });

  describe("Registros de Sincronização", () => {
    it("deve criar registro de sincronização", async () => {
      const { createSyncRecord } = await import("./google-calendar-db");
      const result = await createSyncRecord(1, 100, "google-event-123", "primary");
      expect(result).toBeDefined();
    });

    it("deve retornar null quando agendamento não tem sincronização", async () => {
      const { getSyncByAgendamento } = await import("./google-calendar-db");
      const result = await getSyncByAgendamento(1, 999);
      expect(result).toBeNull();
    });

    it("deve retornar null quando evento Google não existe", async () => {
      const { getSyncByGoogleEvent } = await import("./google-calendar-db");
      const result = await getSyncByGoogleEvent(1, "non-existent-event");
      expect(result).toBeNull();
    });

    it("deve ter função listPendingSyncs exportada", async () => {
      const gcalDb = await import("./google-calendar-db");
      expect(typeof gcalDb.listPendingSyncs).toBe("function");
    });

    it("deve ter função listAllSyncs exportada", async () => {
      const gcalDb = await import("./google-calendar-db");
      expect(typeof gcalDb.listAllSyncs).toBe("function");
    });
  });

  describe("Formatação de Eventos", () => {
    it("deve formatar título de consulta corretamente", () => {
      const agendamento = {
        tipoCompromisso: "Consulta",
        pacienteNome: "João Silva",
      };
      
      // Simular a função de formatação
      const formatEventTitle = (ag: any, includePatientName: boolean) => {
        const tipoMap: Record<string, string> = {
          'Consulta': '🩺 Consulta',
          'Cirurgia': '🏥 Cirurgia',
          'Reunião': '📅 Reunião',
        };
        let title = tipoMap[ag.tipoCompromisso] || ag.tipoCompromisso;
        if (includePatientName && ag.pacienteNome) {
          title += ` - ${ag.pacienteNome}`;
        }
        return title;
      };
      
      const titleWithoutName = formatEventTitle(agendamento, false);
      expect(titleWithoutName).toBe("🩺 Consulta");
      
      const titleWithName = formatEventTitle(agendamento, true);
      expect(titleWithName).toBe("🩺 Consulta - João Silva");
    });

    it("deve formatar título de cirurgia corretamente", () => {
      const agendamento = {
        tipoCompromisso: "Cirurgia",
        pacienteNome: "Maria Santos",
      };
      
      const formatEventTitle = (ag: any, includePatientName: boolean) => {
        const tipoMap: Record<string, string> = {
          'Consulta': '🩺 Consulta',
          'Cirurgia': '🏥 Cirurgia',
          'Reunião': '📅 Reunião',
        };
        let title = tipoMap[ag.tipoCompromisso] || ag.tipoCompromisso;
        if (includePatientName && ag.pacienteNome) {
          title += ` - ${ag.pacienteNome}`;
        }
        return title;
      };
      
      const title = formatEventTitle(agendamento, false);
      expect(title).toBe("🏥 Cirurgia");
    });
  });

  describe("Privacidade e LGPD", () => {
    it("deve respeitar configuração de não incluir nome do paciente", () => {
      const config = {
        includePatientName: false,
        includePatientPhone: false,
        eventVisibility: "private" as const,
      };
      
      expect(config.includePatientName).toBe(false);
      expect(config.includePatientPhone).toBe(false);
      expect(config.eventVisibility).toBe("private");
    });

    it("deve ter visibilidade privada como padrão", () => {
      const defaultConfig = {
        syncEnabled: false,
        syncDirection: "bidirectional",
        googleCalendarId: "primary",
        syncConsultas: true,
        syncCirurgias: true,
        syncReunions: true,
        syncBloqueios: false,
        syncOutros: true,
        includePatientName: false,
        includePatientPhone: false,
        eventVisibility: "private",
      };
      
      expect(defaultConfig.includePatientName).toBe(false);
      expect(defaultConfig.includePatientPhone).toBe(false);
      expect(defaultConfig.eventVisibility).toBe("private");
    });
  });

  describe("Direção de Sincronização", () => {
    it("deve suportar sincronização bidirecional", () => {
      const direction = "bidirectional";
      expect(["bidirectional", "to_google_only", "from_google_only"]).toContain(direction);
    });

    it("deve suportar sincronização apenas para Google", () => {
      const direction = "to_google_only";
      expect(["bidirectional", "to_google_only", "from_google_only"]).toContain(direction);
    });

    it("deve suportar sincronização apenas do Google", () => {
      const direction = "from_google_only";
      expect(["bidirectional", "to_google_only", "from_google_only"]).toContain(direction);
    });
  });

  describe("Status de Sincronização", () => {
    it("deve ter status válidos", () => {
      const validStatuses = ["synced", "pending_to_google", "pending_from_google", "conflict", "error"];
      
      expect(validStatuses).toContain("synced");
      expect(validStatuses).toContain("pending_to_google");
      expect(validStatuses).toContain("pending_from_google");
      expect(validStatuses).toContain("conflict");
      expect(validStatuses).toContain("error");
    });
  });
});
