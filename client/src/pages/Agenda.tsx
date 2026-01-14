import { useState, useMemo, useEffect } from "react";
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
  Loader2
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

// Ícones de status para consultas
const ICONES_STATUS_CONSULTA: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "Agendado": { icon: CalendarCheck, color: "text-blue-500", label: "Agendada" },
  "Confirmado": { icon: UserCheck, color: "text-green-500", label: "Confirmada" },
  "Aguardando": { icon: CalendarClock, color: "text-yellow-500", label: "Aguardando" },
  "Em atendimento": { icon: Stethoscope, color: "text-purple-500", label: "Em Consulta" },
  "Realizado": { icon: CheckCircle2, color: "text-gray-500", label: "Finalizada" },
  "Cancelado": { icon: XCircle, color: "text-red-400", label: "Cancelada" },
  "Reagendado": { icon: RefreshCw, color: "text-amber-500", label: "Reagendada" },
  "Faltou": { icon: Ban, color: "text-orange-500", label: "Faltou" },
};

// Ícones de status para cirurgias
const ICONES_STATUS_CIRURGIA: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "Agendado": { icon: CalendarCheck, color: "text-blue-500", label: "Agendada" },
  "Autorizada": { icon: FileCheck, color: "text-teal-500", label: "Autorizada" },
  "Confirmado": { icon: ClipboardCheck, color: "text-green-500", label: "Confirmada" },
  "Realizado": { icon: Scissors, color: "text-gray-500", label: "Realizada" },
  "Cancelado": { icon: XCircle, color: "text-red-400", label: "Cancelada" },
};

// Função para obter ícone de status
function getStatusIcon(status: string, tipo: string) {
  if (tipo === "Cirurgia") {
    return ICONES_STATUS_CIRURGIA[status] || ICONES_STATUS_CONSULTA[status];
  }
  return ICONES_STATUS_CONSULTA[status];
}

export default function Agenda() {
  // toast from sonner
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">("semana");
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string | null>(null);
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
    pacienteTelefone: "",
    pacienteCpf: "",
    pacienteSeguro: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    local: "",
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
  // Usar staleTime de 30 segundos para cache
  const { data: agendamentos, refetch: refetchAgendamentos, error: agendamentosError, isLoading: agendamentosLoading } = trpc.agenda.list.useQuery(
    {
      dataInicio: periodo.inicio,
      dataFim: periodo.fim,
      incluirCancelados: true,
    },
    {
      staleTime: 30 * 1000, // Cache de 30 segundos
      gcTime: 5 * 60 * 1000, // Manter em cache por 5 minutos
    }
  );
  
  

  const { data: bloqueios, refetch: refetchBloqueios } = trpc.bloqueios.list.useQuery(
    {
      dataInicio: periodo.inicio,
      dataFim: periodo.fim,
      incluirCancelados: true,
    },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  );

  const { data: nextAgendamentoId } = trpc.agenda.getNextId.useQuery();
  const { data: nextBloqueioId } = trpc.bloqueios.getNextId.useQuery();
  const { data: profissionais } = trpc.profissionais.list.useQuery(
    undefined,
    {
      staleTime: 60 * 1000, // Cache de 1 minuto
      gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
    }
  );
  
  // Buscar a duração de slot do profissional selecionado
  const profissionalAtual = profissionais?.find(p => String(p.id) === profissionalSelecionado);
  const duracaoSlotProfissional = profissionalAtual?.duracaoSlotAgenda || 30;

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

  // Helpers
  const resetNovoAgendamento = () => {
    setNovoAgendamento({
      tipoCompromisso: "Consulta",
      pacienteId: null,
      pacienteNome: "",
      pacienteTelefone: "",
      pacienteCpf: "",
      pacienteSeguro: "",
      data: "",
      horaInicio: "",
      horaFim: "",
      local: "",
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

  // Gerar slots baseado na duração configurada do profissional
  // Se não houver profissional selecionado, usar 30 minutos como padrão
  const duracaoSlot = duracaoSlotProfissional || 30;
  
  // Gerar array de slots (hora:minuto) de 7:00 até 20:00
  const slots = useMemo(() => {
    const slotsArray = [];
    let hora = 7;
    let minuto = 0;
    
    while (hora < 20 || (hora === 20 && minuto === 0)) {
      slotsArray.push({ hora, minuto, label: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}` });
      minuto += duracaoSlot;
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60);
        minuto = minuto % 60;
      }
    }
    return slotsArray;
  }, [duracaoSlot]);
  
  // Manter compatibilidade com código existente que usa apenas horas
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
    
    // Preparar dados do novo paciente se necessário
    const novoPaciente = !novoAgendamento.pacienteId && novoAgendamento.pacienteNome && novoAgendamento.tipoCompromisso !== "Reunião"
      ? {
          nome: novoAgendamento.pacienteNome,
          telefone: novoAgendamento.pacienteTelefone || undefined,
          email: undefined,
          cpf: novoAgendamento.pacienteCpf || undefined,
          convenio: novoAgendamento.pacienteSeguro || undefined,
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

  const selecionarPaciente = (paciente: any) => {
    setNovoAgendamento({
      ...novoAgendamento,
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
    });
    setBuscaPaciente(paciente.nome);
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
    
    return (
      <div
        key={ag.id}
        onClick={() => abrirDetalhes(ag)}
        style={{ height: `${alturaPixels}px`, minHeight: '16px' }}
        className={`
          px-1 py-0.5 rounded cursor-pointer text-white text-[10px] leading-tight overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          ${isCancelado ? "opacity-40 line-through" : "hover:opacity-90"}
          ${CORES_STATUS[ag.status]}
        `}
        title={statusInfo?.label || ag.status}
      >
        <div className="font-medium truncate flex items-center gap-0.5">
          {StatusIcon && <StatusIcon className="w-3 h-3 flex-shrink-0" />}
          <span>{formatarHora(ag.dataHoraInicio)} - {ag.pacienteNome || ag.titulo || ag.tipoCompromisso}</span>
        </div>
        {/* Local removido da exibição principal - disponível ao clicar no agendamento */}
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
          {/* Filtro de Profissional */}
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Profissional:</Label>
            <Select value={profissionalSelecionado || "all"} onValueChange={(v) => setProfissionalSelecionado(v === "all" ? null : v)}>
              <SelectTrigger className="h-7 w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {profissionais?.map((prof: any) => (
                  <SelectItem key={prof.id} value={String(prof.id)}>
                    {prof.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {slots.map((slot) => (
                <div key={`${slot.hora}-${slot.minuto}`} className="grid grid-cols-8 border-b h-12">
                  <div className="px-0.5 py-0.5 text-center text-xs text-muted-foreground border-r bg-muted flex items-center justify-center min-w-[40px]">
                    {slot.label}
                  </div>
                  {diasSemana.map((dia, i) => {
                    // Usar data local para a chave (YYYY-MM-DD)
                    const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
                    const agendamentosDia = agendamentosPorDia[chave] || [];
                    const agendamentosSlot = agendamentosDia.filter((ag: any) => {
                      const dataAg = new Date(ag.dataHoraInicio);
                      const horaAg = dataAg.getHours();
                      const minutosAg = dataAg.getMinutes();
                      return horaAg === slot.hora && minutosAg === slot.minuto;
                    });
                    const feriado = getFeriado(dia);
                    const isHoje = dia.toDateString() === new Date().toDateString();
                    
                    return (
                      <div 
                        key={i} 
                        className={`px-0.5 py-0 border-r overflow-hidden ${
                          isHoje ? "bg-blue-50/50" : feriado ? "bg-amber-50" : ""
                        }`}
                      >
                        {agendamentosSlot.map(renderAgendamento)}
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

                return (
                  <div key={hora} className="flex gap-4 min-h-[50px] border-b pb-2">
                    <div className="w-16 text-sm text-muted-foreground font-medium">
                      {hora.toString().padStart(2, "0")}:00
                    </div>
                    <div className="flex-1">
                      {agendamentosHora.map((ag: any) => (
                        <div
                          key={ag.id}
                          onClick={() => abrirDetalhes(ag)}
                          className={`
                            p-3 rounded cursor-pointer text-white mb-2
                            ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
                            ${ag.status === "Cancelado" || ag.status === "Reagendado" ? "opacity-40" : "hover:opacity-90"}
                          `}
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
                      ))}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Compromisso</Label>
              <Select 
                value={novoAgendamento.tipoCompromisso} 
                onValueChange={(v) => setNovoAgendamento({...novoAgendamento, tipoCompromisso: v as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROMISSO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
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

            {/* Campos de novo paciente - aparecem quando paciente é criado automaticamente */}
            {!novoAgendamento.pacienteId && novoAgendamento.pacienteNome && novoAgendamento.tipoCompromisso !== "Reunião" && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900">Dados do novo paciente</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      type="tel"
                      value={novoAgendamento.pacienteTelefone}
                      onChange={(e) => setNovoAgendamento({...novoAgendamento, pacienteTelefone: e.target.value})}
                      placeholder="(XX) XXXXX-XXXX"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input
                      type="text"
                      value={novoAgendamento.pacienteCpf}
                      onChange={(e) => setNovoAgendamento({...novoAgendamento, pacienteCpf: e.target.value})}
                      placeholder="XXX.XXX.XXX-XX"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Seguro</Label>
                    <Select 
                      value={novoAgendamento.pacienteSeguro} 
                      onValueChange={(v) => setNovoAgendamento({...novoAgendamento, pacienteSeguro: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNIMED">UNIMED</SelectItem>
                        <SelectItem value="IPE SAUDE">IPE SAUDE</SelectItem>
                        <SelectItem value="PARTICULAR">PARTICULAR</SelectItem>
                        <SelectItem value="CASSI">CASSI</SelectItem>
                        <SelectItem value="BRADESCO SAUDE">BRADESCO SAUDE</SelectItem>
                        <SelectItem value="SUL AMERICA">SUL AMERICA</SelectItem>
                        <SelectItem value="SAUDE CAIXA">SAUDE CAIXA</SelectItem>
                        <SelectItem value="SAUDE PAS">SAUDE PAS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, horaInicio: e.target.value})}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={novoAgendamento.horaFim}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, horaFim: e.target.value})}
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

      {/* Modal Detalhes do Agendamento */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${CORES_TIPO[agendamentoSelecionado?.tipoCompromisso] || "bg-gray-500"}`}></div>
              {agendamentoSelecionado?.tipoCompromisso}
            </DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="font-medium">{agendamentoSelecionado.idAgendamento}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{agendamentoSelecionado.status}</p>
                </div>
              </div>

              {agendamentoSelecionado.pacienteNome && (
                <div>
                  <Label className="text-muted-foreground">Paciente</Label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {agendamentoSelecionado.pacienteNome}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(agendamentoSelecionado.dataHoraInicio).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatarHora(agendamentoSelecionado.dataHoraInicio)} - {formatarHora(agendamentoSelecionado.dataHoraFim)}
                  </p>
                </div>
                {agendamentoSelecionado.local && (
                  <div>
                    <Label className="text-muted-foreground">Local</Label>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {agendamentoSelecionado.local}
                    </p>
                  </div>
                )}
              </div>

              {agendamentoSelecionado.descricao && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p>{agendamentoSelecionado.descricao}</p>
                </div>
              )}

              {agendamentoSelecionado.reagendadoDe && (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Este agendamento foi reagendado de outro compromisso anterior.
                  </p>
                </div>
              )}

              {agendamentoSelecionado.status === "Cancelado" && (
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-800">
                    <strong>Cancelado em:</strong> {new Date(agendamentoSelecionado.canceladoEm).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-red-800">
                    <strong>Motivo:</strong> {agendamentoSelecionado.motivoCancelamento}
                  </p>
                </div>
              )}

              {/* Ações baseadas no status */}
              {agendamentoSelecionado.status === "Agendado" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => confirmarAgendamento.mutate({ id: agendamentoSelecionado.id })}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNovaData(new Date(agendamentoSelecionado.dataHoraInicio).toISOString().split("T")[0]);
                      setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
                      setNovaHoraFim(formatarHora(agendamentoSelecionado.dataHoraFim));
                      setModalReagendarAberto(true);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reagendar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600"
                    onClick={() => setModalCancelarAberto(true)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}

              {agendamentoSelecionado.status === "Confirmado" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    size="sm"
                    onClick={() => realizarAgendamento.mutate({ id: agendamentoSelecionado.id })}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Marcar como Realizado
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => marcarFalta.mutate({ id: agendamentoSelecionado.id })}
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Paciente Faltou
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNovaData(new Date(agendamentoSelecionado.dataHoraInicio).toISOString().split("T")[0]);
                      setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
                      setNovaHoraFim(formatarHora(agendamentoSelecionado.dataHoraFim));
                      setModalReagendarAberto(true);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reagendar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600"
                    onClick={() => setModalCancelarAberto(true)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
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
