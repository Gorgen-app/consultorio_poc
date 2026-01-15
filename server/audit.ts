/**
 * Sistema de Auditoria LGPD - Gorgen v4.0
 * 
 * Registra todas as ações sensíveis no sistema para conformidade com LGPD.
 * Implementa:
 * - Log de todas as operações CRUD
 * - Rastreamento de acessos a dados pessoais
 * - Registro de autorizações e revogações
 * - Suporte a direito ao esquecimento
 */

import { getDb } from "./db";
import { auditLog } from "../drizzle/schema";

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "RESTORE" 
  | "VIEW" 
  | "EXPORT" 
  | "LOGIN" 
  | "LOGOUT" 
  | "AUTHORIZE" 
  | "REVOKE";

export type AuditEntityType = 
  | "paciente" 
  | "atendimento" 
  | "user" 
  | "prontuario" 
  | "documento" 
  | "autorizacao" 
  | "tenant" 
  | "session";

export interface AuditContext {
  tenantId: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntry {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  entityIdentifier?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
}

/**
 * Registra uma ação no log de auditoria
 */
export async function logAudit(
  context: AuditContext,
  entry: AuditEntry
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AUDIT] Database not available");
      return;
    }
    await db.insert(auditLog).values({
      tenantId: context.tenantId,
      userId: context.userId,
      userName: context.userName,
      userEmail: context.userEmail,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityIdentifier: entry.entityIdentifier,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      changedFields: entry.changedFields,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    // Log de auditoria não deve interromper a operação principal
    console.error("[AUDIT] Erro ao registrar log de auditoria:", error);
  }
}

/**
 * Registra acesso a dados sensíveis (LGPD - Art. 37)
 */
export async function logDataAccess(
  context: AuditContext,
  entityType: AuditEntityType,
  entityId: number,
  entityIdentifier?: string
): Promise<void> {
  await logAudit(context, {
    action: "VIEW",
    entityType,
    entityId,
    entityIdentifier,
  });
}

/**
 * Registra exportação de dados (LGPD - Art. 18, V - Portabilidade)
 */
export async function logDataExport(
  context: AuditContext,
  entityType: AuditEntityType,
  entityIds: number[],
  format: string
): Promise<void> {
  await logAudit(context, {
    action: "EXPORT",
    entityType,
    entityId: entityIds[0] || 0,
    entityIdentifier: `${entityIds.length} registros exportados em ${format}`,
    newValues: { exportedIds: entityIds, format },
  });
}

/**
 * Registra autorização de acesso a dados (LGPD - Art. 7, I - Consentimento)
 */
export async function logAuthorization(
  context: AuditContext,
  authorizedUserId: number,
  authorizedUserName: string,
  pacienteId: number,
  pacienteIdentifier: string
): Promise<void> {
  await logAudit(context, {
    action: "AUTHORIZE",
    entityType: "autorizacao",
    entityId: pacienteId,
    entityIdentifier: pacienteIdentifier,
    newValues: {
      authorizedUserId,
      authorizedUserName,
      grantedAt: new Date().toISOString(),
    },
  });
}

/**
 * Registra revogação de acesso a dados (LGPD - Art. 8, §5º)
 */
export async function logRevocation(
  context: AuditContext,
  revokedUserId: number,
  revokedUserName: string,
  pacienteId: number,
  pacienteIdentifier: string
): Promise<void> {
  await logAudit(context, {
    action: "REVOKE",
    entityType: "autorizacao",
    entityId: pacienteId,
    entityIdentifier: pacienteIdentifier,
    oldValues: {
      revokedUserId,
      revokedUserName,
      revokedAt: new Date().toISOString(),
    },
  });
}

/**
 * Detecta campos alterados entre dois objetos
 */
export function detectChangedFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): string[] {
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of Array.from(allKeys)) {
    const oldVal = JSON.stringify(oldObj[key]);
    const newVal = JSON.stringify(newObj[key]);
    if (oldVal !== newVal) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

/**
 * Anonimiza dados sensíveis para direito ao esquecimento (LGPD - Art. 18, VI)
 */
export function anonymizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    "nome", "cpf", "rg", "email", "telefone", "celular",
    "endereco", "cep", "nomeMae", "nomePai", "nomeConjuge",
    "dataNascimento", "cidadeNascimento"
  ];
  
  const anonymized = { ...data };
  
  for (const field of sensitiveFields) {
    if (anonymized[field]) {
      anonymized[field] = "[DADOS ANONIMIZADOS]";
    }
  }
  
  return anonymized;
}

/**
 * Registra login de usuário
 */
export async function logLogin(
  context: AuditContext,
  success: boolean,
  reason?: string
): Promise<void> {
  await logAudit(context, {
    action: "LOGIN",
    entityType: "session",
    entityId: context.userId || 0,
    entityIdentifier: context.userEmail,
    newValues: { success, reason, timestamp: new Date().toISOString() },
  });
}

/**
 * Registra logout de usuário
 */
export async function logLogout(context: AuditContext): Promise<void> {
  await logAudit(context, {
    action: "LOGOUT",
    entityType: "session",
    entityId: context.userId || 0,
    entityIdentifier: context.userEmail,
    newValues: { timestamp: new Date().toISOString() },
  });
}
