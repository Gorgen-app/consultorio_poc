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

    it("deve negar acesso ao prontuário para perfil financeiro", () => {
      expect(temPermissao("financeiro", "prontuario")).toBe(false);
      expect(temPermissao("financeiro", "prontuario.editar")).toBe(false);
    });

    it("deve permitir acesso ao faturamento para perfil financeiro", () => {
      expect(temPermissao("financeiro", "faturamento")).toBe(true);
      expect(temPermissao("financeiro", "faturamento.criar")).toBe(true);
      expect(temPermissao("financeiro", "faturamento.editar")).toBe(true);
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

    it("deve negar criação de agenda para perfil financeiro", () => {
      expect(temPermissao("financeiro", "agenda")).toBe(true); // pode ver
      expect(temPermissao("financeiro", "agenda.criar")).toBe(false); // não pode criar
    });

    it("deve retornar false para perfil null ou undefined", () => {
      expect(temPermissao(null, "dashboard")).toBe(false);
      expect(temPermissao(undefined, "dashboard")).toBe(false);
    });

    it("deve negar tudo para perfil visualizador exceto visualização", () => {
      expect(temPermissao("visualizador", "dashboard")).toBe(true);
      expect(temPermissao("visualizador", "agenda")).toBe(true);
      expect(temPermissao("visualizador", "agenda.criar")).toBe(false);
      expect(temPermissao("visualizador", "pacientes.criar")).toBe(false);
      expect(temPermissao("visualizador", "prontuario")).toBe(false);
      expect(temPermissao("visualizador", "faturamento")).toBe(false);
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

    it("deve retornar funcionalidades limitadas para visualizador", () => {
      const funcionalidades = getFuncionalidadesPermitidas("visualizador");
      expect(funcionalidades).toContain("dashboard");
      expect(funcionalidades).toContain("agenda");
      expect(funcionalidades).not.toContain("agenda.criar");
      expect(funcionalidades).not.toContain("prontuario");
      expect(funcionalidades).not.toContain("faturamento");
    });
  });

  describe("permissoesPorPerfil", () => {
    it("deve ter todos os 5 perfis definidos", () => {
      expect(Object.keys(permissoesPorPerfil)).toHaveLength(5);
      expect(permissoesPorPerfil).toHaveProperty("admin_master");
      expect(permissoesPorPerfil).toHaveProperty("medico");
      expect(permissoesPorPerfil).toHaveProperty("secretaria");
      expect(permissoesPorPerfil).toHaveProperty("financeiro");
      expect(permissoesPorPerfil).toHaveProperty("visualizador");
    });

    it("deve ter as mesmas funcionalidades em todos os perfis", () => {
      const funcionalidadesAdmin = Object.keys(permissoesPorPerfil.admin_master);
      const funcionalidadesMedico = Object.keys(permissoesPorPerfil.medico);
      const funcionalidadesSecretaria = Object.keys(permissoesPorPerfil.secretaria);
      const funcionalidadesFinanceiro = Object.keys(permissoesPorPerfil.financeiro);
      const funcionalidadesVisualizador = Object.keys(permissoesPorPerfil.visualizador);

      expect(funcionalidadesAdmin.length).toBe(funcionalidadesMedico.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesSecretaria.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesFinanceiro.length);
      expect(funcionalidadesAdmin.length).toBe(funcionalidadesVisualizador.length);
    });
  });

  describe("Regras de negócio específicas", () => {
    it("sigilo médico: apenas médico e admin podem acessar prontuário", () => {
      expect(temPermissao("admin_master", "prontuario")).toBe(true);
      expect(temPermissao("medico", "prontuario")).toBe(true);
      expect(temPermissao("secretaria", "prontuario")).toBe(false);
      expect(temPermissao("financeiro", "prontuario")).toBe(false);
      expect(temPermissao("visualizador", "prontuario")).toBe(false);
    });

    it("gestão de usuários: apenas admin pode gerenciar usuários", () => {
      expect(temPermissao("admin_master", "usuarios")).toBe(true);
      expect(temPermissao("admin_master", "usuarios.criar")).toBe(true);
      expect(temPermissao("medico", "usuarios")).toBe(false);
      expect(temPermissao("secretaria", "usuarios")).toBe(false);
      expect(temPermissao("financeiro", "usuarios")).toBe(false);
    });

    it("faturamento: apenas financeiro e admin podem acessar", () => {
      expect(temPermissao("admin_master", "faturamento")).toBe(true);
      expect(temPermissao("financeiro", "faturamento")).toBe(true);
      expect(temPermissao("medico", "faturamento")).toBe(false);
      expect(temPermissao("secretaria", "faturamento")).toBe(false);
    });
  });
});
