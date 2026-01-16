import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
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
  AlertTriangle,
  Upload,
  Lock,
  Unlock,
  RotateCcw,
  FileUp,
  ShieldCheck,
  Mail,
  FileText,
  TrendingUp,
  Activity,
  ClipboardList,
  Download,
  FlaskConical,
  Play
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function BackupSettings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isIncrementalBackup, setIsIncrementalBackup] = useState(false);
  const [isGeneratingOffline, setIsGeneratingOffline] = useState(false);
  const [activeTab, setActiveTab] = useState("backup");
  
  // Estado para restauração
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para verificação de integridade
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<any>(null);
  
  // Estado para relatório de auditoria
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  
  // Estado para teste de restauração
  const [isRunningRestoreTest, setIsRunningRestoreTest] = useState(false);
  const [restoreTestResult, setRestoreTestResult] = useState<any>(null);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Queries
  const { data: config, refetch: refetchConfig } = trpc.backup.getConfig.useQuery();
  const { data: lastBackup, refetch: refetchLastBackup } = trpc.backup.getLastBackup.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.backup.listHistory.useQuery({ limit: 20 });

  // Mutations
  const executeBackupMutation = trpc.backup.executeBackup.useMutation({
    onSuccess: () => {
      refetchLastBackup();
      refetchHistory();
      setIsBackingUp(false);
      toast.success("Backup completo concluído!", {
        description: "Os dados foram criptografados com AES-256-GCM e salvos no S3."
      });
    },
    onError: (error) => {
      setIsBackingUp(false);
      toast.error("Erro ao executar backup", { description: error.message });
    },
  });

  const executeIncrementalMutation = trpc.backup.executeIncrementalBackup.useMutation({
    onSuccess: (result) => {
      refetchLastBackup();
      refetchHistory();
      setIsIncrementalBackup(false);
      if (result.filePath === "no_changes") {
        toast.info("Nenhuma alteração detectada", {
          description: "Não há registros modificados desde o último backup."
        });
      } else {
        toast.success("Backup incremental concluído!", {
          description: `${result.fileSize ? (result.fileSize / 1024).toFixed(2) + " KB" : ""} salvos.`
        });
      }
    },
    onError: (error) => {
      setIsIncrementalBackup(false);
      toast.error("Erro ao executar backup incremental", { description: error.message });
    },
  });

  const generateOfflineMutation = trpc.backup.generateOfflineBackup.useMutation({
    onSuccess: (data) => {
      setIsGeneratingOffline(false);
      if (data.filePath) {
        window.open(data.filePath, "_blank");
        toast.success("Backup offline gerado!", {
          description: "O download foi iniciado automaticamente."
        });
      }
    },
    onError: (error) => {
      setIsGeneratingOffline(false);
      toast.error("Erro ao gerar backup offline", { description: error.message });
    },
  });

  const updateConfigMutation = trpc.backup.updateConfig.useMutation({
    onSuccess: () => {
      refetchConfig();
      toast.success("Configuração atualizada");
    },
  });

  const validateBackupFileMutation = trpc.backup.validateBackupFile.useMutation({
    onSuccess: (result) => {
      setIsValidating(false);
      setValidationResult(result);
      if (result.valid) {
        toast.success("Arquivo de backup válido!", {
          description: `Versão: ${result.metadata?.version}, Registros: ${result.metadata?.totalRecords?.toLocaleString("pt-BR")}`
        });
      } else {
        toast.error("Arquivo de backup inválido", { description: result.error });
      }
    },
    onError: (error) => {
      setIsValidating(false);
      setValidationResult({ valid: false, error: error.message });
      toast.error("Erro ao validar backup", { description: error.message });
    },
  });

  const restoreBackupMutation = trpc.backup.restoreBackup.useMutation({
    onSuccess: (result) => {
      setIsRestoring(false);
      setShowRestoreConfirm(false);
      setRestoreProgress(100);
      if (result.success) {
        toast.success("Restauração concluída!", {
          description: `${result.tablesRestored} tabelas e ${result.recordsRestored?.toLocaleString("pt-BR")} registros restaurados.`
        });
        setSelectedFile(null);
        setValidationResult(null);
        refetchHistory();
      } else {
        toast.error("Erro na restauração", { description: result.error });
      }
    },
    onError: (error) => {
      setIsRestoring(false);
      setShowRestoreConfirm(false);
      toast.error("Erro ao restaurar backup", { description: error.message });
    },
  });

  const runIntegrityCheckMutation = trpc.backup.runIntegrityCheck.useMutation({
    onSuccess: (result) => {
      setIsCheckingIntegrity(false);
      setIntegrityResult(result);
      if (result.invalidCount === 0) {
        toast.success("Verificação de integridade concluída!", {
          description: `${result.validCount} backups verificados, todos íntegros.`
        });
      } else {
        toast.warning("Problemas de integridade detectados", {
          description: `${result.invalidCount} de ${result.totalChecked} backups com problemas.`
        });
      }
    },
    onError: (error) => {
      setIsCheckingIntegrity(false);
      toast.error("Erro na verificação de integridade", { description: error.message });
    },
  });

  const runRestoreTestMutation = trpc.backup.runRestoreTest.useMutation({
    onSuccess: (result) => {
      setIsRunningRestoreTest(false);
      setRestoreTestResult(result);
      if (result.success) {
        toast.success("Teste de restauração APROVADO!", {
          description: `${result.summary?.passedValidations}/${result.summary?.totalValidations} validações aprovadas.`
        });
      } else {
        toast.error("Teste de restauração FALHOU", {
          description: result.error || `${result.summary?.failedValidations} validações falharam.`
        });
      }
    },
    onError: (error) => {
      setIsRunningRestoreTest(false);
      toast.error("Erro ao executar teste", { description: error.message });
    },
  });

  const generateAuditReportMutation = trpc.backup.generateAuditReport.useMutation({
    onSuccess: (result) => {
      setIsGeneratingReport(false);
      setAuditReport(result);
      toast.success("Relatório de auditoria gerado!", {
        description: `Período: ${format(new Date(result.reportPeriod.start), "dd/MM/yyyy")} a ${format(new Date(result.reportPeriod.end), "dd/MM/yyyy")}`
      });
    },
    onError: (error) => {
      setIsGeneratingReport(false);
      toast.error("Erro ao gerar relatório", { description: error.message });
    },
  });

  const handleExecuteBackup = () => {
    setIsBackingUp(true);
    executeBackupMutation.mutate({ type: "full" });
  };

  const handleExecuteIncrementalBackup = () => {
    setIsIncrementalBackup(true);
    executeIncrementalMutation.mutate();
  };

  const handleGenerateOffline = () => {
    setIsGeneratingOffline(true);
    generateOfflineMutation.mutate();
  };

  const handleConfigChange = (key: string, value: any) => {
    updateConfigMutation.mutate({ [key]: value });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setValidationResult(null);
    setIsValidating(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      validateBackupFileMutation.mutate({ fileData: base64 });
    } catch (error) {
      setIsValidating(false);
      toast.error("Erro ao ler arquivo");
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedFile || !validationResult?.valid) return;
    
    setIsRestoring(true);
    setRestoreProgress(10);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      
      setRestoreProgress(30);
      restoreBackupMutation.mutate({ fileData: base64, confirmRestore: true });
    } catch (error) {
      setIsRestoring(false);
      toast.error("Erro ao processar arquivo");
    }
  };

  const handleRunIntegrityCheck = () => {
    setIsCheckingIntegrity(true);
    setIntegrityResult(null);
    runIntegrityCheckMutation.mutate({ daysBack: 30 });
  };

  const handleRunRestoreTest = () => {
    setIsRunningRestoreTest(true);
    runRestoreTestMutation.mutate({});
  };

  const handleGenerateAuditReport = () => {
    setIsGeneratingReport(true);
    setAuditReport(null);
    generateAuditReportMutation.mutate({
      startDate: reportStartDate,
      endDate: reportEndDate,
    });
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
      case "archived":
        return <Badge variant="outline"><FileArchive className="w-3 h-3 mr-1" /> Arquivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "full":
        return <Badge variant="outline"><Database className="w-3 h-3 mr-1" /> Completo</Badge>;
      case "incremental":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><TrendingUp className="w-3 h-3 mr-1" /> Incremental</Badge>;
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

      {/* Tabs: Backup / Restauração / Integridade / Auditoria */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Restauração
          </TabsTrigger>
          <TabsTrigger value="integrity" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Integridade
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="restore-test" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Teste DR
          </TabsTrigger>
        </TabsList>

        {/* Tab: Backup */}
        <TabsContent value="backup" className="space-y-6">
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Criptografia</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Lock className="w-3 h-3 mr-1" />
                        AES-256
                      </Badge>
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
                  disabled={isBackingUp || isIncrementalBackup}
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
                      Backup Completo
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={handleExecuteIncrementalBackup} 
                  disabled={isBackingUp || isIncrementalBackup}
                  className="w-full"
                >
                  {isIncrementalBackup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Backup Incremental
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Salva apenas alterações desde o último backup
                </p>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  onClick={handleGenerateOffline}
                  disabled={isGeneratingOffline}
                  className="w-full"
                 tooltip="Baixar">
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
              </CardContent>
            </Card>

            {/* Agendamento */}
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
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail para Notificações
                  </Label>
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
                Últimos 20 backups realizados
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
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Criptografia</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Iniciado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history && history.length > 0 ? (
                      history.map((backup: any) => (
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
                          <td className="py-2 px-3">
                            {backup.isEncrypted ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Lock className="w-3 h-3 mr-1" />
                                AES-256
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Unlock className="w-3 h-3 mr-1" />
                                Não
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-3 text-sm capitalize">{backup.triggeredBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          Nenhum backup registrado ainda
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Restauração */}
        <TabsContent value="restore" className="space-y-6">
          <Alert variant="destructive" className="border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Operação Crítica</AlertTitle>
            <AlertDescription>
              A restauração de backup <strong>substituirá TODOS os dados atuais</strong> do sistema.
              Esta operação é <strong>irreversível</strong>. Certifique-se de ter um backup atual antes de prosseguir.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload de Arquivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Selecionar Arquivo de Backup
                </CardTitle>
                <CardDescription>
                  Faça upload do arquivo .enc gerado pelo sistema GORGEN
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".enc,.gz"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste o arquivo de backup
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: .json.gz.enc (criptografado)
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Arquivo selecionado:</span>
                      <Badge variant="outline">{selectedFile.name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tamanho:</span>
                      <span className="text-sm">{formatBytes(selectedFile.size)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultado da Validação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Validação do Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isValidating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Validando arquivo...</p>
                  </div>
                ) : validationResult ? (
                  validationResult.valid ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Backup válido</span>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Versão:</span>
                          <span>{validationResult.metadata?.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data:</span>
                          <span>
                            {validationResult.metadata?.createdAt 
                              ? format(new Date(validationResult.metadata.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registros:</span>
                          <span>{validationResult.metadata?.totalRecords?.toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="destructive"
                        onClick={() => setShowRestoreConfirm(true)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Iniciar Restauração
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Backup inválido</span>
                      </div>
                      <Alert variant="destructive">
                        <AlertDescription>{validationResult.error}</AlertDescription>
                      </Alert>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Selecione um arquivo para validar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Integridade */}
        <TabsContent value="integrity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Verificação de Integridade
                </CardTitle>
                <CardDescription>
                  Valida checksums e estrutura dos backups existentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A verificação de integridade analisa todos os backups dos últimos 30 dias,
                  validando checksums SHA-256, descriptografia e estrutura dos arquivos.
                </p>
                <Button 
                  onClick={handleRunIntegrityCheck}
                  disabled={isCheckingIntegrity}
                  className="w-full"
                 tooltip="Confirmar">
                  {isCheckingIntegrity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Executar Verificação
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resultado da Verificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {integrityResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{integrityResult.totalChecked}</p>
                        <p className="text-xs text-muted-foreground">Verificados</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{integrityResult.validCount}</p>
                        <p className="text-xs text-green-600">Íntegros</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{integrityResult.invalidCount}</p>
                        <p className="text-xs text-red-600">Com Problemas</p>
                      </div>
                    </div>
                    
                    {integrityResult.invalidCount > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          {integrityResult.invalidCount} backup(s) apresentam problemas de integridade.
                          Verifique o armazenamento e considere executar um novo backup completo.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Verificado em: {format(new Date(integrityResult.checkedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Execute uma verificação para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Auditoria */}
        <TabsContent value="audit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Gerar Relatório
                </CardTitle>
                <CardDescription>
                  Relatório de auditoria para conformidade regulatória
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input 
                    type="date" 
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input 
                    type="date" 
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerateAuditReport}
                  disabled={isGeneratingReport}
                  className="w-full"
                 tooltip="Documento">
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {auditReport && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatório de Auditoria
                  </CardTitle>
                  <CardDescription>
                    Período: {format(new Date(auditReport.reportPeriod.start), "dd/MM/yyyy")} a {format(new Date(auditReport.reportPeriod.end), "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumo */}
                  <div>
                    <h4 className="font-medium mb-3">Resumo</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-xl font-bold">{auditReport.summary.totalBackups}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-600">{auditReport.summary.successfulBackups}</p>
                        <p className="text-xs text-green-600">Sucesso</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                        <p className="text-xl font-bold text-red-600">{auditReport.summary.failedBackups}</p>
                        <p className="text-xs text-red-600">Falhas</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                        <p className="text-xl font-bold text-blue-600">{auditReport.summary.encryptionRate.toFixed(0)}%</p>
                        <p className="text-xs text-blue-600">Criptografados</p>
                      </div>
                    </div>
                  </div>

                  {/* Tipos de Backup */}
                  <div>
                    <h4 className="font-medium mb-3">Tipos de Backup</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{auditReport.summary.fullBackups} Completos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{auditReport.summary.incrementalBackups} Incrementais</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{auditReport.summary.offlineBackups} Offline</span>
                      </div>
                    </div>
                  </div>

                  {/* Conformidade */}
                  <div>
                    <h4 className="font-medium mb-3">Conformidade</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Backups Diários</span>
                        {auditReport.compliance.dailyBackupsMet ? (
                          <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Conforme</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Não Conforme</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Backups Semanais</span>
                        {auditReport.compliance.weeklyBackupsMet ? (
                          <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Conforme</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Não Conforme</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Criptografia (95%+)</span>
                        {auditReport.compliance.encryptionCompliance ? (
                          <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Conforme</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Não Conforme</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Retenção (7 anos)</span>
                        {auditReport.compliance.retentionCompliance ? (
                          <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Conforme</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Não Conforme</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Integridade */}
                  <div>
                    <h4 className="font-medium mb-3">Integridade</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Última verificação:</span>
                      <span className="text-sm">
                        {auditReport.integrityStatus.lastCheck 
                          ? format(new Date(auditReport.integrityStatus.lastCheck), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Nunca"}
                      </span>
                      <span className="text-sm text-green-600">{auditReport.integrityStatus.validBackups} íntegros</span>
                      {auditReport.integrityStatus.invalidBackups > 0 && (
                        <span className="text-sm text-red-600">{auditReport.integrityStatus.invalidBackups} com problemas</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <p className="text-xs text-muted-foreground">
                    Relatório gerado em: {format(new Date(auditReport.generatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} por {auditReport.generatedBy}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Teste de Restauração (DR) */}
        <TabsContent value="restore-test" className="space-y-6">
          <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-950">
            <FlaskConical className="h-4 w-4 text-purple-500" />
            <AlertTitle className="text-purple-700 dark:text-purple-300">Teste de Disaster Recovery</AlertTitle>
            <AlertDescription className="text-purple-600 dark:text-purple-400">
              Validação automática que simula a restauração de um backup em ambiente isolado,
              sem afetar os dados de produção. Essencial para garantir que os backups são recuperáveis.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Executar Teste de Restauração
                </CardTitle>
                <CardDescription>
                  Simula a restauração do backup mais recente em ambiente isolado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O teste de restauração executa as seguintes validações:
                </p>
                <ul className="text-sm space-y-2 ml-4">
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Descriptografia AES-256-GCM
                  </li>
                  <li className="flex items-center gap-2">
                    <FileArchive className="h-4 w-4 text-muted-foreground" />
                    Descompressão GZIP
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Parsing JSON
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Verificação de Checksum SHA-256
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Validação de Schema
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Integridade dos Dados
                  </li>
                </ul>
                <Button 
                  onClick={handleRunRestoreTest}
                  disabled={isRunningRestoreTest}
                  className="w-full"
                >
                  {isRunningRestoreTest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando teste...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Executar Teste de Restauração
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Execução automática agendada para domingos às 04:00
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resultado do Teste
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restoreTestResult ? (
                  <div className="space-y-4">
                    {/* Status Geral */}
                    <div className={`p-4 rounded-lg ${restoreTestResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                      <div className="flex items-center gap-2">
                        {restoreTestResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-medium ${restoreTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          {restoreTestResult.success ? 'Teste APROVADO' : 'Teste FALHOU'}
                        </span>
                      </div>
                    </div>

                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xl font-bold">{restoreTestResult.summary?.totalValidations || 6}</p>
                        <p className="text-xs text-muted-foreground">Validações</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-xl font-bold text-green-600">{restoreTestResult.summary?.passedValidations || 0}</p>
                        <p className="text-xs text-green-600">Aprovadas</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-xl font-bold text-red-600">{restoreTestResult.summary?.failedValidations || 0}</p>
                        <p className="text-xs text-red-600">Falhas</p>
                      </div>
                    </div>

                    {/* Detalhes das Validações */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Detalhes das Validações</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Descriptografia</span>
                          {restoreTestResult.validations?.decryption?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Descompressão</span>
                          {restoreTestResult.validations?.decompression?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Parsing JSON</span>
                          {restoreTestResult.validations?.jsonParsing?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Checksum</span>
                          {restoreTestResult.validations?.checksumVerification?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Schema</span>
                          {restoreTestResult.validations?.schemaValidation?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Integridade</span>
                          {restoreTestResult.validations?.dataIntegrity?.success ? (
                            <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    {restoreTestResult.validations?.dataIntegrity && (
                      <div className="text-sm text-muted-foreground">
                        <p>Tabelas verificadas: {restoreTestResult.validations.dataIntegrity.tablesChecked}</p>
                        <p>Registros verificados: {restoreTestResult.validations.dataIntegrity.recordsVerified?.toLocaleString("pt-BR")}</p>
                      </div>
                    )}

                    {/* Duração */}
                    <p className="text-xs text-muted-foreground text-center">
                      Duração: {restoreTestResult.duration}ms | 
                      Testado em: {restoreTestResult.testCompletedAt ? format(new Date(restoreTestResult.testCompletedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Execute um teste para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Restauração */}
      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Restauração
            </DialogTitle>
            <DialogDescription>
              Esta ação irá <strong>substituir TODOS os dados atuais</strong> do sistema pelos dados do backup.
              Esta operação é <strong>irreversível</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {isRestoring ? (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <Progress value={restoreProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                Restaurando backup... Não feche esta janela.
              </p>
            </div>
          ) : (
            <>
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Todos os dados inseridos após a data do backup serão perdidos permanentemente.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" tooltip="Cancelar operação" onClick={() => setShowRestoreConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRestoreConfirm} tooltip="Confirmar ação">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirmar Restauração
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
