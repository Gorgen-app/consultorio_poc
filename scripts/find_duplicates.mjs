import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL || '';

function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: true }
  };
}

async function main() {
  console.log('Conectando ao banco de dados...');
  const config = parseDbUrl(DATABASE_URL);
  const conn = await mysql.createConnection(config);
  
  console.log('Buscando duplicatas por nome...\n');
  
  const [rows] = await conn.execute(`
    SELECT 
      LOWER(TRIM(nome)) as nome_norm,
      COUNT(*) as qtd,
      GROUP_CONCAT(CONCAT(id_paciente, ' (', COALESCE(DATE_FORMAT(data_nascimento, '%d/%m/%Y'), 'S/D'), ')') ORDER BY created_at SEPARATOR ' | ') as detalhes
    FROM pacientes 
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(nome))
    HAVING COUNT(*) > 1
    ORDER BY qtd DESC, nome_norm
    LIMIT 200
  `);
  
  console.log(`Total de grupos com nomes duplicados: ${rows.length}\n`);
  console.log('='.repeat(80));
  
  let totalPacientes = 0;
  for (const row of rows) {
    totalPacientes += row.qtd;
    console.log(`\nNome: ${row.nome_norm}`);
    console.log(`Quantidade: ${row.qtd}`);
    console.log(`Detalhes: ${row.detalhes}`);
    console.log('-'.repeat(80));
  }
  
  console.log(`\nTotal de pacientes envolvidos em duplicatas: ${totalPacientes}`);
  
  await conn.end();
}

main().catch(console.error);
