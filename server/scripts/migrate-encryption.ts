/**
 * GORGEN - Script de Migração de Criptografia
 * 
 * Este script criptografa os dados sensíveis existentes na tabela pacientes.
 * Deve ser executado UMA VEZ após configurar as variáveis de ambiente:
 * - ENCRYPTION_KEY
 * - HMAC_SECRET_KEY
 * 
 * IMPORTANTE: Faça backup do banco de dados antes de executar!
 * 
 * Uso: npx tsx server/scripts/migrate-encryption.ts
 * 
 * @version 1.0.0
 * @date 2026-01-26
 */

import { getPooledDb } from "../_core/database";
import { pacientes } from "../../drizzle/schema";
import { encryptionService } from "../services/EncryptionService";
import { hashingService } from "../services/HashingService";
import { eq, isNull, and, or, sql } from "drizzle-orm";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const BATCH_SIZE = 100; // Processar em lotes para não sobrecarregar
const DRY_RUN = process.argv.includes("--dry-run"); // Modo simulação

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function isAlreadyEncrypted(value: string | null): boolean {
  if (!value) return false;
  return value.startsWith("enc:v1:");
}

// ==========================================
// MIGRAÇÃO PRINCIPAL
// ==========================================

async function migrateEncryption(): Promise<void> {
  log("=".repeat(60));
  log("GORGEN - Migração de Criptografia de Dados Sensíveis");
  log("=".repeat(60));
  
  if (DRY_RUN) {
    log("⚠️  MODO DRY-RUN: Nenhuma alteração será feita no banco.");
  }

  // Validar chaves de criptografia
  log("Validando chaves de criptografia...");
  try {
    encryptionService.validateKey();
    hashingService.validateKey();
    log("✅ Chaves de criptografia válidas.");
  } catch (error) {
    log(`❌ Erro na validação das chaves: ${error}`);
    log("Configure ENCRYPTION_KEY e HMAC_SECRET_KEY antes de executar.");
    process.exit(1);
  }

  // Conectar ao banco
  log("Conectando ao banco de dados...");
  const db = await getPooledDb();
  if (!db) {
    log("❌ Não foi possível conectar ao banco de dados.");
    process.exit(1);
  }
  log("✅ Conectado ao banco de dados.");

  // Contar pacientes que precisam de migração
  log("Contando pacientes que precisam de migração...");
  
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(pacientes)
    .where(
      and(
        isNull(pacientes.deletedAt),
        or(
          // CPF não está criptografado e não é nulo
          and(
            sql`${pacientes.cpf} IS NOT NULL`,
            sql`${pacientes.cpf} != ''`,
            sql`${pacientes.cpf} NOT LIKE 'enc:v1:%'`
          ),
          // Email não está criptografado e não é nulo
          and(
            sql`${pacientes.email} IS NOT NULL`,
            sql`${pacientes.email} != ''`,
            sql`${pacientes.email} NOT LIKE 'enc:v1:%'`
          ),
          // Telefone não está criptografado e não é nulo
          and(
            sql`${pacientes.telefone} IS NOT NULL`,
            sql`${pacientes.telefone} != ''`,
            sql`${pacientes.telefone} NOT LIKE 'enc:v1:%'`
          )
        )
      )
    );

  const totalToMigrate = countResult[0]?.count || 0;
  log(`📊 Total de pacientes para migrar: ${totalToMigrate}`);

  if (totalToMigrate === 0) {
    log("✅ Nenhum paciente precisa de migração. Todos os dados já estão criptografados.");
    process.exit(0);
  }

  // Processar em lotes
  let processed = 0;
  let errors = 0;
  let offset = 0;

  while (processed < totalToMigrate) {
    log(`\nProcessando lote ${Math.floor(offset / BATCH_SIZE) + 1}...`);

    // Buscar lote de pacientes
    const batch = await db
      .select()
      .from(pacientes)
      .where(
        and(
          isNull(pacientes.deletedAt),
          or(
            and(
              sql`${pacientes.cpf} IS NOT NULL`,
              sql`${pacientes.cpf} != ''`,
              sql`${pacientes.cpf} NOT LIKE 'enc:v1:%'`
            ),
            and(
              sql`${pacientes.email} IS NOT NULL`,
              sql`${pacientes.email} != ''`,
              sql`${pacientes.email} NOT LIKE 'enc:v1:%'`
            ),
            and(
              sql`${pacientes.telefone} IS NOT NULL`,
              sql`${pacientes.telefone} != ''`,
              sql`${pacientes.telefone} NOT LIKE 'enc:v1:%'`
            )
          )
        )
      )
      .limit(BATCH_SIZE);

    if (batch.length === 0) break;

    // Processar cada paciente do lote
    for (const paciente of batch) {
      try {
        const updates: Record<string, string | null> = {};
        const tenantId = paciente.tenantId;

        // Criptografar CPF
        if (paciente.cpf && !isAlreadyEncrypted(paciente.cpf)) {
          updates.cpf = encryptionService.encrypt(paciente.cpf);
          updates.cpfHash = hashingService.createHash(paciente.cpf, tenantId);
        }

        // Criptografar email
        if (paciente.email && !isAlreadyEncrypted(paciente.email)) {
          updates.email = encryptionService.encrypt(paciente.email);
          updates.emailHash = hashingService.createHash(paciente.email, tenantId);
        }

        // Criptografar telefone
        if (paciente.telefone && !isAlreadyEncrypted(paciente.telefone)) {
          updates.telefone = encryptionService.encrypt(paciente.telefone);
          updates.telefoneHash = hashingService.createHash(paciente.telefone, tenantId);
        }

        // Aplicar updates
        if (Object.keys(updates).length > 0) {
          if (!DRY_RUN) {
            await db
              .update(pacientes)
              .set(updates)
              .where(eq(pacientes.id, paciente.id));
          }
          
          log(`  ✅ Paciente ${paciente.id} (${paciente.nome}): ${Object.keys(updates).length} campos criptografados`);
        }

        processed++;
      } catch (error) {
        errors++;
        log(`  ❌ Erro ao processar paciente ${paciente.id}: ${error}`);
      }
    }

    offset += BATCH_SIZE;
    log(`📈 Progresso: ${processed}/${totalToMigrate} (${Math.round(processed / totalToMigrate * 100)}%)`);
  }

  // Resumo final
  log("\n" + "=".repeat(60));
  log("RESUMO DA MIGRAÇÃO");
  log("=".repeat(60));
  log(`✅ Pacientes processados com sucesso: ${processed - errors}`);
  log(`❌ Erros: ${errors}`);
  
  if (DRY_RUN) {
    log("\n⚠️  MODO DRY-RUN: Nenhuma alteração foi feita.");
    log("Execute sem --dry-run para aplicar as alterações.");
  } else {
    log("\n✅ Migração concluída com sucesso!");
  }

  process.exit(errors > 0 ? 1 : 0);
}

// ==========================================
// EXECUÇÃO
// ==========================================

migrateEncryption().catch((error) => {
  log(`❌ Erro fatal: ${error}`);
  process.exit(1);
});
