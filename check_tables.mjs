import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

try {
  const result = await db.execute(`SHOW TABLES`);
  console.log("Tabelas existentes:", result);
} catch (error) {
  console.error("Erro:", error.message);
}
process.exit(0);
