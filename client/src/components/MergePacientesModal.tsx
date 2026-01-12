import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Check, Merge, User, Phone, Mail, MapPin, Calendar, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Paciente {
  id: number;
  idPaciente: string;
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  operadora1?: string | null;
  planoModalidade1?: string | null;
  operadora2?: string | null;
  planoModalidade2?: string | null;
  statusCaso?: string | null;
  grupoDiagnostico?: string | null;
  diagnosticoEspecifico?: string | null;
}

interface MergePacientesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Paciente[];
  onMergeComplete: () => void;
}

export function MergePacientesModal({
  open,
  onOpenChange,
  pacientes,
  onMergeComplete,
}: MergePacientesModalProps) {
  const [pacientePrincipal, setPacientePrincipal] = useState<number | null>(null);
  const [camposParaCopiar, setCamposParaCopiar] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"selecionar" | "revisar">("selecionar");

  const mergeMutation = trpc.pacientes.mergeDuplicados.useMutation({
    onSuccess: () => {
      toast.success("Pacientes unificados com sucesso!");
      onOpenChange(false);
      onMergeComplete();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao unificar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (open) {
      setPacientePrincipal(null);
      setCamposParaCopiar({});
      setStep("selecionar");
    }
  }, [open]);

  // Identificar campos que têm valores diferentes entre os pacientes
  const camposComDiferenca = () => {
    if (pacientes.length < 2) return {};
    
    const campos: Record<string, { campo: string; valores: { pacienteId: number; valor: string | null }[] }> = {};
    const camposParaComparar = [
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "endereco", label: "Endereço" },
      { key: "cidade", label: "Cidade" },
      { key: "uf", label: "UF" },
      { key: "operadora1", label: "Convênio 1" },
      { key: "planoModalidade1", label: "Plano 1" },
      { key: "operadora2", label: "Convênio 2" },
      { key: "planoModalidade2", label: "Plano 2" },
      { key: "grupoDiagnostico", label: "Grupo Diagnóstico" },
      { key: "diagnosticoEspecifico", label: "Diagnóstico Específico" },
    ];

    camposParaComparar.forEach(({ key, label }) => {
      const valores = pacientes.map((p) => ({
        pacienteId: p.id,
        valor: (p as any)[key] || null,
      }));

      // Verificar se há valores diferentes (não nulos)
      const valoresNaoNulos = valores.filter((v) => v.valor);
      const valoresUnicos = Array.from(new Set(valoresNaoNulos.map((v) => v.valor)));

      if (valoresUnicos.length > 1 || (valoresUnicos.length === 1 && valoresNaoNulos.length < pacientes.length)) {
        campos[key] = { campo: label, valores };
      }
    });

    return campos;
  };

  const handleProximoStep = () => {
    if (!pacientePrincipal) {
      toast.error("Selecione o paciente principal");
      return;
    }
    
    const diferencias = camposComDiferenca();
    if (Object.keys(diferencias).length > 0) {
      // Pré-selecionar valores do paciente principal
      const preSelecao: Record<string, number> = {};
      Object.keys(diferencias).forEach((campo) => {
        const valorPrincipal = diferencias[campo].valores.find(
          (v) => v.pacienteId === pacientePrincipal && v.valor
        );
        if (valorPrincipal) {
          preSelecao[campo] = pacientePrincipal;
        } else {
          // Se o principal não tem valor, selecionar o primeiro que tem
          const primeiroComValor = diferencias[campo].valores.find((v) => v.valor);
          if (primeiroComValor) {
            preSelecao[campo] = primeiroComValor.pacienteId;
          }
        }
      });
      setCamposParaCopiar(preSelecao);
      setStep("revisar");
    } else {
      // Não há diferenças, fazer merge direto
      handleMerge();
    }
  };

  const handleMerge = () => {
    if (!pacientePrincipal) return;

    const idsParaExcluir = pacientes
      .filter((p) => p.id !== pacientePrincipal)
      .map((p) => p.id);

    mergeMutation.mutate({
      pacientePrincipalId: pacientePrincipal,
      pacientesParaExcluirIds: idsParaExcluir,
      camposParaCopiar,
    });
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return "-";
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return data;
    }
  };

  const pacientePrincipalObj = pacientes.find((p) => p.id === pacientePrincipal);
  const diferencias = camposComDiferenca();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Unificar Pacientes Duplicados
          </DialogTitle>
          <DialogDescription>
            {step === "selecionar"
              ? "Selecione qual registro será mantido como principal. Os demais serão excluídos e seus atendimentos serão migrados."
              : "Revise os dados que serão preservados. Você pode escolher valores de qualquer registro."}
          </DialogDescription>
        </DialogHeader>

        {step === "selecionar" ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Atenção</p>
                  <p className="text-sm text-amber-700">
                    Esta ação é irreversível. Os registros não selecionados serão excluídos, 
                    mas seus atendimentos serão preservados e vinculados ao registro principal.
                  </p>
                </div>
              </div>
            </div>

            <RadioGroup
              value={pacientePrincipal?.toString() || ""}
              onValueChange={(value) => setPacientePrincipal(parseInt(value))}
            >
              <div className="grid gap-4">
                {pacientes.map((paciente) => (
                  <Card
                    key={paciente.id}
                    className={`cursor-pointer transition-all ${
                      pacientePrincipal === paciente.id
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setPacientePrincipal(paciente.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={paciente.id.toString()} id={`paciente-${paciente.id}`} />
                          <div>
                            <CardTitle className="text-base">{paciente.nome}</CardTitle>
                            <p className="text-sm text-muted-foreground">ID: {paciente.idPaciente}</p>
                          </div>
                        </div>
                        {pacientePrincipal === paciente.id && (
                          <Badge className="bg-green-500">Principal</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{paciente.cpf || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatarData(paciente.dataNascimento)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{paciente.telefone || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{paciente.email || "-"}</span>
                        </div>
                      </div>
                      {paciente.operadora1 && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Convênio: {paciente.operadora1}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Registro principal:</strong> {pacientePrincipalObj?.nome} ({pacientePrincipalObj?.idPaciente})
              </p>
            </div>

            {Object.keys(diferencias).length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Os seguintes campos têm valores diferentes. Escolha qual valor manter:
                </p>
                {Object.entries(diferencias).map(([campo, { campo: label, valores }]) => (
                  <Card key={campo}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <RadioGroup
                        value={camposParaCopiar[campo]?.toString() || ""}
                        onValueChange={(value) =>
                          setCamposParaCopiar((prev) => ({
                            ...prev,
                            [campo]: parseInt(value),
                          }))
                        }
                      >
                        <div className="space-y-2">
                          {valores.map((v) => {
                            const paciente = pacientes.find((p) => p.id === v.pacienteId);
                            return (
                              <div key={v.pacienteId} className="flex items-center gap-3">
                                <RadioGroupItem
                                  value={v.pacienteId.toString()}
                                  id={`${campo}-${v.pacienteId}`}
                                  disabled={!v.valor}
                                />
                                <Label
                                  htmlFor={`${campo}-${v.pacienteId}`}
                                  className={`flex-1 ${!v.valor ? "text-muted-foreground" : ""}`}
                                >
                                  <span className="font-medium">{v.valor || "(vazio)"}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    - {paciente?.nome}
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não há campos com valores diferentes. O merge será realizado diretamente.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "revisar" && (
            <Button variant="outline" onClick={() => setStep("selecionar")}>
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === "selecionar" ? (
            <Button onClick={handleProximoStep} disabled={!pacientePrincipal}>
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleMerge}
              disabled={mergeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {mergeMutation.isPending ? "Unificando..." : "Confirmar Unificação"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
