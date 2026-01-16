import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit3,
  // Ícones de status para consultas
  CalendarCheck,
  CalendarClock,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  XCircle,
  LogOut,
  ArrowRightLeft,
  // Ícones de status para cirurgias
  FileCheck,
  ClipboardCheck,
  Scissors,
  // Ícones gerais
  Search,
  Loader2,
  Building2,
  CreditCard
} from "lucide-react";

// ============================================
// CONSTANTES
// ============================================

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

// Status de agendamento com ícones
const STATUS_AGENDAMENTO = [
  { value: "Agendado", label: "Agendado", icon: CalendarCheck, color: "text-blue-500", bgColor: "bg-blue-500" },
  { value: "Confirmado", label: "Confirmado", icon: UserCheck, color: "text-green-500", bgColor: "bg-green-500" },
  { value: "Aguardando", label: "Aguardando", icon: CalendarClock, color: "text-yellow-500", bgColor: "bg-yellow-500" },
  { value: "Em atendimento", label: "Em atendimento", icon: Stethoscope, color: "text-purple-500", bgColor: "bg-purple-500" },
  { value: "Encerrado", label: "Encerrado", icon: CheckCircle2, color: "text-gray-500", bgColor: "bg-gray-500" },
  { value: "Falta", label: "Falta", icon: Ban, color: "text-orange-500", bgColor: "bg-orange-500" },
  { value: "Transferido", label: "Transferido", icon: ArrowRightLeft, color: "text-amber-500", bgColor: "bg-amber-500" },
  { value: "Cancelado", label: "Cancelado", icon: XCircle, color: "text-red-400", bgColor: "bg-red-400" },
] as const;

// Convênios disponíveis (pode ser carregado do backend)
const CONVENIOS = [
  "Particular",
  "Cortesia",
  "Unimed",
  "Bradesco Saúde",
  "SulAmérica",
  "Amil",
  "Porto Seguro",
  "Golden Cross",
  "Cassi",
  "Geap",
  "IPE Saúde",
  "Outro",
];

// Cores por tipo de compromisso (estilo Google Calendar)
const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-blue-500",
  "Cirurgia": "bg-red-500",
  "Visita internado": "bg-purple-500",
  "Procedimento em consultório": "bg-orange-500",
  "Exame": "bg-green-500",
  "Reunião": "bg-yellow-600",
  "Bloqueio": "bg-gray-500",
};

// Feriados nacionais do Brasil (fixos e móveis para 2025-2027)
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
  
  const chaveFixa = `${mes}-${dia}`;
  if (FERIADOS_FIXOS[chaveFixa]) {
    return FERIADOS_FIXOS[chaveFixa];
  }
  
  const chaveMovel = `${ano}-${mes}-${dia}`;
  if (FERIADOS_MOVEIS[chaveMovel]) {
    return FERIADOS_MOVEIS[chaveMovel];
  }
  
  return null;
}

// Função para obter informações do status
function getStatusInfo(status: string) {
  return STATUS_AGENDAMENTO.find(s => s.value === status) || STATUS_AGENDAMENTO[0];
}

// ============================================
// CONFIGURAÇÕES DE HORÁRIO (ESTILO GOOGLE CALENDAR)
// ============================================

// Altura de cada hora em pixels (inspirado no Google Calendar)
const HORA_ALTURA_PX = 60; // 60px por hora = 1px por minuto

// Duração padrão de consulta em minutos
const DURACAO_CONSULTA_PADRAO = 30;

// Opções de intervalo de horas para o usuário escolher
const OPCOES_INTERVALO_HORAS = [
  { label: "Horário comercial (7h - 20h)", inicio: 7, fim: 20 },
  { label: "Dia completo (0h - 24h)", inicio: 0, fim: 24 },
  { label: "Manhã (6h - 12h)", inicio: 6, fim: 12 },
  { label: "Tarde (12h - 18h)", inicio: 12, fim: 18 },
  { label: "Noite (18h - 24h)", inicio: 18, fim: 24 },
  { label: "Personalizado", inicio: -1, fim: -1 },
];

// ============================================
// TIPOS
// ============================================

interface Delegado {
  id: number;
  nome: string;
  email: string;
  permissao: "visualizar" | "editar";
  dataInicio: Date;
  dataFim?: Date;
  ativo: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Agenda() {
  // Estados principais
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia" | "mes">("semana");
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalDelegadosAberto, setModalDelegadosAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHoraInicio, setNovaHoraInicio] = useState("");
  const [novaHoraFim, setNovaHoraFim] = useState("");

  // ============================================
  // CONFIGURAÇÕES DE HORÁRIO DO USUÁRIO
  // ============================================
  const [configHorario, setConfigHorario] = useState({
    horaInicio: 0,  // Padrão: 24 horas (conforme solicitado)
    horaFim: 24,
    intervaloSelecionado: "Dia completo (0h - 24h)",
    duracaoConsultaPadrao: DURACAO_CONSULTA_PADRAO,
    localConsultaPadrao: "Consultório",
  });

  // ============================================
  // SISTEMA DE DELEGADOS
  // ============================================
  const [delegados, setDelegados] = useState<Delegado[]>([
    // Exemplo de delegados (normalmente viria do backend)
  ]);
  const [novoDelegado, setNovoDelegado] = useState({
    email: "",
    permissao: "visualizar" as "visualizar" | "editar",
  });

  // Gerar array de horários baseado na configuração do usuário
  const horarios = useMemo(() => {
    const { horaInicio, horaFim } = configHorario;
    const qtdHoras = horaFim - horaInicio;
    return Array.from({ length: qtdHoras }, (_, i) => horaInicio + i);
  }, [configHorario]);

  // Referência para scroll automático para hora atual
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll para hora atual ao carregar
  useEffect(() => {
    if (scrollContainerRef.current && visualizacao !== "mes") {
      const horaAtual = new Date().getHours();
      const { horaInicio } = configHorario;
      if (horaAtual >= horaInicio) {
        const offsetTop = (horaAtual - horaInicio) * HORA_ALTURA_PX;
        scrollContainerRef.current.scrollTop = Math.max(0, offsetTop - 100);
      }
    }
  }, [visualizacao, configHorario]);

  // Form state para novo agendamento
  const [novoAgendamento, setNovoAgendamento] = useState({
    tipoCompromisso: "Consulta" as typeof TIPOS_COMPROMISSO[number],
    pacienteId: null as number | null,
    pacienteNome: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    local: "Consultório", // Padrão para consultas
    titulo: "",
    descricao: "",
    convenio: "Particular", // Novo campo
    status: "Agendado", // Novo campo
  });

  // Efeito para calcular automaticamente hora fim quando hora início muda (para consultas)
  useEffect(() => {
    if (novoAgendamento.tipoCompromisso === "Consulta" && novoAgendamento.horaInicio) {
      const [horas, minutos] = novoAgendamento.horaInicio.split(":").map(Number);
      const dataInicio = new Date();
      dataInicio.setHours(horas, minutos, 0, 0);
      dataInicio.setMinutes(dataInicio.getMinutes() + configHorario.duracaoConsultaPadrao);
      
      const horaFim = `${String(dataInicio.getHours()).padStart(2, "0")}:${String(dataInicio.getMinutes()).padStart(2, "0")}`;
      setNovoAgendamento(prev => ({ ...prev, horaFim }));
    }
  }, [novoAgendamento.horaInicio, novoAgendamento.tipoCompromisso, configHorario.duracaoConsultaPadrao]);

  // Efeito para definir local padrão quando tipo muda para Consulta
  useEffect(() => {
    if (novoAgendamento.tipoCompromisso === "Consulta") {
      setNovoAgendamento(prev => ({ 
        ...prev, 
        local: configHorario.localConsultaPadrao,
        convenio: prev.convenio || "Particular",
        status: prev.status || "Agendado",
      }));
    }
  }, [novoAgendamento.tipoCompromisso, configHorario.localConsultaPadrao]);

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

  // Busca de pacientes
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [buscaPacienteDebounced, setBuscaPacienteDebounced] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [pacienteSelecionadoInfo, setPacienteSelecionadoInfo] = useState<any>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaPacienteDebounced(buscaPaciente);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaPaciente]);
  
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

  const cancelarAgendamentoMutation = trpc.agenda.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      setModalCancelarAberto(false);
      setModalDetalhesAberto(false);
      refetchAgendamentos();
      setMotivoCancelamento("");
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });

  const reagendarAgendamentoMutation = trpc.agenda.reagendar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento reagendado!");
      setModalReagendarAberto(false);
      setModalDetalhesAberto(false);
      refetchAgendamentos();
    },
    onError: (error) => {
      toast.error(`Erro ao reagendar: ${error.message}`);
    },
  });

  const confirmarAgendamentoMutation = trpc.agenda.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento confirmado!");
      refetchAgendamentos();
    },
    onError: (error) => {
      toast.error(`Erro ao confirmar: ${error.message}`);
    },
  });

  const realizarAgendamentoMutation = trpc.agenda.realizar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento marcado como realizado!");
      refetchAgendamentos();
    },
    onError: (error) => {
      toast.error(`Erro ao marcar como realizado: ${error.message}`);
    },
  });

  const marcarFaltaMutation = trpc.agenda.marcarFalta.useMutation({
    onSuccess: () => {
      toast.success("Falta registrada!");
      refetchAgendamentos();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar falta: ${error.message}`);
    },
  });

  // Usar resultados da busca rápida otimizada
  const pacientesFiltrados = pacientesSearch || [];

  // Agrupar agendamentos por dia
  const agendamentosPorDia = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    
    (agendamentos || []).forEach((ag: any) => {
      const data = new Date(ag.dataHoraInicio);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ag);
    });
    
    return mapa;
  }, [agendamentos]);

  // Dias da semana
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

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  const formatarHora = (dataHora: string | Date) => {
    const data = new Date(dataHora);
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatarDataLocal = (data: Date): string => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  const navegarPeriodo = (direcao: number) => {
    const novaData = new Date(dataAtual);
    if (visualizacao === "dia") {
      novaData.setDate(novaData.getDate() + direcao);
    } else if (visualizacao === "semana") {
      novaData.setDate(novaData.getDate() + direcao * 7);
    } else {
      novaData.setMonth(novaData.getMonth() + direcao);
    }
    setDataAtual(novaData);
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  const getTituloPeriodo = () => {
    if (visualizacao === "dia") {
      return dataAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } else if (visualizacao === "semana") {
      const inicio = new Date(periodo.inicio);
      const fim = new Date(periodo.fim);
      return `${inicio.getDate()} - ${fim.getDate()} de ${fim.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    } else {
      return dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }
  };

  const resetNovoAgendamento = () => {
    setNovoAgendamento({
      tipoCompromisso: "Consulta",
      pacienteId: null,
      pacienteNome: "",
      data: "",
      horaInicio: "",
      horaFim: "",
      local: configHorario.localConsultaPadrao,
      titulo: "",
      descricao: "",
      convenio: "Particular",
      status: "Agendado",
    });
    setBuscaPaciente("");
    setPacienteSelecionadoInfo(null);
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

  const abrirDetalhes = (ag: any) => {
    setAgendamentoSelecionado(ag);
    setModalDetalhesAberto(true);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleCriarAgendamento = () => {
    if (!novoAgendamento.data || !novoAgendamento.horaInicio || !novoAgendamento.horaFim) {
      toast.error("Preencha data e horários");
      return;
    }
    
    if (novoAgendamento.tipoCompromisso !== "Reunião" && !novoAgendamento.pacienteId && !novoAgendamento.pacienteNome) {
      toast.error("Selecione um paciente ou digite o nome para criar um novo");
      return;
    }

    const dataHoraInicio = new Date(`${novoAgendamento.data}T${novoAgendamento.horaInicio}`);
    const dataHoraFim = new Date(`${novoAgendamento.data}T${novoAgendamento.horaFim}`);
    
    const novoPaciente = !novoAgendamento.pacienteId && novoAgendamento.pacienteNome && novoAgendamento.tipoCompromisso !== "Reunião"
      ? {
          nome: novoAgendamento.pacienteNome,
          telefone: undefined,
          email: undefined,
          cpf: undefined,
          convenio: novoAgendamento.convenio,
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
      convenio: novoAgendamento.convenio || null,
      status: novoAgendamento.status,
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
    if (!motivoCancelamento.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }
    cancelarAgendamentoMutation.mutate({
      id: agendamentoSelecionado.id,
      motivo: motivoCancelamento,
    });
  };

  const handleReagendar = () => {
    if (!novaData || !novaHoraInicio || !novaHoraFim) {
      toast.error("Preencha a nova data e horários");
      return;
    }
    reagendarAgendamentoMutation.mutate({
      id: agendamentoSelecionado.id,
      novaDataInicio: new Date(`${novaData}T${novaHoraInicio}`),
      novaDataFim: new Date(`${novaData}T${novaHoraFim}`),
    });
  };

  const handleConfirmar = () => {
    confirmarAgendamentoMutation.mutate({ id: agendamentoSelecionado.id });
  };

  const handleRealizar = () => {
    realizarAgendamentoMutation.mutate({ id: agendamentoSelecionado.id });
  };

  const handleMarcarFalta = () => {
    marcarFaltaMutation.mutate({ id: agendamentoSelecionado.id });
  };

  const handleAdicionarDelegado = () => {
    if (!novoDelegado.email) {
      toast.error("Informe o e-mail do delegado");
      return;
    }
    // Aqui seria uma mutation para o backend
    const novo: Delegado = {
      id: Date.now(),
      nome: novoDelegado.email.split("@")[0],
      email: novoDelegado.email,
      permissao: novoDelegado.permissao,
      dataInicio: new Date(),
      ativo: true,
    };
    setDelegados([...delegados, novo]);
    setNovoDelegado({ email: "", permissao: "visualizar" });
    toast.success("Delegado adicionado com sucesso!");
  };

  const handleRemoverDelegado = (id: number) => {
    setDelegados(delegados.filter(d => d.id !== id));
    toast.success("Delegado removido!");
  };

  // ============================================
  // FUNÇÃO PARA CALCULAR POSIÇÃO E ALTURA DO EVENTO
  // (Estilo Google Calendar - posicionamento preciso por minuto)
  // ============================================

  const calcularPosicaoEvento = (dataHoraInicio: Date, dataHoraFim: Date) => {
    const horaInicio = dataHoraInicio.getHours();
    const minutoInicio = dataHoraInicio.getMinutes();
    const horaFim = dataHoraFim.getHours();
    const minutoFim = dataHoraFim.getMinutes();

    // Calcular posição top relativa à hora de início da grade
    const minutosDesdeInicioDia = (horaInicio - configHorario.horaInicio) * 60 + minutoInicio;
    const top = minutosDesdeInicioDia; // 1px por minuto

    // Calcular duração em minutos
    const duracaoMinutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
    const altura = Math.max(15, duracaoMinutos); // Mínimo 15px

    return { top, altura };
  };

  // ============================================
  // FUNÇÃO PARA CALCULAR SOBREPOSIÇÕES
  // ============================================

  const calcularSobreposicoes = (agendamentosDia: any[]) => {
    // Filtrar apenas eventos ativos (não cancelados/faltou) para cálculo de colisão
    const eventosAtivos = agendamentosDia.filter(ag => 
      !["Cancelado", "Reagendado", "Falta"].includes(ag.status)
    );
    
    // Ordenar por hora de início
    const ordenados = [...eventosAtivos].sort((a, b) => 
      new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime()
    );

    // Mapa de posições: { id: { coluna, totalColunas } }
    const posicoes: Record<number, { coluna: number; totalColunas: number }> = {};
    
    // Grupos de eventos que se sobrepõem
    const grupos: any[][] = [];
    let grupoAtual: any[] = [];
    let fimGrupo = 0;

    ordenados.forEach((evento) => {
      const inicio = new Date(evento.dataHoraInicio).getTime();
      const fim = new Date(evento.dataHoraFim || evento.dataHoraInicio).getTime();

      if (grupoAtual.length === 0 || inicio < fimGrupo) {
        // Adiciona ao grupo atual
        grupoAtual.push(evento);
        fimGrupo = Math.max(fimGrupo, fim);
      } else {
        // Novo grupo
        if (grupoAtual.length > 0) grupos.push(grupoAtual);
        grupoAtual = [evento];
        fimGrupo = fim;
      }
    });
    if (grupoAtual.length > 0) grupos.push(grupoAtual);

    // Calcular posições dentro de cada grupo
    grupos.forEach((grupo) => {
      const totalColunas = grupo.length;
      grupo.forEach((evento, idx) => {
        posicoes[evento.id] = { coluna: idx, totalColunas };
      });
    });

    // Adicionar eventos cancelados/falta com posição padrão
    agendamentosDia.forEach(ag => {
      if (!posicoes[ag.id]) {
        posicoes[ag.id] = { coluna: 0, totalColunas: 1 };
      }
    });

    return posicoes;
  };

  // ============================================
  // RENDERIZAÇÃO DE EVENTO (ESTILO GOOGLE CALENDAR)
  // ============================================

  const renderAgendamentoGoogleStyle = (
    ag: any, 
    isWeekView: boolean = false,
    posicaoInfo?: { coluna: number; totalColunas: number }
  ) => {
    const isCanceladoOuFalta = ["Cancelado", "Reagendado", "Falta"].includes(ag.status);
    const statusInfo = getStatusInfo(ag.status);
    const StatusIcon = statusInfo?.icon;
    
    const inicio = new Date(ag.dataHoraInicio);
    const fim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(inicio.getTime() + 30 * 60000);
    const { top, altura } = calcularPosicaoEvento(inicio, fim);

    // Verificar se o evento está dentro do intervalo visível
    const horaInicioEvento = inicio.getHours();
    if (horaInicioEvento < configHorario.horaInicio || horaInicioEvento >= configHorario.horaFim) {
      return null;
    }

    // Calcular largura e posição horizontal para eventos sobrepostos
    const { coluna = 0, totalColunas = 1 } = posicaoInfo || {};
    const larguraPercent = 100 / totalColunas;
    const leftPercent = coluna * larguraPercent;

    return (
      <div
        key={ag.id}
        onClick={() => abrirDetalhes(ag)}
        style={{ 
          position: 'absolute',
          top: `${top}px`,
          height: `${altura}px`,
          left: `calc(${leftPercent}% + 2px)`,
          width: `calc(${larguraPercent}% - 4px)`,
          minHeight: '18px',
          zIndex: isCanceladoOuFalta ? 5 : 10,
        }}
        className={`
          px-1.5 py-0.5 rounded-md cursor-pointer text-white text-xs leading-tight overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          ${isCanceladoOuFalta ? "opacity-30 bg-opacity-50" : "hover:opacity-90 shadow-sm"}
          transition-opacity duration-150
          border-l-2 ${statusInfo?.bgColor ? `border-l-${statusInfo.bgColor.replace('bg-', '')}` : 'border-l-blue-500'}
        `}
        title={`${formatarHora(ag.dataHoraInicio)} - ${formatarHora(fim)} | ${ag.pacienteNome || ag.titulo || ag.tipoCompromisso} | ${statusInfo?.label || ag.status}${ag.criadoPor ? ` | Criado por: ${ag.criadoPor}` : ''}`}
      >
        <div className="font-medium truncate flex items-center gap-0.5">
          {StatusIcon && <StatusIcon className="w-3 h-3 flex-shrink-0" />}
          <span className={`truncate ${isCanceladoOuFalta ? "line-through" : ""}`}>
            {isWeekView ? (
              <>
                {formatarHora(ag.dataHoraInicio)} {ag.pacienteNome?.split(" ")[0] || ag.titulo || ag.tipoCompromisso}
              </>
            ) : (
              <>
                {formatarHora(ag.dataHoraInicio)} - {ag.pacienteNome || ag.titulo || ag.tipoCompromisso}
              </>
            )}
          </span>
        </div>
        {altura >= 35 && ag.local && (
          <div className="text-[10px] opacity-80 truncate mt-0.5">{ag.local}</div>
        )}
        {altura >= 50 && ag.convenio && (
          <div className="text-[10px] opacity-70 truncate">{ag.convenio}</div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus compromissos e horários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setModalDelegadosAberto(true)} title="Gerenciar Delegados">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalConfigAberto(true)} title="Configurações da Agenda">
            <Settings className="w-4 h-4" />
          </Button>
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
            {Object.entries(CORES_TIPO).filter(([tipo]) => tipo !== "Bloqueio").map(([tipo, cor]) => (
              <div key={tipo} className="flex items-center gap-1" title={tipo}>
                <div className={`w-2 h-2 rounded ${cor}`}></div>
                <span className="hidden lg:inline">{tipo}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 ml-2" title="Cancelado/Falta">
              <div className="w-2 h-2 rounded bg-gray-400 opacity-30"></div>
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
        {Object.entries(CORES_TIPO).filter(([tipo]) => tipo !== "Bloqueio").map(([tipo, cor]) => (
          <div key={tipo} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded ${cor}`}></div>
            <span>{tipo}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 rounded bg-gray-400 opacity-30"></div>
          <span>Cancelado/Falta</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* VISUALIZAÇÃO SEMANA (ESTILO GOOGLE CALENDAR) */}
      {/* ============================================ */}
      {visualizacao === "semana" && (
        <Card>
          <CardContent className="p-0">
            {/* Cabeçalho com dias da semana */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-20">
              <div className="w-14 px-1 py-2 text-center text-xs font-medium border-r bg-muted">
                {/* Coluna de horários - mais estreita */}
              </div>
              {diasSemana.map((dia, i) => {
                const feriado = getFeriado(dia);
                const isHoje = dia.toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={i} 
                    className={`px-1 py-2 text-center text-xs font-medium border-r ${
                      isHoje ? "bg-blue-50" : feriado ? "bg-amber-100" : ""
                    }`}
                    title={feriado || undefined}
                  >
                    <div className="capitalize text-muted-foreground">{dia.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
                    <div className={`text-lg font-bold ${isHoje ? "bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}>
                      {dia.getDate()}
                    </div>
                    {feriado && (
                      <div className="text-[8px] text-amber-700 truncate" title={feriado}>
                        {feriado}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Grade de horários com scroll */}
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              <div className="grid grid-cols-8 relative">
                {/* Coluna de horários */}
                <div className="w-14 border-r bg-muted">
                  {horarios.map((hora) => (
                    <div 
                      key={hora} 
                      className="text-[10px] text-muted-foreground text-right pr-1 relative"
                      style={{ height: `${HORA_ALTURA_PX}px` }}
                    >
                      <span className="absolute -top-2 right-1">
                        {hora.toString().padStart(2, "0")}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Colunas dos dias */}
                {diasSemana.map((dia, i) => {
                  const chave = formatarDataLocal(dia);
                  const agendamentosDia = agendamentosPorDia[chave] || [];
                  const feriado = getFeriado(dia);
                  const isHoje = dia.toDateString() === new Date().toDateString();
                  
                  // Calcular sobreposições
                  const posicoes = calcularSobreposicoes(agendamentosDia);
                  
                  return (
                    <div 
                      key={i} 
                      className={`border-r relative ${
                        isHoje ? "bg-blue-50/30" : feriado ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {/* Linhas de hora */}
                      {horarios.map((hora) => (
                        <div 
                          key={hora}
                          className="border-b border-gray-100"
                          style={{ height: `${HORA_ALTURA_PX}px` }}
                        >
                          {/* Linha de meia hora */}
                          <div 
                            className="border-b border-gray-50"
                            style={{ height: `${HORA_ALTURA_PX / 2}px` }}
                          />
                        </div>
                      ))}
                      
                      {/* Eventos posicionados absolutamente */}
                      {agendamentosDia.map((ag) => renderAgendamentoGoogleStyle(ag, true, posicoes[ag.id]))}
                      
                      {/* Linha indicadora de hora atual */}
                      {isHoje && (() => {
                        const agora = new Date();
                        const horaAtual = agora.getHours();
                        const minutoAtual = agora.getMinutes();
                        if (horaAtual >= configHorario.horaInicio && horaAtual < configHorario.horaFim) {
                          const topAtual = (horaAtual - configHorario.horaInicio) * 60 + minutoAtual;
                          return (
                            <div 
                              className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                              style={{ top: `${topAtual}px` }}
                            >
                              <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* VISUALIZAÇÃO DIA (ESTILO GOOGLE CALENDAR) */}
      {/* ============================================ */}
      {visualizacao === "dia" && (
        <Card>
          <CardContent className="p-0">
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              <div className="flex relative">
                {/* Coluna de horários */}
                <div className="w-16 border-r bg-muted flex-shrink-0">
                  {horarios.map((hora) => (
                    <div 
                      key={hora} 
                      className="text-xs text-muted-foreground text-right pr-2 relative"
                      style={{ height: `${HORA_ALTURA_PX}px` }}
                    >
                      <span className="absolute -top-2 right-2">
                        {hora.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Área de eventos */}
                <div className="flex-1 relative">
                  {/* Linhas de hora */}
                  {horarios.map((hora) => (
                    <div 
                      key={hora}
                      className="border-b border-gray-100"
                      style={{ height: `${HORA_ALTURA_PX}px` }}
                    >
                      {/* Linha de meia hora */}
                      <div 
                        className="border-b border-gray-50"
                        style={{ height: `${HORA_ALTURA_PX / 2}px` }}
                      />
                    </div>
                  ))}
                  
                  {/* Eventos */}
                  {(() => {
                    const chave = formatarDataLocal(dataAtual);
                    const agendamentosDia = agendamentosPorDia[chave] || [];
                    const posicoes = calcularSobreposicoes(agendamentosDia);
                    return agendamentosDia.map((ag) => renderAgendamentoGoogleStyle(ag, false, posicoes[ag.id]));
                  })()}
                  
                  {/* Linha indicadora de hora atual */}
                  {dataAtual.toDateString() === new Date().toDateString() && (() => {
                    const agora = new Date();
                    const horaAtual = agora.getHours();
                    const minutoAtual = agora.getMinutes();
                    if (horaAtual >= configHorario.horaInicio && horaAtual < configHorario.horaFim) {
                      const topAtual = (horaAtual - configHorario.horaInicio) * 60 + minutoAtual;
                      return (
                        <div 
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                          style={{ top: `${topAtual}px` }}
                        >
                          <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* VISUALIZAÇÃO MÊS */}
      {/* ============================================ */}
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
                
                for (let i = 0; i < primeiroDiaSemana; i++) {
                  celulas.push(<div key={`empty-${i}`} className="p-2 min-h-[100px]"></div>);
                }
                
                for (let dia = 1; dia <= diasNoMes; dia++) {
                  const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia);
                  const chave = formatarDataLocal(data);
                  const agendamentosDia = agendamentosPorDia[chave] || [];
                  const isHoje = data.toDateString() === new Date().toDateString();
                  const feriado = getFeriado(data);
                  
                  // Ordenar por hora de início
                  const agendamentosOrdenados = [...agendamentosDia].sort((a, b) => 
                    new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime()
                  );
                  
                  celulas.push(
                    <div 
                      key={dia} 
                      className={`p-1 min-h-[100px] border rounded cursor-pointer hover:bg-gray-50 ${
                        isHoje ? "bg-blue-50 border-blue-300" : feriado ? "bg-amber-50 border-amber-200" : "border-gray-200"
                      }`}
                      onClick={() => {
                        setDataAtual(data);
                        setVisualizacao("dia");
                      }}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isHoje ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""
                      }`}>
                        {dia}
                      </div>
                      {feriado && (
                        <div className="text-[9px] text-amber-700 truncate mb-1" title={feriado}>
                          {feriado}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {agendamentosOrdenados.slice(0, 3).map((ag: any) => {
                          const isCanceladoOuFalta = ["Cancelado", "Reagendado", "Falta"].includes(ag.status);
                          const statusInfo = getStatusInfo(ag.status);
                          const StatusIcon = statusInfo?.icon;
                          return (
                            <div
                              key={ag.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDetalhes(ag);
                              }}
                              className={`
                                text-[10px] px-1 py-0.5 rounded cursor-pointer text-white truncate flex items-center gap-0.5
                                ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
                                ${isCanceladoOuFalta ? "opacity-30" : "hover:opacity-90"}
                              `}
                              title={`${formatarHora(ag.dataHoraInicio)} - ${ag.pacienteNome || ag.titulo || ag.tipoCompromisso} | ${statusInfo?.label}`}
                            >
                              {StatusIcon && <StatusIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                              <span className={isCanceladoOuFalta ? "line-through" : ""}>
                                {formatarHora(ag.dataHoraInicio)} {ag.pacienteNome?.split(" ")[0] || ag.tipoCompromisso}
                              </span>
                            </div>
                          );
                        })}
                        {agendamentosDia.length > 3 && (
                          <div className="text-[10px] text-muted-foreground font-medium">
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

      {/* ============================================ */}
      {/* MODAL CONFIGURAÇÕES DE HORÁRIO */}
      {/* ============================================ */}
      <Dialog open={modalConfigAberto} onOpenChange={setModalConfigAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações da Agenda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Intervalo de Horas Visíveis</Label>
              <Select
                value={configHorario.intervaloSelecionado}
                onValueChange={(value) => {
                  const opcao = OPCOES_INTERVALO_HORAS.find(o => o.label === value);
                  if (opcao && opcao.inicio !== -1) {
                    setConfigHorario(prev => ({
                      ...prev,
                      horaInicio: opcao.inicio,
                      horaFim: opcao.fim,
                      intervaloSelecionado: value,
                    }));
                  } else {
                    setConfigHorario(prev => ({
                      ...prev,
                      intervaloSelecionado: value,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {OPCOES_INTERVALO_HORAS.map((opcao) => (
                    <SelectItem key={opcao.label} value={opcao.label}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configHorario.intervaloSelecionado === "Personalizado" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Início</Label>
                  <Select
                    value={configHorario.horaInicio.toString()}
                    onValueChange={(value) => setConfigHorario(prev => ({
                      ...prev,
                      horaInicio: parseInt(value),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora Fim</Label>
                  <Select
                    value={configHorario.horaFim.toString()}
                    onValueChange={(value) => setConfigHorario(prev => ({
                      ...prev,
                      horaFim: parseInt(value),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((hora) => (
                        <SelectItem key={hora} value={hora.toString()}>
                          {hora.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <Label>Duração Padrão de Consulta (minutos)</Label>
              <Select
                value={configHorario.duracaoConsultaPadrao.toString()}
                onValueChange={(value) => setConfigHorario(prev => ({
                  ...prev,
                  duracaoConsultaPadrao: parseInt(value),
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {[15, 20, 30, 45, 60].map((min) => (
                    <SelectItem key={min} value={min.toString()}>
                      {min} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Local Padrão para Consultas</Label>
              <Select
                value={configHorario.localConsultaPadrao}
                onValueChange={(value) => setConfigHorario(prev => ({
                  ...prev,
                  localConsultaPadrao: value,
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {LOCAIS.map((local) => (
                    <SelectItem key={local} value={local}>
                      {local}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Exibindo horários de <strong>{configHorario.horaInicio.toString().padStart(2, "0")}:00</strong> até <strong>{configHorario.horaFim.toString().padStart(2, "0")}:00</strong></p>
              <p className="mt-1">Total: {configHorario.horaFim - configHorario.horaInicio} horas</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalConfigAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL DELEGADOS */}
      {/* ============================================ */}
      <Dialog open={modalDelegadosAberto} onOpenChange={setModalDelegadosAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Delegados da Agenda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delegados podem visualizar ou editar sua agenda. Todas as alterações são rastreadas.
            </p>

            {/* Adicionar novo delegado */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="E-mail do delegado"
                  value={novoDelegado.email}
                  onChange={(e) => setNovoDelegado({ ...novoDelegado, email: e.target.value })}
                />
              </div>
              <Select
                value={novoDelegado.permissao}
                onValueChange={(value: "visualizar" | "editar") => setNovoDelegado({ ...novoDelegado, permissao: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="visualizar">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Visualizar
                    </div>
                  </SelectItem>
                  <SelectItem value="editar">
                    <div className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAdicionarDelegado}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Lista de delegados */}
            <div className="space-y-2">
              <Label>Delegados Ativos</Label>
              {delegados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum delegado cadastrado
                </p>
              ) : (
                delegados.map((delegado) => (
                  <div key={delegado.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        delegado.permissao === "editar" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        {delegado.permissao === "editar" ? (
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{delegado.nome}</div>
                        <div className="text-xs text-muted-foreground">{delegado.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={delegado.permissao === "editar" ? "default" : "secondary"}>
                        {delegado.permissao === "editar" ? "Pode editar" : "Somente visualizar"}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoverDelegado(delegado.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <Shield className="w-3 h-3 inline mr-1" />
              Todas as alterações feitas por delegados são registradas com data, hora e identificação do usuário.
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalDelegadosAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL NOVO AGENDAMENTO */}
      {/* ============================================ */}
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
                onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, tipoCompromisso: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {TIPOS_COMPROMISSO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {novoAgendamento.tipoCompromisso !== "Reunião" && (
              <div className="relative">
                <Label>Paciente</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={buscaPaciente}
                    onChange={(e) => {
                      setBuscaPaciente(e.target.value);
                      setShowPacienteDropdown(true);
                      if (!e.target.value) {
                        setNovoAgendamento({ ...novoAgendamento, pacienteId: null, pacienteNome: "" });
                        setPacienteSelecionadoInfo(null);
                      }
                    }}
                    onFocus={() => setShowPacienteDropdown(true)}
                    className="pl-8"
                  />
                  {isSearchingPacientes && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {showPacienteDropdown && buscaPaciente.length >= 2 && (
                  <div className="absolute z-[100] w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {pacientesFiltrados.length > 0 ? (
                      pacientesFiltrados.map((p: any) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setNovoAgendamento({ 
                              ...novoAgendamento, 
                              pacienteId: p.id, 
                              pacienteNome: p.nome,
                              // Se o paciente tem convênio cadastrado, usar
                              convenio: p.operadora1 || novoAgendamento.convenio,
                            });
                            setBuscaPaciente(p.nome);
                            setPacienteSelecionadoInfo(p);
                            setShowPacienteDropdown(false);
                          }}
                        >
                          <div className="font-medium">{p.nome}</div>
                          {p.cpf && <div className="text-xs text-muted-foreground">CPF: {p.cpf}</div>}
                          {p.operadora1 && <div className="text-xs text-muted-foreground">Convênio: {p.operadora1}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum paciente encontrado. O nome digitado será usado para criar um novo paciente.
                      </div>
                    )}
                  </div>
                )}
                
                {pacienteSelecionadoInfo && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{pacienteSelecionadoInfo.nome}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setNovoAgendamento({ ...novoAgendamento, pacienteId: null, pacienteNome: "" });
                          setBuscaPaciente("");
                          setPacienteSelecionadoInfo(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {!novoAgendamento.pacienteId && buscaPaciente && (
                  <div className="mt-1">
                    <Label className="text-xs text-muted-foreground">
                      Novo paciente será criado com o nome: "{buscaPaciente}"
                    </Label>
                    <Input
                      type="hidden"
                      value={buscaPaciente}
                      onChange={() => setNovoAgendamento({ ...novoAgendamento, pacienteNome: buscaPaciente })}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={novoAgendamento.data}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={novoAgendamento.horaInicio}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim {novoAgendamento.tipoCompromisso === "Consulta" && <span className="text-xs text-muted-foreground">(auto)</span>}</Label>
                <Input
                  type="time"
                  value={novoAgendamento.horaFim}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, horaFim: e.target.value })}
                  className={novoAgendamento.tipoCompromisso === "Consulta" ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div>
              <Label>Local {novoAgendamento.tipoCompromisso === "Consulta" && <span className="text-xs text-muted-foreground">(padrão: {configHorario.localConsultaPadrao})</span>}</Label>
              <Select
                value={novoAgendamento.local}
                onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, local: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {LOCAIS.map((local) => (
                    <SelectItem key={local} value={local}>{local}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos específicos para Consulta */}
            {novoAgendamento.tipoCompromisso === "Consulta" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Convênio
                    </Label>
                    <Select
                      value={novoAgendamento.convenio}
                      onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, convenio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o convênio" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {/* Se paciente selecionado tem convênios, mostrar primeiro */}
                        {pacienteSelecionadoInfo?.operadora1 && (
                          <SelectItem value={pacienteSelecionadoInfo.operadora1}>
                            {pacienteSelecionadoInfo.operadora1} (cadastrado)
                          </SelectItem>
                        )}
                        {pacienteSelecionadoInfo?.operadora2 && (
                          <SelectItem value={pacienteSelecionadoInfo.operadora2}>
                            {pacienteSelecionadoInfo.operadora2} (cadastrado)
                          </SelectItem>
                        )}
                        {CONVENIOS.map((conv) => (
                          <SelectItem key={conv} value={conv}>{conv}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3" />
                      Status
                    </Label>
                    <Select
                      value={novoAgendamento.status}
                      onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {STATUS_AGENDAMENTO.map((status) => {
                          const Icon = status.icon;
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-3 h-3 ${status.color}`} />
                                {status.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {novoAgendamento.tipoCompromisso === "Reunião" && (
              <div>
                <Label>Título</Label>
                <Input
                  value={novoAgendamento.titulo}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, titulo: e.target.value })}
                  placeholder="Título da reunião"
                />
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={novoAgendamento.descricao}
                onChange={(e) => setNovoAgendamento({ ...novoAgendamento, descricao: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAgendamento} disabled={createAgendamento.isPending}>
              {createAgendamento.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL BLOQUEIO */}
      {/* ============================================ */}
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
                onValueChange={(value) => setNovoBloqueio({ ...novoBloqueio, tipoBloqueio: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {TIPOS_BLOQUEIO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={novoBloqueio.titulo}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, titulo: e.target.value })}
                placeholder="Ex: Férias de verão"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={novoBloqueio.dataInicio}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={novoBloqueio.horaInicio}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, horaInicio: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={novoBloqueio.dataFim}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, dataFim: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={novoBloqueio.horaFim}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, horaFim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novoBloqueio.descricao}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, descricao: e.target.value })}
                placeholder="Detalhes adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBloqueioAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarBloqueio} disabled={createBloqueio.isPending}>
              {createBloqueio.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL DETALHES DO AGENDAMENTO */}
      {/* ============================================ */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${CORES_TIPO[agendamentoSelecionado.tipoCompromisso] || "bg-gray-500"}`} />
                <span className="font-medium">{agendamentoSelecionado.tipoCompromisso}</span>
                {(() => {
                  const statusInfo = getStatusInfo(agendamentoSelecionado.status);
                  const StatusIcon = statusInfo?.icon;
                  return (
                    <Badge variant="outline" className={`${statusInfo?.color}`}>
                      {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                      {statusInfo?.label}
                    </Badge>
                  );
                })()}
              </div>

              {agendamentoSelecionado.pacienteNome && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{agendamentoSelecionado.pacienteNome}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {new Date(agendamentoSelecionado.dataHoraInicio).toLocaleDateString("pt-BR")} às {formatarHora(agendamentoSelecionado.dataHoraInicio)}
                  {agendamentoSelecionado.dataHoraFim && ` - ${formatarHora(agendamentoSelecionado.dataHoraFim)}`}
                </span>
              </div>

              {agendamentoSelecionado.local && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{agendamentoSelecionado.local}</span>
                </div>
              )}

              {agendamentoSelecionado.convenio && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>{agendamentoSelecionado.convenio}</span>
                </div>
              )}

              {agendamentoSelecionado.descricao && (
                <div className="p-2 bg-muted rounded text-sm">
                  {agendamentoSelecionado.descricao}
                </div>
              )}

              {/* Informações de rastreabilidade */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                {agendamentoSelecionado.criadoPor && (
                  <p>Criado por: {agendamentoSelecionado.criadoPor}</p>
                )}
                {agendamentoSelecionado.createdAt && (
                  <p>Em: {new Date(agendamentoSelecionado.createdAt).toLocaleString("pt-BR")}</p>
                )}
              </div>

              {/* Ações */}
              {!["Cancelado", "Reagendado", "Encerrado", "Falta"].includes(agendamentoSelecionado.status) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {agendamentoSelecionado.status === "Agendado" && (
                    <Button size="sm" variant="outline" onClick={handleConfirmar}>
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleRealizar}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Encerrado
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleMarcarFalta}>
                    <Ban className="w-4 h-4 mr-1" />
                    Falta
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setNovaData(agendamentoSelecionado.dataHoraInicio.split("T")[0]);
                    setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
                    setNovaHoraFim(agendamentoSelecionado.dataHoraFim ? formatarHora(agendamentoSelecionado.dataHoraFim) : "");
                    setModalReagendarAberto(true);
                  }}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Transferir
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setModalCancelarAberto(true)}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL CANCELAR */}
      {/* ============================================ */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
            </p>
            <Textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelarAberto(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={cancelarAgendamentoMutation.isPending}>
              {cancelarAgendamentoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL REAGENDAR/TRANSFERIR */}
      {/* ============================================ */}
      <Dialog open={modalReagendarAberto} onOpenChange={setModalReagendarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O agendamento original será mantido como "Transferido" e um novo será criado.
            </p>
            <div className="grid grid-cols-3 gap-2">
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
              Cancelar
            </Button>
            <Button onClick={handleReagendar} disabled={reagendarAgendamentoMutation.isPending}>
              {reagendarAgendamentoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
