/**
 * Google Calendar Settings Component
 * Configurações de sincronização com Google Calendar
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calendar, 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { toast } from "sonner";

export function GoogleCalendarSettings() {
  const [isSaving, setIsSaving] = useState(false);
  
  // Buscar configuração atual
  const { data: config, isLoading, refetch } = trpc.googleCalendar.getConfig.useQuery();
  
  // Buscar sincronizações pendentes
  const { data: pendingSyncs } = trpc.googleCalendar.listPending.useQuery();
  
  // Mutation para salvar configuração
  const saveConfigMutation = trpc.googleCalendar.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
  
  // Estado local para edição
  const [localConfig, setLocalConfig] = useState({
    syncEnabled: config?.syncEnabled ?? false,
    syncDirection: config?.syncDirection ?? "bidirectional",
    googleCalendarId: config?.googleCalendarId ?? "primary",
    syncConsultas: config?.syncConsultas ?? true,
    syncCirurgias: config?.syncCirurgias ?? true,
    syncReunions: config?.syncReunions ?? true,
    syncBloqueios: config?.syncBloqueios ?? false,
    syncOutros: config?.syncOutros ?? true,
    includePatientName: config?.includePatientName ?? false,
    includePatientPhone: config?.includePatientPhone ?? false,
    eventVisibility: config?.eventVisibility ?? "private",
  });
  
  // Atualizar estado local quando config carregar
  useState(() => {
    if (config) {
      setLocalConfig({
        syncEnabled: config.syncEnabled ?? false,
        syncDirection: config.syncDirection ?? "bidirectional",
        googleCalendarId: config.googleCalendarId ?? "primary",
        syncConsultas: config.syncConsultas ?? true,
        syncCirurgias: config.syncCirurgias ?? true,
        syncReunions: config.syncReunions ?? true,
        syncBloqueios: config.syncBloqueios ?? false,
        syncOutros: config.syncOutros ?? true,
        includePatientName: config.includePatientName ?? false,
        includePatientPhone: config.includePatientPhone ?? false,
        eventVisibility: config.eventVisibility ?? "private",
      });
    }
  });
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveConfigMutation.mutateAsync(localConfig);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case "bidirectional":
        return <ArrowLeftRight className="h-4 w-4" />;
      case "to_google_only":
        return <ArrowRight className="h-4 w-4" />;
      case "from_google_only":
        return <ArrowLeft className="h-4 w-4" />;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Google Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Sincronize seus agendamentos com o Google Calendar
          </p>
        </div>
      </div>
      
      {/* Status Alert */}
      {localConfig.syncEnabled ? (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Sincronização Ativa</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Seus agendamentos estão sendo sincronizados com o Google Calendar.
            {pendingSyncs && pendingSyncs.length > 0 && (
              <span className="ml-2">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {pendingSyncs.length} pendente(s)
                </Badge>
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sincronização Desativada</AlertTitle>
          <AlertDescription>
            Ative a sincronização para manter seus agendamentos atualizados no Google Calendar.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurações de Sincronização
          </CardTitle>
          <CardDescription>
            Configure como os agendamentos serão sincronizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sync-enabled" className="text-base">Ativar Sincronização</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar agendamentos automaticamente
              </p>
            </div>
            <Switch
              id="sync-enabled"
              checked={localConfig.syncEnabled}
              onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncEnabled: checked })}
            />
          </div>
          
          <Separator />
          
          {/* Sync Direction */}
          <div className="space-y-2">
            <Label>Direção da Sincronização</Label>
            <Select
              value={localConfig.syncDirection}
              onValueChange={(value: "bidirectional" | "to_google_only" | "from_google_only") => 
                setLocalConfig({ ...localConfig, syncDirection: value })
              }
              disabled={!localConfig.syncEnabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bidirectional">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    Bidirecional (GORGEN ↔ Google)
                  </div>
                </SelectItem>
                <SelectItem value="to_google_only">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Apenas GORGEN → Google
                  </div>
                </SelectItem>
                <SelectItem value="from_google_only">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Apenas Google → GORGEN
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Bidirecional mantém ambos os calendários sincronizados
            </p>
          </div>
          
          <Separator />
          
          {/* Types to Sync */}
          <div className="space-y-4">
            <Label className="text-base">Tipos de Compromisso</Label>
            <p className="text-sm text-muted-foreground">
              Selecione quais tipos de compromisso devem ser sincronizados
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-consultas"
                  checked={localConfig.syncConsultas}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncConsultas: checked })}
                  disabled={!localConfig.syncEnabled}
                />
                <Label htmlFor="sync-consultas">🩺 Consultas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-cirurgias"
                  checked={localConfig.syncCirurgias}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncCirurgias: checked })}
                  disabled={!localConfig.syncEnabled}
                />
                <Label htmlFor="sync-cirurgias">🏥 Cirurgias</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-reunioes"
                  checked={localConfig.syncReunions}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncReunions: checked })}
                  disabled={!localConfig.syncEnabled}
                />
                <Label htmlFor="sync-reunioes">📅 Reuniões</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-bloqueios"
                  checked={localConfig.syncBloqueios}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncBloqueios: checked })}
                  disabled={!localConfig.syncEnabled}
                />
                <Label htmlFor="sync-bloqueios">🚫 Bloqueios</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-outros"
                  checked={localConfig.syncOutros}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, syncOutros: checked })}
                  disabled={!localConfig.syncEnabled}
                />
                <Label htmlFor="sync-outros">📋 Outros</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade e LGPD
          </CardTitle>
          <CardDescription>
            Configure quais informações serão incluídas nos eventos do Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Atenção à LGPD</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Incluir dados de pacientes no Google Calendar pode violar a LGPD. 
              Recomendamos manter essas opções desativadas.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-name" className="flex items-center gap-2">
                  {localConfig.includePatientName ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Incluir Nome do Paciente
                </Label>
                <p className="text-sm text-muted-foreground">
                  O nome do paciente aparecerá no título do evento
                </p>
              </div>
              <Switch
                id="include-name"
                checked={localConfig.includePatientName}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, includePatientName: checked })}
                disabled={!localConfig.syncEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-phone" className="flex items-center gap-2">
                  {localConfig.includePatientPhone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Incluir Telefone do Paciente
                </Label>
                <p className="text-sm text-muted-foreground">
                  O telefone aparecerá na descrição do evento
                </p>
              </div>
              <Switch
                id="include-phone"
                checked={localConfig.includePatientPhone}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, includePatientPhone: checked })}
                disabled={!localConfig.syncEnabled}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Visibilidade dos Eventos</Label>
              <Select
                value={localConfig.eventVisibility}
                onValueChange={(value: "default" | "public" | "private") => 
                  setLocalConfig({ ...localConfig, eventVisibility: value })
                }
                disabled={!localConfig.syncEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Privado (recomendado)
                    </div>
                  </SelectItem>
                  <SelectItem value="default">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Padrão do calendário
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Público
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Last Sync Info */}
      {config?.lastFullSyncAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Última sincronização completa: {new Date(config.lastFullSyncAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
}
