import { useState, useEffect } from "react";
import { Bell, Users, FileText, DollarSign, ChevronRight, Clock } from "lucide-react";
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
import { toast } from "sonner";

interface Notificacao {
  id: string;
  tipo: "duplicados" | "pendencias" | "pagamentos" | "aguardando";
  titulo: string;
  descricao: string;
  quantidade: number;
  rota: string;
  icone: React.ReactNode;
  urgente?: boolean;
}

export function NotificacoesDropdown() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [ultimaContagem, setUltimaContagem] = useState(0);

  // Buscar contagem de notificações com polling mais frequente para pacientes aguardando
  const { data: notificacoes } = trpc.notificacoes.listar.useQuery(undefined, {
    refetchInterval: 15000, // Atualizar a cada 15 segundos para notificações em tempo real
  });

  // Efeito para notificar quando um novo paciente chega
  useEffect(() => {
    if (notificacoes?.pacientesAguardando && notificacoes.pacientesAguardando > ultimaContagem) {
      // Novo paciente chegou
      const novos = notificacoes.pacientesAguardando - ultimaContagem;
      if (ultimaContagem > 0) { // Não notificar na primeira carga
        toast.info(
          `${novos === 1 ? "Novo paciente aguardando" : `${novos} novos pacientes aguardando`}`,
          {
            description: "Clique no sino para ver detalhes",
            duration: 5000,
            action: {
              label: "Ver",
              onClick: () => setLocation("/agenda"),
            },
          }
        );
      }
    }
    setUltimaContagem(notificacoes?.pacientesAguardando || 0);
  }, [notificacoes?.pacientesAguardando, ultimaContagem, setLocation]);

  const listaNotificacoes: Notificacao[] = [];

  // Adicionar notificação de pacientes aguardando (prioridade alta)
  if (notificacoes?.pacientesAguardando && notificacoes.pacientesAguardando > 0) {
    listaNotificacoes.push({
      id: "aguardando",
      tipo: "aguardando",
      titulo: "Pacientes Aguardando",
      descricao: `${notificacoes.pacientesAguardando} paciente${notificacoes.pacientesAguardando > 1 ? "s" : ""} aguardando atendimento`,
      quantidade: notificacoes.pacientesAguardando,
      rota: "/agenda",
      icone: <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />,
      urgente: true,
    });
  }

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

  // Adicionar notificação de documentos pendentes de assinatura
  if (notificacoes?.documentosPendentesAssinatura && notificacoes.documentosPendentesAssinatura > 0) {
    listaNotificacoes.push({
      id: "documentos-pendentes",
      tipo: "pendencias",
      titulo: "Documentos Pendentes",
      descricao: `${notificacoes.documentosPendentesAssinatura} documento${notificacoes.documentosPendentesAssinatura > 1 ? "s" : ""} aguardando assinatura`,
      quantidade: notificacoes.documentosPendentesAssinatura,
      rota: "/documentos-pendentes",
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
  const temUrgente = listaNotificacoes.some(n => n.urgente);

  const handleNotificacaoClick = (rota: string) => {
    setOpen(false);
    setLocation(rota);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${temUrgente ? "text-yellow-500" : ""}`} />
          {totalNotificacoes > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${temUrgente ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`}>
              {totalNotificacoes > 99 ? "99+" : totalNotificacoes}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {totalNotificacoes > 0 && (
            <Badge variant={temUrgente ? "default" : "secondary"} className={`text-xs ${temUrgente ? "bg-yellow-500" : ""}`}>
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
              className={`flex items-start gap-3 p-3 cursor-pointer ${notificacao.urgente ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}
              onClick={() => handleNotificacaoClick(notificacao.rota)}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${notificacao.urgente ? "bg-yellow-100 dark:bg-yellow-900" : "bg-muted"}`}>
                {notificacao.icone}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none flex items-center gap-2">
                  {notificacao.titulo}
                  <Badge variant={notificacao.urgente ? "default" : "destructive"} className={`text-[10px] px-1.5 py-0 ${notificacao.urgente ? "bg-yellow-500" : ""}`}>
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
