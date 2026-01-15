import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/MaskedInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Shield,
  Stethoscope,
  Calendar,
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
  CreditCard,
  Crown,
  AlertCircle,
  FlaskConical,
  HardDrive,
} from "lucide-react";
import { Link } from "wouter";
import { ESPECIALIDADES_MEDICAS, AREAS_ATUACAO } from "../../../shared/especialidadesMedicas";

// Mapeamento de perfis para labels e ícones
const perfilInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin_master: { label: "Administrador Master", icon: <Shield className="h-4 w-4" />, color: "bg-red-500" },
  medico: { label: "Médico", icon: <Stethoscope className="h-4 w-4" />, color: "bg-blue-500" },
  secretaria: { label: "Secretária", icon: <Calendar className="h-4 w-4" />, color: "bg-emerald-500" },
  auditor: { label: "Auditor", icon: <Eye className="h-4 w-4" />, color: "bg-purple-500" },
  paciente: { label: "Paciente", icon: <User className="h-4 w-4" />, color: "bg-gray-500" },
};

// Status do vínculo para exibição
const statusVinculoInfo: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ativo: { label: "Ativo", color: "bg-emerald-500", icon: <CheckCircle className="h-4 w-4" /> },
  pendente_renovacao: { label: "Pendente Renovação", color: "bg-yellow-500", icon: <AlertTriangle className="h-4 w-4" /> },
  expirado: { label: "Expirado", color: "bg-red-500", icon: <Clock className="h-4 w-4" /> },
  cancelado: { label: "Cancelado", color: "bg-gray-500", icon: <X className="h-4 w-4" /> },
};

// Componente de Alerta de Pacientes Inativos
function AlertaPacientesInativos() {
  const { data: pacientesInativos, isLoading } = trpc.pacientes.buscarPacientesInativos.useQuery();
  const notificarMutation = trpc.pacientes.notificarPacientesInativos.useMutation({
    onSuccess: (data) => {
      if (data.enviado) {
        toast.success(`Notificação enviada! ${data.total} pacientes identificados.`);
      } else {
        toast.info(data.mensagem || "Nenhum paciente para notificar");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar notificação: ${error.message}`);
    },
  });

  const total = pacientesInativos?.length || 0;

  return (
    <Card className={total > 0 ? "border-orange-300 bg-orange-50 dark:bg-orange-950" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${total > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          Pacientes Ativos sem Atendimento
        </CardTitle>
        <CardDescription>
          Pacientes marcados como ATIVOS que não têm atendimentos há mais de 360 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : total > 0 ? (
          <>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                {total} paciente{total > 1 ? "s" : ""} ativo{total > 1 ? "s" : ""} sem atendimento há 360+ dias
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                Recomendação: Revise o status ou entre em contato para reativação
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => notificarMutation.mutate()}
                disabled={notificarMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {notificarMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Enviar Notificação
              </Button>
              <Link href="/atendimentos/relatorios">
                <Button variant="outline">
                  Ver Relatório
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span>Nenhum paciente ativo sem atendimento há 360+ dias</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("perfil");
  
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

  const currentPerfil = profile?.perfilAtivo || "paciente";
  const currentPerfilInfo = perfilInfo[currentPerfil];
  const isSecretaria = profile?.isSecretaria;
  const isMedico = profile?.isMedico;

  const handleTrocarPerfil = (perfil: "admin_master" | "medico" | "secretaria" | "auditor" | "paciente") => {
    if (perfil !== currentPerfil) {
      setPerfilAtivo.mutate({ perfil });
    }
  };

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
                    onClick={() => handleTrocarPerfil(perfil as "admin_master" | "medico" | "secretaria" | "auditor" | "paciente")}
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

      {/* Abas de configurações - usando botões manuais */}
      <div className="w-full">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg mb-4">
          <Button
            variant={activeTab === "perfil" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("perfil")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </Button>
          
          {/* Aba de Vínculos para Secretária */}
          {isSecretaria && currentPerfil === "secretaria" && (
            <Button
              variant={activeTab === "vinculos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("vinculos")}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Vínculos</span>
            </Button>
          )}

          {/* Aba de Secretárias para Médico */}
          {isMedico && currentPerfil === "medico" && (
            <Button
              variant={activeTab === "vinculos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("vinculos")}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Secretárias</span>
            </Button>
          )}
          
          {/* Abas específicas por perfil */}
          {(currentPerfil === "admin_master" || currentPerfil === "medico") && (
            <Button
              variant={activeTab === "clinica" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("clinica")}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clínica</span>
            </Button>
          )}
          
          {currentPerfil === "medico" && (
            <Button
              variant={activeTab === "profissional" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("profissional")}
              className="flex items-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Profissional</span>
            </Button>
          )}
          
          <Button
            variant={activeTab === "notificacoes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("notificacoes")}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </Button>
          
          {/* Aba de Assinatura - visível para todos */}
          <Button
            variant={activeTab === "assinatura" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("assinatura")}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Assinatura</span>
          </Button>
          
          {/* Botão para Exames Favoritos */}
          <Link href="/configuracoes/exames-favoritos">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Exames Favoritos</span>
            </Button>
          </Link>
          
          {/* Botão para Backup - Apenas Admin Master */}
          {currentPerfil === "admin_master" && (
            <Link href="/configuracoes/backup">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">Backup</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Conteúdo das abas */}
        
        {/* Tab: Perfil */}
        {activeTab === "perfil" && (
          <div className="space-y-4">
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
                      placeholder="Seu nome completo"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <MaskedInput
                      mask="cpf"
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                  <Badge variant="outline">Em breve</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessões ativas</p>
                    <p className="text-sm text-muted-foreground">
                      Gerencie os dispositivos conectados à sua conta
                    </p>
                  </div>
                  <Badge variant="outline">Em breve</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Vínculos */}
        {activeTab === "vinculos" && (
          <div className="space-y-4">
            {/* Para Secretária: gerenciar vínculos com médicos */}
            {isSecretaria && currentPerfil === "secretaria" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Criar Novo Vínculo</CardTitle>
                    <CardDescription>
                      Vincule-se a um médico para ter acesso à agenda e pacientes dele.
                      O vínculo tem validade de 1 ano e pode ser renovado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <Select value={medicoSelecionado} onValueChange={setMedicoSelecionado}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um médico" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicosDisponiveis?.map((medico) => (
                            <SelectItem key={String(medico.userId)} value={String(medico.userId)}>
                              {medico.nomeCompleto} - {medico.especialidade || "Sem especialidade"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleCriarVinculo} disabled={criarVinculo.isPending}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Vínculo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Meus Vínculos</CardTitle>
                    <CardDescription>
                      Médicos aos quais você está vinculada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {vinculos && vinculos.length > 0 ? (
                      <div className="space-y-3">
                        {vinculos.map((vinculo: any) => {
                          const statusInfo = statusVinculoInfo[vinculo.status];
                          const dataExpiracao = new Date(vinculo.dataExpiracao);
                          const diasRestantes = Math.ceil((dataExpiracao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div key={vinculo.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${statusInfo?.color} text-white`}>
                                  <Stethoscope className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{vinculo.medicoNome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Expira em: {dataExpiracao.toLocaleDateString("pt-BR")}
                                    {diasRestantes > 0 && diasRestantes <= 30 && (
                                      <span className="text-yellow-600 ml-2">({diasRestantes} dias)</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${statusInfo?.color} text-white`}>
                                  {statusInfo?.icon}
                                  <span className="ml-1">{statusInfo?.label}</span>
                                </Badge>
                                {vinculo.status === "pendente_renovacao" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => renovarVinculo.mutate({ vinculoId: vinculo.id })}
                                    disabled={renovarVinculo.isPending}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Renovar
                                  </Button>
                                )}
                                {vinculo.status === "ativo" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => cancelarVinculo.mutate({ vinculoId: vinculo.id })}
                                    disabled={cancelarVinculo.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Você ainda não possui vínculos com médicos.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Para Médico: ver secretárias vinculadas */}
            {isMedico && currentPerfil === "medico" && (
              <Card>
                <CardHeader>
                  <CardTitle>Secretárias Vinculadas</CardTitle>
                  <CardDescription>
                    Secretárias que têm acesso à sua agenda e pacientes.
                    Você receberá notificações para renovar vínculos próximos do vencimento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vinculos && vinculos.length > 0 ? (
                    <div className="space-y-3">
                      {vinculos.map((vinculo: any) => {
                        const statusInfo = statusVinculoInfo[vinculo.status];
                        const dataExpiracao = new Date(vinculo.dataExpiracao);
                        
                        return (
                          <div key={vinculo.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${statusInfo?.color} text-white`}>
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{vinculo.secretariaNome}</p>
                                <p className="text-sm text-muted-foreground">
                                  Vínculo até: {dataExpiracao.toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusInfo?.color} text-white`}>
                                {statusInfo?.icon}
                                <span className="ml-1">{statusInfo?.label}</span>
                              </Badge>
                              {vinculo.status === "pendente_renovacao" && (
                                <Button
                                  size="sm"
                                  onClick={() => renovarVinculo.mutate({ vinculoId: vinculo.id })}
                                  disabled={renovarVinculo.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar Renovação
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma secretária vinculada no momento.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tab: Clínica */}
        {activeTab === "clinica" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Clínica</CardTitle>
                <CardDescription>
                  Informações do consultório ou clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Clínica</Label>
                    <Input placeholder="Nome do consultório/clínica" />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input placeholder="Endereço completo" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input placeholder="UF" />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input placeholder="00000-000" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Profissional (Médico) */}
        {activeTab === "profissional" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro Profissional</CardTitle>
                <CardDescription>
                  Dados do seu registro no Conselho Regional de Medicina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="CRM/UF 000000"
                      value={formData.crm}
                      onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Especialidades e Área de Atuação</CardTitle>
                <CardDescription>
                  Especialidades reconhecidas pelo CFM (Resolução nº 2.330/2023)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Especialidade Principal</Label>
                  <Select
                    value={especialidadeForm.especialidadePrincipal}
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, especialidadePrincipal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua especialidade principal" />
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
                  <Label>Especialidade Secundária (opcional)</Label>
                  <Select
                    value={especialidadeForm.especialidadeSecundaria}
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, especialidadeSecundaria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma segunda especialidade" />
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
                  <Label>Área de Atuação</Label>
                  <Select
                    value={especialidadeForm.areaAtuacao}
                    onValueChange={(value) => setEspecialidadeForm({ ...especialidadeForm, areaAtuacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua área de atuação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {AREAS_ATUACAO.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveEspecialidades} disabled={atualizarEspecialidades.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Especialidades
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Notificações */}
        {activeTab === "notificacoes" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por E-mail</p>
                    <p className="text-sm text-muted-foreground">
                      Receba lembretes de consultas e atualizações por e-mail
                    </p>
                  </div>
                  <Badge variant="outline">Em breve</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      Receba lembretes e confirmações via WhatsApp
                    </p>
                  </div>
                  <Badge variant="outline">Em breve</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Renovação de Vínculos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre vínculos próximos do vencimento (30 dias antes)
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-white">Ativo</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Card de Alerta de Pacientes Inativos */}
            <AlertaPacientesInativos />
          </div>
        )}

        {/* Tab: Assinatura */}
        {activeTab === "assinatura" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Assinatura Gorgen
                </CardTitle>
                <CardDescription>
                  Gerencie sua assinatura e forma de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status atual */}
                <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-emerald-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Plano Profissional
                      </h3>
                      <p className="text-sm text-emerald-600 dark:text-green-400">
                        Sua assinatura está ativa
                      </p>
                    </div>
                    <Badge className="bg-emerald-500 text-white">Ativo</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Próxima cobrança</p>
                      <p className="font-medium">08/02/2026</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor mensal</p>
                      <p className="font-medium">R$ 199,00</p>
                    </div>
                  </div>
                </div>

                {/* Opções de plano */}
                <div>
                  <h4 className="font-medium mb-3">Alterar Plano</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Básico</CardTitle>
                        <CardDescription>Para consultórios pequenos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">R$ 99<span className="text-sm font-normal">/mês</span></p>
                        <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                          <li>• Até 100 pacientes</li>
                          <li>• 1 usuário</li>
                          <li>• Agenda básica</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Profissional</CardTitle>
                          <Badge>Atual</Badge>
                        </div>
                        <CardDescription>Para clínicas em crescimento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">R$ 199<span className="text-sm font-normal">/mês</span></p>
                        <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                          <li>• Pacientes ilimitados</li>
                          <li>• Até 5 usuários</li>
                          <li>• Agenda completa</li>
                          <li>• Relatórios</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Empresarial</CardTitle>
                        <CardDescription>Para grandes clínicas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">R$ 399<span className="text-sm font-normal">/mês</span></p>
                        <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                          <li>• Tudo do Profissional</li>
                          <li>• Usuários ilimitados</li>
                          <li>• Múltiplas unidades</li>
                          <li>• Suporte prioritário</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div>
                  <h4 className="font-medium mb-3">Forma de Pagamento</h4>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Cartão de Crédito</p>
                            <p className="text-sm text-muted-foreground">•••• •••• •••• 4242</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Alterar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Histórico de faturas */}
                <div>
                  <h4 className="font-medium mb-3">Histórico de Faturas</h4>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">Janeiro 2026</p>
                            <p className="text-sm text-muted-foreground">08/01/2026</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">R$ 199,00</span>
                            <Badge className="bg-emerald-500 text-white">Pago</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">Dezembro 2025</p>
                            <p className="text-sm text-muted-foreground">08/12/2025</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">R$ 199,00</span>
                            <Badge className="bg-emerald-500 text-white">Pago</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cancelamento */}
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 dark:text-red-200">Cancelar Assinatura</h4>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        Ao cancelar, você perderá acesso ao sistema no final do período atual.
                        Seus dados serão mantidos por 90 dias para possível reativação.
                      </p>
                      <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                        Cancelar Assinatura
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
