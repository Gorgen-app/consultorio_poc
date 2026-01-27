/**
 * GORGEN - Teste de Performance da Descriptografia
 * 
 * Este script mede o impacto da descriptografia no tempo de resposta
 * das operações de listagem e busca de pacientes.
 */

import { getPooledDb } from "../_core/database";
import { pacientes } from "../../drizzle/schema";
import { eq, sql, like, and, isNull } from "drizzle-orm";
import { encryptionService } from "../services/EncryptionService";

// ==========================================
// FUNÇÕES DE MEDIÇÃO
// ==========================================

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function measureTime<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const timeMs = end - start;
  console.log(`   ⏱️  ${name}: ${formatMs(timeMs)}`);
  return { result, timeMs };
}

// ==========================================
// TESTES
// ==========================================

async function testPerformance() {
  console.log("=".repeat(60));
  console.log("TESTE DE PERFORMANCE - DESCRIPTOGRAFIA");
  console.log("=".repeat(60));
  console.log();

  const db = await getPooledDb();

  // Teste 1: Listagem de pacientes (sem descriptografia)
  console.log("📊 TESTE 1: Listagem de 100 pacientes (SEM descriptografia)");
  const { result: pacientesSemDecrypt, timeMs: tempoSemDecrypt } = await measureTime(
    "Query + Fetch",
    async () => {
      return await db.select({
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        email: pacientes.email,
        telefone: pacientes.telefone,
      })
      .from(pacientes)
      .where(isNull(pacientes.deletedAt))
      .limit(100);
    }
  );
  console.log(`   📋 Registros retornados: ${pacientesSemDecrypt.length}`);
  console.log();

  // Teste 2: Listagem de pacientes (com descriptografia)
  console.log("📊 TESTE 2: Listagem de 100 pacientes (COM descriptografia)");
  const { result: pacientesComDecrypt, timeMs: tempoComDecrypt } = await measureTime(
    "Query + Fetch + Decrypt",
    async () => {
      const raw = await db.select({
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        email: pacientes.email,
        telefone: pacientes.telefone,
      })
      .from(pacientes)
      .where(isNull(pacientes.deletedAt))
      .limit(100);

      // Descriptografar cada paciente
      return raw.map(p => ({
        ...p,
        cpf: p.cpf ? encryptionService.decrypt(p.cpf) : null,
        email: p.email ? encryptionService.decrypt(p.email) : null,
        telefone: p.telefone ? encryptionService.decrypt(p.telefone) : null,
      }));
    }
  );
  console.log(`   📋 Registros retornados: ${pacientesComDecrypt.length}`);
  console.log();

  // Teste 3: Listagem de 500 pacientes (com descriptografia)
  console.log("📊 TESTE 3: Listagem de 500 pacientes (COM descriptografia)");
  const { result: pacientes500, timeMs: tempo500 } = await measureTime(
    "Query + Fetch + Decrypt",
    async () => {
      const raw = await db.select({
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        email: pacientes.email,
        telefone: pacientes.telefone,
      })
      .from(pacientes)
      .where(isNull(pacientes.deletedAt))
      .limit(500);

      return raw.map(p => ({
        ...p,
        cpf: p.cpf ? encryptionService.decrypt(p.cpf) : null,
        email: p.email ? encryptionService.decrypt(p.email) : null,
        telefone: p.telefone ? encryptionService.decrypt(p.telefone) : null,
      }));
    }
  );
  console.log(`   📋 Registros retornados: ${pacientes500.length}`);
  console.log();

  // Teste 4: Busca por nome (com descriptografia)
  console.log("📊 TESTE 4: Busca por nome 'MARIA' (COM descriptografia)");
  const { result: pacientesMaria, timeMs: tempoMaria } = await measureTime(
    "Query + Fetch + Decrypt",
    async () => {
      const raw = await db.select({
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        email: pacientes.email,
        telefone: pacientes.telefone,
      })
      .from(pacientes)
      .where(and(
        isNull(pacientes.deletedAt),
        like(pacientes.nome, '%MARIA%')
      ))
      .limit(50);

      return raw.map(p => ({
        ...p,
        cpf: p.cpf ? encryptionService.decrypt(p.cpf) : null,
        email: p.email ? encryptionService.decrypt(p.email) : null,
        telefone: p.telefone ? encryptionService.decrypt(p.telefone) : null,
      }));
    }
  );
  console.log(`   📋 Registros retornados: ${pacientesMaria.length}`);
  console.log();

  // Teste 5: Descriptografia individual (benchmark)
  console.log("📊 TESTE 5: Benchmark de descriptografia individual");
  const sampleEncrypted = pacientesSemDecrypt.find(p => p.cpf?.startsWith('enc:v1:'));
  if (sampleEncrypted?.cpf) {
    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      encryptionService.decrypt(sampleEncrypted.cpf!);
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`   ⏱️  ${iterations} descriptografias: ${formatMs(end - start)}`);
    console.log(`   ⏱️  Média por operação: ${formatMs(avgTime)}`);
  } else {
    console.log("   ⚠️  Nenhum dado criptografado encontrado para benchmark");
  }
  console.log();

  // Resumo
  console.log("=".repeat(60));
  console.log("RESUMO DE PERFORMANCE");
  console.log("=".repeat(60));
  console.log();
  console.log(`📊 100 pacientes SEM descriptografia: ${formatMs(tempoSemDecrypt)}`);
  console.log(`📊 100 pacientes COM descriptografia: ${formatMs(tempoComDecrypt)}`);
  console.log(`📊 Overhead da descriptografia (100): ${formatMs(tempoComDecrypt - tempoSemDecrypt)} (+${((tempoComDecrypt / tempoSemDecrypt - 1) * 100).toFixed(1)}%)`);
  console.log();
  console.log(`📊 500 pacientes COM descriptografia: ${formatMs(tempo500)}`);
  console.log(`📊 Busca por nome COM descriptografia: ${formatMs(tempoMaria)}`);
  console.log();

  // Avaliação
  const overheadPercent = ((tempoComDecrypt / tempoSemDecrypt - 1) * 100);
  if (overheadPercent < 50) {
    console.log("✅ RESULTADO: Overhead aceitável (< 50%)");
  } else if (overheadPercent < 100) {
    console.log("⚠️  RESULTADO: Overhead moderado (50-100%)");
  } else {
    console.log("❌ RESULTADO: Overhead alto (> 100%) - considere otimizações");
  }

  process.exit(0);
}

testPerformance().catch(console.error);
