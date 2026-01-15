import { drizzle } from "drizzle-orm/mysql2";
import { atendimentos, pacientes } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("Limpando atendimentos antigos...");
await db.delete(atendimentos);

console.log("Buscando pacientes...");
const todosPacientes = await db.select().from(pacientes);

if (todosPacientes.length === 0) {
  console.log("Nenhum paciente encontrado!");
  process.exit(1);
}

const tiposAtendimento = ["consulta", "cirurgia", "visita internado", "procedimento em consultório", "exame"];
const locais = ["Consultorio", "On-line", "HMV", "Santa Casa", "HMD", "HMD CG"];
const convenios = ["UNIMED", "CASSI", "Particular", "BRADESCO", "SUL AMERICA", "Golden Cross", "Amil"];

console.log("Criando 100 atendimentos com dados completos...");

for (let i = 0; i < 100; i++) {
  const paciente = todosPacientes[Math.floor(Math.random() * todosPacientes.length)];
  const ano = 2026;
  const numero = String(i + 1).padStart(7, '0');
  const idAtendimento = `${ano}${numero}`;
  
  const dataAtendimento = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const tipo = tiposAtendimento[Math.floor(Math.random() * tiposAtendimento.length)];
  const local = locais[Math.floor(Math.random() * locais.length)];
  const convenio = convenios[Math.floor(Math.random() * convenios.length)];
  const valor = (Math.random() * 2000 + 500).toFixed(2);
  
  await db.insert(atendimentos).values({
    atendimento: idAtendimento,
    pacienteId: paciente.id,
    dataAtendimento: dataAtendimento,
    tipoAtendimento: tipo,
    procedimento: `Procedimento ${i + 1}`,
    local: local,
    convenio: convenio,
    faturamentoPrevistoFinal: valor,
    pagamentoEfetivado: Math.random() > 0.3,
  });
  
  if ((i + 1) % 20 === 0) {
    console.log(`${i + 1} atendimentos criados...`);
  }
}

console.log("✅ 100 atendimentos criados com sucesso!");
