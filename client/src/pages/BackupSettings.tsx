import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Database, 
  Download, 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  HardDrive,
  Calendar,
  Bell,
  RefreshCw,
  FileArchive,
  AlertTriangle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BackupSettings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isGeneratingOffline, setIsGeneratingOffline] = useState(false);

  // Queries
  const { data: config, refetch: refetchConfig } = trpc.backup.getConfig.useQuery();
  const { data: lastBackup, refetch: refetchLastBackup } = trpc.backup.getLastBackup.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.backup.listHistory.useQuery({ limit: 10 });

  // Mutations
  const executeBackupMutation = trpc.backup.executeBackup.useMutation({
    onSuccess: () => {
      refetchLastBackup();
      refetchHistory();
      setIsBackingUp(false);
    },
    onError: () => {
      setIsBackingUp(false);
    },
  });

  const generateOfflineMutation = trpc.backup.generateOfflineBackup.useMutation({
    onSuccess: (data) => {
      setIsGeneratingOffline(false);
      if (data.filePath) {
        // Abrir link de download
        window.open(data.filePath, "_blank");
      }
    },
    onError: () => {
      setIsGeneratingOffline(false);
    },
  });

  const updateConfigMutation = trpc.backup.updateConfig.useMutation({
    onSuccess: () => {
      refetchConfig();
    },
  });

  const handleExecuteBackup = () => {
    setIsBackingUp(true);
    executeBackupMutation.mutate({ type: "full" });
  };

  const handleGenerateOffline = () => {
    setIsGeneratingOffline(true);
    generateOfflineMutation.mutate();
  };

  const handleConfigChange = (key: string, value: any) => {
    updateConfigMutation.mutate({ [key]: value });
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Sucesso</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case "running":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Em execução</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "full":
        return <Badge variant="outline"><Database className="w-3 h-3 mr-1" /> Completo</Badge>;
      case "incremental":
        return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1" /> Incremental</Badge>;
      case "offline":
        return <Badge variant="outline"><HardDrive className="w-3 h-3 mr-1" /> Offline</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup e Restauração</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie backups automáticos e manuais do sistema GORGEN
          </p>
        </div>
      </div>

      {/* Alerta de Pilar Fundamental */}
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700 dark:text-blue-300">Pilar Fundamental: Imutabilidade</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          "Em saúde, a informação é o retrato do momento do paciente. Todo dado inserido é perpétuo."
          Os backups garantem a preservação histórica de todos os dados.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status do Último Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Último Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastBackup ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(lastBackup.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  {getTypeBadge(lastBackup.backupType)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="text-sm">
                    {lastBackup.completedAt 
                      ? formatDistanceToNow(new Date(lastBackup.completedAt), { addSuffix: true, locale: ptBR })
                      : "Em andamento"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tamanho</span>
                  <span className="text-sm">{formatBytes(lastBackup.fileSizeBytes)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Registros</span>
                  <span className="text-sm">{lastBackup.databaseRecords?.toLocaleString("pt-BR") || "-"}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum backup realizado ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleExecuteBackup} 
              disabled={isBackingUp}
              className="w-full"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando backup...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Executar Backup Agora
                </>
              )}
            </Button>
            
            <Separator />
            
            <Button 
              variant="outline" 
              onClick={handleGenerateOffline}
              disabled={isGeneratingOffline}
              className="w-full"
            >
              {isGeneratingOffline ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando backup...
                </>
              ) : (
                <>
                  <HardDrive className="mr-2 h-4 w-4" />
                  Download para HD Externo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Backup offline para armazenamento em HD externo (air-gapped)
            </p>
          </CardContent>
        </Card>

        {/* Próximo Backup Agendado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backup Automático</span>
              <Switch 
                checked={config?.backupEnabled ?? true}
                onCheckedChange={(checked) => handleConfigChange("backupEnabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Horário Diário</span>
              <span className="text-sm font-mono">{config?.dailyBackupTime || "03:00"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dia Semanal</span>
              <span className="text-sm">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][config?.weeklyBackupDay ?? 0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dia Mensal</span>
              <span className="text-sm">Dia {config?.monthlyBackupDay || 1}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Política de Retenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Política de Retenção
            </CardTitle>
            <CardDescription>
              Por quanto tempo os backups são mantidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Backups Diários</Label>
                <Select 
                  value={String(config?.dailyRetentionDays || 30)}
                  onValueChange={(v) => handleConfigChange("dailyRetentionDays", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Backups Semanais</Label>
                <Select 
                  value={String(config?.weeklyRetentionWeeks || 12)}
                  onValueChange={(v) => handleConfigChange("weeklyRetentionWeeks", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 semanas</SelectItem>
                    <SelectItem value="8">8 semanas</SelectItem>
                    <SelectItem value="12">12 semanas</SelectItem>
                    <SelectItem value="24">24 semanas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Backups Mensais</Label>
              <Select 
                value={String(config?.monthlyRetentionMonths || 12)}
                onValueChange={(v) => handleConfigChange("monthlyRetentionMonths", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses (1 ano)</SelectItem>
                  <SelectItem value="24">24 meses (2 anos)</SelectItem>
                  <SelectItem value="36">36 meses (3 anos)</SelectItem>
                  <SelectItem value="84">84 meses (7 anos)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Recomendado: 7 anos para conformidade com regulamentações médicas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Alertas sobre status dos backups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificar em Sucesso</Label>
                <p className="text-xs text-muted-foreground">
                  Receber notificação quando backup for concluído
                </p>
              </div>
              <Switch 
                checked={config?.notifyOnSuccess ?? false}
                onCheckedChange={(checked) => handleConfigChange("notifyOnSuccess", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificar em Falha</Label>
                <p className="text-xs text-muted-foreground">
                  Receber alerta urgente quando backup falhar
                </p>
              </div>
              <Switch 
                checked={config?.notifyOnFailure ?? true}
                onCheckedChange={(checked) => handleConfigChange("notifyOnFailure", checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>E-mail para Notificações</Label>
              <Input 
                type="email"
                placeholder="email@exemplo.com"
                value={config?.notificationEmail || ""}
                onChange={(e) => handleConfigChange("notificationEmail", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Histórico de Backups
          </CardTitle>
          <CardDescription>
            Últimos 10 backups realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tamanho</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Registros</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Iniciado por</th>
                </tr>
              </thead>
              <tbody>
                {history && history.length > 0 ? (
                  history.map((backup) => (
                    <tr key={backup.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm">
                        {backup.completedAt 
                          ? format(new Date(backup.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : format(new Date(backup.startedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-2 px-3">{getTypeBadge(backup.backupType)}</td>
                      <td className="py-2 px-3">{getStatusBadge(backup.status)}</td>
                      <td className="py-2 px-3 text-sm">{formatBytes(backup.fileSizeBytes)}</td>
                      <td className="py-2 px-3 text-sm">{backup.databaseRecords?.toLocaleString("pt-BR") || "-"}</td>
                      <td className="py-2 px-3 text-sm capitalize">{backup.triggeredBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum backup registrado ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre Backup Offline */}
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700 dark:text-amber-300">Backup Offline Mensal Recomendado</AlertTitle>
        <AlertDescription className="text-amber-600 dark:text-amber-400">
          Para proteção máxima contra cenários catastróficos (ransomware, desastres naturais, etc.), 
          recomendamos baixar um backup offline mensalmente e armazená-lo em HD externo desconectado da rede.
          Este é o único backup verdadeiramente "à prova de holocausto zumbi".
        </AlertDescription>
      </Alert>
    </div>
  );
}
