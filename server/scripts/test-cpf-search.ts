/**
 * GORGEN - Teste de Busca por CPF com Hash
 * 
 * Este script testa se a busca por CPF usando hash funciona corretamente
 * após a migração de criptografia.
 */

import { getPooledDb } from "../_core/database";
import { pacientes } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { hashingService } from "../services/HashingService";
import { encryptionService } from "../services/EncryptionService";

async function testCPFSearch() {
  console.log("=".repeat(60));
  console.log("TESTE DE BUSCA POR CPF COM HASH");
  console.log("=".repeat(60));
  console.log();

  const db = await getPooledDb();

  // 1. Buscar um paciente com CPF criptografado para usar como teste
  console.log("1. Buscando paciente com CPF criptografado...");
  
  const pacientesComCPF = await db.select({
    id: pacientes.id,
    nome: pacientes.nome,
    cpf: pacientes.cpf,
    cpfHash: pacientes.cpfHash,
    tenantId: pacientes.tenantId,
  })
  .from(pacientes)
  .where(sql`${pacientes.cpf} LIKE 'enc:v1:%' AND ${pacientes.cpfHash} IS NOT NULL`)
  .limit(5);

  if (pacientesComCPF.length === 0) {
    console.log("❌ Nenhum paciente com CPF criptografado encontrado!");
    process.exit(1);
  }

  console.log(`✅ Encontrados ${pacientesComCPF.length} pacientes com CPF criptografado`);
  console.log();

  // 2. Para cada paciente, descriptografar o CPF e testar a busca por hash
  let sucessos = 0;
  let falhas = 0;

  for (const paciente of pacientesComCPF) {
    console.log(`--- Testando paciente ID ${paciente.id}: ${paciente.nome} ---`);
    console.log(`   Tenant ID: ${paciente.tenantId}`);
    
    try {
      // Descriptografar CPF
      const cpfDescriptografado = encryptionService.decrypt(paciente.cpf || "");
      console.log(`   CPF descriptografado: ${cpfDescriptografado}`);
      
      // Gerar hash do CPF descriptografado usando o TENANT ID DO PACIENTE
      const hashGerado = hashingService.createHash(cpfDescriptografado, paciente.tenantId);
      console.log(`   Hash gerado: ${hashGerado.substring(0, 20)}...`);
      console.log(`   Hash armazenado: ${paciente.cpfHash?.substring(0, 20)}...`);
      
      // Comparar hashes
      if (hashGerado === paciente.cpfHash) {
        console.log(`   ✅ SUCESSO: Hashes correspondem!`);
        sucessos++;
      } else {
        console.log(`   ❌ FALHA: Hashes não correspondem!`);
        falhas++;
      }
      
      // Testar busca no banco usando o hash
      const resultadoBusca = await db.select({
        id: pacientes.id,
        nome: pacientes.nome,
      })
      .from(pacientes)
      .where(eq(pacientes.cpfHash, hashGerado))
      .limit(1);
      
      if (resultadoBusca.length > 0) {
        console.log(`   ✅ Busca por hash retornou: ${resultadoBusca[0].nome}`);
      } else {
        console.log(`   ❌ Busca por hash não retornou resultados`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error}`);
      falhas++;
    }
    
    console.log();
  }

  // 3. Resumo
  console.log("=".repeat(60));
  console.log("RESUMO DO TESTE");
  console.log("=".repeat(60));
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📊 Taxa de sucesso: ${((sucessos / (sucessos + falhas)) * 100).toFixed(1)}%`);
  
  process.exit(falhas > 0 ? 1 : 0);
}

testCPFSearch().catch(console.error);
