import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  console.log("=== AUDITORIA DO BANCO DE DADOS GORGEN ===\n");
  
  // 1. Listar tabelas
  const [tables] = await connection.execute("SHOW TABLES");
  console.log(`📊 Total de tabelas: ${(tables as any[]).length}\n`);
  
  // 2. Contagens principais
  const [counts] = await connection.execute(`
    SELECT 
      (SELECT COUNT(*) FROM pacientes WHERE deleted_at IS NULL) as pacientes_ativos,
      (SELECT COUNT(*) FROM pacientes) as pacientes_total,
      (SELECT COUNT(*) FROM atendimentos WHERE deleted_at IS NULL) as atendimentos_ativos,
      (SELECT COUNT(*) FROM atendimentos) as atendimentos_total,
      (SELECT COUNT(*) FROM users) as usuarios,
      (SELECT COUNT(*) FROM tenants) as tenants,
      (SELECT COUNT(*) FROM agendamentos) as agendamentos,
      (SELECT COUNT(*) FROM evolucoes) as evolucoes,
      (SELECT COUNT(*) FROM audit_log) as logs_auditoria
  `);
  
  console.log("📈 Contagens principais:");
  const c = (counts as any[])[0];
  console.log(`   - Pacientes ativos: ${c.pacientes_ativos}`);
  console.log(`   - Pacientes total: ${c.pacientes_total}`);
  console.log(`   - Atendimentos ativos: ${c.atendimentos_ativos}`);
  console.log(`   - Atendimentos total: ${c.atendimentos_total}`);
  console.log(`   - Usuários: ${c.usuarios}`);
  console.log(`   - Tenants: ${c.tenants}`);
  console.log(`   - Agendamentos: ${c.agendamentos}`);
  console.log(`   - Evoluções: ${c.evolucoes}`);
  console.log(`   - Logs de auditoria: ${c.logs_auditoria}`);
  
  // 3. Verificar integridade referencial
  console.log("\n🔗 Verificação de integridade referencial:");
  
  // Atendimentos sem paciente
  const [orphanAtend] = await connection.execute(`
    SELECT COUNT(*) as count FROM atendimentos a 
    LEFT JOIN pacientes p ON a.paciente_id = p.id 
    WHERE p.id IS NULL AND a.deleted_at IS NULL
  `);
  console.log(`   - Atendimentos órfãos (sem paciente): ${(orphanAtend as any[])[0].count}`);
  
  // Agendamentos sem paciente (exceto bloqueios/reuniões)
  const [orphanAgend] = await connection.execute(`
    SELECT COUNT(*) as count FROM agendamentos a 
    LEFT JOIN pacientes p ON a.paciente_id = p.id 
    WHERE a.paciente_id IS NOT NULL AND p.id IS NULL
  `);
  console.log(`   - Agendamentos órfãos (sem paciente): ${(orphanAgend as any[])[0].count}`);
  
  // 4. Verificar dados sensíveis criptografados
  console.log("\n🔐 Verificação de criptografia:");
  const [encryptedCpf] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cpf LIKE 'enc:v1:%' THEN 1 ELSE 0 END) as criptografados,
      SUM(CASE WHEN cpf IS NULL OR cpf = '' THEN 1 ELSE 0 END) as vazios
    FROM pacientes WHERE deleted_at IS NULL
  `);
  const enc = (encryptedCpf as any[])[0];
  console.log(`   - CPFs criptografados: ${enc.criptografados}/${enc.total} (${Math.round(enc.criptografados/enc.total*100)}%)`);
  console.log(`   - CPFs vazios/nulos: ${enc.vazios}`);
  
  // 5. Verificar tenants
  console.log("\n🏢 Tenants:");
  const [tenantList] = await connection.execute(`
    SELECT id, nome, slug, status, plano FROM tenants ORDER BY id
  `);
  (tenantList as any[]).forEach(t => {
    console.log(`   - [${t.id}] ${t.nome} (${t.slug}) - ${t.status} - ${t.plano}`);
  });
  
  // 6. Verificar usuários
  console.log("\n👤 Usuários:");
  const [userList] = await connection.execute(`
    SELECT id, name, email, role, tenant_id FROM users ORDER BY id LIMIT 10
  `);
  (userList as any[]).forEach(u => {
    console.log(`   - [${u.id}] ${u.name || 'Sem nome'} (${u.email || 'Sem email'}) - ${u.role} - Tenant: ${u.tenant_id}`);
  });
  
  console.log("\n✅ Auditoria concluída!");
  
  await connection.end();
}

main().catch(console.error);
