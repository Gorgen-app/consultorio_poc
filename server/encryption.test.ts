/**
 * GORGEN - Testes de Criptografia
 * 
 * Testes unitários para EncryptionService e HashingService
 * 
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ==========================================
// MOCK DO ENVIRONMENT
// ==========================================

// Mock das variáveis de ambiente antes de importar os serviços
vi.stubEnv("ENCRYPTION_MASTER_KEY", "gorgen-test-master-key-32-chars-minimum-length");
vi.stubEnv("HASH_SECRET_KEY", "gorgen-test-hash-key-32-chars-minimum-length");
vi.stubEnv("JWT_SECRET", "gorgen-test-jwt-secret-32-chars-minimum-length");

// Importar serviços após configurar o mock
import { 
  EncryptionService, 
  encryptField, 
  decryptField, 
  isFieldEncrypted 
} from "./services/EncryptionService";

import { 
  HashingService, 
  hashCPF, 
  hashTelefone, 
  hashEmail,
  verifyCPF,
  verifyTelefone,
  verifyEmail
} from "./services/HashingService";

// ==========================================
// TESTES DO ENCRYPTION SERVICE
// ==========================================

describe("EncryptionService", () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService({
      masterKey: "gorgen-test-master-key-32-chars-minimum-length",
      tenantId: 1
    });
  });

  describe("Construtor", () => {
    it("deve criar instância com configuração válida", () => {
      expect(service).toBeInstanceOf(EncryptionService);
    });

    it("deve rejeitar chave muito curta", () => {
      expect(() => {
        new EncryptionService({ masterKey: "short" });
      }).toThrow("Master key must be at least 32 characters long");
    });

    it("deve rejeitar chave vazia", () => {
      expect(() => {
        new EncryptionService({ masterKey: "" });
      }).toThrow();
    });
  });

  describe("Criptografia básica", () => {
    it("deve criptografar e descriptografar um CPF", () => {
      const cpf = "123.456.789-00";
      
      const { encrypted } = service.encrypt(cpf);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(cpf);
      
      const { decrypted } = service.decrypt(encrypted);
      expect(decrypted).toBe(cpf);
    });

    it("deve criptografar e descriptografar um email", () => {
      const email = "paciente@exemplo.com";
      
      const { encrypted } = service.encrypt(email);
      const { decrypted } = service.decrypt(encrypted);
      
      expect(decrypted).toBe(email);
    });

    it("deve criptografar e descriptografar um telefone", () => {
      const telefone = "(11) 99999-9999";
      
      const { encrypted } = service.encrypt(telefone);
      const { decrypted } = service.decrypt(encrypted);
      
      expect(decrypted).toBe(telefone);
    });

    it("deve retornar string vazia para valor vazio", () => {
      const { encrypted } = service.encrypt("");
      expect(encrypted).toBe("");
      
      const { decrypted } = service.decrypt("");
      expect(decrypted).toBe("");
    });

    it("deve lidar com caracteres especiais", () => {
      const texto = "João da Silva - CPF: 123.456.789-00 (ação)";
      
      const { encrypted } = service.encrypt(texto);
      const { decrypted } = service.decrypt(encrypted);
      
      expect(decrypted).toBe(texto);
    });

    it("deve lidar com texto longo", () => {
      const texto = "A".repeat(10000);
      
      const { encrypted } = service.encrypt(texto);
      const { decrypted } = service.decrypt(encrypted);
      
      expect(decrypted).toBe(texto);
    });
  });

  describe("Segurança", () => {
    it("deve gerar criptografias diferentes para o mesmo valor (IV aleatório)", () => {
      const cpf = "123.456.789-00";
      
      const { encrypted: enc1 } = service.encrypt(cpf);
      const { encrypted: enc2 } = service.encrypt(cpf);
      
      expect(enc1).not.toBe(enc2);
      
      // Mas ambos devem descriptografar para o mesmo valor
      const { decrypted: dec1 } = service.decrypt(enc1);
      const { decrypted: dec2 } = service.decrypt(enc2);
      
      expect(dec1).toBe(cpf);
      expect(dec2).toBe(cpf);
    });

    it("deve falhar ao descriptografar com chave diferente", () => {
      const cpf = "123.456.789-00";
      const { encrypted } = service.encrypt(cpf);
      
      const otherService = new EncryptionService({
        masterKey: "outra-chave-completamente-diferente-32-chars",
        tenantId: 1
      });
      
      expect(() => {
        otherService.decrypt(encrypted);
      }).toThrow();
    });

    it("deve falhar ao descriptografar com tenant diferente", () => {
      const cpf = "123.456.789-00";
      const { encrypted } = service.encrypt(cpf);
      
      const otherService = new EncryptionService({
        masterKey: "gorgen-test-master-key-32-chars-minimum-length",
        tenantId: 2 // Tenant diferente
      });
      
      expect(() => {
        otherService.decrypt(encrypted);
      }).toThrow();
    });

    it("deve falhar ao descriptografar dados corrompidos", () => {
      const cpf = "123.456.789-00";
      const { encrypted } = service.encrypt(cpf);
      
      // Corromper os dados
      const corrupted = encrypted.slice(0, -10) + "XXXXXXXXXX";
      
      expect(() => {
        service.decrypt(corrupted);
      }).toThrow();
    });
  });

  describe("Verificação de formato", () => {
    it("deve identificar valor criptografado", () => {
      const cpf = "123.456.789-00";
      const { encrypted } = service.encrypt(cpf);
      
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it("deve identificar valor não criptografado", () => {
      expect(service.isEncrypted("123.456.789-00")).toBe(false);
      expect(service.isEncrypted("texto qualquer")).toBe(false);
      expect(service.isEncrypted("")).toBe(false);
    });

    it("deve retornar versão correta", () => {
      const cpf = "123.456.789-00";
      const { encrypted, version } = service.encrypt(cpf);
      
      expect(version).toBe(1);
      
      const { version: decVersion } = service.decrypt(encrypted);
      expect(decVersion).toBe(1);
    });
  });

  describe("Rotação de chaves", () => {
    it("deve rotacionar criptografia para nova chave", () => {
      const oldService = new EncryptionService({
        masterKey: "chave-antiga-32-caracteres-minimo-aqui",
        tenantId: 1
      });
      
      const newService = new EncryptionService({
        masterKey: "chave-nova-32-caracteres-minimo-aqui!",
        tenantId: 1
      });
      
      const cpf = "123.456.789-00";
      const { encrypted: oldEncrypted } = oldService.encrypt(cpf);
      
      // Rotacionar para nova chave
      const { encrypted: newEncrypted } = newService.rotate(
        oldEncrypted, 
        "chave-antiga-32-caracteres-minimo-aqui"
      );
      
      // Nova criptografia deve funcionar com nova chave
      const { decrypted } = newService.decrypt(newEncrypted);
      expect(decrypted).toBe(cpf);
      
      // Antiga criptografia não deve funcionar com nova chave
      expect(() => {
        newService.decrypt(oldEncrypted);
      }).toThrow();
    });
  });
});

// ==========================================
// TESTES DO HASHING SERVICE
// ==========================================

describe("HashingService", () => {
  let service: HashingService;

  beforeEach(() => {
    service = new HashingService({
      secretKey: "gorgen-test-hash-key-32-chars-minimum-length",
      tenantId: 1
    });
  });

  describe("Construtor", () => {
    it("deve criar instância com configuração válida", () => {
      expect(service).toBeInstanceOf(HashingService);
    });

    it("deve rejeitar chave muito curta", () => {
      expect(() => {
        new HashingService({ secretKey: "short" });
      }).toThrow("Secret key must be at least 32 characters long");
    });
  });

  describe("Hashing básico", () => {
    it("deve gerar hash de um valor", () => {
      const { hash } = service.hash("123.456.789-00", "cpf");
      
      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^gh1_[0-9a-f]{64}$/);
    });

    it("deve gerar hash determinístico (mesmo valor = mesmo hash)", () => {
      const { hash: hash1 } = service.hash("123.456.789-00", "cpf");
      const { hash: hash2 } = service.hash("123.456.789-00", "cpf");
      
      expect(hash1).toBe(hash2);
    });

    it("deve gerar hashes diferentes para valores diferentes", () => {
      const { hash: hash1 } = service.hash("123.456.789-00", "cpf");
      const { hash: hash2 } = service.hash("987.654.321-00", "cpf");
      
      expect(hash1).not.toBe(hash2);
    });

    it("deve gerar hashes diferentes para campos diferentes", () => {
      const { hash: hash1 } = service.hash("123456789", "cpf");
      const { hash: hash2 } = service.hash("123456789", "telefone");
      
      expect(hash1).not.toBe(hash2);
    });

    it("deve retornar string vazia para valor vazio", () => {
      const { hash } = service.hash("", "cpf");
      expect(hash).toBe("");
    });
  });

  describe("Verificação de hash", () => {
    it("deve verificar hash correto", () => {
      const { hash } = service.hash("123.456.789-00", "cpf");
      
      const isValid = service.verify("123.456.789-00", hash, "cpf");
      expect(isValid).toBe(true);
    });

    it("deve rejeitar hash incorreto", () => {
      const { hash } = service.hash("123.456.789-00", "cpf");
      
      const isValid = service.verify("987.654.321-00", hash, "cpf");
      expect(isValid).toBe(false);
    });

    it("deve identificar formato de hash válido", () => {
      const { hash } = service.hash("123.456.789-00", "cpf");
      
      expect(service.isHash(hash)).toBe(true);
      expect(service.isHash("123.456.789-00")).toBe(false);
      expect(service.isHash("")).toBe(false);
      expect(service.isHash("gh1_invalid")).toBe(false);
    });
  });

  describe("Normalização", () => {
    it("deve normalizar CPF removendo caracteres especiais", () => {
      const normalized = service.normalizeCPF("123.456.789-00");
      expect(normalized).toBe("12345678900");
    });

    it("deve normalizar telefone removendo caracteres especiais", () => {
      const normalized = service.normalizeTelefone("(11) 99999-9999");
      expect(normalized).toBe("11999999999");
    });

    it("deve normalizar email para lowercase", () => {
      const normalized = service.normalizeEmail("  PACIENTE@EXEMPLO.COM  ");
      expect(normalized).toBe("paciente@exemplo.com");
    });

    it("deve gerar mesmo hash para CPFs com formatação diferente", () => {
      const cpf1 = "123.456.789-00";
      const cpf2 = "12345678900";
      
      const normalized1 = service.normalizeCPF(cpf1);
      const normalized2 = service.normalizeCPF(cpf2);
      
      const { hash: hash1 } = service.hash(normalized1, "cpf");
      const { hash: hash2 } = service.hash(normalized2, "cpf");
      
      expect(hash1).toBe(hash2);
    });
  });

  describe("Isolamento por tenant", () => {
    it("deve gerar hashes diferentes para tenants diferentes", () => {
      const service1 = new HashingService({
        secretKey: "gorgen-test-hash-key-32-chars-minimum-length",
        tenantId: 1
      });
      
      const service2 = new HashingService({
        secretKey: "gorgen-test-hash-key-32-chars-minimum-length",
        tenantId: 2
      });
      
      const { hash: hash1 } = service1.hash("123.456.789-00", "cpf");
      const { hash: hash2 } = service2.hash("123.456.789-00", "cpf");
      
      expect(hash1).not.toBe(hash2);
    });
  });
});

// ==========================================
// TESTES DAS FUNÇÕES UTILITÁRIAS
// ==========================================

describe("Funções utilitárias de criptografia", () => {
  describe("encryptField / decryptField", () => {
    it("deve criptografar e descriptografar campo", () => {
      const cpf = "123.456.789-00";
      
      const encrypted = encryptField(cpf, 1);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(cpf);
      
      const decrypted = decryptField(encrypted, 1);
      expect(decrypted).toBe(cpf);
    });

    it("deve retornar null para valor null", () => {
      expect(encryptField(null, 1)).toBeNull();
      expect(decryptField(null, 1)).toBeNull();
    });

    it("deve retornar null para valor undefined", () => {
      expect(encryptField(undefined, 1)).toBeNull();
      expect(decryptField(undefined, 1)).toBeNull();
    });

    it("deve retornar valor original se não estiver criptografado (compatibilidade)", () => {
      const cpf = "123.456.789-00";
      const decrypted = decryptField(cpf, 1);
      expect(decrypted).toBe(cpf);
    });
  });

  describe("isFieldEncrypted", () => {
    it("deve identificar campo criptografado", () => {
      const cpf = "123.456.789-00";
      const encrypted = encryptField(cpf, 1);
      
      expect(isFieldEncrypted(encrypted)).toBe(true);
    });

    it("deve identificar campo não criptografado", () => {
      expect(isFieldEncrypted("123.456.789-00")).toBe(false);
      expect(isFieldEncrypted(null)).toBe(false);
      expect(isFieldEncrypted(undefined)).toBe(false);
    });
  });
});

describe("Funções utilitárias de hashing", () => {
  describe("hashCPF / verifyCPF", () => {
    it("deve hashear e verificar CPF", () => {
      const cpf = "123.456.789-00";
      
      const hash = hashCPF(cpf, 1);
      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^gh1_/);
      
      const isValid = verifyCPF(cpf, hash!, 1);
      expect(isValid).toBe(true);
    });

    it("deve gerar mesmo hash para CPFs com formatação diferente", () => {
      const hash1 = hashCPF("123.456.789-00", 1);
      const hash2 = hashCPF("12345678900", 1);
      
      expect(hash1).toBe(hash2);
    });

    it("deve retornar null para CPF null", () => {
      expect(hashCPF(null, 1)).toBeNull();
    });
  });

  describe("hashTelefone / verifyTelefone", () => {
    it("deve hashear e verificar telefone", () => {
      const telefone = "(11) 99999-9999";
      
      const hash = hashTelefone(telefone, 1);
      expect(hash).toBeTruthy();
      
      const isValid = verifyTelefone(telefone, hash!, 1);
      expect(isValid).toBe(true);
    });

    it("deve gerar mesmo hash para telefones com formatação diferente", () => {
      const hash1 = hashTelefone("(11) 99999-9999", 1);
      const hash2 = hashTelefone("11999999999", 1);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe("hashEmail / verifyEmail", () => {
    it("deve hashear e verificar email", () => {
      const email = "paciente@exemplo.com";
      
      const hash = hashEmail(email, 1);
      expect(hash).toBeTruthy();
      
      const isValid = verifyEmail(email, hash!, 1);
      expect(isValid).toBe(true);
    });

    it("deve gerar mesmo hash para emails com case diferente", () => {
      const hash1 = hashEmail("PACIENTE@EXEMPLO.COM", 1);
      const hash2 = hashEmail("paciente@exemplo.com", 1);
      
      expect(hash1).toBe(hash2);
    });
  });
});

// ==========================================
// TESTES DE PERFORMANCE
// ==========================================

describe("Performance", () => {
  it("deve criptografar em menos de 5ms (após warm-up)", () => {
    const service = new EncryptionService({
      masterKey: "gorgen-test-master-key-32-chars-minimum-length",
      tenantId: 1,
      useFixedSalt: true // Usar salt fixo para performance
    });

    // Warm-up: primeira operação deriva a chave (lenta)
    service.encrypt("warm-up");

    // Medir operações subsequentes (rápidas, usam cache)
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      service.encrypt("123.456.789-00");
    }
    const end = performance.now();
    
    const avgTime = (end - start) / 100;
    expect(avgTime).toBeLessThan(5); // 5ms após warm-up
    
    console.log(`Tempo médio de criptografia (após warm-up): ${avgTime.toFixed(3)}ms`);
  });

  it("primeira criptografia pode levar até 500ms (derivação de chave)", () => {
    // Criar novo serviço para forçar derivação
    const service = new EncryptionService({
      masterKey: "gorgen-test-master-key-32-chars-minimum-length-v2",
      tenantId: 999 // Tenant diferente para não usar cache
    });

    const start = performance.now();
    service.encrypt("123.456.789-00");
    const end = performance.now();
    
    const firstTime = end - start;
    expect(firstTime).toBeLessThan(500); // Até 500ms para primeira operação
    
    console.log(`Tempo da primeira criptografia: ${firstTime.toFixed(3)}ms`);
  });

  it("deve hashear em menos de 1ms", () => {
    const service = new HashingService({
      secretKey: "gorgen-test-hash-key-32-chars-minimum-length",
      tenantId: 1
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      service.hash("123.456.789-00", "cpf");
    }
    const end = performance.now();
    
    const avgTime = (end - start) / 100;
    expect(avgTime).toBeLessThan(1);
    
    console.log(`Tempo médio de hashing: ${avgTime.toFixed(3)}ms`);
  });
});
