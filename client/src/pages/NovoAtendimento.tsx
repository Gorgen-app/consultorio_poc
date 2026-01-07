import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function NovoAtendimento() {
  const [, setLocation] = useLocation();
  const createMutation = trpc.atendimentos.create.useMutation();
  const { data: pacientes } = trpc.pacientes.list.useQuery({ limit: 1000 });

  const [searchPaciente, setSearchPaciente] = useState("");
  const [formData, setFormData] = useState({
    atendimento: "",
    pacienteId: 0,
    dataAtendimento: new Date().toISOString().split("T")[0],
    tipoAtendimento: "",
    procedimento: "",
    codigoCBHPM: "",
    local: "",
    convenio: "",
    plano: "",
    faturamentoPrevistoInicial: "",
    faturamentoPrevistoFinal: "",
    dataFaturamento: "",
    pagamentoEfetivado: false,
    dataPagamento: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    diasDesdeUltimoAtendimento: "",
    sequenciaAtendimentoAno: "",
    observacoes: "",
  });

  const filteredPacientes = pacientes?.filter((p) =>
    p.nome?.toLowerCase().includes(searchPaciente.toLowerCase()) ||
    p.idPaciente?.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.atendimento || formData.pacienteId === 0) {
      toast.error("ID do atendimento e paciente são obrigatórios");
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...formData,
        dataAtendimento: new Date(formData.dataAtendimento),
        dataFaturamento: formData.dataFaturamento ? new Date(formData.dataFaturamento) : undefined,
        dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
      } as any);
      toast.success("Atendimento cadastrado com sucesso!");
      setLocation("/atendimentos");
    } catch (error) {
      toast.error("Erro ao cadastrar atendimento");
      console.error(error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/atendimentos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Novo Atendimento</h1>
          <p className="text-muted-foreground mt-2">Registrar novo atendimento no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
              <CardDescription>Informações básicas do atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="atendimento">ID Atendimento *</Label>
                  <Input
                    id="atendimento"
                    value={formData.atendimento}
                    onChange={(e) => handleChange("atendimento", e.target.value)}
                    placeholder="20260001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataAtendimento">Data do Atendimento *</Label>
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={formData.dataAtendimento}
                    onChange={(e) => handleChange("dataAtendimento", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pacienteSearch">Selecionar Paciente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pacienteSearch"
                    placeholder="Buscar por nome ou ID..."
                    value={searchPaciente}
                    onChange={(e) => setSearchPaciente(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchPaciente && filteredPacientes && filteredPacientes.length > 0 && (
                  <div className="border rounded-md mt-2 max-h-48 overflow-y-auto">
                    {filteredPacientes.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          handleChange("pacienteId", p.id);
                          setSearchPaciente(p.nome || "");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-sm text-muted-foreground">{p.idPaciente}</div>
                      </button>
                    ))}
                  </div>
                )}
                {formData.pacienteId > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Paciente selecionado: ID {formData.pacienteId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo e Procedimento</CardTitle>
              <CardDescription>Detalhes do atendimento realizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoAtendimento">Tipo de Atendimento</Label>
                  <Select value={formData.tipoAtendimento} onValueChange={(value) => handleChange("tipoAtendimento", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Visita Internado">Visita Internado</SelectItem>
                      <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                      <SelectItem value="Retorno">Retorno</SelectItem>
                      <SelectItem value="Exame">Exame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => handleChange("local", e.target.value)}
                    placeholder="Ex: Consultório, Hospital"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="procedimento">Procedimento</Label>
                  <Input
                    id="procedimento"
                    value={formData.procedimento}
                    onChange={(e) => handleChange("procedimento", e.target.value)}
                    placeholder="Descrição do procedimento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoCBHPM">Código CBHPM</Label>
                  <Input
                    id="codigoCBHPM"
                    value={formData.codigoCBHPM}
                    onChange={(e) => handleChange("codigoCBHPM", e.target.value)}
                    placeholder="Código do procedimento"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convênio e Plano</CardTitle>
              <CardDescription>Informações de cobertura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Input
                    id="convenio"
                    value={formData.convenio}
                    onChange={(e) => handleChange("convenio", e.target.value)}
                    placeholder="Nome do convênio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plano">Plano</Label>
                  <Input
                    id="plano"
                    value={formData.plano}
                    onChange={(e) => handleChange("plano", e.target.value)}
                    placeholder="Tipo do plano"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faturamento</CardTitle>
              <CardDescription>Valores e datas de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faturamentoPrevistoInicial">Faturamento Previsto Inicial (R$)</Label>
                  <Input
                    id="faturamentoPrevistoInicial"
                    type="number"
                    step="0.01"
                    value={formData.faturamentoPrevistoInicial}
                    onChange={(e) => handleChange("faturamentoPrevistoInicial", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faturamentoPrevistoFinal">Faturamento Previsto Final (R$)</Label>
                  <Input
                    id="faturamentoPrevistoFinal"
                    type="number"
                    step="0.01"
                    value={formData.faturamentoPrevistoFinal}
                    onChange={(e) => handleChange("faturamentoPrevistoFinal", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataFaturamento">Data de Faturamento</Label>
                  <Input
                    id="dataFaturamento"
                    type="date"
                    value={formData.dataFaturamento}
                    onChange={(e) => handleChange("dataFaturamento", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                  <Input
                    id="dataPagamento"
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => handleChange("dataPagamento", e.target.value)}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pagamentoEfetivado}
                      onChange={(e) => handleChange("pagamentoEfetivado", e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Pagamento Efetivado</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
              <CardDescription>Dados complementares do atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mês</Label>
                  <Input
                    id="mes"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.mes}
                    onChange={(e) => handleChange("mes", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => handleChange("ano", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sequenciaAtendimentoAno">Sequência no Ano</Label>
                  <Input
                    id="sequenciaAtendimentoAno"
                    value={formData.sequenciaAtendimentoAno}
                    onChange={(e) => handleChange("sequenciaAtendimentoAno", e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais sobre o atendimento"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/atendimentos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Atendimento
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
