import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

/**
 * Testes de performance da agenda
 * Valida que a agenda carrega 135 agendamentos em menos de 500ms
 */

describe("Agenda Performance Tests", () => {
  const dataInicio = new Date("2025-12-16");
  const dataFim = new Date("2026-02-14");

  it("should list agendamentos within 500ms", async () => {
    const startTime = Date.now();
    
    const result = await db.listAgendamentos({
      dataInicio,
      dataFim,
      incluirCancelados: false,
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✓ Listagem de ${result.length} agendamentos em ${duration}ms`);
    
    // Deve ser rápido (menos de 500ms para 135 agendamentos)
    expect(duration).toBeLessThan(500);
  });

  it("should handle filtering by type", async () => {
    const startTime = Date.now();
    
    const result = await db.listAgendamentos({
      dataInicio,
      dataFim,
      tipo: "Consulta",
      incluirCancelados: false,
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✓ Filtro por tipo em ${duration}ms (${result.length} resultados)`);
    
    expect(duration).toBeLessThan(300);
  });

  it("should handle filtering by patient", async () => {
    const startTime = Date.now();
    
    const result = await db.listAgendamentos({
      dataInicio,
      dataFim,
      pacienteId: 1,
      incluirCancelados: false,
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✓ Filtro por paciente em ${duration}ms (${result.length} resultados)`);
    
    expect(duration).toBeLessThan(300);
  });

  it("should handle multiple concurrent queries", async () => {
    const startTime = Date.now();
    
    // Simular 5 queries concorrentes
    const promises = Array.from({ length: 5 }, () =>
      db.listAgendamentos({
        dataInicio,
        dataFim,
        incluirCancelados: false,
      })
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log(`✓ 5 queries concorrentes em ${duration}ms`);
    
    // Cada query deve ser rápida mesmo com concorrência
    expect(duration).toBeLessThan(1000);
    expect(results.length).toBe(5);
  });

  it("should return correct data structure", async () => {
    const result = await db.listAgendamentos({
      dataInicio,
      dataFim,
      incluirCancelados: false,
    });
    
    if (result.length > 0) {
      const agendamento = result[0];
      
      // Verificar campos essenciais
      expect(agendamento).toHaveProperty("id");
      expect(agendamento).toHaveProperty("idAgendamento");
      expect(agendamento).toHaveProperty("tipoCompromisso");
      expect(agendamento).toHaveProperty("dataHoraInicio");
      expect(agendamento).toHaveProperty("dataHoraFim");
      expect(agendamento).toHaveProperty("status");
      
      console.log(`✓ Estrutura de dados validada`);
    }
  });
});
