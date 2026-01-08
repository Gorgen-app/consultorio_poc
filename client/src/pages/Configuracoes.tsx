import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Shield,
  Stethoscope,
  Calendar,
  DollarSign,
  Eye,
  Save,
  Building2,
  Bell,
  Lock,
  UserPlus,
  RefreshCw,
  X,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { ESPECIALIDADES_MEDICAS, AREAS_ATUACAO } from "../../../shared/especialidadesMedicas";

// Mapeamento de perfis para labels e ícones
const perfilInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin_master: { label: "Administrador Master", icon: <Shield className="h-4 w-4" />, color: "bg-red-500" },
  medico: { label: "Médico", icon: <Stethoscope className="h-4 w-4" />, color: "bg-blue-500" },
  secretaria: { label: "Secretária", icon: <Calendar className="h-4 w-4" />, color: "bg-green-500" },
  financeiro: { label: "Financeiro", icon: <DollarSign className="h-4 w-4" />, color: "bg-yellow-500" },
  visualizador: { label: "Visualizador", icon: <Eye className="h-4 w-4" />, color: "bg-gray-500" },
};

// Status do vínculo para exibição
const statusVinculoInfo: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ativo: { label: "Ativo", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  pendente_renovacao: { label: "Pendente Renovação", color: "bg-yellow-500", icon: <AlertTriangle className="h-4 w-4" /> },
  expirado: { label: "Expirado", color: "bg-red-500", icon: <Clock className="h-4 w-4" /> },
  cancelado: { label: "Cancelado", color: "bg-gray-500", icon: <X className="h-4 w-4" /> },
};

export default function Configuracoes() {
  const { data: profile, isLoading, refetch } = trpc.perfil.me.useQuery();
  const { data: availablePerfis } = trpc.perfil.getAvailablePerfis.useQuery();
  const { data: vinculos, refetch: refetchVinculos } = trpc.perfil.listarMeusVinculos.useQuery();
  const { data: especialidades, refetch: refetchEspecialidades } = trpc.perfil.getEspecialidades.useQuery();
  const { data: medicosDisponiveis } = trpc.perfil.listarMedicosDisponiveis.useQuery();

  const updateProfile = trpc.perfil.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const setPerfilAtivo = trpc.perfil.setPerfilAtivo.useMutation({
    onSuccess: () => {
      toast.success("Perfil alterado com sucesso!");
      refetch();
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Erro ao trocar perfil: ${error.message}`);
    },
  });

  const criarVinculo = trpc.perfil.criarVinculo.useMutation({
    onSuccess: () => {
      toast.success("Vínculo criado com sucesso! Validade: 1 ano.");
      refetchVinculos();
    },
    onError: (error) => {
      toast.error(`Erro ao criar vínculo: ${error.message}`);
    },
  });

  const renovarVinculo = trpc.perfil.renovarVinculo.useMutation({
    onSuccess: () => {
      toast.success("Vínculo renovado por mais 1 ano!");
      refetchVinculos();
    },
    onError: (error) => {
      toast.error(`Erro ao renovar vínculo: ${error.message}`);
    },
  });

  const cancelarVinculo = trpc.perfil.cancelarVinculo.useMutation({
    onSuccess: () => {
      toast.success("Vínculo cancelado.");
      refetchVinculos();
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar vínculo: ${error.message}`);
    },
  });

  const atualizarEspecialidades = trpc.perfil.atualizarEspecialidades.useMutation({
    onSuccess: () => {
      toast.success("Especialidades atualizadas com sucesso!");
      refetchEspecialidades();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar especialidades: ${error.message}`);
    },
  });

  const handleTrocarPerfil = (perfil: "admin_master" | "medico" | "secretaria" | "financeiro" | "visualizador") => {
    if (perfil !== currentPerfil) {
      setPerfilAtivo.mutate({ perfil });
    }
  };

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    email: "",
    crm: "",
    especialidade: "",
  });

  const [especialidadeForm, setEspecialidadeForm] = useState({
    especialidadePrincipal: "",
    especialidadeSecundaria: "",
    areaAtuacao: "",
  });

  const [medicoSelecionado, setMedicoSelecionado] = useState("");

  // Atualizar form quando profile carregar
  useEffect(() => {
    if (profile) {
      setFormData({
        nomeCompleto: profile.nomeCompleto || "",
        cpf: profile.cpf || "",
        email: profile.email || "",
        crm: profile.crm || "",
        especialidade: profile.especialidade || "",
      });
    }
  }, [profile]);

  // Atualizar form de especialidades quando carregar
  useEffect(() => {
    if (especialidades) {
      setEspecialidadeForm({
        especialidadePrincipal: especialidades.especialidadePrincipal || "",
        especialidadeSecundaria: especialidades.especialidadeSecundaria || "",
        areaAtuacao: especialidades.areaAtuacao || "",
      });
    }
  }, [especialidades]);

  const handleSaveProfile = () => {
    updateProfile.mutate(formData);
  };

  const handleSaveEspecialidades = () => {
    atualizarEspecialidades.mutate({
      especialidadePrincipal: especialidadeForm.especialidadePrincipal || null,
      especialidadeSecundaria: especialidadeForm.especialidadeSecundaria || null,
      areaAtuacao: especialidadeForm.areaAtuacao || null,
    });
  };

  const handleCriarVinculo = () => {
    if (!medicoSelecionado) {
      toast.error("Selecione um médico para criar o vínculo");
      return;
    }
    criarVinculo.mutate({ medicoUserId: medicoSelecionado });
    setMedicoSelecionado("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPerfil = profile?.perfilAtivo || "visualizador";
  const currentPerfilInfo = perfilInfo[currentPerfil];
  const isSecretaria = profile?.isSecretaria;
  const isMedico = profile?.isMedico;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e informações pessoais
          </p>
        </div>
        <Badge className={`${currentPerfilInfo?.color} text-white`}>
          {currentPerfilInfo?.icon}
          <span className="ml-1">{currentPerfilInfo?.label}</span>
        </Badge>
      </div>

      {/* Perfis disponíveis */}
      {availablePerfis && availablePerfis.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seus Perfis</CardTitle>
            <CardDescription>
              Você possui {availablePerfis.length} perfis. O perfil ativo determina suas permissões no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availablePerfis.map((perfil) => {
                const info = perfilInfo[perfil];
                const isActive = perfil === currentPerfil;
                return (
                  <Badge
                    key={perfil}
                    variant={isActive ? "default" : "outline"}
                    className={`${isActive ? info?.color + " text-white" : "cursor-pointer hover:bg-accent"} transition-colors`}
                    onClick={() => handleTrocarPerfil(perfil as "admin_master" | "medico" | "secretaria" | "financeiro" | "visualizador")}
                  >
                    {info?.icon}
                    <span className="ml-1">{info?.label}</span>
                    {isActive && <span className="ml-1">(Ativo)</span>}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de configurações */}
      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          
          {/* Aba de Vínculos para Secretária */}
          {isSecretaria && currentPerfil === "secretaria" && (
            <TabsTrigger value="vinculos" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Vínculos</span>
            </TabsTrigger>
          )}

          {/* Aba de Vínculos para Médico (ver secretárias vinculadas) */}
          {isMedico && currentPerfil === "medico" && (
            <TabsTrigger value="vinculos" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Secretárias</span>
            </TabsTrigger>
          )}
          
          {/* Abas específicas por perfil */}
          {(currentPerfil === "admin_master" || currentPerfil === "medico") && (
            <TabsTrigger value="clinica" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clínica</span>
            </TabsTrigger>
          )}
          
          {currentPerfil === "medico" && (
            <TabsTrigger value="profissional" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Profissional</span>
            </TabsTrigger>
          )}
          
          {(currentPerfil === "admin_master" || currentPerfil === "secretaria") && (
            <TabsTrigger value="agendamento" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agendamento</span>
            </TabsTrigger>
          )}
          
          {(currentPerfil === "admin_master" || currentPerfil === "financeiro") && (
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          )}
          
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Perfil */}
        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Seus dados de identificação no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">Nome Completo</Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção de segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de acesso e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação em duas etapas</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Em breve
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessões ativas</p>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os dispositivos conectados à sua conta
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Em breve
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vínculos (Secretária ou Médico) */}
        <TabsContent value="vinculos" className="space-y-4">
          {/* Seção para Secretária - Criar vínculo com médico */}
          {isSecretaria && currentPerfil === "secretaria" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Vincular a um Médico
                </CardTitle>
                <CardDescription>
                  Crie um vínculo com um médico para gerenciar sua agenda. O vínculo tem validade de 1 ano e precisa ser renovado pelo médico.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Selecione o Médico</Label>
                    <Select value={medicoSelecionado} onValueChange={setMedicoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um médico..." />
                      </SelectTrigger>
                      <SelectContent>
                        {medicosDisponiveis?.map((medico) => (
                          <SelectItem key={String(medico.userId)} value={String(medico.userId)}>
                            {medico.nomeCompleto || "Sem nome"} {medico.crm ? `- CRM ${medico.crm}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleCriarVinculo} disabled={criarVinculo.isPending || !medicoSelecionado}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {criarVinculo.isPending ? "Criando..." : "Criar Vínculo"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de vínculos */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isSecretaria && currentPerfil === "secretaria" ? "Médicos Vinculados" : "Secretárias Vinculadas"}
              </CardTitle>
              <CardDescription>
                {isSecretaria && currentPerfil === "secretaria" 
                  ? "Médicos com os quais você possui vínculo ativo"
                  : "Secretárias que possuem vínculo com você. Você pode renovar ou cancelar os vínculos."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vinculos && vinculos.length > 0 ? (
                <div className="space-y-4">
                  {vinculos.map((vinculo: any) => {
                    const statusInfo = statusVinculoInfo[vinculo.status] || statusVinculoInfo.ativo;
                    const pessoa = isSecretaria ? vinculo.medico : vinculo.secretaria;
                    const dataValidade = new Date(vinculo.dataValidade);
                    const diasRestantes = Math.ceil((dataValidade.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={vinculo.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {isSecretaria ? <Stethoscope className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{pessoa?.nomeCompleto || "Nome não informado"}</p>
                            <p className="text-sm text-muted-foreground">{pessoa?.email || "Email não informado"}</p>
                            {isSecretaria && pessoa?.crm && (
                              <p className="text-xs text-muted-foreground">CRM: {pessoa.crm}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={`${statusInfo.color} text-white`}>
                              {statusInfo.icon}
                              <span className="ml-1">{statusInfo.label}</span>
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {vinculo.status === "ativo" && diasRestantes > 0 
                                ? `Expira em ${diasRestantes} dias`
                                : vinculo.status === "pendente_renovacao"
                                ? "Aguardando renovação"
                                : `Válido até ${dataValidade.toLocaleDateString("pt-BR")}`
                              }
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {/* Médico pode renovar vínculos pendentes */}
                            {isMedico && currentPerfil === "medico" && vinculo.status === "pendente_renovacao" && (
                              <Button 
                                size="sm" 
                                onClick={() => renovarVinculo.mutate({ vinculoId: vinculo.id })}
                                disabled={renovarVinculo.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renovar
                              </Button>
                            )}
                            {/* Ambos podem cancelar */}
                            {vinculo.status !== "cancelado" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => cancelarVinculo.mutate({ vinculoId: vinculo.id })}
                                disabled={cancelarVinculo.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vínculo encontrado</p>
                  {isSecretaria && currentPerfil === "secretaria" && (
                    <p className="text-sm mt-2">Crie um vínculo com um médico para começar</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações sobre o sistema de vínculos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre os Vínculos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Cada vínculo tem validade de <strong>1 ano</strong> a partir da data de criação.</p>
              <p>• <strong>30 dias antes</strong> do vencimento, o médico receberá uma notificação para renovar o vínculo.</p>
              <p>• Se não renovado, o vínculo expira automaticamente e a secretária perde acesso à agenda do médico.</p>
              <p>• Tanto o médico quanto a secretária podem cancelar o vínculo a qualquer momento.</p>
              <p>• O histórico de vínculos é mantido para auditoria, conforme os Pilares do Gorgen.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Clínica (Admin/Médico) */}
        <TabsContent value="clinica" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Clínica</CardTitle>
              <CardDescription>
                Informações do consultório para documentos e relatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Clínica</Label>
                  <Input placeholder="Consultório Dr. André Gorgen" disabled />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input placeholder="00.000.000/0000-00" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input placeholder="Endereço completo" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="(00) 0000-0000" disabled />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                * Configurações da clínica serão implementadas em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Profissional (Médico) */}
        <TabsContent value="profissional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>
                Informações para documentos médicos e prescrições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    placeholder="CRM/UF 00000"
                  />
                </div>
              </div>
              
              <Separator />

              <h4 className="font-medium">Especialidades Médicas</h4>
              <p className="text-sm text-muted-foreground">
                Selecione suas especialidades reconhecidas pelo CFM (Resolução nº 2.330/2023)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Especialidade Principal</Label>
                  <Select 
                    value={especialidadeForm.especialidadePrincipal} 
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, especialidadePrincipal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialidade principal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {ESPECIALIDADES_MEDICAS.map((esp) => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Segunda Especialidade (opcional)</Label>
                  <Select 
                    value={especialidadeForm.especialidadeSecundaria} 
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, especialidadeSecundaria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a segunda especialidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {ESPECIALIDADES_MEDICAS.map((esp) => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Área de Atuação</Label>
                  <Select 
                    value={especialidadeForm.areaAtuacao} 
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, areaAtuacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área de atuação..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {AREAS_ATUACAO.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Configurações de Prontuário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Modelo SOAP</p>
                      <p className="text-sm text-muted-foreground">Usar formato SOAP nas evoluções</p>
                    </div>
                    <Badge variant="outline">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Assinatura Digital</p>
                      <p className="text-sm text-muted-foreground">Assinar documentos digitalmente</p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button onClick={handleSaveEspecialidades} disabled={atualizarEspecialidades.isPending} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  {atualizarEspecialidades.isPending ? "Salvando..." : "Salvar Especialidades"}
                </Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Salvando..." : "Salvar CRM"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agendamento (Admin/Secretária) */}
        <TabsContent value="agendamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Agendamento</CardTitle>
              <CardDescription>
                Defina horários de funcionamento e regras de agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <Input type="time" defaultValue="07:00" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Horário de Término</Label>
                  <Input type="time" defaultValue="20:00" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Duração Padrão da Consulta</Label>
                  <Input type="number" defaultValue="30" disabled />
                  <p className="text-xs text-muted-foreground">Em minutos</p>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Consultas</Label>
                  <Input type="number" defaultValue="0" disabled />
                  <p className="text-xs text-muted-foreground">Em minutos</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Dias de Funcionamento</h4>
                <div className="flex flex-wrap gap-2">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia, index) => (
                    <Badge 
                      key={dia} 
                      variant={index < 5 ? "default" : "outline"}
                      className={index < 5 ? "bg-primary" : ""}
                    >
                      {dia}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                * Configurações de agendamento serão implementadas em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financeiro (Admin/Financeiro) */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Financeiras</CardTitle>
              <CardDescription>
                Defina valores padrão e regras de faturamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Padrão da Consulta</Label>
                  <Input type="number" placeholder="0,00" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Valor Padrão do Retorno</Label>
                  <Input type="number" placeholder="0,00" disabled />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Formas de Pagamento Aceitas</h4>
                <div className="flex flex-wrap gap-2">
                  {["Dinheiro", "PIX", "Cartão Débito", "Cartão Crédito", "Convênio"].map((forma) => (
                    <Badge key={forma} variant="outline">{forma}</Badge>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                * Configurações financeiras serão implementadas em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novos agendamentos</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificação quando um novo agendamento for criado
                    </p>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cancelamentos</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificação quando um agendamento for cancelado
                    </p>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Renovação de vínculo</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificação quando um vínculo estiver próximo de expirar
                    </p>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembretes de consulta</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes automáticos aos pacientes
                    </p>
                  </div>
                  <Badge variant="outline">Em breve</Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                * Sistema de notificações será expandido em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
