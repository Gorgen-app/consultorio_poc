/**
 * GORGEN - Serviço de Hashing para Buscas Seguras
 * 
 * Este módulo implementa HMAC-SHA256 para permitir buscas em campos
 * criptografados sem expor os dados originais.
 * 
 * Características:
 * - HMAC-SHA256 com chave secreta
 * - Hash tenant-specific (inclui tenantId no cálculo)
 * - Determinístico (mesmo input = mesmo output)
 * - Irreversível (não é possível recuperar o dado original)
 * 
 * Uso principal: Busca de pacientes por CPF em campos criptografados.
 * 
 * @version 1.0.0
 * @date 2026-01-26
 */

import crypto from "crypto";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const ALGORITHM = "sha256";
const OUTPUT_ENCODING: BufferEncoding = "hex";
const HASH_LENGTH = 64; // SHA256 em hex = 64 caracteres

// ==========================================
// CLASSE PRINCIPAL
// ==========================================

/**
 * Serviço singleton para geração de hashes seguros para buscas.
 * 
 * O hash é tenant-specific, ou seja, o mesmo CPF gera hashes diferentes
 * em tenants diferentes, impedindo a correlação de pacientes entre clínicas.
 * 
 * Uso:
 * ```typescript
 * import { hashingService } from "./services/HashingService";
 * 
 * // Gerar hash para busca
 * const cpfHash = hashingService.createHash("123.456.789-00", tenantId);
 * 
 * // Buscar no banco
 * const paciente = await db.query.pacientes.findFirst({
 *   where: eq(pacientes.cpf_hash, cpfHash)
 * });
 * ```
 */
class HashingService {
  private secretKey: Buffer | null = null;
  private initialized = false;

  /**
   * Inicializa o serviço com a chave secreta do HMAC.
   * Chamado automaticamente na primeira operação.
   */
  private initialize(): void {
    if (this.initialized) return;

    const keyEnv = process.env.HMAC_SECRET_KEY;

    if (!keyEnv) {
      throw new Error(
        "[HashingService] HMAC_SECRET_KEY não configurada. " +
        "Defina a variável de ambiente HMAC_SECRET_KEY com uma chave secreta."
      );
    }

    // Aceita chave em qualquer formato (será convertida para buffer)
    this.secretKey = Buffer.from(keyEnv, "utf8");

    if (this.secretKey.length < 32) {
      console.warn(
        "[HashingService] HMAC_SECRET_KEY tem menos de 32 bytes. " +
        "Recomenda-se uma chave de pelo menos 256 bits para segurança adequada."
      );
    }

    this.initialized = true;
    console.log("[HashingService] Inicializado com sucesso.");
  }

  /**
   * Cria um hash HMAC-SHA256 de um valor, incluindo o tenantId para
   * garantir isolamento entre tenants.
   * 
   * @param value - Valor a ser hasheado (ex: CPF)
   * @param tenantId - ID do tenant para isolamento
   * @returns Hash em formato hexadecimal (64 caracteres)
   * 
   * @example
   * const hash = hashingService.createHash("123.456.789-00", 1);
   * // Retorna: "a1b2c3d4e5f6..." (64 caracteres)
   */
  createHash(value: string, tenantId: number | string): string {
    // Retorna string vazia se input for vazio ou nulo
    if (!value || value.trim() === "") {
      return "";
    }

    this.initialize();

    // Normaliza o valor (remove espaços, converte para minúsculas)
    const normalizedValue = this.normalizeValue(value);

    // Combina valor + tenantId para hash tenant-specific
    const dataToHash = `${tenantId}:${normalizedValue}`;

    // Cria HMAC
    const hmac = crypto.createHmac(ALGORITHM, this.secretKey!);
    hmac.update(dataToHash, "utf8");

    return hmac.digest(OUTPUT_ENCODING);
  }

  /**
   * Cria um hash sem incluir o tenantId.
   * 
   * ⚠️ ATENÇÃO: Use apenas para casos especiais onde o isolamento
   * entre tenants não é necessário (ex: hash de senhas).
   * 
   * @param value - Valor a ser hasheado
   * @returns Hash em formato hexadecimal (64 caracteres)
   */
  createGlobalHash(value: string): string {
    if (!value || value.trim() === "") {
      return "";
    }

    this.initialize();

    const normalizedValue = this.normalizeValue(value);

    const hmac = crypto.createHmac(ALGORITHM, this.secretKey!);
    hmac.update(normalizedValue, "utf8");

    return hmac.digest(OUTPUT_ENCODING);
  }

  /**
   * Verifica se um valor corresponde a um hash existente.
   * 
   * @param value - Valor a verificar (ex: CPF digitado pelo usuário)
   * @param tenantId - ID do tenant
   * @param existingHash - Hash armazenado no banco de dados
   * @returns true se o valor corresponder ao hash
   * 
   * @example
   * const isMatch = hashingService.verifyHash("123.456.789-00", 1, storedHash);
   */
  verifyHash(value: string, tenantId: number | string, existingHash: string): boolean {
    if (!value || !existingHash) {
      return false;
    }

    const computedHash = this.createHash(value, tenantId);
    
    // Comparação em tempo constante para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(existingHash, "hex")
    );
  }

  /**
   * Normaliza um valor antes de hashear.
   * 
   * Para CPF:
   * - Remove pontos e traços
   * - Remove espaços
   * 
   * Para outros valores:
   * - Remove espaços extras
   * - Converte para minúsculas
   * 
   * @param value - Valor a normalizar
   * @returns Valor normalizado
   */
  private normalizeValue(value: string): string {
    // Remove caracteres não numéricos para CPF (detecta pelo padrão)
    if (this.isCpfFormat(value)) {
      return value.replace(/\D/g, "");
    }

    // Para outros valores, apenas trim e lowercase
    return value.trim().toLowerCase();
  }

  /**
   * Verifica se um valor parece ser um CPF (com ou sem formatação).
   */
  private isCpfFormat(value: string): boolean {
    // CPF formatado: 123.456.789-00
    // CPF sem formatação: 12345678900
    const cpfPattern = /^[\d.\-\s]{11,14}$/;
    return cpfPattern.test(value);
  }

  /**
   * Valida se um hash tem o formato correto.
   * 
   * @param hash - Hash a validar
   * @returns true se o hash tiver formato válido (64 caracteres hex)
   */
  isValidHash(hash: string): boolean {
    if (!hash || hash.length !== HASH_LENGTH) {
      return false;
    }

    return /^[0-9a-f]+$/.test(hash);
  }

  /**
   * Gera uma nova chave secreta para HMAC.
   * Use este método para gerar a HMAC_SECRET_KEY inicial.
   * 
   * @returns Chave secreta de 256 bits em formato hexadecimal
   * 
   * @example
   * const newKey = HashingService.generateSecretKey();
   * console.log(newKey); // "a1b2c3d4e5f6..."
   */
  static generateSecretKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Valida se a chave secreta está configurada corretamente.
   * Útil para health checks na inicialização do servidor.
   * 
   * @returns true se a chave estiver válida
   * @throws Error se a chave estiver inválida ou ausente
   */
  validateKey(): boolean {
    this.initialize();

    // Testa geração de hash
    const testValue = "gorgen-health-check";
    const testTenantId = 0;
    const hash1 = this.createHash(testValue, testTenantId);
    const hash2 = this.createHash(testValue, testTenantId);

    // Hash deve ser determinístico
    if (hash1 !== hash2) {
      throw new Error(
        "[HashingService] Falha no health check. " +
        "O hash não é determinístico."
      );
    }

    // Hash deve ter o tamanho correto
    if (hash1.length !== HASH_LENGTH) {
      throw new Error(
        `[HashingService] Falha no health check. ` +
        `Hash tem ${hash1.length} caracteres, esperado ${HASH_LENGTH}.`
      );
    }

    return true;
  }

  /**
   * Demonstra o isolamento entre tenants.
   * Útil para testes e validação.
   * 
   * @param value - Valor a hashear
   * @returns Objeto com hashes para diferentes tenants
   */
  demonstrateTenantIsolation(value: string): { tenant1: string; tenant2: string; areEqual: boolean } {
    const tenant1Hash = this.createHash(value, 1);
    const tenant2Hash = this.createHash(value, 2);

    return {
      tenant1: tenant1Hash,
      tenant2: tenant2Hash,
      areEqual: tenant1Hash === tenant2Hash,
    };
  }
}

// ==========================================
// TIPOS AUXILIARES
// ==========================================

/**
 * Interface para campos que precisam de hash para busca.
 */
export interface HashableField {
  /** Nome do campo original (ex: "cpf") */
  field: string;
  /** Nome do campo de hash (ex: "cpf_hash") */
  hashField: string;
}

/**
 * Campos padrão que precisam de hash no Gorgen.
 */
export const HASHABLE_FIELDS: HashableField[] = [
  { field: "cpf", hashField: "cpf_hash" },
];

// ==========================================
// EXPORTAÇÃO (SINGLETON)
// ==========================================

/**
 * Instância singleton do serviço de hashing.
 * Use esta instância em toda a aplicação.
 */
export const hashingService = new HashingService();

/**
 * Exporta a classe para casos especiais (ex: testes).
 */
export { HashingService };
