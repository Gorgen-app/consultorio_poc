#!/usr/bin/env node

/**
 * GORGEN - Script de Verificação do Sistema de Backup
 * 
 * Este script verifica se todos os componentes do sistema de backup
 * estão configurados corretamente e funcionando.
 * 
 * Uso: node scripts/check-backup-system.mjs
 */

import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const CHECKS = {
  passed: [],
  warnings: [],
  failed: [],
};

function logCheck(status, message) {
  const icon = status === "pass" ? "✅" : status === "warn" ? "⚠️" : "❌";
  console.log(`${icon} ${message}`);
  
  if (status === "pass") CHECKS.passed.push(message);
  else if (status === "warn") CHECKS.warnings.push(message);
  else CHECKS.failed.push(message);
}

async function checkEnvironmentVariables() {
  console.log("\n📋 Verificando variáveis de ambiente...\n");
  
  // DATABASE_URL
  if (process.env.DATABASE_URL) {
    logCheck("pass", "DATABASE_URL está configurada");
  } else {
    logCheck("fail", "DATABASE_URL não está configurada");
  }
  
  // JWT_SECRET
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET === "gorgen-default-secret-change-me") {
      logCheck("warn", "JWT_SECRET está usando valor padrão - ALTERE EM PRODUÇÃO!");
    } else if (process.env.JWT_SECRET.length < 32) {
      logCheck("warn", "JWT_SECRET é muito curta (recomendado: 32+ caracteres)");
    } else {
      logCheck("pass", "JWT_SECRET está configurada corretamente");
    }
  } else {
    logCheck("fail", "JWT_SECRET não está configurada");
  }
  
  // AWS/S3
  if (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID) {
    logCheck("pass", "Credenciais AWS/S3 estão configuradas");
  } else {
    logCheck("warn", "Credenciais AWS/S3 não encontradas - backup para S3 pode falhar");
  }
  
  // Scheduler
  if (process.env.BACKUP_SCHEDULER_ENABLED === "false") {
    logCheck("warn", "Scheduler de backup está DESABILITADO");
  } else {
    logCheck("pass", "Scheduler de backup está habilitado");
  }
}

async function checkDatabaseTables() {
  console.log("\n📋 Verificando tabelas do banco de dados...\n");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logCheck("fail", "Não foi possível verificar banco - DATABASE_URL não configurada");
    return;
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
    // Verificar tabela backup_history
    const [backupHistory] = await pool.query("SHOW TABLES LIKE 'backup_history'");
    if (backupHistory.length > 0) {
      logCheck("pass", "Tabela backup_history existe");
      
      // Verificar campos importantes
      const [columns] = await pool.query("SHOW COLUMNS FROM backup_history");
      const columnNames = columns.map(c => c.Field);
      
      if (columnNames.includes("is_encrypted")) {
        logCheck("pass", "Campo is_encrypted existe em backup_history");
      } else {
        logCheck("warn", "Campo is_encrypted não existe - backups antigos podem não ter flag de criptografia");
      }
      
      if (columnNames.includes("triggered_by")) {
        logCheck("pass", "Campo triggered_by existe em backup_history");
      } else {
        logCheck("warn", "Campo triggered_by não existe - não será possível distinguir backups automáticos de manuais");
      }
    } else {
      logCheck("fail", "Tabela backup_history NÃO existe");
    }
    
    // Verificar tabela backup_config
    const [backupConfig] = await pool.query("SHOW TABLES LIKE 'backup_config'");
    if (backupConfig.length > 0) {
      logCheck("pass", "Tabela backup_config existe");
      
      // Verificar se há configurações
      const [configs] = await pool.query("SELECT COUNT(*) as count FROM backup_config");
      if (configs[0].count > 0) {
        logCheck("pass", `${configs[0].count} configuração(ões) de backup encontrada(s)`);
      } else {
        logCheck("warn", "Nenhuma configuração de backup encontrada - usando valores padrão");
      }
    } else {
      logCheck("warn", "Tabela backup_config NÃO existe - usando valores padrão");
    }
    
    // Verificar backups recentes
    const [recentBackups] = await pool.query(`
      SELECT COUNT(*) as count, MAX(completed_at) as last_backup
      FROM backup_history 
      WHERE status = 'success' 
      AND completed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    if (recentBackups[0].count > 0) {
      logCheck("pass", `${recentBackups[0].count} backup(s) bem-sucedido(s) nos últimos 7 dias`);
      logCheck("pass", `Último backup: ${recentBackups[0].last_backup}`);
    } else {
      logCheck("warn", "Nenhum backup bem-sucedido nos últimos 7 dias");
    }
    
  } catch (error) {
    logCheck("fail", `Erro ao verificar banco de dados: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function checkFiles() {
  console.log("\n📋 Verificando arquivos do sistema...\n");
  
  const requiredFiles = [
    { path: "server/backup.ts", name: "Módulo de backup" },
    { path: "server/backup-scheduler.ts", name: "Módulo de agendamento" },
    { path: "server/_core/backup-init.ts", name: "Inicialização do backup" },
    { path: "client/src/pages/BackupSettings.tsx", name: "Interface de configuração" },
  ];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file.path);
    if (fs.existsSync(fullPath)) {
      logCheck("pass", `${file.name} (${file.path})`);
    } else {
      logCheck("fail", `${file.name} NÃO encontrado (${file.path})`);
    }
  }
}

async function checkDependencies() {
  console.log("\n📋 Verificando dependências...\n");
  
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    { name: "node-cron", reason: "Agendamento de tarefas" },
    { name: "@aws-sdk/client-s3", reason: "Upload para S3" },
    { name: "zlib", reason: "Compressão de backups", builtin: true },
    { name: "crypto", reason: "Criptografia de backups", builtin: true },
  ];
  
  for (const dep of requiredDeps) {
    if (dep.builtin) {
      logCheck("pass", `${dep.name} (builtin) - ${dep.reason}`);
    } else if (allDeps[dep.name]) {
      logCheck("pass", `${dep.name}@${allDeps[dep.name]} - ${dep.reason}`);
    } else {
      logCheck("fail", `${dep.name} NÃO instalado - ${dep.reason}`);
    }
  }
}

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("RESUMO DA VERIFICAÇÃO");
  console.log("=".repeat(60));
  
  console.log(`\n✅ Verificações aprovadas: ${CHECKS.passed.length}`);
  console.log(`⚠️  Avisos: ${CHECKS.warnings.length}`);
  console.log(`❌ Falhas: ${CHECKS.failed.length}`);
  
  if (CHECKS.warnings.length > 0) {
    console.log("\n⚠️  AVISOS:");
    CHECKS.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  if (CHECKS.failed.length > 0) {
    console.log("\n❌ FALHAS:");
    CHECKS.failed.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log("\n" + "=".repeat(60));
  
  if (CHECKS.failed.length === 0 && CHECKS.warnings.length === 0) {
    console.log("🎉 Sistema de backup está 100% configurado!");
  } else if (CHECKS.failed.length === 0) {
    console.log("✅ Sistema de backup está funcional, mas há avisos a serem verificados.");
  } else {
    console.log("❌ Sistema de backup tem problemas que precisam ser corrigidos.");
  }
  
  console.log("=".repeat(60) + "\n");
}

async function main() {
  console.log("=".repeat(60));
  console.log("GORGEN - Verificação do Sistema de Backup");
  console.log("Data: " + new Date().toLocaleString("pt-BR"));
  console.log("=".repeat(60));
  
  await checkEnvironmentVariables();
  await checkDatabaseTables();
  await checkFiles();
  await checkDependencies();
  
  printSummary();
}

main().catch(console.error);
