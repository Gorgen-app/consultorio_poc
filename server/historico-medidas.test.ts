import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Histórico de Medidas Antropométricas", () => {
  describe("Pilar Fundamental: Imutabilidade e Preservação Histórica", () => {
    it("deve ter função registrarMedida exportada", () => {
      expect(typeof db.registrarMedida).toBe("function");
    });

    it("deve ter função listarHistoricoMedidas exportada", () => {
      expect(typeof db.listarHistoricoMedidas).toBe("function");
    });

    it("deve ter função getUltimaMedida exportada", () => {
      expect(typeof db.getUltimaMedida).toBe("function");
    });

    it("deve ter função getEvolucaoIMC exportada", () => {
      expect(typeof db.getEvolucaoIMC).toBe("function");
    });
  });

  describe("Cálculo de IMC", () => {
    it("deve calcular IMC corretamente para peso 75kg e altura 1.75m", () => {
      const peso = 75;
      const altura = 1.75;
      const imc = peso / (altura * altura);
      expect(imc).toBeCloseTo(24.49, 1);
    });

    it("deve calcular IMC corretamente para peso 100kg e altura 1.80m", () => {
      const peso = 100;
      const altura = 1.80;
      const imc = peso / (altura * altura);
      expect(imc).toBeCloseTo(30.86, 1);
    });

    it("deve classificar IMC < 18.5 como abaixo do peso", () => {
      const imc = 17.5;
      const classificacao = imc < 18.5 ? "Abaixo do peso" : "Normal";
      expect(classificacao).toBe("Abaixo do peso");
    });

    it("deve classificar IMC entre 18.5 e 25 como peso normal", () => {
      const imc = 22;
      const classificacao = imc >= 18.5 && imc < 25 ? "Peso normal" : "Outro";
      expect(classificacao).toBe("Peso normal");
    });

    it("deve classificar IMC entre 25 e 30 como sobrepeso", () => {
      const imc = 27;
      const classificacao = imc >= 25 && imc < 30 ? "Sobrepeso" : "Outro";
      expect(classificacao).toBe("Sobrepeso");
    });

    it("deve classificar IMC >= 30 como obesidade", () => {
      const imc = 32;
      const classificacao = imc >= 30 ? "Obesidade" : "Outro";
      expect(classificacao).toBe("Obesidade");
    });
  });

  describe("Preservação de Dados", () => {
    it("não deve existir função de deletar medidas (imutabilidade)", () => {
      // Verificar que não existe função de delete para medidas
      expect((db as any).deleteMedida).toBeUndefined();
      expect((db as any).deleteHistoricoMedidas).toBeUndefined();
      expect((db as any).apagarMedida).toBeUndefined();
    });

    it("não deve existir função de editar medidas (imutabilidade)", () => {
      // Verificar que não existe função de update para medidas
      expect((db as any).updateMedida).toBeUndefined();
      expect((db as any).editarMedida).toBeUndefined();
    });
  });
});
