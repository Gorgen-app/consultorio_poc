import { eq, and, gt, isNull } from "drizzle-orm";
import { getPooledDb } from "./_core/database";
import { users } from "../drizzle/schema";
import {
  userCredentials,
  passwordResetTokens,
  twoFactorAuth,
  userSessions,
  authLogs,
  type InsertUserCredential,
  type InsertPasswordResetToken,
  type InsertTwoFactorAuth,
  type InsertUserSession,
  type InsertAuthLog,
} from "../drizzle/auth-schema";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// Função auxiliar para obter o db
async function getDb() {
  return await getPooledDb();
}

// ==================== CREDENCIAIS DE USUÁRIO ====================

/**
 * Cria credenciais de login com senha para um usuário existente
 */
export async function createUserCredentials(
  userId: number,
  username: string,
  password: string
): Promise<{ id: number; username: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  const [result] = await db.insert(userCredentials).values({
    userId,
    username: username.toLowerCase().trim(),
    passwordHash,
  });
  
  return { id: result.insertId, username };
}

/**
 * Busca credenciais por nome de usuário
 */
export async function findCredentialsByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  
  const [credential] = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.username, username.toLowerCase().trim()));
  
  return credential || null;
}

/**
 * Busca credenciais por ID do usuário
 */
export async function findCredentialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [credential] = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId));
  
  return credential || null;
}

/**
 * Verifica se o nome de usuário já existe
 */
export async function usernameExists(username: string): Promise<boolean> {
  const credential = await findCredentialsByUsername(username);
  return credential !== null;
}

/**
 * Valida a senha de um usuário
 */
export async function validatePassword(
  username: string,
  password: string
): Promise<{ valid: boolean; userId?: number; locked?: boolean; attemptsRemaining?: number }> {
  const db = await getDb();
  if (!db) return { valid: false };
  
  const credential = await findCredentialsByUsername(username);
  
  if (!credential) {
    return { valid: false };
  }
  
  // Verificar se a conta está bloqueada
  if (credential.lockedUntil && credential.lockedUntil > new Date()) {
    return { valid: false, locked: true };
  }
  
  const isValid = await bcrypt.compare(password, credential.passwordHash);
  
  if (!isValid) {
    // Incrementar tentativas falhas
    const newAttempts = (credential.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
    
    await db
      .update(userCredentials)
      .set({
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
          : null,
      })
      .where(eq(userCredentials.id, credential.id));
    
    return {
      valid: false,
      attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - newAttempts),
      locked: shouldLock,
    };
  }
  
  // Reset tentativas falhas em login bem-sucedido
  if ((credential.failedLoginAttempts ?? 0) > 0) {
    await db
      .update(userCredentials)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(userCredentials.id, credential.id));
  }
  
  return { valid: true, userId: credential.userId };
}

/**
 * Atualiza a senha de um usuário
 */
export async function updatePassword(userId: number, newPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  const result = await db
    .update(userCredentials)
    .set({
      passwordHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(userCredentials.userId, userId));
  
  return result[0].affectedRows > 0;
}

// ==================== TOKENS DE RECUPERAÇÃO DE SENHA ====================

/**
 * Gera um token de recuperação de senha
 */
export async function createPasswordResetToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Invalidar tokens anteriores
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

/**
 * Valida um token de recuperação de senha
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; userId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false };
  
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    );
  
  if (!resetToken) {
    return { valid: false };
  }
  
  return { valid: true, userId: resetToken.userId };
}

/**
 * Marca um token como usado
 */
export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

// ==================== AUTENTICAÇÃO DE DOIS FATORES (2FA) ====================

/**
 * Cria ou atualiza a configuração de 2FA para um usuário
 */
export async function setupTwoFactorAuth(
  userId: number,
  secret: string
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe configuração
  const existing = await getTwoFactorAuth(userId);
  
  if (existing) {
    await db
      .update(twoFactorAuth)
      .set({
        secret,
        isEnabled: false,
        enabledAt: null,
      })
      .where(eq(twoFactorAuth.userId, userId));
    
    return { id: existing.id };
  }
  
  const [result] = await db.insert(twoFactorAuth).values({
    userId,
    secret,
    isEnabled: false,
  });
  
  return { id: result.insertId };
}

/**
 * Busca a configuração de 2FA de um usuário
 */
export async function getTwoFactorAuth(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [config] = await db
    .select()
    .from(twoFactorAuth)
    .where(eq(twoFactorAuth.userId, userId));
  
  return config || null;
}

/**
 * Ativa o 2FA para um usuário
 */
export async function enableTwoFactorAuth(
  userId: number,
  backupCodes?: string[]
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .update(twoFactorAuth)
    .set({
      isEnabled: true,
      enabledAt: new Date(),
      backupCodes: backupCodes ? JSON.stringify(backupCodes) : null,
    })
    .where(eq(twoFactorAuth.userId, userId));
  
  return result[0].affectedRows > 0;
}

/**
 * Desativa o 2FA para um usuário
 */
export async function disableTwoFactorAuth(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .delete(twoFactorAuth)
    .where(eq(twoFactorAuth.userId, userId));
  
  return result[0].affectedRows > 0;
}

/**
 * Atualiza o timestamp de último uso do 2FA
 */
export async function updateTwoFactorLastUsed(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(twoFactorAuth)
    .set({ lastUsedAt: new Date() })
    .where(eq(twoFactorAuth.userId, userId));
}

// ==================== SESSÕES DE USUÁRIO ====================

/**
 * Cria uma nova sessão de usuário
 */
export async function createUserSession(
  userId: number,
  ipAddress?: string,
  userAgent?: string,
  expiresInMs: number = 365 * 24 * 60 * 60 * 1000 // 1 ano por padrão
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  await db.insert(userSessions).values({
    userId,
    sessionToken,
    ipAddress,
    userAgent,
    expiresAt,
  });
  
  return sessionToken;
}

/**
 * Valida uma sessão de usuário
 */
export async function validateUserSession(
  sessionToken: string
): Promise<{ valid: boolean; userId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false };
  
  const [session] = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.sessionToken, sessionToken),
        gt(userSessions.expiresAt, new Date())
      )
    );
  
  if (!session) {
    return { valid: false };
  }
  
  // Atualizar última atividade
  await db
    .update(userSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(userSessions.id, session.id));
  
  return { valid: true, userId: session.userId };
}

/**
 * Invalida uma sessão específica
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(userSessions)
    .where(eq(userSessions.sessionToken, sessionToken));
}

/**
 * Invalida todas as sessões de um usuário
 */
export async function invalidateAllUserSessions(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

/**
 * Lista todas as sessões ativas de um usuário
 */
export async function getUserActiveSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        gt(userSessions.expiresAt, new Date())
      )
    );
}

// ==================== LOGS DE AUTENTICAÇÃO ====================

/**
 * Registra um evento de autenticação
 */
export async function logAuthEvent(
  action: string,
  status: "success" | "failed" | "blocked",
  userId?: number,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(authLogs).values({
    userId,
    action,
    status,
    ipAddress,
    userAgent,
    details: details ? JSON.stringify(details) : null,
  });
}

/**
 * Busca os últimos eventos de autenticação de um usuário
 */
export async function getUserAuthLogs(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(authLogs)
    .where(eq(authLogs.userId, userId))
    .orderBy(authLogs.createdAt)
    .limit(limit);
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Busca um usuário por email
 */
export async function findUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()));
  
  return user || null;
}

/**
 * Busca um usuário por ID
 */
export async function findUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

/**
 * Cria um novo usuário com credenciais locais
 */
export async function createUserWithCredentials(
  username: string,
  email: string,
  password: string,
  name?: string,
  tenantId: number = 1
): Promise<{ userId: number; username: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Gerar um openId único para usuários locais
  const openId = `local_${crypto.randomBytes(16).toString("hex")}`;
  
  // Criar o usuário
  const [userResult] = await db.insert(users).values({
    tenantId,
    openId,
    name: name || username,
    email: email.toLowerCase().trim(),
    loginMethod: "password",
  });
  
  const userId = userResult.insertId;
  
  // Criar as credenciais
  await createUserCredentials(userId, username, password);
  
  return { userId, username };
}
