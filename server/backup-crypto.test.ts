/**
 * Testes para funções de criptografia de backup
 */

import { describe, it, expect } from "vitest";
import { encryptData, decryptData } from "./backup";

describe("Backup Encryption (AES-256-GCM)", () => {
  const testPassword = "test-password-12345";
  
  it("deve criptografar e descriptografar dados corretamente", () => {
    const originalData = Buffer.from("Dados de teste para backup do GORGEN");
    
    // Criptografar
    const encrypted = encryptData(originalData, testPassword);
    
    // Verificar que os dados foram criptografados (diferentes do original)
    expect(encrypted.toString("hex")).not.toBe(originalData.toString("hex"));
    
    // Descriptografar
    const decrypted = decryptData(encrypted, testPassword);
    
    // Verificar que os dados foram restaurados
    expect(decrypted.toString()).toBe(originalData.toString());
  });
  
  it("deve gerar dados criptografados diferentes para o mesmo input (devido ao IV aleatório)", () => {
    const originalData = Buffer.from("Dados idênticos");
    
    const encrypted1 = encryptData(originalData, testPassword);
    const encrypted2 = encryptData(originalData, testPassword);
    
    // Os dados criptografados devem ser diferentes devido ao IV aleatório
    expect(encrypted1.toString("hex")).not.toBe(encrypted2.toString("hex"));
    
    // Mas ambos devem descriptografar para o mesmo valor
    const decrypted1 = decryptData(encrypted1, testPassword);
    const decrypted2 = decryptData(encrypted2, testPassword);
    
    expect(decrypted1.toString()).toBe(originalData.toString());
    expect(decrypted2.toString()).toBe(originalData.toString());
  });
  
  it("deve falhar ao descriptografar com senha incorreta", () => {
    const originalData = Buffer.from("Dados secretos");
    const encrypted = encryptData(originalData, testPassword);
    
    // Tentar descriptografar com senha errada deve lançar erro
    expect(() => {
      decryptData(encrypted, "senha-errada");
    }).toThrow();
  });
  
  it("deve lidar com dados grandes (simulando backup real)", () => {
    // Criar dados grandes (~1MB)
    const largeData = Buffer.alloc(1024 * 1024, "A");
    
    const encrypted = encryptData(largeData, testPassword);
    const decrypted = decryptData(encrypted, testPassword);
    
    expect(decrypted.length).toBe(largeData.length);
    expect(decrypted.toString()).toBe(largeData.toString());
  });
  
  it("deve incluir overhead de criptografia (salt + iv + authTag)", () => {
    const originalData = Buffer.from("Dados pequenos");
    const encrypted = encryptData(originalData, testPassword);
    
    // Overhead esperado: 32 (salt) + 16 (iv) + 16 (authTag) = 64 bytes
    const expectedOverhead = 32 + 16 + 16;
    expect(encrypted.length).toBe(originalData.length + expectedOverhead);
  });
  
  it("deve criptografar JSON de backup corretamente", () => {
    const backupData = {
      version: "3.0",
      type: "full",
      tenantId: 1,
      tables: {
        pacientes: { count: 100, records: [] },
        atendimentos: { count: 500, records: [] },
      },
      metadata: {
        totalRecords: 600,
        gorgenVersion: "2.15",
      },
    };
    
    const jsonData = JSON.stringify(backupData);
    const originalBuffer = Buffer.from(jsonData, "utf-8");
    
    const encrypted = encryptData(originalBuffer, testPassword);
    const decrypted = decryptData(encrypted, testPassword);
    
    const restoredData = JSON.parse(decrypted.toString("utf-8"));
    
    expect(restoredData.version).toBe("3.0");
    expect(restoredData.type).toBe("full");
    expect(restoredData.tenantId).toBe(1);
    expect(restoredData.metadata.totalRecords).toBe(600);
  });
});
