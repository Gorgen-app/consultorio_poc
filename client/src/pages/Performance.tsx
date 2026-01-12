import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, Database, Server, Zap, AlertTriangle, TrendingUp, HardDrive } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Performance() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirecionar se não for admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation('/');
    }
  }, [user, authLoading, setLocation]);
  
  const { data: overview, isLoading } = trpc.performance.getOverview.useQuery(undefined, {
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    enabled: user?.role === 'admin',
  });
  
  const { data: endpoints } = trpc.performance.getEndpoints.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });
  
  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Painel de Performance</h1>
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  
  const formatBytes = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Painel de Performance</h1>
          <p className="text-muted-foreground">Métricas de desempenho da aplicação em tempo real</p>
        </div>
      </div>
      
      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requisições</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.stats.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.stats.requestsPerMinute || 0} req/min
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.stats.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta médio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.stats.errorRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Requisições com erro
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(overview?.system.uptime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo de atividade
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Métricas do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Uso de Memória
            </CardTitle>
            <CardDescription>Consumo de memória do servidor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Heap Usado</span>
                <Badge variant="outline">
                  {formatBytes(overview?.system.memoryUsage.heapUsed || 0)}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((overview?.system.memoryUsage.heapUsed || 0) / (overview?.system.memoryUsage.heapTotal || 1)) * 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Heap Total</span>
                <Badge variant="outline">
                  {formatBytes(overview?.system.memoryUsage.heapTotal || 0)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">RSS (Resident Set Size)</span>
                <Badge variant="outline">
                  {formatBytes(overview?.system.memoryUsage.rss || 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache de Métricas
            </CardTitle>
            <CardDescription>Estatísticas do cache em memória</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de Acerto</span>
                <Badge variant={(overview?.system.cacheStats.hitRate ?? 0) >= 80 ? "default" : "secondary"}>
                  {overview?.system.cacheStats.hitRate || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${overview?.system.cacheStats.hitRate || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {overview?.system.cacheStats.hits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Cache Hits</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {overview?.system.cacheStats.misses || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Cache Misses</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Endpoints Mais Lentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Endpoints Mais Lentos
          </CardTitle>
          <CardDescription>Top 5 endpoints com maior tempo de resposta médio</CardDescription>
        </CardHeader>
        <CardContent>
          {overview?.slowest && overview.slowest.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-right">Tempo Médio</TableHead>
                  <TableHead className="text-right">Requisições</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.slowest.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={endpoint.avgTime > 1000 ? "destructive" : endpoint.avgTime > 500 ? "secondary" : "outline"}>
                        {endpoint.avgTime}ms
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{endpoint.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma métrica de endpoint disponível ainda.
              <br />
              <span className="text-sm">As métricas serão coletadas conforme o sistema for utilizado.</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Histórico por Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Tempo de Resposta (24h)
          </CardTitle>
          <CardDescription>Tempo médio de resposta por hora</CardDescription>
        </CardHeader>
        <CardContent>
          {overview?.history && overview.history.some(h => h.count > 0) ? (
            <div className="flex items-end gap-1 h-32">
              {overview.history.map((hour, index) => {
                const maxTime = Math.max(...overview.history.map(h => h.avgTime), 1);
                const height = hour.avgTime > 0 ? (hour.avgTime / maxTime) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: hour.count > 0 ? '4px' : '0' }}
                      title={`${hour.hour}: ${hour.avgTime}ms (${hour.count} req)`}
                    />
                    {index % 4 === 0 && (
                      <span className="text-[10px] text-muted-foreground">{hour.hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico disponível ainda.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabela de Todos os Endpoints */}
      {endpoints && endpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Todos os Endpoints</CardTitle>
            <CardDescription>Métricas detalhadas de todos os endpoints monitorados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-right">Requisições</TableHead>
                  <TableHead className="text-right">Última Hora</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">P95</TableHead>
                  <TableHead className="text-right">Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.slice(0, 20).map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                    <TableCell className="text-right">{endpoint.count}</TableCell>
                    <TableCell className="text-right">{endpoint.lastHour}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{endpoint.avgResponseTime}ms</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={endpoint.p95ResponseTime > 1000 ? "destructive" : "outline"}>
                        {endpoint.p95ResponseTime}ms
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {endpoint.errorCount > 0 ? (
                        <Badge variant="destructive">{endpoint.errorCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
