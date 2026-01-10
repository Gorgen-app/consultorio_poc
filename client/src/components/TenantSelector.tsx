import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenantSelectorProps {
  onTenantChange?: () => void;
  className?: string;
}

export function TenantSelector({ onTenantChange, className }: TenantSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const { data: tenants, isLoading: loadingTenants } = trpc.tenants.getUserTenants.useQuery();
  const { data: activeTenant, isLoading: loadingActive } = trpc.tenants.getActiveTenant.useQuery();
  
  const utils = trpc.useUtils();
  
  const setActiveTenant = trpc.tenants.setActiveTenant.useMutation({
    onSuccess: (data, variables) => {
      // Encontrar o nome do tenant selecionado
      const selectedTenant = tenants?.find(t => t.id === variables.tenantId);
      const tenantName = selectedTenant?.nome || "Clínica";
      
      // Mostrar toast de confirmação
      toast.success(`Clínica alterada`, {
        description: `Você está agora acessando: ${tenantName}`,
        duration: 4000,
      });
      
      // Invalidar todas as queries para recarregar dados do novo tenant
      utils.invalidate();
      setOpen(false);
      onTenantChange?.();
    },
    onError: (error) => {
      toast.error("Erro ao trocar de clínica", {
        description: error.message || "Não foi possível alterar a clínica. Tente novamente.",
        duration: 5000,
      });
    },
  });
  
  const handleSelectTenant = (tenantId: number) => {
    if (tenantId === activeTenant?.id) {
      setOpen(false);
      return;
    }
    setActiveTenant.mutate({ tenantId });
  };
  
  if (loadingTenants || loadingActive) {
    return (
      <Button variant="outline" className={cn("gap-2", className)} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    );
  }
  
  // Se o usuário só tem acesso a um tenant, não mostrar o seletor
  if (!tenants || tenants.length <= 1) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2 justify-between", className)}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate max-w-[150px]">{activeTenant?.nome || "Selecionar Clínica"}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecionar Clínica</DialogTitle>
          <DialogDescription>
            Escolha a clínica que deseja acessar. Os dados exibidos serão filtrados de acordo com a clínica selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant.id)}
              disabled={setActiveTenant.isPending}
              className={cn(
                "flex items-center justify-between w-full p-4 rounded-lg border transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                tenant.id === activeTenant?.id && "border-primary bg-primary/5",
                setActiveTenant.isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tenant.nome}</span>
                  {tenant.isPrimary && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Principal
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {tenant.plano?.charAt(0).toUpperCase()}{tenant.plano?.slice(1)} • {tenant.slug}
                </span>
              </div>
              {tenant.id === activeTenant?.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
              {setActiveTenant.isPending && setActiveTenant.variables?.tenantId === tenant.id && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
