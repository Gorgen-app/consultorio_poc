import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  const result = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM pacientes WHERE deleted_at IS NULL) as pacientes_ativos,
      (SELECT COUNT(*) FROM pacientes) as pacientes_total,
      (SELECT COUNT(*) FROM atendimentos WHERE deleted_at IS NULL) as atendimentos_ativos,
      (SELECT COUNT(*) FROM atendimentos) as atendimentos_total
  `);
  
  console.log("=== ESTATÍSTICAS DO BANCO DE DADOS GORGEN ===");
  console.log(JSON.stringify(result[0], null, 2));
  
  await connection.end();
}

main().catch(console.error);
