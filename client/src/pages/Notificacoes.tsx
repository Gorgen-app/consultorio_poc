import { useState } from "react";
import { Bell, Users, FileText, DollarSign, Clock, AlertTriangle, ChevronRight, Activity, HardDrive, Zap, Check, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificacaoItem {
  id: string;
  tipo: "duplicados" | "pendencias" | "pagamentos" | "aguardando" | "performance";
  titulo: string;
  descricao: string;
  quantidade: number;
  rota: string;
  icone: React.ReactNode;
  urgente?: boolean;
  categoria: "pacientes" | "atendimentos" | "financeiro" | "sistema";
}

export default function Notificacoes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todas");

  // Buscar notificações do sistema
  const { data: notificacoes, isLoading: loadingNotificacoes } = trpc.notificacoes.listar.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Buscar alertas de performance (apenas admin)
  const { data: alertsPerformance, refetch: refetchAlerts } = trpc.performance.getAlerts.useQuery(
    { includeAcknowledged: false },
    {
      refetchInterval: 30000,
      enabled: user?.role === 'admin',
    }
  );

  const acknowledgeAlertMutation = trpc.performance.acknowledgeAlert.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const acknowledgeAllMutation = trpc.performance.acknowledgeAllAlerts.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  // Construir lista de notificações
  const listaNotificacoes: NotificacaoItem[] = [];

  // Pacientes aguardando (urgente)
  if (notificacoes?.pacientesAguardando && notificacoes.pacientesAguardando > 0) {
    listaNotificacoes.push({
      id: "aguardando",
      tipo: "aguardando",
      titulo: "Pacientes Aguardando",
      descricao: `${notificacoes.pacientesAguardando} paciente${notificacoes.pacientesAguardando > 1 ? "s" : ""} aguardando atendimento`,
      quantidade: notificacoes.pacientesAguardando,
      rota: "/agenda",
      icone: <Clock className="h-5 w-5 text-yellow-500" />,
      urgente: true,
      categoria: "atendimentos",
    });
  }

  // Pacientes duplicados
  if (notificacoes?.duplicados && notificacoes.duplicados > 0) {
    listaNotificacoes.push({
      id: "duplicados",
      tipo: "duplicados",
      titulo: "Pacientes Duplicados",
      descricao: `${notificacoes.duplicados} grupo${notificacoes.duplicados > 1 ? "s" : ""} de pacientes possivelmente duplicados`,
      quantidade: notificacoes.duplicados,
      rota: "/pacientes/duplicados",
      icone: <Users className="h-5 w-5 text-amber-500" />,
      urgente: false,
      categoria: "pacientes",
    });
  }

  // Documentos pendentes de assinatura
  if (notificacoes?.documentosPendentesAssinatura && notificacoes.documentosPendentesAssinatura > 0) {
    listaNotificacoes.push({
      id: "documentos-pendentes",
      tipo: "pendencias",
      titulo: "Documentos Pendentes",
      descricao: `${notificacoes.documentosPendentesAssinatura} documento${notificacoes.documentosPendentesAssinatura > 1 ? "s" : ""} aguardando assinatura`,
      quantidade: notificacoes.documentosPendentesAssinatura,
      rota: "/documentos-pendentes",
      icone: <FileText className="h-5 w-5 text-orange-500" />,
      urgente: false,
      categoria: "atendimentos",
    });
  }

  // Pagamentos pendentes
  if (notificacoes?.pagamentosPendentes && notificacoes.pagamentosPendentes > 0) {
    listaNotificacoes.push({
      id: "pagamentos",
      tipo: "pagamentos",
      titulo: "Pagamentos Pendentes",
      descricao: `${notificacoes.pagamentosPendentes} pagamento${notificacoes.pagamentosPendentes > 1 ? "s" : ""} aguardando confirmação`,
      quantidade: notificacoes.pagamentosPendentes,
      rota: "/faturamento/pendentes",
      icone: <DollarSign className="h-5 w-5 text-red-500" />,
      urgente: false,
      categoria: "financeiro",
    });
  }

  // Alertas de performance (apenas admin)
  if (user?.role === 'admin' && alertsPerformance && alertsPerformance.length > 0) {
    alertsPerformance.forEach((alert, index) => {
      listaNotificacoes.push({
        id: `perf-${alert.id}`,
        tipo: "performance",
        titulo: alert.type === 'slow_response' ? 'Lentidão no Sistema' :
                alert.type === 'high_error_rate' ? 'Taxa de Erros Alta' :
                alert.type === 'memory_warning' ? 'Memória Alta' : 'Alerta de Sistema',
        descricao: alert.message,
        quantidade: 1,
        rota: "/performance",
        icone: alert.type === 'memory_warning' ? <HardDrive className="h-5 w-5 text-orange-500" /> :
               alert.type === 'slow_response' ? <Zap className="h-5 w-5 text-yellow-500" /> :
               <AlertTriangle className="h-5 w-5 text-red-500" />,
        urgente: alert.type === 'high_error_rate',
        categoria: "sistema",
      });
    });
  }

  // Filtrar por categoria
  const notificacoesFiltradas = activeTab === "todas" 
    ? listaNotificacoes 
    : listaNotificacoes.filter(n => n.categoria === activeTab);

  const totalPorCategoria = {
    todas: listaNotificacoes.length,
    pacientes: listaNotificacoes.filter(n => n.categoria === "pacientes").length,
    atendimentos: listaNotificacoes.filter(n => n.categoria === "atendimentos").length,
    financeiro: listaNotificacoes.filter(n => n.categoria === "financeiro").length,
    sistema: listaNotificacoes.filter(n => n.categoria === "sistema").length,
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingNotificacoes) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-[#0056A4]" />
          <div>
            <h1 className="text-2xl font-bold">Central de Notificações</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-[#0056A4]" />
          <div>
            <h1 className="text-2xl font-bold">Central de Notificações</h1>
            <p className="text-muted-foreground">
              {listaNotificacoes.length === 0 
                ? "Nenhuma notificação pendente"
                : `${listaNotificacoes.length} notificação${listaNotificacoes.length > 1 ? "ões" : ""} pendente${listaNotificacoes.length > 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>

        {user?.role === 'admin' && alertsPerformance && alertsPerformance.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => acknowledgeAllMutation.mutate()}
          >
            <Check className="h-4 w-4 mr-2" />
            Reconhecer Alertas de Sistema
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === "todas" ? "ring-2 ring-[#0056A4]" : ""}`}
          onClick={() => setActiveTab("todas")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Todas</p>
                <p className="text-2xl font-bold">{totalPorCategoria.todas}</p>
              </div>
              <Bell className="h-8 w-8 text-[#0056A4] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === "pacientes" ? "ring-2 ring-amber-500" : ""}`}
          onClick={() => setActiveTab("pacientes")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacientes</p>
                <p className="text-2xl font-bold">{totalPorCategoria.pacientes}</p>
              </div>
              <Users className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === "atendimentos" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => setActiveTab("atendimentos")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atendimentos</p>
                <p className="text-2xl font-bold">{totalPorCategoria.atendimentos}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === "financeiro" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => setActiveTab("financeiro")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Financeiro</p>
                <p className="text-2xl font-bold">{totalPorCategoria.financeiro}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "sistema" ? "ring-2 ring-orange-500" : ""}`}
            onClick={() => setActiveTab("sistema")}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sistema</p>
                  <p className="text-2xl font-bold">{totalPorCategoria.sistema}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações Pendentes</CardTitle>
          <CardDescription>
            Clique em uma notificação para ir até a página correspondente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificacoesFiltradas.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma notificação nesta categoria
              </p>
              <p className="text-sm text-muted-foreground">
                Todas as pendências foram resolvidas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificacoesFiltradas.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    notificacao.urgente 
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" 
                      : "bg-card hover:bg-accent/50"
                  }`}
                  onClick={() => setLocation(notificacao.rota)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      notificacao.urgente 
                        ? "bg-yellow-100 dark:bg-yellow-900" 
                        : "bg-muted"
                    }`}>
                      {notificacao.icone}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notificacao.titulo}</p>
                        <Badge 
                          variant={notificacao.urgente ? "default" : "secondary"}
                          className={notificacao.urgente ? "bg-yellow-500" : ""}
                        >
                          {notificacao.quantidade}
                        </Badge>
                        {notificacao.urgente && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                            Urgente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notificacao.descricao}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notificacao.tipo === "performance" && user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const alertId = notificacao.id.replace('perf-', '');
                          acknowledgeAlertMutation.mutate({ alertId });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica para admin */}
      {user?.role === 'admin' && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-[#0056A4] mt-0.5" />
              <div>
                <p className="font-medium">Monitoramento de Sistema</p>
                <p className="text-sm text-muted-foreground">
                  Como administrador, você também recebe alertas de performance do sistema (memória, tempo de resposta, erros).
                  Para configurações avançadas, acesse a página de <button onClick={() => setLocation('/performance')} className="text-[#0056A4] underline">Performance</button>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
