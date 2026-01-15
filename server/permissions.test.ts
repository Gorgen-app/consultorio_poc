import { describe, it, expect } from "vitest";
import { temPermissao, getFuncionalidadesPermitidas, permissoesPorPerfil } from "../shared/permissions";

describe("Sistema de Permissões", () => {
  describe("temPermissao", () => {
    it("deve retornar true para admin_master em qualquer funcionalidade", () => {
      expect(temPermissao("admin_master", "dashboard")).toBe(true);
      expect(temPermissao("admin_master", "prontuario")).toBe(true);
      expect(temPermissao("admin_master", "faturamento")).toBe(true);
      expect(temPermissao("admin_master", "usuarios")).toBe(true);
    });

    it("deve permitir acesso ao prontuário para perfil auditor (apenas visualização)", () => {
      expect(temPermissao("auditor", "prontuario")).toBe(true);
      expect(temPermissao("auditor", "prontuario.editar")).toBe(false);
    });

    it("deve permitir acesso ao faturamento para perfil auditor (apenas visualização)", () => {
      expect(temPermissao("auditor", "faturamento")).toBe(true);
      expect(temPermissao("auditor", "faturamento.criar")).toBe(false);
      expect(temPermissao("auditor", "faturamento.editar")).toBe(false);
    });

    it("deve negar acesso ao faturamento para perfil médico", () => {
      expect(temPermissao("medico", "faturamento")).toBe(false);
      expect(temPermissao("medico", "faturamento.criar")).toBe(false);
    });

    it("deve permitir acesso ao prontuário para perfil médico", () => {
      expect(temPermissao("medico", "prontuario")).toBe(true);
      expect(temPermissao("medico", "prontuario.editar")).toBe(true);
    });

    it("deve negar acesso ao prontuário para perfil secretária", () => {
      expect(temPermissao("secretaria", "prontuario")).toBe(false);
    });

    it("deve permitir acesso à agenda para perfil secretária", () => {
      expect(temPermissao("secretaria", "agenda")).toBe(true);
      expect(temPermissao("secretaria", "agenda.criar")).toBe(true);
    });

    it("deve negar criação de agenda para perfil auditor", () => {
      expect(temPermissao("auditor", "agenda")).toBe(true); // pode ver
      expect(temPermissao("auditor", "agenda.criar")).toBe(false); // não pode criar
    });

    it("deve retornar false para perfil null ou undefined", () => {
      expect(temPermissao(null, "dashboard")).toBe(false);
      expect(temPermissao(undefined, "dashboard")).toBe(false);
    });

    it("deve permitir paciente ver seu próprio prontuário mas não editar", () => {
      expect(temPermissao("paciente", "prontuario")).toBe(true);
      expect(temPermissao("paciente", "prontuario.editar")).toBe(false);
      expect(temPermissao("paciente", "agenda")).toBe(true);
      expect(temPermissao("paciente", "agenda.criar")).toBe(false);
      expect(temPermissao("paciente", "pacientes.criar")).toBe(false);
      expect(temPermissao("paciente", "dashboard")).toBe(false); // Paciente não vê dashboard geral
    });
  });

  describe("getFuncionalidadesPermitidas", () => {
    it("deve retornar todas as funcionalidades para admin_master", () => {
      const funcionalidades = getFuncionalidadesPermitidas("admin_master");
      expect(funcionalidades).toContain("dashboard");
      expect(funcionalidades).toContain("prontuario");
      expect(funcionalidades).toContain("faturamento");
      expect(funcionalidades).toContain("usuarios");
    });

    it("deve retornar funcionalidades limitadas para paciente", () => {
      const funcionalidades = getFuncionalidadesPermitidas("paciente");
      expect(funcionalidades).toContain("agenda");
      expect(funcionalidades).toContain("prontuario"); // Pode ver seu próprio prontuário
      expect(funcionalidades).not.toContain("agenda.criar");
      expect(funcionalidades).not.toContain("dashboard"); // Paciente não vê dashboard geral
    });
  });

  describe("permissoesPorPerfil", () => {
    it("deve ter todos os 5 perfis definidos", () => {
      expect(Object.keys(permissoesPorPerfil)).toHaveLength(5);
      expect(permissoesPorPerfil).toHaveProperty("admin_master");
      expect(permissoesPorPerfil).toHaveProperty("medico");
      expect(permissoesPorPerfil).toHaveProperty("secretaria");
      expect(permissoesPorPerfil).toHaveProperty("auditor");
      expect(permissoesPorPerfil).toHaveProperty("paciente");
    });

    it("deve ter as mesmas funcionalidades em todos os perfis", () => {
      const funcionalidadesAdmin = Object.keys(permissoesPorPerfil.admin_master);
      const funcionalidadesMedico = Object.keys(permissoesPorPerfil.medico);
      const funcionalidadesSecretaria = Object.keys(permissoesPorPerfil.secretaria);
      const funcionalidadesAuditor = Object.keys(permissoesPorPerfil.auditor);
      const funcionalidadesPaciente = Object.keys(permissoesPorPerfil.paciente);

      expect(funcionalidadesAdmin.length).toBe(funcionalidadesMedico.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesSecretaria.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesAuditor.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesPaciente.length);
    });
  });

  describe("Regras de negócio específicas", () => {
    it("sigilo médico: médico, admin e auditor podem acessar prontuário", () => {
      expect(temPermissao("admin_master", "prontuario")).toBe(true);
      expect(temPermissao("medico", "prontuario")).toBe(true);
      expect(temPermissao("auditor", "prontuario")).toBe(true); // Auditor pode ver para auditoria
      expect(temPermissao("secretaria", "prontuario")).toBe(false);
    });

    it("edição de prontuário: apenas médico e admin podem editar", () => {
      expect(temPermissao("admin_master", "prontuario.editar")).toBe(true);
      expect(temPermissao("medico", "prontuario.editar")).toBe(true);
      expect(temPermissao("auditor", "prontuario.editar")).toBe(false); // Auditor não edita
      expect(temPermissao("paciente", "prontuario.editar")).toBe(false);
    });

    it("gestão de usuários: apenas admin pode gerenciar usuários", () => {
      expect(temPermissao("admin_master", "usuarios")).toBe(true);
      expect(temPermissao("admin_master", "usuarios.criar")).toBe(true);
      expect(temPermissao("medico", "usuarios")).toBe(false);
      expect(temPermissao("secretaria", "usuarios")).toBe(false);
      expect(temPermissao("auditor", "usuarios")).toBe(false);
    });

    it("faturamento: auditor e admin podem ver, apenas admin pode editar", () => {
      expect(temPermissao("admin_master", "faturamento")).toBe(true);
      expect(temPermissao("admin_master", "faturamento.editar")).toBe(true);
      expect(temPermissao("auditor", "faturamento")).toBe(true);
      expect(temPermissao("auditor", "faturamento.editar")).toBe(false);
      expect(temPermissao("medico", "faturamento")).toBe(false);
      expect(temPermissao("secretaria", "faturamento")).toBe(false);
    });
  });
});
