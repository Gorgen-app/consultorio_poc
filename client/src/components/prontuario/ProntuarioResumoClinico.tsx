import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, Pill, Stethoscope, Save, CheckCircle2 } from "lucide-react";

interface Props {
  pacienteId: number;
  resumoClinico: any;
  problemasAtivos: any[];
  alergias: any[];
  medicamentosUso: any[];
  onUpdate: () => void;
}

export default function ProntuarioResumoClinico({
  pacienteId,
  resumoClinico,
  problemasAtivos,
  alergias,
  medicamentosUso,
  onUpdate,
}: Props) {
  
  const [editandoResumo, setEditandoResumo] = useState(false);
  const [novoProblema, setNovoProblema] = useState(false);
  const [novaAlergia, setNovaAlergia] = useState(false);
  const [novoMedicamento, setNovoMedicamento] = useState(false);
  
  // Form states
  const [resumoForm, setResumoForm] = useState({
    historiaClinica: resumoClinico?.historiaClinica || "",
    antecedentesPessoais: resumoClinico?.antecedentesPessoais || "",
    antecedentesFamiliares: resumoClinico?.antecedentesFamiliares || "",
    habitos: resumoClinico?.habitos || "",
    pesoAtual: resumoClinico?.pesoAtual || "",
    altura: resumoClinico?.altura || "",
  });
  
  const [problemaForm, setProblemaForm] = useState({
    descricao: "",
    cid10: "",
    dataInicio: "",
    observacoes: "",
  });
  
  const [alergiaForm, setAlergiaForm] = useState({
    tipo: "Medicamento" as "Medicamento" | "Alimento" | "Ambiental" | "Outro",
    substancia: "",
    reacao: "",
    gravidade: "Leve" as "Leve" | "Moderada" | "Grave",
  });
  
  const [medicamentoForm, setMedicamentoForm] = useState({
    medicamento: "",
    dosagem: "",
    posologia: "",
    motivoUso: "",
  });
  
  // Mutations
  const upsertResumo = trpc.prontuario.resumoClinico.upsert.useMutation({
    onSuccess: () => {
      toast.success("Resumo clínico salvo com sucesso!");
      setEditandoResumo(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });
  
  const createProblema = trpc.prontuario.problemas.create.useMutation({
    onSuccess: () => {
      toast.success("Problema adicionado!");
      setNovoProblema(false);
      setProblemaForm({ descricao: "", cid10: "", dataInicio: "", observacoes: "" });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar: " + error.message);
    },
  });
  
  const createAlergia = trpc.prontuario.alergias.create.useMutation({
    onSuccess: () => {
      toast.success("Alergia registrada!");
      setNovaAlergia(false);
      setAlergiaForm({ tipo: "Medicamento", substancia: "", reacao: "", gravidade: "Leve" });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar: " + error.message);
    },
  });
  
  const createMedicamento = trpc.prontuario.medicamentos.create.useMutation({
    onSuccess: () => {
      toast.success("Medicamento adicionado!");
      setNovoMedicamento(false);
      setMedicamentoForm({ medicamento: "", dosagem: "", posologia: "", motivoUso: "" });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar: " + error.message);
    },
  });
  
  const updateProblema = trpc.prontuario.problemas.update.useMutation({
    onSuccess: () => {
      toast.success("Problema atualizado!");
      onUpdate();
    },
  });
  
  const deleteAlergia = trpc.prontuario.alergias.delete.useMutation({
    onSuccess: () => {
      toast.success("Alergia removida!");
      onUpdate();
    },
  });
  
  const updateMedicamento = trpc.prontuario.medicamentos.update.useMutation({
    onSuccess: () => {
      toast.success("Medicamento atualizado!");
      onUpdate();
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Resumo Clínico</h2>
          <p className="text-sm text-gray-500">História clínica, problemas ativos, alergias e medicamentos</p>
        </div>
        <Button onClick={() => setEditandoResumo(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Resumo
        </Button>
      </div>
      
      {/* História Clínica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">História Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {resumoClinico?.historiaClinica || "Nenhuma história clínica registrada."}
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antecedentes Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Antecedentes Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {resumoClinico?.antecedentesPessoais || "Nenhum antecedente registrado."}
            </p>
          </CardContent>
        </Card>
        
        {/* Antecedentes Familiares */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Antecedentes Familiares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {resumoClinico?.antecedentesFamiliares || "Nenhum antecedente familiar registrado."}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Hábitos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hábitos de Vida</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {resumoClinico?.habitos || "Nenhum hábito registrado."}
          </p>
        </CardContent>
      </Card>
      
      {/* Problemas Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Lista de Problemas
            </CardTitle>
            <CardDescription>Problemas de saúde ativos e resolvidos</CardDescription>
          </div>
          <Dialog open={novoProblema} onOpenChange={setNovoProblema}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Problema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Descrição *</Label>
                  <Input
                    value={problemaForm.descricao}
                    onChange={(e) => setProblemaForm({ ...problemaForm, descricao: e.target.value })}
                    placeholder="Ex: Hipertensão Arterial Sistêmica"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CID-10</Label>
                    <Input
                      value={problemaForm.cid10}
                      onChange={(e) => setProblemaForm({ ...problemaForm, cid10: e.target.value })}
                      placeholder="Ex: I10"
                    />
                  </div>
                  <div>
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={problemaForm.dataInicio}
                      onChange={(e) => setProblemaForm({ ...problemaForm, dataInicio: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={problemaForm.observacoes}
                    onChange={(e) => setProblemaForm({ ...problemaForm, observacoes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovoProblema(false)}>Cancelar</Button>
                <Button 
                  onClick={() => createProblema.mutate({ pacienteId, ...problemaForm, ativo: true })}
                  disabled={!problemaForm.descricao || createProblema.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {problemasAtivos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum problema registrado.</p>
          ) : (
            <div className="space-y-2">
              {problemasAtivos.map((p) => (
                <div 
                  key={p.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    p.ativo ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <p className={`font-medium ${!p.ativo && "line-through text-gray-400"}`}>
                      {p.descricao}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.cid10 && `CID: ${p.cid10} • `}
                      {p.dataInicio && `Início: ${new Date(p.dataInicio).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.ativo ? "default" : "secondary"}>
                      {p.ativo ? "Ativo" : "Resolvido"}
                    </Badge>
                    {p.ativo && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => updateProblema.mutate({ id: p.id, ativo: false, dataResolucao: new Date().toISOString().split("T")[0] })}
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Alergias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Alergias
            </CardTitle>
            <CardDescription>Alergias conhecidas do paciente</CardDescription>
          </div>
          <Dialog open={novaAlergia} onOpenChange={setNovaAlergia}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Alergia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Opção rápida para NKDA */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Nenhuma alergia conhecida (NKDA)</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        createAlergia.mutate({ 
                          pacienteId, 
                          tipo: "Outro", 
                          substancia: "NKDA - Nenhuma alergia conhecida", 
                          reacao: "Paciente nega alergias", 
                          gravidade: "Leve",
                          confirmada: true 
                        });
                      }}
                      disabled={createAlergia.isPending}
                    >
                      Confirmar NKDA
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou registrar alergia específica</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={alergiaForm.tipo}
                      onValueChange={(v) => setAlergiaForm({ ...alergiaForm, tipo: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Medicamento">Medicamento</SelectItem>
                        <SelectItem value="Alimento">Alimento</SelectItem>
                        <SelectItem value="Ambiental">Ambiental</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gravidade</Label>
                    <Select
                      value={alergiaForm.gravidade}
                      onValueChange={(v) => setAlergiaForm({ ...alergiaForm, gravidade: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leve">Leve</SelectItem>
                        <SelectItem value="Moderada">Moderada</SelectItem>
                        <SelectItem value="Grave">Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Substância *</Label>
                  <Input
                    value={alergiaForm.substancia}
                    onChange={(e) => setAlergiaForm({ ...alergiaForm, substancia: e.target.value })}
                    placeholder="Ex: Dipirona, Camarão, Látex"
                  />
                </div>
                <div>
                  <Label>Reação</Label>
                  <Input
                    value={alergiaForm.reacao}
                    onChange={(e) => setAlergiaForm({ ...alergiaForm, reacao: e.target.value })}
                    placeholder="Ex: Urticária, Edema de glote"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovaAlergia(false)}>Cancelar</Button>
                <Button 
                  onClick={() => createAlergia.mutate({ pacienteId, ...alergiaForm, confirmada: true })}
                  disabled={!alergiaForm.substancia || createAlergia.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {alergias.length === 0 ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              Nenhuma alergia conhecida (NKDA)
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-2">
              {alergias.map((a) => (
                <Badge 
                  key={a.id} 
                  variant={a.gravidade === "Grave" ? "destructive" : "outline"}
                  className="flex items-center gap-2 py-1.5"
                >
                  <span>{a.substancia}</span>
                  {a.gravidade === "Grave" && <AlertTriangle className="h-3 w-3" />}
                  <button 
                    onClick={() => deleteAlergia.mutate({ id: a.id })}
                    className="ml-1 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Medicamentos em Uso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#0056A4]" />
              Medicamentos em Uso
            </CardTitle>
            <CardDescription>Medicamentos de uso contínuo</CardDescription>
          </div>
          <Dialog open={novoMedicamento} onOpenChange={setNovoMedicamento}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Medicamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Medicamento *</Label>
                  <Input
                    value={medicamentoForm.medicamento}
                    onChange={(e) => setMedicamentoForm({ ...medicamentoForm, medicamento: e.target.value })}
                    placeholder="Ex: Losartana 50mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dosagem</Label>
                    <Input
                      value={medicamentoForm.dosagem}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, dosagem: e.target.value })}
                      placeholder="Ex: 50mg"
                    />
                  </div>
                  <div>
                    <Label>Posologia</Label>
                    <Input
                      value={medicamentoForm.posologia}
                      onChange={(e) => setMedicamentoForm({ ...medicamentoForm, posologia: e.target.value })}
                      placeholder="Ex: 1x ao dia"
                    />
                  </div>
                </div>
                <div>
                  <Label>Motivo de Uso</Label>
                  <Input
                    value={medicamentoForm.motivoUso}
                    onChange={(e) => setMedicamentoForm({ ...medicamentoForm, motivoUso: e.target.value })}
                    placeholder="Ex: Hipertensão"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovoMedicamento(false)}>Cancelar</Button>
                <Button 
                  onClick={() => createMedicamento.mutate({ pacienteId, ...medicamentoForm, ativo: true })}
                  disabled={!medicamentoForm.medicamento || createMedicamento.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {medicamentosUso.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum medicamento em uso.</p>
          ) : (
            <div className="space-y-2">
              {medicamentosUso.map((m) => (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-white"
                >
                  <div>
                    <p className="font-medium">{m.medicamento}</p>
                    <p className="text-xs text-gray-500">
                      {m.dosagem && `${m.dosagem} • `}
                      {m.posologia && `${m.posologia}`}
                      {m.motivoUso && ` • ${m.motivoUso}`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => updateMedicamento.mutate({ id: m.id, ativo: false, dataFim: new Date().toISOString().split("T")[0] })}
                  >
                    Suspender
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Edição do Resumo */}
      <Dialog open={editandoResumo} onOpenChange={setEditandoResumo}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Resumo Clínico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Peso Atual (kg)</Label>
                <NumberInput
                  decimals={1}
                  value={resumoForm.pesoAtual}
                  onChange={(value) => setResumoForm({ ...resumoForm, pesoAtual: value?.toString() || "" })}
                  placeholder="Ex: 70,5"
                  suffix="kg"
                />
              </div>
              <div>
                <Label>Altura (m)</Label>
                <NumberInput
                  decimals={2}
                  value={resumoForm.altura}
                  onChange={(value) => setResumoForm({ ...resumoForm, altura: value?.toString() || "" })}
                  placeholder="Ex: 1,75"
                  suffix="m"
                />
              </div>
            </div>
            <div>
              <Label>História Clínica</Label>
              <Textarea
                rows={4}
                value={resumoForm.historiaClinica}
                onChange={(e) => setResumoForm({ ...resumoForm, historiaClinica: e.target.value })}
                placeholder="Descreva a história clínica do paciente..."
              />
            </div>
            <div>
              <Label>Antecedentes Pessoais</Label>
              <Textarea
                rows={3}
                value={resumoForm.antecedentesPessoais}
                onChange={(e) => setResumoForm({ ...resumoForm, antecedentesPessoais: e.target.value })}
                placeholder="Doenças prévias, cirurgias, internações..."
              />
            </div>
            <div>
              <Label>Antecedentes Familiares</Label>
              <Textarea
                rows={3}
                value={resumoForm.antecedentesFamiliares}
                onChange={(e) => setResumoForm({ ...resumoForm, antecedentesFamiliares: e.target.value })}
                placeholder="Histórico familiar de doenças..."
              />
            </div>
            <div>
              <Label>Hábitos de Vida</Label>
              <Textarea
                rows={3}
                value={resumoForm.habitos}
                onChange={(e) => setResumoForm({ ...resumoForm, habitos: e.target.value })}
                placeholder="Tabagismo, etilismo, atividade física, alimentação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoResumo(false)}>Cancelar</Button>
            <Button 
              onClick={() => upsertResumo.mutate({ pacienteId, ...resumoForm })}
              disabled={upsertResumo.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
