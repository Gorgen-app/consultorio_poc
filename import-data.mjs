import { drizzle } from "drizzle-orm/mysql2";
import { pacientes, atendimentos } from "./drizzle/schema.ts";
import fs from "fs";
import path from "path";

const db = drizzle(process.env.DATABASE_URL);

// Ler dados de amostra
const pacientesData = fs.readFileSync("/home/ubuntu/pacientes_amostra.csv", "utf-8");
const atendimentosData = fs.readFileSync("/home/ubuntu/atendimentos_amostra.csv", "utf-8");

function parseCSV(data) {
  const lines = data.split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim().replace(/"/g, "") : null;
    });
    rows.push(row);
  }
  
  return rows;
}

async function importPacientes() {
  console.log("Importando pacientes...");
  const rows = parseCSV(pacientesData);
  
  for (const row of rows.slice(0, 100)) {
    try {
      await db.insert(pacientes).values({
        idPaciente: row["ID paciente"] || `PAC-${Date.now()}`,
        nome: row["Nome"] || "Sem nome",
        dataNascimento: row["Data nascimento"] ? new Date(row["Data nascimento"]) : null,
        sexo: row["Sexo"] || null,
        cpf: row["CPF"] || null,
        email: row["E-mail"] || null,
        telefone: row["Telefone"] || null,
        endereco: row["Endereço"] || null,
        bairro: row["Bairro"] || null,
        cep: row["CEP"] || null,
        cidade: row["Cidade"] || null,
        uf: row["UF"] || null,
        pais: row["Pais"] || "Brasil",
        operadora1: row["Operadora 1"] || null,
        statusCaso: row["Status do caso"] || "Ativo",
        grupoDiagnostico: row["Grupo de diagnóstico"] || null,
      });
    } catch (error) {
      console.error("Erro ao importar paciente:", error.message);
    }
  }
  
  console.log("Pacientes importados!");
}

async function importAtendimentos() {
  console.log("Importando atendimentos...");
  
  // Buscar IDs de pacientes
  const allPacientes = await db.select().from(pacientes).limit(100);
  if (allPacientes.length === 0) {
    console.log("Nenhum paciente encontrado. Importe pacientes primeiro.");
    return;
  }
  
  const rows = parseCSV(atendimentosData);
  
  for (const row of rows.slice(0, 500)) {
    try {
      const randomPaciente = allPacientes[Math.floor(Math.random() * allPacientes.length)];
      
      await db.insert(atendimentos).values({
        atendimento: row["Atendimento"] || `ATD-${Date.now()}`,
        pacienteId: randomPaciente.id,
        dataAtendimento: row["Data atendimento"] ? new Date(row["Data atendimento"]) : new Date(),
        tipoAtendimento: row["Tipo de atendimento"] || "Consulta",
        procedimento: row["Procedimento"] || null,
        nomePaciente: randomPaciente.nome,
        local: row["Local"] || "Consultório",
        convenio: row["Convênio"] || "Particular",
        faturamentoPrevistoFinal: row["Faturamento previsto final"] || "0",
        pagamentoEfetivado: row["Pagamento efetivado"] === "True" || false,
      });
    } catch (error) {
      console.error("Erro ao importar atendimento:", error.message);
    }
  }
  
  console.log("Atendimentos importados!");
}

async function main() {
  await importPacientes();
  await importAtendimentos();
  console.log("Importação concluída!");
  process.exit(0);
}

main().catch(console.error);
