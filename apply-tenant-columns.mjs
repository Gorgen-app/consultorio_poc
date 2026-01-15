import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  console.log("Aplicando colunas tenant_id...");
  
  try {
    // Verificar se coluna já existe em users
    const usersCheck = await db.execute(sql`SHOW COLUMNS FROM users LIKE 'tenant_id'`);
    if (usersCheck[0].length === 0) {
      console.log("Adicionando tenant_id em users...");
      await db.execute(sql`ALTER TABLE users ADD tenant_id int DEFAULT 1 NOT NULL`);
      console.log("✓ tenant_id adicionado em users");
    } else {
      console.log("✓ tenant_id já existe em users");
    }
  } catch (e) {
    console.log("Erro em users:", e.message);
  }
  
  try {
    // Verificar se coluna já existe em user_profiles
    const profilesCheck = await db.execute(sql`SHOW COLUMNS FROM user_profiles LIKE 'tenant_id'`);
    if (profilesCheck[0].length === 0) {
      console.log("Adicionando tenant_id em user_profiles...");
      await db.execute(sql`ALTER TABLE user_profiles ADD tenant_id int DEFAULT 1 NOT NULL`);
      console.log("✓ tenant_id adicionado em user_profiles");
    } else {
      console.log("✓ tenant_id já existe em user_profiles");
    }
  } catch (e) {
    console.log("Erro em user_profiles:", e.message);
  }
  
  // Verificar resultado
  console.log("\nVerificando estrutura final:");
  const usersColumns = await db.execute(sql`SHOW COLUMNS FROM users`);
  console.log("Colunas de users:", usersColumns[0].map(c => c.Field));
  
  const profilesColumns = await db.execute(sql`SHOW COLUMNS FROM user_profiles`);
  console.log("Colunas de user_profiles:", profilesColumns[0].map(c => c.Field));
  
  process.exit(0);
}

main();
