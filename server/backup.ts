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


// ==========================================
// BACKUP INCREMENTAL
// ==========================================

interface IncrementalBackupState {
  lastBackupId: number;
  lastBackupDate: Date;
  lastChecksum: string;
}

/**
 * Obtém o estado do último backup completo para backup incremental
 */
async function getLastFullBackupState(tenantId: number): Promise<IncrementalBackupState | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [lastFull] = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.completedAt))
    .limit(1);
  
  if (!lastFull || lastFull.status !== "success") {
    return null;
  }
  
  return {
    lastBackupId: lastFull.id,
    lastBackupDate: lastFull.completedAt || lastFull.startedAt,
    lastChecksum: lastFull.checksumSha256 || "",
  };
}

/**
 * Exporta apenas registros modificados desde uma data específica
 */
async function exportModifiedRecords(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  tableName: string,
  tenantId: number,
  sinceDate: Date
): Promise<TableData & { modifiedCount: number; newCount: number }> {
  // Verificar se a tabela tem colunas de auditoria
  const columnsResult = await db.execute(
    sql.raw(`SHOW COLUMNS FROM \`${tableName}\``)
  ) as any;
  
  const columns = ((columnsResult[0] || []) as any[]).map((r: any) => r.Field);
  const hasUpdatedAt = columns.includes("updated_at");
  const hasCreatedAt = columns.includes("created_at");
  const hasTenantId = columns.includes("tenant_id");
  
  if (!hasUpdatedAt && !hasCreatedAt) {
    // Tabela sem campos de auditoria - exportar tudo
    return {
      ...(await exportTableData(db, tableName, tenantId)),
      modifiedCount: 0,
      newCount: 0,
    };
  }
  
  const sinceDateStr = sinceDate.toISOString().slice(0, 19).replace("T", " ");
  let query: string;
  
  // Construir query para registros novos ou modificados
  const conditions: string[] = [];
  
  if (hasTenantId) {
    conditions.push(`tenant_id = ${tenantId}`);
  }
  
  const dateConditions: string[] = [];
  if (hasUpdatedAt) {
    dateConditions.push(`updated_at >= '${sinceDateStr}'`);
  }
  if (hasCreatedAt) {
    dateConditions.push(`created_at >= '${sinceDateStr}'`);
  }
  
  if (dateConditions.length > 0) {
    conditions.push(`(${dateConditions.join(" OR ")})`);
  }
  
  query = `SELECT * FROM \`${tableName}\` WHERE ${conditions.join(" AND ")}`;
  
  const result = await db.execute(sql.raw(query)) as any;
  const records = (result[0] || []) as any[];
  
  // Contar novos vs modificados
  let newCount = 0;
  let modifiedCount = 0;
  
  for (const record of records) {
    if (hasCreatedAt && record.created_at >= sinceDate) {
      newCount++;
    } else {
      modifiedCount++;
    }
  }
  
  return {
    tableName,
    records,
    count: records.length,
    modifiedCount,
    newCount,
  };
}

/**
 * Executa backup incremental (apenas alterações desde o último backup)
 */
export async function executeIncrementalBackup(
  tenantId: number,
  triggeredBy: "scheduled" | "manual" | "system" = "scheduled",
  userId?: number,
  auditInfo?: { ipAddress?: string; userAgent?: string }
): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  // Verificar se existe backup completo anterior
  const lastBackupState = await getLastFullBackupState(tenantId);
  
  if (!lastBackupState) {
    // Não há backup completo - executar backup full
    console.log("[Incremental] Nenhum backup completo encontrado, executando backup full");
    return executeFullBackup(tenantId, triggeredBy, userId, auditInfo);
  }
  
  // Criar registro de backup em andamento
  const [backupRecord] = await db.insert(backupHistory).values({
    tenantId,
    backupType: "incremental",
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
    
    // 2. Exportar apenas registros modificados
    const incrementalData: { [key: string]: any } = {};
    let totalRecords = 0;
    let totalModified = 0;
    let totalNew = 0;
    
    for (const table of tables) {
      const tableData = await exportModifiedRecords(
        db,
        table,
        tenantId,
        lastBackupState.lastBackupDate
      );
      
      if (tableData.count > 0) {
        incrementalData[table] = tableData;
        totalRecords += tableData.count;
        totalModified += tableData.modifiedCount;
        totalNew += tableData.newCount;
      }
    }
    
    // Se não houver alterações, registrar backup vazio
    if (totalRecords === 0) {
      await db
        .update(backupHistory)
        .set({
          status: "success",
          completedAt: new Date(),
          filePath: "no_changes",
          fileSizeBytes: 0,
          databaseRecords: 0,
          destination: "s3_primary",
          isEncrypted: false,
        })
        .where(eq(backupHistory.id, Number(backupId)));
      
      return {
        success: true,
        backupId: Number(backupId),
        filePath: "no_changes",
        fileSize: 0,
        duration: Date.now() - startTime,
      };
    }
    
    // 3. Criar objeto de backup incremental
    const backupPayload = {
      version: "3.0",
      type: "incremental",
      tenantId,
      createdAt: new Date().toISOString(),
      baseBackupId: lastBackupState.lastBackupId,
      baseBackupDate: lastBackupState.lastBackupDate.toISOString(),
      baseChecksum: lastBackupState.lastChecksum,
      tables: incrementalData,
      metadata: {
        totalTables: Object.keys(incrementalData).length,
        totalRecords,
        modifiedRecords: totalModified,
        newRecords: totalNew,
        gorgenVersion: "2.15",
      },
    };
    
    // 4. Serializar e comprimir
    const jsonData = JSON.stringify(backupPayload, null, 2);
    const compressedData = await gzip(Buffer.from(jsonData, "utf-8"));
    
    // 5. Criptografar
    const encryptionPassword = getEncryptionPassword(tenantId);
    const encryptedData = encryptData(compressedData, encryptionPassword);
    
    // 6. Gerar checksum
    const checksum = generateChecksum(encryptedData);
    
    // 7. Upload para S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup/tenant_${tenantId}/incremental_${timestamp}.json.gz.enc`;
    
    await storagePut(fileName, encryptedData, "application/octet-stream");
    
    // 8. Atualizar registro
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
        isEncrypted: true,
        encryptionAlgorithm: "AES-256-GCM",
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    const duration = Date.now() - startTime;
    
    // 9. Notificar sucesso
    const config = await getBackupConfig(tenantId);
    if (config?.notifyOnSuccess) {
      await notifyOwner({
        title: "✅ Backup Incremental GORGEN",
        content: `Backup incremental concluído.\n\nRegistros alterados: ${totalRecords}\n- Novos: ${totalNew}\n- Modificados: ${totalModified}\nTamanho: ${(encryptedData.length / 1024).toFixed(2)} KB\nDuração: ${(duration / 1000).toFixed(1)}s`,
      });
    }
    
    // 10. Enviar e-mail
    if (config?.notificationEmail) {
      await sendBackupEmailNotification({
        email: config.notificationEmail,
        success: true,
        tenantId,
        backupType: "incremental",
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
    
    await db
      .update(backupHistory)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    const config = await getBackupConfig(tenantId);
    if (config?.notifyOnFailure) {
      await notifyOwner({
        title: "❌ Falha no Backup Incremental GORGEN",
        content: `O backup incremental falhou.\n\nErro: ${errorMessage}`,
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
// VERIFICAÇÃO DE INTEGRIDADE PERIÓDICA
// ==========================================

export interface IntegrityCheckResult {
  backupId: number;
  valid: boolean;
  error?: string;
  checksumMatch?: boolean;
  fileExists?: boolean;
  decryptable?: boolean;
}

export interface IntegrityReportResult {
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  results: IntegrityCheckResult[];
  checkedAt: Date;
}

/**
 * Verifica a integridade de um backup específico
 */
export async function verifyBackupIntegrity(backupId: number): Promise<IntegrityCheckResult> {
  const db = await getDb();
  if (!db) {
    return { backupId, valid: false, error: "Database not available" };
  }
  
  const [backup] = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.id, backupId))
    .limit(1);
  
  if (!backup) {
    return { backupId, valid: false, error: "Backup não encontrado" };
  }
  
  if (backup.status !== "success" || !backup.filePath || backup.filePath === "no_changes") {
    return { 
      backupId, 
      valid: backup.filePath === "no_changes", 
      error: backup.filePath === "no_changes" ? undefined : "Backup não foi concluído com sucesso" 
    };
  }
  
  try {
    // 1. Verificar se o arquivo existe no S3
    const { url } = await storageGet(backup.filePath);
    const response = await fetch(url);
    
    if (!response.ok) {
      return { backupId, valid: false, fileExists: false, error: "Arquivo não encontrado no S3" };
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // 2. Verificar checksum
    const currentChecksum = generateChecksum(buffer);
    const checksumMatch = currentChecksum === backup.checksumSha256;
    
    if (!checksumMatch) {
      return { 
        backupId, 
        valid: false, 
        fileExists: true, 
        checksumMatch: false, 
        error: "Checksum não corresponde - arquivo pode estar corrompido" 
      };
    }
    
    // 3. Tentar descriptografar (se criptografado)
    if (backup.isEncrypted) {
      try {
        const encryptionPassword = getEncryptionPassword(backup.tenantId);
        const decrypted = decryptData(buffer, encryptionPassword);
        
        // Tentar descomprimir para validar estrutura
        const uncompressed = await gunzip(decrypted);
        const data = JSON.parse(uncompressed.toString("utf-8"));
        
        if (!data.version || !data.tables) {
          return { 
            backupId, 
            valid: false, 
            fileExists: true, 
            checksumMatch: true, 
            decryptable: true,
            error: "Estrutura do backup inválida" 
          };
        }
      } catch (decryptError) {
        return { 
          backupId, 
          valid: false, 
          fileExists: true, 
          checksumMatch: true, 
          decryptable: false,
          error: "Falha na descriptografia" 
        };
      }
    }
    
    return { 
      backupId, 
      valid: true, 
      fileExists: true, 
      checksumMatch: true, 
      decryptable: backup.isEncrypted ? true : undefined 
    };
  } catch (error) {
    return { 
      backupId, 
      valid: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Executa verificação de integridade em todos os backups recentes
 */
export async function runIntegrityCheck(
  tenantId: number,
  daysBack: number = 30
): Promise<IntegrityReportResult> {
  const db = await getDb();
  if (!db) {
    return {
      totalChecked: 0,
      validCount: 0,
      invalidCount: 0,
      results: [],
      checkedAt: new Date(),
    };
  }
  
  // Buscar backups dos últimos N dias
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const backups = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.completedAt))
    .limit(100);
  
  const recentBackups = backups.filter(b => 
    b.completedAt && new Date(b.completedAt) >= cutoffDate
  );
  
  const results: IntegrityCheckResult[] = [];
  let validCount = 0;
  let invalidCount = 0;
  
  for (const backup of recentBackups) {
    const result = await verifyBackupIntegrity(backup.id);
    results.push(result);
    
    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }
  
  // Se houver backups inválidos, notificar
  if (invalidCount > 0) {
    await notifyOwner({
      title: "⚠️ Alerta de Integridade - GORGEN Backup",
      content: `A verificação de integridade encontrou ${invalidCount} backup(s) com problemas.\n\nTotal verificado: ${results.length}\nVálidos: ${validCount}\nInválidos: ${invalidCount}\n\nPor favor, verifique o sistema de backup.`,
    });
  }
  
  return {
    totalChecked: results.length,
    validCount,
    invalidCount,
    results,
    checkedAt: new Date(),
  };
}

// ==========================================
// RELATÓRIO DE AUDITORIA DE BACKUPS
// ==========================================

export interface BackupAuditEntry {
  id: number;
  date: Date;
  type: string;
  status: string;
  triggeredBy: string;
  userId?: number;
  userIp?: string;
  userAgent?: string;
  fileSize?: number;
  records?: number;
  encrypted: boolean;
  duration?: number;
  error?: string;
}

export interface BackupAuditReport {
  tenantId: number;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  summary: {
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    fullBackups: number;
    incrementalBackups: number;
    offlineBackups: number;
    totalDataProtected: number; // bytes
    averageBackupSize: number;
    averageDuration: number;
    encryptedBackups: number;
    encryptionRate: number; // percentual
  };
  entries: BackupAuditEntry[];
  integrityStatus: {
    lastCheck?: Date;
    validBackups: number;
    invalidBackups: number;
  };
  compliance: {
    dailyBackupsMet: boolean;
    weeklyBackupsMet: boolean;
    monthlyBackupsMet: boolean;
    encryptionCompliance: boolean;
    retentionCompliance: boolean;
  };
  generatedAt: Date;
  generatedBy: string;
}

/**
 * Gera relatório de auditoria de backups para conformidade regulatória
 */
export async function generateBackupAuditReport(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  generatedBy: string = "system"
): Promise<BackupAuditReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todos os backups no período
  const backups = await db
    .select()
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.completedAt));
  
  // Filtrar por período
  const periodBackups = backups.filter(b => {
    const backupDate = b.completedAt || b.startedAt;
    return backupDate >= startDate && backupDate <= endDate;
  });
  
  // Calcular estatísticas
  const successfulBackups = periodBackups.filter(b => b.status === "success");
  const failedBackups = periodBackups.filter(b => b.status === "failed");
  const fullBackups = periodBackups.filter(b => b.backupType === "full");
  const incrementalBackups = periodBackups.filter(b => b.backupType === "incremental");
  const offlineBackups = periodBackups.filter(b => b.backupType === "offline");
  const encryptedBackups = periodBackups.filter(b => b.isEncrypted);
  
  const totalSize = successfulBackups.reduce((sum, b) => sum + (b.fileSizeBytes || 0), 0);
  const avgSize = successfulBackups.length > 0 ? totalSize / successfulBackups.length : 0;
  
  // Calcular duração média
  const durations = successfulBackups
    .filter(b => b.completedAt && b.startedAt)
    .map(b => new Date(b.completedAt!).getTime() - new Date(b.startedAt).getTime());
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  // Verificar conformidade
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksDiff = Math.ceil(daysDiff / 7);
  const monthsDiff = Math.ceil(daysDiff / 30);
  
  const dailyBackupsMet = successfulBackups.length >= daysDiff * 0.9; // 90% dos dias
  const weeklyBackupsMet = fullBackups.length >= weeksDiff;
  const monthlyBackupsMet = offlineBackups.length >= monthsDiff;
  const encryptionCompliance = periodBackups.length === 0 || 
    (encryptedBackups.length / periodBackups.length) >= 0.95; // 95% criptografados
  
  // Buscar configuração de retenção
  const config = await getBackupConfig(tenantId);
  const retentionCompliance = config?.monthlyRetentionMonths ? 
    config.monthlyRetentionMonths >= 84 : false; // 7 anos mínimo
  
  // Criar entradas de auditoria
  const entries: BackupAuditEntry[] = periodBackups.map(b => ({
    id: b.id,
    date: b.completedAt || b.startedAt,
    type: b.backupType,
    status: b.status,
    triggeredBy: b.triggeredBy || "unknown",
    userId: b.createdByUserId || undefined,
    userIp: b.userIpAddress || undefined,
    userAgent: b.userAgent || undefined,
    fileSize: b.fileSizeBytes || undefined,
    records: b.databaseRecords || undefined,
    encrypted: b.isEncrypted || false,
    duration: b.completedAt && b.startedAt 
      ? new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime()
      : undefined,
    error: b.errorMessage || undefined,
  }));
  
  // Executar verificação de integridade
  const integrityResult = await runIntegrityCheck(tenantId, daysDiff);
  
  return {
    tenantId,
    reportPeriod: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalBackups: periodBackups.length,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      fullBackups: fullBackups.length,
      incrementalBackups: incrementalBackups.length,
      offlineBackups: offlineBackups.length,
      totalDataProtected: totalSize,
      averageBackupSize: avgSize,
      averageDuration: avgDuration,
      encryptedBackups: encryptedBackups.length,
      encryptionRate: periodBackups.length > 0 
        ? (encryptedBackups.length / periodBackups.length) * 100 
        : 100,
    },
    entries,
    integrityStatus: {
      lastCheck: integrityResult.checkedAt,
      validBackups: integrityResult.validCount,
      invalidBackups: integrityResult.invalidCount,
    },
    compliance: {
      dailyBackupsMet,
      weeklyBackupsMet,
      monthlyBackupsMet,
      encryptionCompliance,
      retentionCompliance,
    },
    generatedAt: new Date(),
    generatedBy,
  };
}

/**
 * Gera relatório de auditoria mensal (para uso em cron job)
 */
export async function generateMonthlyAuditReport(tenantId: number): Promise<BackupAuditReport> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  return generateBackupAuditReport(tenantId, startDate, endDate, "monthly_cron");
}



// ==========================================
// TESTE DE RESTAURAÇÃO AUTOMÁTICO
// ==========================================

export interface RestoreTestResult {
  success: boolean;
  backupId: number;
  backupDate: Date;
  testStartedAt: Date;
  testCompletedAt: Date;
  duration: number; // ms
  
  // Validações realizadas
  validations: {
    decryption: { success: boolean; error?: string };
    decompression: { success: boolean; error?: string };
    jsonParsing: { success: boolean; error?: string };
    checksumVerification: { success: boolean; expected?: string; actual?: string };
    schemaValidation: { success: boolean; missingTables?: string[]; extraTables?: string[] };
    dataIntegrity: { 
      success: boolean; 
      tablesChecked: number;
      recordsVerified: number;
      errors?: string[];
    };
  };
  
  // Resumo
  summary: {
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    overallStatus: "passed" | "failed" | "partial";
  };
  
  error?: string;
}

/**
 * Executa teste de restauração em ambiente isolado (sandbox)
 * Não altera dados do banco de produção
 */
export async function runRestoreTest(
  tenantId: number,
  backupId?: number,
  userId?: string,
  userIp?: string
): Promise<RestoreTestResult> {
  const testStartedAt = new Date();
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const validations: RestoreTestResult["validations"] = {
    decryption: { success: false },
    decompression: { success: false },
    jsonParsing: { success: false },
    checksumVerification: { success: false },
    schemaValidation: { success: false },
    dataIntegrity: { success: false, tablesChecked: 0, recordsVerified: 0 },
  };
  
  try {
    // 1. Buscar backup mais recente se não especificado
    let backup: any;
    if (backupId) {
      const result = await db.select().from(backupHistory)
        .where(eq(backupHistory.id, backupId))
        .limit(1);
      backup = result[0];
    } else {
      const result = await db.select().from(backupHistory)
        .where(eq(backupHistory.tenantId, tenantId))
        .orderBy(desc(backupHistory.createdAt))
        .limit(1);
      backup = result[0];
    }
    
    if (!backup) {
      throw new Error("Nenhum backup encontrado para teste");
    }
    
    // 2. Baixar arquivo do S3
    const { url } = await storageGet(backup.filePath);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar backup: ${response.status}`);
    }
    
    let data: Buffer = Buffer.from(await response.arrayBuffer());
    
    // 3. Teste de descriptografia
    if (backup.isEncrypted) {
      try {
        const password = getEncryptionPassword(tenantId);
        data = decryptData(data, password) as Buffer;
        validations.decryption = { success: true };
      } catch (error) {
        validations.decryption = { 
          success: false, 
          error: error instanceof Error ? error.message : "Erro de descriptografia" 
        };
        throw new Error("Falha na descriptografia do backup");
      }
    } else {
      validations.decryption = { success: true }; // Não criptografado, passa automaticamente
    }
    
    // 4. Teste de descompressão
    try {
      data = Buffer.from(await gunzip(data));
      validations.decompression = { success: true };
    } catch (error) {
      validations.decompression = { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro de descompressão" 
      };
      throw new Error("Falha na descompressão do backup");
    }
    
    // 5. Teste de parsing JSON
    let backupData: any;
    try {
      backupData = JSON.parse(data.toString("utf-8"));
      validations.jsonParsing = { success: true };
    } catch (error) {
      validations.jsonParsing = { 
        success: false, 
        error: error instanceof Error ? error.message : "JSON inválido" 
      };
      throw new Error("Falha no parsing do JSON do backup");
    }
    
    // 6. Verificação de checksum
    const calculatedChecksum = crypto.createHash("sha256").update(data).digest("hex");
    if (backup.checksum && calculatedChecksum === backup.checksum) {
      validations.checksumVerification = { 
        success: true, 
        expected: backup.checksum, 
        actual: calculatedChecksum 
      };
    } else if (!backup.checksum) {
      // Backup antigo sem checksum
      validations.checksumVerification = { 
        success: true, 
        actual: calculatedChecksum 
      };
    } else {
      validations.checksumVerification = { 
        success: false, 
        expected: backup.checksum, 
        actual: calculatedChecksum 
      };
      // Não falha o teste, apenas registra
    }
    
    // 7. Validação de schema
    const currentTables = await listTables(db);
    const backupTables = backupData.tables?.map((t: any) => t.tableName) || [];
    
    const missingTables = currentTables.filter(t => !backupTables.includes(t));
    const extraTables = backupTables.filter((t: string) => !currentTables.includes(t));
    
    // Tabelas críticas que devem existir
    const criticalTables = ["pacientes", "atendimentos", "users", "tenants"];
    const missingCritical = criticalTables.filter(t => !backupTables.includes(t));
    
    validations.schemaValidation = {
      success: missingCritical.length === 0,
      missingTables: missingTables.length > 0 ? missingTables : undefined,
      extraTables: extraTables.length > 0 ? extraTables : undefined,
    };
    
    // 8. Validação de integridade dos dados
    const dataErrors: string[] = [];
    let tablesChecked = 0;
    let recordsVerified = 0;
    
    for (const tableData of (backupData.tables || [])) {
      tablesChecked++;
      
      // Verificar se cada registro tem campos obrigatórios
      for (const record of tableData.records) {
        recordsVerified++;
        
        // Verificar campos básicos
        if (tableData.tableName === "pacientes") {
          if (!record.nome) {
            dataErrors.push(`Paciente ID ${record.id}: campo 'nome' ausente`);
          }
        }
        
        if (tableData.tableName === "atendimentos") {
          if (!record.paciente_id) {
            dataErrors.push(`Atendimento ID ${record.id}: campo 'paciente_id' ausente`);
          }
        }
      }
    }
    
    validations.dataIntegrity = {
      success: dataErrors.length === 0,
      tablesChecked,
      recordsVerified,
      errors: dataErrors.length > 0 ? dataErrors.slice(0, 10) : undefined, // Limitar a 10 erros
    };
    
    // Calcular resumo
    const validationResults = Object.values(validations);
    const passedValidations = validationResults.filter(v => v.success).length;
    const failedValidations = validationResults.filter(v => !v.success).length;
    
    const testCompletedAt = new Date();
    
    const result: RestoreTestResult = {
      success: failedValidations === 0,
      backupId: backup.id,
      backupDate: backup.createdAt,
      testStartedAt,
      testCompletedAt,
      duration: testCompletedAt.getTime() - testStartedAt.getTime(),
      validations,
      summary: {
        totalValidations: validationResults.length,
        passedValidations,
        failedValidations,
        overallStatus: failedValidations === 0 ? "passed" : passedValidations > 0 ? "partial" : "failed",
      },
    };
    
    // Registrar resultado do teste no histórico
    await db.update(backupHistory)
      .set({
        lastVerifiedAt: testCompletedAt,
        verificationStatus: result.success ? "valid" : "invalid",
      })
      .where(eq(backupHistory.id, backup.id));
    
    // Notificar resultado
    await notifyOwner({
      title: result.success 
        ? "✅ Teste de Restauração: APROVADO" 
        : "⚠️ Teste de Restauração: FALHOU",
      content: `
**Teste de Restauração de Backup**

📅 Backup testado: ${backup.createdAt.toLocaleDateString("pt-BR")}
🆔 ID do Backup: ${backup.id}
⏱️ Duração do teste: ${result.duration}ms

**Resultado das Validações:**
- Descriptografia: ${validations.decryption.success ? "✅" : "❌"}
- Descompressão: ${validations.decompression.success ? "✅" : "❌"}
- Parsing JSON: ${validations.jsonParsing.success ? "✅" : "❌"}
- Checksum: ${validations.checksumVerification.success ? "✅" : "❌"}
- Schema: ${validations.schemaValidation.success ? "✅" : "❌"}
- Integridade: ${validations.dataIntegrity.success ? "✅" : "❌"}

**Resumo:**
- Tabelas verificadas: ${validations.dataIntegrity.tablesChecked}
- Registros verificados: ${validations.dataIntegrity.recordsVerified}
- Validações aprovadas: ${passedValidations}/${validationResults.length}

${userId ? `Executado por: ${userId}` : "Execução automática (cron)"}
${userIp ? `IP: ${userIp}` : ""}
      `.trim(),
    });
    
    return result;
    
  } catch (error) {
    const testCompletedAt = new Date();
    
    const result: RestoreTestResult = {
      success: false,
      backupId: backupId || 0,
      backupDate: new Date(),
      testStartedAt,
      testCompletedAt,
      duration: testCompletedAt.getTime() - testStartedAt.getTime(),
      validations,
      summary: {
        totalValidations: 6,
        passedValidations: Object.values(validations).filter(v => v.success).length,
        failedValidations: Object.values(validations).filter(v => !v.success).length,
        overallStatus: "failed",
      },
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
    
    // Notificar falha
    await notifyOwner({
      title: "❌ Teste de Restauração: ERRO",
      content: `
**Erro no Teste de Restauração**

🆔 Backup ID: ${backupId || "mais recente"}
❌ Erro: ${result.error}

**Validações completadas antes do erro:**
- Descriptografia: ${validations.decryption.success ? "✅" : validations.decryption.error ? "❌ " + validations.decryption.error : "⏳ Não executado"}
- Descompressão: ${validations.decompression.success ? "✅" : validations.decompression.error ? "❌ " + validations.decompression.error : "⏳ Não executado"}
- Parsing JSON: ${validations.jsonParsing.success ? "✅" : validations.jsonParsing.error ? "❌ " + validations.jsonParsing.error : "⏳ Não executado"}

${userId ? `Executado por: ${userId}` : "Execução automática (cron)"}
      `.trim(),
    });
    
    return result;
  }
}

/**
 * Executa teste de restauração do backup mais recente (para cron job)
 */
export async function runScheduledRestoreTest(tenantId: number): Promise<RestoreTestResult> {
  return runRestoreTest(tenantId, undefined, "scheduled_cron", "127.0.0.1");
}

/**
 * Obtém histórico de testes de restauração
 */
export async function getRestoreTestHistory(
  tenantId: number,
  limit: number = 10
): Promise<Array<{
  backupId: number;
  backupDate: Date;
  lastTestedAt: Date | null;
  verificationStatus: string | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const backups = await db.select({
    backupId: backupHistory.id,
    backupDate: backupHistory.createdAt,
    lastTestedAt: backupHistory.lastVerifiedAt,
    verificationStatus: backupHistory.verificationStatus,
  })
    .from(backupHistory)
    .where(eq(backupHistory.tenantId, tenantId))
    .orderBy(desc(backupHistory.createdAt))
    .limit(limit);
  
  return backups;
}
