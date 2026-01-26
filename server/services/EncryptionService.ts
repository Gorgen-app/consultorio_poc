/**
 * GORGEN - Serviço de Criptografia de Dados Pessoais (PII)
 * 
 * Este módulo implementa criptografia AES-256-GCM para proteção de dados
 * pessoais identificáveis (PII) em conformidade com a LGPD.
 * 
 * Algoritmo: AES-256-GCM (Galois/Counter Mode)
 * - Criptografia autenticada (confidencialidade + integridade)
 * - IV (Initialization Vector) de 12 bytes, único por operação
 * - Auth Tag de 16 bytes para verificação de integridade
 * 
 * Formato do texto cifrado: iv:authTag:ciphertext (Base64)
 * 
 * @version 1.0.0
 * @date 2026-01-26
 */

import crypto from "crypto";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits - recomendado para GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ENCODING: BufferEncoding = "utf8";
const OUTPUT_ENCODING: BufferEncoding = "base64";

// Prefixo para identificar dados criptografados (evita re-criptografia)
const ENCRYPTED_PREFIX = "enc:v1:";

// ==========================================
// CLASSE PRINCIPAL
// ==========================================

/**
 * Serviço singleton para criptografia de dados pessoais.
 * 
 * Uso:
 * ```typescript
 * import { encryptionService } from "./services/EncryptionService";
 * 
 * // Criptografar
 * const encrypted = encryptionService.encrypt("123.456.789-00");
 * 
 * // Descriptografar
 * const decrypted = encryptionService.decrypt(encrypted);
 * ```
 */
class EncryptionService {
  private key: Buffer | null = null;
  private initialized = false;

  /**
   * Inicializa o serviço com a chave de criptografia.
   * Chamado automaticamente na primeira operação.
   */
  private initialize(): void {
    if (this.initialized) return;

    const keyEnv = process.env.ENCRYPTION_KEY;

    if (!keyEnv) {
      throw new Error(
        "[EncryptionService] ENCRYPTION_KEY não configurada. " +
        "Defina a variável de ambiente ENCRYPTION_KEY com uma chave de 64 caracteres hexadecimais (256 bits)."
      );
    }

    // Suporta chave em formato hexadecimal (64 chars) ou base64 (44 chars)
    if (keyEnv.length === 64 && /^[0-9a-fA-F]+$/.test(keyEnv)) {
      this.key = Buffer.from(keyEnv, "hex");
    } else if (keyEnv.length === 44) {
      this.key = Buffer.from(keyEnv, "base64");
    } else {
      throw new Error(
        "[EncryptionService] ENCRYPTION_KEY inválida. " +
        "Deve ter 64 caracteres hexadecimais ou 44 caracteres base64."
      );
    }

    if (this.key.length !== KEY_LENGTH) {
      throw new Error(
        `[EncryptionService] Chave deve ter ${KEY_LENGTH} bytes (256 bits). ` +
        `Recebido: ${this.key.length} bytes.`
      );
    }

    this.initialized = true;
    console.log("[EncryptionService] Inicializado com sucesso.");
  }

  /**
   * Criptografa um texto plano usando AES-256-GCM.
   * 
   * @param plaintext - Texto a ser criptografado
   * @returns Texto cifrado no formato "enc:v1:iv:authTag:ciphertext" (Base64)
   * @throws Error se a chave não estiver configurada
   * 
   * @example
   * const encrypted = encryptionService.encrypt("123.456.789-00");
   * // Retorna: "enc:v1:abc123...:def456...:ghi789..."
   */
  encrypt(plaintext: string): string {
    // Retorna vazio se input for vazio ou nulo
    if (!plaintext || plaintext.trim() === "") {
      return "";
    }

    // Evita re-criptografia de dados já criptografados
    if (this.isEncrypted(plaintext)) {
      console.warn("[EncryptionService] Tentativa de re-criptografar dados já criptografados. Retornando original.");
      return plaintext;
    }

    this.initialize();

    // Gera IV aleatório (12 bytes)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Cria cipher
    const cipher = crypto.createCipheriv(ALGORITHM, this.key!, iv);

    // Criptografa
    const encrypted = Buffer.concat([
      cipher.update(plaintext, ENCODING),
      cipher.final(),
    ]);

    // Obtém auth tag
    const authTag = cipher.getAuthTag();

    // Formata saída: prefixo:iv:authTag:ciphertext (tudo em base64)
    const result = [
      ENCRYPTED_PREFIX.slice(0, -1), // Remove o ":" final pois já está no join
      iv.toString(OUTPUT_ENCODING),
      authTag.toString(OUTPUT_ENCODING),
      encrypted.toString(OUTPUT_ENCODING),
    ].join(":");

    return result;
  }

  /**
   * Descriptografa um texto cifrado.
   * 
   * @param ciphertext - Texto cifrado no formato "enc:v1:iv:authTag:ciphertext"
   * @returns Texto plano original
   * @throws Error se o formato for inválido ou a autenticação falhar
   * 
   * @example
   * const decrypted = encryptionService.decrypt(encrypted);
   * // Retorna: "123.456.789-00"
   */
  decrypt(ciphertext: string): string {
    // Retorna vazio se input for vazio ou nulo
    if (!ciphertext || ciphertext.trim() === "") {
      return "";
    }

    // Se não estiver criptografado, retorna o original
    if (!this.isEncrypted(ciphertext)) {
      console.warn("[EncryptionService] Tentativa de descriptografar dados não criptografados. Retornando original.");
      return ciphertext;
    }

    this.initialize();

    // Parse do formato: enc:v1:iv:authTag:ciphertext
    const parts = ciphertext.split(":");
    
    if (parts.length !== 5) {
      throw new Error(
        `[EncryptionService] Formato de texto cifrado inválido. ` +
        `Esperado 5 partes, recebido ${parts.length}.`
      );
    }

    const [prefix, version, ivBase64, authTagBase64, encryptedBase64] = parts;

    // Valida prefixo e versão
    if (prefix !== "enc" || version !== "v1") {
      throw new Error(
        `[EncryptionService] Prefixo ou versão inválidos: ${prefix}:${version}`
      );
    }

    // Decodifica componentes
    const iv = Buffer.from(ivBase64, OUTPUT_ENCODING);
    const authTag = Buffer.from(authTagBase64, OUTPUT_ENCODING);
    const encrypted = Buffer.from(encryptedBase64, OUTPUT_ENCODING);

    // Valida tamanhos
    if (iv.length !== IV_LENGTH) {
      throw new Error(
        `[EncryptionService] IV inválido. Esperado ${IV_LENGTH} bytes, recebido ${iv.length}.`
      );
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `[EncryptionService] Auth Tag inválido. Esperado ${AUTH_TAG_LENGTH} bytes, recebido ${authTag.length}.`
      );
    }

    // Cria decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key!, iv);
    decipher.setAuthTag(authTag);

    // Descriptografa
    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString(ENCODING);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unsupported state")) {
        throw new Error(
          "[EncryptionService] Falha na autenticação. " +
          "Os dados podem ter sido adulterados ou a chave está incorreta."
        );
      }
      throw error;
    }
  }

  /**
   * Verifica se um texto está criptografado (tem o prefixo correto).
   * 
   * @param text - Texto a verificar
   * @returns true se o texto estiver no formato criptografado
   */
  isEncrypted(text: string): boolean {
    return text.startsWith(ENCRYPTED_PREFIX);
  }

  /**
   * Criptografa múltiplos campos de um objeto.
   * 
   * @param obj - Objeto com campos a criptografar
   * @param fields - Lista de nomes dos campos a criptografar
   * @returns Novo objeto com os campos especificados criptografados
   * 
   * @example
   * const encrypted = encryptionService.encryptFields(
   *   { cpf: "123.456.789-00", nome: "João", idade: 30 },
   *   ["cpf", "nome"]
   * );
   * // Retorna: { cpf: "enc:v1:...", nome: "enc:v1:...", idade: 30 }
   */
  encryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result = { ...obj };

    for (const field of fields) {
      const value = result[field];
      if (typeof value === "string" && value.trim() !== "") {
        (result as any)[field] = this.encrypt(value);
      }
    }

    return result;
  }

  /**
   * Descriptografa múltiplos campos de um objeto.
   * 
   * @param obj - Objeto com campos criptografados
   * @param fields - Lista de nomes dos campos a descriptografar
   * @returns Novo objeto com os campos especificados descriptografados
   * 
   * @example
   * const decrypted = encryptionService.decryptFields(
   *   { cpf: "enc:v1:...", nome: "enc:v1:...", idade: 30 },
   *   ["cpf", "nome"]
   * );
   * // Retorna: { cpf: "123.456.789-00", nome: "João", idade: 30 }
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result = { ...obj };

    for (const field of fields) {
      const value = result[field];
      if (typeof value === "string" && this.isEncrypted(value)) {
        (result as any)[field] = this.decrypt(value);
      }
    }

    return result;
  }

  /**
   * Gera uma nova chave de criptografia segura.
   * Use este método para gerar a ENCRYPTION_KEY inicial.
   * 
   * @returns Chave de 256 bits em formato hexadecimal (64 caracteres)
   * 
   * @example
   * const newKey = EncryptionService.generateKey();
   * console.log(newKey); // "a1b2c3d4e5f6..."
   */
  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("hex");
  }

  /**
   * Valida se a chave de criptografia está configurada corretamente.
   * Útil para health checks na inicialização do servidor.
   * 
   * @returns true se a chave estiver válida
   * @throws Error se a chave estiver inválida ou ausente
   */
  validateKey(): boolean {
    this.initialize();
    
    // Testa criptografia/descriptografia
    const testValue = "gorgen-health-check-" + Date.now();
    const encrypted = this.encrypt(testValue);
    const decrypted = this.decrypt(encrypted);

    if (decrypted !== testValue) {
      throw new Error(
        "[EncryptionService] Falha no health check. " +
        "O valor descriptografado não corresponde ao original."
      );
    }

    return true;
  }
}

// ==========================================
// EXPORTAÇÃO (SINGLETON)
// ==========================================

/**
 * Instância singleton do serviço de criptografia.
 * Use esta instância em toda a aplicação.
 */
export const encryptionService = new EncryptionService();

/**
 * Exporta a classe para casos especiais (ex: testes).
 */
export { EncryptionService };
