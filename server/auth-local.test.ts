import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do auth-db para evitar conexão real com o banco
vi.mock("./auth-db", () => ({
  usernameExists: vi.fn(),
  findUserByEmail: vi.fn(),
  createUserWithCredentials: vi.fn(),
  validatePassword: vi.fn(),
  getTwoFactorAuth: vi.fn(),
  findUserById: vi.fn(),
  createUserSession: vi.fn(),
  logAuthEvent: vi.fn(),
  updateTwoFactorLastUsed: vi.fn(),
  findCredentialsByUserId: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findValidPasswordResetToken: vi.fn(),
  invalidatePasswordResetToken: vi.fn(),
  updatePassword: vi.fn(),
  hasLocalCredentials: vi.fn(),
  getUserActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllSessions: vi.fn(),
  generateTwoFactorSecret: vi.fn(),
  enableTwoFactorAuth: vi.fn(),
  disableTwoFactorAuth: vi.fn(),
}));

import * as authDb from "./auth-db";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

function createAuthContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

describe("auth.localAuth - Sistema de Autenticação Local", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register - Registro de Usuário", () => {
    it("deve rejeitar senhas que não coincidem", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "testuser",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "DifferentPassword123",
        })
      ).rejects.toThrow("As senhas não coincidem");
    });

    it("deve rejeitar username já existente", async () => {
      vi.mocked(authDb.usernameExists).mockResolvedValue(true);

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "existinguser",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        })
      ).rejects.toThrow("Este nome de usuário já está em uso");
    });

    it("deve rejeitar email já cadastrado", async () => {
      vi.mocked(authDb.usernameExists).mockResolvedValue(false);
      vi.mocked(authDb.findUserByEmail).mockResolvedValue({
        id: 1,
        email: "existing@example.com",
        name: "Existing User",
        openId: "existing-open-id",
        loginMethod: "local",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "newuser",
          email: "existing@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        })
      ).rejects.toThrow("Este e-mail já está cadastrado");
    });

    it("deve criar usuário com sucesso", async () => {
      vi.mocked(authDb.usernameExists).mockResolvedValue(false);
      vi.mocked(authDb.findUserByEmail).mockResolvedValue(null);
      vi.mocked(authDb.createUserWithCredentials).mockResolvedValue({
        userId: 1,
        username: "newuser",
      });
      vi.mocked(authDb.logAuthEvent).mockResolvedValue();

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.register({
        username: "newuser",
        email: "new@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        name: "New User",
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe(1);
      expect(authDb.createUserWithCredentials).toHaveBeenCalledWith(
        "newuser",
        "new@example.com",
        "Password123",
        "New User"
      );
    });
  });

  describe("login - Login de Usuário", () => {
    it("deve rejeitar credenciais inválidas", async () => {
      vi.mocked(authDb.validatePassword).mockResolvedValue({
        valid: false,
        locked: false,
        attemptsRemaining: 4,
      });
      vi.mocked(authDb.logAuthEvent).mockResolvedValue();

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.login({
          username: "wronguser",
          password: "wrongpassword",
        })
      ).rejects.toThrow(/Credenciais inválidas/);
    });

    it("deve bloquear conta após múltiplas tentativas", async () => {
      vi.mocked(authDb.validatePassword).mockResolvedValue({
        valid: false,
        locked: true,
      });
      vi.mocked(authDb.logAuthEvent).mockResolvedValue();

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.login({
          username: "lockeduser",
          password: "anypassword",
        })
      ).rejects.toThrow(/temporariamente bloqueada/);
    });

    it("deve retornar requires2FA quando 2FA está ativado", async () => {
      vi.mocked(authDb.validatePassword).mockResolvedValue({
        valid: true,
        locked: false,
        userId: 1,
      });
      vi.mocked(authDb.getTwoFactorAuth).mockResolvedValue({
        isEnabled: true,
        secret: "ABCDEFGHIJ",
        userId: 1,
        createdAt: new Date(),
        lastUsedAt: null,
      });

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.login({
        username: "user2fa",
        password: "Password123",
      });

      expect(result.success).toBe(false);
      expect(result.requires2FA).toBe(true);
      expect(result.userId).toBe(1);
    });

    it("deve fazer login com sucesso sem 2FA", async () => {
      vi.mocked(authDb.validatePassword).mockResolvedValue({
        valid: true,
        locked: false,
        userId: 1,
      });
      vi.mocked(authDb.getTwoFactorAuth).mockResolvedValue(null);
      vi.mocked(authDb.findUserById).mockResolvedValue({
        id: 1,
        email: "user@example.com",
        name: "Test User",
        openId: "test-open-id",
        loginMethod: "local",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      vi.mocked(authDb.createUserSession).mockResolvedValue("session-token-123");
      vi.mocked(authDb.logAuthEvent).mockResolvedValue();

      const { ctx, setCookies } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.login({
        username: "testuser",
        password: "Password123",
      });

      expect(result.success).toBe(true);
      expect(result.requires2FA).toBe(false);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(1);
      expect(setCookies).toHaveLength(1);
    });
  });

  describe("requestPasswordReset - Recuperação de Senha", () => {
    it("deve retornar sucesso mesmo para email inexistente (segurança)", async () => {
      vi.mocked(authDb.findUserByEmail).mockResolvedValue(null);

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.requestPasswordReset({
        email: "nonexistent@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Se o e-mail estiver cadastrado");
    });
  });

  describe("hasLocalCredentials - Verificação de Credenciais", () => {
    it("deve retornar hasCredentials false para usuário sem credenciais", async () => {
      vi.mocked(authDb.findCredentialsByUserId).mockResolvedValue(null);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.hasLocalCredentials();

      expect(result.hasCredentials).toBe(false);
      expect(result.username).toBeUndefined();
    });

    it("deve retornar hasCredentials true para usuário com credenciais", async () => {
      vi.mocked(authDb.findCredentialsByUserId).mockResolvedValue({
        id: 1,
        userId: 1,
        username: "testuser",
        passwordHash: "hash",
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.hasLocalCredentials();

      expect(result.hasCredentials).toBe(true);
      expect(result.username).toBe("testuser");
    });
  });

  describe("getActiveSessions - Sessões Ativas", () => {
    it("deve retornar lista de sessões ativas", async () => {
      const mockSessions = [
        {
          id: 1,
          userId: 1,
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          lastActivityAt: new Date(),
        },
      ];
      vi.mocked(authDb.getUserActiveSessions).mockResolvedValue(mockSessions);

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.localAuth.getActiveSessions();

      expect(result).toHaveLength(1);
      expect(result[0].ipAddress).toBe("127.0.0.1");
    });
  });
});

describe("Validação de Schemas", () => {
  describe("username", () => {
    it("deve rejeitar username muito curto", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "ab",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        })
      ).rejects.toThrow(/pelo menos 3 caracteres/);
    });

    it("deve rejeitar username com caracteres inválidos", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "user@name",
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        })
      ).rejects.toThrow(/apenas letras, números/);
    });
  });

  describe("password", () => {
    it("deve rejeitar senha muito curta", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "testuser",
          email: "test@example.com",
          password: "Pass1",
          confirmPassword: "Pass1",
        })
      ).rejects.toThrow(/pelo menos 8 caracteres/);
    });

    it("deve rejeitar senha sem maiúscula", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
      ).rejects.toThrow(/maiúscula.*minúscula.*número/);
    });

    it("deve rejeitar senha sem número", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "testuser",
          email: "test@example.com",
          password: "PasswordABC",
          confirmPassword: "PasswordABC",
        })
      ).rejects.toThrow(/maiúscula.*minúscula.*número/);
    });
  });

  describe("email", () => {
    it("deve rejeitar email inválido", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.localAuth.register({
          username: "testuser",
          email: "invalid-email",
          password: "Password123",
          confirmPassword: "Password123",
        })
      ).rejects.toThrow(/inválido/);
    });
  });
});
