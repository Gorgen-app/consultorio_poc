import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function applyMigration() {
  console.log("Aplicando migração Sprint 2...\n");
  
  const statements = [
    // Verificar e adicionar tenant_id em pacientes
    { check: "SHOW COLUMNS FROM pacientes LIKE 'tenant_id'", 
      add: "ALTER TABLE pacientes ADD tenant_id int DEFAULT 1 NOT NULL" },
    
    // Verificar e adicionar tenant_id em atendimentos
    { check: "SHOW COLUMNS FROM atendimentos LIKE 'tenant_id'", 
      add: "ALTER TABLE atendimentos ADD tenant_id int DEFAULT 1 NOT NULL" },
  ];
  
  for (const stmt of statements) {
    try {
      const check = await db.execute(sql.raw(stmt.check));
      if (check[0].length === 0) {
        console.log(`Executando: ${stmt.add.substring(0, 60)}...`);
        await db.execute(sql.raw(stmt.add));
        console.log("✓ Sucesso\n");
      } else {
        console.log(`✓ Já existe: ${stmt.check}\n`);
      }
    } catch (e) {
      console.log(`⚠ Erro: ${e.message}\n`);
    }
  }
  
  // Criar índices
  const indexes = [
    "CREATE INDEX idx_pacientes_tenant ON pacientes (tenant_id)",
    "CREATE INDEX idx_pacientes_tenant_id_paciente ON pacientes (tenant_id, id_paciente)",
    "CREATE INDEX idx_pacientes_tenant_nome ON pacientes (tenant_id, nome)",
    "CREATE INDEX idx_pacientes_tenant_cpf ON pacientes (tenant_id, cpf)",
    "CREATE INDEX idx_atendimentos_tenant ON atendimentos (tenant_id)",
    "CREATE INDEX idx_atendimentos_tenant_atendimento ON atendimentos (tenant_id, atendimento)",
    "CREATE INDEX idx_atendimentos_tenant_paciente ON atendimentos (tenant_id, paciente_id)",
    "CREATE INDEX idx_atendimentos_tenant_data ON atendimentos (tenant_id, data_atendimento)",
  ];
  
  console.log("Criando índices...\n");
  for (const idx of indexes) {
    try {
      await db.execute(sql.raw(idx));
      console.log(`✓ ${idx.split(' ON ')[0]}`);
    } catch (e) {
      if (e.message.includes("Duplicate key name")) {
        console.log(`✓ Já existe: ${idx.split(' ON ')[0]}`);
      } else {
        console.log(`⚠ ${e.message}`);
      }
    }
  }
  
  // Verificar resultado
  console.log("\nVerificando estrutura final...\n");
  
  const pacientesColumns = await db.execute(sql`SHOW COLUMNS FROM pacientes LIKE 'tenant_id'`);
  console.log("pacientes.tenant_id:", pacientesColumns[0].length > 0 ? "✓ Existe" : "✗ Não existe");
  
  const atendimentosColumns = await db.execute(sql`SHOW COLUMNS FROM atendimentos LIKE 'tenant_id'`);
  console.log("atendimentos.tenant_id:", atendimentosColumns[0].length > 0 ? "✓ Existe" : "✗ Não existe");
  
  // Contar registros
  const pacientesCount = await db.execute(sql`SELECT COUNT(*) as total FROM pacientes`);
  const atendimentosCount = await db.execute(sql`SELECT COUNT(*) as total FROM atendimentos`);
  console.log(`\nRegistros: ${pacientesCount[0][0].total} pacientes, ${atendimentosCount[0][0].total} atendimentos`);
  
  console.log("\n✓ Migração Sprint 2 concluída!");
  process.exit(0);
}

applyMigration().catch(e => {
  console.error("Erro:", e);
  process.exit(1);
});
