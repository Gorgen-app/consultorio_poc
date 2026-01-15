import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { temPermissao, type PerfilType, type Funcionalidade } from "../../../shared/permissions";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  funcionalidade: Funcionalidade;
  fallbackPath?: string;
}

/**
 * Componente que protege rotas baseado nas permissões do perfil ativo
 * Se o usuário não tiver permissão, redireciona para a página inicial
 */
export function ProtectedRoute({ 
  children, 
  funcionalidade,
  fallbackPath = "/" 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: profile, isLoading: profileLoading } = trpc.perfil.me.useQuery(undefined, {
    enabled: !!user,
  });

  const isLoading = authLoading || profileLoading;
  const perfilAtivo = profile?.perfilAtivo as PerfilType | undefined;
  const hasPermission = temPermissao(perfilAtivo, funcionalidade);

  useEffect(() => {
    // Só verifica permissão após carregar tudo
    if (!isLoading && user && perfilAtivo && !hasPermission) {
      toast.error(`Acesso negado. O perfil "${perfilAtivo}" não tem permissão para esta funcionalidade.`);
      setLocation(fallbackPath);
    }
  }, [isLoading, user, perfilAtivo, hasPermission, setLocation, fallbackPath]);

  // Enquanto carrega, mostra loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não tem permissão, não renderiza nada (o useEffect vai redirecionar)
  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar permissão do perfil ativo
 */
export function usePermissao(funcionalidade: Funcionalidade): boolean {
  const { user } = useAuth();
  const { data: profile } = trpc.perfil.me.useQuery(undefined, {
    enabled: !!user,
  });
  
  const perfilAtivo = profile?.perfilAtivo as PerfilType | undefined;
  return temPermissao(perfilAtivo, funcionalidade);
}
