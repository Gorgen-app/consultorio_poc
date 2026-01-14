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
  AlertTriangle,
  Upload,
  Lock,
  Unlock,
  RotateCcw,
  FileUp,
  ShieldCheck,
  Mail
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function BackupSettings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
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
      toast.success("Backup concluído com sucesso!", {
        description: "Os dados foram criptografados com AES-256-GCM e salvos no S3."
      });
    },
    onError: (error) => {
      setIsBackingUp(false);
      toast.error("Erro ao executar backup", { description: error.message });
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
        // Limpar estado
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setValidationResult(null);
    
    // Validar automaticamente
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

      {/* Tabs: Backup / Restauração */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Restauração
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
                  <p className="text-xs text-muted-foreground">
                    Receba notificações por e-mail além das notificações no sistema
                  </p>
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
        </TabsContent>

        {/* Tab: Restauração */}
        <TabsContent value="restore" className="space-y-6">
          {/* Alerta de Aviso */}
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
                <CardDescription>
                  Verificação de integridade e compatibilidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isValidating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Validando arquivo de backup...</p>
                    <p className="text-xs text-muted-foreground mt-2">Descriptografando e verificando integridade</p>
                  </div>
                ) : validationResult ? (
                  validationResult.valid ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Backup válido e pronto para restauração</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Versão:</span>
                          <span>{validationResult.metadata?.version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="capitalize">{validationResult.metadata?.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Data do backup:</span>
                          <span>
                            {validationResult.metadata?.createdAt 
                              ? format(new Date(validationResult.metadata.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tabelas:</span>
                          <span>{validationResult.metadata?.totalTables}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Registros:</span>
                          <span>{validationResult.metadata?.totalRecords?.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Versão GORGEN:</span>
                          <span>{validationResult.metadata?.gorgenVersion}</span>
                        </div>
                      </div>
                      <Separator />
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
                        <span className="font-medium">Arquivo de backup inválido</span>
                      </div>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{validationResult.error}</AlertDescription>
                      </Alert>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Selecione um arquivo de backup para validar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5" />
                Instruções de Restauração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Faça um backup atual do sistema antes de restaurar (para segurança)</li>
                <li>Selecione o arquivo de backup (.json.gz.enc) que deseja restaurar</li>
                <li>Aguarde a validação automática do arquivo</li>
                <li>Verifique os metadados do backup (data, registros, versão)</li>
                <li>Confirme a restauração digitando "RESTAURAR" no diálogo de confirmação</li>
                <li>Aguarde a conclusão do processo (pode levar alguns minutos)</li>
                <li>Após a restauração, verifique se os dados foram recuperados corretamente</li>
              </ol>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> O arquivo de backup deve ter sido gerado pelo mesmo tenant. 
                Backups de outros tenants não podem ser restaurados por questões de segurança.
              </p>
            </CardContent>
          </Card>
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
                <Button variant="outline" onClick={() => setShowRestoreConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRestoreConfirm}>
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
