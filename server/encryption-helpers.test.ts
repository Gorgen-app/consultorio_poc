/**
 * GORGEN - Testes de Helpers de Criptografia
 * 
 * Testes unitários para as funções de criptografia de pacientes.
 * 
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock das variáveis de ambiente antes de importar
vi.stubEnv("ENCRYPTION_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
vi.stubEnv("HMAC_SECRET_KEY", "gorgen-test-hmac-secret-key-32-chars-minimum");

// Importar após configurar mocks
import {
  isEncryptionEnabled,
  encryptPacienteData,
  decryptPacienteData,
  decryptPacientesList,
  hashCPFForSearch,
  hashEmailForSearch,
  hashTelefoneForSearch,
} from "./encryption-helpers";

describe("Encryption Helpers", () => {
  describe("isEncryptionEnabled", () => {
    it("deve retornar true quando as chaves estão configuradas", () => {
      expect(isEncryptionEnabled()).toBe(true);
    });
  });

  describe("encryptPacienteData", () => {
    it("deve criptografar CPF e gerar hash", () => {
      const data = { cpf: "123.456.789-00", nome: "João Silva" };
      const result = encryptPacienteData(1, data);

      // CPF deve estar criptografado
      expect(result.cpf).toMatch(/^enc:v1:/);
      expect(result.cpf).not.toBe(data.cpf);

      // Hash deve existir e ter 64 caracteres (SHA256 hex)
      expect(result.cpfHash).toBeDefined();
      expect(result.cpfHash?.length).toBe(64);

      // Nome não deve ser alterado
      expect(result.nome).toBe("João Silva");
    });

    it("deve criptografar email e gerar hash", () => {
      const data = { email: "joao@email.com" };
      const result = encryptPacienteData(1, data);

      expect(result.email).toMatch(/^enc:v1:/);
      expect(result.emailHash).toBeDefined();
      expect(result.emailHash?.length).toBe(64);
    });

    it("deve criptografar telefone e gerar hash", () => {
      const data = { telefone: "(51) 99999-9999" };
      const result = encryptPacienteData(1, data);

      expect(result.telefone).toMatch(/^enc:v1:/);
      expect(result.telefoneHash).toBeDefined();
      expect(result.telefoneHash?.length).toBe(64);
    });

    it("deve ignorar campos vazios ou nulos", () => {
      const data = { cpf: "", email: null as any, telefone: undefined as any };
      const result = encryptPacienteData(1, data);

      expect(result.cpf).toBe("");
      expect(result.cpfHash).toBeUndefined();
      expect(result.emailHash).toBeUndefined();
      expect(result.telefoneHash).toBeUndefined();
    });

    it("deve gerar hashes diferentes para tenants diferentes", () => {
      const data = { cpf: "123.456.789-00" };
      
      const result1 = encryptPacienteData(1, data);
      const result2 = encryptPacienteData(2, data);

      // Hashes devem ser diferentes entre tenants
      expect(result1.cpfHash).not.toBe(result2.cpfHash);
    });
  });

  describe("decryptPacienteData", () => {
    it("deve descriptografar dados criptografados", () => {
      const original = { cpf: "123.456.789-00", email: "test@email.com", telefone: "(51) 99999-9999" };
      const encrypted = encryptPacienteData(1, original);
      const decrypted = decryptPacienteData(encrypted);

      expect(decrypted.cpf).toBe(original.cpf);
      expect(decrypted.email).toBe(original.email);
      expect(decrypted.telefone).toBe(original.telefone);
    });

    it("deve manter dados não criptografados intactos", () => {
      const data = { cpf: "123.456.789-00", nome: "João Silva" };
      const decrypted = decryptPacienteData(data);

      // Dados não criptografados devem permanecer iguais
      expect(decrypted.cpf).toBe("123.456.789-00");
      expect(decrypted.nome).toBe("João Silva");
    });
  });

  describe("decryptPacientesList", () => {
    it("deve descriptografar lista de pacientes", () => {
      const pacientes = [
        { cpf: "111.111.111-11", nome: "Paciente 1" },
        { cpf: "222.222.222-22", nome: "Paciente 2" },
      ];

      const encrypted = pacientes.map(p => encryptPacienteData(1, p));
      const decrypted = decryptPacientesList(encrypted);

      expect(decrypted[0].cpf).toBe("111.111.111-11");
      expect(decrypted[1].cpf).toBe("222.222.222-22");
    });
  });

  describe("hashCPFForSearch", () => {
    it("deve gerar hash consistente para o mesmo CPF", () => {
      const cpf = "123.456.789-00";
      const hash1 = hashCPFForSearch(cpf, 1);
      const hash2 = hashCPFForSearch(cpf, 1);

      expect(hash1).toBe(hash2);
    });

    it("deve normalizar CPF antes de gerar hash", () => {
      // CPF com e sem formatação devem gerar o mesmo hash
      const hash1 = hashCPFForSearch("123.456.789-00", 1);
      const hash2 = hashCPFForSearch("12345678900", 1);

      expect(hash1).toBe(hash2);
    });
  });

  describe("hashEmailForSearch", () => {
    it("deve gerar hash para email", () => {
      const hash = hashEmailForSearch("test@email.com", 1);
      expect(hash.length).toBe(64);
    });
  });

  describe("hashTelefoneForSearch", () => {
    it("deve gerar hash para telefone", () => {
      const hash = hashTelefoneForSearch("(51) 99999-9999", 1);
      expect(hash.length).toBe(64);
    });
  });
});
