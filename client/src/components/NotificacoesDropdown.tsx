import { useState } from "react";
import { Bell, Users, FileText, DollarSign, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Notificacao {
  id: string;
  tipo: "duplicados" | "pendencias" | "pagamentos";
  titulo: string;
  descricao: string;
  quantidade: number;
  rota: string;
  icone: React.ReactNode;
}

export function NotificacoesDropdown() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  // Buscar contagem de notificações
  const { data: notificacoes } = trpc.notificacoes.listar.useQuery(undefined, {
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  const listaNotificacoes: Notificacao[] = [];

  // Adicionar notificação de duplicados se houver
  if (notificacoes?.duplicados && notificacoes.duplicados > 0) {
    listaNotificacoes.push({
      id: "duplicados",
      tipo: "duplicados",
      titulo: "Pacientes Duplicados",
      descricao: `${notificacoes.duplicados} grupo${notificacoes.duplicados > 1 ? "s" : ""} de pacientes possivelmente duplicados`,
      quantidade: notificacoes.duplicados,
      rota: "/pacientes/duplicados",
      icone: <Users className="h-4 w-4 text-amber-500" />,
    });
  }

  // Adicionar notificação de pendências de documentação
  if (notificacoes?.pendenciasDocumentacao && notificacoes.pendenciasDocumentacao > 0) {
    listaNotificacoes.push({
      id: "pendencias",
      tipo: "pendencias",
      titulo: "Pendências de Documentação",
      descricao: `${notificacoes.pendenciasDocumentacao} atendimento${notificacoes.pendenciasDocumentacao > 1 ? "s" : ""} sem registro de evolução`,
      quantidade: notificacoes.pendenciasDocumentacao,
      rota: "/atendimentos?filtro=sem-evolucao",
      icone: <FileText className="h-4 w-4 text-orange-500" />,
    });
  }

  // Adicionar notificação de pagamentos pendentes (placeholder)
  if (notificacoes?.pagamentosPendentes && notificacoes.pagamentosPendentes > 0) {
    listaNotificacoes.push({
      id: "pagamentos",
      tipo: "pagamentos",
      titulo: "Pagamentos Pendentes",
      descricao: `${notificacoes.pagamentosPendentes} pagamento${notificacoes.pagamentosPendentes > 1 ? "s" : ""} aguardando confirmação`,
      quantidade: notificacoes.pagamentosPendentes,
      rota: "/faturamento/pendentes",
      icone: <DollarSign className="h-4 w-4 text-red-500" />,
    });
  }

  const totalNotificacoes = listaNotificacoes.reduce((acc, n) => acc + n.quantidade, 0);

  const handleNotificacaoClick = (rota: string) => {
    setOpen(false);
    setLocation(rota);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotificacoes > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalNotificacoes > 99 ? "99+" : totalNotificacoes}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {totalNotificacoes > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalNotificacoes} pendente{totalNotificacoes > 1 ? "s" : ""}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {listaNotificacoes.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação pendente</p>
          </div>
        ) : (
          listaNotificacoes.map((notificacao) => (
            <DropdownMenuItem
              key={notificacao.id}
              className="flex items-start gap-3 p-3 cursor-pointer"
              onClick={() => handleNotificacaoClick(notificacao.rota)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {notificacao.icone}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none flex items-center gap-2">
                  {notificacao.titulo}
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {notificacao.quantidade}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {notificacao.descricao}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuItem>
          ))
        )}

        {listaNotificacoes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  setLocation("/notificacoes");
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
