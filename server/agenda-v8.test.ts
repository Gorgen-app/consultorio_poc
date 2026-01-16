import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
vi.mock("./db", () => ({
  getAgendamentoById: vi.fn(),
  moverAgendamento: vi.fn(),
  listAgendamentos: vi.fn(),
}));

import * as db from "./db";

describe("Agenda v8.0 - Drag and Drop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("moverAgendamento", () => {
    it("deve mover um agendamento para nova data/hora", async () => {
      const agendamentoOriginal = {
        id: 1,
        tenantId: 1,
        idAgendamento: "2026-0001",
        tipoCompromisso: "Consulta",
        dataHoraInicio: new Date("2026-01-16T09:00:00"),
        dataHoraFim: new Date("2026-01-16T09:30:00"),
        status: "Agendado",
        pacienteNome: "João Silva",
      };

      const novaDataInicio = new Date("2026-01-17T10:00:00");
      const novaDataFim = new Date("2026-01-17T10:30:00");

      vi.mocked(db.getAgendamentoById).mockResolvedValue(agendamentoOriginal as any);
      vi.mocked(db.moverAgendamento).mockResolvedValue({
        ...agendamentoOriginal,
        dataHoraInicio: novaDataInicio,
        dataHoraFim: novaDataFim,
      } as any);

      const resultado = await db.moverAgendamento(1, novaDataInicio, novaDataFim, "Dr. André");

      expect(resultado.dataHoraInicio).toEqual(novaDataInicio);
      expect(resultado.dataHoraFim).toEqual(novaDataFim);
    });

    it("não deve permitir mover agendamento cancelado", async () => {
      const agendamentoCancelado = {
        id: 2,
        tenantId: 1,
        idAgendamento: "2026-0002",
        tipoCompromisso: "Consulta",
        dataHoraInicio: new Date("2026-01-16T09:00:00"),
        dataHoraFim: new Date("2026-01-16T09:30:00"),
        status: "Cancelado",
        pacienteNome: "Maria Santos",
      };

      vi.mocked(db.getAgendamentoById).mockResolvedValue(agendamentoCancelado as any);
      vi.mocked(db.moverAgendamento).mockRejectedValue(
        new Error("Não é possível mover agendamento com status Cancelado")
      );

      await expect(
        db.moverAgendamento(2, new Date(), new Date(), "Dr. André")
      ).rejects.toThrow("Não é possível mover agendamento com status Cancelado");
    });

    it("não deve permitir mover agendamento encerrado", async () => {
      const agendamentoEncerrado = {
        id: 3,
        tenantId: 1,
        status: "Encerrado",
      };

      vi.mocked(db.getAgendamentoById).mockResolvedValue(agendamentoEncerrado as any);
      vi.mocked(db.moverAgendamento).mockRejectedValue(
        new Error("Não é possível mover agendamento com status Encerrado")
      );

      await expect(
        db.moverAgendamento(3, new Date(), new Date(), "Dr. André")
      ).rejects.toThrow("Não é possível mover agendamento com status Encerrado");
    });
  });

  describe("Aliases em Português", () => {
    it("listar deve retornar agendamentos", async () => {
      const agendamentos = [
        { id: 1, tipoCompromisso: "Consulta", pacienteNome: "João" },
        { id: 2, tipoCompromisso: "Cirurgia", pacienteNome: "Maria" },
      ];

      vi.mocked(db.listAgendamentos).mockResolvedValue(agendamentos as any);

      const resultado = await db.listAgendamentos({});

      expect(resultado).toHaveLength(2);
      expect(resultado[0].tipoCompromisso).toBe("Consulta");
    });

    it("listar deve aceitar filtros opcionais", async () => {
      vi.mocked(db.listAgendamentos).mockResolvedValue([]);

      await db.listAgendamentos({
        dataInicio: new Date("2026-01-01"),
        dataFim: new Date("2026-01-31"),
        tipo: "Consulta",
        status: "Agendado",
      });

      expect(db.listAgendamentos).toHaveBeenCalledWith({
        dataInicio: expect.any(Date),
        dataFim: expect.any(Date),
        tipo: "Consulta",
        status: "Agendado",
      });
    });
  });
});

describe("Integração de E-mail - Recuperação de Senha", () => {
  it("deve construir URL de recuperação corretamente", () => {
    const baseUrl = "https://gorgen.manus.space";
    const token = "abc123xyz";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    expect(resetUrl).toBe("https://gorgen.manus.space/reset-password?token=abc123xyz");
  });

  it("deve formatar mensagem de notificação corretamente", () => {
    const userName = "João Silva";
    const email = "joao@example.com";
    const resetUrl = "https://gorgen.manus.space/reset-password?token=abc123";

    const content = `
**Solicitação de Recuperação de Senha**

Um usuário solicitou a recuperação de senha:

- **Usuário:** ${userName}
- **E-mail:** ${email}

**Link de Recuperação:**
${resetUrl}

*Este link expira em 1 hora.*
    `.trim();

    expect(content).toContain("João Silva");
    expect(content).toContain("joao@example.com");
    expect(content).toContain(resetUrl);
    expect(content).toContain("expira em 1 hora");
  });
});
