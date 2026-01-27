import { useState, useEffect } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, FileText, Calendar, User, ChevronDown, ChevronUp, Upload, Link2, FileOutput, Pill, FileCheck, Scissors, ClipboardList, File } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  evolucoes: any[];
  onUpdate: () => void;
  // Novos parâmetros para abrir automaticamente o formulário
  abrirNovaEvolucao?: boolean;
  agendamentoIdVinculado?: number | null;
  onEvolucaoCriada?: () => void;
}

export default function ProntuarioEvolucoes({ 
  pacienteId, 
  evolucoes, 
  onUpdate,
  abrirNovaEvolucao = false,
  agendamentoIdVinculado = null,
  onEvolucaoCriada
}: Props) {
  
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [evolucaoIdParaUpload, setEvolucaoIdParaUpload] = useState<number | null>(null);
  const [agendamentoId, setAgendamentoId] = useState<number | null>(agendamentoIdVinculado);
  
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

  // Buscar textos padrão do usuário
  const { data: textosPadrao } = trpc.prontuario.evolucoes.getTextosPadrao.useQuery();
  
  // Buscar dados do agendamento vinculado para pré-preencher a data
  const { data: agendamentoVinculado } = trpc.agenda.getById.useQuery(
    { id: agendamentoIdVinculado! },
    { enabled: !!agendamentoIdVinculado }
  );
  
  // Efeito para abrir automaticamente o formulário quando solicitado via parâmetros
  useEffect(() => {
    if (abrirNovaEvolucao) {
      setNovaEvolucao(true);
      if (agendamentoIdVinculado) {
        setAgendamentoId(agendamentoIdVinculado);
        toast.info("Evolução vinculada ao agendamento. Data pré-preenchida automaticamente.");
      }
    }
  }, [abrirNovaEvolucao, agendamentoIdVinculado]);
  
  // Efeito para pré-preencher a data quando o agendamento é carregado
  useEffect(() => {
    if (agendamentoVinculado && agendamentoIdVinculado) {
      // Formatar a data do agendamento para datetime-local
      const dataAgendamento = new Date(agendamentoVinculado.dataHoraInicio);
      const dataFormatada = dataAgendamento.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      setForm(prev => ({
        ...prev,
        dataEvolucao: dataFormatada,
        tipo: agendamentoVinculado.tipoCompromisso === "Consulta" ? "Consulta" : "Consulta"
      }));
    }
  }, [agendamentoVinculado, agendamentoIdVinculado]);
  
  const createEvolucao = trpc.prontuario.evolucoes.create.useMutation({
    onSuccess: () => {
      toast.success("Evolução registrada com sucesso!");
      setNovaEvolucao(false);
      setAgendamentoId(null);
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
      // Callback para notificar que a evolução foi criada (útil para atualizar status do agendamento)
      if (onEvolucaoCriada) {
        onEvolucaoCriada();
      }
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

  const handleSalvarEvolucao = () => {
    createEvolucao.mutate({
      pacienteId,
      agendamentoId: agendamentoId, // Vínculo com agendamento
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
    });
  };

  const handleFecharModal = () => {
    setNovaEvolucao(false);
    setAgendamentoId(null);
  };

  // Função para inserir texto padrão em um campo
  const inserirTextoPadrao = (campo: "subjetivo" | "objetivo" | "avaliacao" | "plano") => {
    if (!textosPadrao) {
      toast.error("Textos padrão não configurados. Acesse Configurações > Textos Padrão.");
      return;
    }

    const mapeamento = {
      subjetivo: textosPadrao.subjetivoPadrao,
      objetivo: textosPadrao.objetivoPadrao,
      avaliacao: textosPadrao.avaliacaoPadrao,
      plano: textosPadrao.planoPadrao,
    };

    const textoPadrao = mapeamento[campo];
    if (textoPadrao) {
      // Se já houver conteúdo, adiciona no final com uma linha em branco
      const valorAtual = form[campo];
      const novoValor = valorAtual 
        ? valorAtual + "\n\n" + textoPadrao 
        : textoPadrao;
      setForm({ ...form, [campo]: novoValor });
      toast.success("Texto padrão inserido!");
    } else {
      toast.info("Nenhum texto padrão definido para este campo.");
    }
  };

  // Função para emitir documento
  const handleEmitirDocumento = (tipo: string) => {
    // Por enquanto, apenas mostra um toast - a implementação completa virá depois
    toast.info(`Emitir ${tipo} - Funcionalidade em desenvolvimento`);
    // TODO: Abrir modal de emissão de documento do tipo selecionado
  };

  // Tipos de documentos disponíveis
  const tiposDocumento = [
    { id: "receita", label: "Receita Médica", icon: Pill },
    { id: "atestado", label: "Atestado Médico", icon: FileCheck },
    { id: "solicitacao_exames", label: "Solicitação de Exames", icon: ClipboardList },
    { id: "cirurgia", label: "Solicitação de Cirurgia", icon: Scissors },
    { id: "procedimentos", label: "Solicitação de Procedimentos", icon: FileOutput },
    { id: "geral", label: "Documento Geral", icon: File },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Evoluções</h2>
          <p className="text-sm text-gray-500">Registro de consultas e atendimentos (SOAP)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEvolucaoIdParaUpload(null); setModalUploadAberto(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload de Documento
          </Button>
          <Dialog open={novaEvolucao} onOpenChange={(open) => {
            if (!open) handleFecharModal();
            else setNovaEvolucao(true);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Evolução
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Nova Evolução
                {agendamentoId && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Link2 className="h-3 w-3 mr-1" />
                    Vinculada ao Agendamento #{agendamentoId}
                  </Badge>
                )}
              </DialogTitle>
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
                
                {/* Campo Subjetivo com botão Inserir Padrão */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2">
                      <span className="bg-blue-100 text-[#0056A4] px-2 py-0.5 rounded text-xs font-bold">S</span>
                      Subjetivo (Queixa / História)
                    </Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => inserirTextoPadrao("subjetivo")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Inserir Padrão
                    </Button>
                  </div>
                  <Textarea
                    rows={4}
                    value={form.subjetivo}
                    onChange={(e) => setForm({ ...form, subjetivo: e.target.value })}
                    placeholder="Queixa principal, história da doença atual, sintomas relatados pelo paciente..."
                  />
                </div>
                
                {/* Campo Objetivo com botão Inserir Padrão */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
                      Objetivo (Exame Físico)
                    </Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                      onClick={() => inserirTextoPadrao("objetivo")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Inserir Padrão
                    </Button>
                  </div>
                  <Textarea
                    rows={4}
                    value={form.objetivo}
                    onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                    placeholder="Achados do exame físico, sinais vitais, resultados de exames..."
                  />
                </div>
                
                {/* Campo Avaliação com botão Inserir Padrão */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
                      Avaliação (Diagnóstico)
                    </Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                      onClick={() => inserirTextoPadrao("avaliacao")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Inserir Padrão
                    </Button>
                  </div>
                  <Textarea
                    rows={3}
                    value={form.avaliacao}
                    onChange={(e) => setForm({ ...form, avaliacao: e.target.value })}
                    placeholder="Hipóteses diagnósticas, diagnóstico diferencial..."
                  />
                </div>
                
                {/* Campo Plano com botão Inserir Padrão */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
                      Plano (Conduta)
                    </Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                      onClick={() => inserirTextoPadrao("plano")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Inserir Padrão
                    </Button>
                  </div>
                  <Textarea
                    rows={4}
                    value={form.plano}
                    onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    placeholder="Prescrições, exames solicitados, encaminhamentos, orientações..."
                  />
                </div>

                {/* Dropdown Emitir Documento */}
                <div className="pt-4 border-t border-dashed">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <FileOutput className="h-4 w-4" />
                          Emitir Documento
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[300px]">
                      {tiposDocumento.map((doc) => (
                        <DropdownMenuItem 
                          key={doc.id}
                          onClick={() => handleEmitirDocumento(doc.label)}
                          className="cursor-pointer"
                        >
                          <doc.icon className="h-4 w-4 mr-2" />
                          {doc.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <Button variant="outline" onClick={handleFecharModal}>Cancelar</Button>
              <Button 
                onClick={handleSalvarEvolucao}
                disabled={createEvolucao.isPending}
              >
                {createEvolucao.isPending ? "Salvando..." : "Salvar Evolução"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
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
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{formatarData(ev.dataEvolucao)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{ev.tipo}</Badge>
                        {ev.agendamentoId && (
                          <Badge variant="secondary" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            Agendamento #{ev.agendamentoId}
                          </Badge>
                        )}
                        {ev.assinado && (
                          <Badge variant="default" className="bg-green-500">Assinado</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.profissionalNome && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        {ev.profissionalNome}
                      </div>
                    )}
                    {expandido === ev.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandido === ev.id && (
                <CardContent className="border-t bg-gray-50">
                  <div className="space-y-4 py-4">
                    {ev.subjetivo && (
                      <div>
                        <Label className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-100 text-[#0056A4] px-2 py-0.5 rounded text-xs font-bold">S</span>
                          Subjetivo
                        </Label>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.subjetivo}</p>
                      </div>
                    )}
                    
                    {ev.objetivo && (
                      <div>
                        <Label className="flex items-center gap-2 mb-1">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
                          Objetivo
                        </Label>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.objetivo}</p>
                      </div>
                    )}
                    
                    {ev.avaliacao && (
                      <div>
                        <Label className="flex items-center gap-2 mb-1">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
                          Avaliação
                        </Label>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.avaliacao}</p>
                      </div>
                    )}
                    
                    {ev.plano && (
                      <div>
                        <Label className="flex items-center gap-2 mb-1">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
                          Plano
                        </Label>
                        <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{ev.plano}</p>
                      </div>
                    )}
                    
                    {/* Sinais Vitais */}
                    {(ev.pressaoArterial || ev.frequenciaCardiaca || ev.temperatura || ev.peso || ev.altura) && (
                      <div className="pt-2 border-t">
                        <Label className="mb-2 block">Sinais Vitais</Label>
                        <div className="grid grid-cols-5 gap-4 text-sm">
                          {ev.pressaoArterial && (
                            <div className="bg-white p-2 rounded border text-center">
                              <div className="text-gray-500 text-xs">PA</div>
                              <div className="font-medium">{ev.pressaoArterial}</div>
                            </div>
                          )}
                          {ev.frequenciaCardiaca && (
                            <div className="bg-white p-2 rounded border text-center">
                              <div className="text-gray-500 text-xs">FC</div>
                              <div className="font-medium">{ev.frequenciaCardiaca} bpm</div>
                            </div>
                          )}
                          {ev.temperatura && (
                            <div className="bg-white p-2 rounded border text-center">
                              <div className="text-gray-500 text-xs">Temp</div>
                              <div className="font-medium">{ev.temperatura}°C</div>
                            </div>
                          )}
                          {ev.peso && (
                            <div className="bg-white p-2 rounded border text-center">
                              <div className="text-gray-500 text-xs">Peso</div>
                              <div className="font-medium">{ev.peso} kg</div>
                            </div>
                          )}
                          {ev.altura && (
                            <div className="bg-white p-2 rounded border text-center">
                              <div className="text-gray-500 text-xs">Altura</div>
                              <div className="font-medium">{ev.altura} m</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Documentos anexados */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Documentos Anexados</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEvolucaoIdParaUpload(ev.id);
                            setModalUploadAberto(true);
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Anexar
                        </Button>
                      </div>
                      <DocumentosList 
                        pacienteId={pacienteId} 
                        evolucaoId={ev.id}
                        compact
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de Upload de Documento */}
      <Dialog open={modalUploadAberto} onOpenChange={setModalUploadAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>
          <DocumentoUpload 
            pacienteId={pacienteId}
            evolucaoId={evolucaoIdParaUpload}
            onSuccess={() => {
              setModalUploadAberto(false);
              onUpdate();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
