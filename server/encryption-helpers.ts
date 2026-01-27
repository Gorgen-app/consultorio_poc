/**
 * GORGEN - Helpers de Criptografia para Pacientes
 * 
 * Este módulo fornece funções auxiliares para criptografar e descriptografar
 * dados sensíveis de pacientes (PII) usando os serviços de criptografia.
 * 
 * @version 1.0.0
 * @date 2026-01-26
 */

import { encryptionService } from "./services/EncryptionService";
import { hashingService } from "./services/HashingService";
import { InsertPaciente, Paciente } from "../drizzle/schema";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

/**
 * Campos que devem ser criptografados em pacientes.
 * Estes campos contêm PII (Personally Identifiable Information).
 */
export const ENCRYPTED_FIELDS = ["cpf", "email", "telefone"] as const;

/**
 * Mapeamento de campos para seus respectivos campos de hash.
 */
export const HASH_FIELD_MAP: Record<string, string> = {
  cpf: "cpfHash",
  email: "emailHash",
  telefone: "telefoneHash",
};

// ==========================================
// FUNÇÕES DE CRIPTOGRAFIA
// ==========================================

/**
 * Verifica se a criptografia está habilitada (chaves configuradas).
 * Retorna false se as variáveis de ambiente não estiverem configuradas.
 */
export function isEncryptionEnabled(): boolean {
  try {
    // Tenta validar as chaves
    const encKeyExists = !!process.env.ENCRYPTION_KEY;
    const hashKeyExists = !!process.env.HMAC_SECRET_KEY;
    return encKeyExists && hashKeyExists;
  } catch {
    return false;
  }
}

/**
 * Criptografa os campos sensíveis de um paciente antes de salvar no banco.
 * Também gera os hashes para busca.
 * 
 * @param tenantId - ID do tenant para isolamento de hash
 * @param data - Dados do paciente a serem criptografados
 * @returns Dados com campos criptografados e hashes gerados
 */
export function encryptPacienteData<T extends Partial<InsertPaciente>>(
  tenantId: number,
  data: T
): T & { cpfHash?: string; emailHash?: string; telefoneHash?: string } {
  // Se criptografia não estiver habilitada, retorna dados originais
  if (!isEncryptionEnabled()) {
    console.warn("[Encryption] Criptografia não habilitada. Dados serão salvos em texto plano.");
    return data as T & { cpfHash?: string; emailHash?: string; telefoneHash?: string };
  }

  const result = { ...data } as T & { cpfHash?: string; emailHash?: string; telefoneHash?: string };

  // Criptografar CPF e gerar hash (apenas se não estiver já criptografado)
  if (data.cpf && typeof data.cpf === "string" && data.cpf.trim() !== "") {
    // Se já está criptografado, não criptografar novamente
    if (data.cpf.startsWith("enc:v1:")) {
      // Manter valor criptografado como está
      result.cpf = data.cpf;
      // Não atualizar hash pois não temos o valor original
    } else {
      result.cpfHash = hashingService.createHash(data.cpf, tenantId);
      result.cpf = encryptionService.encrypt(data.cpf);
    }
  }

  // Criptografar email e gerar hash (apenas se não estiver já criptografado)
  if (data.email && typeof data.email === "string" && data.email.trim() !== "") {
    // Se já está criptografado, não criptografar novamente
    if (data.email.startsWith("enc:v1:")) {
      result.email = data.email;
    } else {
      result.emailHash = hashingService.createHash(data.email, tenantId);
      result.email = encryptionService.encrypt(data.email);
    }
  }

  // Criptografar telefone e gerar hash (apenas se não estiver já criptografado)
  if (data.telefone && typeof data.telefone === "string" && data.telefone.trim() !== "") {
    // Se já está criptografado, não criptografar novamente
    if (data.telefone.startsWith("enc:v1:")) {
      result.telefone = data.telefone;
    } else {
      result.telefoneHash = hashingService.createHash(data.telefone, tenantId);
      result.telefone = encryptionService.encrypt(data.telefone);
    }
  }

  return result;
}

/**
 * Normaliza e criptografa os campos sensíveis de um paciente para atualização.
 * 
 * Esta função resolve o problema de inconsistência de hash quando dados
 * já criptografados são enviados para atualização. Ela:
 * 1. Normaliza todos os dados (descriptografa se necessário)
 * 2. Recalcula os hashes com os valores em texto plano
 * 3. Criptografa novamente de forma consistente
 * 
 * @param tenantId - ID do tenant para isolamento de hash
 * @param data - Dados do paciente a serem normalizados e criptografados
 * @returns Dados com campos criptografados e hashes atualizados
 */
export function normalizeAndEncryptPacienteData<T extends Partial<InsertPaciente>>(
  tenantId: number,
  data: T
): T & { cpfHash?: string; emailHash?: string; telefoneHash?: string } {
  // Se criptografia não estiver habilitada, retorna dados originais
  if (!isEncryptionEnabled()) {
    console.warn("[Encryption] Criptografia não habilitada. Dados serão salvos em texto plano.");
    return data as T & { cpfHash?: string; emailHash?: string; telefoneHash?: string };
  }

  const result = { ...data } as T & { cpfHash?: string; emailHash?: string; telefoneHash?: string };

  // PASSO 1: Normalizar CPF (descriptografar se necessário)
  if (result.cpf && typeof result.cpf === "string" && result.cpf.trim() !== "") {
    let cpfPlainText = result.cpf;
    
    // Se já está criptografado, descriptografar primeiro
    if (result.cpf.startsWith("enc:v1:")) {
      try {
        cpfPlainText = encryptionService.decrypt(result.cpf);
        console.log("[Encryption] CPF normalizado (descriptografado para recriptografar)");
      } catch (error) {
        console.warn("[Encryption] Falha ao normalizar CPF, mantendo valor original:", error);
        cpfPlainText = result.cpf; // Mantém criptografado se falhar
      }
    }
    
    // Agora criptografar e gerar hash (se não estiver criptografado)
    if (!cpfPlainText.startsWith("enc:v1:")) {
      result.cpfHash = hashingService.createHash(cpfPlainText, tenantId);
      result.cpf = encryptionService.encrypt(cpfPlainText);
    }
  }

  // PASSO 2: Normalizar email (descriptografar se necessário)
  if (result.email && typeof result.email === "string" && result.email.trim() !== "") {
    let emailPlainText = result.email;
    
    // Se já está criptografado, descriptografar primeiro
    if (result.email.startsWith("enc:v1:")) {
      try {
        emailPlainText = encryptionService.decrypt(result.email);
        console.log("[Encryption] Email normalizado (descriptografado para recriptografar)");
      } catch (error) {
        console.warn("[Encryption] Falha ao normalizar email, mantendo valor original:", error);
        emailPlainText = result.email;
      }
    }
    
    // Agora criptografar e gerar hash (se não estiver criptografado)
    if (!emailPlainText.startsWith("enc:v1:")) {
      result.emailHash = hashingService.createHash(emailPlainText, tenantId);
      result.email = encryptionService.encrypt(emailPlainText);
    }
  }

  // PASSO 3: Normalizar telefone (descriptografar se necessário)
  if (result.telefone && typeof result.telefone === "string" && result.telefone.trim() !== "") {
    let telefonePlainText = result.telefone;
    
    // Se já está criptografado, descriptografar primeiro
    if (result.telefone.startsWith("enc:v1:")) {
      try {
        telefonePlainText = encryptionService.decrypt(result.telefone);
        console.log("[Encryption] Telefone normalizado (descriptografado para recriptografar)");
      } catch (error) {
        console.warn("[Encryption] Falha ao normalizar telefone, mantendo valor original:", error);
        telefonePlainText = result.telefone;
      }
    }
    
    // Agora criptografar e gerar hash (se não estiver criptografado)
    if (!telefonePlainText.startsWith("enc:v1:")) {
      result.telefoneHash = hashingService.createHash(telefonePlainText, tenantId);
      result.telefone = encryptionService.encrypt(telefonePlainText);
    }
  }

  return result;
}

/**
 * Descriptografa os campos sensíveis de um paciente após ler do banco.
 * 
 * @param paciente - Paciente com dados criptografados
 * @returns Paciente com dados descriptografados
 */
export function decryptPacienteData<T extends Partial<Paciente>>(paciente: T): T {
  // Se criptografia não estiver habilitada, retorna dados originais
  if (!isEncryptionEnabled()) {
    return paciente;
  }

  const result = { ...paciente };

  // Descriptografar CPF
  if (result.cpf && typeof result.cpf === "string") {
    try {
      result.cpf = encryptionService.decrypt(result.cpf);
    } catch (error) {
      console.warn("[Encryption] Falha ao descriptografar CPF:", error);
      // Mantém o valor original se falhar (pode ser dado legado não criptografado)
    }
  }

  // Descriptografar email
  if (result.email && typeof result.email === "string") {
    try {
      result.email = encryptionService.decrypt(result.email);
    } catch (error) {
      console.warn("[Encryption] Falha ao descriptografar email:", error);
    }
  }

  // Descriptografar telefone
  if (result.telefone && typeof result.telefone === "string") {
    try {
      result.telefone = encryptionService.decrypt(result.telefone);
    } catch (error) {
      console.warn("[Encryption] Falha ao descriptografar telefone:", error);
    }
  }

  return result;
}

/**
 * Descriptografa uma lista de pacientes.
 * 
 * @param pacientes - Lista de pacientes com dados criptografados
 * @returns Lista de pacientes com dados descriptografados
 */
export function decryptPacientesList<T extends Partial<Paciente>>(pacientes: T[]): T[] {
  return pacientes.map(p => decryptPacienteData(p));
}

/**
 * Gera o hash de um CPF para busca.
 * 
 * @param cpf - CPF em texto plano
 * @param tenantId - ID do tenant
 * @returns Hash do CPF para busca no banco
 */
export function hashCPFForSearch(cpf: string, tenantId: number): string {
  if (!isEncryptionEnabled()) {
    return cpf; // Retorna CPF original se criptografia não estiver habilitada
  }
  return hashingService.createHash(cpf, tenantId);
}

/**
 * Gera o hash de um email para busca.
 * 
 * @param email - Email em texto plano
 * @param tenantId - ID do tenant
 * @returns Hash do email para busca no banco
 */
export function hashEmailForSearch(email: string, tenantId: number): string {
  if (!isEncryptionEnabled()) {
    return email;
  }
  return hashingService.createHash(email, tenantId);
}

/**
 * Gera o hash de um telefone para busca.
 * 
 * @param telefone - Telefone em texto plano
 * @param tenantId - ID do tenant
 * @returns Hash do telefone para busca no banco
 */
export function hashTelefoneForSearch(telefone: string, tenantId: number): string {
  if (!isEncryptionEnabled()) {
    return telefone;
  }
  return hashingService.createHash(telefone, tenantId);
}
