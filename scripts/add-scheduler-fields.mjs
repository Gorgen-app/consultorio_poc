/**
 * Script de migração para adicionar campos de scheduler ao banco de dados
 * 
 * Este script adiciona campos necessários para o funcionamento do scheduler
 * de backup automático.
 * 
 * Uso: node scripts/add-scheduler-fields.mjs
 */

import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=".repeat(60));
  console.log("GORGEN - Migração de Campos do Scheduler de Backup");
  console.log("=".repeat(60));
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Erro: DATABASE_URL não configurada");
    process.exit(1);
  }
  
  const url = new URL(databaseUrl);
  
  const pool = createPool({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    console.log("\n1. Verificando tabela backup_config...");
    
    // Verificar se a tabela existe
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'backup_config'"
    );
    
    if (tables.length === 0) {
      console.log("   Tabela backup_config não existe. Criando...");
      
      await pool.query(`
        CREATE TABLE backup_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL UNIQUE,
          backup_enabled BOOLEAN DEFAULT TRUE,
          daily_backup_time VARCHAR(5) DEFAULT '03:00',
          weekly_backup_day INT DEFAULT 0,
          monthly_backup_day INT DEFAULT 1,
          daily_retention_days INT DEFAULT 30,
          weekly_retention_weeks INT DEFAULT 12,
          monthly_retention_months INT DEFAULT 12,
          notify_on_success BOOLEAN DEFAULT FALSE,
          notify_on_failure BOOLEAN DEFAULT TRUE,
          notification_email VARCHAR(255),
          offline_backup_enabled BOOLEAN DEFAULT TRUE,
          offline_backup_reminder_day INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
      `);
      
      console.log("   ✅ Tabela backup_config criada");
    } else {
      console.log("   ✅ Tabela backup_config já existe");
    }
    
    console.log("\n2. Verificando campos adicionais...");
    
    // Verificar e adicionar campo scheduler_enabled
    const [columns] = await pool.query(
      "SHOW COLUMNS FROM backup_config LIKE 'scheduler_enabled'"
    );
    
    if (columns.length === 0) {
      console.log("   Adicionando campo scheduler_enabled...");
      await pool.query(`
        ALTER TABLE backup_config 
        ADD COLUMN scheduler_enabled BOOLEAN DEFAULT TRUE
      `);
      console.log("   ✅ Campo scheduler_enabled adicionado");
    } else {
      console.log("   ✅ Campo scheduler_enabled já existe");
    }
    
    // Verificar e adicionar campo last_scheduled_backup
    const [lastBackupCol] = await pool.query(
      "SHOW COLUMNS FROM backup_config LIKE 'last_scheduled_backup'"
    );
    
    if (lastBackupCol.length === 0) {
      console.log("   Adicionando campo last_scheduled_backup...");
      await pool.query(`
        ALTER TABLE backup_config 
        ADD COLUMN last_scheduled_backup TIMESTAMP NULL
      `);
      console.log("   ✅ Campo last_scheduled_backup adicionado");
    } else {
      console.log("   ✅ Campo last_scheduled_backup já existe");
    }
    
    // Verificar e adicionar campo next_scheduled_backup
    const [nextBackupCol] = await pool.query(
      "SHOW COLUMNS FROM backup_config LIKE 'next_scheduled_backup'"
    );
    
    if (nextBackupCol.length === 0) {
      console.log("   Adicionando campo next_scheduled_backup...");
      await pool.query(`
        ALTER TABLE backup_config 
        ADD COLUMN next_scheduled_backup TIMESTAMP NULL
      `);
      console.log("   ✅ Campo next_scheduled_backup adicionado");
    } else {
      console.log("   ✅ Campo next_scheduled_backup já existe");
    }
    
    console.log("\n3. Verificando tabela backup_scheduler_log...");
    
    // Criar tabela de log do scheduler
    const [logTable] = await pool.query(
      "SHOW TABLES LIKE 'backup_scheduler_log'"
    );
    
    if (logTable.length === 0) {
      console.log("   Criando tabela backup_scheduler_log...");
      
      await pool.query(`
        CREATE TABLE backup_scheduler_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          task_name VARCHAR(50) NOT NULL,
          tenant_id INT,
          started_at TIMESTAMP NOT NULL,
          completed_at TIMESTAMP,
          status ENUM('running', 'success', 'failed') NOT NULL DEFAULT 'running',
          error_message TEXT,
          details JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_task_name (task_name),
          INDEX idx_tenant_id (tenant_id),
          INDEX idx_started_at (started_at),
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
      `);
      
      console.log("   ✅ Tabela backup_scheduler_log criada");
    } else {
      console.log("   ✅ Tabela backup_scheduler_log já existe");
    }
    
    console.log("\n4. Criando configuração padrão para tenants existentes...");
    
    // Buscar tenants sem configuração de backup
    const [tenantsWithoutConfig] = await pool.query(`
      SELECT t.id FROM tenants t
      LEFT JOIN backup_config bc ON t.id = bc.tenant_id
      WHERE bc.id IS NULL AND t.is_active = TRUE
    `);
    
    if (tenantsWithoutConfig.length > 0) {
      console.log(`   Criando configuração para ${tenantsWithoutConfig.length} tenant(s)...`);
      
      for (const tenant of tenantsWithoutConfig) {
        await pool.query(`
          INSERT INTO backup_config (tenant_id, backup_enabled, daily_backup_time)
          VALUES (?, TRUE, '03:00')
        `, [tenant.id]);
        
        console.log(`   ✅ Configuração criada para tenant ${tenant.id}`);
      }
    } else {
      console.log("   ✅ Todos os tenants já possuem configuração");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("Migração concluída com sucesso!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Erro durante a migração:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
