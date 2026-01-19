/**
 * GORGEN - Hashing Service
 * 
 * Serviço de hashing HMAC-SHA256 para permitir buscas em campos criptografados.
 * O hash é determinístico, permitindo comparações exatas.
 * 
 * @version 1.0.0
 * @author GORGEN Team
 */

import crypto from "crypto";

// ==========================================
// CONSTANTES DE CONFIGURAÇÃO
// ==========================================

/** Algoritmo de hash */
const HASH_ALGORITHM = "sha256";

/** Tamanho do hash em bytes */
const HASH_LENGTH = 32;

/** Prefixo para identificar hashes */
const HASH_PREFIX = "gh1_"; // gorgen hash v1

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface HashingServiceConfig {
  /** Chave secreta para HMAC (deve vir de variável de ambiente) */
  secretKey: string;
  /** Identificador do tenant (para isolamento de hashes) */
  tenantId?: number;
}

export interface HashResult {
  /** Hash em formato hexadecimal com prefixo */
  hash: string;
  /** Valor normalizado usado para gerar o hash */
  normalizedValue: string;
}

// ==========================================
// CLASSE PRINCIPAL
// ==========================================

/**
 * Serviço de hashing para campos PII
 * 
 * @example
 * ```typescript
 * const hashService = new HashingService({
 *   secretKey: process.env.HASH_SECRET_KEY!,
 *   tenantId: 1
 * });
 * 
 * const { hash } = hashService.hash("123.456.789-00");
 * // hash = "gh1_a1b2c3d4..."
 * 
 * const isMatch = hashService.verify("123.456.789-00", hash);
 * // isMatch = true
 * ```
 */
export class HashingService {
  private secretKey: string;
  private tenantId: number;

  constructor(config: HashingServiceConfig) {
    if (!config.secretKey || config.secretKey.length < 32) {
      throw new Error("Secret key must be at least 32 characters long");
    }
    this.secretKey = config.secretKey;
    this.tenantId = config.tenantId || 0;
  }

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Gera um hash HMAC-SHA256 de um valor
   * 
   * @param value - Valor a ser hasheado
   * @param fieldName - Nome do campo (para isolamento adicional)
   * @returns Objeto com hash e valor normalizado
   */
  hash(value: string, fieldName: string = "default"): HashResult {
    if (!value) {
      return { hash: "", normalizedValue: "" };
    }

    // Normalizar o valor
    const normalizedValue = this.normalize(value);

    // Criar HMAC com chave derivada
    const key = this.deriveKey(fieldName);
    const hmac = crypto.createHmac(HASH_ALGORITHM, key);
    hmac.update(normalizedValue);

    const hashHex = hmac.digest("hex");

    return {
      hash: `${HASH_PREFIX}${hashHex}`,
      normalizedValue
    };
  }

  /**
   * Verifica se um valor corresponde a um hash
   * 
   * @param value - Valor a verificar
   * @param expectedHash - Hash esperado
   * @param fieldName - Nome do campo
   * @returns true se o valor corresponde ao hash
   */
  verify(value: string, expectedHash: string, fieldName: string = "default"): boolean {
    if (!value || !expectedHash) return false;

    const { hash } = this.hash(value, fieldName);
    
    // Comparação em tempo constante para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(expectedHash)
    );
  }

  /**
   * Verifica se um valor é um hash válido do serviço
   * 
   * @param value - Valor a verificar
   * @returns true se o valor é um hash válido
   */
  isHash(value: string): boolean {
    if (!value) return false;
    
    // Verificar prefixo
    if (!value.startsWith(HASH_PREFIX)) return false;
    
    // Verificar tamanho (prefixo + 64 caracteres hex)
    const expectedLength = HASH_PREFIX.length + (HASH_LENGTH * 2);
    if (value.length !== expectedLength) return false;
    
    // Verificar se o resto é hexadecimal válido
    const hashPart = value.substring(HASH_PREFIX.length);
    return /^[0-9a-f]+$/i.test(hashPart);
  }

  // ==========================================
  // MÉTODOS DE NORMALIZAÇÃO
  // ==========================================

  /**
   * Normaliza um valor para hashing consistente
   * 
   * @param value - Valor a normalizar
   * @returns Valor normalizado
   */
  normalize(value: string): string {
    if (!value) return "";

    return value
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  }

  /**
   * Normaliza um CPF para hashing
   * Remove pontos e traços, mantém apenas números
   * 
   * @param cpf - CPF a normalizar
   * @returns CPF normalizado (apenas números)
   */
  normalizeCPF(cpf: string): string {
    if (!cpf) return "";
    return cpf.replace(/\D/g, "");
  }

  /**
   * Normaliza um telefone para hashing
   * Remove caracteres especiais, mantém apenas números
   * 
   * @param telefone - Telefone a normalizar
   * @returns Telefone normalizado (apenas números)
   */
  normalizeTelefone(telefone: string): string {
    if (!telefone) return "";
    return telefone.replace(/\D/g, "");
  }

  /**
   * Normaliza um email para hashing
   * Lowercase e trim
   * 
   * @param email - Email a normalizar
   * @returns Email normalizado
   */
  normalizeEmail(email: string): string {
    if (!email) return "";
    return email.toLowerCase().trim();
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Deriva uma chave HMAC específica para o campo e tenant
   */
  private deriveKey(fieldName: string): Buffer {
    const keyMaterial = `${this.secretKey}-tenant-${this.tenantId}-field-${fieldName}`;
    
    // Usar SHA-256 para derivar a chave
    return crypto.createHash("sha256")
      .update(keyMaterial)
      .digest();
  }
}

// ==========================================
// SINGLETON PARA USO GLOBAL
// ==========================================

/** Cache de instâncias por tenant */
const serviceCache: Map<number, HashingService> = new Map();

/**
 * Obtém a instância do serviço de hashing para um tenant
 * 
 * OTIMIZADO: Usa cache de instâncias por tenant
 * 
 * @param tenantId - ID do tenant (opcional)
 * @returns Instância do HashingService
 */
export function getHashingService(tenantId?: number): HashingService {
  const secretKey = process.env.HASH_SECRET_KEY || process.env.JWT_SECRET;
  
  if (!secretKey) {
    throw new Error("HASH_SECRET_KEY or JWT_SECRET environment variable is required");
  }

  const tid = tenantId || 0;

  // Verificar cache de instâncias
  if (serviceCache.has(tid)) {
    return serviceCache.get(tid)!;
  }

  // Criar nova instância
  const service = new HashingService({ 
    secretKey, 
    tenantId: tid 
  });

  // Adicionar ao cache
  serviceCache.set(tid, service);

  return service;
}

/**
 * Limpa o cache de instâncias (útil para testes)
 */
export function clearHashingServiceCache(): void {
  serviceCache.clear();
}

// ==========================================
// FUNÇÕES UTILITÁRIAS POR TIPO DE CAMPO
// ==========================================

/**
 * Gera hash de um CPF
 * 
 * @param cpf - CPF a hashear
 * @param tenantId - ID do tenant
 * @returns Hash do CPF
 */
export function hashCPF(cpf: string | null | undefined, tenantId?: number): string | null {
  if (!cpf) return null;
  
  const service = getHashingService(tenantId);
  const normalizedCPF = service.normalizeCPF(cpf);
  const { hash } = service.hash(normalizedCPF, "cpf");
  return hash;
}

/**
 * Gera hash de um telefone
 * 
 * @param telefone - Telefone a hashear
 * @param tenantId - ID do tenant
 * @returns Hash do telefone
 */
export function hashTelefone(telefone: string | null | undefined, tenantId?: number): string | null {
  if (!telefone) return null;
  
  const service = getHashingService(tenantId);
  const normalizedTelefone = service.normalizeTelefone(telefone);
  const { hash } = service.hash(normalizedTelefone, "telefone");
  return hash;
}

/**
 * Gera hash de um email
 * 
 * @param email - Email a hashear
 * @param tenantId - ID do tenant
 * @returns Hash do email
 */
export function hashEmail(email: string | null | undefined, tenantId?: number): string | null {
  if (!email) return null;
  
  const service = getHashingService(tenantId);
  const normalizedEmail = service.normalizeEmail(email);
  const { hash } = service.hash(normalizedEmail, "email");
  return hash;
}

/**
 * Verifica se um CPF corresponde a um hash
 * 
 * @param cpf - CPF a verificar
 * @param expectedHash - Hash esperado
 * @param tenantId - ID do tenant
 * @returns true se corresponde
 */
export function verifyCPF(cpf: string, expectedHash: string, tenantId?: number): boolean {
  if (!cpf || !expectedHash) return false;
  
  const service = getHashingService(tenantId);
  const normalizedCPF = service.normalizeCPF(cpf);
  return service.verify(normalizedCPF, expectedHash, "cpf");
}

/**
 * Verifica se um telefone corresponde a um hash
 * 
 * @param telefone - Telefone a verificar
 * @param expectedHash - Hash esperado
 * @param tenantId - ID do tenant
 * @returns true se corresponde
 */
export function verifyTelefone(telefone: string, expectedHash: string, tenantId?: number): boolean {
  if (!telefone || !expectedHash) return false;
  
  const service = getHashingService(tenantId);
  const normalizedTelefone = service.normalizeTelefone(telefone);
  return service.verify(normalizedTelefone, expectedHash, "telefone");
}

/**
 * Verifica se um email corresponde a um hash
 * 
 * @param email - Email a verificar
 * @param expectedHash - Hash esperado
 * @param tenantId - ID do tenant
 * @returns true se corresponde
 */
export function verifyEmail(email: string, expectedHash: string, tenantId?: number): boolean {
  if (!email || !expectedHash) return false;
  
  const service = getHashingService(tenantId);
  const normalizedEmail = service.normalizeEmail(email);
  return service.verify(normalizedEmail, expectedHash, "email");
}
