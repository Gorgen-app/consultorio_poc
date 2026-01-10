/**
 * Script de Migração Multi-tenant - Gorgen v4.0
 * 
 * Este script garante que todos os dados existentes estejam associados ao Tenant 1
 * (Dr. André Gorgen - tenant original do sistema)
 * 
 * Execução: node scripts/migrate-to-tenant-1.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function migrateToTenant1() {
  console.log("=".repeat(60));
  console.log("MIGRAÇÃO MULTI-TENANT - Gorgen v4.0");
  console.log("=".repeat(60));
  console.log("\nIniciando migração de dados para Tenant 1...\n");
  
  // Primeiro, garantir que o Tenant 1 existe
  console.log("1. Verificando Tenant 1...");
  const tenantCheck = await db.execute(sql`SELECT id, nome FROM tenants WHERE id = 1`);
  
  if (tenantCheck[0].length === 0) {
    console.log("   Criando Tenant 1 (Dr. André Gorgen)...");
    await db.execute(sql`
      INSERT INTO tenants (id, nome, slug, email, plano, status, max_usuarios, max_pacientes)
      VALUES (1, 'Dr. André Gorgen', 'dr-andre-gorgen', 'contato@andregorgen.com.br', 'enterprise', 'ativo', 100, 50000)
    `);
    console.log("   ✓ Tenant 1 criado");
  } else {
    console.log("   ✓ Tenant 1 já existe:", tenantCheck[0][0].nome);
  }
  
  // Lista de tabelas que precisam ter tenant_id atualizado
  const tablesWithTenantId = [
    { name: 'users', hasColumn: true },
    { name: 'user_profiles', hasColumn: true },
  ];
  
  console.log("\n2. Atualizando tenant_id em tabelas existentes...\n");
  
  for (const table of tablesWithTenantId) {
    try {
      // Verificar se a coluna existe
      const columnCheck = await db.execute(sql.raw(`SHOW COLUMNS FROM ${table.name} LIKE 'tenant_id'`));
      
      if (columnCheck[0].length === 0) {
        console.log(`   ⚠ ${table.name}: coluna tenant_id não existe (será adicionada no Sprint 2+)`);
        continue;
      }
      
      // Contar registros sem tenant_id ou com tenant_id diferente de 1
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as total FROM ${table.name} WHERE tenant_id IS NULL OR tenant_id != 1
      `));
      const count = countResult[0][0].total;
      
      if (count > 0) {
        console.log(`   Atualizando ${count} registros em ${table.name}...`);
        await db.execute(sql.raw(`UPDATE ${table.name} SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id != 1`));
        console.log(`   ✓ ${table.name}: ${count} registros atualizados`);
      } else {
        console.log(`   ✓ ${table.name}: todos os registros já estão no Tenant 1`);
      }
    } catch (e) {
      console.log(`   ✗ ${table.name}: erro - ${e.message}`);
    }
  }
  
  // Verificar resultado final
  console.log("\n3. Verificação final...\n");
  
  for (const table of tablesWithTenantId) {
    try {
      const columnCheck = await db.execute(sql.raw(`SHOW COLUMNS FROM ${table.name} LIKE 'tenant_id'`));
      if (columnCheck[0].length === 0) continue;
      
      const result = await db.execute(sql.raw(`
        SELECT tenant_id, COUNT(*) as total FROM ${table.name} GROUP BY tenant_id
      `));
      console.log(`   ${table.name}:`, result[0]);
    } catch (e) {
      // Tabela pode não existir ainda
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("MIGRAÇÃO CONCLUÍDA");
  console.log("=".repeat(60));
  
  process.exit(0);
}

migrateToTenant1().catch(e => {
  console.error("Erro na migração:", e);
  process.exit(1);
});
