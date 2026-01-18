import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth,
  startOfYear, endOfYear 
} from "date-fns";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  CalendarCheck,
  CalendarClock,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  XCircle,
  LogOut,
  ArrowRightLeft,
  FileCheck,
  ClipboardCheck,
  Scissors,
  Search,
  Loader2,
  Building2,
  CreditCard,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Play,
  ClipboardList,
  RotateCcw,
  Send,
  Copy,
  ExternalLink,
  Phone,
  GripVertical,
  Move,
  AlertTriangle,
  Filter,
  Briefcase,
  Maximize2
} from "lucide-react";

// ============================================
// ÍCONE DO WHATSAPP (SVG)
// ============================================

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ============================================
// CONSTANTES
// ============================================

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

// Status de agendamento com ícones e cores
const STATUS_AGENDAMENTO = [
  { value: "Agendado", label: "Agendado", icon: CalendarCheck, color: "text-blue-600", bgColor: "bg-blue-500", borderColor: "border-blue-500", lightBg: "bg-blue-50" },
  { value: "Confirmado", label: "Confirmado", icon: UserCheck, color: "text-green-600", bgColor: "bg-green-500", borderColor: "border-green-500", lightBg: "bg-green-50" },
  { value: "Aguardando", label: "Aguardando", icon: CalendarClock, color: "text-yellow-600", bgColor: "bg-yellow-500", borderColor: "border-yellow-500", lightBg: "bg-yellow-50" },
  { value: "Em atendimento", label: "Em atendimento", icon: Stethoscope, color: "text-purple-600", bgColor: "bg-purple-500", borderColor: "border-purple-500", lightBg: "bg-purple-50" },
  { value: "Encerrado", label: "Encerrado", icon: CheckCircle2, color: "text-gray-600", bgColor: "bg-gray-500", borderColor: "border-gray-500", lightBg: "bg-gray-50" },
  { value: "Falta", label: "Falta", icon: Ban, color: "text-orange-600", bgColor: "bg-orange-500", borderColor: "border-orange-500", lightBg: "bg-orange-50" },
  { value: "Transferido", label: "Transferido", icon: ArrowRightLeft, color: "text-amber-600", bgColor: "bg-amber-500", borderColor: "border-amber-500", lightBg: "bg-amber-50" },
  { value: "Cancelado", label: "Cancelado", icon: XCircle, color: "text-red-600", bgColor: "bg-red-400", borderColor: "border-red-400", lightBg: "bg-red-50" },
] as const;

// ============================================
// MÁQUINA DE ESTADOS - TRANSIÇÕES PERMITIDAS
// ============================================

type StatusType = "Agendado" | "Confirmado" | "Aguardando" | "Em atendimento" | "Encerrado" | "Falta" | "Transferido" | "Cancelado";

const TRANSICOES_PERMITIDAS: Record<StatusType, StatusType[]> = {
  "Agendado": ["Confirmado", "Cancelado"],
  "Confirmado": ["Aguardando", "Em atendimento", "Falta", "Cancelado"],
  "Aguardando": ["Em atendimento", "Cancelado"],
  "Em atendimento": ["Encerrado"],
  "Encerrado": [],
  "Falta": [],
  "Transferido": [],
  "Cancelado": ["Agendado"],
};

const STATUS_PODE_TRANSFERIR: StatusType[] = ["Agendado", "Confirmado"];

function isTransicaoPermitida(statusAtual: string, novoStatus: string): boolean {
  const transicoesDoStatus = TRANSICOES_PERMITIDAS[statusAtual as StatusType];
  return transicoesDoStatus?.includes(novoStatus as StatusType) || false;
}

function getProximosStatusPossiveis(statusAtual: string): StatusType[] {
  return TRANSICOES_PERMITIDAS[statusAtual as StatusType] || [];
}

function podeTransferir(status: string): boolean {
  return STATUS_PODE_TRANSFERIR.includes(status as StatusType);
}

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

// Paleta de cores Opção B - Azul Claro (#6B8CBE)
// Cores mais suaves e elegantes, menor fadiga visual, mais profissional/médico
const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-[#6B8CBE]",           // Azul claro (principal)
  "Cirurgia": "bg-[#BE6B7D]",            // Rosa/Bordô suave
  "Visita internado": "bg-[#8E7DBE]",    // Roxo suave
  "Procedimento em consultório": "bg-[#BEA06B]", // Dourado suave
  "Exame": "bg-[#6BB0BE]",               // Ciano/Verde-azulado suave
  "Reunião": "bg-[#8A8A8A]",             // Cinza médio
  "Bloqueio": "bg-[#ABABAB]",            // Cinza claro
};

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
  "2025-03-03": "Carnaval", "2025-03-04": "Carnaval", "2025-04-18": "Sexta-feira Santa",
  "2025-04-20": "Páscoa", "2025-06-19": "Corpus Christi",
  "2026-02-16": "Carnaval", "2026-02-17": "Carnaval", "2026-04-03": "Sexta-feira Santa",
  "2026-04-05": "Páscoa", "2026-06-04": "Corpus Christi",
  "2027-02-08": "Carnaval", "2027-02-09": "Carnaval", "2027-03-26": "Sexta-feira Santa",
  "2027-03-28": "Páscoa", "2027-05-27": "Corpus Christi",
};

function getFeriado(data: Date): string | null {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const chaveFixa = `${mes}-${dia}`;
  if (FERIADOS_FIXOS[chaveFixa]) return FERIADOS_FIXOS[chaveFixa];
  const chaveMovel = `${ano}-${mes}-${dia}`;
  if (FERIADOS_MOVEIS[chaveMovel]) return FERIADOS_MOVEIS[chaveMovel];
  return null;
}

// ============================================
// FUNÇÃO DE HIGHLIGHT PARA BUSCA
// ============================================

/**
 * Destaca os termos buscados em negrito dentro de um texto.
 * Exemplo: highlightSearchTerm("Maria da Silva", "maria") => "<strong>Maria</strong> da Silva"
 */
function highlightSearchTerm(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || searchTerm.trim().length < 3) {
    return text;
  }
  
  // Escapar caracteres especiais de regex
  const escapedTerm = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Criar regex case-insensitive
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  
  // Dividir o texto em partes
  const parts = text.split(regex);
  
  // Se não encontrou match, retorna texto original
  if (parts.length === 1) {
    return text;
  }
  
  // Retorna com partes destacadas em negrito
  return parts.map((part, index) => 
    regex.test(part) ? (
      <strong key={index} className="font-bold" style={{ color: '#6B8CBE' }}>{part}</strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

// ============================================
// INTERFACES
// ============================================

// Tipo que corresponde ao retorno real da query listAgendamentos
// Nota: Drizzle com superjson converte Date para string no transporte
interface Agendamento {
  id: number;
  idAgendamento: string;
  tipoCompromisso: "Consulta" | "Cirurgia" | "Visita internado" | "Procedimento em consultório" | "Exame" | "Reunião" | "Bloqueio";
  pacienteId: number | null;
  pacienteNome: string | null;
  dataHoraInicio: string | Date;
  dataHoraFim: string | Date | null;
  status: string;
  local: string | null;
  titulo: string | null;
  descricao: string | null;
  convenio: string | null;
  telefonePaciente: string | null;
  cpfPaciente: string | null;
  // Campos adicionais usados na UI
  pacienteTelefone?: string | null;
  motivoCancelamento?: string | null;
  criadoPor?: string | null;
  atualizadoPor?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  agendamentoOriginalId?: number | null;
}

interface Bloqueio {
  id: number;
  idBloqueio: string;
  tipoBloqueio: string;
  titulo: string;
  descricao?: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  cancelado: boolean;
  criadoPor?: string;
}

// Tipo unificado para eventos na grade (agendamentos + bloqueios)
interface EventoGrade {
  id: number;
  tipo: 'agendamento' | 'bloqueio';
  titulo: string | null;
  dataHoraInicio: string | Date;
  dataHoraFim: string | Date | null;
  // Campos de agendamento
  tipoCompromisso?: string | null;
  pacienteNome?: string | null;
  status?: string | null;
  local?: string | null;
  convenio?: string | null;
  // Campos de bloqueio
  tipoBloqueio?: string | null;
  cancelado?: boolean | null;
  // Dados originais
  dadosOriginais: Agendamento | Bloqueio;
}

interface Delegado {
  id: number;
  email: string;
  nome: string;
  permissao: "visualizar" | "editar";
  adicionadoEm: string;
}

interface LogEntry {
  id: number;
  tipoAlteracao: string;
  descricaoAlteracao: string;
  realizadoPor: string;
  createdAt: string;
  valoresAnteriores?: any;
  valoresNovos?: any;
}

// ============================================
// INTERFACE DE HORÁRIOS DE TRABALHO
// ============================================

interface HorarioTrabalho {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, etc.
  ativo: boolean;
  horaInicio: string;
  horaFim: string;
  pausaInicio?: string;
  pausaFim?: string;
}

const DIAS_SEMANA = [
  { value: 0, label: "Domingo", abrev: "Dom" },
  { value: 1, label: "Segunda-feira", abrev: "Seg" },
  { value: 2, label: "Terça-feira", abrev: "Ter" },
  { value: 3, label: "Quarta-feira", abrev: "Qua" },
  { value: 4, label: "Quinta-feira", abrev: "Qui" },
  { value: 5, label: "Sexta-feira", abrev: "Sex" },
  { value: 6, label: "Sábado", abrev: "Sáb" },
];

// ============================================
// INTERFACE DE CONFLITO
// ============================================

interface Conflito {
  agendamentoExistente: Agendamento;
  tipo: "total" | "parcial";
  mensagem: string;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarHora(dataString: string | Date): string {
  const data = typeof dataString === 'string' ? new Date(dataString) : dataString;
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Função para criar ISO string preservando timezone local (Erro 3)
// Evita problemas de conversão para UTC que causam datas erradas
function toLocalISOString(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function criarEntradaLog(params: {
  agendamentoId: number;
  tipoAlteracao: string;
  descricaoAlteracao: string;
  valoresAnteriores?: any;
  valoresNovos?: any;
  usuarioAtual: string;
}): LogEntry {
  return {
    id: Date.now(),
    tipoAlteracao: params.tipoAlteracao,
    descricaoAlteracao: params.descricaoAlteracao,
    realizadoPor: params.usuarioAtual,
    createdAt: new Date().toISOString(),
    valoresAnteriores: params.valoresAnteriores,
    valoresNovos: params.valoresNovos,
  };
}

// ============================================
// FUNÇÕES DE VERIFICAÇÃO DE CONFLITOS
// ============================================

function verificarConflitos(
  novoInicio: Date,
  novoFim: Date,
  agendamentosExistentes: Agendamento[],
  agendamentoIdExcluir?: number
): Conflito[] {
  const conflitos: Conflito[] = [];
  
  for (const ag of agendamentosExistentes) {
    // Ignorar o próprio agendamento (para edição)
    if (agendamentoIdExcluir && ag.id === agendamentoIdExcluir) continue;
    
    // Ignorar cancelados, transferidos e faltas
    if (["Cancelado", "Transferido", "Falta", "Encerrado"].includes(ag.status)) continue;
    
    const agInicio = new Date(ag.dataHoraInicio);
    const agFim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(agInicio.getTime() + 30 * 60000);
    
    // Verificar sobreposição
    const temSobreposicao = novoInicio < agFim && novoFim > agInicio;
    
    if (temSobreposicao) {
      // Determinar tipo de conflito
      const conflitoParcial = (novoInicio < agInicio && novoFim > agInicio && novoFim < agFim) ||
                              (novoInicio > agInicio && novoInicio < agFim && novoFim > agFim);
      
      conflitos.push({
        agendamentoExistente: ag,
        tipo: conflitoParcial ? "parcial" : "total",
        mensagem: `Conflito ${conflitoParcial ? "parcial" : "total"} com ${ag.pacienteNome || ag.tipoCompromisso} às ${formatarHora(ag.dataHoraInicio)}`
      });
    }
  }
  
  return conflitos;
}

// ============================================
// FUNÇÃO PARA VERIFICAR HORÁRIO DE TRABALHO
// ============================================

function verificarHorarioTrabalho(
  data: Date,
  horaInicio: string,
  horaFim: string,
  horariosTrabalho: HorarioTrabalho[]
): { dentroHorario: boolean; mensagem?: string } {
  const diaSemana = data.getDay();
  const horarioDia = horariosTrabalho.find(h => h.diaSemana === diaSemana);
  
  if (!horarioDia || !horarioDia.ativo) {
    return {
      dentroHorario: false,
      mensagem: `${DIAS_SEMANA[diaSemana].label} não é um dia de trabalho configurado`
    };
  }
  
  const [horaInicioNum, minInicioNum] = horaInicio.split(":").map(Number);
  const [horaFimNum, minFimNum] = horaFim.split(":").map(Number);
  const [trabInicioHora, trabInicioMin] = horarioDia.horaInicio.split(":").map(Number);
  const [trabFimHora, trabFimMin] = horarioDia.horaFim.split(":").map(Number);
  
  const inicioMinutos = horaInicioNum * 60 + minInicioNum;
  const fimMinutos = horaFimNum * 60 + minFimNum;
  const trabInicioMinutos = trabInicioHora * 60 + trabInicioMin;
  const trabFimMinutos = trabFimHora * 60 + trabFimMin;
  
  if (inicioMinutos < trabInicioMinutos || fimMinutos > trabFimMinutos) {
    return {
      dentroHorario: false,
      mensagem: `Fora do horário de trabalho (${horarioDia.horaInicio} - ${horarioDia.horaFim})`
    };
  }
  
  // Verificar pausa
  if (horarioDia.pausaInicio && horarioDia.pausaFim) {
    const [pausaInicioHora, pausaInicioMin] = horarioDia.pausaInicio.split(":").map(Number);
    const [pausaFimHora, pausaFimMin] = horarioDia.pausaFim.split(":").map(Number);
    const pausaInicioMinutos = pausaInicioHora * 60 + pausaInicioMin;
    const pausaFimMinutos = pausaFimHora * 60 + pausaFimMin;
    
    const conflitoPausa = inicioMinutos < pausaFimMinutos && fimMinutos > pausaInicioMinutos;
    
    if (conflitoPausa) {
      return {
        dentroHorario: false,
        mensagem: `Conflito com horário de pausa (${horarioDia.pausaInicio} - ${horarioDia.pausaFim})`
      };
    }
  }
  
  return { dentroHorario: true };
}

// ============================================
// FUNÇÃO PARA GERAR MENSAGEM WHATSAPP
// ============================================

function gerarMensagemConfirmacaoWhatsApp(agendamento: any): string {
  const data = new Date(agendamento.dataHoraInicio);
  const dataFormatada = data.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "numeric", 
    month: "long" 
  });
  const horaFormatada = data.toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  
  const mensagem = `Olá! 👋

Gostaria de confirmar sua consulta:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
📍 *Local:* ${agendamento.local || "Consultório"}

Por favor, confirme sua presença respondendo esta mensagem.

Caso precise reagendar, entre em contato conosco.

Atenciosamente,
Dr. André Gorgen`;

  return encodeURIComponent(mensagem);
}

function abrirWhatsAppConfirmacao(telefone: string, agendamento: any) {
  if (!telefone) {
    toast.error("Paciente não possui telefone cadastrado");
    return;
  }
  
  const telefoneFormatado = telefone.replace(/\D/g, '');
  const mensagem = gerarMensagemConfirmacaoWhatsApp(agendamento);
  const url = `https://wa.me/55${telefoneFormatado}?text=${mensagem}`;
  
  window.open(url, '_blank');
  toast.success("WhatsApp aberto para confirmação");
}

// ============================================
// COMPONENTE: BARRA DE BUSCA
// ============================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  filtroTipo: string;
  onFiltroTipoChange: (value: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (value: string) => void;
}

function SearchBar({ value, onChange, filtroTipo, onFiltroTipoChange, filtroStatus, onFiltroStatusChange }: SearchBarProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, tipo ou descrição..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 h-10"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onChange("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button
          variant={mostrarFiltros ? "secondary" : "outline"}
          size="icon"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="h-10 w-10"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>
      
      {mostrarFiltros && (
        <div className="flex gap-2 p-3 bg-muted rounded-lg">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={filtroTipo} onValueChange={onFiltroTipoChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_COMPROMISSO.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filtroStatus} onValueChange={onFiltroStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_AGENDAMENTO.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFiltroTipoChange("todos");
              onFiltroStatusChange("todos");
              onChange("");
            }}
            className="self-end h-9"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: MODAL DE CONFLITOS
// ============================================

interface ConflitosModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflitos: Conflito[];
  onConfirmar: () => void;
  onCancelar: () => void;
}

function ConflitosModal({ isOpen, onClose, conflitos, onConfirmar, onCancelar }: ConflitosModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            Conflitos Detectados
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-base">
            Foram encontrados conflitos de horário com os seguintes agendamentos:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {conflitos.map((conflito, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  conflito.tipo === "total" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={conflito.tipo === "total" ? "destructive" : "outline"}>
                    {conflito.tipo === "total" ? "Conflito Total" : "Conflito Parcial"}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  <div className="font-medium">
                    {conflito.agendamentoExistente.pacienteNome || conflito.agendamentoExistente.tipoCompromisso}
                  </div>
                  <div className="text-muted-foreground">
                    {formatarHora(conflito.agendamentoExistente.dataHoraInicio)}
                    {conflito.agendamentoExistente.dataHoraFim && ` - ${formatarHora(conflito.agendamentoExistente.dataHoraFim)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Deseja continuar mesmo assim?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} size="lg">
            Cancelar
          </Button>
          <Button 
            onClick={onConfirmar}
            className="bg-amber-500 hover:bg-amber-600"
            size="lg"
          >
            Agendar Mesmo Assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: MODAL DE HORÁRIOS DE TRABALHO
// ============================================

interface HorariosTrabalhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  horariosTrabalho: HorarioTrabalho[];
  onSave: (horarios: HorarioTrabalho[]) => void;
}

function HorariosTrabalhoModal({ isOpen, onClose, horariosTrabalho, onSave }: HorariosTrabalhoModalProps) {
  const [horarios, setHorarios] = useState<HorarioTrabalho[]>(horariosTrabalho);
  
  useEffect(() => {
    setHorarios(horariosTrabalho);
  }, [horariosTrabalho]);
  
  const atualizarHorario = (diaSemana: number, campo: keyof HorarioTrabalho, valor: any) => {
    setHorarios(prev => prev.map(h => 
      h.diaSemana === diaSemana ? { ...h, [campo]: valor } : h
    ));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="w-6 h-6 text-blue-500" />
            Horários de Trabalho
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure os dias e horários de atendimento. Agendamentos fora desses horários serão sinalizados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {DIAS_SEMANA.map(dia => {
            const horario = horarios.find(h => h.diaSemana === dia.value);
            if (!horario) return null;
            
            return (
              <div 
                key={dia.value} 
                className={`p-4 rounded-lg border ${horario.ativo ? "bg-white" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-40">
                    <input
                      type="checkbox"
                      checked={horario.ativo}
                      onChange={(e) => atualizarHorario(dia.value, "ativo", e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className={`font-medium ${!horario.ativo ? "text-muted-foreground" : ""}`}>
                      {dia.label}
                    </span>
                  </div>
                  
                  {horario.ativo && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={horario.horaInicio}
                          onChange={(e) => atualizarHorario(dia.value, "horaInicio", e.target.value)}
                          className="w-28 h-9"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={horario.horaFim}
                          onChange={(e) => atualizarHorario(dia.value, "horaFim", e.target.value)}
                          className="w-28 h-9"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-muted-foreground">Pausa:</span>
                        <Input
                          type="time"
                          value={horario.pausaInicio || ""}
                          onChange={(e) => atualizarHorario(dia.value, "pausaInicio", e.target.value)}
                          className="w-24 h-9"
                          placeholder="Início"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={horario.pausaFim || ""}
                          onChange={(e) => atualizarHorario(dia.value, "pausaFim", e.target.value)}
                          className="w-24 h-9"
                          placeholder="Fim"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="lg">
            Cancelar
          </Button>
          <Button onClick={() => { onSave(horarios); onClose(); }} size="lg">
            Salvar Horários
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: MODAL DE CRIAÇÃO RÁPIDA
// ============================================

interface CriacaoRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Date;
  hora: string;
  onCriarCompleto: (dados: { 
    pacienteId?: number;
    pacienteNome?: string;
    titulo?: string;
  }) => void;
  onCriarRapido: (dados: { 
    titulo: string; 
    duracao: number;
    pacienteId?: number;
    pacienteNome?: string;
  }) => void;
  pacientes?: Array<{
    id: number;
    nome: string;
    cpf?: string | null;
  }>;
}

function CriacaoRapidaModal({ isOpen, onClose, data, hora, onCriarCompleto, onCriarRapido, pacientes = [] }: CriacaoRapidaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [duracao, setDuracao] = useState(30);
  
  // Estados para autocomplete unificado
  const [pacienteSelecionado, setPacienteSelecionado] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [termoBuscaPaciente, setTermoBuscaPaciente] = useState("");
  const [inputFocado, setInputFocado] = useState(false);
  const [usarTextoLivre, setUsarTextoLivre] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Query de busca de pacientes no backend (ativada quando há 3+ caracteres)
  const { data: pacientesBuscaBackend = [], isFetching: buscandoPacientes } = trpc.pacientes.list.useQuery(
    { 
      busca: termoBuscaPaciente.trim(),
      limit: 20 
    },
    { 
      enabled: termoBuscaPaciente.trim().length >= 3, // SEGURANÇA: mínimo 3 caracteres
      staleTime: 1000, // Cache por 1 segundo para evitar buscas excessivas
    }
  );
  
  // Filtro de pacientes: SEGURANÇA - só mostra pacientes após 3+ caracteres digitados
  const pacientesFiltrados = useMemo(() => {
    if (termoBuscaPaciente.trim().length < 3) {
      return [];
    }
    return pacientesBuscaBackend;
  }, [pacientesBuscaBackend, termoBuscaPaciente]);
  
  // Mostrar dropdown apenas quando: input focado E (tem 3+ chars OU paciente selecionado)
  const mostrarDropdown = inputFocado && !pacienteSelecionado && termoBuscaPaciente.trim().length >= 1;
  
  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setInputFocado(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelecionarPaciente = (paciente: { id: number; nome: string }) => {
    setPacienteSelecionado(paciente);
    setTermoBuscaPaciente(paciente.nome);
    setTitulo(paciente.nome);
    setInputFocado(false);
  };
  
  const handleLimparSelecao = () => {
    setPacienteSelecionado(null);
    setTermoBuscaPaciente("");
    setTitulo("");
    inputRef.current?.focus();
  };
  
  const handleCriarRapido = () => {
    if (!titulo.trim() && !pacienteSelecionado) {
      toast.error("Selecione um paciente ou informe um título");
      return;
    }
    
    onCriarRapido({ 
      titulo: titulo || pacienteSelecionado?.nome || "", 
      duracao,
      pacienteId: pacienteSelecionado?.id,
      pacienteNome: pacienteSelecionado?.nome,
    });
    
    // Reset estados
    setTitulo("");
    setDuracao(30);
    setPacienteSelecionado(null);
    setTermoBuscaPaciente("");
    setUsarTextoLivre(false);
  };
  
  const handleClose = () => {
    setTitulo("");
    setDuracao(30);
    setPacienteSelecionado(null);
    setTermoBuscaPaciente("");
    setUsarTextoLivre(false);
    setInputFocado(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        {/* Botões manuais no canto superior direito */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-sm opacity-70 hover:opacity-100"
            onClick={() => onCriarCompleto({
              pacienteId: pacienteSelecionado?.id,
              pacienteNome: pacienteSelecionado?.nome || termoBuscaPaciente || titulo,
              titulo: titulo,
            })}
            title="Abrir formulário completo"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-sm opacity-70 hover:opacity-100"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <DialogHeader className="pr-20">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-blue-500" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            {data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {hora}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Campo de Paciente - UNIFICADO com dropdown */}
          <div>
            <Label>Paciente</Label>
            {usarTextoLivre ? (
              // Fallback: Input simples para texto livre
              <div className="flex gap-2">
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nome ou título"
                  className="h-11 flex-1"
                  autoFocus
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => {
                    setUsarTextoLivre(false);
                    setTitulo("");
                  }}
                  title="Buscar paciente"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Campo de busca UNIFICADO com dropdown inline
              <div className="relative">
                {/* Input único de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    ref={inputRef}
                    value={termoBuscaPaciente}
                    onChange={(e) => {
                      setTermoBuscaPaciente(e.target.value);
                      if (pacienteSelecionado) {
                        setPacienteSelecionado(null);
                      }
                    }}
                    onFocus={() => setInputFocado(true)}
                    placeholder="Buscar paciente por nome, CPF ou ID..."
                    className={`h-11 pl-10 pr-10 ${pacienteSelecionado ? 'border-green-500 bg-green-50' : ''}`}
                    autoFocus
                  />
                  {buscandoPacientes && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {pacienteSelecionado && !buscandoPacientes && (
                    <button
                      onClick={handleLimparSelecao}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown de resultados */}
                {mostrarDropdown && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {termoBuscaPaciente.trim().length < 3 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        Digite pelo menos 3 caracteres para buscar
                      </div>
                    ) : pacientesFiltrados.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-sm text-gray-500 mb-2">Nenhum paciente encontrado</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setUsarTextoLivre(true);
                            setTitulo(termoBuscaPaciente);
                            setInputFocado(false);
                          }}
                        >
                          Usar "{termoBuscaPaciente}" como título
                        </Button>
                      </div>
                    ) : (
                      pacientesFiltrados.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelecionarPaciente({ id: p.id, nome: p.nome })}
                          className="p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 flex items-center gap-3"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">{highlightSearchTerm(p.nome, termoBuscaPaciente)}</span>
                            <span className="text-xs text-gray-500">
                              ID: {p.id} {p.cpf && `| CPF: ${p.cpf}`}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Indicador de paciente selecionado */}
                {pacienteSelecionado && (
                  <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Paciente selecionado
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Campo de Duração */}
          <div>
            <Label>Duração</Label>
            <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h30</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleCriarRapido}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: STATUS FLOW (ESTEIRA VISUAL)
// ============================================

type StatusAgendamento = "Agendado" | "Confirmado" | "Aguardando" | "Em atendimento" | "Encerrado" | "Falta" | "Transferido" | "Cancelado";

interface StatusFlowProps {
  currentStatus: string;
  onStatusChange: (novoStatus: StatusAgendamento) => void;
}

function StatusFlow({ currentStatus, onStatusChange }: StatusFlowProps) {
  const statusEsteira = ["Agendado", "Confirmado", "Aguardando", "Em atendimento", "Encerrado"];
  const statusIndex = statusEsteira.indexOf(currentStatus);
  const proximosStatus = getProximosStatusPossiveis(currentStatus);
  
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Status do Atendimento</Label>
      
      {/* Esteira principal */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {statusEsteira.map((status, index) => {
          const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === status);
          const Icon = statusInfo?.icon || CalendarCheck;
          const isAtual = status === currentStatus;
          const isPast = index < statusIndex;
          const isNext = proximosStatus.includes(status as StatusType);
          
          return (
            <div key={status} className="flex items-center">
              <button
                onClick={() => isNext && onStatusChange(status as StatusAgendamento)}
                disabled={!isNext && !isAtual}
                className={`
                  flex flex-col items-center p-3 rounded-lg transition-all min-w-[90px]
                  ${isAtual 
                    ? `${statusInfo?.lightBg} ring-2 ${statusInfo?.borderColor} shadow-md` 
                    : isPast 
                      ? "bg-gray-100 opacity-50" 
                      : isNext 
                        ? "bg-gray-50 hover:bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300" 
                        : "bg-gray-50 opacity-30 cursor-not-allowed"
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isAtual ? statusInfo?.color : "text-gray-400"}`} />
                <span className={`text-xs mt-1 font-medium ${isAtual ? statusInfo?.color : "text-gray-500"}`}>
                  {status}
                </span>
              </button>
              {index < statusEsteira.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-1 ${isPast ? "text-gray-400" : "text-gray-300"}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Status especiais */}
      {(currentStatus === "Cancelado" || currentStatus === "Falta" || currentStatus === "Transferido") && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100">
          {STATUS_AGENDAMENTO.find(s => s.value === currentStatus)?.icon && (
            <span className={STATUS_AGENDAMENTO.find(s => s.value === currentStatus)?.color}>
              {(() => {
                const Icon = STATUS_AGENDAMENTO.find(s => s.value === currentStatus)?.icon;
                return Icon ? <Icon className="w-5 h-5" /> : null;
              })()}
            </span>
          )}
          <span className="font-medium">{currentStatus}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: BOTÕES DE AÇÃO POR STATUS
// ============================================

interface StatusActionsProps {
  agendamento: Agendamento;
  onWhatsApp: () => void;
  onIniciarAtendimento: () => void;
  onRegistrarAtendimento: () => void;
  onConfirmar: () => void;
  onAguardando: () => void;
  onCancelar: () => void;
  onFalta: () => void;
  onTransferir: () => void;
  onReativar: () => void;
  onNovoAgendamentoReaproveitando: () => void;
}

function StatusActions({
  agendamento,
  onWhatsApp,
  onIniciarAtendimento,
  onRegistrarAtendimento,
  onConfirmar,
  onAguardando,
  onCancelar,
  onFalta,
  onTransferir,
  onReativar,
  onNovoAgendamentoReaproveitando,
}: StatusActionsProps) {
  const status = agendamento.status;
  
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Ações Disponíveis</Label>
      
      <div className="flex flex-wrap gap-2">
        {/* AGENDADO */}
        {status === "Agendado" && (
          <>
            <Button 
              size="default" 
              variant="outline" 
              onClick={onWhatsApp}
              className="bg-green-50 hover:bg-green-100 border-green-400 text-green-700 h-11 px-4"
            >
              <WhatsAppIcon className="w-5 h-5 mr-2" />
              Confirmar via WhatsApp
            </Button>
            <Button size="default" onClick={onConfirmar} className="h-11 px-4 bg-green-500 hover:bg-green-600">
              <Check className="w-5 h-5 mr-2" />
              Confirmar
            </Button>
            <Button size="default" variant="outline" onClick={onTransferir} className="h-11 px-4">
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Transferir
            </Button>
            <Button size="default" variant="destructive" onClick={onCancelar} className="h-11 px-4">
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar
            </Button>
          </>
        )}
        
        {/* CONFIRMADO */}
        {status === "Confirmado" && (
          <>
            <Button size="default" onClick={onAguardando} className="h-11 px-4 bg-yellow-500 hover:bg-yellow-600">
              <CalendarClock className="w-5 h-5 mr-2" />
              Paciente Chegou
            </Button>
            <Button size="default" variant="outline" onClick={onIniciarAtendimento} className="h-11 px-4">
              <Play className="w-5 h-5 mr-2" />
              Iniciar Atendimento →
            </Button>
            <Button size="default" variant="outline" onClick={onTransferir} className="h-11 px-4">
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Transferir
            </Button>
            <Button size="default" variant="outline" onClick={onFalta} className="h-11 px-4 text-orange-600 border-orange-300 hover:bg-orange-50">
              <Ban className="w-5 h-5 mr-2" />
              Falta
            </Button>
            <Button size="default" variant="destructive" onClick={onCancelar} className="h-11 px-4">
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar
            </Button>
          </>
        )}
        
        {/* AGUARDANDO */}
        {status === "Aguardando" && (
          <>
            <Button size="default" onClick={onRegistrarAtendimento} className="h-11 px-4 bg-purple-500 hover:bg-purple-600">
              <ClipboardList className="w-5 h-5 mr-2" />
              Registrar Atendimento →
            </Button>
            <Button size="default" variant="destructive" onClick={onCancelar} className="h-11 px-4">
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar
            </Button>
          </>
        )}
        
        {/* EM ATENDIMENTO */}
        {status === "Em atendimento" && (
          <div className="p-3 bg-purple-50 rounded-lg text-purple-700 text-sm">
            <Stethoscope className="w-5 h-5 inline mr-2" />
            Atendimento em andamento. Encerre pelo Prontuário do paciente.
          </div>
        )}
        
        {/* ENCERRADO */}
        {status === "Encerrado" && (
          <div className="p-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
            <CheckCircle2 className="w-5 h-5 inline mr-2" />
            Atendimento encerrado.
          </div>
        )}
        
        {/* FALTA */}
        {status === "Falta" && (
          <>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-700 text-sm flex-1">
              <Ban className="w-5 h-5 inline mr-2" />
              Paciente não compareceu.
            </div>
            <Button size="default" variant="outline" onClick={onNovoAgendamentoReaproveitando} className="h-11 px-4">
              <Plus className="w-5 h-5 mr-2" />
              Novo Agendamento
            </Button>
          </>
        )}
        
        {/* TRANSFERIDO */}
        {status === "Transferido" && (
          <div className="p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
            <ArrowRightLeft className="w-5 h-5 inline mr-2" />
            Agendamento transferido para outra data.
          </div>
        )}
        
        {/* CANCELADO */}
        {status === "Cancelado" && (
          <>
            <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm flex-1">
              <XCircle className="w-5 h-5 inline mr-2" />
              Agendamento cancelado.
              {agendamento.motivoCancelamento && (
                <span className="block mt-1 text-xs">Motivo: {agendamento.motivoCancelamento}</span>
              )}
            </div>
            <Button size="default" onClick={onReativar} className="h-11 px-4 bg-blue-500 hover:bg-blue-600">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reativar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: MODAL DE HISTÓRICO (AUDIT TRAIL)
// ============================================

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoId: number | null;
  agendamentoNome: string;
  logs: LogEntry[];
}

function AuditTrailModal({ isOpen, onClose, agendamentoId, agendamentoNome, logs }: AuditTrailModalProps) {
  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case "Criação": return <Plus className="w-4 h-4 text-green-500" />;
      case "Mudança de Status": return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "Confirmação": return <Check className="w-4 h-4 text-green-500" />;
      case "Cancelamento": return <XCircle className="w-4 h-4 text-red-500" />;
      case "Transferência": return <ArrowRightLeft className="w-4 h-4 text-amber-500" />;
      case "Reativação": return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case "Falta": return <Ban className="w-4 h-4 text-orange-500" />;
      case "WhatsApp Enviado": return <WhatsAppIcon className="w-4 h-4 text-green-500" />;
      case "Drag and Drop": return <Move className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="w-6 h-6 text-blue-500" />
            Histórico de Alterações
          </DialogTitle>
          <DialogDescription className="text-base">
            {agendamentoNome} - ID #{agendamentoId}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getIconForTipo(log.tipoAlteracao)}
                    </div>
                    {index < logs.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-base">{log.tipoAlteracao}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.descricaoAlteracao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Por: <span className="font-medium">{log.realizadoPor}</span>
                    </p>
                    {(log.valoresAnteriores || log.valoresNovos) && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        {log.valoresAnteriores && (
                          <div><span className="text-red-500">-</span> {JSON.stringify(log.valoresAnteriores)}</div>
                        )}
                        {log.valoresNovos && (
                          <div><span className="text-green-500">+</span> {JSON.stringify(log.valoresNovos)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="lg">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: MODAL DE REATIVAR
// ============================================

interface ReativarModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onReativarMesmaData: () => void;
  onReativarTransferir: () => void;
}

function ReativarModal({ isOpen, onClose, agendamento, onReativarMesmaData, onReativarTransferir }: ReativarModalProps) {
  if (!agendamento) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RotateCcw className="w-6 h-6 text-blue-500" />
            Reativar Agendamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-base">
            Como deseja reativar este agendamento?
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium">{agendamento.pacienteNome || agendamento.tipoCompromisso}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(agendamento.dataHoraInicio).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })} às {formatarHora(agendamento.dataHoraInicio)}
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={onReativarTransferir}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transferir Data
          </Button>
          <Button onClick={onReativarMesmaData}>
            <Check className="w-4 h-4 mr-2" />
            Manter Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: AGENDA
// ============================================

export default function Agenda() {
  const [, setLocation] = useLocation();
  
  // Estados básicos
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [modoVisualizacao, setModoVisualizacao] = useState<"dia" | "semana" | "mes" | "ano">("semana");
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  
  // Estados de configuração
  const [horaInicioDia, setHoraInicioDia] = useState(0);
  const [horaFimDia, setHoraFimDia] = useState(24);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalDelegadosAberto, setModalDelegadosAberto] = useState(false);
  const [modalHorariosTrabalhoAberto, setModalHorariosTrabalhoAberto] = useState(false);
  
  // Estados de busca e filtros
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  
  // Estados de conflitos
  const [conflitosDetectados, setConflitosDetectados] = useState<Conflito[]>([]);
  const [modalConflitosAberto, setModalConflitosAberto] = useState(false);
  const [dadosPendentes, setDadosPendentes] = useState<any>(null);
  
  // Estados de criação rápida
  const [modalCriacaoRapidaAberto, setModalCriacaoRapidaAberto] = useState(false);
  const [dataCriacaoRapida, setDataCriacaoRapida] = useState<Date>(new Date());
  const [horaCriacaoRapida, setHoraCriacaoRapida] = useState("08:00");
  
  // Estados de drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAgendamento, setDraggedAgendamento] = useState<Agendamento | null>(null);
  const [dropTarget, setDropTarget] = useState<{ data: Date; hora: string } | null>(null);
  
  // Estados de modais de ação
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalTransferirAberto, setModalTransferirAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [modalReativarAberto, setModalReativarAberto] = useState(false);
  
  // Estados de formulário
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHoraInicio, setNovaHoraInicio] = useState("");
  const [novaHoraFim, setNovaHoraFim] = useState("");
  
  // Estados de rastreabilidade
  const [logsAgendamentos, setLogsAgendamentos] = useState<Record<number, LogEntry[]>>({});
  const usuarioAtual = "Dr. André Gorgen"; // TODO: Obter do contexto de autenticação
  
  // Estados de delegados
  const [delegados, setDelegados] = useState<Delegado[]>([]);
  const [novoDelegadoEmail, setNovoDelegadoEmail] = useState("");
  const [novoDelegadoPermissao, setNovoDelegadoPermissao] = useState<"visualizar" | "editar">("visualizar");
  
  // Estado de horários de trabalho
  const [horariosTrabalho, setHorariosTrabalho] = useState<HorarioTrabalho[]>([
    { diaSemana: 0, ativo: false, horaInicio: "08:00", horaFim: "18:00" },
    { diaSemana: 1, ativo: true, horaInicio: "08:00", horaFim: "18:00", pausaInicio: "12:00", pausaFim: "13:00" },
    { diaSemana: 2, ativo: true, horaInicio: "08:00", horaFim: "18:00", pausaInicio: "12:00", pausaFim: "13:00" },
    { diaSemana: 3, ativo: true, horaInicio: "08:00", horaFim: "18:00", pausaInicio: "12:00", pausaFim: "13:00" },
    { diaSemana: 4, ativo: true, horaInicio: "08:00", horaFim: "18:00", pausaInicio: "12:00", pausaFim: "13:00" },
    { diaSemana: 5, ativo: true, horaInicio: "08:00", horaFim: "18:00", pausaInicio: "12:00", pausaFim: "13:00" },
    { diaSemana: 6, ativo: false, horaInicio: "08:00", horaFim: "12:00" },
  ]);
  
  // Estados de formulário de novo agendamento
  const [novoTipoCompromisso, setNovoTipoCompromisso] = useState("");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDataAgendamento, setNovaDataAgendamento] = useState("");
  const [novaHoraInicioAgendamento, setNovaHoraInicioAgendamento] = useState("");
  const [novaHoraFimAgendamento, setNovaHoraFimAgendamento] = useState("");
  const [novoLocal, setNovoLocal] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoPacienteId, setNovoPacienteId] = useState<number | null>(null);
  const [novoConvenio, setNovoConvenio] = useState("");
  const [novoStatus, setNovoStatus] = useState("Agendado");
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [buscaPacienteFocado, setBuscaPacienteFocado] = useState(false);
  const buscaPacienteRef = useRef<HTMLInputElement>(null);
  const dropdownPacienteRef = useRef<HTMLDivElement>(null);
  
  // Estados de bloqueio
  const [bloqueioTipo, setBloqueioTipo] = useState("");
  const [bloqueioDataInicio, setBloqueioDataInicio] = useState("");
  const [bloqueioDataFim, setBloqueioDataFim] = useState("");
  const [bloqueioHoraInicio, setBloqueioHoraInicio] = useState("");
  const [bloqueioHoraFim, setBloqueioHoraFim] = useState("");
  const [bloqueioDescricao, setBloqueioDescricao] = useState("");
  
  // Ref para scroll automático
  const gradeRef = useRef<HTMLDivElement>(null);
  
  // Calcular período de visualização para filtrar agendamentos
  // Isso otimiza a query e evita carregar dados desnecessários
  const periodoVisualizacao = useMemo(() => {
    let dataInicio: Date;
    let dataFim: Date;
    
    switch (modoVisualizacao) {
      case 'dia':
        dataInicio = startOfDay(dataSelecionada);
        dataFim = endOfDay(dataSelecionada);
        break;
      case 'semana':
        dataInicio = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
        dataFim = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
        break;
      case 'mes':
        dataInicio = startOfMonth(dataSelecionada);
        dataFim = endOfMonth(dataSelecionada);
        break;
      case 'ano':
        dataInicio = startOfYear(dataSelecionada);
        dataFim = endOfYear(dataSelecionada);
        break;
      default:
        dataInicio = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
        dataFim = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
    }
    
    return { dataInicio, dataFim };
  }, [dataSelecionada, modoVisualizacao]);
  
  // Queries tRPC - agora com filtros de data para otimização
  const { data: agendamentos = [], refetch: refetchAgendamentos } = trpc.agenda.listar.useQuery({
    dataInicio: periodoVisualizacao.dataInicio,
    dataFim: periodoVisualizacao.dataFim,
  });
  const { data: bloqueios = [], refetch: refetchBloqueios } = trpc.bloqueios.list.useQuery({
    incluirCancelados: false,
  });
  // SEGURANÇA DO PACIENTE: Não carregar lista inicial de pacientes
  // Isso previne seleção acidental de paciente errado (risco de erro médico)
  // Pacientes só aparecem após digitar 3+ caracteres de busca
  
  // Query de busca de pacientes no backend (ativada quando há 3+ caracteres)
  const { data: pacientesBusca = [], isFetching: buscandoPacientesModal } = trpc.pacientes.list.useQuery(
    { 
      busca: buscaPaciente.trim(),
      limit: 30 
    },
    { 
      enabled: buscaPaciente.trim().length >= 3, // SEGURANÇA: mínimo 3 caracteres
      staleTime: 1000,
    }
  );
  
  // SEGURANÇA: Só retorna pacientes se houver busca com 3+ caracteres
  const pacientes = useMemo(() => {
    if (buscaPaciente.trim().length >= 3) {
      return pacientesBusca;
    }
    return []; // Não mostrar nenhum paciente sem busca intencional
  }, [pacientesBusca, buscaPaciente]);
  
  // Fechar dropdown de pacientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownPacienteRef.current && 
        !dropdownPacienteRef.current.contains(event.target as Node) &&
        buscaPacienteRef.current &&
        !buscaPacienteRef.current.contains(event.target as Node)
      ) {
        setBuscaPacienteFocado(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Função para refetch unificado (agendamentos + bloqueios)
  const refetchTodos = useCallback(() => {
    refetchAgendamentos();
    refetchBloqueios();
  }, [refetchAgendamentos, refetchBloqueios]);
  
  // Mutations tRPC
  const criarAgendamentoMutation = trpc.agenda.criar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      refetchAgendamentos();
      fecharModalNovo();
    },
    onError: (error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });
  
  const atualizarStatusMutation = trpc.agenda.atualizarStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetchAgendamentos();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
  
  const cancelarAgendamentoMutation = trpc.agenda.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      refetchAgendamentos();
      setModalCancelarAberto(false);
      setModalDetalhesAberto(false);
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });
  
  const transferirAgendamentoMutation = trpc.agenda.transferir.useMutation({
    onSuccess: () => {
      toast.success("Agendamento transferido com sucesso!");
      refetchAgendamentos();
      setModalTransferirAberto(false);
      setModalDetalhesAberto(false);
    },
    onError: (error) => {
      toast.error(`Erro ao transferir: ${error.message}`);
    },
  });
  
  // Função para adicionar log
  const adicionarLog = useCallback((
    agendamentoId: number, 
    tipoAlteracao: string, 
    descricaoAlteracao: string, 
    valoresAnteriores?: any, 
    valoresNovos?: any
  ) => {
    const novoLog = criarEntradaLog({
      agendamentoId,
      tipoAlteracao,
      descricaoAlteracao,
      valoresAnteriores,
      valoresNovos,
      usuarioAtual,
    });
    
    setLogsAgendamentos(prev => ({
      ...prev,
      [agendamentoId]: [novoLog, ...(prev[agendamentoId] || [])],
    }));
  }, [usuarioAtual]);
  
  // Unificar agendamentos e bloqueios em eventos (Erro 8)
  const eventosUnificados = useMemo((): EventoGrade[] => {
    const eventos: EventoGrade[] = [];
    
    // Converter agendamentos para eventos
    agendamentos.forEach((ag: Agendamento) => {
      eventos.push({
        id: ag.id,
        tipo: 'agendamento',
        titulo: ag.pacienteNome || ag.titulo || ag.tipoCompromisso,
        dataHoraInicio: ag.dataHoraInicio,
        dataHoraFim: ag.dataHoraFim || ag.dataHoraInicio,
        tipoCompromisso: ag.tipoCompromisso,
        pacienteNome: ag.pacienteNome,
        status: ag.status,
        local: ag.local,
        convenio: ag.convenio,
        dadosOriginais: ag,
      });
    });
    
    // Converter bloqueios para eventos
    bloqueios.forEach((bl: any) => {
      eventos.push({
        id: bl.id,
        tipo: 'bloqueio',
        titulo: bl.titulo || bl.tipoBloqueio,
        dataHoraInicio: bl.dataHoraInicio,
        dataHoraFim: bl.dataHoraFim,
        tipoBloqueio: bl.tipoBloqueio,
        cancelado: bl.cancelado,
        dadosOriginais: bl,
      });
    });
    
    return eventos;
  }, [agendamentos, bloqueios]);
  
  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((ag: Agendamento) => {
      // Filtro de busca
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        const matchPaciente = ag.pacienteNome?.toLowerCase().includes(termo);
        const matchTipo = ag.tipoCompromisso?.toLowerCase().includes(termo);
        const matchDescricao = ag.descricao?.toLowerCase().includes(termo);
        if (!matchPaciente && !matchTipo && !matchDescricao) return false;
      }
      
      // Filtro de tipo
      if (filtroTipo !== "todos" && ag.tipoCompromisso !== filtroTipo) return false;
      
      // Filtro de status
      if (filtroStatus !== "todos" && ag.status !== filtroStatus) return false;
      
      return true;
    });
  }, [agendamentos, termoBusca, filtroTipo, filtroStatus]);
  
  // Filtrar eventos unificados (agendamentos + bloqueios)
  const eventosFiltrados = useMemo(() => {
    return eventosUnificados.filter((ev: EventoGrade) => {
      // Bloqueios sempre aparecem (não são filtrados por busca/tipo/status)
      if (ev.tipo === 'bloqueio') return true;
      
      // Filtro de busca para agendamentos
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        const matchPaciente = ev.pacienteNome?.toLowerCase().includes(termo);
        const matchTipo = ev.tipoCompromisso?.toLowerCase().includes(termo);
        const matchTitulo = ev.titulo?.toLowerCase().includes(termo);
        if (!matchPaciente && !matchTipo && !matchTitulo) return false;
      }
      
      // Filtro de tipo
      if (filtroTipo !== "todos" && ev.tipoCompromisso !== filtroTipo) return false;
      
      // Filtro de status
      if (filtroStatus !== "todos" && ev.status !== filtroStatus) return false;
      
      return true;
    });
  }, [eventosUnificados, termoBusca, filtroTipo, filtroStatus]);
  
  // Gerar array de horas
  const horas = useMemo(() => {
    const arr = [];
    for (let h = horaInicioDia; h < horaFimDia; h++) {
      arr.push(h);
    }
    return arr;
  }, [horaInicioDia, horaFimDia]);
  
  // Altura de cada hora em pixels
  const ALTURA_HORA = 60;
  
  // Funções de navegação
  const irParaHoje = () => setDataSelecionada(new Date());
  
  const navegarAnterior = () => {
    const novaData = new Date(dataSelecionada);
    if (modoVisualizacao === "dia") {
      novaData.setDate(novaData.getDate() - 1);
    } else if (modoVisualizacao === "semana") {
      novaData.setDate(novaData.getDate() - 7);
    } else if (modoVisualizacao === "mes") {
      novaData.setMonth(novaData.getMonth() - 1);
    } else {
      novaData.setFullYear(novaData.getFullYear() - 1);
    }
    setDataSelecionada(novaData);
  };
  
  const navegarProximo = () => {
    const novaData = new Date(dataSelecionada);
    if (modoVisualizacao === "dia") {
      novaData.setDate(novaData.getDate() + 1);
    } else if (modoVisualizacao === "semana") {
      novaData.setDate(novaData.getDate() + 7);
    } else if (modoVisualizacao === "mes") {
      novaData.setMonth(novaData.getMonth() + 1);
    } else {
      novaData.setFullYear(novaData.getFullYear() + 1);
    }
    setDataSelecionada(novaData);
  };
  
  // Obter dias da semana
  const getDiasSemana = useCallback(() => {
    const dias = [];
    const inicioSemana = new Date(dataSelecionada);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }
    return dias;
  }, [dataSelecionada]);
  
  // Fechar modal de novo agendamento - LIMPA TODOS OS ESTADOS
  // Garante que ao cancelar ou fechar, nenhum dado persiste para o próximo agendamento
  const fecharModalNovo = () => {
    setModalNovoAberto(false);
    setNovoTipoCompromisso("");
    setNovoTitulo("");
    setNovaDataAgendamento("");
    setNovaHoraInicioAgendamento("");
    setNovaHoraFimAgendamento("");
    setNovoLocal("");
    setNovaDescricao("");
    setNovoPacienteId(null);
    setNovoConvenio("");
    setNovoStatus("Agendado");
    setBuscaPaciente("");
    setBuscaPacienteFocado(false);
  };
  
  // Calcular hora fim automaticamente para consultas
  useEffect(() => {
    if (novoTipoCompromisso === "Consulta" && novaHoraInicioAgendamento) {
      const [hora, minuto] = novaHoraInicioAgendamento.split(":").map(Number);
      const dataTemp = new Date();
      dataTemp.setHours(hora, minuto + 30, 0, 0);
      const horaFim = `${String(dataTemp.getHours()).padStart(2, '0')}:${String(dataTemp.getMinutes()).padStart(2, '0')}`;
      setNovaHoraFimAgendamento(horaFim);
    }
  }, [novoTipoCompromisso, novaHoraInicioAgendamento]);
  
  // Definir local padrão para consultas
  useEffect(() => {
    if (novoTipoCompromisso === "Consulta" && !novoLocal) {
      setNovoLocal("Consultório");
    }
  }, [novoTipoCompromisso]);
  
  // Scroll automático para hora atual
  useEffect(() => {
    if (gradeRef.current) {
      const agora = new Date();
      const horaAtual = agora.getHours();
      if (horaAtual >= horaInicioDia && horaAtual < horaFimDia) {
        const scrollTop = (horaAtual - horaInicioDia) * ALTURA_HORA - 100;
        gradeRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [horaInicioDia, horaFimDia]);
  
  // Handler de clique em slot vazio (criação rápida)
  const handleClickSlot = (data: Date, hora: number, minuto: number = 0) => {
    const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    setDataCriacaoRapida(data);
    setHoraCriacaoRapida(horaStr);
    setModalCriacaoRapidaAberto(true);
  };
  
  // Handler de criação rápida
  const handleCriarRapido = (dados: { 
    titulo: string; 
    duracao: number;
    pacienteId?: number;
    pacienteNome?: string;
  }) => {
    const [hora, minuto] = horaCriacaoRapida.split(":").map(Number);
    const dataInicio = new Date(dataCriacaoRapida);
    dataInicio.setHours(hora, minuto, 0, 0);
    
    const dataFim = new Date(dataInicio);
    dataFim.setMinutes(dataFim.getMinutes() + dados.duracao);
    
    // Verificar conflitos
    const conflitos = verificarConflitos(dataInicio, dataFim, agendamentos);
    
    if (conflitos.length > 0) {
      setConflitosDetectados(conflitos);
      setDadosPendentes({
        tipo: "criacaoRapida",
        titulo: dados.titulo,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        pacienteId: dados.pacienteId,
        pacienteNome: dados.pacienteNome,
      });
      setModalConflitosAberto(true);
      setModalCriacaoRapidaAberto(false);
      return;
    }
    
    // Preparar dados do agendamento
    const dadosAgendamento: any = {
      tipoCompromisso: "Consulta",
      titulo: dados.titulo,
      dataHoraInicio: dataInicio.toISOString(),
      dataHoraFim: dataFim.toISOString(),
      local: "Consultório",
      status: "Agendado",
    };
    
    // Se tem pacienteId, usar o paciente existente
    if (dados.pacienteId) {
      dadosAgendamento.pacienteId = dados.pacienteId;
      dadosAgendamento.pacienteNome = dados.pacienteNome;
    } 
    // Se não tem pacienteId mas tem nome (texto livre), criar paciente automaticamente
    else if (dados.pacienteNome && dados.pacienteNome.trim()) {
      dadosAgendamento.pacienteNome = dados.pacienteNome;
      // Enviar dados para criação automática de paciente no backend
      dadosAgendamento.novoPaciente = {
        nome: dados.pacienteNome.trim(),
      };
    }
    
    // Criar agendamento (backend criará paciente automaticamente se necessário)
    criarAgendamentoMutation.mutate(dadosAgendamento);
    
    setModalCriacaoRapidaAberto(false);
  };
  
  // Handler de abrir formulário completo (recebe dados do paciente do modal rápido)
  const handleAbrirFormularioCompleto = (dados: { 
    pacienteId?: number;
    pacienteNome?: string;
    titulo?: string;
  }) => {
    setModalCriacaoRapidaAberto(false);
    setNovaDataAgendamento(formatarDataISO(dataCriacaoRapida));
    setNovaHoraInicioAgendamento(horaCriacaoRapida);
    
    // Preservar dados do paciente selecionado no modal rápido
    if (dados.pacienteId) {
      setNovoPacienteId(dados.pacienteId);
      setBuscaPaciente(dados.pacienteNome || "");
    } else if (dados.pacienteNome) {
      // Se não tem ID mas tem nome (texto livre), preencher busca
      setBuscaPaciente(dados.pacienteNome);
    }
    
    // Preencher título se fornecido
    if (dados.titulo) {
      setNovoTitulo(dados.titulo);
    }
    
    // Definir tipo como Consulta por padrão se tem paciente
    if (dados.pacienteId || dados.pacienteNome) {
      setNovoTipoCompromisso("Consulta");
    }
    
    setModalNovoAberto(true);
  };
  
  // Handlers de drag and drop
  const handleDragStart = (e: React.DragEvent, agendamento: Agendamento) => {
    // Não permitir arrastar cancelados, transferidos ou encerrados
    if (["Cancelado", "Transferido", "Encerrado", "Falta"].includes(agendamento.status)) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    setDraggedAgendamento(agendamento);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(agendamento.id));
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedAgendamento(null);
    setDropTarget(null);
  };
  
  const handleDragOver = (e: React.DragEvent, data: Date, hora: number, minuto: number = 0) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    setDropTarget({ data, hora: horaStr });
  };
  
  const handleDragLeave = () => {
    setDropTarget(null);
  };
  
  const handleDrop = (e: React.DragEvent, data: Date, hora: number, minuto: number = 0) => {
    e.preventDefault();
    
    if (!draggedAgendamento) return;
    
    const [horaNum, minutoNum] = [hora, minuto];
    const novaDataInicio = new Date(data);
    novaDataInicio.setHours(horaNum, minutoNum, 0, 0);
    
    // Calcular duração original
    const inicioOriginal = new Date(draggedAgendamento.dataHoraInicio);
    const fimOriginal = draggedAgendamento.dataHoraFim 
      ? new Date(draggedAgendamento.dataHoraFim) 
      : new Date(inicioOriginal.getTime() + 30 * 60000);
    const duracao = fimOriginal.getTime() - inicioOriginal.getTime();
    
    const novaDataFim = new Date(novaDataInicio.getTime() + duracao);
    
    // Verificar conflitos
    const conflitos = verificarConflitos(novaDataInicio, novaDataFim, agendamentos, draggedAgendamento.id);
    
    if (conflitos.length > 0) {
      setConflitosDetectados(conflitos);
      setDadosPendentes({
        tipo: "dragDrop",
        agendamentoId: draggedAgendamento.id,
        novaDataInicio: novaDataInicio.toISOString(),
        novaDataFim: novaDataFim.toISOString(),
        dataAnterior: draggedAgendamento.dataHoraInicio,
      });
      setModalConflitosAberto(true);
    } else {
      executarDragDrop(draggedAgendamento.id, novaDataInicio, novaDataFim, draggedAgendamento.dataHoraInicio);
    }
    
    handleDragEnd();
  };
  
  const executarDragDrop = (agendamentoId: number, novaDataInicio: Date, novaDataFim: Date, dataAnterior: string | Date) => {
    // Registrar log
    adicionarLog(
      agendamentoId,
      "Drag and Drop",
      `Agendamento movido de ${formatarHora(dataAnterior)} para ${formatarHora(novaDataInicio.toISOString())}`,
      { dataHoraInicio: dataAnterior },
      { dataHoraInicio: novaDataInicio.toISOString() }
    );
    
    // TODO: Chamar mutation para atualizar no backend
    // atualizarAgendamentoMutation.mutate({
    //   id: agendamentoId,
    //   dataHoraInicio: novaDataInicio.toISOString(),
    //   dataHoraFim: novaDataFim.toISOString(),
    // });
    
    toast.success("Agendamento movido com sucesso!");
    refetchAgendamentos();
  };
  
  // Handler de confirmar apesar de conflitos
  const handleConfirmarComConflitos = () => {
    if (!dadosPendentes) return;
    
    if (dadosPendentes.tipo === "criacaoRapida") {
      // Preparar dados do agendamento
      const dadosAgendamento: any = {
        tipoCompromisso: "Consulta",
        titulo: dadosPendentes.titulo,
        dataHoraInicio: dadosPendentes.dataInicio,
        dataHoraFim: dadosPendentes.dataFim,
        local: "Consultório",
        status: "Agendado",
      };
      
      // Se tem pacienteId, usar o paciente existente
      if (dadosPendentes.pacienteId) {
        dadosAgendamento.pacienteId = dadosPendentes.pacienteId;
        dadosAgendamento.pacienteNome = dadosPendentes.pacienteNome;
      } 
      // Se não tem pacienteId mas tem nome (texto livre), criar paciente automaticamente
      else if (dadosPendentes.pacienteNome && dadosPendentes.pacienteNome.trim()) {
        dadosAgendamento.pacienteNome = dadosPendentes.pacienteNome;
        dadosAgendamento.novoPaciente = {
          nome: dadosPendentes.pacienteNome.trim(),
        };
      }
      
      criarAgendamentoMutation.mutate(dadosAgendamento);
    } else if (dadosPendentes.tipo === "dragDrop") {
      executarDragDrop(
        dadosPendentes.agendamentoId,
        new Date(dadosPendentes.novaDataInicio),
        new Date(dadosPendentes.novaDataFim),
        dadosPendentes.dataAnterior
      );
    }
    
    setModalConflitosAberto(false);
    setDadosPendentes(null);
    setConflitosDetectados([]);
  };
  
  // Handlers de ações de status
  const handleWhatsApp = () => {
    if (agendamentoSelecionado?.pacienteTelefone) {
      abrirWhatsAppConfirmacao(agendamentoSelecionado.pacienteTelefone, agendamentoSelecionado);
      adicionarLog(
        agendamentoSelecionado.id,
        "WhatsApp Enviado",
        `Mensagem de confirmação enviada via WhatsApp para ${agendamentoSelecionado.pacienteTelefone}`
      );
    } else {
      toast.error("Paciente não possui telefone cadastrado");
    }
  };
  
  const handleConfirmar = () => {
    if (!agendamentoSelecionado) return;
    adicionarLog(
      agendamentoSelecionado.id,
      "Confirmação",
      `Status alterado de ${agendamentoSelecionado.status} para Confirmado`,
      { status: agendamentoSelecionado.status },
      { status: "Confirmado" }
    );
    atualizarStatusMutation.mutate({ id: agendamentoSelecionado.id, novoStatus: "Confirmado" });
  };
  
  const handleAguardando = () => {
    if (!agendamentoSelecionado) return;
    adicionarLog(
      agendamentoSelecionado.id,
      "Mudança de Status",
      `Paciente chegou - Status alterado para Aguardando`,
      { status: agendamentoSelecionado.status },
      { status: "Aguardando" }
    );
    atualizarStatusMutation.mutate({ id: agendamentoSelecionado.id, novoStatus: "Aguardando" });
  };
  
  const handleCancelar = () => {
    if (!agendamentoSelecionado || !motivoCancelamento.trim()) return;
    adicionarLog(
      agendamentoSelecionado.id,
      "Cancelamento",
      `Agendamento cancelado. Motivo: ${motivoCancelamento}`,
      { status: agendamentoSelecionado.status },
      { status: "Cancelado", motivo: motivoCancelamento }
    );
    cancelarAgendamentoMutation.mutate({ 
      id: agendamentoSelecionado.id, 
      motivo: motivoCancelamento 
    });
    setMotivoCancelamento("");
  };
  
  const handleFalta = () => {
    if (!agendamentoSelecionado) return;
    adicionarLog(
      agendamentoSelecionado.id,
      "Falta",
      `Paciente não compareceu`,
      { status: agendamentoSelecionado.status },
      { status: "Falta" }
    );
    atualizarStatusMutation.mutate({ id: agendamentoSelecionado.id, novoStatus: "Falta" });
  };
  
  const handleAbrirTransferir = () => {
    if (!agendamentoSelecionado) return;
    const dataOriginal = new Date(agendamentoSelecionado.dataHoraInicio);
    setNovaData(formatarDataISO(dataOriginal));
    setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
    setNovaHoraFim(agendamentoSelecionado.dataHoraFim ? formatarHora(agendamentoSelecionado.dataHoraFim) : "");
    setModalTransferirAberto(true);
  };
  
  const handleTransferir = () => {
    if (!agendamentoSelecionado || !novaData || !novaHoraInicio || !novaHoraFim) return;
    
    const novaDataInicio = new Date(`${novaData}T${novaHoraInicio}`);
    const novaDataFim = new Date(`${novaData}T${novaHoraFim}`);
    
    adicionarLog(
      agendamentoSelecionado.id,
      "Transferência",
      `Agendamento transferido de ${formatarData(new Date(agendamentoSelecionado.dataHoraInicio))} para ${formatarData(novaDataInicio)}`,
      { 
        dataHoraInicio: agendamentoSelecionado.dataHoraInicio,
        dataHoraFim: agendamentoSelecionado.dataHoraFim 
      },
      { 
        dataHoraInicio: novaDataInicio.toISOString(),
        dataHoraFim: novaDataFim.toISOString() 
      }
    );
    
    transferirAgendamentoMutation.mutate({
      idOriginal: agendamentoSelecionado.id,
      novaDataInicio: novaDataInicio,
      novaDataFim: novaDataFim,
    });
  };
  
  const handleReativar = () => {
    setModalReativarAberto(true);
  };
  
  const handleReativarMesmaData = () => {
    if (!agendamentoSelecionado) return;
    adicionarLog(
      agendamentoSelecionado.id,
      "Reativação",
      `Agendamento reativado na mesma data`,
      { status: agendamentoSelecionado.status },
      { status: "Agendado" }
    );
    atualizarStatusMutation.mutate({ id: agendamentoSelecionado.id, novoStatus: "Agendado" });
    setModalReativarAberto(false);
  };
  
  const handleReativarTransferir = () => {
    setModalReativarAberto(false);
    handleAbrirTransferir();
  };
  
  const handleIniciarAtendimento = () => {
    if (!agendamentoSelecionado) return;
    // Navegar para tela de atendimentos
    setLocation(`/atendimentos/novo?pacienteId=${agendamentoSelecionado.pacienteId}&agendamentoId=${agendamentoSelecionado.id}`);
  };
  
  const handleRegistrarAtendimento = () => {
    if (!agendamentoSelecionado) return;
    // Navegar para tela de evolução no prontuário
    setLocation(`/prontuario/${agendamentoSelecionado.pacienteId}/evolucao/nova?agendamentoId=${agendamentoSelecionado.id}`);
  };
  
  const handleNovoAgendamentoReaproveitando = () => {
    if (!agendamentoSelecionado) return;
    // Preencher formulário com dados do agendamento anterior
    setNovoTipoCompromisso(agendamentoSelecionado.tipoCompromisso);
    setNovoPacienteId(agendamentoSelecionado.pacienteId || null);
    setNovoLocal(agendamentoSelecionado.local || "");
    setNovoConvenio(agendamentoSelecionado.convenio || "");
    setModalDetalhesAberto(false);
    setModalNovoAberto(true);
  };
  
  // Adicionar delegado
  const handleAdicionarDelegado = () => {
    if (!novoDelegadoEmail.trim()) {
      toast.error("Informe o e-mail do delegado");
      return;
    }
    
    const novoDelegado: Delegado = {
      id: Date.now(),
      email: novoDelegadoEmail,
      nome: novoDelegadoEmail.split("@")[0],
      permissao: novoDelegadoPermissao,
      adicionadoEm: new Date().toISOString(),
    };
    
    setDelegados(prev => [...prev, novoDelegado]);
    setNovoDelegadoEmail("");
    toast.success("Delegado adicionado com sucesso!");
  };
  
  // Remover delegado
  const handleRemoverDelegado = (id: number) => {
    setDelegados(prev => prev.filter(d => d.id !== id));
    toast.success("Delegado removido");
  };
  
  // Criar novo agendamento
  const handleCriarAgendamento = () => {
    if (!novoTipoCompromisso || !novaDataAgendamento || !novaHoraInicioAgendamento) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    const dataInicio = new Date(`${novaDataAgendamento}T${novaHoraInicioAgendamento}`);
    const dataFim = novaHoraFimAgendamento 
      ? new Date(`${novaDataAgendamento}T${novaHoraFimAgendamento}`)
      : new Date(dataInicio.getTime() + 30 * 60000);
    
    // VALIDAÇÃO: Hora de fim deve ser posterior à hora de início
    if (dataFim <= dataInicio) {
      toast.error("A hora de término deve ser posterior à hora de início.");
      return;
    }
    
    // Verificar horário de trabalho
    const verificacaoHorario = verificarHorarioTrabalho(
      dataInicio,
      novaHoraInicioAgendamento,
      novaHoraFimAgendamento || formatarHora(dataFim.toISOString()),
      horariosTrabalho
    );
    
    if (!verificacaoHorario.dentroHorario) {
      toast.warning(verificacaoHorario.mensagem);
    }
    
    // Verificar conflitos
    const conflitos = verificarConflitos(dataInicio, dataFim, agendamentos);
    
    if (conflitos.length > 0) {
      setConflitosDetectados(conflitos);
      setDadosPendentes({
        tipo: "novoAgendamento",
        tipoCompromisso: novoTipoCompromisso,
        titulo: novoTitulo,
        dataHoraInicio: dataInicio.toISOString(),
        dataHoraFim: dataFim.toISOString(),
        local: novoLocal,
        descricao: novaDescricao,
        pacienteId: novoPacienteId,
        convenio: novoConvenio,
        status: novoStatus,
      });
      setModalConflitosAberto(true);
      return;
    }
    
    // Preparar dados do agendamento
    const dadosAgendamento: any = {
      tipoCompromisso: novoTipoCompromisso,
      titulo: novoTitulo,
      dataHoraInicio: dataInicio.toISOString(),
      dataHoraFim: dataFim.toISOString(),
      local: novoLocal,
      descricao: novaDescricao,
      convenio: novoConvenio,
      status: novoStatus,
    };
    
    // Se tem pacienteId, usar o paciente existente
    if (novoPacienteId) {
      dadosAgendamento.pacienteId = novoPacienteId;
    } 
    // Se não tem pacienteId mas tem nome no campo de busca (texto livre), criar paciente automaticamente
    else if (buscaPaciente && buscaPaciente.trim() && novoTipoCompromisso === "Consulta") {
      dadosAgendamento.pacienteNome = buscaPaciente.trim();
      // Enviar dados para criação automática de paciente no backend
      dadosAgendamento.novoPaciente = {
        nome: buscaPaciente.trim(),
        convenio: novoConvenio || undefined,
      };
    }
    
    // Criar agendamento (backend criará paciente automaticamente se necessário)
    criarAgendamentoMutation.mutate(dadosAgendamento);
  };
  
  // Renderizar evento na grade (agendamento)
  const renderizarEvento = (agendamento: Agendamento, diaIndex?: number) => {
    const inicio = new Date(agendamento.dataHoraInicio);
    const fim = agendamento.dataHoraFim 
      ? new Date(agendamento.dataHoraFim) 
      : new Date(inicio.getTime() + 30 * 60000);
    
    const horaInicio = inicio.getHours();
    const minutoInicio = inicio.getMinutes();
    const horaFim = fim.getHours();
    const minutoFim = fim.getMinutes();
    
    // Calcular posição e altura
    const topMinutos = (horaInicio - horaInicioDia) * 60 + minutoInicio;
    const duracaoMinutos = (horaFim - horaInicio) * 60 + (minutoFim - minutoInicio);
    
    const top = topMinutos;
    const height = Math.max(duracaoMinutos, 20);
    
    const corTipo = CORES_TIPO[agendamento.tipoCompromisso] || "bg-gray-500";
    const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === agendamento.status);
    const StatusIcon = statusInfo?.icon;
    
    const isCanceladoOuFalta = ["Cancelado", "Falta", "Transferido"].includes(agendamento.status);
    const isDraggable = !isCanceladoOuFalta && !["Encerrado"].includes(agendamento.status);
    
    return (
      <div
        key={agendamento.id}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, agendamento)}
        onDragEnd={handleDragEnd}
        onClick={() => {
          setAgendamentoSelecionado(agendamento);
          setModalDetalhesAberto(true);
        }}
        className={`
          absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer overflow-hidden
          ${corTipo} text-white text-xs
          ${isCanceladoOuFalta ? "opacity-30 line-through" : ""}
          ${isDragging && draggedAgendamento?.id === agendamento.id ? "opacity-50 ring-2 ring-blue-400" : ""}
          ${isDraggable ? "hover:ring-2 hover:ring-white/50" : ""}
          transition-all
        `}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          minHeight: "20px",
        }}
      >
        <div className="flex items-center gap-1">
          {isDraggable && <GripVertical className="w-3 h-3 opacity-50 flex-shrink-0" />}
          {StatusIcon && <StatusIcon className="w-3 h-3 flex-shrink-0" />}
          <span className="font-medium truncate">
            {formatarHora(agendamento.dataHoraInicio)}
          </span>
          {/* Sempre mostrar nome/título na mesma linha quando altura é pequena */}
          {height <= 30 && (
            <span className="truncate ml-1">
              - {agendamento.pacienteNome || agendamento.titulo || agendamento.tipoCompromisso}
            </span>
          )}
        </div>
        {/* Mostrar em linha separada quando há espaço */}
        {height > 30 && (
          <div className="truncate font-medium">
            {agendamento.pacienteNome || agendamento.titulo || agendamento.tipoCompromisso}
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar bloqueio na grade (Erro 8)
  const renderizarBloqueio = (bloqueio: any, diaIndex?: number) => {
    const inicio = new Date(bloqueio.dataHoraInicio);
    const fim = new Date(bloqueio.dataHoraFim);
    
    const horaInicio = inicio.getHours();
    const minutoInicio = inicio.getMinutes();
    const horaFim = fim.getHours();
    const minutoFim = fim.getMinutes();
    
    // Calcular posição e altura
    const topMinutos = (horaInicio - horaInicioDia) * 60 + minutoInicio;
    const duracaoMinutos = (horaFim - horaInicio) * 60 + (minutoFim - minutoInicio);
    
    const top = topMinutos;
    const height = Math.max(duracaoMinutos, 20);
    
    return (
      <div
        key={`bloqueio-${bloqueio.id}`}
        className="absolute left-1 right-1 rounded-md px-2 py-1 cursor-not-allowed overflow-hidden bg-gray-400 text-white text-xs border-2 border-dashed border-gray-600"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          minHeight: "20px",
        }}
        title={`Bloqueio: ${bloqueio.titulo || bloqueio.tipoBloqueio}`}
      >
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span className="font-medium truncate">
            {formatarHora(bloqueio.dataHoraInicio)}
          </span>
        </div>
        {height > 30 && (
          <div className="truncate">
            {bloqueio.titulo || bloqueio.tipoBloqueio}
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar visualização de semana
  const renderizarVisualizacaoSemana = () => {
    const diasSemana = getDiasSemana();
    const hoje = new Date();
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    
    return (
      <div className="flex flex-col h-full">
        {/* Cabeçalho dos dias */}
        <div className="flex border-b sticky top-0 bg-white z-10">
          <div className="w-16 flex-shrink-0 border-r" />
          {diasSemana.map((dia, index) => {
            const isHoje = dia.toDateString() === hoje.toDateString();
            const feriado = getFeriado(dia);
            const horarioDia = horariosTrabalho.find(h => h.diaSemana === dia.getDay());
            const isDiaTrabalho = horarioDia?.ativo;
            
            return (
              <div 
                key={index} 
                className={`flex-1 text-center py-2 border-r ${!isDiaTrabalho ? "bg-gray-50" : ""}`}
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {dia.toLocaleDateString("pt-BR", { weekday: "short" })}
                </div>
                <div className={`
                  text-lg font-semibold
                  ${isHoje ? "bg-[#6B8CBE] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}
                `}>
                  {dia.getDate()}
                </div>
                {feriado && (
                  <div className="text-xs text-red-500 truncate px-1">{feriado}</div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Grade de horários */}
        <ScrollArea className="flex-1" ref={gradeRef}>
          <div className="flex relative" style={{ height: `${horas.length * ALTURA_HORA}px` }}>
            {/* Coluna de horas */}
            <div className="w-16 flex-shrink-0 border-r">
              {horas.map((hora) => (
                <div 
                  key={hora} 
                  className="border-b text-xs text-muted-foreground pr-2 text-right"
                  style={{ height: `${ALTURA_HORA}px` }}
                >
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            {/* Colunas dos dias */}
            {diasSemana.map((dia, diaIndex) => {
              const horarioDia = horariosTrabalho.find(h => h.diaSemana === dia.getDay());
              const isDiaTrabalho = horarioDia?.ativo;
              
              // Filtrar agendamentos do dia
              const agendamentosDia = agendamentosFiltrados.filter((ag: Agendamento) => {
                const dataAg = new Date(ag.dataHoraInicio);
                return dataAg.toDateString() === dia.toDateString();
              });
              
              // Filtrar bloqueios do dia (Erro 8)
              const bloqueiosDia = bloqueios.filter((bl: any) => {
                const dataBl = new Date(bl.dataHoraInicio);
                return dataBl.toDateString() === dia.toDateString() && !bl.cancelado;
              });
              
              return (
                <div 
                  key={diaIndex} 
                  className={`flex-1 border-r relative ${!isDiaTrabalho ? "bg-gray-50" : ""}`}
                >
                  {/* Slots de hora */}
                  {horas.map((hora) => (
                    <div 
                      key={hora}
                      className="border-b relative"
                      style={{ height: `${ALTURA_HORA}px` }}
                    >
                      {/* Slot da hora cheia */}
                      <div 
                        className={`
                          absolute inset-x-0 top-0 h-1/2 
                          ${dropTarget?.data.toDateString() === dia.toDateString() && dropTarget?.hora === `${String(hora).padStart(2, '0')}:00` 
                            ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" 
                            : "hover:bg-gray-100"
                          }
                          cursor-pointer transition-colors
                        `}
                        onClick={() => handleClickSlot(dia, hora, 0)}
                        onDragOver={(e) => handleDragOver(e, dia, hora, 0)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dia, hora, 0)}
                      />
                      {/* Slot da meia hora */}
                      <div 
                        className={`
                          absolute inset-x-0 bottom-0 h-1/2 border-t border-dashed border-gray-200
                          ${dropTarget?.data.toDateString() === dia.toDateString() && dropTarget?.hora === `${String(hora).padStart(2, '0')}:30` 
                            ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" 
                            : "hover:bg-gray-100"
                          }
                          cursor-pointer transition-colors
                        `}
                        onClick={() => handleClickSlot(dia, hora, 30)}
                        onDragOver={(e) => handleDragOver(e, dia, hora, 30)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dia, hora, 30)}
                      />
                    </div>
                  ))}
                  
                  {/* Linha de hora atual */}
                  {dia.toDateString() === hoje.toDateString() && horaAtual >= horaInicioDia && horaAtual < horaFimDia && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                      style={{ 
                        top: `${(horaAtual - horaInicioDia) * ALTURA_HORA + minutoAtual}px` 
                      }}
                    >
                      <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  )}
                  
                  {/* Eventos */}
                  {agendamentosDia.map((ag: Agendamento) => renderizarEvento(ag, diaIndex))}
                  
                  {/* Bloqueios (Erro 8) */}
                  {bloqueiosDia.map((bl: any) => renderizarBloqueio(bl, diaIndex))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };
  
  // Renderizar visualização de dia
  const renderizarVisualizacaoDia = () => {
    const hoje = new Date();
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const isHoje = dataSelecionada.toDateString() === hoje.toDateString();
    const horarioDia = horariosTrabalho.find(h => h.diaSemana === dataSelecionada.getDay());
    const isDiaTrabalho = horarioDia?.ativo;
    
    // Filtrar agendamentos do dia
    const agendamentosDia = agendamentosFiltrados.filter((ag: Agendamento) => {
      const dataAg = new Date(ag.dataHoraInicio);
      return dataAg.toDateString() === dataSelecionada.toDateString();
    });
    
    // Filtrar bloqueios do dia (Erro 8)
    const bloqueiosDia = bloqueios.filter((bl: any) => {
      const dataBl = new Date(bl.dataHoraInicio);
      return dataBl.toDateString() === dataSelecionada.toDateString() && !bl.cancelado;
    });
    
    return (
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className={`text-center py-3 border-b ${!isDiaTrabalho ? "bg-gray-50" : ""}`}>
          <div className="text-lg font-semibold">
            {dataSelecionada.toLocaleDateString("pt-BR", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}
          </div>
          {getFeriado(dataSelecionada) && (
            <div className="text-sm text-red-500">{getFeriado(dataSelecionada)}</div>
          )}
        </div>
        
        {/* Grade */}
        <ScrollArea className="flex-1" ref={gradeRef}>
          <div className="flex relative" style={{ height: `${horas.length * ALTURA_HORA}px` }}>
            {/* Coluna de horas */}
            <div className="w-16 flex-shrink-0 border-r">
              {horas.map((hora) => (
                <div 
                  key={hora} 
                  className="border-b text-xs text-muted-foreground pr-2 text-right"
                  style={{ height: `${ALTURA_HORA}px` }}
                >
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            {/* Coluna do dia */}
            <div className={`flex-1 relative ${!isDiaTrabalho ? "bg-gray-50" : ""}`}>
              {/* Slots de hora */}
              {horas.map((hora) => (
                <div 
                  key={hora}
                  className="border-b relative"
                  style={{ height: `${ALTURA_HORA}px` }}
                >
                  <div 
                    className={`
                      absolute inset-x-0 top-0 h-1/2 
                      ${dropTarget?.hora === `${String(hora).padStart(2, '0')}:00` 
                        ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" 
                        : "hover:bg-gray-100"
                      }
                      cursor-pointer transition-colors
                    `}
                    onClick={() => handleClickSlot(dataSelecionada, hora, 0)}
                    onDragOver={(e) => handleDragOver(e, dataSelecionada, hora, 0)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dataSelecionada, hora, 0)}
                  />
                  <div 
                    className={`
                      absolute inset-x-0 bottom-0 h-1/2 border-t border-dashed border-gray-200
                      ${dropTarget?.hora === `${String(hora).padStart(2, '0')}:30` 
                        ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" 
                        : "hover:bg-gray-100"
                      }
                      cursor-pointer transition-colors
                    `}
                    onClick={() => handleClickSlot(dataSelecionada, hora, 30)}
                    onDragOver={(e) => handleDragOver(e, dataSelecionada, hora, 30)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dataSelecionada, hora, 30)}
                  />
                </div>
              ))}
              
              {/* Linha de hora atual */}
              {isHoje && horaAtual >= horaInicioDia && horaAtual < horaFimDia && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                  style={{ 
                    top: `${(horaAtual - horaInicioDia) * ALTURA_HORA + minutoAtual}px` 
                  }}
                >
                  <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )}
              
              {/* Eventos */}
              {agendamentosDia.map((ag: Agendamento) => renderizarEvento(ag))}
              
              {/* Bloqueios (Erro 8) */}
              {bloqueiosDia.map((bl: any) => renderizarBloqueio(bl))}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };
  
  // Renderizar visualização de mês
  const renderizarVisualizacaoMes = () => {
    const primeiroDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1);
    const ultimoDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0);
    const hoje = new Date();
    
    // Ajustar para começar no domingo
    const inicioCalendario = new Date(primeiroDia);
    inicioCalendario.setDate(inicioCalendario.getDate() - inicioCalendario.getDay());
    
    const semanas = [];
    let diaAtual = new Date(inicioCalendario);
    
    while (diaAtual <= ultimoDia || semanas.length < 6) {
      const semana = [];
      for (let i = 0; i < 7; i++) {
        semana.push(new Date(diaAtual));
        diaAtual.setDate(diaAtual.getDate() + 1);
      }
      semanas.push(semana);
      if (semanas.length >= 6) break;
    }
    
    return (
      <div className="flex flex-col h-full">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b">
          {DIAS_SEMANA.map(dia => (
            <div key={dia.value} className="text-center py-2 text-sm font-medium text-muted-foreground">
              {dia.abrev}
            </div>
          ))}
        </div>
        
        {/* Semanas */}
        <div className="flex-1 grid grid-rows-6">
          {semanas.map((semana, semanaIndex) => (
            <div key={semanaIndex} className="grid grid-cols-7 border-b">
              {semana.map((dia, diaIndex) => {
                const isMesAtual = dia.getMonth() === dataSelecionada.getMonth();
                const isHoje = dia.toDateString() === hoje.toDateString();
                const feriado = getFeriado(dia);
                const horarioDia = horariosTrabalho.find(h => h.diaSemana === dia.getDay());
                const isDiaTrabalho = horarioDia?.ativo;
                
                // Agendamentos do dia
                const agendamentosDia = agendamentosFiltrados.filter((ag: Agendamento) => {
                  const dataAg = new Date(ag.dataHoraInicio);
                  return dataAg.toDateString() === dia.toDateString();
                });
                
                return (
                  <div 
                    key={diaIndex}
                    className={`
                      border-r p-1 min-h-[100px] cursor-pointer
                      ${!isMesAtual ? "bg-gray-50 text-muted-foreground" : ""}
                      ${!isDiaTrabalho && isMesAtual ? "bg-gray-100" : ""}
                      hover:bg-blue-50 transition-colors
                    `}
                    onClick={() => {
                      setDataSelecionada(dia);
                      setModoVisualizacao("dia");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-sm font-medium
                        ${isHoje ? "bg-[#6B8CBE] text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}
                      `}>
                        {dia.getDate()}
                      </span>
                      {feriado && <span className="text-xs text-red-500">🎉</span>}
                    </div>
                    
                    {/* Mini eventos */}
                    <div className="mt-1 space-y-0.5">
                      {agendamentosDia.slice(0, 3).map((ag: Agendamento) => {
                        const corTipo = CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500";
                        const isCancelado = ["Cancelado", "Falta", "Transferido"].includes(ag.status);
                        
                        return (
                          <div 
                            key={ag.id}
                            className={`
                              text-xs px-1 py-0.5 rounded truncate text-white
                              ${corTipo}
                              ${isCancelado ? "opacity-30 line-through" : ""}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAgendamentoSelecionado(ag);
                              setModalDetalhesAberto(true);
                            }}
                          >
                            {formatarHora(ag.dataHoraInicio)} {ag.pacienteNome || ag.tipoCompromisso}
                          </div>
                        );
                      })}
                      {agendamentosDia.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{agendamentosDia.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Renderizar visualização de ano
  const renderizarVisualizacaoAno = () => {
    const anoAtual = dataSelecionada.getFullYear();
    const hoje = new Date();
    const meses = [];
    
    // Gerar array de 12 meses
    for (let mes = 0; mes < 12; mes++) {
      meses.push(new Date(anoAtual, mes, 1));
    }
    
    const NOMES_MESES = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          {/* Título do ano */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{anoAtual}</h2>
          </div>
          
          {/* Grid de 12 meses (4x3) */}
          <div className="grid grid-cols-4 gap-4">
            {meses.map((mesData, mesIndex) => {
              // Calcular primeiro e último dia do mês
              const primeiroDia = new Date(anoAtual, mesIndex, 1);
              const ultimoDia = new Date(anoAtual, mesIndex + 1, 0);
              
              // Ajustar para começar no domingo
              const inicioCalendario = new Date(primeiroDia);
              inicioCalendario.setDate(inicioCalendario.getDate() - inicioCalendario.getDay());
              
              // Gerar semanas do mês
              const semanas = [];
              let diaAtual = new Date(inicioCalendario);
              
              while (diaAtual <= ultimoDia || semanas.length < 6) {
                const semana = [];
                for (let i = 0; i < 7; i++) {
                  semana.push(new Date(diaAtual));
                  diaAtual.setDate(diaAtual.getDate() + 1);
                }
                semanas.push(semana);
                if (semanas.length >= 6) break;
              }
              
              // Contar agendamentos do mês
              const agendamentosMes = agendamentosFiltrados.filter((ag: Agendamento) => {
                const dataAg = new Date(ag.dataHoraInicio);
                return dataAg.getMonth() === mesIndex && dataAg.getFullYear() === anoAtual;
              });
              
              const isMesAtual = hoje.getMonth() === mesIndex && hoje.getFullYear() === anoAtual;
              
              return (
                <div 
                  key={mesIndex}
                  className={`
                    border rounded-lg p-2 cursor-pointer hover:bg-blue-50 transition-colors
                    ${isMesAtual ? "ring-2 ring-blue-500" : ""}
                  `}
                  onClick={() => {
                    setDataSelecionada(new Date(anoAtual, mesIndex, 1));
                    setModoVisualizacao("mes");
                  }}
                >
                  {/* Nome do mês */}
                  <div className="text-center mb-2">
                    <span className={`text-sm font-semibold ${isMesAtual ? "text-blue-600" : ""}`}>
                      {NOMES_MESES[mesIndex]}
                    </span>
                    {agendamentosMes.length > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {agendamentosMes.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Mini calendário */}
                  <div className="text-xs">
                    {/* Cabeçalho dias da semana */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                        <div key={i} className="text-center text-muted-foreground font-medium">
                          {d}
                        </div>
                      ))}
                    </div>
                    
                    {/* Semanas */}
                    {semanas.map((semana, semanaIndex) => (
                      <div key={semanaIndex} className="grid grid-cols-7 gap-0.5">
                        {semana.map((dia, diaIndex) => {
                          const isMesCorreto = dia.getMonth() === mesIndex;
                          const isHoje = dia.toDateString() === hoje.toDateString();
                          
                          // Contar agendamentos do dia
                          const agendamentosDia = agendamentosFiltrados.filter((ag: Agendamento) => {
                            const dataAg = new Date(ag.dataHoraInicio);
                            return dataAg.toDateString() === dia.toDateString();
                          });
                          
                          const temAgendamentos = agendamentosDia.length > 0;
                          
                          return (
                            <div 
                              key={diaIndex}
                              className={`
                                text-center py-0.5 rounded
                                ${!isMesCorreto ? "text-gray-300" : ""}
                                ${isHoje ? "bg-[#6B8CBE] text-white font-bold" : ""}
                                ${temAgendamentos && !isHoje ? "bg-[#E8F0F8] text-[#6B8CBE] font-medium" : ""}
                              `}
                              title={temAgendamentos ? `${agendamentosDia.length} agendamento(s)` : undefined}
                            >
                              {dia.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    );
  };
  
  // Paciente selecionado info
  const pacienteSelecionadoInfo = useMemo(() => {
    if (!novoPacienteId) return null;
    return pacientes.find((p: any) => p.id === novoPacienteId);
  }, [novoPacienteId, pacientes]);
  
  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <div className="text-lg text-muted-foreground">
            {dataSelecionada.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="w-80">
            <SearchBar
              value={termoBusca}
              onChange={setTermoBusca}
              filtroTipo={filtroTipo}
              onFiltroTipoChange={setFiltroTipo}
              filtroStatus={filtroStatus}
              onFiltroStatusChange={setFiltroStatus}
            />
          </div>
          
          {/* Navegação */}
          <Button variant="outline" size="icon" onClick={navegarAnterior}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={navegarProximo}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {/* Modo de visualização */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={modoVisualizacao === "dia" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setModoVisualizacao("dia")}
              className="rounded-none"
            >
              Dia
            </Button>
            <Button 
              variant={modoVisualizacao === "semana" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setModoVisualizacao("semana")}
              className="rounded-none"
            >
              Semana
            </Button>
            <Button 
              variant={modoVisualizacao === "mes" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setModoVisualizacao("mes")}
              className="rounded-none"
            >
              Mês
            </Button>
            <Button 
              variant={modoVisualizacao === "ano" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setModoVisualizacao("ano")}
              className="rounded-none"
            >
              Ano
            </Button>
          </div>
          
          {/* Botões de ação */}
          <Button variant="outline" size="icon" onClick={() => setModalHorariosTrabalhoAberto(true)}>
            <Briefcase className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setModalConfigAberto(true)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setModalDelegadosAberto(true)}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setModalBloqueioAberto(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Bloquear
          </Button>
          <Button onClick={() => setModalNovoAberto(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>
      
      {/* Grade de visualização */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {modoVisualizacao === "dia" && renderizarVisualizacaoDia()}
          {modoVisualizacao === "semana" && renderizarVisualizacaoSemana()}
          {modoVisualizacao === "mes" && renderizarVisualizacaoMes()}
          {modoVisualizacao === "ano" && renderizarVisualizacaoAno()}
        </CardContent>
      </Card>
      
      {/* MODAIS */}
      
      {/* Modal de Configurações */}
      <Dialog open={modalConfigAberto} onOpenChange={setModalConfigAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-6 h-6" />
              Configurações da Agenda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-base">Horário de Visualização</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Defina o intervalo de horas visíveis na grade
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Hora Início</Label>
                  <Select value={String(horaInicioDia)} onValueChange={(v) => setHoraInicioDia(Number(v))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Hora Fim</Label>
                  <Select value={String(horaFimDia)} onValueChange={(v) => setHoraFimDia(Number(v))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(i => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setHoraInicioDia(8); setHoraFimDia(18); }}>
                Comercial (8h-18h)
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setHoraInicioDia(0); setHoraFimDia(24); }}>
                24 horas
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setHoraInicioDia(6); setHoraFimDia(12); }}>
                Manhã (6h-12h)
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setHoraInicioDia(12); setHoraFimDia(20); }}>
                Tarde (12h-20h)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalConfigAberto(false)} size="lg">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Delegados */}
      <Dialog open={modalDelegadosAberto} onOpenChange={setModalDelegadosAberto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="w-6 h-6 text-blue-500" />
              Delegados da Agenda
            </DialogTitle>
            <DialogDescription className="text-base">
              Permita que outras pessoas visualizem ou editem sua agenda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Adicionar delegado */}
            <div className="flex gap-2">
              <Input
                placeholder="E-mail do delegado"
                value={novoDelegadoEmail}
                onChange={(e) => setNovoDelegadoEmail(e.target.value)}
                className="flex-1 h-11"
              />
              <Select value={novoDelegadoPermissao} onValueChange={(v: "visualizar" | "editar") => setNovoDelegadoPermissao(v)}>
                <SelectTrigger className="w-36 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visualizar">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </div>
                  </SelectItem>
                  <SelectItem value="editar">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAdicionarDelegado} size="icon" className="h-11 w-11">
                <UserPlus className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Lista de delegados */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {delegados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum delegado adicionado
                </div>
              ) : (
                delegados.map(delegado => (
                  <div key={delegado.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{delegado.nome}</div>
                        <div className="text-sm text-muted-foreground">{delegado.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={delegado.permissao === "editar" ? "default" : "secondary"}>
                        {delegado.permissao === "editar" ? (
                          <><Edit3 className="w-3 h-3 mr-1" /> Editar</>
                        ) : (
                          <><Eye className="w-3 h-3 mr-1" /> Visualizar</>
                        )}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoverDelegado(delegado.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalDelegadosAberto(false)} size="lg">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Horários de Trabalho */}
      <HorariosTrabalhoModal
        isOpen={modalHorariosTrabalhoAberto}
        onClose={() => setModalHorariosTrabalhoAberto(false)}
        horariosTrabalho={horariosTrabalho}
        onSave={setHorariosTrabalho}
      />
      
      {/* Modal de Criação Rápida */}
      <CriacaoRapidaModal
        isOpen={modalCriacaoRapidaAberto}
        onClose={() => {
          // Limpar estados globais ao fechar/cancelar o modal rápido
          // Garante que próximo agendamento inicie em branco
          setModalCriacaoRapidaAberto(false);
          setBuscaPaciente("");
          setBuscaPacienteFocado(false);
          setNovoPacienteId(null);
        }}
        data={dataCriacaoRapida}
        hora={horaCriacaoRapida}
        onCriarCompleto={handleAbrirFormularioCompleto}
        onCriarRapido={handleCriarRapido}
        pacientes={pacientes}
      />
      
      {/* Modal de Conflitos */}
      <ConflitosModal
        isOpen={modalConflitosAberto}
        onClose={() => {
          setModalConflitosAberto(false);
          setDadosPendentes(null);
          setConflitosDetectados([]);
        }}
        conflitos={conflitosDetectados}
        onConfirmar={handleConfirmarComConflitos}
        onCancelar={() => {
          setModalConflitosAberto(false);
          setDadosPendentes(null);
          setConflitosDetectados([]);
        }}
      />
      
      {/* Modal de Novo Agendamento */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-6 h-6 text-blue-500" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Tipo de compromisso */}
            <div>
              <Label className="text-base">Tipo de Compromisso *</Label>
              <Select value={novoTipoCompromisso} onValueChange={setNovoTipoCompromisso}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="z-[200]">
                  {TIPOS_COMPROMISSO.map(tipo => (
                    <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Paciente (se for consulta) - Campo UNIFICADO com dropdown */}
            {novoTipoCompromisso === "Consulta" && (
              <div>
                <Label className="text-base">Paciente *</Label>
                <div className="relative">
                  {/* Input único de busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      ref={buscaPacienteRef}
                      value={buscaPaciente}
                      onChange={(e) => {
                        setBuscaPaciente(e.target.value);
                        // Se já tinha paciente selecionado e usuário começou a digitar algo diferente, limpa
                        if (novoPacienteId && e.target.value !== pacientes.find((p: any) => p.id === novoPacienteId)?.nome) {
                          setNovoPacienteId(null);
                        }
                      }}
                      onFocus={() => setBuscaPacienteFocado(true)}
                      placeholder="Buscar paciente por nome, CPF ou ID..."
                      className={`h-11 pl-10 pr-10 ${novoPacienteId ? 'border-green-500 bg-green-50' : ''}`}
                    />
                    {buscandoPacientesModal && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                    {novoPacienteId && !buscandoPacientesModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setNovoPacienteId(null);
                          setBuscaPaciente("");
                          buscaPacienteRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados - só aparece quando focado e sem paciente selecionado */}
                  {buscaPacienteFocado && !novoPacienteId && buscaPaciente.trim().length >= 1 && (
                    <div 
                      ref={dropdownPacienteRef}
                      className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {buscaPaciente.trim().length < 3 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Digite pelo menos 3 caracteres para buscar
                        </div>
                      ) : pacientes.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Nenhum paciente encontrado
                        </div>
                      ) : (
                        pacientes.map((p: any) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setNovoPacienteId(p.id);
                              setBuscaPaciente(p.nome);
                              setBuscaPacienteFocado(false);
                            }}
                            className="p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 flex items-center gap-3"
                          >
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{highlightSearchTerm(p.nome, buscaPaciente)}</div>
                              <div className="text-xs text-gray-500">
                                ID: {p.idPaciente || p.id} {p.cpf && `| CPF: ${p.cpf}`}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {/* Indicador de paciente selecionado */}
                  {novoPacienteId && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Paciente selecionado
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Título (se não for consulta) */}
            {novoTipoCompromisso && novoTipoCompromisso !== "Consulta" && (
              <div>
                <Label className="text-base">Título</Label>
                <Input
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Título do compromisso"
                  className="h-11"
                />
              </div>
            )}
            
            {/* Data e hora */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-base">Data *</Label>
                <Input
                  type="date"
                  value={novaDataAgendamento}
                  onChange={(e) => setNovaDataAgendamento(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-base">Hora Início *</Label>
                <Input
                  type="time"
                  value={novaHoraInicioAgendamento}
                  onChange={(e) => setNovaHoraInicioAgendamento(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-base">Hora Fim</Label>
                <Input
                  type="time"
                  value={novaHoraFimAgendamento}
                  onChange={(e) => setNovaHoraFimAgendamento(e.target.value)}
                  className="h-11"
                  disabled={novoTipoCompromisso === "Consulta"}
                />
                {novoTipoCompromisso === "Consulta" && (
                  <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente (30min)</p>
                )}
              </div>
            </div>
            
            {/* Local */}
            <div>
              <Label className="text-base">Local</Label>
              <Select value={novoLocal} onValueChange={setNovoLocal}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="z-[200]">
                  {LOCAIS.map(local => (
                    <SelectItem key={local} value={local} className="text-base">{local}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Convênio (se for consulta) */}
            {novoTipoCompromisso === "Consulta" && (
              <div>
                <Label className="text-base">Convênio</Label>
                <Select value={novoConvenio} onValueChange={setNovoConvenio}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o convênio" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="z-[200]">
                    {pacienteSelecionadoInfo?.operadora1 && (
                      <SelectItem value={pacienteSelecionadoInfo.operadora1} className="text-base">
                        {pacienteSelecionadoInfo.operadora1} (cadastrado)
                      </SelectItem>
                    )}
                    {CONVENIOS.map(conv => (
                      <SelectItem key={conv} value={conv} className="text-base">{conv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Status (se for consulta) */}
            {novoTipoCompromisso === "Consulta" && (
              <div>
                <Label className="text-base">Status</Label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="z-[200]">
                    <SelectItem value="Agendado" className="text-base">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-blue-500" />
                        Agendado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Descrição */}
            <div>
              <Label className="text-base">Observações</Label>
              <Textarea
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
                className="text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={fecharModalNovo} size="lg">
              Cancelar
            </Button>
            <Button 
              onClick={handleCriarAgendamento}
              disabled={criarAgendamentoMutation.isPending}
              size="lg"
            >
              {criarAgendamentoMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Bloqueio */}
      <Dialog open={modalBloqueioAberto} onOpenChange={setModalBloqueioAberto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-6 h-6 text-gray-500" />
              Bloquear Horário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-base">Tipo de Bloqueio *</Label>
              <Select value={bloqueioTipo} onValueChange={setBloqueioTipo}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="z-[200]">
                  {TIPOS_BLOQUEIO.map(tipo => (
                    <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">Data Início *</Label>
                <Input
                  type="date"
                  value={bloqueioDataInicio}
                  onChange={(e) => setBloqueioDataInicio(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-base">Data Fim</Label>
                <Input
                  type="date"
                  value={bloqueioDataFim}
                  onChange={(e) => setBloqueioDataFim(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">Hora Início</Label>
                <Input
                  type="time"
                  value={bloqueioHoraInicio}
                  onChange={(e) => setBloqueioHoraInicio(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-base">Hora Fim</Label>
                <Input
                  type="time"
                  value={bloqueioHoraFim}
                  onChange={(e) => setBloqueioHoraFim(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-base">Descrição</Label>
              <Textarea
                value={bloqueioDescricao}
                onChange={(e) => setBloqueioDescricao(e.target.value)}
                placeholder="Descrição do bloqueio..."
                rows={2}
                className="text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBloqueioAberto(false)} size="lg">
              Cancelar
            </Button>
            <Button size="lg">
              Criar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-5">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{agendamentoSelecionado.tipoCompromisso}</span>
                <Badge variant="outline" className="text-sm">
                  #{agendamentoSelecionado.idAgendamento || agendamentoSelecionado.id}
                </Badge>
              </div>

              {/* Paciente */}
              {agendamentoSelecionado.pacienteNome && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-muted-foreground" />
                    <div className="flex-1">
                      {/* Nome do paciente clicável - vai direto para o prontuário */}
                      {agendamentoSelecionado.pacienteId ? (
                        <button
                          onClick={() => {
                            setModalDetalhesAberto(false);
                            setLocation(`/prontuario/${agendamentoSelecionado.pacienteId}`);
                          }}
                          className="font-semibold text-lg text-[#6B8CBE] hover:underline cursor-pointer flex items-center gap-2 group"
                        >
                          {agendamentoSelecionado.pacienteNome}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <div className="font-semibold text-lg">{agendamentoSelecionado.pacienteNome}</div>
                      )}
                      {agendamentoSelecionado.pacienteId && (
                        <div className="text-xs text-muted-foreground">Clique para abrir prontuário</div>
                      )}
                      {agendamentoSelecionado.pacienteTelefone && (
                        <div className="text-base text-muted-foreground flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {agendamentoSelecionado.pacienteTelefone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Data e hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Data</div>
                    <div className="font-medium text-base">
                      {new Date(agendamentoSelecionado.dataHoraInicio).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Horário</div>
                    <div className="font-medium text-base">
                      {formatarHora(agendamentoSelecionado.dataHoraInicio)}
                      {agendamentoSelecionado.dataHoraFim && ` - ${formatarHora(agendamentoSelecionado.dataHoraFim)}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Local e convênio */}
              <div className="grid grid-cols-2 gap-4">
                {agendamentoSelecionado.local && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Local</div>
                      <div className="font-medium text-base">{agendamentoSelecionado.local}</div>
                    </div>
                  </div>
                )}
                {agendamentoSelecionado.convenio && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Convênio</div>
                      <div className="font-medium text-base">{agendamentoSelecionado.convenio}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {agendamentoSelecionado.descricao && (
                <div>
                  <Label className="text-base">Observações</Label>
                  <p className="text-base mt-1 p-3 bg-muted rounded-lg">{agendamentoSelecionado.descricao}</p>
                </div>
              )}

              <Separator />

              {/* Status Flow */}
              <StatusFlow
                currentStatus={agendamentoSelecionado.status}
                onStatusChange={(novoStatus) => {
                  if (isTransicaoPermitida(agendamentoSelecionado.status, novoStatus)) {
                    adicionarLog(
                      agendamentoSelecionado.id,
                      "Mudança de Status",
                      `Status alterado de ${agendamentoSelecionado.status} para ${novoStatus}`,
                      { status: agendamentoSelecionado.status },
                      { status: novoStatus }
                    );
                    atualizarStatusMutation.mutate({ 
                      id: agendamentoSelecionado.id, 
                      novoStatus 
                    });
                  }
                }}
              />

              <Separator />

              {/* Botões de ação */}
              <StatusActions
                agendamento={agendamentoSelecionado}
                onWhatsApp={handleWhatsApp}
                onIniciarAtendimento={handleIniciarAtendimento}
                onRegistrarAtendimento={handleRegistrarAtendimento}
                onConfirmar={handleConfirmar}
                onAguardando={handleAguardando}
                onCancelar={() => setModalCancelarAberto(true)}
                onFalta={handleFalta}
                onTransferir={handleAbrirTransferir}
                onReativar={handleReativar}
                onNovoAgendamentoReaproveitando={handleNovoAgendamentoReaproveitando}
              />

              <Separator />

              {/* Informações de rastreabilidade */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Rastreabilidade
                </Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Criado por:</span>
                    <span className="ml-2 font-medium">{agendamentoSelecionado.criadoPor || usuarioAtual}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="ml-2 font-medium">
                      {agendamentoSelecionado.createdAt 
                        ? new Date(agendamentoSelecionado.createdAt).toLocaleString("pt-BR")
                        : "-"}
                    </span>
                  </div>
                  {agendamentoSelecionado.atualizadoPor && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Última alteração por:</span>
                        <span className="ml-2 font-medium">{agendamentoSelecionado.atualizadoPor}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Última alteração em:</span>
                        <span className="ml-2 font-medium">
                          {agendamentoSelecionado.updatedAt 
                            ? new Date(agendamentoSelecionado.updatedAt).toLocaleString("pt-BR")
                            : "-"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => setModalHistoricoAberto(true)}
                  className="w-full mt-2 h-11"
                >
                  <History className="w-5 h-5 mr-2" />
                  Ver Histórico Completo de Alterações
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhesAberto(false)} size="lg">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <XCircle className="w-6 h-6" />
              Cancelar Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-base">
              Tem certeza que deseja cancelar este agendamento? 
              O registro será mantido no histórico com status "Cancelado".
            </p>
            <div>
              <Label className="text-base">Motivo do Cancelamento *</Label>
              <Textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                rows={3}
                className="text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelarAberto(false)} size="lg">
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelar}
              disabled={cancelarAgendamentoMutation.isPending || !motivoCancelamento.trim()}
              size="lg"
            >
              {cancelarAgendamentoMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Transferir */}
      <Dialog open={modalTransferirAberto} onOpenChange={setModalTransferirAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ArrowRightLeft className="w-6 h-6 text-amber-500" />
              Transferir Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-base text-muted-foreground">
              O agendamento original ficará registrado como "Transferido" e um novo agendamento será criado na nova data.
            </p>
            
            {agendamentoSelecionado && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Data original:</div>
                <div className="font-medium text-base">
                  {new Date(agendamentoSelecionado.dataHoraInicio).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })} às {formatarHora(agendamentoSelecionado.dataHoraInicio)}
                </div>
              </div>
            )}

            <div>
              <Label className="text-base">Nova Data *</Label>
              <Input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">Novo Horário Início *</Label>
                <Input
                  type="time"
                  value={novaHoraInicio}
                  onChange={(e) => setNovaHoraInicio(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
              <div>
                <Label className="text-base">Novo Horário Fim *</Label>
                <Input
                  type="time"
                  value={novaHoraFim}
                  onChange={(e) => setNovaHoraFim(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTransferirAberto(false)} size="lg">
              Cancelar
            </Button>
            <Button 
              onClick={handleTransferir}
              disabled={transferirAgendamentoMutation.isPending || !novaData || !novaHoraInicio || !novaHoraFim}
              className="bg-amber-500 hover:bg-amber-600"
              size="lg"
            >
              {transferirAgendamentoMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico */}
      <AuditTrailModal
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        agendamentoId={agendamentoSelecionado?.id || null}
        agendamentoNome={agendamentoSelecionado?.pacienteNome || agendamentoSelecionado?.titulo || "Agendamento"}
        logs={agendamentoSelecionado?.id ? (logsAgendamentos[agendamentoSelecionado.id] || []) : []}
      />

      {/* Modal Reativar */}
      <ReativarModal
        isOpen={modalReativarAberto}
        onClose={() => setModalReativarAberto(false)}
        agendamento={agendamentoSelecionado}
        onReativarMesmaData={handleReativarMesmaData}
        onReativarTransferir={handleReativarTransferir}
      />
    </div>
  );
}
