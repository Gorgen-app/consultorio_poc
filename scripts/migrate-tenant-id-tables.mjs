/**
 * Script de Migração: Adicionar tenant_id nas tabelas historico_medidas e exames_favoritos
 * 
 * Este script:
 * 1. Verifica se as colunas tenant_id já existem
 * 2. Adiciona as colunas se não existirem
 * 3. Atualiza todos os registros existentes para tenant_id = 1
 * 4. Adiciona as foreign keys
 * 5. Cria índices compostos para performance
 * 
 * Conforme Pilar 1: Imutabilidade e Preservação Histórica
 * - Nenhum dado é apagado
 * - Todos os dados são migrados para o tenant padrão (Dr. André Gorgen)
 */

import mysql from 'mysql2/promise';

async function migrate() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🚀 Iniciando migração de tenant_id...\n');
  
  try {
    // ========================================
    // TABELA: historico_medidas
    // ========================================
    console.log('📋 Verificando tabela historico_medidas...');
    
    const [historicoColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'historico_medidas'
    `);
    
    const historicoHasTenant = historicoColumns.some(c => c.COLUMN_NAME === 'tenant_id');
    
    if (historicoHasTenant) {
      console.log('✅ historico_medidas já possui coluna tenant_id');
    } else {
      console.log('➕ Adicionando coluna tenant_id em historico_medidas...');
      
      // Adicionar coluna
      await connection.query(`
        ALTER TABLE historico_medidas 
        ADD COLUMN tenant_id INT NOT NULL DEFAULT 1 AFTER id
      `);
      console.log('   ✓ Coluna adicionada');
      
      // Atualizar registros existentes
      const [updateResult] = await connection.query(`
        UPDATE historico_medidas SET tenant_id = 1 WHERE tenant_id = 1
      `);
      console.log(`   ✓ ${updateResult.affectedRows} registros atualizados para tenant_id = 1`);
      
      // Adicionar foreign key
      await connection.query(`
        ALTER TABLE historico_medidas
        ADD CONSTRAINT fk_historico_medidas_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      `);
      console.log('   ✓ Foreign key adicionada');
      
      // Criar índice composto
      await connection.query(`
        CREATE INDEX idx_historico_medidas_tenant_paciente 
        ON historico_medidas(tenant_id, paciente_id)
      `);
      console.log('   ✓ Índice composto criado');
    }
    
    // ========================================
    // TABELA: exames_favoritos
    // ========================================
    console.log('\n📋 Verificando tabela exames_favoritos...');
    
    const [examesColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exames_favoritos'
    `);
    
    const examesHasTenant = examesColumns.some(c => c.COLUMN_NAME === 'tenant_id');
    
    if (examesHasTenant) {
      console.log('✅ exames_favoritos já possui coluna tenant_id');
    } else {
      console.log('➕ Adicionando coluna tenant_id em exames_favoritos...');
      
      // Adicionar coluna
      await connection.query(`
        ALTER TABLE exames_favoritos 
        ADD COLUMN tenant_id INT NOT NULL DEFAULT 1 AFTER id
      `);
      console.log('   ✓ Coluna adicionada');
      
      // Atualizar registros existentes
      const [updateResult] = await connection.query(`
        UPDATE exames_favoritos SET tenant_id = 1 WHERE tenant_id = 1
      `);
      console.log(`   ✓ ${updateResult.affectedRows} registros atualizados para tenant_id = 1`);
      
      // Adicionar foreign key
      await connection.query(`
        ALTER TABLE exames_favoritos
        ADD CONSTRAINT fk_exames_favoritos_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      `);
      console.log('   ✓ Foreign key adicionada');
      
      // Criar índice composto
      await connection.query(`
        CREATE INDEX idx_exames_favoritos_tenant_user 
        ON exames_favoritos(tenant_id, user_id)
      `);
      console.log('   ✓ Índice composto criado');
    }
    
    // ========================================
    // VALIDAÇÃO FINAL
    // ========================================
    console.log('\n📊 Validação final...');
    
    const [historicoCount] = await connection.query(`
      SELECT COUNT(*) as total, COUNT(DISTINCT tenant_id) as tenants
      FROM historico_medidas
    `);
    console.log(`   historico_medidas: ${historicoCount[0].total} registros, ${historicoCount[0].tenants} tenant(s)`);
    
    const [examesCount] = await connection.query(`
      SELECT COUNT(*) as total, COUNT(DISTINCT tenant_id) as tenants
      FROM exames_favoritos
    `);
    console.log(`   exames_favoritos: ${examesCount[0].total} registros, ${examesCount[0].tenants} tenant(s)`);
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
