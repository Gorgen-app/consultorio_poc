import { drizzle } from "drizzle-orm/mysql2";
import { resultadosLaboratoriais } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const testData = {
  pacienteId: 47,
  documentoExternoId: 90005,
  nomeExameOriginal: "Teste Drizzle",
  dataColeta: "2025-10-02",
  resultado: "100",
  resultadoNumerico: "100",
  unidade: "mg/dL",
  valorReferenciaTexto: "50-150",
  valorReferenciaMin: "50",
  valorReferenciaMax: "150",
  foraReferencia: false,
  tipoAlteracao: "Normal",
  laboratorio: "Teste",
  extraidoPorIa: true,
};

console.log("Dados a inserir:", testData);
console.log("Campos do schema:", Object.keys(resultadosLaboratoriais));

try {
  const result = await db.insert(resultadosLaboratoriais).values(testData);
  console.log("Inserção bem sucedida:", result);
} catch (error) {
  console.error("Erro na inserção:", error.message);
}

process.exit(0);
