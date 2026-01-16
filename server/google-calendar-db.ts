/**
 * Google Calendar Database Functions
 * Funções de acesso ao banco de dados para sincronização com Google Calendar
 */

import { getPooledDb } from "./_core/database";
import { googleCalendarSync, googleCalendarConfig } from "../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

// ============================================
// CONFIGURAÇÃO DE SINCRONIZAÇÃO
// ============================================

/**
 * Obter configuração de sincronização do usuário
 */
export async function getGoogleCalendarConfig(tenantId: number, userId: number) {
  const db = await getPooledDb();
  if (!db) return null;
  
  const [config] = await db
    .select()
    .from(googleCalendarConfig)
    .where(and(
      eq(googleCalendarConfig.tenantId, tenantId),
      eq(googleCalendarConfig.userId, userId)
    ))
    .limit(1);
  return config || null;
}

/**
 * Criar ou atualizar configuração de sincronização
 */
export async function upsertGoogleCalendarConfig(
  tenantId: number,
  userId: number,
  config: {
    syncEnabled?: boolean;
    syncDirection?: "bidirectional" | "to_google_only" | "from_google_only";
    googleCalendarId?: string;
    syncConsultas?: boolean;
    syncCirurgias?: boolean;
    syncReunions?: boolean;
    syncBloqueios?: boolean;
    syncOutros?: boolean;
    includePatientName?: boolean;
    includePatientPhone?: boolean;
    eventVisibility?: "default" | "public" | "private";
  }
) {
  const db = await getPooledDb();
  if (!db) return null;
  
  const existing = await getGoogleCalendarConfig(tenantId, userId);
  
  if (existing) {
    await db
      .update(googleCalendarConfig)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarConfig.id, existing.id));
    return { ...existing, ...config };
  } else {
    const [result] = await db
      .insert(googleCalendarConfig)
      .values({
        tenantId,
        userId,
        syncEnabled: config.syncEnabled ?? false,
        syncDirection: config.syncDirection ?? "bidirectional",
        googleCalendarId: config.googleCalendarId ?? "primary",
        syncConsultas: config.syncConsultas ?? true,
        syncCirurgias: config.syncCirurgias ?? true,
        syncReunions: config.syncReunions ?? true,
        syncBloqueios: config.syncBloqueios ?? false,
        syncOutros: config.syncOutros ?? true,
        includePatientName: config.includePatientName ?? false,
        includePatientPhone: config.includePatientPhone ?? false,
        eventVisibility: config.eventVisibility ?? "private",
      });
    return result;
  }
}

// ============================================
// MAPEAMENTO DE SINCRONIZAÇÃO
// ============================================

/**
 * Criar registro de sincronização
 */
export async function createSyncRecord(
  tenantId: number,
  agendamentoId: number,
  googleEventId: string,
  googleCalendarId: string = "primary"
) {
  const db = await getPooledDb();
  if (!db) return null;
  
  const [result] = await db
    .insert(googleCalendarSync)
    .values({
      tenantId,
      agendamentoId,
      googleEventId,
      googleCalendarId,
      syncStatus: "synced",
      lastSyncDirection: "to_google",
      lastSyncAt: new Date(),
      gorgenUpdatedAt: new Date(),
    });
  return result;
}

/**
 * Obter registro de sincronização por agendamento
 */
export async function getSyncByAgendamento(tenantId: number, agendamentoId: number) {
  const db = await getPooledDb();
  if (!db) return null;
  
  const [sync] = await db
    .select()
    .from(googleCalendarSync)
    .where(and(
      eq(googleCalendarSync.tenantId, tenantId),
      eq(googleCalendarSync.agendamentoId, agendamentoId)
    ))
    .limit(1);
  return sync || null;
}

/**
 * Obter registro de sincronização por evento do Google
 */
export async function getSyncByGoogleEvent(tenantId: number, googleEventId: string) {
  const db = await getPooledDb();
  if (!db) return null;
  
  const [sync] = await db
    .select()
    .from(googleCalendarSync)
    .where(and(
      eq(googleCalendarSync.tenantId, tenantId),
      eq(googleCalendarSync.googleEventId, googleEventId)
    ))
    .limit(1);
  return sync || null;
}

/**
 * Atualizar status de sincronização
 */
export async function updateSyncStatus(
  syncId: number,
  status: "synced" | "pending_to_google" | "pending_from_google" | "conflict" | "error",
  direction?: "to_google" | "from_google",
  errorMessage?: string
) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .update(googleCalendarSync)
    .set({
      syncStatus: status,
      lastSyncDirection: direction,
      lastSyncAt: new Date(),
      errorMessage: errorMessage || null,
      errorCount: status === "error" ? sql`error_count + 1` : 0,
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarSync.id, syncId));
}

/**
 * Listar agendamentos pendentes de sincronização
 */
export async function listPendingSyncs(tenantId: number) {
  const db = await getPooledDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(googleCalendarSync)
    .where(and(
      eq(googleCalendarSync.tenantId, tenantId),
      inArray(googleCalendarSync.syncStatus, ["pending_to_google", "pending_from_google", "conflict"])
    ));
}

/**
 * Listar todos os registros de sincronização de um tenant
 */
export async function listAllSyncs(tenantId: number) {
  const db = await getPooledDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(googleCalendarSync)
    .where(eq(googleCalendarSync.tenantId, tenantId));
}

/**
 * Deletar registro de sincronização
 */
export async function deleteSyncRecord(syncId: number) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .delete(googleCalendarSync)
    .where(eq(googleCalendarSync.id, syncId));
}

/**
 * Atualizar timestamp do Google Calendar
 */
export async function updateGoogleTimestamp(syncId: number, googleUpdatedAt: Date) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .update(googleCalendarSync)
    .set({
      googleUpdatedAt,
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarSync.id, syncId));
}

/**
 * Atualizar timestamp do GORGEN
 */
export async function updateGorgenTimestamp(syncId: number, gorgenUpdatedAt: Date) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .update(googleCalendarSync)
    .set({
      gorgenUpdatedAt,
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarSync.id, syncId));
}

/**
 * Atualizar última sincronização completa
 */
export async function updateLastFullSync(configId: number) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .update(googleCalendarConfig)
    .set({
      lastFullSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarConfig.id, configId));
}

/**
 * Atualizar última sincronização incremental
 */
export async function updateLastIncrementalSync(configId: number) {
  const db = await getPooledDb();
  if (!db) return;
  
  await db
    .update(googleCalendarConfig)
    .set({
      lastIncrementalSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarConfig.id, configId));
}
