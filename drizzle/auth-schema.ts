import { int, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Extensão da tabela de usuários para autenticação com senha
 * Esta tabela armazena credenciais locais para usuários que optam por login com senha
 */
export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  passwordChangedAt: timestamp("password_changed_at").defaultNow(),
  failedLoginAttempts: int("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_credentials_user_id").on(table.userId),
  usernameIdx: index("idx_user_credentials_username").on(table.username),
}));

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

/**
 * Tabela de tokens para recuperação de senha
 * Tokens são de uso único e expiram após um período determinado
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_password_reset_tokens_user_id").on(table.userId),
  tokenIdx: index("idx_password_reset_tokens_token").on(table.token),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Tabela de configuração de autenticação de dois fatores (2FA)
 * Armazena os segredos TOTP para cada usuário que ativa o 2FA
 */
export const twoFactorAuth = mysqlTable("two_factor_auth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id).unique(),
  secret: varchar("secret", { length: 255 }).notNull(), // Segredo TOTP criptografado
  isEnabled: boolean("is_enabled").default(false).notNull(),
  backupCodes: text("backup_codes"), // Códigos de backup criptografados (JSON array)
  enabledAt: timestamp("enabled_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_two_factor_auth_user_id").on(table.userId),
}));

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

/**
 * Tabela de sessões de login
 * Permite rastrear sessões ativas e implementar logout de todas as sessões
 */
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_sessions_user_id").on(table.userId),
  tokenIdx: index("idx_user_sessions_token").on(table.sessionToken),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Tabela de logs de autenticação
 * Registra todas as tentativas de login para auditoria e segurança
 */
export const authLogs = mysqlTable("auth_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // login, logout, password_change, 2fa_enable, etc.
  status: varchar("status", { length: 20 }).notNull(), // success, failed, blocked
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  details: text("details"), // JSON com detalhes adicionais
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_auth_logs_user_id").on(table.userId),
  actionIdx: index("idx_auth_logs_action").on(table.action),
  createdAtIdx: index("idx_auth_logs_created_at").on(table.createdAt),
}));

export type AuthLog = typeof authLogs.$inferSelect;
export type InsertAuthLog = typeof authLogs.$inferInsert;
