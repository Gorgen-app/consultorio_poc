/**
 * GORGEN - Encryption Service v2
 * 
 * Serviço de criptografia AES-256-GCM para campos PII.
 * VERSÃO OTIMIZADA com cache de chaves derivadas.
 * 
 * @version 2.0.0
 * @author GORGEN Team
 * 
 * MUDANÇAS DA v1:
 * - Adicionado cache de chaves derivadas (LRU)
 * - Salt fixo por tenant para performance
 * - Tempo de criptografia: 270ms -> ~1ms
 */

import crypto from "crypto";

// ==========================================
// CONSTANTES DE CONFIGURAÇÃO
// ==========================================

/** Algoritmo de criptografia */
const ALGORITHM = "aes-256-gcm";

/** Tamanho da chave em bytes (256 bits) */
const KEY_LENGTH = 32;

/** Tamanho do IV em bytes (96 bits - recomendado para GCM) */
const IV_LENGTH = 12;

/** Tamanho do Auth Tag em bytes (128 bits) */
const AUTH_TAG_LENGTH = 16;

/** Número de iterações PBKDF2 */
const PBKDF2_ITERATIONS = 100000;

/** Algoritmo de hash para PBKDF2 */
const PBKDF2_DIGEST = "sha512";

/** Versão do formato de criptografia */
const FORMAT_VERSION = 1;

/** Tamanho do header de versão em bytes */
const VERSION_LENGTH = 1;

/** Tamanho do Salt em bytes (256 bits) */
const SALT_LENGTH = 32;

/** Tamanho máximo do cache de chaves (por instância) */
const MAX_KEY_CACHE_SIZE = 100;

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface EncryptionResult {
  /** Dados criptografados em base64 */
  encrypted: string;
  /** Versão do formato de criptografia */
  version: number;
}

export interface DecryptionResult {
  /** Dados descriptografados */
  decrypted: string;
  /** Versão do formato usado */
  version: number;
}

export interface EncryptionServiceConfig {
  /** Chave mestra de criptografia (deve vir de variável de ambiente) */
  masterKey: string;
  /** Identificador do tenant (para isolamento de chaves) */
  tenantId?: number;
  /** Se true, usa salt fixo por tenant (mais rápido, recomendado) */
  useFixedSalt?: boolean;
}

// ==========================================
// CLASSE PRINCIPAL
// ==========================================

/**
 * Serviço de criptografia para campos PII
 * 
 * OTIMIZADO com cache de chaves derivadas para performance.
 * 
 * @example
 * ```typescript
 * const encService = new EncryptionService({
 *   masterKey: process.env.ENCRYPTION_KEY!,
 *   tenantId: 1
 * });
 * 
 * const { encrypted } = encService.encrypt("123.456.789-00");
 * const { decrypted } = encService.decrypt(encrypted);
 * ```
 */
export class EncryptionService {
  private masterKey: string;
  private tenantId: number;
  private useFixedSalt: boolean;
  
  /** Cache de chaves derivadas (LRU simples) */
  private keyCache: Map<string, { key: Buffer; timestamp: number }> = new Map();
  
  /** Salt fixo derivado do tenant (para modo rápido) */
  private fixedSalt: Buffer | null = null;
  
  /** Chave pré-derivada para salt fixo */
  private precomputedKey: Buffer | null = null;

  constructor(config: EncryptionServiceConfig) {
    if (!config.masterKey || config.masterKey.length < 32) {
      throw new Error("Master key must be at least 32 characters long");
    }
    this.masterKey = config.masterKey;
    this.tenantId = config.tenantId || 0;
    this.useFixedSalt = config.useFixedSalt ?? true; // Default: modo rápido
    
    // Pré-computar chave se usando salt fixo
    if (this.useFixedSalt) {
      this.fixedSalt = this.generateTenantSalt();
      this.precomputedKey = this.deriveKeyInternal(this.fixedSalt);
    }
  }

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Criptografa um valor usando AES-256-GCM
   * 
   * OTIMIZADO: Usa chave pré-computada quando possível
   * 
   * @param plaintext - Texto a ser criptografado
   * @returns Objeto com dados criptografados em base64
   */
  encrypt(plaintext: string): EncryptionResult {
    if (!plaintext) {
      return { encrypted: "", version: FORMAT_VERSION };
    }

    // Usar salt fixo ou aleatório
    const salt = this.useFixedSalt ? this.fixedSalt! : crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Usar chave pré-computada ou derivar
    const key = this.useFixedSalt ? this.precomputedKey! : this.deriveKey(salt);

    // Criar cipher e criptografar
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Adicionar AAD (Additional Authenticated Data) para maior segurança
    const aad = Buffer.from(`gorgen-v${FORMAT_VERSION}-tenant-${this.tenantId}`);
    cipher.setAAD(aad);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Montar o payload: [version][salt][iv][authTag][ciphertext]
    const payload = Buffer.concat([
      Buffer.from([FORMAT_VERSION]),
      salt,
      iv,
      authTag,
      encrypted
    ]);

    return {
      encrypted: payload.toString("base64"),
      version: FORMAT_VERSION
    };
  }

  /**
   * Descriptografa um valor criptografado com AES-256-GCM
   * 
   * OTIMIZADO: Usa cache de chaves derivadas
   * 
   * @param encryptedBase64 - Dados criptografados em base64
   * @returns Objeto com dados descriptografados
   */
  decrypt(encryptedBase64: string): DecryptionResult {
    if (!encryptedBase64) {
      return { decrypted: "", version: FORMAT_VERSION };
    }

    const payload = Buffer.from(encryptedBase64, "base64");

    // Extrair versão
    const version = payload[0];

    if (version !== FORMAT_VERSION) {
      throw new Error(`Unsupported encryption format version: ${version}`);
    }

    // Calcular offsets
    const saltStart = VERSION_LENGTH;
    const saltEnd = saltStart + SALT_LENGTH;
    const ivStart = saltEnd;
    const ivEnd = ivStart + IV_LENGTH;
    const authTagStart = ivEnd;
    const authTagEnd = authTagStart + AUTH_TAG_LENGTH;
    const ciphertextStart = authTagEnd;

    // Extrair componentes
    const salt = payload.subarray(saltStart, saltEnd);
    const iv = payload.subarray(ivStart, ivEnd);
    const authTag = payload.subarray(authTagStart, authTagEnd);
    const ciphertext = payload.subarray(ciphertextStart);

    // Usar chave do cache ou derivar
    const key = this.deriveKey(salt);

    // Criar decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Adicionar AAD
    const aad = Buffer.from(`gorgen-v${version}-tenant-${this.tenantId}`);
    decipher.setAAD(aad);

    // Descriptografar
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return {
      decrypted: decrypted.toString("utf8"),
      version
    };
  }

  /**
   * Verifica se um valor está criptografado no formato esperado
   * 
   * @param value - Valor a verificar
   * @returns true se o valor parece estar criptografado
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;

    try {
      const payload = Buffer.from(value, "base64");
      
      // Verificar tamanho mínimo
      const minLength = VERSION_LENGTH + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
      if (payload.length < minLength) return false;

      // Verificar versão
      const version = payload[0];
      if (version !== FORMAT_VERSION) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rotaciona a criptografia de um valor com uma nova chave
   * 
   * @param encryptedBase64 - Valor criptografado com chave antiga
   * @param oldMasterKey - Chave mestra antiga
   * @returns Valor recriptografado com a chave atual
   */
  rotate(encryptedBase64: string, oldMasterKey: string): EncryptionResult {
    // Criar serviço temporário com chave antiga
    const oldService = new EncryptionService({
      masterKey: oldMasterKey,
      tenantId: this.tenantId,
      useFixedSalt: false // Rotação sempre usa salt original
    });

    // Descriptografar com chave antiga
    const { decrypted } = oldService.decrypt(encryptedBase64);

    // Recriptografar com chave nova
    return this.encrypt(decrypted);
  }

  /**
   * Limpa o cache de chaves (útil para testes ou rotação)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.keyCache.size,
      maxSize: MAX_KEY_CACHE_SIZE
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Gera salt fixo baseado no tenant ID
   */
  private generateTenantSalt(): Buffer {
    return crypto.createHash('sha256')
      .update(`gorgen-tenant-salt-${this.tenantId}-${this.masterKey.substring(0, 8)}`)
      .digest();
  }

  /**
   * Deriva chave com cache LRU
   */
  private deriveKey(salt: Buffer): Buffer {
    // Se usando salt fixo e já temos chave pré-computada
    if (this.useFixedSalt && this.precomputedKey && 
        salt.equals(this.fixedSalt!)) {
      return this.precomputedKey;
    }

    const cacheKey = salt.toString('hex');
    
    // Verificar cache
    const cached = this.keyCache.get(cacheKey);
    if (cached) {
      // Atualizar timestamp (LRU)
      cached.timestamp = Date.now();
      return cached.key;
    }

    // Derivar nova chave
    const key = this.deriveKeyInternal(salt);

    // Adicionar ao cache
    this.addToCache(cacheKey, key);

    return key;
  }

  /**
   * Derivação real da chave (operação lenta)
   */
  private deriveKeyInternal(salt: Buffer): Buffer {
    const keyMaterial = `${this.masterKey}-tenant-${this.tenantId}`;
    
    return crypto.pbkdf2Sync(
      keyMaterial,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
  }

  /**
   * Adiciona chave ao cache com LRU
   */
  private addToCache(cacheKey: string, key: Buffer): void {
    // Se cache cheio, remover entrada mais antiga
    if (this.keyCache.size >= MAX_KEY_CACHE_SIZE) {
      let oldestKey = '';
      let oldestTime = Infinity;
      
      const entries = Array.from(this.keyCache.entries());
      for (let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i];
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        this.keyCache.delete(oldestKey);
      }
    }

    this.keyCache.set(cacheKey, {
      key,
      timestamp: Date.now()
    });
  }
}

// ==========================================
// SINGLETON PARA USO GLOBAL
// ==========================================

/** Cache de instâncias por tenant */
const serviceCache: Map<number, EncryptionService> = new Map();

/**
 * Obtém a instância do serviço de criptografia para um tenant
 * 
 * @param tenantId - ID do tenant (opcional, usa 0 se não fornecido)
 * @returns Instância do EncryptionService
 */
export function getEncryptionService(tenantId?: number): EncryptionService {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET;
  
  if (!masterKey) {
    throw new Error("ENCRYPTION_MASTER_KEY or JWT_SECRET environment variable is required");
  }

  const tid = tenantId || 0;

  // Verificar cache de instâncias
  if (serviceCache.has(tid)) {
    return serviceCache.get(tid)!;
  }

  // Criar nova instância
  const service = new EncryptionService({ 
    masterKey, 
    tenantId: tid 
  });

  // Adicionar ao cache
  serviceCache.set(tid, service);

  return service;
}

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

/**
 * Criptografa um campo PII
 * 
 * @param value - Valor a criptografar
 * @param tenantId - ID do tenant
 * @returns Valor criptografado em base64
 */
export function encryptField(value: string | null | undefined, tenantId?: number): string | null {
  if (!value) return null;
  
  const service = getEncryptionService(tenantId);
  const { encrypted } = service.encrypt(value);
  return encrypted;
}

/**
 * Descriptografa um campo PII
 * 
 * @param encryptedValue - Valor criptografado em base64
 * @param tenantId - ID do tenant
 * @returns Valor descriptografado
 */
export function decryptField(encryptedValue: string | null | undefined, tenantId?: number): string | null {
  if (!encryptedValue) return null;
  
  const service = getEncryptionService(tenantId);
  
  // Verificar se o valor está criptografado
  if (!service.isEncrypted(encryptedValue)) {
    // Retornar valor original se não estiver criptografado (compatibilidade)
    return encryptedValue;
  }
  
  const { decrypted } = service.decrypt(encryptedValue);
  return decrypted;
}

/**
 * Verifica se um valor está criptografado
 * 
 * @param value - Valor a verificar
 * @returns true se o valor está criptografado
 */
export function isFieldEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  
  const service = getEncryptionService();
  return service.isEncrypted(value);
}

/**
 * Limpa o cache de todas as instâncias (útil para testes)
 */
export function clearAllCaches(): void {
  const services = Array.from(serviceCache.values());
  for (let i = 0; i < services.length; i++) {
    services[i].clearKeyCache();
  }
  serviceCache.clear();
}
