import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getTenantFromUser, type TenantContext } from "./tenantContext";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenant: TenantContext | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let tenant: TenantContext | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    // Se usuário autenticado, buscar contexto do tenant
    if (user?.id) {
      try {
        tenant = await getTenantFromUser(user.id);
      } catch (tenantError) {
        // Tenant pode não existir para usuários novos
        // O erro será tratado nas procedures que exigem tenant
        console.warn("[Context] Tenant não encontrado para usuário:", user.id);
        tenant = null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    tenant = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    tenant,
  };
}
