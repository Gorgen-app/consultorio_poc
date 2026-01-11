/**
 * Script de migração para o sistema cross-tenant
 * Aplica as alterações no schema da tabela paciente_autorizacoes
 * e cria a nova tabela cross_tenant_access_logs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida');
  process.exit(1);
}

async function migrate() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });

  console.log('🔄 Iniciando migração cross-tenant...\n');

  try {
    // 1. Verificar se a tabela paciente_autorizacoes existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paciente_autorizacoes'
    `);

    if (tables.length === 0) {
      console.log('📝 Criando tabela paciente_autorizacoes...');
      await connection.query(`
        CREATE TABLE paciente_autorizacoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_origem_id INT NOT NULL,
          tenant_destino_id INT NOT NULL,
          paciente_id INT NOT NULL,
          criado_por_user_id INT NOT NULL,
          tipo_autorizacao ENUM('leitura', 'escrita', 'completo') DEFAULT 'leitura',
          escopo_autorizacao ENUM('prontuario', 'atendimentos', 'exames', 'documentos', 'completo') DEFAULT 'completo',
          data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_fim TIMESTAMP NULL,
          motivo TEXT,
          status ENUM('pendente', 'ativa', 'revogada', 'expirada', 'rejeitada') DEFAULT 'pendente',
          consentimento_lgpd BOOLEAN DEFAULT FALSE,
          data_consentimento TIMESTAMP NULL,
          ip_consentimento VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_origem_id) REFERENCES tenants(id),
          FOREIGN KEY (tenant_destino_id) REFERENCES tenants(id),
          INDEX idx_paciente_autorizacoes_paciente (paciente_id),
          INDEX idx_paciente_autorizacoes_origem (tenant_origem_id),
          INDEX idx_paciente_autorizacoes_destino (tenant_destino_id),
          INDEX idx_paciente_autorizacoes_status (status)
        )
      `);
      console.log('✅ Tabela paciente_autorizacoes criada');
    } else {
      console.log('📝 Atualizando tabela paciente_autorizacoes existente...');
      
      // Verificar colunas existentes
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paciente_autorizacoes'
      `);
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      
      // Adicionar novas colunas se não existirem
      const newColumns = [
        { name: 'tenant_origem_id', sql: 'ADD COLUMN tenant_origem_id INT NOT NULL DEFAULT 1 AFTER id' },
        { name: 'tenant_destino_id', sql: 'ADD COLUMN tenant_destino_id INT NOT NULL DEFAULT 1 AFTER tenant_origem_id' },
        { name: 'criado_por_user_id', sql: 'ADD COLUMN criado_por_user_id INT NOT NULL DEFAULT 1 AFTER paciente_id' },
        { name: 'tipo_autorizacao', sql: "ADD COLUMN tipo_autorizacao ENUM('leitura', 'escrita', 'completo') DEFAULT 'leitura'" },
        { name: 'escopo_autorizacao', sql: "ADD COLUMN escopo_autorizacao ENUM('prontuario', 'atendimentos', 'exames', 'documentos', 'completo') DEFAULT 'completo'" },
        { name: 'consentimento_lgpd', sql: 'ADD COLUMN consentimento_lgpd BOOLEAN DEFAULT FALSE' },
        { name: 'data_consentimento', sql: 'ADD COLUMN data_consentimento TIMESTAMP NULL' },
        { name: 'ip_consentimento', sql: 'ADD COLUMN ip_consentimento VARCHAR(45)' },
      ];
      
      for (const col of newColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            await connection.query(`ALTER TABLE paciente_autorizacoes ${col.sql}`);
            console.log(`  ✅ Coluna ${col.name} adicionada`);
          } catch (err) {
            if (!err.message.includes('Duplicate column')) {
              console.log(`  ⚠️ Erro ao adicionar ${col.name}: ${err.message}`);
            }
          }
        } else {
          console.log(`  ℹ️ Coluna ${col.name} já existe`);
        }
      }
      
      // Atualizar enum de status se necessário
      try {
        await connection.query(`
          ALTER TABLE paciente_autorizacoes 
          MODIFY COLUMN status ENUM('pendente', 'ativa', 'revogada', 'expirada', 'rejeitada') DEFAULT 'pendente'
        `);
        console.log('  ✅ Enum status atualizado');
      } catch (err) {
        console.log(`  ⚠️ Erro ao atualizar enum status: ${err.message}`);
      }
      
      // Remover colunas antigas se existirem
      const oldColumns = ['tenant_id', 'autorizado_por_user_id', 'autorizado_para_user_id', 'tipo_acesso'];
      for (const col of oldColumns) {
        if (existingColumns.includes(col)) {
          try {
            await connection.query(`ALTER TABLE paciente_autorizacoes DROP COLUMN ${col}`);
            console.log(`  ✅ Coluna antiga ${col} removida`);
          } catch (err) {
            console.log(`  ⚠️ Erro ao remover ${col}: ${err.message}`);
          }
        }
      }
    }

    // 2. Criar tabela cross_tenant_access_logs
    console.log('\n📝 Verificando tabela cross_tenant_access_logs...');
    const [logsTable] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cross_tenant_access_logs'
    `);

    if (logsTable.length === 0) {
      console.log('📝 Criando tabela cross_tenant_access_logs...');
      await connection.query(`
        CREATE TABLE cross_tenant_access_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          autorizacao_id INT NOT NULL,
          tenant_origem_id INT NOT NULL,
          tenant_destino_id INT NOT NULL,
          paciente_id INT NOT NULL,
          user_id INT NOT NULL,
          tipo_acao ENUM('visualizacao', 'download', 'impressao', 'criacao', 'edicao', 'exportacao') NOT NULL,
          recurso_tipo VARCHAR(50) NOT NULL,
          recurso_id INT,
          detalhes TEXT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (autorizacao_id) REFERENCES paciente_autorizacoes(id),
          FOREIGN KEY (tenant_origem_id) REFERENCES tenants(id),
          FOREIGN KEY (tenant_destino_id) REFERENCES tenants(id),
          INDEX idx_cross_tenant_logs_autorizacao (autorizacao_id),
          INDEX idx_cross_tenant_logs_paciente (paciente_id),
          INDEX idx_cross_tenant_logs_user (user_id),
          INDEX idx_cross_tenant_logs_created (created_at)
        )
      `);
      console.log('✅ Tabela cross_tenant_access_logs criada');
    } else {
      console.log('ℹ️ Tabela cross_tenant_access_logs já existe');
    }

    // 3. Adicionar índices se não existirem
    console.log('\n📝 Verificando índices...');
    try {
      await connection.query(`
        CREATE INDEX idx_paciente_autorizacoes_paciente 
        ON paciente_autorizacoes(paciente_id)
      `);
      console.log('  ✅ Índice idx_paciente_autorizacoes_paciente criado');
    } catch (err) {
      if (err.message.includes('Duplicate')) {
        console.log('  ℹ️ Índice idx_paciente_autorizacoes_paciente já existe');
      }
    }

    console.log('\n✅ Migração cross-tenant concluída com sucesso!');

    // 4. Mostrar estatísticas
    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM paciente_autorizacoes) as total_autorizacoes,
        (SELECT COUNT(*) FROM cross_tenant_access_logs) as total_logs
    `);
    console.log('\n📊 Estatísticas:');
    console.log(`   Autorizações: ${stats[0].total_autorizacoes}`);
    console.log(`   Logs de acesso: ${stats[0].total_logs}`);

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
