import { getDb } from './server/_core/db.ts';
import { sql } from 'drizzle-orm';

async function checkIndexes() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    return;
  }

  // Verificar índices das principais tabelas
  const tables = ['pacientes', 'atendimentos', 'evolucoes', 'agendamentos', 'users', 'user_profiles'];
  
  for (const table of tables) {
    console.log(`\n=== ÍNDICES DA TABELA ${table.toUpperCase()} ===`);
    try {
      const indexes = await db.execute(sql.raw(`SHOW INDEX FROM ${table}`));
      console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
      console.log(`Erro ao verificar tabela ${table}:`, e.message);
    }
  }
}

checkIndexes().catch(console.error);
