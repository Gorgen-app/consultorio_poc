import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function countPatients() {
  const result = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM pacientes WHERE deleted_at IS NULL) as pacientes_ativos,
      (SELECT COUNT(*) FROM pacientes) as pacientes_total,
      (SELECT COUNT(*) FROM atendimentos WHERE deleted_at IS NULL) as atendimentos_ativos,
      (SELECT COUNT(*) FROM atendimentos) as atendimentos_total
  `);
  
  console.log('=== ESTATÍSTICAS DO BANCO DE DADOS GORGEN ===');
  console.log(result[0]);
}

countPatients().catch(console.error);
