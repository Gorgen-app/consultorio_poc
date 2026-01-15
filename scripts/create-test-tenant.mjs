/**
 * Script: Criar Tenant de Teste para Validação de Isolamento
 * 
 * Este script cria um segundo tenant no sistema para testar:
 * 1. Isolamento completo de dados entre clínicas
 * 2. Validação de que usuários de um tenant não veem dados de outro
 * 3. Funcionamento correto do middleware de tenant
 * 
 * Tenant de Teste:
 * - ID: 2 (auto-gerado)
 * - Nome: Clínica Teste Multi-tenant
 * - Slug: clinica-teste
 * - Plano: basic (para testar limites)
 */

import mysql from 'mysql2/promise';

async function createTestTenant() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🏢 Criando tenant de teste...\n');
  
  try {
    // Verificar se já existe um tenant de teste
    const [existing] = await connection.query(`
      SELECT id, nome, slug FROM tenants WHERE slug = 'clinica-teste'
    `);
    
    if (existing.length > 0) {
      console.log('⚠️  Tenant de teste já existe:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Nome: ${existing[0].nome}`);
      console.log(`   Slug: ${existing[0].slug}`);
      console.log('\n✅ Nenhuma ação necessária.');
      await connection.end();
      return existing[0];
    }
    
    // Criar o tenant de teste
    const [result] = await connection.query(`
      INSERT INTO tenants (
        nome,
        slug,
        cnpj,
        email,
        telefone,
        endereco,
        plano,
        status,
        max_usuarios,
        max_pacientes
      ) VALUES (
        'Clínica Teste Multi-tenant',
        'clinica-teste',
        '00.000.000/0001-00',
        'teste@clinica-teste.com.br',
        '(00) 0000-0000',
        'Endereço de Teste, 123 - Cidade Teste/UF',
        'basic',
        'ativo',
        3,
        50
      )
    `);
    
    const tenantId = result.insertId;
    
    console.log('✅ Tenant de teste criado com sucesso!');
    console.log(`   ID: ${tenantId}`);
    console.log('   Nome: Clínica Teste Multi-tenant');
    console.log('   Slug: clinica-teste');
    console.log('   Plano: basic');
    console.log('   Limites: 3 usuários, 50 pacientes');
    
    // Listar todos os tenants
    console.log('\n📋 Lista de tenants no sistema:');
    const [tenants] = await connection.query(`
      SELECT id, nome, slug, plano, status, max_usuarios, max_pacientes
      FROM tenants
      ORDER BY id
    `);
    
    console.log('┌────┬─────────────────────────────────┬─────────────────┬──────────────┬─────────┬──────────┬────────────┐');
    console.log('│ ID │ Nome                            │ Slug            │ Plano        │ Status  │ Usuários │ Pacientes  │');
    console.log('├────┼─────────────────────────────────┼─────────────────┼──────────────┼─────────┼──────────┼────────────┤');
    
    for (const tenant of tenants) {
      const nome = tenant.nome.substring(0, 31).padEnd(31);
      const slug = tenant.slug.substring(0, 15).padEnd(15);
      const plano = tenant.plano.padEnd(12);
      const status = tenant.status.padEnd(7);
      console.log(`│ ${String(tenant.id).padStart(2)} │ ${nome} │ ${slug} │ ${plano} │ ${status} │ ${String(tenant.max_usuarios).padStart(8)} │ ${String(tenant.max_pacientes).padStart(10)} │`);
    }
    
    console.log('└────┴─────────────────────────────────┴─────────────────┴──────────────┴─────────┴──────────┴────────────┘');
    
    await connection.end();
    return { id: tenantId, nome: 'Clínica Teste Multi-tenant', slug: 'clinica-teste' };
    
  } catch (error) {
    console.error('\n❌ Erro ao criar tenant:', error.message);
    await connection.end();
    throw error;
  }
}

createTestTenant().catch(err => {
  console.error(err);
  process.exit(1);
});
