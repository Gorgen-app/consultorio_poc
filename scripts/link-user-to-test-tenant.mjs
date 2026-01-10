/**
 * Script para vincular o usuário real (Dr. André Gorgen) ao tenant de teste
 * Isso permite testar a funcionalidade de troca de tenant na prática
 */

import mysql from 'mysql2/promise';

const TENANT_GORGEN_ID = 1;
const TENANT_TESTE_ID = 30002;

async function linkUserToTestTenant() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔗 Vinculando usuário real ao tenant de teste...\n');
    
    // 1. Buscar o usuário principal (Dr. André Gorgen)
    const [users] = await connection.query(`
      SELECT id, openId, name, email, tenant_id 
      FROM users 
      WHERE tenant_id = ? 
      ORDER BY id ASC 
      LIMIT 1
    `, [TENANT_GORGEN_ID]);
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no tenant principal');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Tenant atual: ${user.tenant_id}`);
    
    // 2. Verificar se já existe um vínculo
    const [existingVinculo] = await connection.query(`
      SELECT id FROM vinculo_secretaria_medico 
      WHERE secretaria_user_id = ? AND tenant_id = ?
    `, [String(user.id), TENANT_TESTE_ID]);
    
    if (existingVinculo.length > 0) {
      console.log(`\n⚠️  Vínculo já existe (ID: ${existingVinculo[0].id})`);
    } else {
      // 3. Criar vínculo como "médico convidado" no tenant de teste
      // Usamos o mesmo user_id como secretaria e medico para simplificar
      const dataInicio = new Date();
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1); // Válido por 1 ano
      
      const [result] = await connection.query(`
        INSERT INTO vinculo_secretaria_medico (
          tenant_id, secretaria_user_id, medico_user_id, 
          data_inicio, data_validade, status
        ) VALUES (?, ?, ?, ?, ?, 'ativo')
      `, [
        TENANT_TESTE_ID,
        String(user.id),
        String(user.id), // Mesmo usuário como médico
        dataInicio,
        dataValidade
      ]);
      
      console.log(`\n✅ Vínculo criado (ID: ${result.insertId})`);
      console.log(`   Tenant: ${TENANT_TESTE_ID} (Clínica Teste)`);
      console.log(`   Validade: ${dataValidade.toLocaleDateString('pt-BR')}`);
    }
    
    // 4. Verificar tenants disponíveis para o usuário
    console.log('\n📋 Verificando tenants disponíveis para o usuário...');
    
    // Tenant principal
    const [primaryTenant] = await connection.query(`
      SELECT id, nome, slug FROM tenants WHERE id = ?
    `, [user.tenant_id]);
    
    // Tenants via vínculos
    const [linkedTenants] = await connection.query(`
      SELECT DISTINCT t.id, t.nome, t.slug
      FROM tenants t
      INNER JOIN vinculo_secretaria_medico v ON v.tenant_id = t.id
      WHERE v.secretaria_user_id = ? AND v.status = 'ativo'
    `, [String(user.id)]);
    
    console.log('\n┌─────────────────────────────────┬────────┬──────────────┐');
    console.log('│ Tenant                          │ ID     │ Tipo         │');
    console.log('├─────────────────────────────────┼────────┼──────────────┤');
    
    if (primaryTenant.length > 0) {
      const t = primaryTenant[0];
      console.log(`│ ${t.nome.padEnd(31)} │ ${String(t.id).padEnd(6)} │ Principal    │`);
    }
    
    for (const t of linkedTenants) {
      console.log(`│ ${t.nome.padEnd(31)} │ ${String(t.id).padEnd(6)} │ Vínculo      │`);
    }
    
    console.log('└─────────────────────────────────┴────────┴──────────────┘');
    
    const totalTenants = 1 + linkedTenants.length;
    console.log(`\n✅ Total de tenants disponíveis: ${totalTenants}`);
    
    if (totalTenants > 1) {
      console.log('✅ O seletor de tenant será exibido na interface!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

linkUserToTestTenant().catch(console.error);
