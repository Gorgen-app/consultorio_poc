import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OPERADORAS } from "@/lib/operadoras";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Paciente {
  id: number;
  idPaciente: string;
  nome: string;
  cpf: string | null;
  dataNascimento: string | null;
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
  dataObitoLastFU: string | null;
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

export function EditarPacienteModal({ paciente, open, onOpenChange }: EditarPacienteModalProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [outroOperadora1, setOutroOperadora1] = useState("");
  const [outroOperadora2, setOutroOperadora2] = useState("");

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

    const dataToSubmit = {
      ...formData,
      operadora1: formData.operadora1 === "Outro" ? outroOperadora1 : formData.operadora1,
      operadora2: formData.operadora2 === "Outro" ? outroOperadora2 : formData.operadora2,
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="convenios">Convênios</TabsTrigger>
                <TabsTrigger value="clinico">Clínico</TabsTrigger>
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
                    <Input
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
                      value={formData.dataNascimento || ""}
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
                    <Input
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
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep || ""}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
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
                        value={formData.dataObitoLastFU || ""}
                        onChange={(e) => setFormData({ ...formData, dataObitoLastFU: e.target.value })}
                      />
                    </div>
                  )}
                </div>
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
