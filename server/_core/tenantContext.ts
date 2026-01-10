/**
 * Tenant Context Middleware - Gorgen Multi-tenant Architecture
 * 
 * Este módulo fornece o contexto de tenant para todas as operações do sistema.
 * O tenant é determinado a partir do user_profile do usuário autenticado.
 * 
 * Conforme Pilar 2: Sigilo e Confidencialidade Absoluta
 * - Cada tenant tem seus dados completamente isolados
 * - Nenhum dado de um tenant pode vazar para outro
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { tenants, userProfiles } from "../../drizzle/schema";

// Tipo do contexto de tenant
export type TenantContext = {
  tenantId: number;
  tenantSlug: string;
  tenantNome: string;
  tenantPlano: "free" | "basic" | "professional" | "enterprise";
  tenantStatus: "ativo" | "inativo" | "suspenso";
  maxUsuarios: number;
  maxPacientes: number;
};

// Cache simples para evitar queries repetidas
const tenantCache = new Map<number, { data: TenantContext; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém o contexto de tenant a partir do userId
 * 
 * @param userId - ID do usuário autenticado
 * @returns TenantContext com informações do tenant
 * @throws TRPCError se usuário não tem tenant associado ou tenant está inativo
 */
export async function getTenantFromUser(userId: number): Promise<TenantContext> {
  const db = drizzle(process.env.DATABASE_URL!);
  
  // Buscar o perfil do usuário para obter o tenantId
  const profileResult = await db
    .select({ tenantId: userProfiles.tenantId })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  
  if (profileResult.length === 0 || !profileResult[0].tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Usuário não possui tenant associado. Contate o administrador.",
    });
  }
  
  const tenantId = profileResult[0].tenantId;
  
  // Verificar cache
  const cached = tenantCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Buscar informações do tenant
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (tenantResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tenant não encontrado. Contate o administrador.",
    });
  }
  
  const tenant = tenantResult[0];
  
  // Verificar se tenant está ativo
  if (tenant.status === "suspenso") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sua conta está suspensa. Contate o suporte para mais informações.",
    });
  }
  
  if (tenant.status === "inativo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sua conta está inativa. Contate o suporte para reativação.",
    });
  }
  
  const tenantContext: TenantContext = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantNome: tenant.nome,
    tenantPlano: tenant.plano as TenantContext["tenantPlano"],
    tenantStatus: tenant.status as TenantContext["tenantStatus"],
    maxUsuarios: tenant.maxUsuarios || 5,
    maxPacientes: tenant.maxPacientes || 100,
  };
  
  // Atualizar cache
  tenantCache.set(tenantId, { data: tenantContext, timestamp: Date.now() });
  
  return tenantContext;
}

/**
 * Obtém o contexto de tenant diretamente pelo tenantId
 * Usado para operações administrativas
 * 
 * @param tenantId - ID do tenant
 * @returns TenantContext com informações do tenant
 */
export async function getTenantById(tenantId: number): Promise<TenantContext> {
  // Verificar cache
  const cached = tenantCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const db = drizzle(process.env.DATABASE_URL!);
  
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (tenantResult.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tenant não encontrado.",
    });
  }
  
  const tenant = tenantResult[0];
  
  const tenantContext: TenantContext = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantNome: tenant.nome,
    tenantPlano: tenant.plano as TenantContext["tenantPlano"],
    tenantStatus: tenant.status as TenantContext["tenantStatus"],
    maxUsuarios: tenant.maxUsuarios || 5,
    maxPacientes: tenant.maxPacientes || 100,
  };
  
  // Atualizar cache
  tenantCache.set(tenantId, { data: tenantContext, timestamp: Date.now() });
  
  return tenantContext;
}

/**
 * Valida se um usuário tem acesso a um determinado tenant
 * Usado para prevenir ataques de tenant spoofing
 * 
 * @param userId - ID do usuário
 * @param requestedTenantId - ID do tenant sendo acessado
 * @returns true se o acesso é permitido
 * @throws TRPCError se o acesso é negado
 */
export async function validateTenantAccess(
  userId: number,
  requestedTenantId: number
): Promise<boolean> {
  const userTenant = await getTenantFromUser(userId);
  
  if (userTenant.tenantId !== requestedTenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado. Você não tem permissão para acessar dados de outro tenant.",
    });
  }
  
  return true;
}

/**
 * Limpa o cache de tenant (usado após atualizações)
 * 
 * @param tenantId - ID do tenant para limpar do cache (opcional, limpa todos se não especificado)
 */
export function clearTenantCache(tenantId?: number): void {
  if (tenantId) {
    tenantCache.delete(tenantId);
  } else {
    tenantCache.clear();
  }
}

/**
 * Verifica se o tenant está dentro dos limites do plano
 * 
 * @param tenantId - ID do tenant
 * @param resource - Recurso sendo verificado ('usuarios' | 'pacientes')
 * @param currentCount - Contagem atual do recurso
 * @returns true se dentro do limite
 * @throws TRPCError se excedeu o limite
 */
export async function checkTenantLimits(
  tenantId: number,
  resource: "usuarios" | "pacientes",
  currentCount: number
): Promise<boolean> {
  const tenant = await getTenantById(tenantId);
  
  const limit = resource === "usuarios" ? tenant.maxUsuarios : tenant.maxPacientes;
  
  if (currentCount >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limite de ${resource} atingido (${limit}). Faça upgrade do seu plano para adicionar mais.`,
    });
  }
  
  return true;
}
