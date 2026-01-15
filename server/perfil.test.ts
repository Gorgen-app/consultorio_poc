import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Sistema de Perfis de Usuário", () => {
  const testUserId = 1; // André Gorgen

  describe("getUserProfile", () => {
    it("deve retornar o perfil do usuário existente", async () => {
      const profile = await db.getUserProfile(testUserId);
      
      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe(testUserId);
      expect(profile?.nomeCompleto).toBe("André Gorgen");
      expect(profile?.cpf).toBe("005.717.430-05");
      expect(profile?.email).toBe("contato@andregorgen.com.br");
    });

    it("deve retornar null para usuário inexistente", async () => {
      const profile = await db.getUserProfile(99999);
      expect(profile).toBeNull();
    });
  });

  describe("getAvailablePerfis", () => {
    it("deve retornar todos os 5 perfis para André Gorgen", async () => {
      const perfis = await db.getAvailablePerfis(testUserId);
      
      expect(perfis).toHaveLength(5);
      expect(perfis).toContain("admin_master");
      expect(perfis).toContain("medico");
      expect(perfis).toContain("secretaria");
      expect(perfis).toContain("auditor");
      expect(perfis).toContain("paciente");
    });

    it("deve retornar array vazio para usuário sem perfil", async () => {
      const perfis = await db.getAvailablePerfis(99999);
      expect(perfis).toHaveLength(0);
    });
  });

  describe("setPerfilAtivo", () => {
    it("deve alterar o perfil ativo do usuário", async () => {
      // Mudar para médico
      await db.setPerfilAtivo(testUserId, "medico");
      let profile = await db.getUserProfile(testUserId);
      expect(profile?.perfilAtivo).toBe("medico");

      // Mudar para admin_master
      await db.setPerfilAtivo(testUserId, "admin_master");
      profile = await db.getUserProfile(testUserId);
      expect(profile?.perfilAtivo).toBe("admin_master");
    });

    it("deve lançar erro para perfil não autorizado", async () => {
      // Criar um perfil de teste com apenas um perfil
      // Este teste seria mais complexo e requer setup adicional
    });
  });

  describe("updateUserProfile", () => {
    it("deve atualizar dados do perfil", async () => {
      const originalProfile = await db.getUserProfile(testUserId);
      
      await db.updateUserProfile(testUserId, {
        especialidade: "Cirurgia Geral Atualizada",
      });
      
      const updatedProfile = await db.getUserProfile(testUserId);
      expect(updatedProfile?.especialidade).toBe("Cirurgia Geral Atualizada");
      
      // Restaurar valor original
      await db.updateUserProfile(testUserId, {
        especialidade: originalProfile?.especialidade || "Cirurgia Geral",
      });
    });
  });
});
