import { useState, useEffect, useCallback, useRef } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Plus, FileText, Calendar, User, ChevronDown, ChevronUp, Upload, Link2, FileOutput, Pill, FileCheck, Scissors, ClipboardList, File, Save, Clock, PenLine, CheckCircle, Lock, Pencil, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";
import { useLocation } from "wouter";

interface PacienteInfo {
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | Date | null;
  idPaciente?: string | null;
}

interface Props {
  pacienteId: number;
  evolucoes: any[];
  onUpdate: () => void;
  abrirNovaEvolucao?: boolean;
  agendamentoIdVinculado?: number | null;
  onEvolucaoCriada?: () => void;
  onAtendimentoEncerrado?: () => void;
  paciente?: PacienteInfo;
}

export default function ProntuarioEvolucoes({ 
  pacienteId, 
  evolucoes, 
  onUpdate,
  abrirNovaEvolucao = false,
  agendamentoIdVinculado = null,
  onEvolucaoCriada,
  onAtendimentoEncerrado,
  paciente
}: Props) {
  const [, setLocation] = useLocation();
  
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [evolucaoIdParaUpload, setEvolucaoIdParaUpload] = useState<number | null>(null);
  const [agendamentoId, setAgendamentoId] = useState<number | null>(agendamentoIdVinculado);
  const [activeTab, setActiveTab] = useState<"soap" | "livre">("soap");
  
  // Timer de consulta
  const [tempoConsulta, setTempoConsulta] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para modal de confirmação de assinatura
  const [modalAssinarAberto, setModalAssinarAberto] = useState(false);
  const [evolucaoParaAssinar, setEvolucaoParaAssinar] = useState<any | null>(null);
  
  // Estado para upload de documentos no modal
  const [arquivosParaUpload, setArquivosParaUpload] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [form, setForm] = useState({
    dataEvolucao: new Date().toISOString().split("T")[0],
    tipo: "Consulta" as "Consulta" | "Retorno" | "Urgência" | "Teleconsulta" | "Parecer",
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
    textoLivre: "",
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
  
  // Buscar histórico de evoluções para o painel lateral
  const ultimasEvolucoes = evolucoes.slice(0, 5);
  
  // Timer de consulta
  useEffect(() => {
    if (novaEvolucao) {
      setTempoConsulta(0);
      timerRef.current = setInterval(() => {
        setTempoConsulta(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [novaEvolucao]);
  
  // Formatar tempo do timer
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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
      const dataAgendamento = new Date(agendamentoVinculado.dataHoraInicio);
      const dataFormatada = dataAgendamento.toISOString().slice(0, 16);
      setForm(prev => ({
        ...prev,
        dataEvolucao: dataFormatada,
        tipo: agendamentoVinculado.tipoCompromisso === "Consulta" ? "Consulta" : "Consulta"
      }));
    }
  }, [agendamentoVinculado, agendamentoIdVinculado]);
  
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!novaEvolucao) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSalvarEvolucao();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleAssinarEEncerrar();
        } else if (e.key === '1') {
          e.preventDefault();
          document.getElementById('campo-subjetivo')?.focus();
        } else if (e.key === '2') {
          e.preventDefault();
          document.getElementById('campo-objetivo')?.focus();
        } else if (e.key === '3') {
          e.preventDefault();
          document.getElementById('campo-avaliacao')?.focus();
        } else if (e.key === '4') {
          e.preventDefault();
          document.getElementById('campo-plano')?.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [novaEvolucao]);
  
  // Mutation para assinar evolução existente
  const assinarEvolucao = trpc.prontuario.evolucoes.assinar.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Evolução assinada com sucesso!");
      setModalAssinarAberto(false);
      setEvolucaoParaAssinar(null);
      onUpdate();
      if (variables.encerrarAtendimento && onAtendimentoEncerrado) {
        toast.success("Atendimento encerrado. Redirecionando para a agenda...");
        setTimeout(() => {
          onAtendimentoEncerrado();
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error("Erro ao assinar evolução: " + error.message);
    },
  });

  const [atendimentoFoiEncerrado, setAtendimentoFoiEncerrado] = useState(false);
  
  const createEvolucao = trpc.prontuario.evolucoes.create.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Evolução registrada com sucesso!");
      setNovaEvolucao(false);
      setAgendamentoId(null);
      setArquivosParaUpload([]);
      setForm({
        dataEvolucao: new Date().toISOString().split("T")[0],
        tipo: "Consulta",
        subjetivo: "",
        objetivo: "",
        avaliacao: "",
        plano: "",
        textoLivre: "",
        pressaoArterial: "",
        frequenciaCardiaca: "",
        temperatura: "",
        peso: "",
        altura: "",
      });
      onUpdate();
      if (onEvolucaoCriada) {
        onEvolucaoCriada();
      }
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
  
  const formatarDataCurta = (data: string | Date) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };
  
  const calcularIdade = (dataNascimento: string | Date | null | undefined) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // Função base para criar evolução com diferentes status
  const criarEvolucaoComStatus = (statusAssinatura: "rascunho" | "pendente_assinatura" | "assinado", encerrarAtendimento: boolean = false) => {
    // Se estiver na aba texto livre, usar o conteúdo de textoLivre
    const conteudo = activeTab === "livre" 
      ? { subjetivo: form.textoLivre, objetivo: null, avaliacao: null, plano: null }
      : { subjetivo: form.subjetivo || null, objetivo: form.objetivo || null, avaliacao: form.avaliacao || null, plano: form.plano || null };
    
    createEvolucao.mutate({
      pacienteId,
      agendamentoId: agendamentoId,
      dataEvolucao: new Date(form.dataEvolucao),
      tipo: form.tipo,
      ...conteudo,
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

  const handleSalvarEvolucao = () => {
    criarEvolucaoComStatus("rascunho");
  };

  const handleSalvarPendenteAssinatura = () => {
    criarEvolucaoComStatus("pendente_assinatura");
  };

  const handleAssinarEvolucao = () => {
    criarEvolucaoComStatus("assinado");
  };

  const handleAssinarEEncerrar = () => {
    criarEvolucaoComStatus("assinado", true);
  };

  const handleFecharModal = () => {
    setNovaEvolucao(false);
    setAgendamentoId(null);
    setArquivosParaUpload([]);
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
  
  // Copiar da última consulta
  const copiarDaUltimaConsulta = () => {
    if (ultimasEvolucoes.length === 0) {
      toast.info("Nenhuma evolução anterior encontrada.");
      return;
    }
    const ultima = ultimasEvolucoes[0];
    setForm(prev => ({
      ...prev,
      subjetivo: ultima.subjetivo || "",
      objetivo: ultima.objetivo || "",
      avaliacao: ultima.avaliacao || "",
      plano: ultima.plano || "",
    }));
    toast.success("Conteúdo da última consulta copiado!");
  };

  // Função para emitir documento
  const handleEmitirDocumento = (tipo: string) => {
    toast.info(`Emitir ${tipo} - Funcionalidade em desenvolvimento`);
  };
  
  // Handlers de drag and drop para upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setArquivosParaUpload(prev => [...prev, ...files]);
    toast.success(`${files.length} arquivo(s) adicionado(s)`);
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setArquivosParaUpload(prev => [...prev, ...files]);
      toast.success(`${files.length} arquivo(s) adicionado(s)`);
    }
  };
  
  const removerArquivo = (index: number) => {
    setArquivosParaUpload(prev => prev.filter((_, i) => i !== index));
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
              <Button className="bg-[#6B8CBE] hover:bg-[#5A7BAD]">
                <Plus className="h-4 w-4 mr-2" />
                Nova Evolução
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[98vw] w-[1600px] max-h-[95vh] overflow-hidden p-0">
            {/* Cabeçalho do Paciente */}
            <div className="bg-[#F5F7FA] border-b border-[#D1DBEA] px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#6B8CBE]" />
                    <span className="font-semibold text-lg text-gray-800">{paciente?.nome || "Paciente"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><strong>CPF:</strong> {paciente?.cpf || "-"}</span>
                    <span><strong>Nasc:</strong> {paciente?.dataNascimento ? formatarDataCurta(paciente.dataNascimento) : "-"}</span>
                    {paciente?.dataNascimento && (
                      <span className="text-gray-500">({calcularIdade(paciente.dataNascimento)} anos)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Timer discreto */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatarTempo(tempoConsulta)}</span>
                  </div>
                  {/* Ícone prontuário */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#6B8CBE] hover:bg-[#6B8CBE]/10"
                          onClick={() => setLocation(`/pacientes/${pacienteId}/prontuario`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir Prontuário Completo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {agendamentoId && (
                    <Badge variant="outline" className="text-xs border-[#6B8CBE] text-[#6B8CBE]">
                      <Link2 className="h-3 w-3 mr-1" />
                      Agendamento #{agendamentoId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conteúdo Principal - 3 colunas */}
            <div className="flex h-[calc(95vh-180px)] overflow-hidden">
              {/* Coluna 1: Formulário Principal */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-[#E8EDF5]">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "soap" | "livre")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#E8EDF5]">
                    <TabsTrigger value="soap" className="data-[state=active]:bg-[#6B8CBE] data-[state=active]:text-white">SOAP</TabsTrigger>
                    <TabsTrigger value="livre" className="data-[state=active]:bg-[#6B8CBE] data-[state=active]:text-white">Texto Livre</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="soap" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data/Hora</Label>
                        <Input
                          type="datetime-local"
                          value={form.dataEvolucao}
                          onChange={(e) => setForm({ ...form, dataEvolucao: e.target.value })}
                          className="border-[#D1DBEA]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label>Tipo de Atendimento</Label>
                          <Select
                            value={form.tipo}
                            onValueChange={(v) => setForm({ ...form, tipo: v as any })}
                          >
                            <SelectTrigger className="border-[#D1DBEA]">
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
                        <div className="flex items-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={copiarDaUltimaConsulta}
                                  className="border-[#D1DBEA] text-gray-500 hover:text-[#6B8CBE]"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar da última consulta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    
                    {/* Campo Subjetivo */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="flex items-center gap-2">
                          <span className="bg-[#E8EDF5] text-[#4A6A9A] px-2 py-0.5 rounded text-xs font-bold">S</span>
                          Subjetivo (Queixa / História)
                          <span className="text-[9px] text-gray-300 ml-2">Ctrl+1</span>
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => inserirTextoPadrao("subjetivo")}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Inserir Padrão
                        </Button>
                      </div>
                      <Textarea
                        id="campo-subjetivo"
                        rows={3}
                        value={form.subjetivo}
                        onChange={(e) => setForm({ ...form, subjetivo: e.target.value })}
                        placeholder="Queixa principal, história da doença atual..."
                        className="border-[#D1DBEA] focus:border-[#6B8CBE]"
                      />
                    </div>
                    
                    {/* Campo Objetivo */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
                          Objetivo (Exame Físico)
                          <span className="text-[9px] text-gray-300 ml-2">Ctrl+2</span>
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => inserirTextoPadrao("objetivo")}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Inserir Padrão
                        </Button>
                      </div>
                      <Textarea
                        id="campo-objetivo"
                        rows={3}
                        value={form.objetivo}
                        onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                        placeholder="Achados do exame físico, sinais vitais..."
                        className="border-[#D1DBEA] focus:border-[#6B8CBE]"
                      />
                    </div>
                    
                    {/* Campo Avaliação */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
                          Avaliação (Diagnóstico)
                          <span className="text-[9px] text-gray-300 ml-2">Ctrl+3</span>
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => inserirTextoPadrao("avaliacao")}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Inserir Padrão
                        </Button>
                      </div>
                      <Textarea
                        id="campo-avaliacao"
                        rows={2}
                        value={form.avaliacao}
                        onChange={(e) => setForm({ ...form, avaliacao: e.target.value })}
                        placeholder="Hipóteses diagnósticas..."
                        className="border-[#D1DBEA] focus:border-[#6B8CBE]"
                      />
                    </div>
                    
                    {/* Campo Plano */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
                          Plano (Conduta)
                          <span className="text-[9px] text-gray-300 ml-2">Ctrl+4</span>
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => inserirTextoPadrao("plano")}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Inserir Padrão
                        </Button>
                      </div>
                      <Textarea
                        id="campo-plano"
                        rows={3}
                        value={form.plano}
                        onChange={(e) => setForm({ ...form, plano: e.target.value })}
                        placeholder="Prescrições, exames solicitados, orientações..."
                        className="border-[#D1DBEA] focus:border-[#6B8CBE]"
                      />
                    </div>

                    {/* Dropdown Emitir Documento */}
                    <div className="pt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between border-[#D1DBEA]">
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
                  
                  <TabsContent value="livre" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data/Hora</Label>
                        <Input
                          type="datetime-local"
                          value={form.dataEvolucao}
                          onChange={(e) => setForm({ ...form, dataEvolucao: e.target.value })}
                          className="border-[#D1DBEA]"
                        />
                      </div>
                      <div>
                        <Label>Tipo de Atendimento</Label>
                        <Select
                          value={form.tipo}
                          onValueChange={(v) => setForm({ ...form, tipo: v as any })}
                        >
                          <SelectTrigger className="border-[#D1DBEA]">
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
                      <Label className="mb-2 block">Evolução</Label>
                      <Textarea
                        rows={16}
                        value={form.textoLivre}
                        onChange={(e) => setForm({ ...form, textoLivre: e.target.value })}
                        placeholder="Digite a evolução do atendimento de forma livre, sem divisões em SOAP..."
                        className="border-[#D1DBEA] focus:border-[#6B8CBE] min-h-[400px]"
                      />
                    </div>
                    
                    {/* Dropdown Emitir Documento */}
                    <div className="pt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between border-[#D1DBEA]">
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
                </Tabs>
              </div>
              
              {/* Coluna 2: Upload de Documentos */}
              <div className="w-[280px] p-4 border-r border-[#E8EDF5] bg-[#FAFBFC] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Documentos</h3>
                
                {/* Área de Drop */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging 
                      ? 'border-[#6B8CBE] bg-[#6B8CBE]/10' 
                      : 'border-[#D1DBEA] hover:border-[#6B8CBE]/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-2">Arraste arquivos aqui</p>
                  <label className="cursor-pointer">
                    <span className="text-xs text-[#6B8CBE] hover:underline">ou clique para selecionar</span>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                
                {/* Lista de arquivos */}
                {arquivosParaUpload.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-600">{arquivosParaUpload.length} arquivo(s)</p>
                    {arquivosParaUpload.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-[#E8EDF5]">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate flex-1">{file.name}</span>
                        <button 
                          onClick={() => removerArquivo(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Coluna 3: Histórico Rápido */}
              <div className="w-[280px] p-4 bg-[#FAFBFC] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico Recente</h3>
                
                {ultimasEvolucoes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhuma evolução anterior</p>
                ) : (
                  <div className="space-y-2">
                    {ultimasEvolucoes.map((ev, index) => (
                      <TooltipProvider key={ev.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              index === 0 
                                ? 'bg-[#6B8CBE]/10 border-[#6B8CBE]/30' 
                                : 'bg-white border-[#E8EDF5] hover:border-[#6B8CBE]/30'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">{formatarDataCurta(ev.dataEvolucao)}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ev.tipo}</Badge>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {ev.subjetivo || ev.avaliacao || "Sem descrição"}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[300px]">
                            <div className="space-y-2">
                              <p className="font-semibold">{formatarData(ev.dataEvolucao)}</p>
                              {ev.subjetivo && <p className="text-xs"><strong>S:</strong> {ev.subjetivo.substring(0, 150)}...</p>}
                              {ev.objetivo && <p className="text-xs"><strong>O:</strong> {ev.objetivo.substring(0, 150)}...</p>}
                              {ev.avaliacao && <p className="text-xs"><strong>A:</strong> {ev.avaliacao.substring(0, 150)}...</p>}
                              {ev.plano && <p className="text-xs"><strong>P:</strong> {ev.plano.substring(0, 150)}...</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer com botões */}
            <div className="border-t border-[#D1DBEA] bg-[#F5F7FA] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-300">Ctrl+S salvar</span>
                  <span className="text-[9px] text-gray-300">Ctrl+Enter assinar e encerrar</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleFecharModal}
                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSalvarEvolucao}
                    disabled={createEvolucao.isPending}
                    className="border-[#6B8CBE] text-[#6B8CBE] hover:bg-[#6B8CBE]/10"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    onClick={handleSalvarPendenteAssinatura}
                    disabled={createEvolucao.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Pendente
                  </Button>
                  <Button 
                    onClick={handleAssinarEvolucao}
                    disabled={createEvolucao.isPending}
                    className="bg-[#6B8CBE] hover:bg-[#5A7BAD] text-white"
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Assinar
                  </Button>
                  <Button 
                    onClick={handleAssinarEEncerrar}
                    disabled={createEvolucao.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assinar e Encerrar
                  </Button>
                </div>
              </div>
            </div>
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
            <Button className="mt-4 bg-[#6B8CBE] hover:bg-[#5A7BAD]" onClick={() => setNovaEvolucao(true)}>
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
                        {ev.statusAssinatura === 'assinado' || ev.assinado ? (
                          <Badge 
                            className="bg-emerald-500 hover:bg-emerald-600"
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
                        {ev.atendimentoEncerrado && (
                          <Badge className="bg-[#6B8CBE] hover:bg-[#5A7BAD]">
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
                          <span className="bg-[#E8EDF5] text-[#4A6A9A] px-2 py-0.5 rounded text-xs font-bold">S</span>
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
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
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
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-emerald-800">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span>Assinada digitalmente por <strong>{ev.assinadoPorNome}</strong></span>
                          </div>
                          {ev.dataAssinatura && (
                            <div className="text-xs text-emerald-600 mt-1 ml-6">
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
                            {(ev.statusAssinatura === 'assinado' || ev.assinado) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                title="Evoluções assinadas não podem ser editadas"
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
                                  toast.info('Funcionalidade de edição em desenvolvimento');
                                }}
                                title="Editar esta evolução"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            )}
                            {!(ev.statusAssinatura === 'assinado' || ev.assinado) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-[#6B8CBE] border-[#6B8CBE]/50 hover:bg-[#6B8CBE]/10"
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
                          <span className="bg-[#E8EDF5] text-[#4A6A9A] px-1.5 py-0.5 rounded text-xs font-bold mr-2">S</span>
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
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-bold mr-2">A</span>
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
              className="sm:mr-auto border-gray-300"
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
                className="border-[#6B8CBE] text-[#6B8CBE] hover:bg-[#6B8CBE]/10"
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
                className="bg-emerald-600 hover:bg-emerald-700"
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
