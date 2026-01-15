import { TRPCError } from "@trpc/server";
import { middleware, protectedProcedure } from "./_core/trpc";
import { temPermissao, type PerfilType, type Funcionalidade } from "../shared/permissions";
import { getUserProfile } from "./db";

/**
 * Middleware que verifica se o usuário tem permissão para a funcionalidade
 */
export const verificaPermissao = (funcionalidade: Funcionalidade) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }

    // Buscar perfil ativo do usuário
    const profile = await getUserProfile(ctx.user.id);
    const perfilAtivo = profile?.perfilAtivo as PerfilType | undefined;

    if (!perfilAtivo) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário não possui perfil configurado",
      });
    }

    // Verificar permissão
    if (!temPermissao(perfilAtivo, funcionalidade)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `O perfil "${perfilAtivo}" não tem permissão para "${funcionalidade}"`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        perfilAtivo,
      },
    });
  });
};

/**
 * Procedure protegido com verificação de permissão
 */
export const procedureComPermissao = (funcionalidade: Funcionalidade) => {
  return protectedProcedure.use(verificaPermissao(funcionalidade));
};
