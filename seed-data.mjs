import { drizzle } from "drizzle-orm/mysql2";
import { pacientes, atendimentos } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const nomes = [
  "João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Souza",
  "Juliana Lima", "Roberto Alves", "Fernanda Rocha", "Paulo Martins", "Beatriz Ferreira",
  "Lucas Barbosa", "Camila Ribeiro", "Rafael Carvalho", "Patricia Gomes", "Diego Nascimento",
  "Amanda Araújo", "Thiago Monteiro", "Larissa Cardoso", "Marcelo Dias", "Gabriela Freitas"
];

const convenios = ["UNIMED", "Sul America", "Bradesco Saúde", "Amil", "Particular", "CASSI", "Golden Cross"];
const cidades = ["Porto Alegre", "São Paulo", "Rio de Janeiro", "Curitiba", "Florianópolis"];
const diagnosticos = ["HCC", "IPMN", "Pancreatite", "Cirrose", "Hepatite"];

async function seed() {
  console.log("Criando pacientes de amostra...");
  
  const pacientesIds = [];
  
  for (let i = 0; i < 50; i++) {
    try {
      const result = await db.insert(pacientes).values({
        idPaciente: `2025-${String(i + 1).padStart(7, "0")}`,
        nome: nomes[i % nomes.length] + ` ${i + 1}`,
        dataNascimento: new Date(1950 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        sexo: Math.random() > 0.5 ? "M" : "F",
        cpf: `${Math.floor(Math.random() * 100000000000)}`,
        email: `paciente${i + 1}@email.com`,
        telefone: `(51) 9${Math.floor(Math.random() * 100000000)}`,
        endereco: `Rua Exemplo, ${Math.floor(Math.random() * 1000)}`,
        bairro: "Centro",
        cep: `${Math.floor(Math.random() * 100000)}-000`,
        cidade: cidades[Math.floor(Math.random() * cidades.length)],
        uf: "RS",
        pais: "Brasil",
        operadora1: convenios[Math.floor(Math.random() * convenios.length)],
        statusCaso: Math.random() > 0.1 ? "Ativo" : "Inativo",
        grupoDiagnostico: diagnosticos[Math.floor(Math.random() * diagnosticos.length)],
      });
      
      pacientesIds.push(Number(result[0].insertId));
    } catch (error) {
      console.error("Erro ao criar paciente:", error.message);
    }
  }
  
  console.log(`${pacientesIds.length} pacientes criados!`);
  console.log("Criando atendimentos de amostra...");
  
  const tiposAtendimento = ["Consulta", "Visita Internado", "Cirurgia", "Retorno"];
  const locais = ["Consultório", "HMV", "Hospital Moinhos", "Hospital São Lucas"];
  
  for (let i = 0; i < 100; i++) {
    try {
      const pacienteId = pacientesIds[Math.floor(Math.random() * pacientesIds.length)];
      const dataAtendimento = new Date(2026, 0, Math.floor(Math.random() * 30) + 1);
      const faturamento = Math.floor(Math.random() * 5000) + 500;
      
      await db.insert(atendimentos).values({
        atendimento: `2026${String(i + 1).padStart(4, "0")}`,
        pacienteId: pacienteId,
        dataAtendimento: dataAtendimento,
        tipoAtendimento: tiposAtendimento[Math.floor(Math.random() * tiposAtendimento.length)],
        procedimento: "Consulta médica",
        local: locais[Math.floor(Math.random() * locais.length)],
        convenio: convenios[Math.floor(Math.random() * convenios.length)],
        faturamentoPrevistoFinal: faturamento.toString(),
        pagamentoEfetivado: Math.random() > 0.3,
        mes: dataAtendimento.getMonth() + 1,
        ano: dataAtendimento.getFullYear(),
      });
    } catch (error) {
      console.error("Erro ao criar atendimento:", error.message);
    }
  }
  
  console.log("100 atendimentos criados!");
  console.log("✅ Seed concluído!");
  process.exit(0);
}

seed().catch(console.error);
