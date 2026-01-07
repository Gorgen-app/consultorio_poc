import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function NovoPaciente() {
  const [, setLocation] = useLocation();
  const createMutation = trpc.pacientes.create.useMutation();

  const [formData, setFormData] = useState({
    idPaciente: "",
    dataInclusao: new Date().toISOString().split("T")[0],
    pastaPaciente: "",
    nome: "",
    dataNascimento: "",
    sexo: "" as "M" | "F" | "Outro" | "",
    cpf: "",
    nomeMae: "",
    email: "",
    telefone: "",
    endereco: "",
    bairro: "",
    cep: "",
    cidade: "",
    uf: "",
    pais: "Brasil",
    operadora1: "",
    planoModalidade1: "",
    matriculaConvenio1: "",
    vigente1: "",
    privativo1: "",
    operadora2: "",
    planoModalidade2: "",
    matriculaConvenio2: "",
    vigente2: "",
    privativo2: "",
    obitoPerda: "",
    dataObitoLastFU: "",
    statusCaso: "Ativo",
    grupoDiagnostico: "",
    diagnosticoEspecifico: "",
    tempoSeguimentoAnos: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.idPaciente) {
      toast.error("Nome e ID do paciente são obrigatórios");
      return;
    }
    try {
      await createMutation.mutateAsync(formData as any);
      toast.success("Paciente cadastrado com sucesso!");
      setLocation("/pacientes");
    } catch (error) {
      toast.error("Erro ao cadastrar paciente");
      console.error(error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Novo Paciente</h1>
          <p className="text-muted-foreground mt-2">Cadastrar novo paciente no sistema</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
              <CardDescription>Informações essenciais do paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idPaciente">ID Paciente *</Label>
                  <Input id="idPaciente" value={formData.idPaciente} onChange={(e) => handleChange("idPaciente", e.target.value)} placeholder="2025-0000001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataInclusao">Data de Inclusão</Label>
                  <Input id="dataInclusao" type="date" value={formData.dataInclusao} onChange={(e) => handleChange("dataInclusao", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pastaPaciente">Pasta do Paciente</Label>
                  <Input id="pastaPaciente" value={formData.pastaPaciente} onChange={(e) => handleChange("pastaPaciente", e.target.value)} placeholder="Número da pasta" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input id="nome" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Nome completo do paciente" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeMae">Nome da Mãe</Label>
                  <Input id="nomeMae" value={formData.nomeMae} onChange={(e) => handleChange("nomeMae", e.target.value)} placeholder="Nome completo da mãe" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input id="dataNascimento" type="date" value={formData.dataNascimento} onChange={(e) => handleChange("dataNascimento", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={formData.sexo} onValueChange={(value) => handleChange("sexo", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={formData.cpf} onChange={(e) => handleChange("cpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Informações de contato do paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={formData.telefone} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Endereço residencial do paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={formData.endereco} onChange={(e) => handleChange("endereco", e.target.value)} placeholder="Rua, número, complemento" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={formData.bairro} onChange={(e) => handleChange("bairro", e.target.value)} placeholder="Bairro" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={formData.cep} onChange={(e) => handleChange("cep", e.target.value)} placeholder="00000-000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" value={formData.uf} onChange={(e) => handleChange("uf", e.target.value)} placeholder="RS" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input id="pais" value={formData.pais} onChange={(e) => handleChange("pais", e.target.value)} placeholder="Brasil" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Convênio Principal</CardTitle>
              <CardDescription>Informações do convênio principal do paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operadora1">Operadora</Label>
                  <Input id="operadora1" value={formData.operadora1} onChange={(e) => handleChange("operadora1", e.target.value)} placeholder="Nome da operadora" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planoModalidade1">Plano/Modalidade</Label>
                  <Input id="planoModalidade1" value={formData.planoModalidade1} onChange={(e) => handleChange("planoModalidade1", e.target.value)} placeholder="Tipo do plano" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matriculaConvenio1">Matrícula</Label>
                  <Input id="matriculaConvenio1" value={formData.matriculaConvenio1} onChange={(e) => handleChange("matriculaConvenio1", e.target.value)} placeholder="Número da matrícula" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vigente1">Vigente</Label>
                  <Input id="vigente1" value={formData.vigente1} onChange={(e) => handleChange("vigente1", e.target.value)} placeholder="Sim/Não" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privativo1">Privativo</Label>
                  <Input id="privativo1" value={formData.privativo1} onChange={(e) => handleChange("privativo1", e.target.value)} placeholder="Sim/Não" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Convênio Secundário (Opcional)</CardTitle>
              <CardDescription>Informações de convênio adicional, se houver</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operadora2">Operadora</Label>
                  <Input id="operadora2" value={formData.operadora2} onChange={(e) => handleChange("operadora2", e.target.value)} placeholder="Nome da operadora" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planoModalidade2">Plano/Modalidade</Label>
                  <Input id="planoModalidade2" value={formData.planoModalidade2} onChange={(e) => handleChange("planoModalidade2", e.target.value)} placeholder="Tipo do plano" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matriculaConvenio2">Matrícula</Label>
                  <Input id="matriculaConvenio2" value={formData.matriculaConvenio2} onChange={(e) => handleChange("matriculaConvenio2", e.target.value)} placeholder="Número da matrícula" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vigente2">Vigente</Label>
                  <Input id="vigente2" value={formData.vigente2} onChange={(e) => handleChange("vigente2", e.target.value)} placeholder="Sim/Não" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privativo2">Privativo</Label>
                  <Input id="privativo2" value={formData.privativo2} onChange={(e) => handleChange("privativo2", e.target.value)} placeholder="Sim/Não" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informações Clínicas</CardTitle>
              <CardDescription>Diagnóstico e status do caso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grupoDiagnostico">Grupo de Diagnóstico</Label>
                  <Input id="grupoDiagnostico" value={formData.grupoDiagnostico} onChange={(e) => handleChange("grupoDiagnostico", e.target.value)} placeholder="Ex: HCC, IPMN, etc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosticoEspecifico">Diagnóstico Específico</Label>
                  <Input id="diagnosticoEspecifico" value={formData.diagnosticoEspecifico} onChange={(e) => handleChange("diagnosticoEspecifico", e.target.value)} placeholder="Detalhamento do diagnóstico" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusCaso">Status do Caso</Label>
                  <Select value={formData.statusCaso} onValueChange={(value) => handleChange("statusCaso", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Óbito">Óbito</SelectItem>
                      <SelectItem value="Perda de Seguimento">Perda de Seguimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obitoPerda">Óbito/Perda</Label>
                  <Input id="obitoPerda" value={formData.obitoPerda} onChange={(e) => handleChange("obitoPerda", e.target.value)} placeholder="Informações adicionais" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataObitoLastFU">Data Óbito/Last FU</Label>
                  <Input id="dataObitoLastFU" type="date" value={formData.dataObitoLastFU} onChange={(e) => handleChange("dataObitoLastFU", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempoSeguimentoAnos">Tempo de Seguimento (anos)</Label>
                <Input id="tempoSeguimentoAnos" value={formData.tempoSeguimentoAnos} onChange={(e) => handleChange("tempoSeguimentoAnos", e.target.value)} placeholder="Ex: 2.5" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/pacientes")}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : (<><Save className="h-4 w-4 mr-2" />Salvar Paciente</>)}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
