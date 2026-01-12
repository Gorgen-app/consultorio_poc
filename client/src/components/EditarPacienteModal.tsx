import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/MaskedInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OPERADORAS } from "@/lib/operadoras";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Clock, User, FileSpreadsheet, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Paciente {
  id: number;
  idPaciente: string;
  dataInclusao: string | Date | null;
  nome: string;
  cpf: string | null;
  dataNascimento: string | Date | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  pais: string | null;
  nomeMae: string | null;
  operadora1: string | null;
  planoModalidade1: string | null;
  matriculaConvenio1: string | null;
  vigente1: string | null;
  privativo1: string | null;
  operadora2: string | null;
  planoModalidade2: string | null;
  matriculaConvenio2: string | null;
  vigente2: string | null;
  privativo2: string | null;
  obitoPerda: string | null;
  dataObitoLastFU: string | Date | null;
  statusCaso: string | null;
  grupoDiagnostico: string | null;
  diagnosticoEspecifico: string | null;
  tempoSeguimentoAnos: string | null;
  pastaPaciente: string | null;
}

interface EditarPacienteModalProps {
  paciente: Paciente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Componente de Histórico de Alterações (LGPD)
function HistoricoAlteracoes({ pacienteId }: { pacienteId: number }) {
  const { data: historico, isLoading } = trpc.audit.list.useQuery({
    entityType: "paciente",
    entityId: pacienteId,
    limit: 50,
  });

  // Mapeamento de campos para nomes legíveis
  const campoLabels: Record<string, string> = {
    nome: "Nome",
    cpf: "CPF",
    dataNascimento: "Data de Nascimento",
    sexo: "Sexo",
    telefone: "Telefone",
    email: "E-mail",
    endereco: "Endereço",
    bairro: "Bairro",
    cep: "CEP",
    cidade: "Cidade",
    uf: "UF",
    pais: "País",
    nomeMae: "Nome da Mãe",
    operadora1: "Convênio 1",
    planoModalidade1: "Plano 1",
    matriculaConvenio1: "Matrícula 1",
    operadora2: "Convênio 2",
    planoModalidade2: "Plano 2",
    matriculaConvenio2: "Matrícula 2",
    grupoDiagnostico: "Grupo Diagnóstico",
    diagnosticoEspecifico: "Diagnóstico Específico",
    statusCaso: "Status do Caso",
    obitoPerda: "Óbito/Perda",
    dataObitoLastFU: "Data Óbito/Last FU",
  };

  const actionLabels: Record<string, { label: string; color: string }> = {
    CREATE: { label: "Cadastro", color: "bg-green-100 text-green-800" },
    UPDATE: { label: "Alteração", color: "bg-blue-100 text-blue-800" },
    DELETE: { label: "Exclusão", color: "bg-red-100 text-red-800" },
    RESTORE: { label: "Restauração", color: "bg-purple-100 text-purple-800" },
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-6 w-6 mx-auto mb-2 animate-pulse" />
        Carregando histórico...
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma alteração registrada.</p>
        <p className="text-xs mt-1">O histórico começa a ser registrado a partir de agora.</p>
      </div>
    );
  }

  // Função para exportar para Excel (CSV)
  const exportToExcel = () => {
    const headers = ["Data/Hora", "Ação", "Usuário", "Campos Alterados", "Valores Anteriores", "Valores Novos"];
    const rows = historico.map((log: any) => {
      const data = new Date(log.createdAt).toLocaleString("pt-BR");
      const acao = actionLabels[log.action]?.label || log.action;
      const usuario = log.userName || log.userEmail || "Sistema";
      const campos = log.changedFields?.map((f: string) => campoLabels[f] || f).join("; ") || "-";
      const antigos = log.changedFields?.map((f: string) => `${campoLabels[f] || f}: ${log.oldValues?.[f] || "(vazio)"}`).join("; ") || "-";
      const novos = log.changedFields?.map((f: string) => `${campoLabels[f] || f}: ${log.newValues?.[f] || "(vazio)"}`).join("; ") || "-";
      return [data, acao, usuario, campos, antigos, novos];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico_paciente_${pacienteId}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Histórico exportado para Excel (CSV)");
  };

  // Função para exportar para PDF
  const exportToPDF = () => {
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Histórico - Paciente ${pacienteId}</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333;border-bottom:2px solid #333;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background-color:#f5f5f5}.old{color:#dc3545;text-decoration:line-through}.new{color:#28a745}.footer{margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}</style></head><body><h1>Histórico de Alterações - LGPD</h1><p><strong>ID Paciente:</strong> ${pacienteId} | <strong>Exportado em:</strong> ${new Date().toLocaleString("pt-BR")} | <strong>Total:</strong> ${historico.length} registros</p><table><thead><tr><th>Data/Hora</th><th>Ação</th><th>Usuário</th><th>Detalhes</th></tr></thead><tbody>${historico.map((log: any) => {const data = new Date(log.createdAt).toLocaleString("pt-BR");const acao = actionLabels[log.action]?.label || log.action;const usuario = log.userName || log.userEmail || "Sistema";let detalhes = "";if (log.action === "UPDATE" && log.changedFields) {detalhes = log.changedFields.map((f: string) => `<strong>${campoLabels[f] || f}:</strong> <span class="old">${log.oldValues?.[f] || "(vazio)"}</span> → <span class="new">${log.newValues?.[f] || "(vazio)"}</span>`).join("<br>");} else if (log.action === "CREATE") {detalhes = "Paciente cadastrado";} else if (log.action === "DELETE") {detalhes = "Registro excluído";} else if (log.action === "RESTORE") {detalhes = "Registro restaurado";}return `<tr><td>${data}</td><td>${acao}</td><td>${usuario}</td><td>${detalhes}</td></tr>`;}).join("")}</tbody></table><div class="footer"><p>Documento gerado automaticamente pelo sistema Gorgen para compliance LGPD.</p></div></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) { printWindow.document.write(htmlContent); printWindow.document.close(); printWindow.print(); }
    toast.success("Preparando PDF para impressão...");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <History className="h-4 w-4" />
          <span>{historico.length} alterações registradas (LGPD)</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>
      
      {historico.map((log: any) => (
        <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={actionLabels[log.action]?.color || "bg-gray-100"}>
                {actionLabels[log.action]?.label || log.action}
              </Badge>
              <span className="text-sm text-gray-600">
                {new Date(log.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              {log.userName || log.userEmail || "Sistema"}
            </div>
          </div>
          
          {log.action === "UPDATE" && log.changedFields && log.changedFields.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-500">Campos alterados:</p>
              <div className="grid grid-cols-1 gap-1">
                {log.changedFields.map((field: string) => {
                  const oldVal = log.oldValues?.[field];
                  const newVal = log.newValues?.[field];
                  return (
                    <div key={field} className="text-xs bg-white rounded px-2 py-1 border">
                      <span className="font-medium">{campoLabels[field] || field}:</span>
                      <span className="text-red-600 line-through ml-2">
                        {oldVal === null || oldVal === undefined || oldVal === "" ? "(vazio)" : String(oldVal)}
                      </span>
                      <span className="mx-1">→</span>
                      <span className="text-green-600">
                        {newVal === null || newVal === undefined || newVal === "" ? "(vazio)" : String(newVal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {log.action === "CREATE" && (
            <p className="text-xs text-gray-500 mt-1">Paciente cadastrado no sistema</p>
          )}
          
          {log.action === "DELETE" && (
            <p className="text-xs text-red-600 mt-1">Registro marcado como excluído (soft delete)</p>
          )}
          
          {log.action === "RESTORE" && (
            <p className="text-xs text-purple-600 mt-1">Registro restaurado</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function EditarPacienteModal({ paciente, open, onOpenChange }: EditarPacienteModalProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [outroOperadora1, setOutroOperadora1] = useState("");
  const [outroOperadora2, setOutroOperadora2] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = useCallback(async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
        toast.success("Endereço preenchido automaticamente!");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  // Verificar se operadora é Particular (campos de convênio desabilitados)
  const isParticular1 = formData.operadora1 === "Particular" || formData.operadora1 === "Retorno de Particular" || formData.operadora1 === "Cortesia";
  const isParticular2 = formData.operadora2 === "Particular" || formData.operadora2 === "Retorno de Particular" || formData.operadora2 === "Cortesia";

  useEffect(() => {
    if (paciente) {
      setFormData(paciente);
      // Verificar se operadora é "Outro"
      if (paciente.operadora1 && !OPERADORAS.includes(paciente.operadora1)) {
        setOutroOperadora1(paciente.operadora1);
      }
      if (paciente.operadora2 && !OPERADORAS.includes(paciente.operadora2)) {
        setOutroOperadora2(paciente.operadora2);
      }
    }
  }, [paciente]);

  const updateMutation = trpc.pacientes.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso!");
      utils.pacientes.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar paciente: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente) return;

    // Converter campos Date para string
    const dataToSubmit = {
      ...formData,
      operadora1: formData.operadora1 === "Outro" ? outroOperadora1 : formData.operadora1,
      operadora2: formData.operadora2 === "Outro" ? outroOperadora2 : formData.operadora2,
      dataInclusao: formData.dataInclusao instanceof Date 
        ? formData.dataInclusao.toISOString().split('T')[0] 
        : formData.dataInclusao,
      dataNascimento: formData.dataNascimento instanceof Date 
        ? formData.dataNascimento.toISOString().split('T')[0] 
        : formData.dataNascimento,
      dataObitoLastFU: formData.dataObitoLastFU instanceof Date 
        ? formData.dataObitoLastFU.toISOString().split('T')[0] 
        : formData.dataObitoLastFU,
    };

    updateMutation.mutate({
      id: paciente.id,
      data: dataToSubmit as any,
    });
  };

  if (!paciente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
          <DialogDescription>
            ID: {paciente.idPaciente} - {paciente.nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <Tabs defaultValue="dados-basicos" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="convenios">Convênios</TabsTrigger>
                <TabsTrigger value="clinico">Clínico</TabsTrigger>
                <TabsTrigger value="historico" className="gap-1">
                  <History className="h-3.5 w-3.5" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados-basicos" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome || ""}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <MaskedInput
                      mask="cpf"
                      id="cpf"
                      value={formData.cpf || ""}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento instanceof Date ? formData.dataNascimento.toISOString().split('T')[0] : (formData.dataNascimento || "")}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select
                      value={formData.sexo || ""}
                      onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nomeMae">Nome da Mãe</Label>
                    <Input
                      id="nomeMae"
                      value={formData.nomeMae || ""}
                      onChange={(e) => setFormData({ ...formData, nomeMae: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contato" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <MaskedInput
                      mask="telefone"
                      id="telefone"
                      value={formData.telefone || ""}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(51) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco || ""}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro || ""}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP {buscandoCep && <span className="text-xs text-blue-500 ml-2">Buscando...</span>}</Label>
                    <MaskedInput
                      mask="cep"
                      id="cep"
                      value={formData.cep || ""}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={(e) => buscarEnderecoPorCep(e.target.value)}
                      placeholder="99999-999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade || ""}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={formData.uf || ""}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="convenios" className="space-y-6 mt-4">
                {/* Convênio 1 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">Convênio Principal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operadora1">Operadora</Label>
                      <Select
                        value={formData.operadora1 || ""}
                        onValueChange={(value) => setFormData({ ...formData, operadora1: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERADORAS.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.operadora1 === "Outro" && (
                      <div className="space-y-2">
                        <Label htmlFor="outroOperadora1">Especifique</Label>
                        <Input
                          id="outroOperadora1"
                          value={outroOperadora1}
                          onChange={(e) => setOutroOperadora1(e.target.value)}
                          placeholder="Nome da operadora"
                        />
                      </div>
                    )}

                    {!isParticular1 && (
                    <>
                    <div className="space-y-2">
                      <Label htmlFor="planoModalidade1">Plano/Modalidade</Label>
                      <Input
                        id="planoModalidade1"
                        value={formData.planoModalidade1 || ""}
                        onChange={(e) => setFormData({ ...formData, planoModalidade1: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matriculaConvenio1">Matrícula</Label>
                      <Input
                        id="matriculaConvenio1"
                        value={formData.matriculaConvenio1 || ""}
                        onChange={(e) => setFormData({ ...formData, matriculaConvenio1: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vigente1"
                          checked={formData.vigente1 === "Sim"}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, vigente1: checked ? "Sim" : "Não" })
                          }
                        />
                        <Label htmlFor="vigente1">Vigente</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="privativo1"
                          checked={formData.privativo1 === "Sim"}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, privativo1: checked ? "Sim" : "Não" })
                          }
                        />
                        <Label htmlFor="privativo1">Privativo</Label>
                      </div>
                    </div>
                    </>
                    )}
                    {isParticular1 && (
                      <p className="text-sm text-muted-foreground italic col-span-2">Campos de convênio não aplicáveis para atendimento particular.</p>
                    )}
                  </div>
                </div>

                {/* Convênio 2 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">Convênio Secundário</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operadora2">Operadora</Label>
                      <Select
                        value={formData.operadora2 || ""}
                        onValueChange={(value) => setFormData({ ...formData, operadora2: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERADORAS.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.operadora2 === "Outro" && (
                      <div className="space-y-2">
                        <Label htmlFor="outroOperadora2">Especifique</Label>
                        <Input
                          id="outroOperadora2"
                          value={outroOperadora2}
                          onChange={(e) => setOutroOperadora2(e.target.value)}
                          placeholder="Nome da operadora"
                        />
                      </div>
                    )}

                    {!isParticular2 && (
                    <>
                    <div className="space-y-2">
                      <Label htmlFor="planoModalidade2">Plano/Modalidade</Label>
                      <Input
                        id="planoModalidade2"
                        value={formData.planoModalidade2 || ""}
                        onChange={(e) => setFormData({ ...formData, planoModalidade2: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matriculaConvenio2">Matrícula</Label>
                      <Input
                        id="matriculaConvenio2"
                        value={formData.matriculaConvenio2 || ""}
                        onChange={(e) => setFormData({ ...formData, matriculaConvenio2: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vigente2"
                          checked={formData.vigente2 === "Sim"}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, vigente2: checked ? "Sim" : "Não" })
                          }
                        />
                        <Label htmlFor="vigente2">Vigente</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="privativo2"
                          checked={formData.privativo2 === "Sim"}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, privativo2: checked ? "Sim" : "Não" })
                          }
                        />
                        <Label htmlFor="privativo2">Privativo</Label>
                      </div>
                    </div>
                    </>
                    )}
                    {isParticular2 && formData.operadora2 && (
                      <p className="text-sm text-muted-foreground italic col-span-2">Campos de convênio não aplicáveis para atendimento particular.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="clinico" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grupoDiagnostico">Grupo Diagnóstico</Label>
                    <Input
                      id="grupoDiagnostico"
                      value={formData.grupoDiagnostico || ""}
                      onChange={(e) => setFormData({ ...formData, grupoDiagnostico: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosticoEspecifico">Diagnóstico Específico</Label>
                    <Input
                      id="diagnosticoEspecifico"
                      value={formData.diagnosticoEspecifico || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosticoEspecifico: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statusCaso">Status do Caso</Label>
                    <Select
                      value={formData.statusCaso || ""}
                      onValueChange={(value) => setFormData({ ...formData, statusCaso: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Óbito">Óbito</SelectItem>
                        <SelectItem value="Perda de Seguimento">Perda de Seguimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempoSeguimentoAnos">Tempo de Seguimento (anos)</Label>
                    <Input
                      id="tempoSeguimentoAnos"
                      value={formData.tempoSeguimentoAnos || ""}
                      onChange={(e) => setFormData({ ...formData, tempoSeguimentoAnos: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 col-span-2">
                    <Checkbox
                      id="obitoPerda"
                      checked={formData.obitoPerda === "Sim"}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, obitoPerda: checked ? "Sim" : "Não" })
                      }
                    />
                    <Label htmlFor="obitoPerda">Óbito ou Perda de Seguimento</Label>
                  </div>

                  {formData.obitoPerda === "Sim" && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="dataObitoLastFU">Data do Óbito / Último Follow-up</Label>
                      <Input
                        id="dataObitoLastFU"
                        type="date"
                        value={formData.dataObitoLastFU instanceof Date ? formData.dataObitoLastFU.toISOString().split('T')[0] : (formData.dataObitoLastFU || "")}
                        onChange={(e) => setFormData({ ...formData, dataObitoLastFU: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historico" className="space-y-4 mt-4">
                <HistoricoAlteracoes pacienteId={paciente.id} />
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
