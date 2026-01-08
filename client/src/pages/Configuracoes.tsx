import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Shield,
  Stethoscope,
  Calendar,
  DollarSign,
  Eye,
  Settings,
  Save,
  Building2,
  Phone,
  Mail,
  FileText,
  Bell,
  Lock,
  Palette,
} from "lucide-react";

// Mapeamento de perfis para labels e ícones
const perfilInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin_master: { label: "Administrador Master", icon: <Shield className="h-4 w-4" />, color: "bg-red-500" },
  medico: { label: "Médico", icon: <Stethoscope className="h-4 w-4" />, color: "bg-blue-500" },
  secretaria: { label: "Secretária", icon: <Calendar className="h-4 w-4" />, color: "bg-green-500" },
  financeiro: { label: "Financeiro", icon: <DollarSign className="h-4 w-4" />, color: "bg-yellow-500" },
  visualizador: { label: "Visualizador", icon: <Eye className="h-4 w-4" />, color: "bg-gray-500" },
};

export default function Configuracoes() {
  const { data: profile, isLoading, refetch } = trpc.perfil.me.useQuery();
  const { data: availablePerfis } = trpc.perfil.getAvailablePerfis.useQuery();
  const updateProfile = trpc.perfil.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    email: "",
    crm: "",
    especialidade: "",
  });

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

  const handleSaveProfile = () => {
    updateProfile.mutate(formData);
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
                    className={isActive ? info?.color + " text-white" : ""}
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          
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
                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Input
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Cirurgia Geral"
                  />
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
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
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
                <h4 className="font-medium">Dias de Atendimento</h4>
                <div className="flex flex-wrap gap-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, i) => (
                    <Badge
                      key={dia}
                      variant={i > 0 && i < 6 ? "default" : "outline"}
                      className="cursor-not-allowed"
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
                Defina valores padrão e formas de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Padrão da Consulta</Label>
                  <Input type="number" placeholder="R$ 0,00" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Valor Padrão do Retorno</Label>
                  <Input type="number" placeholder="R$ 0,00" disabled />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Formas de Pagamento Aceitas</h4>
                <div className="flex flex-wrap gap-2">
                  {["Dinheiro", "PIX", "Cartão Débito", "Cartão Crédito", "Convênio"].map((forma) => (
                    <Badge key={forma} variant="outline" className="cursor-not-allowed">
                      {forma}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input placeholder="Nome do banco" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input placeholder="0000" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input placeholder="00000-0" disabled />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                * Configurações financeiras serão implementadas em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações (Todos) */}
        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como deseja receber alertas e lembretes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { title: "Novos agendamentos", desc: "Receber alerta quando um novo agendamento for criado" },
                  { title: "Cancelamentos", desc: "Receber alerta quando um agendamento for cancelado" },
                  { title: "Lembretes de consulta", desc: "Lembrete antes das consultas agendadas" },
                  { title: "Relatórios financeiros", desc: "Resumo semanal de faturamento" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
