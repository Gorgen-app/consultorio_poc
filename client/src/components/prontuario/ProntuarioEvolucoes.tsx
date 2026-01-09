import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FileText, Calendar, User, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  evolucoes: any[];
  onUpdate: () => void;
}

export default function ProntuarioEvolucoes({ pacienteId, evolucoes, onUpdate }: Props) {
  
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [evolucaoIdParaUpload, setEvolucaoIdParaUpload] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    dataEvolucao: new Date().toISOString().split("T")[0],
    tipo: "Consulta" as "Consulta" | "Retorno" | "Urgência" | "Teleconsulta" | "Parecer",
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
    pressaoArterial: "",
    frequenciaCardiaca: "",
    temperatura: "",
    peso: "",
    altura: "",
  });
  
  const createEvolucao = trpc.prontuario.evolucoes.create.useMutation({
    onSuccess: () => {
      toast.success("Evolução registrada com sucesso!");
      setNovaEvolucao(false);
      setForm({
        dataEvolucao: new Date().toISOString().split("T")[0],
        tipo: "Consulta",
        subjetivo: "",
        objetivo: "",
        avaliacao: "",
        plano: "",
        pressaoArterial: "",
        frequenciaCardiaca: "",
        temperatura: "",
        peso: "",
        altura: "",
      });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar: " + error.message);
    },
  });
  
  const formatarData = (data: string | Date) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Evoluções</h2>
          <p className="text-sm text-gray-500">Registro de consultas e atendimentos (SOAP)</p>
        </div>
        <Dialog open={novaEvolucao} onOpenChange={setNovaEvolucao}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Evolução
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Evolução</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="soap" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="soap">SOAP</TabsTrigger>
                <TabsTrigger value="sinais">Sinais Vitais</TabsTrigger>
              </TabsList>
              
              <TabsContent value="soap" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data/Hora</Label>
                    <Input
                      type="datetime-local"
                      value={form.dataEvolucao}
                      onChange={(e) => setForm({ ...form, dataEvolucao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Tipo de Atendimento</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={(v) => setForm({ ...form, tipo: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consulta">Consulta</SelectItem>
                        <SelectItem value="Retorno">Retorno</SelectItem>
                        <SelectItem value="Urgência">Urgência</SelectItem>
                        <SelectItem value="Teleconsulta">Teleconsulta</SelectItem>
                        <SelectItem value="Parecer">Parecer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">S</span>
                    Subjetivo (Queixa / História)
                  </Label>
                  <Textarea
                    rows={4}
                    value={form.subjetivo}
                    onChange={(e) => setForm({ ...form, subjetivo: e.target.value })}
                    placeholder="Queixa principal, história da doença atual, sintomas relatados pelo paciente..."
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
                    Objetivo (Exame Físico)
                  </Label>
                  <Textarea
                    rows={4}
                    value={form.objetivo}
                    onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                    placeholder="Achados do exame físico, sinais vitais, resultados de exames..."
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
                    Avaliação (Diagnóstico)
                  </Label>
                  <Textarea
                    rows={3}
                    value={form.avaliacao}
                    onChange={(e) => setForm({ ...form, avaliacao: e.target.value })}
                    placeholder="Hipóteses diagnósticas, diagnóstico diferencial..."
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
                    Plano (Conduta)
                  </Label>
                  <Textarea
                    rows={4}
                    value={form.plano}
                    onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    placeholder="Prescrições, exames solicitados, encaminhamentos, orientações..."
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="sinais" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pressão Arterial</Label>
                    <Input
                      value={form.pressaoArterial}
                      onChange={(e) => setForm({ ...form, pressaoArterial: e.target.value })}
                      placeholder="Ex: 120x80"
                    />
                  </div>
                  <div>
                    <Label>Frequência Cardíaca (bpm)</Label>
                    <Input
                      type="number"
                      value={form.frequenciaCardiaca}
                      onChange={(e) => setForm({ ...form, frequenciaCardiaca: e.target.value })}
                      placeholder="Ex: 72"
                    />
                  </div>
                  <div>
                    <Label>Temperatura (°C)</Label>
                    <Input
                      value={form.temperatura}
                      onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
                      placeholder="Ex: 36.5"
                    />
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      value={form.peso}
                      onChange={(e) => setForm({ ...form, peso: e.target.value })}
                      placeholder="Ex: 70.5"
                    />
                  </div>
                  <div>
                    <Label>Altura (m)</Label>
                    <Input
                      value={form.altura}
                      onChange={(e) => setForm({ ...form, altura: e.target.value })}
                      placeholder="Ex: 1.75"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovaEvolucao(false)}>Cancelar</Button>
              <Button 
                onClick={() => createEvolucao.mutate({
                  pacienteId,
                  dataEvolucao: new Date(form.dataEvolucao),
                  tipo: form.tipo,
                  subjetivo: form.subjetivo || null,
                  objetivo: form.objetivo || null,
                  avaliacao: form.avaliacao || null,
                  plano: form.plano || null,
                  pressaoArterial: form.pressaoArterial || null,
                  frequenciaCardiaca: form.frequenciaCardiaca ? parseInt(form.frequenciaCardiaca) : null,
                  temperatura: form.temperatura || null,
                  peso: form.peso || null,
                  altura: form.altura || null,
                })}
                disabled={createEvolucao.isPending}
              >
                Salvar Evolução
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lista de Evoluções */}
      {evolucoes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma evolução registrada.</p>
            <Button className="mt-4" onClick={() => setNovaEvolucao(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeira Evolução
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evolucoes.map((ev) => (
            <Card key={ev.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatarData(ev.dataEvolucao)}</span>
                    </div>
                    <Badge variant="outline">{ev.tipo}</Badge>
                    {ev.assinado && <Badge variant="secondary">Assinado</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.profissionalNome && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ev.profissionalNome}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEvolucaoIdParaUpload(ev.id);
                        setModalUploadAberto(true);
                      }}
                      title="Anexar documento"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    {expandido === ev.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                {/* Preview do conteúdo */}
                {expandido !== ev.id && ev.subjetivo && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{ev.subjetivo}</p>
                )}
              </CardHeader>
              
              {expandido === ev.id && (
                <CardContent className="border-t bg-gray-50">
                  <div className="space-y-4 py-4">
                    {/* Sinais Vitais */}
                    {(ev.pressaoArterial || ev.frequenciaCardiaca || ev.temperatura || ev.peso) && (
                      <div className="flex flex-wrap gap-4 p-3 bg-white rounded-lg border">
                        {ev.pressaoArterial && (
                          <div className="text-sm">
                            <span className="text-gray-500">PA:</span> {ev.pressaoArterial} mmHg
                          </div>
                        )}
                        {ev.frequenciaCardiaca && (
                          <div className="text-sm">
                            <span className="text-gray-500">FC:</span> {ev.frequenciaCardiaca} bpm
                          </div>
                        )}
                        {ev.temperatura && (
                          <div className="text-sm">
                            <span className="text-gray-500">Temp:</span> {ev.temperatura}°C
                          </div>
                        )}
                        {ev.peso && (
                          <div className="text-sm">
                            <span className="text-gray-500">Peso:</span> {ev.peso} kg
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* SOAP */}
                    {ev.subjetivo && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">S</span>
                          Subjetivo
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.subjetivo}</p>
                      </div>
                    )}
                    
                    {ev.objetivo && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
                          Objetivo
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.objetivo}</p>
                      </div>
                    )}
                    
                    {ev.avaliacao && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
                          Avaliação
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.avaliacao}</p>
                      </div>
                    )}
                    
                    {ev.plano && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
                          Plano
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.plano}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de upload */}
      <DocumentoUpload
        pacienteId={pacienteId}
        categoria="Evolução"
        registroId={evolucaoIdParaUpload || undefined}
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setEvolucaoIdParaUpload(null);
        }}
        onSuccess={() => {
          onUpdate();
        }}
      />
    </div>
  );
}
