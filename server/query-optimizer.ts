/**
 * Query Optimizer - Gorgen 3.9.35
 * 
 * Módulo de otimização de queries com:
 * - Cache inteligente por tenant
 * - Prefetch de dados frequentes
 * - Batching de queries N+1
 * - Monitoramento de performance
 */

import { getDb } from "./db";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { pacientes, atendimentos, users, userProfiles, agendamentos, evolucoes } from "../drizzle/schema";

// =====================================================
// CACHE INTELIGENTE POR TENANT
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  tenantId: number;
}

const queryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60 * 1000; // 1 minuto
const MAX_CACHE_SIZE = 200;

function getCacheKey(prefix: string, tenantId: number, ...args: any[]): string {
  return `${prefix}:${tenantId}:${JSON.stringify(args)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    queryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T, tenantId: number): void {
  // Limpar cache se estiver muito grande
  if (queryCache.size >= MAX_CACHE_SIZE) {
    const keysToDelete: string[] = [];
    const now = Date.now();
    
    const entries = Array.from(queryCache.entries());
    for (const [k, v] of entries) {
      if (now - v.timestamp > CACHE_TTL / 2) {
        keysToDelete.push(k);
      }
    }
    
    keysToDelete.forEach(k => queryCache.delete(k));
    
    // Se ainda estiver grande, remover os mais antigos
    if (queryCache.size >= MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(MAX_CACHE_SIZE / 4));
      toRemove.forEach(([k]) => queryCache.delete(k));
    }
  }
  
  queryCache.set(key, { data, timestamp: Date.now(), tenantId });
}

export function invalidateTenantCache(tenantId: number): void {
  const entries = Array.from(queryCache.entries());
  for (const [key, entry] of entries) {
    if (entry.tenantId === tenantId) {
      queryCache.delete(key);
    }
  }
}

export function invalidateCacheByPrefix(prefix: string, tenantId: number): void {
  const keyPrefix = `${prefix}:${tenantId}:`;
  const keys = Array.from(queryCache.keys());
  for (const key of keys) {
    if (key.startsWith(keyPrefix)) {
      queryCache.delete(key);
    }
  }
}

// =====================================================
// QUERIES OTIMIZADAS
// =====================================================

/**
 * Busca pacientes com métricas de atendimento em uma única query
 * Evita N+1 queries ao buscar métricas separadamente
 */
export async function getPacientesComMetricasOtimizado(
  tenantId: number,
  options: {
    limit?: number;
    offset?: number;
    statusCaso?: string;
    includeDeleted?: boolean;
  } = {}
) {
  const cacheKey = getCacheKey('pacientes_metricas', tenantId, options);
  const cached = getFromCache<any[]>(cacheKey);
  if (cached) return cached;
  
  const db = await getDb();
  if (!db) return [];
  
  const { limit = 50, offset = 0, statusCaso, includeDeleted = false } = options;
  
  // Query otimizada com subquery para métricas
  const conditions = [eq(pacientes.tenantId, tenantId)];
  if (!includeDeleted) {
    conditions.push(sql`${pacientes.deletedAt} IS NULL`);
  }
  if (statusCaso) {
    conditions.push(eq(pacientes.statusCaso, statusCaso));
  }
  
  const result = await db
    .select({
      id: pacientes.id,
      idPaciente: pacientes.idPaciente,
      nome: pacientes.nome,
      dataNascimento: pacientes.dataNascimento,
      cpf: pacientes.cpf,
      telefone: pacientes.telefone,
      email: pacientes.email,
      statusCaso: pacientes.statusCaso,
      grupoDiagnostico: pacientes.grupoDiagnostico,
      createdAt: pacientes.createdAt,
      // Métricas agregadas via subquery
      totalAtendimentos: sql<number>`(
        SELECT COUNT(*) FROM atendimentos 
        WHERE atendimentos.paciente_id = ${pacientes.id}
        AND atendimentos.deleted_at IS NULL
      )`,
      ultimoAtendimento: sql<string>`(
        SELECT MAX(data_atendimento) FROM atendimentos 
        WHERE atendimentos.paciente_id = ${pacientes.id}
        AND atendimentos.deleted_at IS NULL
      )`,
    })
    .from(pacientes)
    .where(and(...conditions))
    .orderBy(desc(pacientes.createdAt))
    .limit(limit)
    .offset(offset);
  
  setCache(cacheKey, result, tenantId);
  return result;
}

/**
 * Busca agendamentos com dados do paciente em uma única query
 */
export async function getAgendamentosOtimizado(
  tenantId: number,
  dataInicio: Date,
  dataFim: Date,
  options: {
    status?: string[];
    pacienteId?: number;
    limit?: number;
  } = {}
) {
  const cacheKey = getCacheKey('agendamentos', tenantId, dataInicio.toISOString(), dataFim.toISOString(), options);
  const cached = getFromCache<any[]>(cacheKey);
  if (cached) return cached;
  
  const db = await getDb();
  if (!db) return [];
  
  const { status, pacienteId, limit = 500 } = options;
  
  const conditions = [
    eq(agendamentos.tenantId, tenantId),
    sql`${agendamentos.dataHoraInicio} >= ${dataInicio.toISOString()}`,
    sql`${agendamentos.dataHoraInicio} <= ${dataFim.toISOString()}`,
  ];
  
  if (status && status.length > 0) {
    conditions.push(inArray(agendamentos.status, status as any));
  }
  
  if (pacienteId) {
    conditions.push(eq(agendamentos.pacienteId, pacienteId));
  }
  
  const result = await db
    .select({
      id: agendamentos.id,
      idAgendamento: agendamentos.idAgendamento,
      tipoCompromisso: agendamentos.tipoCompromisso,
      pacienteId: agendamentos.pacienteId,
      pacienteNome: agendamentos.pacienteNome,
      dataHoraInicio: agendamentos.dataHoraInicio,
      dataHoraFim: agendamentos.dataHoraFim,
      local: agendamentos.local,
      status: agendamentos.status,
      titulo: agendamentos.titulo,
      descricao: agendamentos.descricao,
      convenio: agendamentos.convenio,
      // Dados do paciente via subquery (evita JOIN)
      pacienteCpf: sql<string>`(
        SELECT cpf FROM pacientes 
        WHERE pacientes.id = ${agendamentos.pacienteId}
        LIMIT 1
      )`,
      pacienteTelefone: sql<string>`(
        SELECT telefone FROM pacientes 
        WHERE pacientes.id = ${agendamentos.pacienteId}
        LIMIT 1
      )`,
    })
    .from(agendamentos)
    .where(and(...conditions))
    .orderBy(agendamentos.dataHoraInicio)
    .limit(limit);
  
  setCache(cacheKey, result, tenantId);
  return result;
}

/**
 * Busca rápida de pacientes para autocomplete
 * Otimizada com índice em nome e limite baixo
 */
export async function buscarPacienteRapidoOtimizado(
  tenantId: number,
  termo: string,
  limit: number = 10
): Promise<Array<{
  id: number;
  idPaciente: string;
  nome: string;
  cpf: string | null;
  dataNascimento: Date | null;
}>> {
  if (!termo || termo.length < 2) return [];
  
  const cacheKey = getCacheKey('busca_paciente', tenantId, termo.toLowerCase(), limit);
  const cached = getFromCache<any[]>(cacheKey);
  if (cached) return cached;
  
  const db = await getDb();
  if (!db) return [];
  
  const termoLower = termo.toLowerCase();
  const termoNormalizado = termoLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Busca otimizada usando índice
  const result = await db
    .select({
      id: pacientes.id,
      idPaciente: pacientes.idPaciente,
      nome: pacientes.nome,
      cpf: pacientes.cpf,
      dataNascimento: pacientes.dataNascimento,
    })
    .from(pacientes)
    .where(
      and(
        eq(pacientes.tenantId, tenantId),
        sql`${pacientes.deletedAt} IS NULL`,
        sql`LOWER(${pacientes.nome}) LIKE ${`%${termoNormalizado}%`}`
      )
    )
    .orderBy(pacientes.nome)
    .limit(limit);
  
  setCache(cacheKey, result, tenantId);
  return result;
}

/**
 * Batch loader para evitar N+1 em vínculos de usuários
 */
export async function batchLoadUserProfiles(userIds: number[]): Promise<Map<number, any>> {
  if (userIds.length === 0) return new Map();
  
  const db = await getDb();
  if (!db) return new Map();
  
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(inArray(userProfiles.userId, userIds));
  
  const map = new Map<number, any>();
  for (const profile of profiles) {
    map.set(profile.userId, profile);
  }
  
  return map;
}

/**
 * Batch loader para evitar N+1 em pacientes
 */
export async function batchLoadPacientes(tenantId: number, pacienteIds: number[]): Promise<Map<number, any>> {
  if (pacienteIds.length === 0) return new Map();
  
  const db = await getDb();
  if (!db) return new Map();
  
  const result = await db
    .select({
      id: pacientes.id,
      idPaciente: pacientes.idPaciente,
      nome: pacientes.nome,
      cpf: pacientes.cpf,
      telefone: pacientes.telefone,
    })
    .from(pacientes)
    .where(
      and(
        eq(pacientes.tenantId, tenantId),
        inArray(pacientes.id, pacienteIds)
      )
    );
  
  const map = new Map<number, any>();
  for (const p of result) {
    map.set(p.id, p);
  }
  
  return map;
}

// =====================================================
// ESTATÍSTICAS DE CACHE
// =====================================================

export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  entries: Array<{ key: string; age: number; tenantId: number }>;
} {
  const now = Date.now();
  const entries = Array.from(queryCache.entries()).map(([key, entry]) => ({
    key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
    age: Math.round((now - entry.timestamp) / 1000),
    tenantId: entry.tenantId,
  }));
  
  return {
    size: queryCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0, // TODO: implementar tracking de hit rate
    entries: entries.slice(0, 20), // Retornar apenas os 20 primeiros
  };
}

export function clearAllCache(): void {
  queryCache.clear();
}
