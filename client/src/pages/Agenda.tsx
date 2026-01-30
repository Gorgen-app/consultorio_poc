import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Ban,
  Lock,
  // Ícones de status para consultas
  CalendarCheck,
  CalendarClock,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  XCircle,
  // Ícones de status para cirurgias
  FileCheck,
  ClipboardCheck,
  Scissors,
  // Ícones gerais
  Search,
  Loader2,
  FileText,
  Play,
  Phone,
  MessageCircle,
  UserX,
  CalendarPlus
} from "lucide-react";

// Tipos de compromisso
const TIPOS_COMPROMISSO = [
  "Consulta",
  "Cirurgia",
  "Visita internado",
  "Procedimento em consultório",
  "Exame",
  "Reunião",
] as const;

const TIPOS_BLOQUEIO = [
  "Férias",
  "Feriado",
  "Reunião fixa",
  "Congresso",
  "Particular",
  "Outro",
] as const;

const LOCAIS = [
  "Consultório",
  "On-line",
  "HMV",
  "Santa Casa",
  "HMD",
  "HMD CG",
];

// Cores por tipo de compromisso
const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-blue-500",
  "Cirurgia": "bg-red-500",
  "Visita internado": "bg-purple-500",
  "Procedimento em consultório": "bg-orange-500",
  "Exame": "bg-green-500",
  "Reunião": "bg-yellow-500",
  "Bloqueio": "bg-gray-500",
};

// Feriados nacionais do Brasil (fixos e móveis para 2025-2027)
// Feriados móveis são calculados com base na Páscoa
const FERIADOS_FIXOS: Record<string, string> = {
  "01-01": "Confraternização Universal",
  "04-21": "Tiradentes",
  "05-01": "Dia do Trabalho",
  "09-07": "Independência do Brasil",
  "10-12": "Nossa Senhora Aparecida",
  "11-02": "Finados",
  "11-15": "Proclamação da República",
  "12-25": "Natal",
};

// Feriados móveis (Carnaval, Sexta-feira Santa, Páscoa, Corpus Christi)
// Calculados para cada ano
const FERIADOS_MOVEIS: Record<string, string> = {
  // 2025
  "2025-03-03": "Carnaval",
  "2025-03-04": "Carnaval",
  "2025-04-18": "Sexta-feira Santa",
  "2025-04-20": "Páscoa",
  "2025-06-19": "Corpus Christi",
  // 2026
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-04-03": "Sexta-feira Santa",
  "2026-04-05": "Páscoa",
  "2026-06-04": "Corpus Christi",
  // 2027
  "2027-02-08": "Carnaval",
  "2027-02-09": "Carnaval",
  "2027-03-26": "Sexta-feira Santa",
  "2027-03-28": "Páscoa",
  "2027-05-27": "Corpus Christi",
};

// Função para verificar se uma data é feriado
function getFeriado(data: Date): string | null {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  
  // Verificar feriados fixos
  const chaveFixa = `${mes}-${dia}`;
  if (FERIADOS_FIXOS[chaveFixa]) {
    return FERIADOS_FIXOS[chaveFixa];
  }
  
  // Verificar feriados móveis
  const chaveMovel = `${ano}-${mes}-${dia}`;
  if (FERIADOS_MOVEIS[chaveMovel]) {
    return FERIADOS_MOVEIS[chaveMovel];
  }
  
  return null;
}

// Cores por status
const CORES_STATUS: Record<string, string> = {
  "Agendado": "border-l-4 border-l-blue-500",
  "Confirmado": "border-l-4 border-l-green-500",
  "Aguardando": "border-l-4 border-l-yellow-500",
  "Em atendimento": "border-l-4 border-l-purple-500",
  "Realizado": "border-l-4 border-l-gray-400",
  "Cancelado": "border-l-4 border-l-red-500 opacity-50",
  "Reagendado": "border-l-4 border-l-amber-500 opacity-50",
  "Faltou": "border-l-4 border-l-orange-500 opacity-50",
  // Status de cirurgia
  "Autorizada": "border-l-4 border-l-teal-500",
};

// Ícones de status para consultas com cores de fundo
const ICONES_STATUS_CONSULTA: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  "Agendado": { icon: CalendarCheck, color: "text-blue-600", bgColor: "bg-blue-100", label: "Agendada" },
  "Confirmado": { icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100", label: "Confirmada" },
  "Aguardando": { icon: CalendarClock, color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Aguardando" },
  "Em atendimento": { icon: Stethoscope, color: "text-purple-600", bgColor: "bg-purple-100", label: "Em Consulta" },
  "Realizado": { icon: CheckCircle2, color: "text-gray-600", bgColor: "bg-gray-200", label: "Finalizada" },
  "Cancelado": { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Cancelada" },
  "Reagendado": { icon: RefreshCw, color: "text-amber-600", bgColor: "bg-amber-100", label: "Reagendada" },
  "Faltou": { icon: Ban, color: "text-orange-600", bgColor: "bg-orange-100", label: "Faltou" },
};

// Ícones de status para cirurgias com cores de fundo
const ICONES_STATUS_CIRURGIA: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  "Agendado": { icon: CalendarCheck, color: "text-blue-600", bgColor: "bg-blue-100", label: "Agendada" },
  "Autorizada": { icon: FileCheck, color: "text-teal-600", bgColor: "bg-teal-100", label: "Autorizada" },
  "Confirmado": { icon: ClipboardCheck, color: "text-green-600", bgColor: "bg-green-100", label: "Confirmada" },
  "Realizado": { icon: Scissors, color: "text-gray-600", bgColor: "bg-gray-200", label: "Realizada" },
  "Cancelado": { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Cancelada" },
};

// Função para obter ícone de status
function getStatusIcon(status: string, tipo: string) {
  if (tipo === "Cirurgia") {
    return ICONES_STATUS_CIRURGIA[status] || ICONES_STATUS_CONSULTA[status];
  }
  return ICONES_STATUS_CONSULTA[status];
}

export default function Agenda() {
  // Navegação
  const [, setLocation] = useLocation();
  
  // toast from sonner
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia" | "mes">("semana");
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHoraInicio, setNovaHoraInicio] = useState("");
  const [novaHoraFim, setNovaHoraFim] = useState("");

  // Form state para novo agendamento
  const [novoAgendamento, setNovoAgendamento] = useState({
    tipoCompromisso: "Consulta" as typeof TIPOS_COMPROMISSO[number],
    pacienteId: null as number | null,
    pacienteNome: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    local: "Consultório", // Padrão para Consulta
    titulo: "",
    descricao: "",
  });

  // Form state para bloqueio
  const [novoBloqueio, setNovoBloqueio] = useState({
    tipoBloqueio: "Particular" as typeof TIPOS_BLOQUEIO[number],
    dataInicio: "",
    horaInicio: "",
    dataFim: "",
    horaFim: "",
    titulo: "",
    descricao: "",
  });

  // Busca de pacientes - otimizada com searchRapido
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [buscaPacienteDebounced, setBuscaPacienteDebounced] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [pacienteSelecionadoInfo, setPacienteSelecionadoInfo] = useState<any>(null);
  
  // Drag-and-drop state
  const [draggedAgendamento, setDraggedAgendamento] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ data: string; hora: number; minuto: number } | null>(null);
  
  // Debounce da busca de pacientes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaPacienteDebounced(buscaPaciente);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaPaciente]);
  
  // Query otimizada - só busca quando tem pelo menos 2 caracteres
  const { data: pacientesSearch, isLoading: isSearchingPacientes } = trpc.pacientes.searchRapido.useQuery(
    { termo: buscaPacienteDebounced, limit: 15 },
    { enabled: buscaPacienteDebounced.length >= 2 }
  );

  // Calcular período baseado na visualização
  const periodo = useMemo(() => {
    const inicio = new Date(dataAtual);
    const fim = new Date(dataAtual);

    if (visualizacao === "dia") {
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
    } else if (visualizacao === "semana") {
      const diaSemana = inicio.getDay();
      inicio.setDate(inicio.getDate() - diaSemana);
      inicio.setHours(0, 0, 0, 0);
      // Corrigir: fim deve ser calculado a partir do início já modificado
      fim.setTime(inicio.getTime());
      fim.setDate(fim.getDate() + 6);
      fim.setHours(23, 59, 59, 999);
    } else {
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      fim.setMonth(fim.getMonth() + 1);
      fim.setDate(0);
      fim.setHours(23, 59, 59, 999);
    }

    
    return { inicio, fim };
  }, [dataAtual, visualizacao]);

  // Queries
  const { data: agendamentos, refetch: refetchAgendamentos, error: agendamentosError } = trpc.agenda.list.useQuery({
    dataInicio: periodo.inicio,
    dataFim: periodo.fim,
    incluirCancelados: true,
  });
  
  

  const { data: bloqueios, refetch: refetchBloqueios } = trpc.bloqueios.list.useQuery({
    dataInicio: periodo.inicio,
    dataFim: periodo.fim,
    incluirCancelados: true,
  });

  const { data: nextAgendamentoId } = trpc.agenda.getNextId.useQuery();
  const { data: nextBloqueioId } = trpc.bloqueios.getNextId.useQuery();
  
  // Configurações de duração por tipo de compromisso
  const { data: configuracoesDuracao } = trpc.agenda.getConfiguracoesDuracao.useQuery();

  // Mutations
  const createAgendamento = trpc.agenda.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      setModalNovoAberto(false);
      refetchAgendamentos();
      resetNovoAgendamento();
    },
    onError: (error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  const createBloqueio = trpc.bloqueios.create.useMutation({
    onSuccess: () => {
      toast.success("Bloqueio criado com sucesso!");
      setModalBloqueioAberto(false);
      refetchBloqueios();
      resetNovoBloqueio();
    },
    onError: (error) => {
      toast.error(`Erro ao criar bloqueio: ${error.message}`);
    },
  });

  const cancelarAgendamento = trpc.agenda.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado");
      setModalCancelarAberto(false);
      setModalDetalhesAberto(false);
      refetchAgendamentos();
    },
  });

  const reagendarAgendamento = trpc.agenda.reagendar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento reagendado com sucesso!");
      setModalReagendarAberto(false);
      setModalDetalhesAberto(false);
      refetchAgendamentos();
    },
  });

  const confirmarAgendamento = trpc.agenda.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento confirmado!");
      refetchAgendamentos();
    },
  });

  const realizarAgendamento = trpc.agenda.realizar.useMutation({
    onSuccess: () => {
      toast.success("Atendimento realizado!");
      refetchAgendamentos();
    },
  });

  const marcarFalta = trpc.agenda.marcarFalta.useMutation({
    onSuccess: () => {
      toast.success("Falta registrada");
      refetchAgendamentos();
    },
  });

  const marcarAguardando = trpc.agenda.marcarAguardando.useMutation({
    onSuccess: () => {
      toast.success("Paciente marcado como Aguardando");
      refetchAgendamentos();
    },
  });

  const iniciarAtendimento = trpc.agenda.iniciarAtendimento.useMutation({
    onSuccess: () => {
      toast.success("Atendimento iniciado!");
      refetchAgendamentos();
    },
  });

  // Helpers
  const resetNovoAgendamento = () => {
    setNovoAgendamento({
      tipoCompromisso: "Consulta",
      pacienteId: null,
      pacienteNome: "",
      data: "",
      horaInicio: "",
      horaFim: "",
      local: "Consultório", // Padrão para Consulta
      titulo: "",
      descricao: "",
    });
    setBuscaPaciente("");
  };

  const resetNovoBloqueio = () => {
    setNovoBloqueio({
      tipoBloqueio: "Particular",
      dataInicio: "",
      horaInicio: "",
      dataFim: "",
      horaFim: "",
      titulo: "",
      descricao: "",
    });
  };

  const navegarPeriodo = (direcao: number) => {
    const novaData = new Date(dataAtual);
    if (visualizacao === "dia") {
      novaData.setDate(novaData.getDate() + direcao);
    } else if (visualizacao === "semana") {
      novaData.setDate(novaData.getDate() + (direcao * 7));
    } else {
      novaData.setMonth(novaData.getMonth() + direcao);
    }
    setDataAtual(novaData);
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString("pt-BR", { 
      weekday: "short", 
      day: "2-digit", 
      month: "short" 
    });
  };

  const formatarHora = (data: Date | string) => {
    const d = new Date(data);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getTituloPeriodo = () => {
    if (visualizacao === "dia") {
      return dataAtual.toLocaleDateString("pt-BR", { 
        weekday: "long", 
        day: "2-digit", 
        month: "long", 
        year: "numeric" 
      });
    } else if (visualizacao === "semana") {
      const inicio = new Date(periodo.inicio);
      const fim = new Date(periodo.fim);
      return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    } else {
      return dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }
  };

  // Gerar dias da semana
  const diasSemana = useMemo(() => {
    const dias = [];
    const inicio = new Date(periodo.inicio);
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      dias.push(dia);
    }
    return dias;
  }, [periodo.inicio]);

  // Horários do dia (7h às 20h)
  const horarios = Array.from({ length: 14 }, (_, i) => i + 7);

  // Usar resultados da busca rápida otimizada
  const pacientesFiltrados = pacientesSearch || [];

  // Agrupar agendamentos por dia e hora
  const agendamentosPorDia = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    
    (agendamentos || []).forEach((ag: any) => {
      const data = new Date(ag.dataHoraInicio);
      // Usar data local para a chave (YYYY-MM-DD)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ag);
    });
    
    return mapa;
  }, [agendamentos]);

  // Handlers
  const handleCriarAgendamento = () => {
    if (!novoAgendamento.data || !novoAgendamento.horaInicio || !novoAgendamento.horaFim) {
      toast.error("Preencha data e horários");
      return;
    }
    
    // Validar paciente para tipos que exigem
    if (novoAgendamento.tipoCompromisso !== "Reunião" && !novoAgendamento.pacienteId && !novoAgendamento.pacienteNome) {
      toast.error("Selecione um paciente ou digite o nome para criar um novo");
      return;
    }

    const dataHoraInicio = new Date(`${novoAgendamento.data}T${novoAgendamento.horaInicio}`);
    const dataHoraFim = new Date(`${novoAgendamento.data}T${novoAgendamento.horaFim}`);
    
    // Validar que horário de fim seja posterior ao horário de início
    if (dataHoraFim <= dataHoraInicio) {
      toast.error("Horário de término deve ser posterior ao horário de início");
      return;
    }
    
    // Preparar dados do novo paciente se necessário
    const novoPaciente = !novoAgendamento.pacienteId && novoAgendamento.pacienteNome && novoAgendamento.tipoCompromisso !== "Reunião"
      ? {
          nome: novoAgendamento.pacienteNome,
          telefone: undefined,
          email: undefined,
          cpf: undefined,
          convenio: undefined,
        }
      : undefined;

    createAgendamento.mutate({
      idAgendamento: nextAgendamentoId || `AG-${new Date().getFullYear()}-00001`,
      tipoCompromisso: novoAgendamento.tipoCompromisso,
      pacienteId: novoAgendamento.pacienteId,
      pacienteNome: novoAgendamento.pacienteNome || null,
      dataHoraInicio,
      dataHoraFim,
      local: novoAgendamento.local || null,
      titulo: novoAgendamento.titulo || null,
      descricao: novoAgendamento.descricao || null,
      novoPaciente,
    });
  };

  const handleCriarBloqueio = () => {
    if (!novoBloqueio.dataInicio || !novoBloqueio.horaInicio || !novoBloqueio.dataFim || !novoBloqueio.horaFim || !novoBloqueio.titulo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataHoraInicio = new Date(`${novoBloqueio.dataInicio}T${novoBloqueio.horaInicio}`);
    const dataHoraFim = new Date(`${novoBloqueio.dataFim}T${novoBloqueio.horaFim}`);

    createBloqueio.mutate({
      idBloqueio: nextBloqueioId || `BL-${new Date().getFullYear()}-00001`,
      tipoBloqueio: novoBloqueio.tipoBloqueio,
      dataHoraInicio,
      dataHoraFim,
      titulo: novoBloqueio.titulo,
      descricao: novoBloqueio.descricao || null,
    });
  };

  const handleCancelar = () => {
    if (!motivoCancelamento) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }
    cancelarAgendamento.mutate({
      id: agendamentoSelecionado.id,
      motivo: motivoCancelamento,
    });
  };

  const handleReagendar = () => {
    if (!novaData || !novaHoraInicio || !novaHoraFim) {
      toast.error("Preencha a nova data e horários");
      return;
    }

    reagendarAgendamento.mutate({
      idOriginal: agendamentoSelecionado.id,
      novaDataInicio: new Date(`${novaData}T${novaHoraInicio}`),
      novaDataFim: new Date(`${novaData}T${novaHoraFim}`),
    });
  };

  const abrirDetalhes = (agendamento: any) => {
    setAgendamentoSelecionado(agendamento);
    setModalDetalhesAberto(true);
  };

  // Função para abrir modal de novo agendamento com data/hora pré-preenchidos
  const abrirNovoAgendamentoComHorario = (data: Date, hora: number, minuto: number = 0) => {
    // Formatar data como YYYY-MM-DD
    const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    
    // Formatar hora de início como HH:MM
    const horaInicioFormatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    
    // Buscar duração configurada para o tipo padrão (Consulta)
    const configConsulta = configuracoesDuracao?.find(c => c.tipoCompromisso === "Consulta");
    const duracaoPadrao = configConsulta?.duracaoMinutos || 30;
    const localPadrao = configConsulta?.localPadrao || "Consultório";
    
    // Calcular hora de fim baseado na duração configurada
    const totalMinutos = hora * 60 + minuto + duracaoPadrao;
    let horaFim = Math.floor(totalMinutos / 60);
    let minutoFim = totalMinutos % 60;
    
    // Limitar a 23:59
    if (horaFim >= 24) {
      horaFim = 23;
      minutoFim = 59;
    }
    const horaFimFormatada = `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
    
    // Atualizar estado do formulário
    setNovoAgendamento(prev => ({
      ...prev,
      tipoCompromisso: "Consulta",
      data: dataFormatada,
      horaInicio: horaInicioFormatada,
      horaFim: horaFimFormatada,
      local: localPadrao,
    }));
    
    // Abrir modal
    setModalNovoAberto(true);
    
    // Notificar usuário
    toast.info(`Horário selecionado: ${dataFormatada} às ${horaInicioFormatada}`);
  };

  const selecionarPaciente = (paciente: any) => {
    setNovoAgendamento({
      ...novoAgendamento,
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
    });
    setBuscaPaciente(paciente.nome);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, ag: any) => {
    // Não permitir arrastar agendamentos cancelados/reagendados
    if (ag.status === "Cancelado" || ag.status === "Reagendado" || ag.status === "Faltou") {
      e.preventDefault();
      return;
    }
    setDraggedAgendamento(ag);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ag.id.toString());
    // Adicionar classe visual ao elemento arrastado
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedAgendamento(null);
    setDragOverSlot(null);
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, data: Date, hora: number, minuto: number = 0) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    setDragOverSlot({ data: dataStr, hora, minuto });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, data: Date, hora: number, minuto: number = 0) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    if (!draggedAgendamento) return;
    
    // Calcular nova data/hora
    const novaDataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    const novaHoraInicioStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    
    // Calcular duração original do agendamento
    const inicioOriginal = new Date(draggedAgendamento.dataHoraInicio);
    const fimOriginal = draggedAgendamento.dataHoraFim ? new Date(draggedAgendamento.dataHoraFim) : new Date(inicioOriginal.getTime() + 30 * 60000);
    const duracaoMs = fimOriginal.getTime() - inicioOriginal.getTime();
    
    // Calcular novo horário de fim mantendo a duração
    const novoInicio = new Date(`${novaDataStr}T${novaHoraInicioStr}`);
    const novoFim = new Date(novoInicio.getTime() + duracaoMs);
    const novaHoraFimStr = `${String(novoFim.getHours()).padStart(2, '0')}:${String(novoFim.getMinutes()).padStart(2, '0')}`;
    
    // Verificar se é o mesmo horário (sem mudança)
    if (inicioOriginal.getTime() === novoInicio.getTime()) {
      setDraggedAgendamento(null);
      return;
    }
    
    // Executar reagendamento
    reagendarAgendamento.mutate({
      idOriginal: draggedAgendamento.id,
      novaDataInicio: novoInicio,
      novaDataFim: novoFim,
    }, {
      onSuccess: () => {
        toast.success(`Agendamento movido para ${novaDataStr} às ${novaHoraInicioStr}`);
        setDraggedAgendamento(null);
      },
      onError: (error) => {
        toast.error(`Erro ao reagendar: ${error.message}`);
        setDraggedAgendamento(null);
      }
    });
  };

  // Renderizar agendamento no calendário
  const renderAgendamento = (ag: any) => {
    const isCancelado = ag.status === "Cancelado" || ag.status === "Reagendado" || ag.status === "Faltou";
    const statusInfo = getStatusIcon(ag.status, ag.tipoCompromisso);
    const StatusIcon = statusInfo?.icon;
    
    // Calcular duração em minutos para definir altura proporcional
    const inicio = new Date(ag.dataHoraInicio);
    const fim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(inicio.getTime() + 30 * 60000);
    const duracaoMinutos = Math.max(15, Math.min(120, (fim.getTime() - inicio.getTime()) / 60000));
    
    // Altura proporcional: 60min = 48px (altura da célula h-12), 30min = 24px (metade)
    // Cada minuto = 0.8px
    const alturaPixels = Math.round(duracaoMinutos * 0.8);
    
    // Verificar se pode ser arrastado
    const canDrag = !isCancelado;
    
    return (
      <div
        key={ag.id}
        onClick={(e) => {
          e.stopPropagation();
          abrirDetalhes(ag);
        }}
        draggable={canDrag}
        onDragStart={(e) => handleDragStart(e, ag)}
        onDragEnd={handleDragEnd}
        style={{ height: `${alturaPixels}px`, minHeight: '16px' }}
        className={`
          px-1 py-0.5 rounded text-white text-[10px] leading-tight overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          ${isCancelado ? "opacity-40 line-through cursor-not-allowed" : "hover:opacity-90 cursor-grab active:cursor-grabbing"}
          ${CORES_STATUS[ag.status]}
          ${draggedAgendamento?.id === ag.id ? "ring-2 ring-white ring-offset-1" : ""}
        `}
        title={canDrag ? "Arraste para reagendar" : (statusInfo?.label || ag.status)}
      >
        <div className="font-medium truncate flex items-center gap-0.5">
          {StatusIcon && statusInfo && (
            <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${statusInfo.bgColor} flex-shrink-0`}>
              <StatusIcon className={`w-2.5 h-2.5 ${statusInfo.color}`} />
            </span>
          )}
          <span>{formatarHora(ag.dataHoraInicio)} - {ag.pacienteNome || ag.titulo || ag.tipoCompromisso}</span>
        </div>
        {duracaoMinutos >= 30 && ag.local && <div className="text-[9px] opacity-80 truncate">{ag.local}</div>}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus compromissos e horários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalBloqueioAberto(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Bloquear Horário
          </Button>
          <Button onClick={() => setModalNovoAberto(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Controles de navegação e Legenda */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => navegarPeriodo(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => navegarPeriodo(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="ml-2 flex flex-col">
            <span className="text-lg font-bold capitalize text-primary">
              {dataAtual.toLocaleDateString("pt-BR", { month: "long" })}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{getTituloPeriodo()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legenda compacta */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {Object.entries(CORES_TIPO).map(([tipo, cor]) => (
              <div key={tipo} className="flex items-center gap-1" title={tipo}>
                <div className={`w-2 h-2 rounded ${cor}`}></div>
                <span className="hidden lg:inline">{tipo}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 ml-2" title="Cancelado/Reagendado">
              <div className="w-2 h-2 rounded bg-gray-400 opacity-50"></div>
              <span className="hidden lg:inline">Cancelado</span>
            </div>
          </div>
          {/* Botões de visualização */}
          <div className="flex gap-0.5">
            <Button 
              variant={visualizacao === "dia" ? "default" : "outline"} 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setVisualizacao("dia")}
            >
              Dia
            </Button>
            <Button 
              variant={visualizacao === "semana" ? "default" : "outline"} 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setVisualizacao("semana")}
            >
              Semana
            </Button>
            <Button 
              variant={visualizacao === "mes" ? "default" : "outline"} 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setVisualizacao("mes")}
            >
              Mês
            </Button>
          </div>
        </div>
      </div>

      {/* Legenda mobile */}
      <div className="flex md:hidden flex-wrap gap-2 text-xs">
        {Object.entries(CORES_TIPO).map(([tipo, cor]) => (
          <div key={tipo} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded ${cor}`}></div>
            <span>{tipo}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 rounded bg-gray-400 opacity-50"></div>
          <span>Cancelado/Reagendado</span>
        </div>
      </div>

      {/* Calendário - Visualização Semana */}
      {visualizacao === "semana" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-8 border-b">
              <div className="px-1 py-1 text-center text-xs font-medium border-r bg-muted">
                Horário
              </div>
              {diasSemana.map((dia, i) => {
                const feriado = getFeriado(dia);
                const isHoje = dia.toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={i} 
                    className={`px-1 py-1 text-center text-xs font-medium border-r ${
                      isHoje ? "bg-blue-50" : feriado ? "bg-amber-100" : ""
                    }`}
                    title={feriado || undefined}
                  >
                    <div className="capitalize">{dia.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
                    <div className="text-sm font-bold">{dia.getDate()}</div>
                    {feriado && (
                      <div className="text-[8px] text-amber-700 truncate" title={feriado}>
                        {feriado}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              {horarios.map((hora) => (
                <div key={hora} className="grid grid-cols-8 border-b h-12">
                  <div className="px-1 py-0.5 text-center text-xs text-muted-foreground border-r bg-muted flex items-center justify-center">
                    {hora.toString().padStart(2, "0")}:00
                  </div>
                  {diasSemana.map((dia, i) => {
                    // Usar data local para a chave (YYYY-MM-DD)
                    const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
                    const agendamentosDia = agendamentosPorDia[chave] || [];
                    const agendamentosHora = agendamentosDia.filter((ag: any) => {
                      const horaAg = new Date(ag.dataHoraInicio).getHours();
                      return horaAg === hora;
                    });
                    const feriado = getFeriado(dia);
                    const isHoje = dia.toDateString() === new Date().toDateString();
                    
                    // Verificar se este slot está sendo alvo do drag
                    const isDragOver = dragOverSlot?.data === chave && dragOverSlot?.hora === hora;
                    
                    return (
                      <div 
                        key={i} 
                        className={`px-0.5 py-0 border-r overflow-hidden cursor-pointer transition-colors ${
                          isHoje ? "bg-blue-50/50" : feriado ? "bg-amber-50" : ""
                        } ${
                          isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset" : "hover:bg-primary/5"
                        }`}
                        onClick={(e) => {
                          // Só abre modal se clicar no slot vazio (não em um agendamento existente)
                          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-slot-empty]')) {
                            // Determinar se clicou na metade superior (xx:00) ou inferior (xx:30)
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const clickY = e.clientY - rect.top;
                            const metadeInferior = clickY > rect.height / 2;
                            const minuto = metadeInferior ? 30 : 0;
                            abrirNovoAgendamentoComHorario(dia, hora, minuto);
                          }
                        }}
                        onDragOver={(e) => {
                          // Determinar se está na metade superior (xx:00) ou inferior (xx:30)
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const dragY = e.clientY - rect.top;
                          const metadeInferior = dragY > rect.height / 2;
                          const minuto = metadeInferior ? 30 : 0;
                          handleDragOver(e, dia, hora, minuto);
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          // Determinar se soltou na metade superior (xx:00) ou inferior (xx:30)
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const dropY = e.clientY - rect.top;
                          const metadeInferior = dropY > rect.height / 2;
                          const minuto = metadeInferior ? 30 : 0;
                          handleDrop(e, dia, hora, minuto);
                        }}
                        title={draggedAgendamento ? `Solte aqui para mover para ${hora.toString().padStart(2, '0')}:00` : `Clique para agendar (metade superior: ${hora.toString().padStart(2, '0')}:00, metade inferior: ${hora.toString().padStart(2, '0')}:30)`}
                      >
                        {agendamentosHora.length === 0 && (
                          <div data-slot-empty className="h-full w-full" />
                        )}
                        {agendamentosHora.map(renderAgendamento)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendário - Visualização Dia */}
      {visualizacao === "dia" && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {horarios.map((hora) => {
                const chave = dataAtual.toISOString().split("T")[0];
                const agendamentosDia = agendamentosPorDia[chave] || [];
                const agendamentosHora = agendamentosDia.filter((ag: any) => {
                  const horaAg = new Date(ag.dataHoraInicio).getHours();
                  return horaAg === hora;
                });
                
                // Verificar se este slot está sendo alvo do drag
                const isDragOverDia = dragOverSlot?.data === chave && dragOverSlot?.hora === hora;

                return (
                  <div 
                    key={hora} 
                    className={`flex gap-4 min-h-[50px] border-b pb-2 cursor-pointer transition-colors rounded ${
                      isDragOverDia ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-primary/5"
                    }`}
                    onClick={(e) => {
                      // Só abre modal se clicar no slot vazio (não em um agendamento existente)
                      if (e.target === e.currentTarget || agendamentosHora.length === 0) {
                        // Determinar se clicou na metade superior (xx:00) ou inferior (xx:30)
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        const metadeInferior = clickY > rect.height / 2;
                        const minuto = metadeInferior ? 30 : 0;
                        abrirNovoAgendamentoComHorario(dataAtual, hora, minuto);
                      }
                    }}
                    onDragOver={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const dragY = e.clientY - rect.top;
                      const metadeInferior = dragY > rect.height / 2;
                      const minuto = metadeInferior ? 30 : 0;
                      handleDragOver(e, dataAtual, hora, minuto);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const dropY = e.clientY - rect.top;
                      const metadeInferior = dropY > rect.height / 2;
                      const minuto = metadeInferior ? 30 : 0;
                      handleDrop(e, dataAtual, hora, minuto);
                    }}
                    title={draggedAgendamento ? `Solte aqui para mover para ${hora.toString().padStart(2, '0')}:00` : `Clique para agendar (metade superior: ${hora.toString().padStart(2, '0')}:00, metade inferior: ${hora.toString().padStart(2, '0')}:30)`}
                  >
                    <div className="w-16 text-sm text-muted-foreground font-medium">
                      {hora.toString().padStart(2, "0")}:00
                    </div>
                    <div className="flex-1">
                      {agendamentosHora.length === 0 && (
                        <div className="h-full flex items-center text-muted-foreground text-sm">
                          <Plus className="w-4 h-4 mr-1 opacity-50" />
                          <span className="opacity-50">{draggedAgendamento ? "Solte aqui" : "Clique para agendar"}</span>
                        </div>
                      )}
                      {agendamentosHora.map((ag: any) => {
                        const isCanceladoDia = ag.status === "Cancelado" || ag.status === "Reagendado" || ag.status === "Faltou";
                        const canDragDia = !isCanceladoDia;
                        
                        return (
                        <div
                          key={ag.id}
                          draggable={canDragDia}
                          onDragStart={(e) => handleDragStart(e, ag)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalhes(ag);
                          }}
                          className={`
                            p-3 rounded text-white mb-2
                            ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
                            ${isCanceladoDia ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 cursor-grab active:cursor-grabbing"}
                            ${draggedAgendamento?.id === ag.id ? "ring-2 ring-white ring-offset-1" : ""}
                          `}
                          title={canDragDia ? "Arraste para reagendar" : ag.status}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {formatarHora(ag.dataHoraInicio)} - {formatarHora(ag.dataHoraFim)}
                              </div>
                              <div className="text-sm opacity-90">
                                {ag.pacienteNome || ag.titulo || ag.tipoCompromisso}
                              </div>
                            </div>
                            <div className="text-xs opacity-80">
                              {ag.local}
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendário - Visualização Mês */}
      {visualizacao === "mes" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {dia}
                </div>
              ))}
              {(() => {
                const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
                const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
                const diasNoMes = ultimoDia.getDate();
                const primeiroDiaSemana = primeiroDia.getDay();
                
                const celulas = [];
                
                // Dias vazios antes do primeiro dia do mês
                for (let i = 0; i < primeiroDiaSemana; i++) {
                  celulas.push(<div key={`empty-${i}`} className="p-2 min-h-[80px]"></div>);
                }
                
                // Dias do mês
                for (let dia = 1; dia <= diasNoMes; dia++) {
                  const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia);
                  const chave = data.toISOString().split("T")[0];
                  const agendamentosDia = agendamentosPorDia[chave] || [];
                  const isHoje = data.toDateString() === new Date().toDateString();
                  
                  celulas.push(
                    <div 
                      key={dia} 
                      className={`p-2 min-h-[80px] border rounded ${isHoje ? "bg-blue-50 border-blue-300" : "border-gray-200"}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isHoje ? "text-blue-600" : ""}`}>
                        {dia}
                      </div>
                      <div className="space-y-1">
                        {agendamentosDia.slice(0, 3).map((ag: any) => (
                          <div
                            key={ag.id}
                            onClick={() => abrirDetalhes(ag)}
                            className={`
                              text-xs p-1 rounded cursor-pointer text-white truncate
                              ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
                              ${ag.status === "Cancelado" || ag.status === "Reagendado" ? "opacity-40" : ""}
                            `}
                          >
                            {formatarHora(ag.dataHoraInicio)} {ag.pacienteNome?.split(" ")[0] || ag.tipoCompromisso}
                          </div>
                        ))}
                        {agendamentosDia.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{agendamentosDia.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return celulas;
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Novo Agendamento */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Compromisso</Label>
              <Select 
                value={novoAgendamento.tipoCompromisso} 
                onValueChange={(v) => {
                  // Buscar configuração de duração para o tipo selecionado
                  const config = configuracoesDuracao?.find(c => c.tipoCompromisso === v);
                  const duracaoMinutos = config?.duracaoMinutos || 30;
                  const localPadrao = config?.localPadrao || (v === "Consulta" ? "Consultório" : "");
                  
                  // Calcular novo horário de fim se já tiver horário de início
                  let novoHoraFim = novoAgendamento.horaFim;
                  if (novoAgendamento.horaInicio) {
                    const [h, m] = novoAgendamento.horaInicio.split(":").map(Number);
                    const inicioMinutos = h * 60 + m;
                    const fimMinutos = inicioMinutos + duracaoMinutos;
                    const fimH = Math.floor(fimMinutos / 60);
                    const fimM = fimMinutos % 60;
                    novoHoraFim = `${fimH.toString().padStart(2, "0")}:${fimM.toString().padStart(2, "0")}`;
                  }
                  
                  setNovoAgendamento({
                    ...novoAgendamento, 
                    tipoCompromisso: v as any,
                    local: localPadrao,
                    horaFim: novoHoraFim,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROMISSO.map((tipo) => {
                    const config = configuracoesDuracao?.find(c => c.tipoCompromisso === tipo);
                    const duracao = config?.duracaoMinutos || 30;
                    return (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo} ({duracao}min)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {novoAgendamento.tipoCompromisso !== "Reunião" && (
              <div className="space-y-2">
                <Label>Paciente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou ID..."
                    value={buscaPaciente}
                    onChange={(e) => {
                      setBuscaPaciente(e.target.value);
                      setShowPacienteDropdown(true);
                      // Limpar seleção se o usuário editar o campo
                      if (pacienteSelecionadoInfo && e.target.value !== pacienteSelecionadoInfo.nome) {
                        setPacienteSelecionadoInfo(null);
                        setNovoAgendamento(prev => ({ ...prev, pacienteId: null, pacienteNome: "" }));
                      }
                    }}
                    onFocus={() => setShowPacienteDropdown(true)}
                    className="pl-9 pr-8"
                  />
                  {isSearchingPacientes && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {/* Card do paciente selecionado */}
                {pacienteSelecionadoInfo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">{pacienteSelecionadoInfo.nome}</div>
                        <div className="text-xs text-green-600">
                          ID: {pacienteSelecionadoInfo.idPaciente} | CPF: {pacienteSelecionadoInfo.cpf || "N/A"}
                        </div>
                        {pacienteSelecionadoInfo.telefone && (
                          <div className="text-xs text-green-600">Tel: {pacienteSelecionadoInfo.telefone}</div>
                        )}
                        {pacienteSelecionadoInfo.operadora1 && (
                          <div className="text-xs text-green-600">Convênio: {pacienteSelecionadoInfo.operadora1}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPacienteSelecionadoInfo(null);
                          setBuscaPaciente("");
                          setNovoAgendamento(prev => ({ ...prev, pacienteId: null, pacienteNome: "" }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Dropdown de resultados */}
                {showPacienteDropdown && !pacienteSelecionadoInfo && buscaPaciente.length >= 2 && (
                  <div className="border rounded-lg shadow-lg max-h-48 overflow-y-auto bg-background">
                    {isSearchingPacientes ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Buscando pacientes...
                      </div>
                    ) : pacientesFiltrados.length > 0 ? (
                      pacientesFiltrados.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => {
                            selecionarPaciente(p);
                            setPacienteSelecionadoInfo(p);
                            setShowPacienteDropdown(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{p.nome}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.idPaciente} {p.cpf && `| CPF: ${p.cpf}`} {p.operadora1 && `| ${p.operadora1}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <div className="text-muted-foreground mb-2">Nenhum paciente encontrado</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Criar novo paciente com o nome digitado
                            setNovoAgendamento(prev => ({ ...prev, pacienteNome: buscaPaciente }));
                            setShowPacienteDropdown(false);
                            toast.info("Paciente será criado automaticamente ao salvar o agendamento");
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Criar novo paciente: "{buscaPaciente}"
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {novoAgendamento.tipoCompromisso === "Reunião" && (
              <div>
                <Label>Título da Reunião</Label>
                <Input
                  value={novoAgendamento.titulo}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, titulo: e.target.value})}
                  placeholder="Ex: Reunião de equipe"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={novoAgendamento.data}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, data: e.target.value})}
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={novoAgendamento.horaInicio}
                  onChange={(e) => {
                    const horaInicio = e.target.value;
                    if (horaInicio) {
                      const [hInicio, mInicio] = horaInicio.split(':').map(Number);
                      
                      // Calcular duração atual (se houver horário de fim válido)
                      let duracaoMinutos = 30; // Padrão: 30 minutos
                      if (novoAgendamento.horaFim && novoAgendamento.horaInicio) {
                        const [hFimAtual, mFimAtual] = novoAgendamento.horaFim.split(':').map(Number);
                        const [hInicioAtual, mInicioAtual] = novoAgendamento.horaInicio.split(':').map(Number);
                        const duracaoAtual = (hFimAtual * 60 + mFimAtual) - (hInicioAtual * 60 + mInicioAtual);
                        if (duracaoAtual > 0) {
                          duracaoMinutos = duracaoAtual;
                        }
                      }
                      
                      // Calcular novo horário de fim mantendo a duração
                      const totalMinutosFim = hInicio * 60 + mInicio + duracaoMinutos;
                      let horaFim = Math.floor(totalMinutosFim / 60);
                      let minutoFim = totalMinutosFim % 60;
                      
                      // Limitar a 23:59
                      if (horaFim >= 24) {
                        horaFim = 23;
                        minutoFim = 59;
                      }
                      
                      const horaFimFormatada = `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
                      setNovoAgendamento({...novoAgendamento, horaInicio, horaFim: horaFimFormatada});
                    } else {
                      setNovoAgendamento({...novoAgendamento, horaInicio});
                    }
                  }}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={novoAgendamento.horaFim}
                  onChange={(e) => {
                    const horaFim = e.target.value;
                    // Validar que horário de fim seja posterior ao início
                    if (horaFim && novoAgendamento.horaInicio) {
                      const [hInicio, mInicio] = novoAgendamento.horaInicio.split(':').map(Number);
                      const [hFim, mFim] = horaFim.split(':').map(Number);
                      const minutosInicio = hInicio * 60 + mInicio;
                      const minutosFim = hFim * 60 + mFim;
                      
                      if (minutosFim <= minutosInicio) {
                        toast.error("Horário de término deve ser posterior ao horário de início");
                        // Corrigir automaticamente para início + 30 minutos
                        const totalMinutosFim = minutosInicio + 30;
                        let horaFimCorrigida = Math.floor(totalMinutosFim / 60);
                        let minutoFimCorrigido = totalMinutosFim % 60;
                        if (horaFimCorrigida >= 24) {
                          horaFimCorrigida = 23;
                          minutoFimCorrigido = 59;
                        }
                        const horaFimFormatada = `${String(horaFimCorrigida).padStart(2, '0')}:${String(minutoFimCorrigido).padStart(2, '0')}`;
                        setNovoAgendamento({...novoAgendamento, horaFim: horaFimFormatada});
                        return;
                      }
                    }
                    setNovoAgendamento({...novoAgendamento, horaFim});
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Local</Label>
              <Select 
                value={novoAgendamento.local} 
                onValueChange={(v) => setNovoAgendamento({...novoAgendamento, local: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {LOCAIS.map((local) => (
                    <SelectItem key={local} value={local}>{local}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={novoAgendamento.descricao}
                onChange={(e) => setNovoAgendamento({...novoAgendamento, descricao: e.target.value})}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAgendamento} disabled={createAgendamento.isPending}>
              {createAgendamento.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bloqueio de Horário */}
      <Dialog open={modalBloqueioAberto} onOpenChange={setModalBloqueioAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bloquear Horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Bloqueio</Label>
              <Select 
                value={novoBloqueio.tipoBloqueio} 
                onValueChange={(v) => setNovoBloqueio({...novoBloqueio, tipoBloqueio: v as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_BLOQUEIO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título</Label>
              <Input
                value={novoBloqueio.titulo}
                onChange={(e) => setNovoBloqueio({...novoBloqueio, titulo: e.target.value})}
                placeholder="Ex: Férias de janeiro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={novoBloqueio.dataInicio}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, dataInicio: e.target.value})}
                />
              </div>
              <div>
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={novoBloqueio.horaInicio}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, horaInicio: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={novoBloqueio.dataFim}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, dataFim: e.target.value})}
                />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={novoBloqueio.horaFim}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, horaFim: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={novoBloqueio.descricao}
                onChange={(e) => setNovoBloqueio({...novoBloqueio, descricao: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBloqueioAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarBloqueio} disabled={createBloqueio.isPending}>
              {createBloqueio.isPending ? "Salvando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes do Agendamento - Redesenhado para consistência visual */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-4xl p-0 flex flex-col max-h-[85vh]" showCloseButton={false}>
          {/* Cabeçalho com fundo azul - GORGEN 3.9.99 */}
          <div className="bg-[#6B8CBE] px-6 py-4 relative">
            <div className="flex items-center justify-between pr-12">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span className="font-semibold text-base text-white">{agendamentoSelecionado?.tipoCompromisso}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  agendamentoSelecionado?.status === "Realizado" ? "bg-[#374151] text-white" :
                  agendamentoSelecionado?.status === "Em atendimento" ? "bg-[#5A7DB0] text-white" :
                  agendamentoSelecionado?.status === "Aguardando" ? "bg-[#F59E0B] text-white" :
                  agendamentoSelecionado?.status === "Confirmado" ? "bg-[#10B981] text-white" :
                  agendamentoSelecionado?.status === "Cancelado" ? "bg-[#EF4444] text-white" :
                  agendamentoSelecionado?.status === "Faltou" ? "bg-[#F97316] text-white" :
                  "bg-white/20 text-white"
                }`}>
                  {agendamentoSelecionado?.status}
                </span>
              </div>
            </div>
            {/* Botão X branco customizado - GORGEN 3.9.99 */}
            <button
              onClick={() => setModalDetalhesAberto(false)}
              className="absolute top-3 right-4 p-1.5 rounded-md text-white hover:bg-white/20 transition-colors z-50"
              title="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {agendamentoSelecionado && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Informações do Paciente - Layout aprimorado com CPF, Data Nasc. e WhatsApp */}
              {agendamentoSelecionado.pacienteNome && (
                <div className="bg-[#F5F7FA] border border-[#E8EDF5] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D1DBEA] flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#4A6A9A]">
                          {agendamentoSelecionado.pacienteNome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-800">{agendamentoSelecionado.pacienteNome}</p>
                          {/* Botão WhatsApp */}
                          {agendamentoSelecionado.telefonePaciente && (
                            <a
                              href={`https://wa.me/55${agendamentoSelecionado.telefonePaciente.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <span className="text-xs text-gray-400">#{agendamentoSelecionado.idAgendamento}</span>
                        </div>
                        {/* CPF e Data de Nascimento */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          {agendamentoSelecionado.cpfPaciente && (
                            <span>CPF: {agendamentoSelecionado.cpfPaciente}</span>
                          )}
                          {agendamentoSelecionado.dataNascimentoPaciente && (
                            <span>Nasc.: {new Date(agendamentoSelecionado.dataNascimentoPaciente).toLocaleDateString("pt-BR")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {agendamentoSelecionado.pacienteId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-[#6B8CBE] text-[#6B8CBE] hover:bg-[#6B8CBE]/10"
                        onClick={() => {
                          setModalDetalhesAberto(false);
                          setLocation(`/pacientes/${agendamentoSelecionado.pacienteId}/prontuario`);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Prontuário
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Data, Hora e Local */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E8EDF5] rounded-lg p-4">
                  <Label className="text-xs text-gray-500 mb-1 block">Data e Horário</Label>
                  <div className="flex items-center gap-2 text-gray-800">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#6B8CBE]" />
                    <span className="font-medium text-sm">{new Date(agendamentoSelecionado.dataHoraInicio).toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[#6B8CBE]" />
                    <span className="text-sm">{formatarHora(agendamentoSelecionado.dataHoraInicio)} - {formatarHora(agendamentoSelecionado.dataHoraFim)}</span>
                  </div>
                </div>
                <div className="bg-white border border-[#E8EDF5] rounded-lg p-4">
                  <Label className="text-xs text-gray-500 mb-1 block">Local</Label>
                  <div className="flex items-center gap-2 text-gray-800">
                    <MapPin className="w-3.5 h-3.5 text-[#6B8CBE]" />
                    <span className="font-medium">{agendamentoSelecionado.local || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {agendamentoSelecionado.descricao && (
                <div className="bg-white border border-[#E8EDF5] rounded-lg p-4">
                  <Label className="text-xs text-gray-500 mb-2 block">Observações</Label>
                  <p className="text-sm text-gray-700">{agendamentoSelecionado.descricao}</p>
                </div>
              )}

              {agendamentoSelecionado.reagendadoDe && (
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    Este agendamento foi reagendado de outro compromisso anterior.
                  </p>
                </div>
              )}

              {agendamentoSelecionado.status === "Cancelado" && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-xs text-red-800">
                    <strong>Cancelado em:</strong> {new Date(agendamentoSelecionado.canceladoEm).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-red-800">
                    <strong>Motivo:</strong> {agendamentoSelecionado.motivoCancelamento}
                  </p>
                </div>
              )}

              {/* Stepper de Etapas do Atendimento - GORGEN 3.9.83 */}
              <div className="bg-white border border-[#E8EDF5] rounded-lg p-4">
                <Label className="text-xs text-gray-500 mb-4 block text-center">Etapas do Atendimento</Label>
                <div className="flex items-center justify-between">
                  {/* Etapa 1: Agendado */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      ["Confirmado", "Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] text-white" 
                        : agendamentoSelecionado.status === "Agendado" 
                          ? "bg-[#6B8CBE] text-white" 
                          : "bg-gray-200 text-gray-400"
                    }`}>
                      {["Confirmado", "Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? <Check className="w-4 h-4" /> 
                        : <span className="text-xs font-medium">1</span>}
                    </div>
                    <span className={`text-xs ${
                      ["Agendado", "Confirmado", "Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>Agendado</span>
                  </div>
                  
                  {/* Linha 1-2 */}
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${
                      ["Confirmado", "Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] w-full" : "w-0"
                    }`} />
                  </div>
                  
                  {/* Etapa 2: Confirmado */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      ["Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] text-white" 
                        : agendamentoSelecionado.status === "Confirmado" 
                          ? "bg-[#6B8CBE] text-white" 
                          : "bg-gray-200 text-gray-400"
                    }`}>
                      {["Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? <Check className="w-4 h-4" /> 
                        : <span className="text-xs font-medium">2</span>}
                    </div>
                    <span className={`text-xs ${
                      ["Confirmado", "Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>Confirmado</span>
                  </div>
                  
                  {/* Linha 2-3 */}
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${
                      ["Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] w-full" : "w-0"
                    }`} />
                  </div>
                  
                  {/* Etapa 3: Aguardando */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      ["Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] text-white" 
                        : agendamentoSelecionado.status === "Aguardando" 
                          ? "bg-[#F59E0B] text-white" 
                          : "bg-gray-200 text-gray-400"
                    }`}>
                      {["Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? <Check className="w-4 h-4" /> 
                        : <span className="text-xs font-medium">3</span>}
                    </div>
                    <span className={`text-xs ${
                      ["Aguardando", "Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>Aguardando</span>
                  </div>
                  
                  {/* Linha 3-4 */}
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${
                      ["Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "bg-[#10B981] w-full" : "w-0"
                    }`} />
                  </div>
                  
                  {/* Etapa 4: Em Atendimento */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      agendamentoSelecionado.status === "Realizado" 
                        ? "bg-[#10B981] text-white" 
                        : agendamentoSelecionado.status === "Em atendimento" 
                          ? "bg-[#6B8CBE] text-white" 
                          : "bg-gray-200 text-gray-400"
                    }`}>
                      {agendamentoSelecionado.status === "Realizado" 
                        ? <Check className="w-4 h-4" /> 
                        : <span className="text-xs font-medium">4</span>}
                    </div>
                    <span className={`text-xs text-center ${
                      ["Em atendimento", "Realizado"].includes(agendamentoSelecionado.status) 
                        ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>Em<br/>Atendimento</span>
                  </div>
                  
                  {/* Linha 4-5 */}
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${
                      agendamentoSelecionado.status === "Realizado" 
                        ? "bg-[#10B981] w-full" : "w-0"
                    }`} />
                  </div>
                  
                  {/* Etapa 5: Encerrado */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      agendamentoSelecionado.status === "Realizado" 
                        ? "bg-[#10B981] text-white" 
                        : "bg-gray-200 text-gray-400"
                    }`}>
                      {agendamentoSelecionado.status === "Realizado" 
                        ? <Check className="w-4 h-4" /> 
                        : <span className="text-xs font-medium">5</span>}
                    </div>
                    <span className={`text-xs ${
                      agendamentoSelecionado.status === "Realizado" 
                        ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>Encerrado</span>
                  </div>
                </div>
              </div>

              {/* Status finais - apenas informação */}
              {agendamentoSelecionado.status === "Realizado" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">Atendimento finalizado com sucesso</p>
                </div>
              )}

              {agendamentoSelecionado.status === "Faltou" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-800 font-medium">Paciente não compareceu</p>
                </div>
              )}
            </div>
          )}
          
          {/* Footer com TODOS os 9 botões SEMPRE VISÍVEIS - GORGEN 3.9.83 */}
          {agendamentoSelecionado && (
            <div className="border-t border-[#D1DBEA] bg-[#F5F7FA] px-6 py-4 flex-shrink-0">
              {/* Linha 1: Botões de progressão do fluxo - TODOS VISÍVEIS */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Botão Confirmar - sempre visível */}
                <Button 
                  onClick={() => {
                    confirmarAgendamento.mutate({ id: agendamentoSelecionado.id }, {
                      onSuccess: () => setAgendamentoSelecionado((prev: any) => prev ? { ...prev, status: "Confirmado" } : null)
                    });
                  }}
                  size="sm"
                  disabled={agendamentoSelecionado.status !== "Agendado"}
                  className={`${
                    agendamentoSelecionado.status !== "Agendado" ? "opacity-50 cursor-not-allowed" : ""
                  } bg-[#10B981] hover:bg-[#059669] text-white`}
                  title="Confirmar presença do paciente"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Confirmar</span>
                </Button>
                
                {/* Botão Chegou - sempre visível */}
                <Button 
                  onClick={() => {
                    marcarAguardando.mutate({ id: agendamentoSelecionado.id }, {
                      onSuccess: () => setAgendamentoSelecionado((prev: any) => prev ? { ...prev, status: "Aguardando" } : null)
                    });
                  }}
                  size="sm"
                  disabled={agendamentoSelecionado.status !== "Confirmado"}
                  className={`${
                    agendamentoSelecionado.status !== "Confirmado" ? "opacity-50 cursor-not-allowed" : ""
                  } bg-[#F59E0B] hover:bg-[#D97706] text-white`}
                  title="Marcar que o paciente chegou"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Chegou</span>
                </Button>
                
                {/* Botão Atender - sempre visível */}
                <Button 
                  onClick={() => {
                    iniciarAtendimento.mutate({ id: agendamentoSelecionado.id }, {
                      onSuccess: () => {
                        setAgendamentoSelecionado((prev: any) => prev ? { ...prev, status: "Em atendimento" } : null);
                        if (agendamentoSelecionado.pacienteId) {
                          setModalDetalhesAberto(false);
                          setLocation(`/prontuario/${agendamentoSelecionado.pacienteId}?secao=evolucoes&novaEvolucao=true&agendamentoId=${agendamentoSelecionado.id}`);
                        }
                      }
                    });
                  }}
                  size="sm"
                  disabled={agendamentoSelecionado.status !== "Aguardando"}
                  className={`${
                    agendamentoSelecionado.status !== "Aguardando" ? "opacity-50 cursor-not-allowed" : ""
                  } bg-[#6B8CBE] hover:bg-[#5A7BAD] text-white`}
                  title="Iniciar atendimento"
                >
                  <Stethoscope className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Atender</span>
                </Button>
                
                {/* Botão Encerrar Atendimento - sempre visível */}
                <Button 
                  onClick={() => {
                    realizarAgendamento.mutate({ id: agendamentoSelecionado.id }, {
                      onSuccess: () => setAgendamentoSelecionado((prev: any) => prev ? { ...prev, status: "Realizado" } : null)
                    });
                  }}
                  size="sm"
                  disabled={agendamentoSelecionado.status !== "Em atendimento"}
                  className={`${
                    agendamentoSelecionado.status !== "Em atendimento" ? "opacity-50 cursor-not-allowed" : ""
                  } bg-[#374151] hover:bg-[#1F2937] text-white`}
                  title="Encerrar o atendimento"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Encerrar</span>
                </Button>
                
                {/* Botão Continuar - sempre visível */}
                <Button 
                  onClick={() => {
                    setModalDetalhesAberto(false);
                    setLocation(`/prontuario/${agendamentoSelecionado.pacienteId}?secao=evolucoes`);
                  }}
                  size="sm"
                  disabled={agendamentoSelecionado.status !== "Em atendimento" || !agendamentoSelecionado.pacienteId}
                  className={`${
                    agendamentoSelecionado.status !== "Em atendimento" ? "opacity-50 cursor-not-allowed" : ""
                  } bg-[#5A7DB0] hover:bg-[#4A6A9A] text-white`}
                  title="Continuar evolução do prontuário"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Continuar</span>
                </Button>
              </div>
              
              {/* Linha 2: Ações secundárias - TODOS VISÍVEIS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão Reagendar - sempre visível */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovaData(new Date(agendamentoSelecionado.dataHoraInicio).toISOString().split("T")[0]);
                    setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
                    setNovaHoraFim(formatarHora(agendamentoSelecionado.dataHoraFim));
                    setModalReagendarAberto(true);
                  }}
                  disabled={!["Agendado", "Confirmado"].includes(agendamentoSelecionado.status)}
                  className={`${
                    !["Agendado", "Confirmado"].includes(agendamentoSelecionado.status) ? "opacity-50 cursor-not-allowed" : ""
                  } border-gray-300 text-gray-600`}
                  title="Reagendar para outra data/hora"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Reagendar</span>
                </Button>
                
                {/* Botão Faltou - sempre visível */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    marcarFalta.mutate({ id: agendamentoSelecionado.id }, {
                      onSuccess: () => {
                        setAgendamentoSelecionado((prev: any) => prev ? { ...prev, status: "Faltou" } : null);
                        toast.success("Paciente marcado como faltou");
                      }
                    });
                  }}
                  disabled={!["Agendado", "Confirmado"].includes(agendamentoSelecionado.status)}
                  className={`${
                    !["Agendado", "Confirmado"].includes(agendamentoSelecionado.status) ? "opacity-50 cursor-not-allowed" : ""
                  } border-orange-300 text-orange-600 hover:bg-orange-50`}
                  title="Marcar que o paciente faltou"
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Faltou</span>
                </Button>
                
                {/* Botão Cancelar - sempre visível */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setModalCancelarAberto(true)}
                  disabled={!["Agendado", "Confirmado", "Aguardando"].includes(agendamentoSelecionado.status)}
                  className={`${
                    !["Agendado", "Confirmado", "Aguardando"].includes(agendamentoSelecionado.status) ? "opacity-50 cursor-not-allowed" : ""
                  } border-red-300 text-red-600 hover:bg-red-50`}
                  title="Cancelar este agendamento"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Cancelar</span>
                </Button>
                
                {/* Botão Agendar Próxima Consulta - sempre visível */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalDetalhesAberto(false);
                    setNovoAgendamento(prev => ({
                      ...prev,
                      pacienteId: agendamentoSelecionado.pacienteId,
                      pacienteNome: agendamentoSelecionado.pacienteNome || "",
                      tipoCompromisso: "Consulta",
                      local: agendamentoSelecionado.local || "Consultório",
                    }));
                    setBuscaPaciente(agendamentoSelecionado.pacienteNome || "");
                    setModalNovoAberto(true);
                    toast.info("Selecione a data e horário para a próxima consulta");
                  }}
                  disabled={!agendamentoSelecionado.pacienteId}
                  className={`${
                    !agendamentoSelecionado.pacienteId ? "opacity-50 cursor-not-allowed" : ""
                  } border-[#6B8CBE] text-[#6B8CBE] hover:bg-[#6B8CBE]/10`}
                  title="Agendar próxima consulta para este paciente"
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Próxima Consulta</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              O agendamento será marcado como cancelado, mas permanecerá visível no histórico (transparente).
            </p>
            <div>
              <Label>Motivo do Cancelamento</Label>
              <Textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelarAberto(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={cancelarAgendamento.isPending}>
              {cancelarAgendamento.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reagendar */}
      <Dialog open={modalReagendarAberto} onOpenChange={setModalReagendarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              O agendamento original ficará marcado como "Reagendado" (transparente) e um novo será criado.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nova Data</Label>
                <Input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={novaHoraInicio}
                  onChange={(e) => setNovaHoraInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={novaHoraFim}
                  onChange={(e) => setNovaHoraFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalReagendarAberto(false)}>
              Voltar
            </Button>
            <Button onClick={handleReagendar} disabled={reagendarAgendamento.isPending}>
              {reagendarAgendamento.isPending ? "Reagendando..." : "Confirmar Reagendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
