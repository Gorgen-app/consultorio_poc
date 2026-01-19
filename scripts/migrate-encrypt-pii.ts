/**
 * Script de Migração de Dados - Criptografia de Campos PII
 * 
 * Este script migra os dados existentes de pacientes, criptografando os campos PII
 * (CPF, telefone, email) e gerando os hashes para busca.
 * 
 * IMPORTANTE: Execute este script APENAS UMA VEZ após a atualização do schema.
 * 
 * Uso: npx tsx scripts/migrate-encrypt-pii.ts [--dry-run] [--batch-size=100]
 * 
 * Opções:
 *   --dry-run      Simula a migração sem alterar dados
 *   --batch-size   Número de registros por batch (padrão: 100)
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { EncryptionService } from "../server/services/EncryptionService";
import { HashingService } from "../server/services/HashingService";

// Configurações
const ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY || 'gorgen-dev-key-change-in-production-32ch';
const HASH_SECRET = process.env.HASH_SECRET_KEY || 'gorgen-hash-secret-change-in-production';
const DATABASE_URL = process.env.DATABASE_URL;

// Parse argumentos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

// Estatísticas
let totalProcessed = 0;
let totalEncrypted = 0;
let totalSkipped = 0;
let totalErrors = 0;

// Cache de serviços por tenant
const encryptionServices = new Map<number, EncryptionService>();
const hashingServices = new Map<number, HashingService>();

function getEncryptionService(tenantId: number): EncryptionService {
  if (!encryptionServices.has(tenantId)) {
    encryptionServices.set(tenantId, new EncryptionService(ENCRYPTION_KEY, `tenant-${tenantId}`));
  }
  return encryptionServices.get(tenantId)!;
}

function getHashingService(tenantId: number): HashingService {
  if (!hashingServices.has(tenantId)) {
    hashingServices.set(tenantId, new HashingService(HASH_SECRET, `tenant-${tenantId}`));
  }
  return hashingServices.get(tenantId)!;
}

async function main() {
  console.log('='.repeat(60));
  console.log('GORGEN - Migração de Criptografia de Campos PII');
  console.log('='.repeat(60));
  console.log(`Modo: ${isDryRun ? 'DRY RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('');

  if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada');
    process.exit(1);
  }

  // Conectar ao banco
  console.log('📡 Conectando ao banco de dados...');
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Contar registros a migrar
    const [countResult] = await connection.execute<any[]>(
      `SELECT COUNT(*) as total FROM pacientes WHERE cpf_encrypted IS NULL AND cpf IS NOT NULL`
    );
    const totalToMigrate = countResult[0].total;
    console.log(`📊 Total de registros a migrar: ${totalToMigrate}`);
    console.log('');

    if (totalToMigrate === 0) {
      console.log('✅ Nenhum registro para migrar. Todos os dados já estão criptografados.');
      await connection.end();
      return;
    }

    // Processar em batches
    let offset = 0;
    let batchNumber = 1;

    while (offset < totalToMigrate) {
      console.log(`\n--- Batch ${batchNumber} (${offset + 1} - ${Math.min(offset + BATCH_SIZE, totalToMigrate)}) ---`);

      // Buscar pacientes do batch
      const [pacientes] = await connection.execute<any[]>(
        `SELECT id, tenant_id, cpf, email, telefone, responsavel_telefone, responsavel_email 
         FROM pacientes 
         WHERE cpf_encrypted IS NULL AND cpf IS NOT NULL
         LIMIT ? OFFSET ?`,
        [BATCH_SIZE, offset]
      );

      for (const paciente of pacientes) {
        totalProcessed++;

        try {
          const tenantId = paciente.tenant_id || 1;
          const encryption = getEncryptionService(tenantId);
          const hashing = getHashingService(tenantId);

          // Preparar dados criptografados
          const updates: Record<string, string | null> = {};

          // CPF
          if (paciente.cpf) {
            const cpfNormalizado = paciente.cpf.replace(/\D/g, '');
            updates.cpf_encrypted = encryption.encrypt(paciente.cpf);
            updates.cpf_hash = hashing.hash(cpfNormalizado);
          }

          // Email
          if (paciente.email) {
            updates.email_encrypted = encryption.encrypt(paciente.email);
            updates.email_hash = hashing.hash(paciente.email.toLowerCase());
          }

          // Telefone
          if (paciente.telefone) {
            updates.telefone_encrypted = encryption.encrypt(paciente.telefone);
          }

          // Responsável telefone
          if (paciente.responsavel_telefone) {
            updates.responsavel_telefone_encrypted = encryption.encrypt(paciente.responsavel_telefone);
          }

          // Responsável email
          if (paciente.responsavel_email) {
            updates.responsavel_email_encrypted = encryption.encrypt(paciente.responsavel_email);
          }

          // Executar update
          if (!isDryRun && Object.keys(updates).length > 0) {
            const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            const values = [...Object.values(updates), paciente.id];
            
            await connection.execute(
              `UPDATE pacientes SET ${setClauses} WHERE id = ?`,
              values
            );
          }

          totalEncrypted++;
          
          // Log de progresso a cada 50 registros
          if (totalProcessed % 50 === 0) {
            console.log(`  ✓ Processados: ${totalProcessed}/${totalToMigrate}`);
          }

        } catch (error: any) {
          totalErrors++;
          console.error(`  ❌ Erro no paciente ID ${paciente.id}: ${error.message}`);
        }
      }

      offset += BATCH_SIZE;
      batchNumber++;

      // Pequena pausa entre batches para não sobrecarregar o banco
      if (!isDryRun && offset < totalToMigrate) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('RELATÓRIO FINAL');
    console.log('='.repeat(60));
    console.log(`Total processados: ${totalProcessed}`);
    console.log(`Total criptografados: ${totalEncrypted}`);
    console.log(`Total com erro: ${totalErrors}`);
    console.log(`Modo: ${isDryRun ? 'DRY RUN (nenhum dado alterado)' : 'PRODUÇÃO'}`);
    console.log('');

    if (isDryRun) {
      console.log('💡 Para executar a migração real, remova a flag --dry-run');
    } else {
      console.log('✅ Migração concluída com sucesso!');
    }

  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Executar
main().catch(console.error);
