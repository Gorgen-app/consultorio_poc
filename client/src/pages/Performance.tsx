import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, Clock, Database, Server, Zap, AlertTriangle, TrendingUp, HardDrive, Download, Bell, Settings, Check, X, Wrench, Play, History, RefreshCw, Shield, Cpu, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Performance() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [responseTimeThreshold, setResponseTimeThreshold] = useState(2000);
  const [errorRateThreshold, setErrorRateThreshold] = useState(10);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  // Redirecionar se não for admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation('/');
    }
  }, [user, authLoading, setLocation]);
  
  const { data: overview, isLoading } = trpc.performance.getOverview.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });
  
  const { data: endpoints } = trpc.performance.getEndpoints.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });
  
  const { data: alerts, refetch: refetchAlerts } = trpc.performance.getAlerts.useQuery(
    { includeAcknowledged: false },
    {
      refetchInterval: 30000,
      enabled: user?.role === 'admin',
    }
  );
  
  const { data: alertConfig } = trpc.performance.getAlertConfig.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  
  // Sincronizar estado com config quando carregado
  useEffect(() => {
    if (alertConfig) {
      setResponseTimeThreshold(alertConfig.responseTimeThreshold);
      setErrorRateThreshold(alertConfig.errorRateThreshold);
      setAlertsEnabled(alertConfig.enabled);
    }
  }, [alertConfig]);
  
  const setAlertConfigMutation = trpc.performance.setAlertConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações de alertas atualizadas");
      setShowAlertConfig(false);
    },
  });
  
  const acknowledgeAlertMutation = trpc.performance.acknowledgeAlert.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });
  
  const acknowledgeAllMutation = trpc.performance.acknowledgeAllAlerts.useMutation({
    onSuccess: (count) => {
      toast.success(`${count} alertas reconhecidos`);
      refetchAlerts();
    },
  });
  
  const handleExportCSV = async (type: 'raw' | 'aggregated') => {
    try {
      const response = await fetch(`/api/trpc/performance.exportCSV?input=${encodeURIComponent(JSON.stringify({ type }))}`);
      const result = await response.json();
      const csvContent = result.result.data;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `metricas_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Métricas ${type === 'raw' ? 'brutas' : 'agregadas'} exportadas com sucesso`);
    } catch (error) {
      toast.error("Erro ao exportar métricas");
    }
  };
  
  const handleSaveAlertConfig = () => {
    setAlertConfigMutation.mutate({
      responseTimeThreshold,
      errorRateThreshold,
      enabled: alertsEnabled,
    });
  };
  
  // Auto-Healing queries
  const { data: diagnosis, refetch: refetchDiagnosis } = trpc.performance.diagnose.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: user?.role === 'admin',
  });
  
  const { data: healingStats } = trpc.performance.getHealingStats.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });
  
  const { data: healingHistory } = trpc.performance.getHealingHistory.useQuery(
    { limit: 10 },
    {
      refetchInterval: 30000,
      enabled: user?.role === 'admin',
    }
  );
  
  // Histórico de memória
  const { data: memoryHistory, refetch: refetchMemoryHistory } = trpc.performance.memoryHistory.useQuery(
    { minutes: 60 },
    {
      refetchInterval: 30000,
      enabled: user?.role === 'admin',
    }
  );
  
  const investigateAndFixMutation = trpc.performance.investigateAndFix.useMutation({
    onSuccess: (result: { actionsTaken: unknown[]; message: string }) => {
      if (result.actionsTaken.length > 0) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
      refetchDiagnosis();
      refetchAlerts();
    },
    onError: () => {
      toast.error('Erro ao executar correção');
    },
  });
  
  const executeActionMutation = trpc.performance.executeAction.useMutation({
    onSuccess: (result: { description: string }) => {
      toast.success(result.description);
      refetchDiagnosis();
    },
    onError: () => {
      toast.error('Erro ao executar ação');
    },
  });
  
  const setAutoHealingMutation = trpc.performance.setAutoHealingEnabled.useMutation({
    onSuccess: (result: { enabled: boolean }) => {
      toast.success(`Auto-healing ${result.enabled ? 'habilitado' : 'desabilitado'}`);
    },
  });
  
  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-[#0056A4]" />
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
  
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-[#0056A4]" />
          <div>
            <h1 className="text-2xl font-bold">Painel de Performance</h1>
            <p className="text-muted-foreground">Métricas de desempenho da aplicação em tempo real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Alertas */}
          <Dialog open={showAlertConfig} onOpenChange={setShowAlertConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Alertas
                {alerts && alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Alertas
                </DialogTitle>
                <DialogDescription>
                  Configure os limites para geração de alertas de performance
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alerts-enabled">Alertas Habilitados</Label>
                  <Switch
                    id="alerts-enabled"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response-time">Limite de Tempo de Resposta (ms)</Label>
                  <Input
                    id="response-time"
                    type="number"
                    min={100}
                    max={30000}
                    value={responseTimeThreshold}
                    onChange={(e) => setResponseTimeThreshold(parseInt(e.target.value) || 2000)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta quando tempo médio ultrapassar este valor
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="error-rate">Limite de Taxa de Erro (%)</Label>
                  <Input
                    id="error-rate"
                    type="number"
                    min={1}
                    max={100}
                    value={errorRateThreshold}
                    onChange={(e) => setErrorRateThreshold(parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta quando taxa de erro ultrapassar este percentual
                  </p>
                </div>
                
                <Button onClick={handleSaveAlertConfig} className="w-full">
                  Salvar Configurações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Botões de Exportação */}
          <Button variant="outline" size="sm" onClick={() => handleExportCSV('aggregated')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Resumo
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportCSV('raw')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Detalhado
          </Button>
        </div>
      </div>
      
      {/* Alertas Ativos */}
      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Alertas Ativos ({alerts.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => investigateAndFixMutation.mutate({ automatic: false })}
                  disabled={investigateAndFixMutation.isPending}
                  className="bg-[#0056A4] hover:bg-[#004080]"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {investigateAndFixMutation.isPending ? 'Corrigindo...' : 'Investigar e Corrigir'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acknowledgeAllMutation.mutate()}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Reconhecer Todos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        alert.type === 'slow_response' ? 'secondary' :
                        alert.type === 'high_error_rate' ? 'destructive' :
                        'outline'
                      }
                    >
                      {alert.type === 'slow_response' ? 'Lentidão' :
                       alert.type === 'high_error_rate' ? 'Erros' :
                       'Memória'}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Card de Auto-Healing */}
      <Card className="border-[#0056A4]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0056A4]" />
              Auto-Healing
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-healing-toggle" className="text-sm">Auto-correção</Label>
                <Switch
                  id="auto-healing-toggle"
                  checked={healingStats?.autoHealingEnabled ?? true}
                  onCheckedChange={(checked) => setAutoHealingMutation.mutate({ enabled: checked })}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchDiagnosis()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          <CardDescription>
            Sistema de diagnóstico e correção automática de problemas de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnóstico Atual */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Diagnóstico do Sistema
              </h4>
              
              {diagnosis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Saúde Geral</span>
                    <Badge
                      variant={
                        diagnosis.overallHealth === 'healthy' ? 'default' :
                        diagnosis.overallHealth === 'warning' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {diagnosis.overallHealth === 'healthy' ? '✅ Saudável' :
                       diagnosis.overallHealth === 'warning' ? '⚠️ Atenção' :
                       '🚨 Crítico'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <div className="text-lg font-bold">{diagnosis.metrics.memoryUsagePercent}%</div>
                      <div className="text-xs text-muted-foreground">Memória</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <div className="text-lg font-bold">{diagnosis.metrics.avgResponseTime}ms</div>
                      <div className="text-xs text-muted-foreground">Tempo Médio</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <div className="text-lg font-bold">{diagnosis.metrics.errorRate}%</div>
                      <div className="text-xs text-muted-foreground">Taxa Erro</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <div className="text-lg font-bold">{diagnosis.metrics.activeAlerts}</div>
                      <div className="text-xs text-muted-foreground">Alertas</div>
                    </div>
                  </div>
                  
                  {diagnosis.problems.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-orange-700">Problemas Detectados:</h5>
                      {diagnosis.problems.map((problem: { type: string; severity: string; description: string; autoFixable: boolean }, idx: number) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-200 text-sm">
                          <div className="flex items-center justify-between">
                            <span>{problem.description}</span>
                            <Badge variant={problem.autoFixable ? 'default' : 'secondary'} className="text-xs">
                              {problem.autoFixable ? 'Auto-corrigível' : 'Manual'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {diagnosis.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium">Recomendações:</h5>
                      {diagnosis.recommendations.map((rec: string, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando diagnóstico...
                </div>
              )}
              
              {/* Botões de Ação Manual */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeActionMutation.mutate({ actionType: 'clear_cache' })}
                  disabled={executeActionMutation.isPending}
                >
                  Limpar Cache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeActionMutation.mutate({ actionType: 'force_gc' })}
                  disabled={executeActionMutation.isPending}
                >
                  Forçar GC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeActionMutation.mutate({ actionType: 'investigate' })}
                  disabled={executeActionMutation.isPending}
                >
                  Investigar
                </Button>
              </div>
            </div>
            
            {/* Histórico de Ações */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Ações ({healingStats?.actionsLast24h || 0} nas últimas 24h)
              </h4>
              
              {healingHistory && healingHistory.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {healingHistory.map((action: {
                    id: string;
                    timestamp: number;
                    actionType: string;
                    description: string;
                    success: boolean;
                    automatic: boolean;
                    memoryBefore?: number;
                    memoryAfter?: number;
                  }) => (
                    <div
                      key={action.id}
                      className={`p-2 rounded border text-sm ${
                        action.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={action.automatic ? 'secondary' : 'outline'} className="text-xs">
                            {action.automatic ? 'Auto' : 'Manual'}
                          </Badge>
                          <span className="font-medium">
                            {action.actionType === 'clear_cache' ? 'Limpeza de Cache' :
                             action.actionType === 'force_gc' ? 'Garbage Collection' :
                             action.actionType === 'acknowledge_alerts' ? 'Reconhecer Alertas' :
                             action.actionType === 'investigate' ? 'Investigação' :
                             action.actionType}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(action.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{action.description}</p>
                      {action.memoryBefore !== undefined && action.memoryAfter !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Memória: {action.memoryBefore}MB → {action.memoryAfter}MB
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma ação registrada ainda.
                </div>
              )}
              
              {/* Estatísticas */}
              {healingStats && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="text-lg font-bold text-emerald-600">{healingStats.successfulActions}</div>
                    <div className="text-xs text-muted-foreground">Sucesso</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="text-lg font-bold text-red-600">{healingStats.failedActions}</div>
                    <div className="text-xs text-muted-foreground">Falhas</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="text-lg font-bold">{healingStats.totalActions}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
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
            <Clock className="h-4 w-4 text-[#0056A4]" />
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
            <Server className="h-4 w-4 text-emerald-600" />
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
      
      {/* Gráfico de Histórico de Memória */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Histórico de Uso de Memória
              </CardTitle>
              <CardDescription>
                Evolução do consumo de memória na última hora
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {memoryHistory?.summary && (
                <div className="flex items-center gap-1 text-sm">
                  {memoryHistory.summary.trend === 'increasing' ? (
                    <><TrendingUp className="h-4 w-4 text-red-500" /><span className="text-red-500">Subindo</span></>
                  ) : memoryHistory.summary.trend === 'decreasing' ? (
                    <><TrendingDown className="h-4 w-4 text-green-500" /><span className="text-green-500">Caindo</span></>
                  ) : (
                    <><Minus className="h-4 w-4 text-gray-500" /><span className="text-gray-500">Estável</span></>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMemoryHistory()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {memoryHistory?.data && memoryHistory.data.length > 0 ? (
            <div className="space-y-4">
              {/* Sumário */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="text-lg font-bold">{memoryHistory.summary.avgHeapUsed}MB</div>
                  <div className="text-xs text-muted-foreground">Média</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="text-lg font-bold text-red-600">{memoryHistory.summary.maxHeapUsed}MB</div>
                  <div className="text-xs text-muted-foreground">Máximo</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="text-lg font-bold text-green-600">{memoryHistory.summary.minHeapUsed}MB</div>
                  <div className="text-xs text-muted-foreground">Mínimo</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="text-lg font-bold">{memoryHistory.summary.avgHeapPercent}%</div>
                  <div className="text-xs text-muted-foreground">% Médio</div>
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <div className="text-lg font-bold text-orange-600">{memoryHistory.summary.maxHeapPercent}%</div>
                  <div className="text-xs text-muted-foreground">% Máximo</div>
                </div>
              </div>
              
              {/* Gráfico */}
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memoryHistory.data}>
                    <defs>
                      <linearGradient id="colorHeapUsed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0056A4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0056A4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHeapTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'MB', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          heapUsed: 'Heap Usado',
                          heapTotal: 'Heap Total',
                          rss: 'RSS',
                          heapUsagePercent: 'Uso %'
                        };
                        return [name === 'heapUsagePercent' ? `${value}%` : `${value}MB`, labels[name] || name];
                      }}
                    />
                    <Legend 
                      formatter={(value: string) => {
                        const labels: Record<string, string> = {
                          heapUsed: 'Heap Usado',
                          heapTotal: 'Heap Total',
                          rss: 'RSS'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heapUsed" 
                      stroke="#0056A4" 
                      strokeWidth={2}
                      fill="url(#colorHeapUsed)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heapTotal" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#colorHeapTotal)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rss" 
                      stroke="#f59e0b" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Coletando dados de memória...</p>
              <p className="text-xs mt-1">O histórico aparecerá após alguns minutos de uso</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Métricas do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Uso de Memória Atual
            </CardTitle>
            <CardDescription>Consumo de memória do servidor em tempo real</CardDescription>
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
                  className="bg-emerald-600 h-2 rounded-full" 
                  style={{ width: `${overview?.system.cacheStats.hitRate || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
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
