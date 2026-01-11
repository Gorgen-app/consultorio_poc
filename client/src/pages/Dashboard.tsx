import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Formata número inteiro no padrão brasileiro (21.644)
const formatarNumero = (valor: number | undefined | null): string => {
  if (valor === undefined || valor === null) return "0";
  return new Intl.NumberFormat("pt-BR").format(valor);
};

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: activeTenant, isLoading: loadingTenant } = trpc.tenants.getActiveTenant.useQuery();

  if (isLoading || loadingTenant) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const faturamentoPendente = (stats?.faturamentoPrevisto || 0) - (stats?.faturamentoRealizado || 0);
  const taxaRecebimento = stats?.faturamentoPrevisto
    ? ((stats.faturamentoRealizado / stats.faturamentoPrevisto) * 100).toFixed(1)
    : "0.0";

  // Determinar o título e subtítulo baseado no tenant ativo
  const tenantName = activeTenant?.nome || "Consultório";
  const isTestTenant = activeTenant?.slug === "clinica-teste";
  const planoBadge = activeTenant?.plano 
    ? activeTenant.plano.charAt(0).toUpperCase() + activeTenant.plano.slice(1)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          {planoBadge && (
            <Badge variant={isTestTenant ? "secondary" : "default"} className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              {planoBadge}
            </Badge>
          )}
          {isTestTenant && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
              Ambiente de Teste
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          Visão geral • <span className="font-medium">{tenantName}</span>
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarNumero(stats?.totalPacientes)}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatarNumero(stats?.pacientesAtivos)} ativos</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarNumero(stats?.totalAtendimentos)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registrado</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Previsto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.faturamentoPrevisto || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total esperado</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recebimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaRecebimento}%</div>
            <p className="text-xs text-muted-foreground mt-1">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.faturamentoRealizado || 0)} recebido</p>
          </CardContent>
        </Card>
      </div>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Distribuição por Convênio</CardTitle>
          <CardDescription>Top 10 convênios por número de atendimentos</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.distribuicaoConvenio && stats.distribuicaoConvenio.length > 0 ? (
            <div className="space-y-3">
              {stats.distribuicaoConvenio.map((item, index) => {
                const total = stats.totalAtendimentos || 1;
                const percentage = ((item.total / total) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{item.convenio}</span>
                        <span className="text-sm text-muted-foreground ml-2">{item.total} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>
      {faturamentoPendente > 0 && (
        <Card className="card-elevated border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle>Faturamento Pendente</CardTitle>
            <CardDescription>Valor previsto ainda não recebido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(faturamentoPendente)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
