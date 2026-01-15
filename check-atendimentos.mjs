import { drizzle } from "drizzle-orm/mysql2";
import { atendimentos, pacientes } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const resultado = await db.select().from(atendimentos).limit(3);
console.log("Atendimentos no banco:", JSON.stringify(resultado, null, 2));
