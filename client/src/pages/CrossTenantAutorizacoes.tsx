import { useState } from "react";
import { trpc } from "@/lib/trpc";
// DashboardLayout é aplicado globalmente no App.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  Building2, 
  User, 
  FileText, 
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History
} from "lucide-react";

export default function CrossTenantAutorizacoes() {
  const [activeTab, setActiveTab] = useState("recebidas");
  const [showSolicitarDialog, setShowSolicitarDialog] = useState(false);
  const [showAprovarDialog, setShowAprovarDialog] = useState(false);
  const [selectedAutorizacao, setSelectedAutorizacao] = useState<any>(null);
  const [consentimentoLGPD, setConsentimentoLGPD] = useState(false);
  
  // Form state para nova solicitação
  const [novaAutorizacao, setNovaAutorizacao] = useState({
    tenantOrigemId: "",
    pacienteId: "",
    tipoAutorizacao: "leitura" as "leitura" | "escrita" | "completo",
    escopoAutorizacao: "completo" as "prontuario" | "atendimentos" | "exames" | "documentos" | "completo",
    motivo: "",
    dataFim: "",
  });

  // Queries
  const { data: autorizacoesRecebidas, refetch: refetchRecebidas } = trpc.crossTenant.listAutorizacoesRecebidas.useQuery();
  const { data: autorizacoesConcedidas, refetch: refetchConcedidas } = trpc.crossTenant.listAutorizacoesConcedidas.useQuery();
  const { data: accessLogs } = trpc.crossTenant.listAccessLogs.useQuery({ limit: 50 });
  const { data: tenantAtivo } = trpc.tenants.getActiveTenant.useQuery();

  // Mutations
  const solicitarMutation = trpc.crossTenant.solicitarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso!");
      setShowSolicitarDialog(false);
      refetchRecebidas();
      setNovaAutorizacao({
        tenantOrigemId: "",
        pacienteId: "",
        tipoAutorizacao: "leitura",
        escopoAutorizacao: "completo",
        motivo: "",
        dataFim: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao solicitar: ${error.message}`);
    },
  });

  const aprovarMutation = trpc.crossTenant.aprovarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Autorização aprovada!");
      setShowAprovarDialog(false);
      refetchConcedidas();
      setSelectedAutorizacao(null);
      setConsentimentoLGPD(false);
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejeitarMutation = trpc.crossTenant.rejeitarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Autorização rejeitada");
      refetchConcedidas();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const revogarMutation = trpc.crossTenant.revogarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Autorização revogada");
      refetchConcedidas();
    },
    onError: (error) => {
      toast.error(`Erro ao revogar: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pendente: { variant: "secondary", icon: Clock },
      ativa: { variant: "default", icon: CheckCircle },
      revogada: { variant: "destructive", icon: XCircle },
      expirada: { variant: "outline", icon: AlertTriangle },
      rejeitada: { variant: "destructive", icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.pendente;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "leitura": return <Eye className="h-4 w-4 text-[#0056A4]" />;
      case "escrita": return <FileText className="h-4 w-4 text-yellow-500" />;
      case "completo": return <Download className="h-4 w-4 text-emerald-500" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Compartilhamento Cross-Tenant
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie autorizações de acesso a dados entre clínicas parceiras
            </p>
          </div>
          <Dialog open={showSolicitarDialog} onOpenChange={setShowSolicitarDialog}>
            <DialogTrigger asChild>
              <Button>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Solicitar Acesso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Solicitar Acesso a Dados</DialogTitle>
                <DialogDescription>
                  Solicite autorização para acessar dados de um paciente em outra clínica.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenantOrigem">ID da Clínica de Origem</Label>
                  <Input
                    id="tenantOrigem"
                    type="number"
                    placeholder="Ex: 30002"
                    value={novaAutorizacao.tenantOrigemId}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, tenantOrigemId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paciente">ID do Paciente</Label>
                  <Input
                    id="paciente"
                    type="number"
                    placeholder="Ex: 123"
                    value={novaAutorizacao.pacienteId}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, pacienteId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Acesso</Label>
                  <Select
                    value={novaAutorizacao.tipoAutorizacao}
                    onValueChange={(v: any) => setNovaAutorizacao({ ...novaAutorizacao, tipoAutorizacao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leitura">Somente Leitura</SelectItem>
                      <SelectItem value="escrita">Leitura e Escrita</SelectItem>
                      <SelectItem value="completo">Acesso Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Escopo</Label>
                  <Select
                    value={novaAutorizacao.escopoAutorizacao}
                    onValueChange={(v: any) => setNovaAutorizacao({ ...novaAutorizacao, escopoAutorizacao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prontuario">Prontuário</SelectItem>
                      <SelectItem value="atendimentos">Atendimentos</SelectItem>
                      <SelectItem value="exames">Exames</SelectItem>
                      <SelectItem value="documentos">Documentos</SelectItem>
                      <SelectItem value="completo">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="motivo">Motivo da Solicitação</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Descreva o motivo da solicitação (mínimo 10 caracteres)"
                    value={novaAutorizacao.motivo}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, motivo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dataFim">Data de Expiração (opcional)</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={novaAutorizacao.dataFim}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, dataFim: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSolicitarDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    solicitarMutation.mutate({
                      tenantOrigemId: parseInt(novaAutorizacao.tenantOrigemId),
                      pacienteId: parseInt(novaAutorizacao.pacienteId),
                      tipoAutorizacao: novaAutorizacao.tipoAutorizacao,
                      escopoAutorizacao: novaAutorizacao.escopoAutorizacao,
                      motivo: novaAutorizacao.motivo,
                      dataFim: novaAutorizacao.dataFim || undefined,
                    });
                  }}
                  disabled={solicitarMutation.isPending || novaAutorizacao.motivo.length < 10}
                >
                  {solicitarMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-[#0056A4] dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0056A4] dark:text-blue-100">Conformidade LGPD</h3>
                <p className="text-sm text-[#0056A4] dark:text-blue-300 mt-1">
                  Todo compartilhamento de dados entre clínicas requer consentimento explícito do paciente.
                  Os acessos são registrados em log de auditoria para fins de conformidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recebidas" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Acessos Recebidos
              {autorizacoesRecebidas && autorizacoesRecebidas.length > 0 && (
                <Badge variant="secondary" className="ml-1">{autorizacoesRecebidas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="concedidas" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Acessos Concedidos
              {autorizacoesConcedidas && autorizacoesConcedidas.length > 0 && (
                <Badge variant="secondary" className="ml-1">{autorizacoesConcedidas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Log de Auditoria
            </TabsTrigger>
          </TabsList>

          {/* Autorizações Recebidas */}
          <TabsContent value="recebidas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Autorizações Recebidas</CardTitle>
                <CardDescription>
                  Dados de outras clínicas que você tem permissão para acessar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!autorizacoesRecebidas || autorizacoesRecebidas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma autorização recebida</p>
                    <p className="text-sm mt-1">Solicite acesso a dados de outras clínicas usando o botão acima</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {autorizacoesRecebidas.map((item: any) => (
                      <div
                        key={item.autorizacao.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {item.tenantOrigem?.nome || "Clínica"}
                              {getTipoIcon(item.autorizacao.tipoAutorizacao)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Paciente: {item.paciente?.nome || `ID ${item.autorizacao.pacienteId}`}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Escopo: {item.autorizacao.escopoAutorizacao} | 
                              Válido até: {item.autorizacao.dataFim ? new Date(item.autorizacao.dataFim).toLocaleDateString() : "Indefinido"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.autorizacao.status)}
                          {item.autorizacao.status === "ativa" && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Acessar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Autorizações Concedidas */}
          <TabsContent value="concedidas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Autorizações Concedidas</CardTitle>
                <CardDescription>
                  Solicitações de acesso aos dados dos seus pacientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!autorizacoesConcedidas || autorizacoesConcedidas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação pendente</p>
                    <p className="text-sm mt-1">Quando outras clínicas solicitarem acesso, aparecerá aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {autorizacoesConcedidas.map((item: any) => (
                      <div
                        key={item.autorizacao.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-yellow-500/10 rounded-full">
                            <Building2 className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {item.tenantDestino?.nome || "Clínica Solicitante"}
                              {getTipoIcon(item.autorizacao.tipoAutorizacao)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Motivo: {item.autorizacao.motivo || "Não informado"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Solicitado em: {new Date(item.autorizacao.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.autorizacao.status)}
                          {item.autorizacao.status === "pendente" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAutorizacao(item.autorizacao);
                                  setShowAprovarDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejeitarMutation.mutate({ autorizacaoId: item.autorizacao.id })}
                                disabled={rejeitarMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {item.autorizacao.status === "ativa" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revogarMutation.mutate({ autorizacaoId: item.autorizacao.id })}
                              disabled={revogarMutation.isPending}
                            >
                              <ShieldX className="h-4 w-4 mr-1 text-red-600" />
                              Revogar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Log de Auditoria */}
          <TabsContent value="auditoria" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Log de Auditoria</CardTitle>
                <CardDescription>
                  Registro de todos os acessos cross-tenant para conformidade LGPD
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!accessLogs || accessLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum acesso registrado</p>
                    <p className="text-sm mt-1">Os acessos cross-tenant serão registrados aqui</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accessLogs.map((log: any) => (
                      <div
                        key={log.log.id}
                        className="flex items-center justify-between p-3 border rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-muted rounded">
                            {log.log.tipoAcao === "visualizacao" && <Eye className="h-4 w-4" />}
                            {log.log.tipoAcao === "download" && <Download className="h-4 w-4" />}
                            {log.log.tipoAcao === "impressao" && <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium">
                              {log.log.tipoAcao.charAt(0).toUpperCase() + log.log.tipoAcao.slice(1)} - {log.log.recursoTipo}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {log.log.detalhes}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-muted-foreground text-xs">
                          <div>{new Date(log.log.createdAt).toLocaleString()}</div>
                          <div>IP: {log.log.ipAddress || "N/A"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Aprovação */}
        <Dialog open={showAprovarDialog} onOpenChange={setShowAprovarDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Solicitação de Acesso</DialogTitle>
              <DialogDescription>
                Ao aprovar, você está autorizando o acesso aos dados do paciente conforme a LGPD.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentimento"
                  checked={consentimentoLGPD}
                  onCheckedChange={(checked) => setConsentimentoLGPD(checked as boolean)}
                />
                <label htmlFor="consentimento" className="text-sm leading-relaxed">
                  Confirmo que o paciente forneceu consentimento explícito para o compartilhamento
                  de seus dados médicos com a clínica solicitante, em conformidade com a Lei Geral
                  de Proteção de Dados (LGPD).
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAprovarDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedAutorizacao) {
                    aprovarMutation.mutate({
                      autorizacaoId: selectedAutorizacao.id,
                      consentimentoLGPD,
                    });
                  }
                }}
                disabled={!consentimentoLGPD || aprovarMutation.isPending}
              >
                {aprovarMutation.isPending ? "Aprovando..." : "Aprovar Acesso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
