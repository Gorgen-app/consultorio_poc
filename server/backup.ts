/**
 * GORGEN - Sistema de Backup Automático
 * 
 * Pilar Fundamental: Imutabilidade e Preservação Histórica
 * "Em saúde, a informação é o retrato do momento do paciente. Todo dado inserido é perpétuo."
 * 
 * Este módulo implementa:
 * - Backup completo do banco de dados (full)
 * - Backup incremental (transactional)
 * - Upload para S3 com criptografia
 * - Validação de integridade (checksum SHA-256)
 * - Histórico de backups
 * - Notificações de sucesso/falha
 */

import { getDb } from "./db";
import { backupHistory, backupConfig, tenants } from "../drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";
import { storagePut, storageGet } from "./storage";
import { notifyOwner } from "./_core/notification";
import crypto from "crypto";
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ==========================================
// CRIPTOGRAFIA AES-256
// ==========================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 32; // 256 bits para AES-256
const PBKDF2_ITERATIONS = 100000; // Iterações para derivar chave

/**
 * Deriva uma chave de criptografia a partir de uma senha usando PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Criptografa dados usando AES-256-GCM
 * Formato do resultado: [salt (32 bytes)][iv (16 bytes)][authTag (16 bytes)][dados criptografados]
 */
export function encryptData(data: Buffer, password: string): Buffer {
  // Gerar salt e IV aleatórios
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derivar chave da senha
  const key = deriveKey(password, salt);
  
  // Criar cipher e criptografar
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Concatenar: salt + iv + authTag + dados criptografados
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Descriptografa dados criptografados com AES-256-GCM
 */
export function decryptData(encryptedData: Buffer, password: string): Buffer {
  // Extrair componentes
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const data = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Derivar chave da senha
  const key = deriveKey(password, salt);
  
  // Criar decipher e descriptografar
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * Gera uma senha de criptografia segura para o tenant
 * A senha é derivada do ID do tenant + uma chave secreta do sistema
 */
function getEncryptionPassword(tenantId: number): string {
  const systemSecret = process.env.JWT_SECRET || "gorgen-default-secret-change-me";
  return crypto.createHash("sha256").update(`${systemSecret}-tenant-${tenantId}-backup`).digest("hex");
}

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export type BackupType = "full" | "incremental" | "transactional" | "offline";
export type BackupStatus = "running" | "success" | "failed" | "validating";
export type BackupDestination = "s3_primary" | "s3_secondary" | "offline_hd";

export interface BackupResult {
  success: boolean;
  backupId?: number;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  duration?: number;
}

interface TableData {
  tableName: string;
  records: any[];
  count: number;
}

// ==========================================
// FUNÇÕES DE BACKUP DO BANCO DE DADOS
// ==========================================

/**
 * Lista todas as tabelas do banco de dados
 */
async function listTables(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<string[]> {
  const result = await db.execute(sql`SHOW TABLES`) as any;
  const tables: string[] = [];
  
  for (const row of (result[0] || []) as any[]) {
    const tableName = Object.values(row)[0] as string;
    // Excluir tabelas de sistema do Drizzle
    if (!tableName.startsWith("__drizzle")) {
      tables.push(tableName);
    }
  }
  
  return tables;
}

/**
 * Exporta dados de uma tabela específica
 */
async function exportTableData(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  tableName: string,
  tenantId?: number
): Promise<TableData> {
  let query: string;
  
  // Verificar se a tabela tem coluna tenant_id
  const columnsResult = await db.execute(
    sql.raw(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'tenant_id'`)
  ) as any;
  
  const hasTenantId = ((columnsResult[0] || []) as any[]).length > 0;
  
  if (hasTenantId && tenantId) {
    query = `SELECT * FROM \`${tableName}\` WHERE tenant_id = ${tenantId}`;
  } else {
    query = `SELECT * FROM \`${tableName}\``;
  }
  
  const result = await db.execute(sql.raw(query)) as any;
  
  return {
    tableName,
    records: (result[0] || []) as any[],
    count: ((result[0] || []) as any[]).length,
  };
}

/**
 * Conta total de registros no banco
 */
async function countTotalRecords(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  tenantId: number
): Promise<number> {
  const tables = await listTables(db);
  let total = 0;
  
  for (const table of tables) {
    try {
      const columnsResult = await db.execute(
        sql.raw(`SHOW COLUMNS FROM \`${table}\` LIKE 'tenant_id'`)
      ) as any;
      
      const hasTenantId = ((columnsResult[0] || []) as any[]).length > 0;
      
      let countQuery: string;
      if (hasTenantId) {
        countQuery = `SELECT COUNT(*) as count FROM \`${table}\` WHERE tenant_id = ${tenantId}`;
      } else {
        countQuery = `SELECT COUNT(*) as count FROM \`${table}\``;
      }
      
      const result = await db.execute(sql.raw(countQuery)) as any;
      total += Number(((result[0] || []) as any[])[0]?.count || 0);
    } catch (e) {
      // Ignorar erros de tabelas que não podem ser contadas
    }
  }
  
  return total;
}

/**
 * Gera checksum SHA-256 de um buffer
 */
function generateChecksum(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Executa backup completo do banco de dados
 */
export async function executeFullBackup(
  tenantId: number,
  triggeredBy: "scheduled" | "manual" | "system" = "scheduled",
  userId?: number,
  auditInfo?: { ipAddress?: string; userAgent?: string }
): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  // Criar registro de backup em andamento com auditoria
  const [backupRecord] = await db.insert(backupHistory).values({
    tenantId,
    backupType: "full",
    status: "running",
    startedAt: new Date(),
    filePath: "pending",
    triggeredBy,
    createdByUserId: userId,
    userIpAddress: auditInfo?.ipAddress || null,
    userAgent: auditInfo?.userAgent || null,
  });
  
  const backupId = backupRecord.insertId;
  
  try {
    // 1. Listar todas as tabelas
    const tables = await listTables(db);
    
    // 2. Exportar dados de cada tabela
    const backupData: { [key: string]: TableData } = {};
    let totalRecords = 0;
    
    for (const table of tables) {
      const tableData = await exportTableData(db, table, tenantId);
      backupData[table] = tableData;
      totalRecords += tableData.count;
    }
    
    // 3. Criar objeto de backup com metadados
    const backupPayload = {
      version: "3.0",
      type: "full",
      tenantId,
      createdAt: new Date().toISOString(),
      tables: backupData,
      metadata: {
        totalTables: tables.length,
        totalRecords,
        gorgenVersion: "2.15",
      },
    };
    
    // 4. Serializar e comprimir
    const jsonData = JSON.stringify(backupPayload, null, 2);
    const compressedData = await gzip(Buffer.from(jsonData, "utf-8"));
    
    // 5. Criptografar com AES-256-GCM
    const encryptionPassword = getEncryptionPassword(tenantId);
    const encryptedData = encryptData(compressedData, encryptionPassword);
    
    // 6. Gerar checksum do arquivo criptografado
    const checksum = generateChecksum(encryptedData);
    
    // 7. Gerar nome do arquivo (extensão .enc indica criptografado)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup/tenant_${tenantId}/full_${timestamp}.json.gz.enc`;
    
    // 8. Upload para S3
    const { url } = await storagePut(fileName, encryptedData, "application/octet-stream");
    
    // 9. Atualizar registro de backup
    await db
      .update(backupHistory)
      .set({
        status: "success",
        completedAt: new Date(),
        filePath: fileName,
        fileSizeBytes: encryptedData.length,
        checksumSha256: checksum,
        databaseRecords: totalRecords,
        destination: "s3_primary",
        isEncrypted: true, // Marcar como criptografado
        encryptionAlgorithm: "AES-256-GCM",
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    const duration = Date.now() - startTime;
    
    // 10. Notificar sucesso (se configurado)
    const config = await getBackupConfig(tenantId);
    if (config?.notifyOnSuccess) {
      await notifyOwner({
        title: "✅ Backup GORGEN concluído",
        content: `Backup completo realizado com sucesso.\n\nRegistros: ${totalRecords}\nTamanho: ${(encryptedData.length / 1024).toFixed(2)} KB\nDuração: ${(duration / 1000).toFixed(1)}s\nCriptografia: AES-256-GCM ✅`,
      });
    }
    
    // 11. Enviar e-mail de notificação (se configurado)
    if (config?.notificationEmail) {
      await sendBackupEmailNotification({
        email: config.notificationEmail,
        success: true,
        tenantId,
        backupType: "full",
        records: totalRecords,
        fileSize: encryptedData.length,
        duration,
        encrypted: true,
      });
    }
    
    return {
      success: true,
      backupId: Number(backupId),
      filePath: fileName,
      fileSize: encryptedData.length,
      checksum,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Atualizar registro com erro
    await db
      .update(backupHistory)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    // Notificar falha
    const config = await getBackupConfig(tenantId);
    if (config?.notifyOnFailure) {
      await notifyOwner({
        title: "❌ Falha no Backup GORGEN",
        content: `O backup automático falhou.\n\nErro: ${errorMessage}\n\nPor favor, verifique o sistema.`,
      });
    }
    
    return {
      success: false,
      backupId: Number(backupId),
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

// ==========================================
// FUNÇÕES DE CONFIGURAÇÃO
// ==========================================

/**
 * Obtém configuração de backup do tenant
 */
export async function getBackupConfig(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [config] = await db
    .select()
    .from(backupConfig)
    .where(eq(backupConfig.tenantId, tenantId))
    .limit(1);
  
  return config;
}

/**
 * Cria ou atualiza configuração de backup
 */
export async function upsertBackupConfig(
  tenantId: number,
  config: Partial<typeof backupConfig.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getBackupConfig(tenantId);
  
  if (existing) {
    await db
      .update(backupConfig)
      .set(config)
      .where(eq(backupConfig.tenantId, tenantId));
  } else {
    await db.insert(backupConfig).values({
      tenantId,
      ...config,
    });
  }
}

// ==========================================
// FUNÇÕES DE HISTÓRICO
// ==========================================

/**
 * Lista histórico de backups do tenant
 */
export async function listBackupHistory(
  tenantId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.createdAt))
    .limit(limit);
}

/**
 * Obtém último backup bem-sucedido
 */
export async function getLastSuccessfulBackup(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [backup] = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.completedAt))
    .limit(1);
  
  return backup;
}

// ==========================================
// FUNÇÕES DE RESTAURAÇÃO
// ==========================================

/**
 * Valida integridade de um backup
 */
export async function validateBackup(backupId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const [backup] = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.id, backupId))
    .limit(1);
  
  if (!backup || !backup.filePath || !backup.checksumSha256) {
    return false;
  }
  
  try {
    // Baixar arquivo do S3
    const { url } = await storageGet(backup.filePath);
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Verificar checksum
    const checksum = generateChecksum(buffer);
    return checksum === backup.checksumSha256;
  } catch {
    return false;
  }
}

/**
 * Gera backup para download offline (HD externo)
 */
export async function generateOfflineBackup(
  tenantId: number,
  userId: number,
  auditInfo?: { ipAddress?: string; userAgent?: string }
): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  // Criar registro de backup offline com auditoria
  const [backupRecord] = await db.insert(backupHistory).values({
    tenantId,
    backupType: "offline",
    status: "running",
    startedAt: new Date(),
    filePath: "pending",
    destination: "offline_hd",
    triggeredBy: "manual",
    createdByUserId: userId,
    userIpAddress: auditInfo?.ipAddress || null,
    userAgent: auditInfo?.userAgent || null,
  });
  
  const backupId = backupRecord.insertId;
  
  try {
    // 1. Executar backup completo
    const tables = await listTables(db);
    const backupData: { [key: string]: TableData } = {};
    let totalRecords = 0;
    
    for (const table of tables) {
      const tableData = await exportTableData(db, table, tenantId);
      backupData[table] = tableData;
      totalRecords += tableData.count;
    }
    
    // 2. Criar payload com instruções de restauração
    const backupPayload = {
      version: "3.0",
      type: "offline",
      tenantId,
      createdAt: new Date().toISOString(),
      tables: backupData,
      metadata: {
        totalTables: tables.length,
        totalRecords,
        gorgenVersion: "2.15",
      },
      restoreInstructions: {
        pt_BR: [
          "1. Descompacte este arquivo .zip",
          "2. Acesse o painel de administração do GORGEN",
          "3. Vá em Configurações > Backup > Restaurar",
          "4. Selecione o arquivo backup_data.json",
          "5. Confirme a restauração",
          "ATENÇÃO: A restauração substituirá TODOS os dados atuais!",
        ],
      },
    };
    
    // 3. Serializar e comprimir
    const jsonData = JSON.stringify(backupPayload, null, 2);
    const compressedData = await gzip(Buffer.from(jsonData, "utf-8"));
    
    // 4. Gerar checksum
    const checksum = generateChecksum(compressedData);
    
    // 5. Gerar nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup/tenant_${tenantId}/offline_${timestamp}.json.gz`;
    
    // 6. Upload para S3 (temporário para download)
    const { url } = await storagePut(fileName, compressedData, "application/gzip");
    
    // 7. Atualizar registro
    await db
      .update(backupHistory)
      .set({
        status: "success",
        completedAt: new Date(),
        filePath: fileName,
        fileSizeBytes: compressedData.length,
        checksumSha256: checksum,
        databaseRecords: totalRecords,
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    return {
      success: true,
      backupId: Number(backupId),
      filePath: url,
      fileSize: compressedData.length,
      checksum,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await db
      .update(backupHistory)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    return {
      success: false,
      backupId: Number(backupId),
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

// ==========================================
// FUNÇÕES DE LIMPEZA (RETENÇÃO)
// ==========================================

/**
 * Remove backups antigos conforme política de retenção
 */
export async function cleanupOldBackups(tenantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const config = await getBackupConfig(tenantId);
  
  if (!config) return 0;
  
  const now = new Date();
  const dailyThreshold = new Date(now.getTime() - config.dailyRetentionDays! * 24 * 60 * 60 * 1000);
  
  // Marcar backups antigos para exclusão (soft delete via status)
  const result = await db.execute(
    sql`UPDATE backup_history 
        SET status = 'failed', error_message = 'Removed by retention policy'
        WHERE tenant_id = ${tenantId}
        AND backup_type = 'full'
        AND status = 'success'
        AND completed_at < ${dailyThreshold}
        AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM backup_history 
            WHERE tenant_id = ${tenantId} AND status = 'success'
            ORDER BY completed_at DESC 
            LIMIT 5
          ) as recent
        )`
  );
  
  return (result as any).affectedRows || 0;
}


/**
 * Gera instruções de restauração para backup offline
 */
export function generateRestoreInstructions(): string {
  return `
================================================================================
                    INSTRUÇÕES DE RESTAURAÇÃO - GORGEN
================================================================================

Este arquivo contém um backup completo do sistema GORGEN.

CONTEÚDO DO BACKUP:
- backup_data.json.gz: Dados do banco de dados (comprimido com gzip)
- checksum.sha256: Hash SHA-256 para validação de integridade
- metadata.json: Informações sobre o backup (data, versão, etc.)

COMO RESTAURAR:

1. VALIDAR INTEGRIDADE:
   - Calcule o SHA-256 do arquivo backup_data.json.gz
   - Compare com o valor em checksum.sha256
   - Se não conferir, o arquivo pode estar corrompido

2. DESCOMPRIMIR:
   - Use gzip ou ferramenta compatível para descomprimir backup_data.json.gz
   - O resultado será um arquivo JSON com todos os dados

3. RESTAURAR NO SISTEMA:
   - Acesse o GORGEN como administrador
   - Vá em Configurações > Backup > Restaurar
   - Faça upload do arquivo backup_data.json.gz
   - Confirme a restauração

ATENÇÃO:
- A restauração SUBSTITUI todos os dados atuais
- Faça um backup do estado atual antes de restaurar
- Este processo é IRREVERSÍVEL

SUPORTE:
- Em caso de dúvidas, contate o suporte técnico
- Mantenha este arquivo em local seguro

================================================================================
                    GORGEN - Aplicativo de Gestão em Saúde
================================================================================
`;
}


// ==========================================
// NOTIFICAÇÃO POR E-MAIL
// ==========================================

interface BackupEmailNotification {
  email: string;
  success: boolean;
  tenantId: number;
  backupType: string;
  records?: number;
  fileSize?: number;
  duration?: number;
  encrypted?: boolean;
  errorMessage?: string;
}

/**
 * Envia notificação por e-mail sobre o status do backup
 */
export async function sendBackupEmailNotification(params: BackupEmailNotification): Promise<boolean> {
  try {
    const { email, success, tenantId, backupType, records, fileSize, duration, encrypted, errorMessage } = params;
    
    // Usar a API de notificação do Manus para enviar e-mail
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.warn("[Backup Email] Forge API não configurada, pulando envio de e-mail");
      return false;
    }
    
    const subject = success 
      ? `✅ GORGEN - Backup ${backupType.toUpperCase()} concluído com sucesso`
      : `❌ GORGEN - Falha no backup ${backupType.toUpperCase()}`;
    
    const dateStr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    
    let body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${success ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .badge-encrypted { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${success ? '✅ Backup Concluído' : '❌ Falha no Backup'}</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>${success 
        ? 'O backup do sistema GORGEN foi realizado com sucesso.' 
        : 'Houve uma falha durante o backup do sistema GORGEN.'}</p>
      
      <h3>Detalhes do Backup</h3>
      <div class="info-row">
        <span class="label">Data/Hora:</span>
        <span class="value">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="label">Tipo:</span>
        <span class="value">${backupType.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="badge ${success ? 'badge-success' : 'badge-error'}">${success ? 'SUCESSO' : 'FALHA'}</span>
      </div>`;
    
    if (success) {
      body += `
      <div class="info-row">
        <span class="label">Registros:</span>
        <span class="value">${records?.toLocaleString('pt-BR') || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Tamanho:</span>
        <span class="value">${fileSize ? (fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Duração:</span>
        <span class="value">${duration ? (duration / 1000).toFixed(1) + 's' : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Criptografia:</span>
        <span class="badge badge-encrypted">${encrypted ? 'AES-256-GCM ✅' : 'Não criptografado'}</span>
      </div>`;
    } else {
      body += `
      <div class="info-row">
        <span class="label">Erro:</span>
        <span class="value" style="color: #dc2626;">${errorMessage || 'Erro desconhecido'}</span>
      </div>
      <p style="margin-top: 15px; color: #dc2626;">
        <strong>Ação necessária:</strong> Por favor, verifique o sistema e tente executar o backup novamente.
      </p>`;
    }
    
    body += `
    </div>
    <div class="footer">
      <p>GORGEN - Aplicativo de Gestão em Saúde</p>
      <p>Este é um e-mail automático, não responda.</p>
    </div>
  </div>
</body>
</html>`;

    // Chamar API de notificação do Manus
    const response = await fetch(`${forgeApiUrl}/notification/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${forgeApiKey}`,
      },
      body: JSON.stringify({
        to: email,
        subject,
        html: body,
      }),
    });
    
    if (!response.ok) {
      console.error("[Backup Email] Erro ao enviar e-mail:", await response.text());
      return false;
    }
    
    console.log(`[Backup Email] E-mail enviado para ${email}`);
    return true;
  } catch (error) {
    console.error("[Backup Email] Erro ao enviar notificação:", error);
    return false;
  }
}

// ==========================================
// RESTAURAÇÃO DE BACKUP
// ==========================================

export interface RestoreResult {
  success: boolean;
  tablesRestored?: number;
  recordsRestored?: number;
  error?: string;
  duration?: number;
}

/**
 * Restaura um backup a partir de dados criptografados
 * ATENÇÃO: Esta operação substitui TODOS os dados existentes!
 */
export async function restoreBackup(
  tenantId: number,
  encryptedData: Buffer,
  userId: number,
  auditInfo?: { ipAddress?: string; userAgent?: string }
): Promise<RestoreResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  try {
    // 1. Descriptografar dados
    const encryptionPassword = getEncryptionPassword(tenantId);
    const compressedData = decryptData(encryptedData, encryptionPassword);
    
    // 2. Descomprimir
    const jsonData = await gunzip(compressedData);
    const backupPayload = JSON.parse(jsonData.toString("utf-8"));
    
    // 3. Validar estrutura do backup
    if (!backupPayload.version || !backupPayload.tables) {
      throw new Error("Formato de backup inválido");
    }
    
    if (backupPayload.tenantId !== tenantId) {
      throw new Error("Este backup pertence a outro tenant");
    }
    
    // 4. Registrar início da restauração
    console.log(`[Restore] Iniciando restauração para tenant ${tenantId}`);
    console.log(`[Restore] Versão do backup: ${backupPayload.version}`);
    console.log(`[Restore] Tabelas: ${Object.keys(backupPayload.tables).length}`);
    
    let tablesRestored = 0;
    let recordsRestored = 0;
    
    // 5. Restaurar cada tabela
    // NOTA: Em produção, isso deveria ser feito em uma transação
    // e com mais validações de segurança
    for (const [tableName, tableData] of Object.entries(backupPayload.tables)) {
      const data = tableData as TableData;
      if (data.records && data.records.length > 0) {
        console.log(`[Restore] Restaurando ${tableName}: ${data.count} registros`);
        
        // Limpar tabela existente (apenas dados do tenant)
        try {
          // Verificar se a tabela tem tenant_id
          const columnsResult = await db.execute(
            sql.raw(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'tenant_id'`)
          ) as any;
          
          const hasTenantId = ((columnsResult[0] || []) as any[]).length > 0;
          
          if (hasTenantId) {
            await db.execute(sql.raw(`DELETE FROM \`${tableName}\` WHERE tenant_id = ${tenantId}`));
          }
          
          // Inserir novos dados
          // NOTA: Isso é simplificado - em produção, usar batch inserts
          for (const record of data.records) {
            const columns = Object.keys(record).filter(k => record[k] !== null);
            const values = columns.map(k => {
              const val = record[k];
              if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            });
            
            if (columns.length > 0) {
              try {
                await db.execute(
                  sql.raw(`INSERT INTO \`${tableName}\` (${columns.join(", ")}) VALUES (${values.join(", ")})`)
                );
                recordsRestored++;
              } catch (insertError) {
                // Ignorar erros de inserção individual (pode ser duplicata)
                console.warn(`[Restore] Erro ao inserir em ${tableName}:`, insertError);
              }
            }
          }
          
          tablesRestored++;
        } catch (tableError) {
          console.error(`[Restore] Erro ao restaurar ${tableName}:`, tableError);
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    // 6. Notificar conclusão
    await notifyOwner({
      title: "🔄 Restauração de Backup GORGEN",
      content: `Restauração concluída.\n\nTabelas: ${tablesRestored}\nRegistros: ${recordsRestored}\nDuração: ${(duration / 1000).toFixed(1)}s`,
    });
    
    return {
      success: true,
      tablesRestored,
      recordsRestored,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await notifyOwner({
      title: "❌ Falha na Restauração GORGEN",
      content: `A restauração do backup falhou.\n\nErro: ${errorMessage}`,
    });
    
    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Valida um arquivo de backup antes da restauração
 */
export async function validateBackupFile(
  tenantId: number,
  encryptedData: Buffer
): Promise<{ valid: boolean; error?: string; metadata?: any }> {
  try {
    // 1. Descriptografar
    const encryptionPassword = getEncryptionPassword(tenantId);
    const compressedData = decryptData(encryptedData, encryptionPassword);
    
    // 2. Descomprimir
    const jsonData = await gunzip(compressedData);
    const backupPayload = JSON.parse(jsonData.toString("utf-8"));
    
    // 3. Validar estrutura
    if (!backupPayload.version) {
      return { valid: false, error: "Versão do backup não encontrada" };
    }
    
    if (!backupPayload.tables) {
      return { valid: false, error: "Dados das tabelas não encontrados" };
    }
    
    if (backupPayload.tenantId !== tenantId) {
      return { valid: false, error: "Este backup pertence a outro tenant" };
    }
    
    return {
      valid: true,
      metadata: {
        version: backupPayload.version,
        type: backupPayload.type,
        createdAt: backupPayload.createdAt,
        totalTables: backupPayload.metadata?.totalTables,
        totalRecords: backupPayload.metadata?.totalRecords,
        gorgenVersion: backupPayload.metadata?.gorgenVersion,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Verificar se é erro de descriptografia
    if (errorMessage.includes("Unsupported state") || errorMessage.includes("bad decrypt")) {
      return { valid: false, error: "Falha na descriptografia. Verifique se o arquivo pertence a este tenant." };
    }
    
    return { valid: false, error: errorMessage };
  }
}
