/**
 * GORGEN - Crypto Helpers
 * 
 * Funções auxiliares para criptografia/descriptografia de campos PII
 * no db.ts e routers.ts
 * 
 * @version 1.0.0
 * @author GORGEN Team
 */

import { 
  encryptField, 
  decryptField, 
  isFieldEncrypted 
} from "./EncryptionService";

import { 
  hashCPF, 
  hashTelefone, 
  hashEmail 
} from "./HashingService";

// ==========================================
// TIPOS
// ==========================================

export interface PacientePII {
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  responsavelTelefone?: string | null;
  responsavelEmail?: string | null;
}

export interface PacientePIIEncrypted {
  cpf_encrypted?: string | null;
  cpf_hash?: string | null;
  telefone_encrypted?: string | null;
  telefone_hash?: string | null;
  email_encrypted?: string | null;
  email_hash?: string | null;
  responsavel_telefone_encrypted?: string | null;
  responsavel_email_encrypted?: string | null;
}

export interface AtendimentoPII {
  cpfPaciente?: string | null;
  telefonePaciente?: string | null;
  emailPaciente?: string | null;
}

export interface AtendimentoPIIEncrypted {
  cpf_paciente_encrypted?: string | null;
  cpf_paciente_hash?: string | null;
  telefone_paciente_encrypted?: string | null;
  email_paciente_encrypted?: string | null;
}

// ==========================================
// FUNÇÕES DE CRIPTOGRAFIA PARA PACIENTES
// ==========================================

/**
 * Criptografa campos PII de um paciente para inserção/atualização
 * 
 * @param pii - Dados PII em texto plano
 * @param tenantId - ID do tenant
 * @returns Dados criptografados e hashes
 */
export function encryptPacientePII(pii: PacientePII, tenantId: number): PacientePIIEncrypted {
  return {
    cpf_encrypted: encryptField(pii.cpf, tenantId),
    cpf_hash: hashCPF(pii.cpf, tenantId),
    telefone_encrypted: encryptField(pii.telefone, tenantId),
    telefone_hash: hashTelefone(pii.telefone, tenantId),
    email_encrypted: encryptField(pii.email, tenantId),
    email_hash: hashEmail(pii.email, tenantId),
    responsavel_telefone_encrypted: encryptField(pii.responsavelTelefone, tenantId),
    responsavel_email_encrypted: encryptField(pii.responsavelEmail, tenantId),
  };
}

/**
 * Descriptografa campos PII de um paciente para exibição
 * 
 * @param encrypted - Dados criptografados do banco
 * @param tenantId - ID do tenant
 * @returns Dados em texto plano
 */
export function decryptPacientePII(encrypted: PacientePIIEncrypted, tenantId: number): PacientePII {
  return {
    cpf: decryptField(encrypted.cpf_encrypted, tenantId),
    telefone: decryptField(encrypted.telefone_encrypted, tenantId),
    email: decryptField(encrypted.email_encrypted, tenantId),
    responsavelTelefone: decryptField(encrypted.responsavel_telefone_encrypted, tenantId),
    responsavelEmail: decryptField(encrypted.responsavel_email_encrypted, tenantId),
  };
}

/**
 * Prepara dados de paciente para inserção (criptografa PII)
 * 
 * @param data - Dados do paciente com PII em texto plano
 * @param tenantId - ID do tenant
 * @returns Dados prontos para inserção (com PII criptografado)
 */
export function preparePacienteForInsert<T extends PacientePII>(
  data: T, 
  tenantId: number
): Omit<T, keyof PacientePII> & PacientePIIEncrypted {
  const { cpf, telefone, email, responsavelTelefone, responsavelEmail, ...rest } = data;
  
  const encrypted = encryptPacientePII({
    cpf, telefone, email, responsavelTelefone, responsavelEmail
  }, tenantId);

  return {
    ...rest,
    ...encrypted,
  } as Omit<T, keyof PacientePII> & PacientePIIEncrypted;
}

/**
 * Processa dados de paciente do banco (descriptografa PII)
 * 
 * @param row - Registro do banco com PII criptografado
 * @param tenantId - ID do tenant
 * @returns Dados com PII em texto plano
 */
export function processPacienteFromDB<T extends PacientePIIEncrypted>(
  row: T,
  tenantId: number
): Omit<T, keyof PacientePIIEncrypted> & PacientePII {
  const { 
    cpf_encrypted, cpf_hash, 
    telefone_encrypted, telefone_hash,
    email_encrypted, email_hash,
    responsavel_telefone_encrypted,
    responsavel_email_encrypted,
    ...rest 
  } = row;

  const decrypted = decryptPacientePII({
    cpf_encrypted, telefone_encrypted, email_encrypted,
    responsavel_telefone_encrypted, responsavel_email_encrypted
  }, tenantId);

  return {
    ...rest,
    ...decrypted,
  } as Omit<T, keyof PacientePIIEncrypted> & PacientePII;
}

// ==========================================
// FUNÇÕES DE CRIPTOGRAFIA PARA ATENDIMENTOS
// ==========================================

/**
 * Criptografa campos PII de um atendimento
 */
export function encryptAtendimentoPII(pii: AtendimentoPII, tenantId: number): AtendimentoPIIEncrypted {
  return {
    cpf_paciente_encrypted: encryptField(pii.cpfPaciente, tenantId),
    cpf_paciente_hash: hashCPF(pii.cpfPaciente, tenantId),
    telefone_paciente_encrypted: encryptField(pii.telefonePaciente, tenantId),
    email_paciente_encrypted: encryptField(pii.emailPaciente, tenantId),
  };
}

/**
 * Descriptografa campos PII de um atendimento
 */
export function decryptAtendimentoPII(encrypted: AtendimentoPIIEncrypted, tenantId: number): AtendimentoPII {
  return {
    cpfPaciente: decryptField(encrypted.cpf_paciente_encrypted, tenantId),
    telefonePaciente: decryptField(encrypted.telefone_paciente_encrypted, tenantId),
    emailPaciente: decryptField(encrypted.email_paciente_encrypted, tenantId),
  };
}

// ==========================================
// FUNÇÕES DE BUSCA
// ==========================================

/**
 * Gera condição de busca por CPF usando hash
 * 
 * @param cpf - CPF a buscar
 * @param tenantId - ID do tenant
 * @returns Hash para usar na query WHERE cpf_hash = ?
 */
export function getSearchHashCPF(cpf: string, tenantId: number): string | null {
  return hashCPF(cpf, tenantId);
}

/**
 * Gera condição de busca por telefone usando hash
 */
export function getSearchHashTelefone(telefone: string, tenantId: number): string | null {
  return hashTelefone(telefone, tenantId);
}

/**
 * Gera condição de busca por email usando hash
 */
export function getSearchHashEmail(email: string, tenantId: number): string | null {
  return hashEmail(email, tenantId);
}

// ==========================================
// FUNÇÕES DE COMPATIBILIDADE
// ==========================================

/**
 * Verifica se um registro já foi migrado para campos criptografados
 * 
 * @param row - Registro do banco
 * @returns true se já foi migrado
 */
export function isPIIMigrated(row: { pii_migrated?: boolean }): boolean {
  return row.pii_migrated === true;
}

/**
 * Obtém CPF de um registro (compatível com migração)
 * Retorna do campo criptografado se migrado, senão do campo legado
 */
export function getCPFFromRow(
  row: { cpf?: string | null; cpf_encrypted?: string | null; pii_migrated?: boolean },
  tenantId: number
): string | null {
  if (row.pii_migrated && row.cpf_encrypted) {
    return decryptField(row.cpf_encrypted, tenantId);
  }
  return row.cpf || null;
}

/**
 * Obtém telefone de um registro (compatível com migração)
 */
export function getTelefoneFromRow(
  row: { telefone?: string | null; telefone_encrypted?: string | null; pii_migrated?: boolean },
  tenantId: number
): string | null {
  if (row.pii_migrated && row.telefone_encrypted) {
    return decryptField(row.telefone_encrypted, tenantId);
  }
  return row.telefone || null;
}

/**
 * Obtém email de um registro (compatível com migração)
 */
export function getEmailFromRow(
  row: { email?: string | null; email_encrypted?: string | null; pii_migrated?: boolean },
  tenantId: number
): string | null {
  if (row.pii_migrated && row.email_encrypted) {
    return decryptField(row.email_encrypted, tenantId);
  }
  return row.email || null;
}

// ==========================================
// EXPORTAÇÕES ADICIONAIS
// ==========================================

export { 
  encryptField, 
  decryptField, 
  isFieldEncrypted 
} from "./EncryptionService";

export { 
  hashCPF, 
  hashTelefone, 
  hashEmail,
  verifyCPF,
  verifyTelefone,
  verifyEmail
} from "./HashingService";
