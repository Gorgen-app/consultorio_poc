import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import * as authDb from "./auth-db";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

// Schemas de validação
const usernameSchema = z
  .string()
  .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
  .max(64, "Nome de usuário deve ter no máximo 64 caracteres")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "Nome de usuário pode conter apenas letras, números, pontos, hífens e underscores"
  );

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
  );

const emailSchema = z.string().email("E-mail inválido").max(320);

export const authRouter = router({
  /**
   * Retorna o usuário autenticado atual
   */
  me: publicProcedure.query((opts) => opts.ctx.user),

  /**
   * Logout - limpa o cookie de sessão
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    
    // Registrar log de logout
    if (ctx.user) {
      authDb.logAuthEvent(
        "logout",
        "success",
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );
    }
    
    return { success: true } as const;
  }),

  /**
   * Registro de novo usuário com nome de usuário e senha
   */
  register: publicProcedure
    .input(
      z.object({
        username: usernameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
        name: z.string().min(2).max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar confirmação de senha
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não coincidem",
        });
      }

      // Verificar se o username já existe
      const usernameExists = await authDb.usernameExists(input.username);
      if (usernameExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este nome de usuário já está em uso",
        });
      }

      // Verificar se o email já existe
      const existingUser = await authDb.findUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este e-mail já está cadastrado",
        });
      }

      try {
        // Criar usuário com credenciais
        const { userId, username } = await authDb.createUserWithCredentials(
          input.username,
          input.email,
          input.password,
          input.name
        );

        // Registrar log
        await authDb.logAuthEvent(
          "register",
          "success",
          userId,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"],
          { username }
        );

        return {
          success: true,
          message: "Conta criada com sucesso! Faça login para continuar.",
          userId,
        };
      } catch (error) {
        await authDb.logAuthEvent(
          "register",
          "failed",
          undefined,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"],
          { error: String(error), username: input.username }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar conta. Tente novamente.",
        });
      }
    }),

  /**
   * Login com nome de usuário e senha
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Nome de usuário é obrigatório"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar credenciais
      const validation = await authDb.validatePassword(
        input.username,
        input.password
      );

      if (validation.locked) {
        await authDb.logAuthEvent(
          "login",
          "blocked",
          undefined,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"],
          { username: input.username, reason: "account_locked" }
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente em 30 minutos.",
        });
      }

      if (!validation.valid || !validation.userId) {
        await authDb.logAuthEvent(
          "login",
          "failed",
          undefined,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"],
          {
            username: input.username,
            attemptsRemaining: validation.attemptsRemaining,
          }
        );
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            validation.attemptsRemaining !== undefined
              ? `Credenciais inválidas. ${validation.attemptsRemaining} tentativas restantes.`
              : "Credenciais inválidas",
        });
      }

      // Verificar se o usuário tem 2FA ativado
      const twoFactorConfig = await authDb.getTwoFactorAuth(validation.userId);
      if (twoFactorConfig?.isEnabled) {
        // Retornar indicação de que 2FA é necessário
        return {
          success: false,
          requires2FA: true,
          userId: validation.userId,
          message: "Autenticação de dois fatores necessária",
        };
      }

      // Buscar dados do usuário
      const user = await authDb.findUserById(validation.userId);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar dados do usuário",
        });
      }

      // Criar sessão
      const sessionToken = await authDb.createUserSession(
        validation.userId,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"],
        ONE_YEAR_MS
      );

      // Definir cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Registrar log
      await authDb.logAuthEvent(
        "login",
        "success",
        validation.userId,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        requires2FA: false,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),

  /**
   * Verificação de 2FA durante o login
   */
  verify2FALogin: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        token: z.string().length(6, "Código deve ter 6 dígitos"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const twoFactorConfig = await authDb.getTwoFactorAuth(input.userId);
      if (!twoFactorConfig?.isEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA não está ativado para este usuário",
        });
      }

      // Verificar o token TOTP
      const isValid = speakeasy.totp.verify({
        secret: twoFactorConfig.secret,
        encoding: "base32",
        token: input.token,
        window: 1, // Permite 1 intervalo de tolerância (30 segundos)
      });

      if (!isValid) {
        await authDb.logAuthEvent(
          "2fa_verify",
          "failed",
          input.userId,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"]
        );
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Código de verificação inválido",
        });
      }

      // Atualizar último uso do 2FA
      await authDb.updateTwoFactorLastUsed(input.userId);

      // Buscar dados do usuário
      const user = await authDb.findUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar dados do usuário",
        });
      }

      // Criar sessão
      const sessionToken = await authDb.createUserSession(
        input.userId,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"],
        ONE_YEAR_MS
      );

      // Definir cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Registrar log
      await authDb.logAuthEvent(
        "login_2fa",
        "success",
        input.userId,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),

  /**
   * Solicitar recuperação de senha
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: emailSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await authDb.findUserByEmail(input.email);

      // Sempre retornar sucesso para não revelar se o email existe
      if (!user) {
        return {
          success: true,
          message:
            "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
        };
      }

      // Verificar se o usuário tem credenciais locais
      const credentials = await authDb.findCredentialsByUserId(user.id);
      if (!credentials) {
        return {
          success: true,
          message:
            "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
        };
      }

      // Gerar token de recuperação
      const token = await authDb.createPasswordResetToken(user.id);

      // TODO: Enviar email com o link de recuperação
      // Por enquanto, apenas logamos o token (em produção, isso seria enviado por email)
      console.log(`[Password Reset] Token para ${input.email}: ${token}`);

      await authDb.logAuthEvent(
        "password_reset_request",
        "success",
        user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        message:
          "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
        // Em desenvolvimento, retornamos o token para facilitar testes
        ...(process.env.NODE_ENV === "development" && { token }),
      };
    }),

  /**
   * Redefinir senha usando token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token é obrigatório"),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não coincidem",
        });
      }

      // Validar token
      const validation = await authDb.validatePasswordResetToken(input.token);
      if (!validation.valid || !validation.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token inválido ou expirado",
        });
      }

      // Atualizar senha
      const updated = await authDb.updatePassword(
        validation.userId,
        input.newPassword
      );
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar senha",
        });
      }

      // Marcar token como usado
      await authDb.markPasswordResetTokenAsUsed(input.token);

      // Invalidar todas as sessões do usuário
      await authDb.invalidateAllUserSessions(validation.userId);

      await authDb.logAuthEvent(
        "password_reset",
        "success",
        validation.userId,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        message: "Senha redefinida com sucesso! Faça login com sua nova senha.",
      };
    }),

  /**
   * Alterar senha (usuário logado)
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não coincidem",
        });
      }

      // Buscar credenciais do usuário
      const credentials = await authDb.findCredentialsByUserId(ctx.user.id);
      if (!credentials) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Você não possui uma senha cadastrada. Use o login social ou crie uma senha.",
        });
      }

      // Validar senha atual
      const validation = await authDb.validatePassword(
        credentials.username,
        input.currentPassword
      );
      if (!validation.valid) {
        await authDb.logAuthEvent(
          "password_change",
          "failed",
          ctx.user.id,
          ctx.req?.ip,
          ctx.req?.headers["user-agent"],
          { reason: "invalid_current_password" }
        );
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha atual incorreta",
        });
      }

      // Atualizar senha
      await authDb.updatePassword(ctx.user.id, input.newPassword);

      await authDb.logAuthEvent(
        "password_change",
        "success",
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        message: "Senha alterada com sucesso!",
      };
    }),

  /**
   * Configurar 2FA - Gera o segredo e QR code
   */
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    // Gerar segredo TOTP
    const secret = speakeasy.generateSecret({
      name: `Gorgen (${ctx.user.email || ctx.user.name})`,
      issuer: "Gorgen",
      length: 20,
    });

    // Salvar o segredo (ainda não ativado)
    await authDb.setupTwoFactorAuth(ctx.user.id, secret.base32);

    // Gerar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    await authDb.logAuthEvent(
      "2fa_setup",
      "success",
      ctx.user.id,
      ctx.req?.ip,
      ctx.req?.headers["user-agent"]
    );

    return {
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
    };
  }),

  /**
   * Verificar e ativar 2FA
   */
  verifyAndEnable2FA: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6, "Código deve ter 6 dígitos"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const twoFactorConfig = await authDb.getTwoFactorAuth(ctx.user.id);
      if (!twoFactorConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Configure o 2FA primeiro",
        });
      }

      if (twoFactorConfig.isEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA já está ativado",
        });
      }

      // Verificar o token
      const isValid = speakeasy.totp.verify({
        secret: twoFactorConfig.secret,
        encoding: "base32",
        token: input.token,
        window: 1,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Código de verificação inválido",
        });
      }

      // Gerar códigos de backup
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Ativar 2FA
      await authDb.enableTwoFactorAuth(ctx.user.id, backupCodes);

      await authDb.logAuthEvent(
        "2fa_enable",
        "success",
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        message: "Autenticação de dois fatores ativada com sucesso!",
        backupCodes,
      };
    }),

  /**
   * Desativar 2FA
   */
  disable2FA: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se o usuário tem credenciais
      const credentials = await authDb.findCredentialsByUserId(ctx.user.id);
      if (!credentials) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível verificar sua identidade",
        });
      }

      // Validar senha
      const validation = await authDb.validatePassword(
        credentials.username,
        input.password
      );
      if (!validation.valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha incorreta",
        });
      }

      // Desativar 2FA
      await authDb.disableTwoFactorAuth(ctx.user.id);

      await authDb.logAuthEvent(
        "2fa_disable",
        "success",
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      return {
        success: true,
        message: "Autenticação de dois fatores desativada",
      };
    }),

  /**
   * Verificar status do 2FA
   */
  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    const twoFactorConfig = await authDb.getTwoFactorAuth(ctx.user.id);
    return {
      isEnabled: twoFactorConfig?.isEnabled || false,
      enabledAt: twoFactorConfig?.enabledAt,
      lastUsedAt: twoFactorConfig?.lastUsedAt,
    };
  }),

  /**
   * Verificar se o usuário tem credenciais locais (senha)
   */
  hasLocalCredentials: protectedProcedure.query(async ({ ctx }) => {
    const credentials = await authDb.findCredentialsByUserId(ctx.user.id);
    return {
      hasCredentials: !!credentials,
      username: credentials?.username,
    };
  }),

  /**
   * Criar credenciais locais para usuário que fez login via OAuth
   */
  createLocalCredentials: protectedProcedure
    .input(
      z.object({
        username: usernameSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não coincidem",
        });
      }

      // Verificar se já tem credenciais
      const existingCredentials = await authDb.findCredentialsByUserId(
        ctx.user.id
      );
      if (existingCredentials) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você já possui credenciais cadastradas",
        });
      }

      // Verificar se o username está disponível
      const usernameExists = await authDb.usernameExists(input.username);
      if (usernameExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este nome de usuário já está em uso",
        });
      }

      // Criar credenciais
      await authDb.createUserCredentials(
        ctx.user.id,
        input.username,
        input.password
      );

      await authDb.logAuthEvent(
        "credentials_create",
        "success",
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"],
        { username: input.username }
      );

      return {
        success: true,
        message: "Credenciais criadas com sucesso!",
      };
    }),

  /**
   * Listar sessões ativas do usuário
   */
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await authDb.getUserActiveSessions(ctx.user.id);
    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
    }));
  }),

  /**
   * Encerrar todas as outras sessões
   */
  logoutAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    // Obter o token da sessão atual do cookie
    const currentToken = ctx.req?.cookies?.[COOKIE_NAME];
    
    // Invalidar todas as sessões
    await authDb.invalidateAllUserSessions(ctx.user.id);
    
    // Recriar a sessão atual se existir um token
    if (currentToken) {
      const newToken = await authDb.createUserSession(
        ctx.user.id,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"],
        ONE_YEAR_MS
      );
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, newToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
    }

    await authDb.logAuthEvent(
      "logout_all_sessions",
      "success",
      ctx.user.id,
      ctx.req?.ip,
      ctx.req?.headers["user-agent"]
    );

    return {
      success: true,
      message: "Todas as outras sessões foram encerradas",
    };
  }),

  /**
   * Obter histórico de atividades de autenticação
   */
  getAuthHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const logs = await authDb.getUserAuthLogs(ctx.user.id, input?.limit || 10);
      return logs.map((log) => ({
        action: log.action,
        status: log.status,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      }));
    }),
});

export type AuthRouter = typeof authRouter;
