import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, FileText, Calendar, User, ChevronDown, ChevronUp, Upload, Link2, FileOutput, Pill, FileCheck, Scissors, ClipboardList, File, Save, Clock, PenLine, CheckCircle, Lock, Pencil, AlertTriangle } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  evolucoes: any[];
  onUpdate: () => void;
  // Novos parâmetros para abrir automaticamente o formulário
  abrirNovaEvolucao?: boolean;
  agendamentoIdVinculado?: number | null;
  onEvolucaoCriada?: () => void;
  // Callback para redirecionar após encerrar atendimento
  onAtendimentoEncerrado?: () => void;
}

export default function ProntuarioEvolucoes({ 
  pacienteId, 
  evolucoes, 
  onUpdate,
  abrirNovaEvolucao = false,
  agendamentoIdVinculado = null,
  onEvolucaoCriada,
  onAtendimentoEncerrado
}: Props) {
  
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [evolucaoIdParaUpload, setEvolucaoIdParaUpload] = useState<number | null>(null);
  const [agendamentoId, setAgendamentoId] = useState<number | null>(agendamentoIdVinculado);
  
  // Estado para modal de confirmação de assinatura
  const [modalAssinarAberto, setModalAssinarAberto] = useState(false);
  const [evolucaoParaAssinar, setEvolucaoParaAssinar] = useState<any | null>(null);
  
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
  
  // Mutation para assinar evolução existente
  const assinarEvolucao = trpc.prontuario.evolucoes.assinar.useMutation({
    onSuccess: () => {
      toast.success("Evolução assinada com sucesso!");
      setModalAssinarAberto(false);
      setEvolucaoParaAssinar(null);
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao assinar evolução: " + error.message);
    },
  });

  // Estado para rastrear se o atendimento foi encerrado
  const [atendimentoFoiEncerrado, setAtendimentoFoiEncerrado] = useState(false);
  
  const createEvolucao = trpc.prontuario.evolucoes.create.useMutation({
    onSuccess: (_, variables) => {
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
      // Se o atendimento foi encerrado, redirecionar para a agenda
      if (variables.atendimentoEncerrado && onAtendimentoEncerrado) {
        toast.success("Atendimento encerrado. Redirecionando para a agenda...");
        setTimeout(() => {
          onAtendimentoEncerrado();
        }, 1000);
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

  // Função base para criar evolução com diferentes status
  const criarEvolucaoComStatus = (statusAssinatura: "rascunho" | "pendente_assinatura" | "assinado", encerrarAtendimento: boolean = false) => {
    createEvolucao.mutate({
      pacienteId,
      agendamentoId: agendamentoId,
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
      statusAssinatura,
      assinado: statusAssinatura === "assinado",
      atendimentoEncerrado: encerrarAtendimento,
    });
  };

  // Salvar Evolução (rascunho)
  const handleSalvarEvolucao = () => {
    criarEvolucaoComStatus("rascunho");
  };

  // Salvar e deixar pendente de assinatura
  const handleSalvarPendenteAssinatura = () => {
    criarEvolucaoComStatus("pendente_assinatura");
  };

  // Assinar evolução
  const handleAssinarEvolucao = () => {
    criarEvolucaoComStatus("assinado");
  };

  // Assinar evolução e encerrar atendimento
  const handleAssinarEEncerrar = () => {
    criarEvolucaoComStatus("assinado", true);
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

  // Tipos de documentos disponíveis - estrutura hierárquica
  const tiposDocumento = [
    { 
      id: "receita", 
      label: "Receita", 
      icon: Pill,
      submenu: [
        { id: "receita_simples", label: "Receita Simples" },
        { id: "receita_especial", label: "Receita Especial (Controlada)" },
      ]
    },
    { id: "pedido_exames", label: "Pedido de Exames", icon: ClipboardList },
    { 
      id: "atestado", 
      label: "Atestado", 
      icon: FileCheck,
      submenu: [
        { id: "atestado_comparecimento", label: "Atestado de Comparecimento" },
        { id: "atestado_afastamento", label: "Atestado de Afastamento" },
      ]
    },
    { id: "encaminhamento", label: "Encaminhamento", icon: FileOutput },
    { id: "protocolo_cirurgia", label: "Protocolo para Cirurgia/Procedimento", icon: Scissors },
    { 
      id: "outros", 
      label: "Outros Documentos", 
      icon: File,
      submenu: [
        { id: "lme", label: "LME (Laudo de Medicamento Especial)" },
        { id: "laudo_inss", label: "Laudo INSS" },
        { id: "documento_geral", label: "Documento Geral" },
      ]
    },
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
          <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
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
                        doc.submenu ? (
                          <div key={doc.id} className="relative group">
                            <DropdownMenuItem 
                              className="cursor-pointer flex items-center justify-between"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center">
                                <doc.icon className="h-4 w-4 mr-2" />
                                {doc.label}
                              </div>
                              <ChevronDown className="h-3 w-3 ml-2" />
                            </DropdownMenuItem>
                            <div className="pl-6 border-l-2 border-gray-200 ml-2">
                              {doc.submenu.map((sub) => (
                                <DropdownMenuItem 
                                  key={sub.id}
                                  onClick={() => handleEmitirDocumento(sub.label)}
                                  className="cursor-pointer text-sm"
                                >
                                  {sub.label}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <DropdownMenuItem 
                            key={doc.id}
                            onClick={() => handleEmitirDocumento(doc.label)}
                            className="cursor-pointer"
                          >
                            <doc.icon className="h-4 w-4 mr-2" />
                            {doc.label}
                          </DropdownMenuItem>
                        )
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
                    <NumberInput
                      decimals={0}
                      value={form.frequenciaCardiaca}
                      onChange={(value) => setForm({ ...form, frequenciaCardiaca: value?.toString() || "" })}
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
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleFecharModal}>Cancelar</Button>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button 
                  variant="outline"
                  onClick={handleSalvarEvolucao}
                  disabled={createEvolucao.isPending}
                  title="Salva a evolução como rascunho para edição posterior"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Evolução
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSalvarPendenteAssinatura}
                  disabled={createEvolucao.isPending}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  title="Salva e marca como pendente de assinatura"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pendente de Assinatura
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleAssinarEvolucao}
                  disabled={createEvolucao.isPending}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  title="Assina digitalmente a evolução"
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Assinar Evolução
                </Button>
                <Button 
                  onClick={handleAssinarEEncerrar}
                  disabled={createEvolucao.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  title="Assina a evolução e encerra o atendimento"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assinar e Encerrar
                </Button>
              </div>
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
                        {/* Badge de Status de Assinatura */}
                        {ev.statusAssinatura === 'assinado' || ev.assinado ? (
                          <Badge 
                            className="bg-green-500 hover:bg-green-600"
                            title={ev.assinadoPorNome && ev.dataAssinatura 
                              ? `Assinada por ${ev.assinadoPorNome} em ${formatarData(ev.dataAssinatura)}`
                              : 'Evolução assinada digitalmente'
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Assinada
                          </Badge>
                        ) : ev.statusAssinatura === 'pendente_assinatura' ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                            <Save className="h-3 w-3 mr-1" />
                            Rascunho
                          </Badge>
                        )}
                        {/* Indicador de Atendimento Encerrado */}
                        {ev.atendimentoEncerrado && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            Atendimento Encerrado
                          </Badge>
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
                    
                    {/* Informações de Assinatura */}
                    {(ev.statusAssinatura === 'assinado' || ev.assinado) && ev.assinadoPorNome && (
                      <div className="pt-2 border-t">
                        <Label className="mb-2 block">Assinatura Digital</Label>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Assinada digitalmente por <strong>{ev.assinadoPorNome}</strong></span>
                          </div>
                          {ev.dataAssinatura && (
                            <div className="text-xs text-green-600 mt-1 ml-6">
                              em {formatarData(ev.dataAssinatura)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Ações da Evolução */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <Label>Ações</Label>
                          <div className="flex gap-2">
                            {/* Botão Editar - bloqueado se assinada */}
                            {(ev.statusAssinatura === 'assinado' || ev.assinado) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                title="Evoluções assinadas não podem ser editadas para manter a integridade do registro médico"
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                Bloqueada
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implementar modal de edição
                                  toast.info('Funcionalidade de edição em desenvolvimento');
                                }}
                                title="Editar esta evolução"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            )}
                            {/* Botão Assinar - apenas se não assinada */}
                            {!(ev.statusAssinatura === 'assinado' || ev.assinado) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEvolucaoParaAssinar(ev);
                                  setModalAssinarAberto(true);
                                }}
                                title="Assinar esta evolução digitalmente"
                              >
                                <PenLine className="h-3 w-3 mr-1" />
                                Assinar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    
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
      
      {/* Modal de Confirmação de Assinatura Digital */}
      <AlertDialog open={modalAssinarAberto} onOpenChange={setModalAssinarAberto}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Assinatura Digital
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-amber-600 font-medium">
                  Atenção: Após assinada, esta evolução não poderá mais ser editada.
                </p>
                
                {evolucaoParaAssinar && (
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Data:</span>
                      <span>{formatarData(evolucaoParaAssinar.dataEvolucao)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{evolucaoParaAssinar.tipo}</Badge>
                      {evolucaoParaAssinar.statusAssinatura === 'pendente_assinatura' ? (
                        <Badge className="bg-amber-500">Pendente</Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                    </div>
                    
                    {/* Preview do conteúdo SOAP */}
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      {evolucaoParaAssinar.subjetivo && (
                        <div className="text-sm">
                          <span className="bg-blue-100 text-[#0056A4] px-1.5 py-0.5 rounded text-xs font-bold mr-2">S</span>
                          <span className="text-gray-600 line-clamp-2">{evolucaoParaAssinar.subjetivo}</span>
                        </div>
                      )}
                      {evolucaoParaAssinar.objetivo && (
                        <div className="text-sm">
                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-bold mr-2">O</span>
                          <span className="text-gray-600 line-clamp-2">{evolucaoParaAssinar.objetivo}</span>
                        </div>
                      )}
                      {evolucaoParaAssinar.avaliacao && (
                        <div className="text-sm">
                          <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-bold mr-2">A</span>
                          <span className="text-gray-600 line-clamp-2">{evolucaoParaAssinar.avaliacao}</span>
                        </div>
                      )}
                      {evolucaoParaAssinar.plano && (
                        <div className="text-sm">
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-bold mr-2">P</span>
                          <span className="text-gray-600 line-clamp-2">{evolucaoParaAssinar.plano}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Ao assinar, você confirma que revisou o conteúdo e que as informações estão corretas.
                  A assinatura digital registrará seu nome e a data/hora da assinatura.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setModalAssinarAberto(false);
                setEvolucaoParaAssinar(null);
              }}
              className="sm:mr-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (evolucaoParaAssinar) {
                    assinarEvolucao.mutate({ 
                      id: evolucaoParaAssinar.id,
                      encerrarAtendimento: false 
                    });
                  }
                }}
                disabled={assinarEvolucao.isPending}
                className="border-green-300 text-green-700 hover:bg-green-50"
                title="Assina a evolução mas mantém o atendimento aberto"
              >
                {assinarEvolucao.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <PenLine className="h-4 w-4 mr-2" />
                    Apenas Assinar
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  if (evolucaoParaAssinar) {
                    assinarEvolucao.mutate({ 
                      id: evolucaoParaAssinar.id,
                      encerrarAtendimento: true 
                    });
                  }
                }}
                disabled={assinarEvolucao.isPending}
                className="bg-green-600 hover:bg-green-700"
                title="Assina a evolução e encerra o atendimento"
              >
                {assinarEvolucao.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assinar e Encerrar
                  </>
                )}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
