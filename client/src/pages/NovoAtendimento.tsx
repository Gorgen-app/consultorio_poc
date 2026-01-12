import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TIPOS_ATENDIMENTO, LOCAIS_ATENDIMENTO, PROCEDIMENTOS_CBHPM, TABELA_HONORARIOS } from "@/lib/atendimentos";

export default function NovoAtendimento() {
  const [, setLocation] = useLocation();
  const createMutation = trpc.atendimentos.create.useMutation();
  const { data: pacientes } = trpc.pacientes.list.useQuery({ limit: 50000 });

  const [searchPaciente, setSearchPaciente] = useState("");
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);

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
    dataPagamento: "",
    observacoes: "",
  });

  // Buscar nextId dinamicamente quando paciente e data forem selecionados
  const { data: nextId } = trpc.atendimentos.getNextId.useQuery(
    {
      pacienteId: formData.pacienteId,
      dataAtendimento: new Date(formData.dataAtendimento),
    },
    {
      enabled: formData.pacienteId > 0 && formData.dataAtendimento !== "",
    }
  );

  // Atualizar ID quando carregado
  useEffect(() => {
    if (nextId) {
      setFormData((prev) => ({ ...prev, atendimento: nextId }));
    }
  }, [nextId]);

  // Pré-selecionar paciente e preencher dados se vier de duplicação
  const [isDuplicacao, setIsDuplicacao] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duplicar = params.get('duplicar');
    const pacienteIdParam = params.get('pacienteId');
    
    if (duplicar === 'true' && pacientes) {
      setIsDuplicacao(true);
      
      // Preencher dados do atendimento duplicado
      const pacienteId = parseInt(pacienteIdParam || '0');
      const paciente = pacientes.find(p => p.id === pacienteId);
      
      if (paciente && !pacienteSelecionado) {
        handlePacienteSelect(pacienteId);
        
        // Preencher demais campos (exceto data)
        setFormData(prev => ({
          ...prev,
          tipoAtendimento: params.get('tipoAtendimento') || '',
          local: params.get('local') || '',
          convenio: params.get('convenio') || '',
          faturamentoPrevistoInicial: params.get('faturamentoPrevisto') || '',
          faturamentoPrevistoFinal: params.get('faturamentoPrevisto') || '',
          observacoes: params.get('observacoes') || '',
          dataAtendimento: '', // Data em branco para preencher
        }));
      }
    } else if (pacienteIdParam && pacientes) {
      // Fluxo normal - apenas pré-selecionar paciente
      const pacienteId = parseInt(pacienteIdParam);
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (paciente && !pacienteSelecionado) {
        handlePacienteSelect(pacienteId);
      }
    }
  }, [pacientes]);

  const filteredPacientes = pacientes?.filter((p) =>
    p.nome?.toLowerCase().includes(searchPaciente.toLowerCase()) ||
    p.idPaciente?.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  // Quando seleciona um paciente, carrega os convênios dele
  const conveniosDisponiveis = pacienteSelecionado
    ? [
        ...(pacienteSelecionado.operadora1 ? [pacienteSelecionado.operadora1] : []),
        ...(pacienteSelecionado.operadora2 ? [pacienteSelecionado.operadora2] : []),
        "Particular",
        "Cortesia"
      ]
    : ["Particular", "Cortesia"];

  const handlePacienteSelect = (pacienteId: number) => {
    const paciente = pacientes?.find((p) => p.id === pacienteId);
    if (paciente) {
      setPacienteSelecionado(paciente);
      
      // Preencher automaticamente o convênio principal do paciente
      const convenioAutomatico = paciente.operadora1 || "";
      const planoAutomatico = paciente.planoModalidade1 || "";
      
      setFormData((prev) => ({ 
        ...prev, 
        pacienteId,
        // Só preencher convênio se não estiver em modo duplicação (que já vem preenchido)
        convenio: prev.convenio || convenioAutomatico,
        plano: prev.plano || planoAutomatico,
      }));
      setSearchPaciente("");
      
      // Notificar usuário sobre o preenchimento automático
      if (convenioAutomatico && !isDuplicacao) {
        toast.info(`Convênio preenchido: ${convenioAutomatico}${planoAutomatico ? ` - ${planoAutomatico}` : ""}`);
      }
    }
  };

  // Auto-preencher código CBHPM quando seleciona procedimento
  const handleProcedimentoChange = (procedimento: string) => {
    const codigo = PROCEDIMENTOS_CBHPM[procedimento] || "";
    const honorario = TABELA_HONORARIOS[procedimento] || "";
    setFormData((prev) => ({
      ...prev,
      procedimento,
      codigoCBHPM: codigo,
      faturamentoPrevistoInicial: honorario ? honorario.toString() : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.atendimento || formData.pacienteId === 0) {
      toast.error("ID do atendimento e paciente são obrigatórios");
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        dataAtendimento: new Date(formData.dataAtendimento),
        dataFaturamento: formData.dataFaturamento || null,
        dataPagamento: formData.dataPagamento || null,
        faturamentoPrevistoInicial: formData.faturamentoPrevistoInicial || null,
        faturamentoPrevistoFinal: formData.faturamentoPrevistoFinal || null,
        codigoCBHPM: formData.codigoCBHPM || null,
        plano: formData.plano || null,
        observacoes: formData.observacoes || null,
      };
      await createMutation.mutateAsync(dataToSend as any);
      toast.success("Atendimento cadastrado com sucesso!");
      setLocation("/atendimentos");
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido ao cadastrar atendimento";
      toast.error(`Erro: ${errorMessage}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">
            {isDuplicacao ? "Duplicar Atendimento" : "Novo Atendimento"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isDuplicacao 
              ? "Dados pré-preenchidos - informe apenas a data do novo atendimento" 
              : "Registrar novo atendimento no sistema"}
          </p>
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
                    disabled
                    className="bg-muted"
                    placeholder="Carregando..."
                  />
                  <p className="text-xs text-muted-foreground">ID gerado automaticamente</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataAtendimento" className={isDuplicacao ? "text-green-600 font-semibold" : ""}>
                    Data do Atendimento * {isDuplicacao && "(PREENCHER)"}
                  </Label>
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={formData.dataAtendimento}
                    onChange={(e) => handleChange("dataAtendimento", e.target.value)}
                    required
                    className={isDuplicacao && !formData.dataAtendimento ? "border-green-500 ring-2 ring-green-200" : ""}
                    autoFocus={isDuplicacao}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paciente *</Label>
                {!pacienteSelecionado ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar paciente por nome ou ID..."
                        value={searchPaciente}
                        onChange={(e) => setSearchPaciente(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {searchPaciente && (
                      <Card className="max-h-64 overflow-y-auto">
                        <CardContent className="p-2">
                          {filteredPacientes && filteredPacientes.length > 0 ? (
                            filteredPacientes.slice(0, 10).map((paciente) => (
                              <div
                                key={paciente.id}
                                onClick={() => handlePacienteSelect(paciente.id)}
                                className="w-full text-left px-3 py-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                              >
                                <div className="font-medium">{paciente.nome}</div>
                                <div className="text-sm text-muted-foreground">ID: {paciente.idPaciente}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                              Nenhum paciente encontrado
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                    <div>
                      <div className="font-medium">{pacienteSelecionado.nome}</div>
                      <div className="text-sm text-muted-foreground">ID: {pacienteSelecionado.idPaciente}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPacienteSelecionado(null);
                        setFormData((prev) => ({ ...prev, pacienteId: 0, convenio: "" }));
                      }}
                    >
                      Trocar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Atendimento</CardTitle>
              <CardDescription>Tipo, local e procedimento realizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoAtendimento">Tipo de Atendimento *</Label>
                  <Select value={formData.tipoAtendimento} onValueChange={(value) => handleChange("tipoAtendimento", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ATENDIMENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local *</Label>
                  <Select value={formData.local} onValueChange={(value) => handleChange("local", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCAIS_ATENDIMENTO.map((local) => (
                        <SelectItem key={local} value={local}>
                          {local}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="procedimento">Procedimento</Label>
                  <Input
                    id="procedimento"
                    value={formData.procedimento}
                    onChange={(e) => handleProcedimentoChange(e.target.value)}
                    placeholder="Descreva o procedimento"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tabela CBHPM será vinculada automaticamente em breve
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoCBHPM">Código CBHPM</Label>
                  <Input
                    id="codigoCBHPM"
                    value={formData.codigoCBHPM}
                    onChange={(e) => handleChange("codigoCBHPM", e.target.value)}
                    placeholder="Código automático"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convênio e Faturamento</CardTitle>
              <CardDescription>Informações de pagamento e convênio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio *</Label>
                  <Select
                    value={formData.convenio}
                    onValueChange={(value) => handleChange("convenio", value)}
                    disabled={!pacienteSelecionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={pacienteSelecionado ? "Selecione o convênio" : "Selecione um paciente primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {conveniosDisponiveis.map((conv) => (
                        <SelectItem key={conv} value={conv}>
                          {conv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plano">Plano/Modalidade</Label>
                  <Input
                    id="plano"
                    value={formData.plano}
                    onChange={(e) => handleChange("plano", e.target.value)}
                    placeholder="Tipo do plano"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faturamentoPrevistoInicial">Honorários Previstos (R$)</Label>
                  <Input
                    id="faturamentoPrevistoInicial"
                    type="number"
                    step="0.01"
                    value={formData.faturamentoPrevistoInicial}
                    onChange={(e) => handleChange("faturamentoPrevistoInicial", e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tabela de honorários será vinculada automaticamente em breve
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faturamentoPrevistoFinal">Faturamento Efetivado (R$)</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>Informações adicionais sobre o atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Adicione observações relevantes sobre este atendimento..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/atendimentos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : (
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
