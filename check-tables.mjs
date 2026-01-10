import mysql from 'mysql2/promise';

async function checkTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== Verificando tabela historico_medidas ===');
  const [historicoColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'historico_medidas'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('Colunas:', historicoColumns.map(c => c.COLUMN_NAME).join(', '));
  
  const hasTenantHistorico = historicoColumns.some(c => c.COLUMN_NAME === 'tenant_id');
  console.log('Tem tenant_id:', hasTenantHistorico);
  
  console.log('\n=== Verificando tabela exames_favoritos ===');
  const [examesColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exames_favoritos'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('Colunas:', examesColumns.map(c => c.COLUMN_NAME).join(', '));
  
  const hasTenantExames = examesColumns.some(c => c.COLUMN_NAME === 'tenant_id');
  console.log('Tem tenant_id:', hasTenantExames);
  
  // Contar registros
  const [historicoCount] = await connection.query('SELECT COUNT(*) as count FROM historico_medidas');
  const [examesCount] = await connection.query('SELECT COUNT(*) as count FROM exames_favoritos');
  
  console.log('\n=== Contagem de registros ===');
  console.log('historico_medidas:', historicoCount[0].count);
  console.log('exames_favoritos:', examesCount[0].count);
  
  await connection.end();
}

checkTables().catch(console.error);
