import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Criar contexto autenticado para testes (com tenant)
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    tenant: {
      tenantId: 1,
      tenantSlug: "dr-andre-gorgen",
      tenantNome: "Consultório Dr. André Gorgen",
      tenantPlano: "enterprise" as const,
      tenantStatus: "ativo" as const,
      maxUsuarios: 100,
      maxPacientes: 50000,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe('Sprint 2 - Edição e Exclusão', () => {
  
  describe('Listagem de Pacientes', () => {
    it('deve listar pacientes corretamente', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const pacientes = await caller.pacientes.list({ limit: 5 });
      
      expect(Array.isArray(pacientes)).toBe(true);
      expect(pacientes.length).toBeGreaterThan(0);
      
      // Verificar que pacientes têm os campos necessários
      const paciente = pacientes[0];
      expect(paciente).toHaveProperty('id');
      expect(paciente).toHaveProperty('nome');
      expect(paciente).toHaveProperty('idPaciente');
    });
  });

  describe('Listagem de Atendimentos', () => {
    it('deve listar atendimentos corretamente', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const atendimentos = await caller.atendimentos.list({ limit: 5 });
      
      expect(Array.isArray(atendimentos)).toBe(true);
      expect(atendimentos.length).toBeGreaterThan(0);
      
      // Verificar que atendimentos têm os campos necessários
      const atendimento = atendimentos[0];
      expect(atendimento).toHaveProperty('id');
      expect(atendimento).toHaveProperty('atendimento');
      expect(atendimento).toHaveProperty('dataAtendimento');
    });
  });

  describe('Edição de Pacientes', () => {
    it('deve conseguir atualizar nome de um paciente', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Buscar um paciente existente
      const pacientes = await caller.pacientes.list({ limit: 1 });
      const paciente = pacientes[0];
      const nomeOriginal = paciente.nome;
      
      // Atualizar o nome
      const novoNome = `Teste Atualização ${Date.now()}`;
      const result = await caller.pacientes.update({
        id: paciente.id,
        data: { nome: novoNome }
      });
      
      expect(result).toHaveProperty('id', paciente.id);
      expect(result).toHaveProperty('nome', novoNome);
      
      // Restaurar nome original
      await caller.pacientes.update({
        id: paciente.id,
        data: { nome: nomeOriginal }
      });
    });
  });

  describe('Edição de Atendimentos', () => {
    it('deve conseguir atualizar procedimento de um atendimento', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Buscar um atendimento existente
      const atendimentos = await caller.atendimentos.list({ limit: 1 });
      const atendimento = atendimentos[0];
      const procedimentoOriginal = atendimento.procedimento;
      
      // Atualizar o procedimento
      const novoProcedimento = `Procedimento Teste ${Date.now()}`;
      const result = await caller.atendimentos.update({
        id: atendimento.id,
        data: { procedimento: novoProcedimento }
      });
      
      expect(result).toHaveProperty('id', atendimento.id);
      expect(result).toHaveProperty('procedimento', novoProcedimento);
      
      // Restaurar procedimento original
      await caller.atendimentos.update({
        id: atendimento.id,
        data: { procedimento: procedimentoOriginal }
      });
    });
  });

  describe('Log de Auditoria', () => {
    it('deve conseguir listar logs de auditoria', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const logs = await caller.audit.list({ limit: 10 });
      
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
