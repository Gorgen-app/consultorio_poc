/**
 * Tenant Context Middleware - Gorgen Multi-tenant Architecture
 * 
 * Este módulo fornece o contexto de tenant para todas as operações do sistema.
 * O tenant é determinado a partir do tenant ativo do usuário (configuração) ou
 * do user_profile do usuário autenticado como fallback.
 * 
 * Conforme Pilar 2: Sigilo e Confidencialidade Absoluta
 * - Cada tenant tem seus dados completamente isolados
 * - Nenhum dado de um tenant pode vazar para outro
 */

import { TRPCError } from "@trpc/server";
import { eq, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { tenants, userProfiles, userSettings, vinculoSecretariaMedico } from "../../drizzle/schema";
import { cacheGet, cacheSet, cacheDelete, CACHE_TTL, CACHE_PREFIX } from "./cache";

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

/**
 * Obtém o contexto de tenant a partir do userId
 * Prioriza o tenant ativo configurado pelo usuário, se existir e for válido
 * 
 * @param userId - ID do usuário autenticado
 * @returns TenantContext com informações do tenant
 * @throws TRPCError se usuário não tem tenant associado ou tenant está inativo
 */
export async function getTenantFromUser(userId: number): Promise<TenantContext> {
  const db = drizzle(process.env.DATABASE_URL!);
  
  // Buscar o perfil do usuário para obter o tenantId principal
  const profileResult = await db
    .select({ 
      id: userProfiles.id,
      tenantId: userProfiles.tenantId 
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  
  if (profileResult.length === 0 || !profileResult[0].tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Usuário não possui tenant associado. Contate o administrador.",
    });
  }
  
  const profileId = profileResult[0].id;
  const defaultTenantId = profileResult[0].tenantId;
  
  // Verificar se há um tenant ativo configurado nas preferências do usuário
  const activeTenantSetting = await db
    .select({ valor: userSettings.valor })
    .from(userSettings)
    .where(
      and(
        eq(userSettings.userProfileId, profileId),
        eq(userSettings.categoria, "tenant"),
        eq(userSettings.chave, "active_tenant_id")
      )
    )
    .limit(1);
  
  let tenantIdToUse = defaultTenantId;
  
  if (activeTenantSetting.length > 0 && activeTenantSetting[0].valor) {
    const requestedTenantId = parseInt(activeTenantSetting[0].valor, 10);
    
    if (!isNaN(requestedTenantId) && requestedTenantId !== defaultTenantId) {
      // Verificar se o usuário tem acesso a este tenant via vínculo
      const hasAccess = await validateUserTenantAccess(userId, requestedTenantId, db);
      
      if (hasAccess) {
        tenantIdToUse = requestedTenantId;
      }
      // Se não tem acesso, usa o tenant padrão (não lança erro)
    }
  }
  
  // Verificar cache Redis/memória
  const cacheKey = `${CACHE_PREFIX.TENANT}${tenantIdToUse}`;
  const cached = await cacheGet<TenantContext>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Buscar informações do tenant
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantIdToUse))
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
  
  // Atualizar cache Redis/memória
  await cacheSet(cacheKey, tenantContext, CACHE_TTL.TENANT);
  
  return tenantContext;
}

/**
 * Valida se um usuário tem acesso a um tenant específico
 * Acesso é permitido se:
 * 1. É o tenant principal do usuário (via userProfiles.tenantId)
 * 2. Tem um vínculo ativo com o tenant (via vinculoSecretariaMedico)
 */
async function validateUserTenantAccess(
  userId: number,
  tenantId: number,
  db: ReturnType<typeof drizzle>
): Promise<boolean> {
  // Verificar se é o tenant principal
  const profileResult = await db
    .select({ tenantId: userProfiles.tenantId })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  
  if (profileResult.length > 0 && profileResult[0].tenantId === tenantId) {
    return true;
  }
  
  // Verificar se tem vínculo ativo com o tenant
  const now = new Date().toISOString();
  const vinculoResult = await db
    .select({ id: vinculoSecretariaMedico.id })
    .from(vinculoSecretariaMedico)
    .where(
      and(
        eq(vinculoSecretariaMedico.secretariaUserId, String(userId)),
        eq(vinculoSecretariaMedico.tenantId, tenantId),
        eq(vinculoSecretariaMedico.status, "ativo"),
        gte(vinculoSecretariaMedico.dataValidade, now)
      )
    )
    .limit(1);
  
  return vinculoResult.length > 0;
}

/**
 * Obtém o contexto de tenant diretamente pelo tenantId
 * Usado para operações administrativas
 * 
 * @param tenantId - ID do tenant
 * @returns TenantContext com informações do tenant
 */
export async function getTenantById(tenantId: number): Promise<TenantContext> {
  // Verificar cache Redis/memória
  const cacheKey = `${CACHE_PREFIX.TENANT}${tenantId}`;
  const cached = await cacheGet<TenantContext>(cacheKey);
  if (cached) {
    return cached;
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
  
  // Atualizar cache Redis/memória
  await cacheSet(cacheKey, tenantContext, CACHE_TTL.TENANT);
  
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
  const db = drizzle(process.env.DATABASE_URL!);
  const hasAccess = await validateUserTenantAccess(userId, requestedTenantId, db);
  
  if (!hasAccess) {
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
export async function clearTenantCache(tenantId?: number): Promise<void> {
  if (tenantId) {
    await cacheDelete(`${CACHE_PREFIX.TENANT}${tenantId}`);
  }
  // Não podemos limpar todo o cache facilmente sem Redis
  // Para limpeza total, usar cacheDeletePattern se Redis estiver disponível
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
