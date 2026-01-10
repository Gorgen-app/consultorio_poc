import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { TenantContext } from "./tenantContext";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Tenant Procedure - Requer usuário autenticado E tenant válido
 * 
 * Uso: Para todas as operações que manipulam dados específicos de um tenant
 * O ctx.tenant estará sempre disponível e validado
 * 
 * Exemplo:
 * ```typescript
 * myProcedure: tenantProcedure
 *   .input(z.object({ ... }))
 *   .query(async ({ input, ctx }) => {
 *     const tenantId = ctx.tenant.tenantId; // Sempre disponível
 *     return await db.listPacientes(tenantId, input);
 *   }),
 * ```
 */
const requireTenant = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (!ctx.tenant) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Usuário não possui tenant associado. Contate o administrador." 
    });
  }

  if (ctx.tenant.tenantStatus !== "ativo") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: `Sua conta está ${ctx.tenant.tenantStatus}. Contate o suporte.` 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      tenant: ctx.tenant as TenantContext, // Garantido que não é null
    },
  });
});

export const tenantProcedure = t.procedure.use(requireTenant);

/**
 * Tipo do contexto com tenant garantido (para uso em procedures)
 */
export type TenantProcedureContext = TrpcContext & {
  user: NonNullable<TrpcContext["user"]>;
  tenant: TenantContext;
};
