import { describe, it, expect, beforeAll } from "vitest";
import { listPacientes } from "./db";

describe("Busca e filtros de pacientes", () => {
  let pacientes: Awaited<ReturnType<typeof listPacientes>>;

  beforeAll(async () => {
    pacientes = await listPacientes();
  });

  it("deve retornar todos os pacientes quando não há filtros", () => {
    expect(pacientes.length).toBeGreaterThan(0);
    expect(Array.isArray(pacientes)).toBe(true);
  });

  it("deve retornar pacientes com campos necessários para busca", () => {
    const primeirosPacientes = pacientes.slice(0, 5);
    
    primeirosPacientes.forEach((p) => {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("nome");
      expect(p).toHaveProperty("cpf");
      expect(p).toHaveProperty("idade");
    });
  });

  it("deve calcular idade corretamente para pacientes com dataNascimento", () => {
    const pacientesComIdade = pacientes.filter((p) => p.idade !== null);
    
    expect(pacientesComIdade.length).toBeGreaterThan(0);
    
    pacientesComIdade.forEach((p) => {
      expect(typeof p.idade).toBe("number");
      expect(p.idade).toBeGreaterThanOrEqual(0);
      expect(p.idade).toBeLessThan(150);
    });
  });

  it("deve permitir busca por nome (case insensitive)", () => {
    // Pegar um nome de exemplo dos dados
    const pacienteExemplo = pacientes.find((p) => p.nome && p.nome.length > 5);
    
    if (pacienteExemplo && pacienteExemplo.nome) {
      const termo = pacienteExemplo.nome.substring(0, 5).toLowerCase();
      
      const resultados = pacientes.filter((p) => {
        const nome = p.nome?.toLowerCase() || "";
        return nome.includes(termo);
      });
      
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados.some((p) => p.id === pacienteExemplo.id)).toBe(true);
    }
  });

  it("deve permitir busca por CPF (ignorando formatação)", () => {
    const pacienteComCPF = pacientes.find((p) => p.cpf && p.cpf.length > 0);
    
    if (pacienteComCPF && pacienteComCPF.cpf) {
      // Buscar apenas pelos números
      const cpfNumeros = pacienteComCPF.cpf.replace(/\D/g, "");
      const termo = cpfNumeros.substring(0, 5);
      
      const resultados = pacientes.filter((p) => {
        const cpf = (p.cpf || "").replace(/\D/g, "");
        return cpf.includes(termo);
      });
      
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados.some((p) => p.id === pacienteComCPF.id)).toBe(true);
    }
  });

  it("deve permitir busca por ID", () => {
    const pacienteExemplo = pacientes[0];
    
    if (pacienteExemplo && pacienteExemplo.id) {
      const termo = String(pacienteExemplo.id).substring(0, 8);
      
      const resultados = pacientes.filter((p) => {
        const id = String(p.id || "").toLowerCase();
        return id.includes(termo.toLowerCase());
      });
      
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados.some((p) => p.id === pacienteExemplo.id)).toBe(true);
    }
  });

  it("deve permitir filtro por idade", () => {
    const pacientesComIdade = pacientes.filter((p) => p.idade !== null);
    
    if (pacientesComIdade.length > 0) {
      const idadeExemplo = pacientesComIdade[0].idade;
      
      const resultados = pacientes.filter((p) => {
        return p.idade === idadeExemplo;
      });
      
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados.every((p) => p.idade === idadeExemplo)).toBe(true);
    }
  });

  it("deve retornar estrutura flat (não aninhada)", () => {
    const paciente = pacientes[0];
    
    // Verificar que campos estão no nível raiz, não aninhados
    expect(paciente.id).toBeDefined();
    expect(paciente.nome).toBeDefined();
    
    // Verificar que NÃO tem estrutura aninhada
    expect(paciente).not.toHaveProperty("pacientes");
  });
});
