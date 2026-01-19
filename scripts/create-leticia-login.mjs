import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Conexão com o banco
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Buscar Dra. Letícia Uzeika
  const [users] = await connection.execute(`
    SELECT u.id, u.openId, u.name, u.email, up.id as profile_id, up.nome_completo, up.perfil_ativo, up.is_medico, up.crm, up.especialidade 
    FROM users u 
    LEFT JOIN user_profiles up ON u.id = up.user_id 
    WHERE u.name LIKE '%leticia%' OR u.name LIKE '%Leticia%' OR u.name LIKE '%Letícia%' 
       OR up.nome_completo LIKE '%leticia%' OR up.nome_completo LIKE '%Leticia%' OR up.nome_completo LIKE '%Letícia%'
       OR u.name LIKE '%uzeika%' OR u.name LIKE '%Uzeika%'
       OR up.nome_completo LIKE '%uzeika%' OR up.nome_completo LIKE '%Uzeika%'
  `);

  console.log('Usuários encontrados:', JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log('Nenhum usuário encontrado com o nome Letícia Uzeika');
    process.exit(1);
  }

  const user = users[0];
  console.log(`\nUsuário encontrado: ID=${user.id}, Nome=${user.name || user.nome_completo}, Email=${user.email}`);

  // Verificar se já tem credenciais
  const [existingCreds] = await connection.execute(
    'SELECT id, username FROM user_credentials WHERE user_id = ?',
    [user.id]
  );

  if (existingCreds.length > 0) {
    console.log(`\nUsuário já tem credenciais: username=${existingCreds[0].username}`);
  }

  // Gerar username e senha
  const username = 'leticia.uzeika';
  const tempPassword = 'Leticia@Med2026!';
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Verificar se username já existe
  const [existingUsername] = await connection.execute(
    'SELECT id FROM user_credentials WHERE username = ?',
    [username]
  );

  if (existingUsername.length > 0) {
    console.log(`\nUsername ${username} já existe. Atualizando senha...`);
    await connection.execute(
      'UPDATE user_credentials SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE username = ?',
      [passwordHash, username]
    );
  } else {
    // Criar credenciais
    await connection.execute(
      'INSERT INTO user_credentials (user_id, username, password_hash) VALUES (?, ?, ?)',
      [user.id, username, passwordHash]
    );
    console.log(`\nCredenciais criadas: username=${username}`);
  }

  // Ativar perfil de médico
  if (user.profile_id) {
    await connection.execute(
      'UPDATE user_profiles SET perfil_ativo = ?, is_medico = 1 WHERE id = ?',
      ['medico', user.profile_id]
    );
    console.log('Perfil de médico ativado');
  } else {
    // Criar perfil se não existir
    await connection.execute(
      `INSERT INTO user_profiles (user_id, nome_completo, email, perfil_ativo, is_medico) 
       VALUES (?, ?, ?, 'medico', 1)`,
      [user.id, user.name || 'Dra. Letícia Uzeika', user.email]
    );
    console.log('Perfil de médico criado');
  }

  console.log('\n=== CREDENCIAIS ===');
  console.log(`Username: ${username}`);
  console.log(`Senha: ${tempPassword}`);
  console.log('==================');

} catch (error) {
  console.error('Erro:', error);
} finally {
  await connection.end();
}
