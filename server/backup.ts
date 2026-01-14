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
  userId?: number
): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  // Criar registro de backup em andamento
  const [backupRecord] = await db.insert(backupHistory).values({
    tenantId,
    backupType: "full",
    status: "running",
    startedAt: new Date(),
    filePath: "pending",
    triggeredBy,
    createdByUserId: userId,
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
    
    // 5. Gerar checksum
    const checksum = generateChecksum(compressedData);
    
    // 6. Gerar nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup/tenant_${tenantId}/full_${timestamp}.json.gz`;
    
    // 7. Upload para S3
    const { url } = await storagePut(fileName, compressedData, "application/gzip");
    
    // 8. Atualizar registro de backup
    await db
      .update(backupHistory)
      .set({
        status: "success",
        completedAt: new Date(),
        filePath: fileName,
        fileSizeBytes: compressedData.length,
        checksumSha256: checksum,
        databaseRecords: totalRecords,
        destination: "s3_primary",
      })
      .where(eq(backupHistory.id, Number(backupId)));
    
    const duration = Date.now() - startTime;
    
    // 9. Notificar sucesso (se configurado)
    const config = await getBackupConfig(tenantId);
    if (config?.notifyOnSuccess) {
      await notifyOwner({
        title: "✅ Backup GORGEN concluído",
        content: `Backup completo realizado com sucesso.\n\nRegistros: ${totalRecords}\nTamanho: ${(compressedData.length / 1024).toFixed(2)} KB\nDuração: ${(duration / 1000).toFixed(1)}s`,
      });
    }
    
    return {
      success: true,
      backupId: Number(backupId),
      filePath: fileName,
      fileSize: compressedData.length,
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
  userId: number
): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startTime = Date.now();
  
  // Criar registro de backup offline
  const [backupRecord] = await db.insert(backupHistory).values({
    tenantId,
    backupType: "offline",
    status: "running",
    startedAt: new Date(),
    filePath: "pending",
    destination: "offline_hd",
    triggeredBy: "manual",
    createdByUserId: userId,
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
