import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OPERADORAS } from "@/lib/operadoras";
import { TIPOS_ATENDIMENTO, LOCAIS_ATENDIMENTO } from "@/lib/atendimentos-constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Atendimento {
  id: number;
  atendimento: string;
  pacienteId: number;
  dataAtendimento: Date | string;
  semana: number | null;
  tipoAtendimento: string | null;
  procedimento: string | null;
  codigosCBHPM: string | null;
  nomePaciente: string | null;
  local: string | null;
  convenio: string | null;
  planoConvenio: string | null;
  pagamentoEfetivado: boolean | null;
  pagamentoPostergado: string | null;
  dataEnvioFaturamento: string | Date | null;
  dataEsperadaPagamento: string | Date | null;
  faturamentoPrevisto: string | null;
  registroManualValorHM: string | null;
  faturamentoPrevistoFinal: string | null;
  dataPagamento: string | Date | null;
  notaFiscalCorrespondente: string | null;
  observacoes: string | null;
  faturamentoLeticia: string | null;
  faturamentoAGLU: string | null;
  mes: number | null;
  ano: number | null;
  trimestre: string | null;
  trimestreAno: string | null;
  pacientes?: {
    id: number;
    nome: string;
    idPaciente: string;
  };
}

interface EditarAtendimentoModalProps {
  atendimento: Atendimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper para formatar data para input
const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

export function EditarAtendimentoModal({ atendimento, open, onOpenChange }: EditarAtendimentoModalProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<Partial<Atendimento>>({});
  const [outroConvenio, setOutroConvenio] = useState("");

  useEffect(() => {
    if (atendimento) {
      setFormData(atendimento);
      // Verificar se convênio é "Outro"
      if (atendimento.convenio && !OPERADORAS.includes(atendimento.convenio)) {
        setOutroConvenio(atendimento.convenio);
      }
    }
  }, [atendimento]);

  const updateMutation = trpc.atendimentos.update.useMutation({
    onSuccess: () => {
      toast.success("Atendimento atualizado com sucesso!");
      utils.atendimentos.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar atendimento: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atendimento) return;

    // Converter campos Date para o formato correto
    // Corrigir timezone: criar data ao meio-dia local para evitar problemas de fuso horário
    let dataAtendimentoLocal: Date;
    if (formData.dataAtendimento) {
      const dateStr = typeof formData.dataAtendimento === 'string' 
        ? formData.dataAtendimento 
        : formData.dataAtendimento.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      dataAtendimentoLocal = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      dataAtendimentoLocal = new Date();
    }
    
    const dataToSubmit = {
      ...formData,
      convenio: formData.convenio === "Outro" ? outroConvenio : formData.convenio,
      dataAtendimento: dataAtendimentoLocal,
      dataEnvioFaturamento: formData.dataEnvioFaturamento instanceof Date 
        ? formData.dataEnvioFaturamento.toISOString().split('T')[0] 
        : formData.dataEnvioFaturamento,
      dataEsperadaPagamento: formData.dataEsperadaPagamento instanceof Date 
        ? formData.dataEsperadaPagamento.toISOString().split('T')[0] 
        : formData.dataEsperadaPagamento,
      dataPagamento: formData.dataPagamento instanceof Date 
        ? formData.dataPagamento.toISOString().split('T')[0] 
        : formData.dataPagamento,
    };

    // Remover campos que não devem ser enviados
    delete (dataToSubmit as any).pacientes;
    delete (dataToSubmit as any).id;

    updateMutation.mutate({
      id: atendimento.id,
      data: dataToSubmit as any,
    });
  };

  if (!atendimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Atendimento</DialogTitle>
          <DialogDescription>
            ID: {atendimento.atendimento} - Paciente: {atendimento.pacientes?.nome || atendimento.nomePaciente}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <Tabs defaultValue="dados-basicos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
                <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
                <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
              </TabsList>

              <TabsContent value="dados-basicos" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataAtendimento">Data do Atendimento *</Label>
                    <Input
                      id="dataAtendimento"
                      type="date"
                      value={formatDateForInput(formData.dataAtendimento || null)}
                      onChange={(e) => setFormData({ ...formData, dataAtendimento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoAtendimento">Tipo de Atendimento</Label>
                    <Select
                      value={formData.tipoAtendimento || ""}
                      onValueChange={(value) => setFormData({ ...formData, tipoAtendimento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ATENDIMENTO.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="local">Local</Label>
                    <Select
                      value={formData.local || ""}
                      onValueChange={(value) => setFormData({ ...formData, local: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCAIS_ATENDIMENTO.map((local) => (
                          <SelectItem key={local} value={local}>{local}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convenio">Convênio</Label>
                    <Select
                      value={OPERADORAS.includes(formData.convenio || "") ? formData.convenio || "" : "Outro"}
                      onValueChange={(value) => {
                        if (value === "Outro") {
                          setFormData({ ...formData, convenio: "Outro" });
                        } else {
                          setFormData({ ...formData, convenio: value });
                          setOutroConvenio("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERADORAS.map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.convenio === "Outro" || (!OPERADORAS.includes(formData.convenio || "") && formData.convenio)) && (
                    <div className="space-y-2">
                      <Label htmlFor="outroConvenio">Especificar Convênio</Label>
                      <Input
                        id="outroConvenio"
                        value={outroConvenio}
                        onChange={(e) => setOutroConvenio(e.target.value)}
                        placeholder="Nome do convênio"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="planoConvenio">Plano do Convênio</Label>
                    <Input
                      id="planoConvenio"
                      value={formData.planoConvenio || ""}
                      onChange={(e) => setFormData({ ...formData, planoConvenio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="procedimento">Procedimento</Label>
                    <Input
                      id="procedimento"
                      value={formData.procedimento || ""}
                      onChange={(e) => setFormData({ ...formData, procedimento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="codigosCBHPM">Códigos CBHPM</Label>
                    <Input
                      id="codigosCBHPM"
                      value={formData.codigosCBHPM || ""}
                      onChange={(e) => setFormData({ ...formData, codigosCBHPM: e.target.value })}
                      placeholder="Ex: 31303030, 31303048"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ""}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faturamento" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faturamentoPrevisto">Faturamento Previsto (R$)</Label>
                    <Input
                      id="faturamentoPrevisto"
                      type="number"
                      step="0.01"
                      value={formData.faturamentoPrevisto || ""}
                      onChange={(e) => setFormData({ ...formData, faturamentoPrevisto: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registroManualValorHM">Registro Manual Valor HM (R$)</Label>
                    <Input
                      id="registroManualValorHM"
                      type="number"
                      step="0.01"
                      value={formData.registroManualValorHM || ""}
                      onChange={(e) => setFormData({ ...formData, registroManualValorHM: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faturamentoPrevistoFinal">Faturamento Previsto Final (R$)</Label>
                    <Input
                      id="faturamentoPrevistoFinal"
                      type="number"
                      step="0.01"
                      value={formData.faturamentoPrevistoFinal || ""}
                      onChange={(e) => setFormData({ ...formData, faturamentoPrevistoFinal: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataEnvioFaturamento">Data Envio Faturamento</Label>
                    <Input
                      id="dataEnvioFaturamento"
                      type="date"
                      value={formatDateForInput(formData.dataEnvioFaturamento || null)}
                      onChange={(e) => setFormData({ ...formData, dataEnvioFaturamento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataEsperadaPagamento">Data Esperada Pagamento</Label>
                    <Input
                      id="dataEsperadaPagamento"
                      type="date"
                      value={formatDateForInput(formData.dataEsperadaPagamento || null)}
                      onChange={(e) => setFormData({ ...formData, dataEsperadaPagamento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faturamentoLeticia">Faturamento Letícia (R$)</Label>
                    <Input
                      id="faturamentoLeticia"
                      type="number"
                      step="0.01"
                      value={formData.faturamentoLeticia || ""}
                      onChange={(e) => setFormData({ ...formData, faturamentoLeticia: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faturamentoAGLU">Faturamento AG/LU (R$)</Label>
                    <Input
                      id="faturamentoAGLU"
                      type="number"
                      step="0.01"
                      value={formData.faturamentoAGLU || ""}
                      onChange={(e) => setFormData({ ...formData, faturamentoAGLU: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pagamento" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pagamentoEfetivado"
                        checked={formData.pagamentoEfetivado || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, pagamentoEfetivado: checked as boolean })}
                      />
                      <Label htmlFor="pagamentoEfetivado" className="text-base font-medium">
                        Pagamento Efetivado
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                    <Input
                      id="dataPagamento"
                      type="date"
                      value={formatDateForInput(formData.dataPagamento || null)}
                      onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pagamentoPostergado">Pagamento Postergado</Label>
                    <Select
                      value={formData.pagamentoPostergado || ""}
                      onValueChange={(value) => setFormData({ ...formData, pagamentoPostergado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notaFiscalCorrespondente">Nota Fiscal Correspondente</Label>
                    <Input
                      id="notaFiscalCorrespondente"
                      value={formData.notaFiscalCorrespondente || ""}
                      onChange={(e) => setFormData({ ...formData, notaFiscalCorrespondente: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" tooltip="Cancelar operação" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} tooltip="Salvar alterações">
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
