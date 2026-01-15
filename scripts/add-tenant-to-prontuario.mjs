#!/usr/bin/env node
/**
 * Script para adicionar tenant_id em todas as tabelas de prontuário
 * Sprint 3 - Fase 1 Multi-tenant
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

// Tabelas de prontuário que precisam de tenant_id
const TABELAS_PRONTUARIO = [
  'resumo_clinico',
  'problemas_ativos',
  'alergias',
  'medicamentos_uso',
  'evolucoes',
  'internacoes',
  'cirurgias',
  'exames_laboratoriais',
  'exames_imagem',
  'endoscopias',
  'cardiologia',
  'terapias',
  'obstetricia',
  'documentos_medicos',
  'historico_medidas',
  'patologias',
  'exames_padronizados',
  'resultados_laboratoriais',
];

async function main() {
  console.log('🔧 Iniciando adição de tenant_id nas tabelas de prontuário...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    for (const tabela of TABELAS_PRONTUARIO) {
      console.log(`📋 Processando tabela: ${tabela}`);
      
      // Verificar se a coluna já existe
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'tenant_id'`,
        [tabela]
      );
      
      if (columns.length > 0) {
        console.log(`   ⏭️  Coluna tenant_id já existe em ${tabela}`);
        continue;
      }
      
      // Adicionar coluna tenant_id
      try {
        await connection.query(`
          ALTER TABLE \`${tabela}\` 
          ADD COLUMN \`tenant_id\` INT NOT NULL DEFAULT 1 AFTER \`id\`
        `);
        console.log(`   ✅ Coluna tenant_id adicionada em ${tabela}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⏭️  Coluna já existe em ${tabela}`);
        } else {
          console.error(`   ❌ Erro ao adicionar coluna em ${tabela}:`, err.message);
        }
      }
      
      // Criar índice composto (tenant_id, paciente_id) se a tabela tiver paciente_id
      try {
        const [pacienteCol] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'paciente_id'`,
          [tabela]
        );
        
        if (pacienteCol.length > 0) {
          // Verificar se índice já existe
          const [indexes] = await connection.query(
            `SHOW INDEX FROM \`${tabela}\` WHERE Key_name = 'idx_tenant_paciente'`
          );
          
          if (indexes.length === 0) {
            await connection.query(`
              CREATE INDEX \`idx_tenant_paciente\` ON \`${tabela}\` (\`tenant_id\`, \`paciente_id\`)
            `);
            console.log(`   ✅ Índice idx_tenant_paciente criado em ${tabela}`);
          } else {
            console.log(`   ⏭️  Índice já existe em ${tabela}`);
          }
        }
      } catch (err) {
        console.error(`   ⚠️  Erro ao criar índice em ${tabela}:`, err.message);
      }
      
      // Atualizar registros existentes para tenant_id = 1
      try {
        const [result] = await connection.query(`
          UPDATE \`${tabela}\` SET \`tenant_id\` = 1 WHERE \`tenant_id\` = 1
        `);
        console.log(`   ✅ ${result.affectedRows || 0} registros atualizados para tenant 1`);
      } catch (err) {
        console.error(`   ⚠️  Erro ao atualizar registros em ${tabela}:`, err.message);
      }
      
      console.log('');
    }
    
    console.log('\n✅ Processo concluído com sucesso!');
    console.log(`📊 ${TABELAS_PRONTUARIO.length} tabelas processadas`);
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
