import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
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
  ExternalLink
} from "lucide-react";

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
// NOTA: "Transferido" agora é um STATUS (registro histórico do agendamento original)
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

// Transições via botões de ação (não inclui Transferido pois é via ação especial)
const TRANSICOES_PERMITIDAS: Record<StatusType, StatusType[]> = {
  "Agendado": ["Confirmado", "Cancelado"], // Transferir é ação especial
  "Confirmado": ["Aguardando", "Em atendimento", "Falta", "Cancelado"], // Transferir é ação especial
  "Aguardando": ["Em atendimento", "Cancelado"],
  "Em atendimento": ["Encerrado"], // Encerra via Prontuário
  "Encerrado": [], // Estado final
  "Falta": [], // Estado final (mas permite novo agendamento)
  "Transferido": [], // Estado final (registro histórico)
  "Cancelado": ["Agendado"], // Pode reativar
};

// Status que podem usar a ação Transferir
const STATUS_PODE_TRANSFERIR: StatusType[] = ["Agendado", "Confirmado"];

// Função para verificar se uma transição é permitida
function isTransicaoPermitida(statusAtual: string, novoStatus: string): boolean {
  const transicoesDoStatus = TRANSICOES_PERMITIDAS[statusAtual as StatusType];
  return transicoesDoStatus?.includes(novoStatus as StatusType) || false;
}

// Função para obter os próximos status possíveis
function getProximosStatusPossiveis(statusAtual: string): StatusType[] {
  return TRANSICOES_PERMITIDAS[statusAtual as StatusType] || [];
}

// Função para verificar se pode transferir
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

const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-blue-500",
  "Cirurgia": "bg-red-500",
  "Visita internado": "bg-purple-500",
  "Procedimento em consultório": "bg-orange-500",
  "Exame": "bg-green-500",
  "Reunião": "bg-yellow-600",
  "Bloqueio": "bg-gray-500",
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

function getStatusInfo(status: string) {
  return STATUS_AGENDAMENTO.find(s => s.value === status) || STATUS_AGENDAMENTO[0];
}

const HORA_ALTURA_PX = 60;
const DURACAO_CONSULTA_PADRAO = 30;

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
// COMPONENTE: STATUS FLOW (Esteira de Status)
// ============================================

interface StatusFlowProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

function StatusFlow({ currentStatus, onStatusChange, disabled = false }: StatusFlowProps) {
  const currentStatusInfo = getStatusInfo(currentStatus);
  const proximosStatus = getProximosStatusPossiveis(currentStatus);
  
  // Ordem da esteira para visualização (fluxo principal)
  const esteiraStatus = ["Agendado", "Confirmado", "Aguardando", "Em atendimento", "Encerrado"];
  
  // Verificar se status atual está na esteira principal
  const statusNaEsteira = esteiraStatus.includes(currentStatus);
  const indiceAtual = esteiraStatus.indexOf(currentStatus);
  
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Esteira de Atendimento</Label>
      
      {/* Visualização da esteira principal */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {esteiraStatus.map((status, index) => {
          const statusInfo = getStatusInfo(status);
          const Icon = statusInfo.icon;
          const isActive = currentStatus === status;
          const isPast = statusNaEsteira && indiceAtual > index;
          const isFuture = statusNaEsteira && indiceAtual < index;
          const canTransition = proximosStatus.includes(status as StatusType);
          
          return (
            <div key={status} className="flex items-center">
              <button
                type="button"
                disabled={disabled || !canTransition}
                onClick={() => canTransition && onStatusChange(status)}
                className={`
                  relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all duration-200 ease-in-out min-w-[80px]
                  ${isActive 
                    ? `${statusInfo.lightBg} ${statusInfo.color} ring-2 ${statusInfo.borderColor} shadow-md` 
                    : isPast
                      ? 'bg-gray-200 text-gray-500'
                      : canTransition
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                        : 'bg-gray-50 text-gray-400'
                  }
                  ${disabled || !canTransition ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? statusInfo.color : isPast ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className="whitespace-nowrap">{statusInfo.label}</span>
                {isActive && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${statusInfo.bgColor} rounded-full border-2 border-white`} />
                )}
                {isPast && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
              {index < esteiraStatus.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-1 ${isPast ? 'text-gray-400' : 'text-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Status especiais (Falta, Cancelado, Transferido) */}
      {currentStatus === "Falta" && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
          <Ban className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-orange-700 font-medium">
            Paciente não compareceu
          </span>
        </div>
      )}
      
      {currentStatus === "Cancelado" && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700 font-medium">
            Agendamento cancelado
          </span>
        </div>
      )}
      
      {currentStatus === "Transferido" && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <ArrowRightLeft className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-700 font-medium">
            Agendamento transferido para nova data
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: BOTÕES CONTEXTUAIS POR STATUS
// ============================================

interface StatusActionsProps {
  agendamento: any;
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
      <Label className="text-sm font-medium">Ações Disponíveis</Label>
      
      <div className="flex flex-wrap gap-2">
        {/* AGENDADO: WhatsApp, Confirmar, Transferir, Cancelar */}
        {status === "Agendado" && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onWhatsApp}
              className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button size="sm" onClick={onConfirmar} className="bg-blue-500 hover:bg-blue-600">
              <Check className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
            <Button size="sm" variant="outline" onClick={onTransferir}>
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transferir
            </Button>
            <Button size="sm" variant="destructive" onClick={onCancelar}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </>
        )}
        
        {/* CONFIRMADO: Paciente Chegou, Iniciar Atendimento, Transferir, Falta, Cancelar */}
        {status === "Confirmado" && (
          <>
            <Button 
              size="sm" 
              onClick={onAguardando}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              <CalendarClock className="w-4 h-4 mr-1" />
              Paciente Chegou
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onIniciarAtendimento}
              className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Iniciar Atendimento
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button size="sm" variant="outline" onClick={onTransferir}>
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transferir
            </Button>
            <Button size="sm" variant="outline" onClick={onFalta} className="text-orange-600 border-orange-300 hover:bg-orange-50">
              <Ban className="w-4 h-4 mr-1" />
              Falta
            </Button>
            <Button size="sm" variant="destructive" onClick={onCancelar}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </>
        )}
        
        {/* AGUARDANDO: Registrar Atendimento, Cancelar */}
        {status === "Aguardando" && (
          <>
            <Button 
              size="sm" 
              onClick={onRegistrarAtendimento}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Registrar Atendimento
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onCancelar}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <div className="w-full text-xs text-muted-foreground mt-1">
              O botão "Registrar Atendimento" também está disponível na seção de Atendimentos.
            </div>
          </>
        )}
        
        {/* EM ATENDIMENTO: Sem botões na agenda */}
        {status === "Em atendimento" && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <Stethoscope className="w-5 h-5 text-purple-500 animate-pulse" />
              <span className="text-sm text-purple-700">
                Atendimento em andamento
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Para encerrar o atendimento, use o botão "Encerrar Atendimento" na tela de Evolução do Prontuário do paciente.
            </div>
          </div>
        )}
        
        {/* ENCERRADO: Estado final */}
        {status === "Encerrado" && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <CheckCircle2 className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              Atendimento encerrado. Nenhuma ação disponível.
            </span>
          </div>
        )}
        
        {/* FALTA: Estado final, mas permite novo agendamento */}
        {status === "Falta" && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <Ban className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-orange-700">
                Paciente não compareceu
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onNovoAgendamentoReaproveitando}
              className="w-fit"
            >
              <Copy className="w-4 h-4 mr-1" />
              Novo Agendamento (reaproveitar dados)
            </Button>
            <div className="text-xs text-muted-foreground">
              Cria um novo agendamento com os dados do paciente pré-preenchidos.
            </div>
          </div>
        )}
        
        {/* TRANSFERIDO: Estado final (registro histórico) */}
        {status === "Transferido" && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-700">
                Agendamento transferido para nova data
              </span>
            </div>
            {agendamento.novoAgendamentoId && (
              <div className="text-xs text-muted-foreground">
                Novo agendamento: <strong>#{agendamento.novoAgendamentoId}</strong>
              </div>
            )}
          </div>
        )}
        
        {/* CANCELADO: Reativar */}
        {status === "Cancelado" && (
          <div className="flex flex-col gap-2 w-full">
            <Button 
              size="sm" 
              onClick={onReativar}
              className="bg-blue-500 hover:bg-blue-600 w-fit"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reativar Agendamento
            </Button>
            <div className="text-xs text-muted-foreground">
              Ao reativar, você poderá manter a data original ou transferir para nova data.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: LOG DE ALTERAÇÕES (Audit Trail)
// ============================================

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoId: number | null;
  agendamentoNome: string;
}

function AuditTrailModal({ isOpen, onClose, agendamentoId, agendamentoNome }: AuditTrailModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agendamentoId) {
      setIsLoading(true);
      setTimeout(() => {
        setLogs([
          {
            id: 1,
            tipoAlteracao: "Criação",
            descricaoAlteracao: "Agendamento criado",
            realizadoPor: "Dr. André Gorgen",
            createdAt: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, agendamentoId]);

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case "Criação": return <Plus className="w-4 h-4 text-green-500" />;
      case "Confirmação": return <Check className="w-4 h-4 text-blue-500" />;
      case "Cancelamento": return <XCircle className="w-4 h-4 text-red-500" />;
      case "Transferência": return <ArrowRightLeft className="w-4 h-4 text-amber-500" />;
      case "Reativação": return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case "Realização": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "Falta": return <Ban className="w-4 h-4 text-orange-500" />;
      case "Edição": return <Edit3 className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações
          </DialogTitle>
          <DialogDescription>
            Registro completo de todas as alterações em: {agendamentoNome}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de alteração encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="relative pl-6 pb-4">
                  {index < logs.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getIconForTipo(log.tipoAlteracao)}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 ml-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{log.tipoAlteracao}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.descricaoAlteracao}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{log.realizadoPor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: MODAL DE REATIVAÇÃO
// ============================================

interface ReativarModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: any;
  onReativarMesmaData: () => void;
  onReativarTransferir: () => void;
}

function ReativarModal({ isOpen, onClose, agendamento, onReativarMesmaData, onReativarTransferir }: ReativarModalProps) {
  if (!agendamento) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-500" />
            Reativar Agendamento
          </DialogTitle>
          <DialogDescription>
            O agendamento será reativado com status "Agendado".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <strong>Paciente:</strong> {agendamento.pacienteNome || "N/A"}
            </div>
            <div className="text-sm">
              <strong>Data original:</strong> {new Date(agendamento.dataHoraInicio).toLocaleDateString("pt-BR")} às {new Date(agendamento.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Escolha como deseja reativar o agendamento:
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={onReativarMesmaData} className="w-full justify-start">
              <CalendarCheck className="w-4 h-4 mr-2" />
              Manter data e hora original
            </Button>
            <Button variant="outline" onClick={onReativarTransferir} className="w-full justify-start">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transferir para nova data
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Agenda() {
  const [, setLocation] = useLocation();
  
  // Estados principais
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia" | "mes">("semana");
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalTransferirAberto, setModalTransferirAberto] = useState(false);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalDelegadosAberto, setModalDelegadosAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [modalReativarAberto, setModalReativarAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHoraInicio, setNovaHoraInicio] = useState("");
  const [novaHoraFim, setNovaHoraFim] = useState("");

  // Configurações de horário
  const [configHorario, setConfigHorario] = useState({
    horaInicio: 0,
    horaFim: 24,
    intervaloSelecionado: "Dia completo (0h - 24h)",
    duracaoConsultaPadrao: DURACAO_CONSULTA_PADRAO,
    localConsultaPadrao: "Consultório",
  });

  // Sistema de delegados
  const [delegados, setDelegados] = useState<Delegado[]>([]);
  const [novoDelegado, setNovoDelegado] = useState({
    email: "",
    permissao: "visualizar" as "visualizar" | "editar",
  });

  // Filtro por status
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [showFiltroDropdown, setShowFiltroDropdown] = useState(false);

  // Busca por paciente na agenda (filtro)
  const [buscaPacienteAgenda, setBuscaPacienteAgenda] = useState("");
  const [debouncedBuscaPacienteAgenda, setDebouncedBuscaPacienteAgenda] = useState("");

  // Debounce da busca por paciente na agenda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBuscaPacienteAgenda(buscaPacienteAgenda);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaPacienteAgenda]);

  // Toggle de status no filtro
  const toggleFiltroStatus = (status: string) => {
    setFiltroStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroStatus([]);
    setBuscaPacienteAgenda("");
  };

  // Gerar array de horários
  const horarios = useMemo(() => {
    const { horaInicio, horaFim } = configHorario;
    const qtdHoras = horaFim - horaInicio;
    return Array.from({ length: qtdHoras }, (_, i) => horaInicio + i);
  }, [configHorario]);

  // Referência para scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll para hora atual
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
    local: "Consultório",
    titulo: "",
    descricao: "",
    convenio: "Particular",
    status: "Agendado",
  });

  // Efeito para calcular hora fim automaticamente
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

  // Efeito para definir local padrão
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

  // Calcular período
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
  const { data: agendamentos, refetch: refetchAgendamentos } = trpc.agenda.list.useQuery({
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

  const transferirAgendamentoMutation = trpc.agenda.transferir.useMutation({
    onSuccess: (data) => {
      toast.success("Agendamento transferido! Novo agendamento criado.");
      setModalTransferirAberto(false);
      setModalDetalhesAberto(false);
      refetchAgendamentos();
      // Atualizar o agendamento selecionado para mostrar que foi transferido
      if (agendamentoSelecionado) {
        setAgendamentoSelecionado({ 
          ...agendamentoSelecionado, 
          status: "Transferido",
          novoAgendamentoId: data?.novoAgendamentoId 
        });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao transferir: ${error.message}`);
    },
  });

  const confirmarAgendamentoMutation = trpc.agenda.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento confirmado!");
      refetchAgendamentos();
      if (agendamentoSelecionado) {
        setAgendamentoSelecionado({ ...agendamentoSelecionado, status: "Confirmado" });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao confirmar: ${error.message}`);
    },
  });

  const atualizarStatusMutation = trpc.agenda.atualizarStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Status alterado para: ${variables.novoStatus}`);
      refetchAgendamentos();
      if (agendamentoSelecionado) {
        setAgendamentoSelecionado({ ...agendamentoSelecionado, status: variables.novoStatus });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  const marcarFaltaMutation = trpc.agenda.marcarFalta.useMutation({
    onSuccess: () => {
      toast.success("Falta registrada!");
      refetchAgendamentos();
      if (agendamentoSelecionado) {
        setAgendamentoSelecionado({ ...agendamentoSelecionado, status: "Falta" });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao registrar falta: ${error.message}`);
    },
  });

  const pacientesFiltrados = pacientesSearch || [];

  // Agrupar agendamentos por dia
  // Filtrar agendamentos por status e busca por paciente
  const agendamentosFiltrados = useMemo(() => {
    let resultado = agendamentos || [];
    
    // Filtrar por status
    if (filtroStatus.length > 0) {
      resultado = resultado.filter((ag: any) => filtroStatus.includes(ag.status));
    }
    
    // Filtrar por nome de paciente
    if (debouncedBuscaPacienteAgenda.trim()) {
      const termoBusca = debouncedBuscaPacienteAgenda.toLowerCase().trim();
      resultado = resultado.filter((ag: any) => {
        const nomePaciente = (ag.pacienteNome || ag.titulo || "").toLowerCase();
        return nomePaciente.includes(termoBusca);
      });
    }
    
    return resultado;
  }, [agendamentos, filtroStatus, debouncedBuscaPacienteAgenda]);

  const agendamentosPorDia = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    agendamentosFiltrados.forEach((ag: any) => {
      const data = new Date(ag.dataHoraInicio);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ag);
    });
    return mapa;
  }, [agendamentosFiltrados]);

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

  // Funções auxiliares
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

  const irParaHoje = () => setDataAtual(new Date());

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
  // HANDLERS DE AÇÕES
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

  const handleTransferir = () => {
    if (!novaData || !novaHoraInicio || !novaHoraFim) {
      toast.error("Preencha a nova data e horários");
      return;
    }
    // Transferir: Original fica como "Transferido", novo agendamento criado como "Agendado"
    transferirAgendamentoMutation.mutate({
      id: agendamentoSelecionado.id,
      novaDataInicio: new Date(`${novaData}T${novaHoraInicio}`),
      novaDataFim: new Date(`${novaData}T${novaHoraFim}`),
    });
  };

  const handleConfirmar = () => {
    if (!agendamentoSelecionado) return;
    confirmarAgendamentoMutation.mutate({ id: agendamentoSelecionado.id });
  };

  const handleAguardando = () => {
    if (!agendamentoSelecionado) return;
    atualizarStatusMutation.mutate({ 
      id: agendamentoSelecionado.id, 
      novoStatus: "Aguardando" 
    });
  };

  const handleFalta = () => {
    if (!agendamentoSelecionado) return;
    marcarFaltaMutation.mutate({ id: agendamentoSelecionado.id });
  };

  const handleWhatsApp = () => {
    if (!agendamentoSelecionado) return;
    // TODO: Implementar integração com WhatsApp
    toast.info("Funcionalidade de WhatsApp será implementada em breve");
  };

  const handleIniciarAtendimento = () => {
    if (!agendamentoSelecionado) return;
    // Navegar para a seção de Atendimentos com o agendamento selecionado
    // Primeiro atualiza o status para "Em atendimento"
    atualizarStatusMutation.mutate({ 
      id: agendamentoSelecionado.id, 
      novoStatus: "Em atendimento" 
    });
    // Navegar para a tela de novo atendimento
    setLocation(`/atendimentos/novo?agendamentoId=${agendamentoSelecionado.id}&pacienteId=${agendamentoSelecionado.pacienteId}`);
    setModalDetalhesAberto(false);
  };

  const handleRegistrarAtendimento = () => {
    if (!agendamentoSelecionado) return;
    // Atualizar status para "Em atendimento" se ainda não estiver
    if (agendamentoSelecionado.status === "Aguardando") {
      atualizarStatusMutation.mutate({ 
        id: agendamentoSelecionado.id, 
        novoStatus: "Em atendimento" 
      });
    }
    // Navegar para a tela de evolução no Prontuário do paciente
    setLocation(`/prontuario/${agendamentoSelecionado.pacienteId}/evolucao/nova?agendamentoId=${agendamentoSelecionado.id}`);
    setModalDetalhesAberto(false);
  };

  const handleReativar = () => {
    setModalReativarAberto(true);
  };

  const handleReativarMesmaData = () => {
    if (!agendamentoSelecionado) return;
    // Reativar com a mesma data
    atualizarStatusMutation.mutate({ 
      id: agendamentoSelecionado.id, 
      novoStatus: "Agendado" 
    });
    setModalReativarAberto(false);
  };

  const handleReativarTransferir = () => {
    if (!agendamentoSelecionado) return;
    // Primeiro reativa, depois abre modal de transferência
    atualizarStatusMutation.mutate({ 
      id: agendamentoSelecionado.id, 
      novoStatus: "Agendado" 
    });
    setModalReativarAberto(false);
    // Abrir modal de transferência
    setNovaData("");
    setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
    setNovaHoraFim(agendamentoSelecionado.dataHoraFim ? formatarHora(agendamentoSelecionado.dataHoraFim) : "");
    setModalTransferirAberto(true);
  };

  const handleAbrirTransferir = () => {
    if (!agendamentoSelecionado) return;
    setNovaData("");
    setNovaHoraInicio(formatarHora(agendamentoSelecionado.dataHoraInicio));
    setNovaHoraFim(agendamentoSelecionado.dataHoraFim ? formatarHora(agendamentoSelecionado.dataHoraFim) : "");
    setModalTransferirAberto(true);
  };

  const handleNovoAgendamentoReaproveitando = () => {
    if (!agendamentoSelecionado) return;
    // Preencher dados do novo agendamento com dados do agendamento de falta
    setNovoAgendamento({
      tipoCompromisso: agendamentoSelecionado.tipoCompromisso || "Consulta",
      pacienteId: agendamentoSelecionado.pacienteId,
      pacienteNome: agendamentoSelecionado.pacienteNome || "",
      data: "",
      horaInicio: formatarHora(agendamentoSelecionado.dataHoraInicio),
      horaFim: agendamentoSelecionado.dataHoraFim ? formatarHora(agendamentoSelecionado.dataHoraFim) : "",
      local: agendamentoSelecionado.local || configHorario.localConsultaPadrao,
      titulo: agendamentoSelecionado.titulo || "",
      descricao: "",
      convenio: agendamentoSelecionado.convenio || "Particular",
      status: "Agendado",
    });
    setBuscaPaciente(agendamentoSelecionado.pacienteNome || "");
    setPacienteSelecionadoInfo({ 
      id: agendamentoSelecionado.pacienteId, 
      nome: agendamentoSelecionado.pacienteNome 
    });
    setModalDetalhesAberto(false);
    setModalNovoAberto(true);
    toast.info("Dados do paciente pré-preenchidos. Selecione a nova data.");
  };

  const handleAdicionarDelegado = () => {
    if (!novoDelegado.email) {
      toast.error("Informe o e-mail do delegado");
      return;
    }
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

  // Função para calcular posição do evento
  const calcularPosicaoEvento = (dataHoraInicio: Date, dataHoraFim: Date) => {
    const horaInicio = dataHoraInicio.getHours();
    const minutoInicio = dataHoraInicio.getMinutes();
    const horaFim = dataHoraFim.getHours();
    const minutoFim = dataHoraFim.getMinutes();

    const minutosDesdeInicioDia = (horaInicio - configHorario.horaInicio) * 60 + minutoInicio;
    const top = minutosDesdeInicioDia;

    const duracaoMinutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
    const altura = Math.max(15, duracaoMinutos);

    return { top, altura };
  };

  // Função para calcular sobreposições
  const calcularSobreposicoes = (agendamentosDia: any[]) => {
    const eventosAtivos = agendamentosDia.filter(ag => 
      !["Cancelado", "Falta", "Transferido"].includes(ag.status)
    );
    
    const ordenados = [...eventosAtivos].sort((a, b) => 
      new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime()
    );

    const posicoes: Record<number, { coluna: number; totalColunas: number }> = {};
    const grupos: any[][] = [];
    let grupoAtual: any[] = [];
    let fimGrupo = 0;

    ordenados.forEach((evento) => {
      const inicio = new Date(evento.dataHoraInicio).getTime();
      const fim = new Date(evento.dataHoraFim || evento.dataHoraInicio).getTime();

      if (grupoAtual.length === 0 || inicio < fimGrupo) {
        grupoAtual.push(evento);
        fimGrupo = Math.max(fimGrupo, fim);
      } else {
        if (grupoAtual.length > 0) grupos.push(grupoAtual);
        grupoAtual = [evento];
        fimGrupo = fim;
      }
    });
    if (grupoAtual.length > 0) grupos.push(grupoAtual);

    grupos.forEach((grupo) => {
      const totalColunas = grupo.length;
      grupo.forEach((evento, idx) => {
        posicoes[evento.id] = { coluna: idx, totalColunas };
      });
    });

    agendamentosDia.forEach(ag => {
      if (!posicoes[ag.id]) {
        posicoes[ag.id] = { coluna: 0, totalColunas: 1 };
      }
    });

    return posicoes;
  };

  // Renderização de evento
  const renderAgendamentoGoogleStyle = (
    ag: any, 
    isWeekView: boolean = false,
    posicaoInfo?: { coluna: number; totalColunas: number }
  ) => {
    const isInativo = ["Cancelado", "Falta", "Transferido"].includes(ag.status);
    const statusInfo = getStatusInfo(ag.status);
    const StatusIcon = statusInfo?.icon;
    
    const inicio = new Date(ag.dataHoraInicio);
    const fim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(inicio.getTime() + 30 * 60000);
    const { top, altura } = calcularPosicaoEvento(inicio, fim);

    const horaInicioEvento = inicio.getHours();
    if (horaInicioEvento < configHorario.horaInicio || horaInicioEvento >= configHorario.horaFim) {
      return null;
    }

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
          zIndex: isInativo ? 5 : 10,
        }}
        className={`
          px-1.5 py-0.5 rounded-md cursor-pointer text-white text-xs leading-tight overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          ${isInativo ? "opacity-30 bg-opacity-50" : "hover:opacity-90 shadow-sm"}
          transition-opacity duration-150
          border-l-4 ${statusInfo?.borderColor || 'border-l-blue-500'}
        `}
        title={`${formatarHora(ag.dataHoraInicio)} - ${formatarHora(fim)} | ${ag.pacienteNome || ag.titulo || ag.tipoCompromisso} | ${statusInfo?.label || ag.status}${ag.criadoPor ? ` | Criado por: ${ag.criadoPor}` : ''}`}
      >
        <div className="font-medium truncate flex items-center gap-0.5">
          {StatusIcon && <StatusIcon className="w-3 h-3 flex-shrink-0" />}
          <span className={`truncate ${isInativo ? "line-through" : ""}`}>
            {isWeekView ? (
              <>{formatarHora(ag.dataHoraInicio)} {ag.pacienteNome?.split(" ")[0] || ag.titulo || ag.tipoCompromisso}</>
            ) : (
              <>{formatarHora(ag.dataHoraInicio)} - {ag.pacienteNome || ag.titulo || ag.tipoCompromisso}</>
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
  // RENDERIZAÇÃO PRINCIPAL
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

      {/* Controles de navegação */}
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
          {/* Busca por Paciente */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar paciente..."
              value={buscaPacienteAgenda}
              onChange={(e) => setBuscaPacienteAgenda(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setBuscaPacienteAgenda('')}
              className={`h-7 w-40 pl-7 pr-7 text-xs ${buscaPacienteAgenda ? 'border-primary bg-primary/5' : ''}`}
            />
            {buscaPacienteAgenda && (
              <button
                type="button"
                onClick={() => setBuscaPacienteAgenda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Status */}
          <Popover open={showFiltroDropdown} onOpenChange={setShowFiltroDropdown}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-7 px-2 text-xs gap-1 ${filtroStatus.length > 0 ? 'border-primary bg-primary/10' : ''}`}
              >
                <Search className="w-3 h-3" />
                Filtrar Status
                {filtroStatus.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {filtroStatus.length}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtrar por Status</span>
                  {filtroStatus.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-muted-foreground"
                      onClick={limparFiltros}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-1">
                  {STATUS_AGENDAMENTO.map((status) => {
                    const Icon = status.icon;
                    const isSelected = filtroStatus.includes(status.value);
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => toggleFiltroStatus(status.value)}
                        className={`
                          flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                          transition-all duration-150
                          ${isSelected 
                            ? `${status.lightBg} ${status.color} ring-1 ${status.borderColor}` 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? status.color : 'text-gray-400'}`} />
                        <span className="truncate">{status.label}</span>
                        {isSelected && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                {filtroStatus.length > 0 && (
                  <div className="pt-1 text-[10px] text-muted-foreground text-center">
                    Mostrando apenas: {filtroStatus.join(", ")}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Legenda */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {Object.entries(CORES_TIPO).filter(([tipo]) => tipo !== "Bloqueio").map(([tipo, cor]) => (
              <div key={tipo} className="flex items-center gap-1" title={tipo}>
                <div className={`w-2 h-2 rounded ${cor}`}></div>
                <span className="hidden lg:inline">{tipo}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 ml-2" title="Inativo">
              <div className="w-2 h-2 rounded bg-gray-400 opacity-30"></div>
              <span className="hidden lg:inline">Inativo</span>
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

      {/* Visualização Semana */}
      {visualizacao === "semana" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-20">
              <div className="w-14 px-1 py-2 text-center text-xs font-medium border-r bg-muted"></div>
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
            
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              <div className="grid grid-cols-8 relative">
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
                
                {diasSemana.map((dia, i) => {
                  const chave = formatarDataLocal(dia);
                  const agendamentosDia = agendamentosPorDia[chave] || [];
                  const feriado = getFeriado(dia);
                  const isHoje = dia.toDateString() === new Date().toDateString();
                  const posicoes = calcularSobreposicoes(agendamentosDia);
                  
                  return (
                    <div 
                      key={i} 
                      className={`border-r relative ${
                        isHoje ? "bg-blue-50/30" : feriado ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {horarios.map((hora) => (
                        <div 
                          key={hora}
                          className="border-b border-gray-100"
                          style={{ height: `${HORA_ALTURA_PX}px` }}
                        >
                          <div 
                            className="border-b border-gray-50"
                            style={{ height: `${HORA_ALTURA_PX / 2}px` }}
                          />
                        </div>
                      ))}
                      
                      {agendamentosDia.map((ag) => renderAgendamentoGoogleStyle(ag, true, posicoes[ag.id]))}
                      
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

      {/* Visualização Dia */}
      {visualizacao === "dia" && (
        <Card>
          <CardContent className="p-0">
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              <div className="flex relative">
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
                
                <div className="flex-1 relative">
                  {horarios.map((hora) => (
                    <div 
                      key={hora}
                      className="border-b border-gray-100"
                      style={{ height: `${HORA_ALTURA_PX}px` }}
                    >
                      <div 
                        className="border-b border-gray-50"
                        style={{ height: `${HORA_ALTURA_PX / 2}px` }}
                      />
                    </div>
                  ))}
                  
                  {(() => {
                    const chave = formatarDataLocal(dataAtual);
                    const agendamentosDia = agendamentosPorDia[chave] || [];
                    const posicoes = calcularSobreposicoes(agendamentosDia);
                    return agendamentosDia.map((ag) => renderAgendamentoGoogleStyle(ag, false, posicoes[ag.id]));
                  })()}
                  
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

      {/* Visualização Mês */}
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
                          const isInativo = ["Cancelado", "Falta", "Transferido"].includes(ag.status);
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
                                ${isInativo ? "opacity-30" : "hover:opacity-90"}
                              `}
                              title={`${formatarHora(ag.dataHoraInicio)} - ${ag.pacienteNome || ag.titulo || ag.tipoCompromisso} | ${statusInfo?.label}`}
                            >
                              {StatusIcon && <StatusIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                              <span className={isInativo ? "line-through" : ""}>
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
      {/* MODAIS */}
      {/* ============================================ */}

      {/* MODAL CONFIGURAÇÕES */}
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
                <SelectContent position="popper" sideOffset={5}>
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
                    <SelectContent position="popper" sideOffset={5}>
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
                    <SelectContent position="popper" sideOffset={5}>
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
                <SelectContent position="popper" sideOffset={5}>
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
                <SelectContent position="popper" sideOffset={5}>
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

      {/* MODAL DELEGADOS */}
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
                <SelectContent position="popper" sideOffset={5}>
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

      {/* MODAL NOVO AGENDAMENTO */}
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
                <SelectContent position="popper" sideOffset={5}>
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
                  <div className="absolute z-[200] w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
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
                <SelectContent position="popper" sideOffset={5}>
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
                      <SelectContent position="popper" sideOffset={5} className="z-[200]">
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
                      Status Inicial
                    </Label>
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-blue-50 text-blue-700">
                      <CalendarCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Agendado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Novos agendamentos sempre iniciam como "Agendado"
                    </p>
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

      {/* MODAL BLOQUEIO */}
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
                <SelectContent position="popper" sideOffset={5}>
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

      {/* MODAL DETALHES DO AGENDAMENTO */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-4">
              {/* Tipo e informações básicas */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${CORES_TIPO[agendamentoSelecionado.tipoCompromisso] || "bg-gray-500"}`} />
                <span className="font-medium">{agendamentoSelecionado.tipoCompromisso}</span>
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

              <Separator />

              {/* ESTEIRA DE STATUS */}
              <StatusFlow
                currentStatus={agendamentoSelecionado.status}
                onStatusChange={(novoStatus) => {
                  // Validar transição
                  if (!isTransicaoPermitida(agendamentoSelecionado.status, novoStatus)) {
                    toast.error(`Não é possível mudar de "${agendamentoSelecionado.status}" para "${novoStatus}"`);
                    return;
                  }
                  atualizarStatusMutation.mutate({ 
                    id: agendamentoSelecionado.id, 
                    novoStatus 
                  });
                }}
                disabled={["Encerrado", "Falta", "Transferido"].includes(agendamentoSelecionado.status)}
              />

              <Separator />

              {/* BOTÕES DE AÇÃO CONTEXTUAIS */}
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
              <div className="text-xs text-muted-foreground border rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Informações de Rastreabilidade</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setModalHistoricoAberto(true)}
                  >
                    <History className="w-3 h-3 mr-1" />
                    Ver Histórico
                  </Button>
                </div>
                {agendamentoSelecionado.criadoPor && (
                  <p>Criado por: <strong>{agendamentoSelecionado.criadoPor}</strong></p>
                )}
                {agendamentoSelecionado.createdAt && (
                  <p>Em: {new Date(agendamentoSelecionado.createdAt).toLocaleString("pt-BR")}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL HISTÓRICO (AUDIT TRAIL) */}
      <AuditTrailModal
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        agendamentoId={agendamentoSelecionado?.id}
        agendamentoNome={agendamentoSelecionado?.pacienteNome || agendamentoSelecionado?.titulo || "Agendamento"}
      />

      {/* MODAL REATIVAR */}
      <ReativarModal
        isOpen={modalReativarAberto}
        onClose={() => setModalReativarAberto(false)}
        agendamento={agendamentoSelecionado}
        onReativarMesmaData={handleReativarMesmaData}
        onReativarTransferir={handleReativarTransferir}
      />

      {/* MODAL CANCELAR */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo do cancelamento. O agendamento ficará visível na agenda com transparência.
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

      {/* MODAL TRANSFERIR */}
      <Dialog open={modalTransferirAberto} onOpenChange={setModalTransferirAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Transferir Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
              <p className="text-amber-800">
                <strong>Atenção:</strong> O agendamento original ficará com status "Transferido" e um novo agendamento será criado na nova data com status "Agendado".
              </p>
            </div>
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
            <Button variant="outline" onClick={() => setModalTransferirAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTransferir} disabled={transferirAgendamentoMutation.isPending}>
              {transferirAgendamentoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
