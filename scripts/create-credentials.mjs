import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
// Usar variável de ambiente diretamente

const SALT_ROUNDS = 12;

async function main() {
  // Extrair informações da DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL não encontrada');
    process.exit(1);
  }

  // Parse da URL
  const url = new URL(dbUrl);
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true }
  });

  try {
    // Verificar usuário existente
    const [users] = await connection.execute('SELECT id, name, email FROM users WHERE id = 1');
    console.log('Usuário encontrado:', users[0]);

    // Verificar se já tem credenciais
    const [existingCreds] = await connection.execute('SELECT * FROM user_credentials WHERE user_id = 1');
    
    const username = 'andre.gorgen';
    const password = 'Gorgen@2026!';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    if (existingCreds.length > 0) {
      console.log('Usuário já possui credenciais locais:', existingCreds[0].username);
      
      // Atualizar a senha
      await connection.execute(
        'UPDATE user_credentials SET password_hash = ? WHERE user_id = 1',
        [passwordHash]
      );
      
      console.log('\n✅ Senha atualizada com sucesso!');
    } else {
      // Criar novas credenciais
      await connection.execute(
        'INSERT INTO user_credentials (user_id, username, password_hash) VALUES (?, ?, ?)',
        [1, username, passwordHash]
      );
      
      console.log('\n✅ Credenciais criadas com sucesso!');
    }
    
    console.log('=====================================');
    console.log('Username: andre.gorgen');
    console.log('Senha: Gorgen@2026!');
    console.log('=====================================');
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
