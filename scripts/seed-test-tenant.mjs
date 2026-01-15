/**
 * Script: Seed de Dados para Tenant de Teste (ID: 30002)
 * 
 * Este script cria:
 * 1. Usuário de teste vinculado ao tenant 30002
 * 2. Perfil de usuário com permissões
 * 3. Pacientes de teste
 * 4. Atendimentos de teste
 * 
 * Objetivo: Validar isolamento de dados entre tenants
 */

import mysql from 'mysql2/promise';

const TENANT_TESTE_ID = 30002;

async function seedTestTenant() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🌱 Iniciando seed de dados para tenant de teste...\n');
  
  try {
    // ========================================
    // 1. CRIAR USUÁRIO DE TESTE
    // ========================================
    console.log('👤 Criando usuário de teste...');
    
    // Verificar se já existe
    const [existingUser] = await connection.query(`
      SELECT id FROM users WHERE openId = 'test-user-tenant-30002'
    `);
    
    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`   ⚠️  Usuário já existe (ID: ${userId})`);
    } else {
      const [userResult] = await connection.query(`
        INSERT INTO users (tenant_id, openId, name, email, role)
        VALUES (?, 'test-user-tenant-30002', 'Dr. Teste Multi-tenant', 'teste@clinica-teste.com.br', 'admin')
      `, [TENANT_TESTE_ID]);
      userId = userResult.insertId;
      console.log(`   ✅ Usuário criado (ID: ${userId})`);
    }
    
    // ========================================
    // 2. CRIAR PERFIL DE USUÁRIO
    // ========================================
    console.log('\n📋 Criando perfil de usuário...');
    
    const [existingProfile] = await connection.query(`
      SELECT id FROM user_profiles WHERE user_id = ?
    `, [userId]);
    
    let profileId;
    if (existingProfile.length > 0) {
      profileId = existingProfile[0].id;
      console.log(`   ⚠️  Perfil já existe (ID: ${profileId})`);
    } else {
      const [profileResult] = await connection.query(`
        INSERT INTO user_profiles (
          tenant_id, user_id, nome_completo, crm, especialidade,
          perfil_ativo, is_admin_master, is_medico, is_secretaria, is_auditor, is_paciente
        ) VALUES (
          ?, ?, 'Dr. Teste Multi-tenant', 'CRM-TESTE/00', 'Clínica Geral',
          'medico', true, true, false, false, false
        )
      `, [TENANT_TESTE_ID, userId]);
      profileId = profileResult.insertId;
      console.log(`   ✅ Perfil criado (ID: ${profileId})`);
    }
    
    // ========================================
    // 3. CRIAR PACIENTES DE TESTE
    // ========================================
    console.log('\n🏥 Criando pacientes de teste...');
    
    const pacientesTeste = [
      {
        idPaciente: 'TESTE-2026-0001',
        nome: 'Maria Silva Teste',
        dataNascimento: '1985-03-15',
        sexo: 'F',
        cpf: '111.111.111-11',
        telefone: '(00) 99999-0001',
        email: 'maria.teste@email.com',
        operadora1: 'UNIMED TESTE',
      },
      {
        idPaciente: 'TESTE-2026-0002',
        nome: 'João Santos Teste',
        dataNascimento: '1978-07-22',
        sexo: 'M',
        cpf: '222.222.222-22',
        telefone: '(00) 99999-0002',
        email: 'joao.teste@email.com',
        operadora1: 'BRADESCO TESTE',
      },
      {
        idPaciente: 'TESTE-2026-0003',
        nome: 'Ana Oliveira Teste',
        dataNascimento: '1992-11-08',
        sexo: 'F',
        cpf: '333.333.333-33',
        telefone: '(00) 99999-0003',
        email: 'ana.teste@email.com',
        operadora1: 'PARTICULAR',
      },
    ];
    
    const pacienteIds = [];
    for (const paciente of pacientesTeste) {
      // Verificar se já existe
      const [existing] = await connection.query(`
        SELECT id FROM pacientes WHERE id_paciente = ? AND tenant_id = ?
      `, [paciente.idPaciente, TENANT_TESTE_ID]);
      
      if (existing.length > 0) {
        pacienteIds.push(existing[0].id);
        console.log(`   ⚠️  Paciente ${paciente.nome} já existe (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.query(`
          INSERT INTO pacientes (
            tenant_id, id_paciente, nome, data_nascimento, sexo,
            cpf, telefone, email, operadora_1, status_caso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')
        `, [
          TENANT_TESTE_ID,
          paciente.idPaciente,
          paciente.nome,
          paciente.dataNascimento,
          paciente.sexo,
          paciente.cpf,
          paciente.telefone,
          paciente.email,
          paciente.operadora1,
        ]);
        pacienteIds.push(result.insertId);
        console.log(`   ✅ Paciente ${paciente.nome} criado (ID: ${result.insertId})`);
      }
    }
    
    // ========================================
    // 4. CRIAR ATENDIMENTOS DE TESTE
    // ========================================
    console.log('\n📅 Criando atendimentos de teste...');
    
    const atendimentosTeste = [
      {
        pacienteIdx: 0,
        atendimento: 'TESTE001',
        tipo: 'Consulta',
        data: '2026-01-05 10:00:00',
        convenio: 'UNIMED TESTE',
        valor: 250.00,
      },
      {
        pacienteIdx: 1,
        atendimento: 'TESTE002',
        tipo: 'Retorno',
        data: '2026-01-08 14:30:00',
        convenio: 'BRADESCO TESTE',
        valor: 150.00,
      },
      {
        pacienteIdx: 2,
        atendimento: 'TESTE003',
        tipo: 'Consulta',
        data: '2026-01-10 09:00:00',
        convenio: 'PARTICULAR',
        valor: 400.00,
      },
    ];
    
    for (const atendimento of atendimentosTeste) {
      const pacienteId = pacienteIds[atendimento.pacienteIdx];
      
      // Verificar se já existe
      const [existing] = await connection.query(`
        SELECT id FROM atendimentos WHERE atendimento = ? AND tenant_id = ?
      `, [atendimento.atendimento, TENANT_TESTE_ID]);
      
      if (existing.length > 0) {
        console.log(`   ⚠️  Atendimento ${atendimento.atendimento} já existe (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.query(`
          INSERT INTO atendimentos (
            tenant_id, paciente_id, atendimento, tipo_atendimento,
            data_atendimento, convenio, faturamento_previsto
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          TENANT_TESTE_ID,
          pacienteId,
          atendimento.atendimento,
          atendimento.tipo,
          atendimento.data,
          atendimento.convenio,
          atendimento.valor,
        ]);
        console.log(`   ✅ Atendimento ${atendimento.atendimento} criado (ID: ${result.insertId})`);
      }
    }
    
    // ========================================
    // 5. VALIDAÇÃO FINAL
    // ========================================
    console.log('\n📊 Validação de isolamento...');
    
    // Contar dados por tenant
    const [pacientesGorgen] = await connection.query(`
      SELECT COUNT(*) as count FROM pacientes WHERE tenant_id = 1
    `);
    const [pacientesTesteCount] = await connection.query(`
      SELECT COUNT(*) as count FROM pacientes WHERE tenant_id = ?
    `, [TENANT_TESTE_ID]);
    
    const [atendimentosGorgen] = await connection.query(`
      SELECT COUNT(*) as count FROM atendimentos WHERE tenant_id = 1
    `);
    const [atendimentosTeste2] = await connection.query(`
      SELECT COUNT(*) as count FROM atendimentos WHERE tenant_id = ?
    `, [TENANT_TESTE_ID]);
    
    console.log('\n┌─────────────────────────────────┬────────────┬──────────────┐');
    console.log('│ Tenant                          │ Pacientes  │ Atendimentos │');
    console.log('├─────────────────────────────────┼────────────┼──────────────┤');
    console.log(`│ Dr. André Gorgen (ID: 1)        │ ${String(pacientesGorgen[0].count).padStart(10)} │ ${String(atendimentosGorgen[0].count).padStart(12)} │`);
    console.log(`│ Clínica Teste (ID: ${TENANT_TESTE_ID})      │ ${String(pacientesTesteCount[0].count).padStart(10)} │ ${String(atendimentosTeste2[0].count).padStart(12)} │`);
    console.log('└─────────────────────────────────┴────────────┴──────────────┘');
    
    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📝 Credenciais do usuário de teste:');
    console.log('   OpenID: test-user-tenant-30002');
    console.log('   Nome: Dr. Teste Multi-tenant');
    console.log('   Email: teste@clinica-teste.com.br');
    console.log('   Tenant: Clínica Teste (ID: 30002)');
    
  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seedTestTenant().catch(err => {
  console.error(err);
  process.exit(1);
});
