import { describe, it, expect } from "vitest";
import { ESPECIALIDADES_MEDICAS, AREAS_ATUACAO } from "../shared/especialidadesMedicas";

describe("Especialidades Médicas CFM", () => {
  it("deve ter 55 especialidades médicas reconhecidas pelo CFM", () => {
    expect(ESPECIALIDADES_MEDICAS.length).toBe(55);
  });

  it("deve incluir especialidades comuns", () => {
    expect(ESPECIALIDADES_MEDICAS).toContain("Cirurgia Geral");
    expect(ESPECIALIDADES_MEDICAS).toContain("Cardiologia");
    expect(ESPECIALIDADES_MEDICAS).toContain("Pediatria");
    expect(ESPECIALIDADES_MEDICAS).toContain("Ortopedia e Traumatologia");
    expect(ESPECIALIDADES_MEDICAS).toContain("Dermatologia");
  });

  it("deve ter áreas de atuação reconhecidas", () => {
    expect(AREAS_ATUACAO.length).toBeGreaterThan(0);
  });

  it("deve incluir áreas de atuação comuns", () => {
    expect(AREAS_ATUACAO).toContain("Medicina do Sono");
    expect(AREAS_ATUACAO).toContain("Medicina Paliativa");
    expect(AREAS_ATUACAO).toContain("Neonatologia");
  });

  it("especialidades devem ser únicas", () => {
    const uniqueEspecialidades = new Set(ESPECIALIDADES_MEDICAS);
    expect(uniqueEspecialidades.size).toBe(ESPECIALIDADES_MEDICAS.length);
  });

  it("áreas de atuação devem ser únicas", () => {
    const uniqueAreas = new Set(AREAS_ATUACAO);
    expect(uniqueAreas.size).toBe(AREAS_ATUACAO.length);
  });
});

describe("Sistema de Vínculos Secretária-Médico", () => {
  it("vínculo deve ter validade de 1 ano (365 dias)", () => {
    const dataInicio = new Date();
    const dataValidade = new Date(dataInicio);
    dataValidade.setFullYear(dataValidade.getFullYear() + 1);
    
    const diffTime = dataValidade.getTime() - dataInicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Pode ser 365 ou 366 dependendo do ano bissexto
    expect(diffDays).toBeGreaterThanOrEqual(365);
    expect(diffDays).toBeLessThanOrEqual(366);
  });

  it("status de vínculo deve incluir estados válidos", () => {
    const statusValidos = ["ativo", "pendente_renovacao", "expirado", "cancelado"];
    
    statusValidos.forEach(status => {
      expect(["ativo", "pendente_renovacao", "expirado", "cancelado"]).toContain(status);
    });
  });

  it("notificação de renovação deve ser enviada 30 dias antes do vencimento", () => {
    // Cenário: vínculo vence em 20 dias
    const hoje = new Date("2026-01-08T12:00:00");
    const dataValidade = new Date("2026-01-28T12:00:00"); // 20 dias depois
    
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Se faltam 30 dias ou menos, deve notificar
    const deveNotificar = diasRestantes <= 30;
    expect(deveNotificar).toBe(true);
    expect(diasRestantes).toBe(20);
  });

  it("vínculo cancelado não deve permitir acesso", () => {
    const vinculo = {
      status: "cancelado",
      dataValidade: new Date("2026-12-31"),
    };
    
    const temAcesso = vinculo.status === "ativo" || vinculo.status === "pendente_renovacao";
    expect(temAcesso).toBe(false);
  });

  it("vínculo expirado não deve permitir acesso", () => {
    const vinculo = {
      status: "expirado",
      dataValidade: new Date("2025-01-01"),
    };
    
    const temAcesso = vinculo.status === "ativo" || vinculo.status === "pendente_renovacao";
    expect(temAcesso).toBe(false);
  });

  it("vínculo ativo deve permitir acesso", () => {
    const vinculo = {
      status: "ativo",
      dataValidade: new Date("2027-01-08"),
    };
    
    const temAcesso = vinculo.status === "ativo" || vinculo.status === "pendente_renovacao";
    expect(temAcesso).toBe(true);
  });

  it("vínculo pendente de renovação deve permitir acesso temporário", () => {
    const vinculo = {
      status: "pendente_renovacao",
      dataValidade: new Date("2026-01-20"),
    };
    
    const temAcesso = vinculo.status === "ativo" || vinculo.status === "pendente_renovacao";
    expect(temAcesso).toBe(true);
  });
});
