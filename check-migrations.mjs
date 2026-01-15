import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  try {
    const result = await db.execute(sql`SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 10`);
    console.log("Migrações aplicadas:");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log("Erro:", e.message);
  }
  process.exit(0);
}

main();
