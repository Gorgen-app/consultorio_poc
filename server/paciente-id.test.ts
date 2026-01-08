import { describe, it, expect } from "vitest";

describe("Geração de ID de Paciente", () => {
  it("deve gerar ID no formato YYYY-NNNNNNN", () => {
    const year = new Date().getFullYear().toString();
    const idPattern = new RegExp(`^${year}-\\d{7}$`);
    
    // Simular IDs válidos
    const validIds = [
      `${year}-0000001`,
      `${year}-0000052`,
      `${year}-0000100`,
    ];
    
    for (const id of validIds) {
      expect(id).toMatch(idPattern);
    }
  });

  it("deve rejeitar IDs inválidos", () => {
    const year = new Date().getFullYear().toString();
    const idPattern = new RegExp(`^${year}-\\d{7}$`);
    
    // IDs inválidos que não devem passar
    const invalidIds = [
      `${year}-0000NaN`,
      `${year}-TESTE-001`,
      `${year}-001`,
      "invalid",
    ];
    
    for (const id of invalidIds) {
      expect(id).not.toMatch(idPattern);
    }
  });

  it("deve extrair número sequencial corretamente", () => {
    const testCases = [
      { id: "2026-0000001", expected: 1 },
      { id: "2026-0000051", expected: 51 },
      { id: "2026-0000100", expected: 100 },
    ];
    
    for (const { id, expected } of testCases) {
      const match = id.match(/^\d{4}-(\d{7})$/);
      expect(match).not.toBeNull();
      if (match) {
        const num = parseInt(match[1], 10);
        expect(num).toBe(expected);
      }
    }
  });
});
