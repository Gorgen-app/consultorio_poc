import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MaskedInput } from "@/components/MaskedInput";
import { OPERADORAS } from "@/lib/operadoras";

export default function NovoPaciente() {
  const [, setLocation] = useLocation();
  const createMutation = trpc.pacientes.create.useMutation();
  const { data: nextId, isLoading: loadingId } = trpc.pacientes.getNextId.useQuery();

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
    operadora1Outro: "",
    planoModalidade1: "",
    matriculaConvenio1: "",
    vigente1: false,
    privativo1: false,
    operadora2: "",
    operadora2Outro: "",
    planoModalidade2: "",
    matriculaConvenio2: "",
    vigente2: false,
    privativo2: false,
    obitoPerda: false,
    dataObitoLastFU: "",
    statusCaso: "Ativo",
    grupoDiagnostico: "",
    diagnosticoEspecifico: "",
    tempoSeguimentoAnos: "",
  });

  useEffect(() => {
    if (nextId) {
      setFormData((prev) => ({ ...prev, idPaciente: nextId }));
    }
  }, [nextId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.idPaciente) {
      toast.error("Nome e ID do paciente são obrigatórios");
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        // Converter datas vazias para null
        dataInclusao: formData.dataInclusao || null,
        dataNascimento: formData.dataNascimento || null,
        dataObitoLastFU: formData.dataObitoLastFU || null,
        // Converter checkboxes
        vigente1: formData.vigente1 ? "Sim" : "Não",
        privativo1: formData.privativo1 ? "Sim" : "Não",
        vigente2: formData.vigente2 ? "Sim" : "Não",
        privativo2: formData.privativo2 ? "Sim" : "Não",
        obitoPerda: formData.obitoPerda ? "Sim" : "Não",
        // Converter campos vazios para null
        cpf: formData.cpf || null,
        nomeMae: formData.nomeMae || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        uf: formData.uf || null,
        operadora1: formData.operadora1 === "Outro" ? formData.operadora1Outro : formData.operadora1 || null,
        planoModalidade1: formData.planoModalidade1 || null,
        matriculaConvenio1: formData.matriculaConvenio1 || null,
        operadora2: formData.operadora2 === "Outro" ? formData.operadora2Outro : formData.operadora2 || null,
        planoModalidade2: formData.planoModalidade2 || null,
        matriculaConvenio2: formData.matriculaConvenio2 || null,
        grupoDiagnostico: formData.grupoDiagnostico || null,
        diagnosticoEspecifico: formData.diagnosticoEspecifico || null,
        tempoSeguimentoAnos: formData.tempoSeguimentoAnos || null,
        pastaPaciente: formData.pastaPaciente || null,
      };
      await createMutation.mutateAsync(dataToSend as any);
      toast.success("Paciente cadastrado com sucesso!");
      setLocation("/pacientes");
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido ao cadastrar paciente";
      toast.error(`Erro: ${errorMessage}`);
      console.error("Erro completo:", error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingId) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

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
                  <Label htmlFor="idPaciente">ID Paciente (Automático)</Label>
                  <Input id="idPaciente" value={formData.idPaciente} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataInclusao">Data de Inclusão</Label>
                  <Input id="dataInclusao" type="date" value={formData.dataInclusao} onChange={(e) => handleChange("dataInclusao", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pastaPaciente">Pasta de Documentos</Label>
                  <Input id="pastaPaciente" value={formData.pastaPaciente} onChange={(e) => handleChange("pastaPaciente", e.target.value)} placeholder="Link para pasta" />
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
                  <MaskedInput mask="cpf" id="cpf" value={formData.cpf} onChange={(e) => handleChange("cpf", e.target.value)} placeholder="000.000.000-00" />
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
                  <MaskedInput mask="telefone" id="telefone" value={formData.telefone} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(51) 99999-9999" />
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
                  <MaskedInput mask="cep" id="cep" value={formData.cep} onChange={(e) => handleChange("cep", e.target.value)} placeholder="00000-000" />
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
                  <Select value={formData.operadora1} onValueChange={(value) => handleChange("operadora1", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a operadora" /></SelectTrigger>
                    <SelectContent>
                      {OPERADORAS.map((op) => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.operadora1 === "Outro" && (
                  <div className="space-y-2">
                    <Label htmlFor="operadora1Outro">Descreva a Operadora</Label>
                    <Input id="operadora1Outro" value={formData.operadora1Outro} onChange={(e) => handleChange("operadora1Outro", e.target.value)} placeholder="Nome da operadora" />
                  </div>
                )}
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
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox id="vigente1" checked={formData.vigente1} onCheckedChange={(checked) => handleChange("vigente1", checked)} />
                  <Label htmlFor="vigente1" className="cursor-pointer">Vigente</Label>
                </div>
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox id="privativo1" checked={formData.privativo1} onCheckedChange={(checked) => handleChange("privativo1", checked)} />
                  <Label htmlFor="privativo1" className="cursor-pointer">Privativo</Label>
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
                  <Select value={formData.operadora2} onValueChange={(value) => handleChange("operadora2", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a operadora" /></SelectTrigger>
                    <SelectContent>
                      {OPERADORAS.map((op) => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.operadora2 === "Outro" && (
                  <div className="space-y-2">
                    <Label htmlFor="operadora2Outro">Descreva a Operadora</Label>
                    <Input id="operadora2Outro" value={formData.operadora2Outro} onChange={(e) => handleChange("operadora2Outro", e.target.value)} placeholder="Nome da operadora" />
                  </div>
                )}
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
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox id="vigente2" checked={formData.vigente2} onCheckedChange={(checked) => handleChange("vigente2", checked)} />
                  <Label htmlFor="vigente2" className="cursor-pointer">Vigente</Label>
                </div>
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox id="privativo2" checked={formData.privativo2} onCheckedChange={(checked) => handleChange("privativo2", checked)} />
                  <Label htmlFor="privativo2" className="cursor-pointer">Privativo</Label>
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox id="obitoPerda" checked={formData.obitoPerda} onCheckedChange={(checked) => handleChange("obitoPerda", checked)} />
                  <Label htmlFor="obitoPerda" className="cursor-pointer">Óbito/Perda de Seguimento</Label>
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
