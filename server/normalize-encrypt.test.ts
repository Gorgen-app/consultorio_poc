/**
 * GORGEN - Testes para normalizeAndEncryptPacienteData
 * 
 * Testes automatizados para validar a solução definitiva do erro
 * de atualização de prontuários com dados já criptografados.
 * 
 * @version 1.0.0
 * @date 2026-01-27
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  normalizeAndEncryptPacienteData, 
  encryptPacienteData,
  decryptPacienteData,
  isEncryptionEnabled 
} from './encryption-helpers';
import { encryptionService } from './services/EncryptionService';
import { hashingService } from './services/HashingService';

describe('normalizeAndEncryptPacienteData', () => {
  const TENANT_ID = 1;

  describe('Cenário 1: Dados em texto plano (novo cadastro)', () => {
    it('deve criptografar e gerar hash para CPF em texto plano', () => {
      const data = { cpf: '123.456.789-00' };
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      // Deve estar criptografado
      expect(result.cpf).toMatch(/^enc:v1:/);
      // Deve ter hash gerado
      expect(result.cpfHash).toBeDefined();
      expect(result.cpfHash).not.toBe('');
    });

    it('deve criptografar e gerar hash para email em texto plano', () => {
      const data = { email: 'paciente@email.com' };
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      expect(result.email).toMatch(/^enc:v1:/);
      expect(result.emailHash).toBeDefined();
    });

    it('deve criptografar e gerar hash para telefone em texto plano', () => {
      const data = { telefone: '(51) 99999-8888' };
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      expect(result.telefone).toMatch(/^enc:v1:/);
      expect(result.telefoneHash).toBeDefined();
    });
  });

  describe('Cenário 2: Dados já criptografados (atualização)', () => {
    it('deve normalizar CPF já criptografado e recalcular hash', () => {
      // Primeiro, criptografar um CPF
      const cpfOriginal = '987.654.321-00';
      const dadosOriginais = encryptPacienteData(TENANT_ID, { cpf: cpfOriginal });
      const cpfCriptografado = dadosOriginais.cpf;
      const hashOriginal = dadosOriginais.cpfHash;
      
      // Agora, simular uma atualização com o CPF já criptografado
      const result = normalizeAndEncryptPacienteData(TENANT_ID, { cpf: cpfCriptografado });
      
      // Deve estar criptografado
      expect(result.cpf).toMatch(/^enc:v1:/);
      // Deve ter hash gerado (mesmo valor, pois é o mesmo CPF)
      expect(result.cpfHash).toBeDefined();
      expect(result.cpfHash).toBe(hashOriginal);
      
      // Descriptografar deve retornar o valor original
      const decrypted = decryptPacienteData({ cpf: result.cpf });
      expect(decrypted.cpf).toBe(cpfOriginal);
    });

    it('deve normalizar email já criptografado e recalcular hash', () => {
      const emailOriginal = 'teste@gorgen.com';
      const dadosOriginais = encryptPacienteData(TENANT_ID, { email: emailOriginal });
      const emailCriptografado = dadosOriginais.email;
      const hashOriginal = dadosOriginais.emailHash;
      
      const result = normalizeAndEncryptPacienteData(TENANT_ID, { email: emailCriptografado });
      
      expect(result.email).toMatch(/^enc:v1:/);
      expect(result.emailHash).toBe(hashOriginal);
      
      const decrypted = decryptPacienteData({ email: result.email });
      expect(decrypted.email).toBe(emailOriginal);
    });

    it('deve normalizar telefone já criptografado e recalcular hash', () => {
      const telefoneOriginal = '(11) 98765-4321';
      const dadosOriginais = encryptPacienteData(TENANT_ID, { telefone: telefoneOriginal });
      const telefoneCriptografado = dadosOriginais.telefone;
      const hashOriginal = dadosOriginais.telefoneHash;
      
      const result = normalizeAndEncryptPacienteData(TENANT_ID, { telefone: telefoneCriptografado });
      
      expect(result.telefone).toMatch(/^enc:v1:/);
      expect(result.telefoneHash).toBe(hashOriginal);
      
      const decrypted = decryptPacienteData({ telefone: result.telefone });
      expect(decrypted.telefone).toBe(telefoneOriginal);
    });
  });

  describe('Cenário 3: Múltiplas atualizações consecutivas', () => {
    it('deve manter consistência após múltiplas atualizações do mesmo dado', () => {
      const emailOriginal = 'consistencia@teste.com';
      
      // Primeira criptografia
      let resultado = normalizeAndEncryptPacienteData(TENANT_ID, { email: emailOriginal });
      const hashPrimeiro = resultado.emailHash;
      
      // Segunda atualização (com dado já criptografado)
      resultado = normalizeAndEncryptPacienteData(TENANT_ID, { email: resultado.email });
      const hashSegundo = resultado.emailHash;
      
      // Terceira atualização (com dado já criptografado)
      resultado = normalizeAndEncryptPacienteData(TENANT_ID, { email: resultado.email });
      const hashTerceiro = resultado.emailHash;
      
      // Todos os hashes devem ser iguais
      expect(hashPrimeiro).toBe(hashSegundo);
      expect(hashSegundo).toBe(hashTerceiro);
      
      // Descriptografar deve sempre retornar o valor original
      const decrypted = decryptPacienteData({ email: resultado.email });
      expect(decrypted.email).toBe(emailOriginal);
    });
  });

  describe('Cenário 4: Campos vazios ou nulos', () => {
    it('não deve processar campos vazios', () => {
      const data = { cpf: '', email: '   ', telefone: null as any };
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      expect(result.cpfHash).toBeUndefined();
      expect(result.emailHash).toBeUndefined();
      expect(result.telefoneHash).toBeUndefined();
    });

    it('deve processar apenas campos preenchidos', () => {
      const data = { 
        cpf: '111.222.333-44', 
        email: '', 
        telefone: '(51) 99999-0000' 
      };
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      expect(result.cpf).toMatch(/^enc:v1:/);
      expect(result.cpfHash).toBeDefined();
      expect(result.emailHash).toBeUndefined();
      expect(result.telefone).toMatch(/^enc:v1:/);
      expect(result.telefoneHash).toBeDefined();
    });
  });

  describe('Cenário 5: Dados mistos (alguns criptografados, outros não)', () => {
    it('deve processar corretamente dados mistos', () => {
      // CPF já criptografado
      const cpfOriginal = '555.666.777-88';
      const cpfCriptografado = encryptPacienteData(TENANT_ID, { cpf: cpfOriginal }).cpf;
      
      // Email em texto plano
      const emailNovo = 'novo@email.com';
      
      const data = {
        cpf: cpfCriptografado,
        email: emailNovo
      };
      
      const result = normalizeAndEncryptPacienteData(TENANT_ID, data);
      
      // Ambos devem estar criptografados
      expect(result.cpf).toMatch(/^enc:v1:/);
      expect(result.email).toMatch(/^enc:v1:/);
      
      // Ambos devem ter hash
      expect(result.cpfHash).toBeDefined();
      expect(result.emailHash).toBeDefined();
      
      // Descriptografar deve retornar valores corretos
      const decrypted = decryptPacienteData({ cpf: result.cpf, email: result.email });
      expect(decrypted.cpf).toBe(cpfOriginal);
      expect(decrypted.email).toBe(emailNovo);
    });
  });

  describe('Cenário 6: Isolamento por tenant', () => {
    it('deve gerar hashes diferentes para tenants diferentes', () => {
      const cpf = '999.888.777-66';
      
      const resultTenant1 = normalizeAndEncryptPacienteData(1, { cpf });
      const resultTenant2 = normalizeAndEncryptPacienteData(2, { cpf });
      
      // Hashes devem ser diferentes (isolamento por tenant)
      expect(resultTenant1.cpfHash).not.toBe(resultTenant2.cpfHash);
      
      // Mas descriptografar deve retornar o mesmo valor
      const decrypted1 = decryptPacienteData({ cpf: resultTenant1.cpf });
      const decrypted2 = decryptPacienteData({ cpf: resultTenant2.cpf });
      expect(decrypted1.cpf).toBe(cpf);
      expect(decrypted2.cpf).toBe(cpf);
    });
  });
});
