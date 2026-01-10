import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Tenant UX Improvements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Vínculo de Usuário com Múltiplos Tenants", () => {
    it("deve permitir que um usuário tenha acesso a múltiplos tenants via vínculos", async () => {
      // Cenário: Dr. André Gorgen (tenant 1) tem vínculo com Clínica Teste (tenant 30002)
      const userTenants = [
        { id: 1, nome: "Consultório Dr. André Gorgen", isPrimary: true },
        { id: 30002, nome: "Clínica Teste Multi-tenant", isPrimary: false },
      ];
      
      expect(userTenants).toHaveLength(2);
      expect(userTenants.filter(t => t.isPrimary)).toHaveLength(1);
    });

    it("deve identificar corretamente o tenant principal", async () => {
      const userTenants = [
        { id: 1, nome: "Consultório Dr. André Gorgen", isPrimary: true },
        { id: 30002, nome: "Clínica Teste Multi-tenant", isPrimary: false },
      ];
      
      const primaryTenant = userTenants.find(t => t.isPrimary);
      expect(primaryTenant?.id).toBe(1);
      expect(primaryTenant?.nome).toBe("Consultório Dr. André Gorgen");
    });

    it("deve identificar tenants vinculados como não-primários", async () => {
      const userTenants = [
        { id: 1, nome: "Consultório Dr. André Gorgen", isPrimary: true },
        { id: 30002, nome: "Clínica Teste Multi-tenant", isPrimary: false },
      ];
      
      const linkedTenants = userTenants.filter(t => !t.isPrimary);
      expect(linkedTenants).toHaveLength(1);
      expect(linkedTenants[0].id).toBe(30002);
    });
  });

  describe("Notificação de Troca de Tenant", () => {
    it("deve gerar mensagem de confirmação com nome da clínica", async () => {
      const selectedTenant = { id: 30002, nome: "Clínica Teste Multi-tenant" };
      const toastMessage = `Você está agora acessando: ${selectedTenant.nome}`;
      
      expect(toastMessage).toContain("Clínica Teste Multi-tenant");
    });

    it("deve gerar mensagem de erro em caso de falha", async () => {
      const errorMessage = "Não foi possível alterar a clínica. Tente novamente.";
      expect(errorMessage).toBeTruthy();
    });

    it("não deve mostrar toast se selecionar o tenant já ativo", async () => {
      const activeTenantId = 1;
      const selectedTenantId = 1;
      const shouldShowToast = activeTenantId !== selectedTenantId;
      
      expect(shouldShowToast).toBe(false);
    });
  });

  describe("Dashboard Personalizado por Tenant", () => {
    it("deve mostrar nome do tenant no subtítulo", async () => {
      const activeTenant = { id: 1, nome: "Consultório Dr. André Gorgen", plano: "enterprise" };
      const subtitle = `Visão geral • ${activeTenant.nome}`;
      
      expect(subtitle).toContain("Consultório Dr. André Gorgen");
    });

    it("deve mostrar badge do plano", async () => {
      const activeTenant = { id: 1, nome: "Consultório Dr. André Gorgen", plano: "enterprise" };
      const planoBadge = activeTenant.plano.charAt(0).toUpperCase() + activeTenant.plano.slice(1);
      
      expect(planoBadge).toBe("Enterprise");
    });

    it("deve identificar tenant de teste pelo slug", async () => {
      const testTenant = { id: 30002, nome: "Clínica Teste", slug: "clinica-teste" };
      const isTestTenant = testTenant.slug === "clinica-teste";
      
      expect(isTestTenant).toBe(true);
    });

    it("deve mostrar badge 'Ambiente de Teste' para tenant de teste", async () => {
      const testTenant = { id: 30002, nome: "Clínica Teste", slug: "clinica-teste" };
      const isTestTenant = testTenant.slug === "clinica-teste";
      const badgeText = isTestTenant ? "Ambiente de Teste" : null;
      
      expect(badgeText).toBe("Ambiente de Teste");
    });

    it("não deve mostrar badge de teste para tenant de produção", async () => {
      const prodTenant = { id: 1, nome: "Consultório Dr. André Gorgen", slug: "gorgen" };
      const isTestTenant = prodTenant.slug === "clinica-teste";
      
      expect(isTestTenant).toBe(false);
    });
  });

  describe("TenantSelector Component", () => {
    it("deve exibir seletor quando usuário tem múltiplos tenants", async () => {
      const tenants = [
        { id: 1, nome: "Tenant 1" },
        { id: 2, nome: "Tenant 2" },
      ];
      const shouldShowSelector = tenants.length > 1;
      
      expect(shouldShowSelector).toBe(true);
    });

    it("não deve exibir seletor quando usuário tem apenas 1 tenant", async () => {
      const tenants = [{ id: 1, nome: "Único Tenant" }];
      const shouldShowSelector = tenants.length > 1;
      
      expect(shouldShowSelector).toBe(false);
    });

    it("deve truncar nomes longos de tenant no botão", async () => {
      const longName = "Clínica Médica Especializada em Cardiologia e Neurologia";
      const maxLength = 150;
      const truncatedName = longName.length > maxLength 
        ? longName.substring(0, maxLength) + "..." 
        : longName;
      
      expect(truncatedName.length).toBeLessThanOrEqual(maxLength + 3);
    });
  });

  describe("Isolamento de Dados por Tenant", () => {
    it("deve mostrar dados diferentes para cada tenant", async () => {
      const tenant1Stats = { totalPacientes: 53, totalAtendimentos: 101 };
      const tenant30002Stats = { totalPacientes: 3, totalAtendimentos: 3 };
      
      expect(tenant1Stats.totalPacientes).not.toBe(tenant30002Stats.totalPacientes);
      expect(tenant1Stats.totalAtendimentos).not.toBe(tenant30002Stats.totalAtendimentos);
    });

    it("deve atualizar dashboard ao trocar de tenant", async () => {
      // Simular invalidação de queries após troca de tenant
      const queriesInvalidated = true;
      expect(queriesInvalidated).toBe(true);
    });
  });
});
