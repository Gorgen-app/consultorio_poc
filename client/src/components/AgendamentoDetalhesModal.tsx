import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  X,
  User,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  Check,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
  Ban,
  Plus,
  ArrowRight,
  MessageCircle
} from "lucide-react";

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

// Status do stepper
const STEPPER_STEPS = [
  { id: "Agendado", label: "Agendado" },
  { id: "Confirmado", label: "Confirmado" },
  { id: "Aguardando", label: "Aguardando" },
  { id: "Em atendimento", label: "Em Atendimento" },
  { id: "Realizado", label: "Encerrado" },
];

interface AgendamentoDetalhesModalProps {
  agendamento: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

// Helper para formatar hora
const formatarHora = (data: Date | string) => {
  return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Helper para obter iniciais do nome
const getIniciais = (nome: string) => {
  if (!nome) return "?";
  const partes = nome.split(" ");
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

// Helper para obter índice do status no stepper
const getStatusIndex = (status: string) => {
  const index = STEPPER_STEPS.findIndex(s => s.id === status);
  return index >= 0 ? index : 0;
};

// Helper para verificar se step está completo
const isStepCompleted = (stepIndex: number, currentStatus: string) => {
  const currentIndex = getStatusIndex(currentStatus);
  return stepIndex < currentIndex;
};

// Helper para verificar se step é o atual
const isStepCurrent = (stepIndex: number, currentStatus: string) => {
  const currentIndex = getStatusIndex(currentStatus);
  return stepIndex === currentIndex;
};

export function AgendamentoDetalhesModal({ 
  agendamento, 
  open, 
  onOpenChange,
  onUpdate 
}: AgendamentoDetalhesModalProps) {
  const [, setLocation] = useLocation();
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaHoraInicio, setNovaHoraInicio] = useState("");
  const [novaHoraFim, setNovaHoraFim] = useState("");

  // Mutations
  const confirmarAgendamento = trpc.agenda.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento confirmado!");
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const marcarAguardando = trpc.agenda.marcarAguardando.useMutation({
    onSuccess: () => {
      toast.success("Paciente marcado como aguardando!");
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const iniciarAtendimento = trpc.agenda.iniciarAtendimento.useMutation({
    onSuccess: () => {
      toast.success("Atendimento iniciado!");
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const realizarAgendamento = trpc.agenda.realizar.useMutation({
    onSuccess: () => {
      toast.success("Atendimento encerrado!");
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const marcarFalta = trpc.agenda.marcarFalta.useMutation({
    onSuccess: () => {
      toast.success("Falta registrada!");
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const cancelarAgendamento = trpc.agenda.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      setModalCancelarAberto(false);
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  const reagendarAgendamento = trpc.agenda.reagendar.useMutation({
    onSuccess: () => {
      toast.success("Agendamento reagendado!");
      setModalReagendarAberto(false);
      onUpdate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!agendamento) return null;

  const status = agendamento.status;
  const isFinished = ["Cancelado", "Reagendado", "Faltou", "Realizado"].includes(status);

  // Handlers de ação
  const handleConfirmar = () => {
    confirmarAgendamento.mutate({ id: agendamento.id });
  };

  const handleChegou = () => {
    marcarAguardando.mutate({ id: agendamento.id });
  };

  const handleAtender = () => {
    iniciarAtendimento.mutate({ id: agendamento.id }, {
      onSuccess: () => {
        if (agendamento.pacienteId) {
          onOpenChange(false);
          setLocation(`/prontuario/${agendamento.pacienteId}?secao=evolucoes&novaEvolucao=true&agendamentoId=${agendamento.id}`);
        }
      }
    });
  };

  const handleEncerrar = () => {
    realizarAgendamento.mutate({ id: agendamento.id });
  };

  const handleContinuar = () => {
    if (agendamento.pacienteId) {
      onOpenChange(false);
      setLocation(`/prontuario/${agendamento.pacienteId}?secao=evolucoes`);
    }
  };

  const handleReagendar = () => {
    setNovaData(new Date(agendamento.dataHoraInicio).toISOString().split("T")[0]);
    setNovaHoraInicio(formatarHora(agendamento.dataHoraInicio));
    setNovaHoraFim(formatarHora(agendamento.dataHoraFim));
    setModalReagendarAberto(true);
  };

  const handleFaltou = () => {
    marcarFalta.mutate({ id: agendamento.id });
  };

  const handleCancelar = () => {
    setModalCancelarAberto(true);
  };

  const handleProximaConsulta = () => {
    toast.info("Funcionalidade de agendar próxima consulta em desenvolvimento");
  };

  const handleWhatsApp = () => {
    // TODO: Implementar integração com WhatsApp
    toast.info("Integração com WhatsApp em desenvolvimento");
  };

  const handleVerProntuario = () => {
    if (agendamento.pacienteId) {
      onOpenChange(false);
      setLocation(`/pacientes/${agendamento.pacienteId}/prontuario`);
    }
  };

  const confirmarCancelamento = () => {
    cancelarAgendamento.mutate({ 
      id: agendamento.id, 
      motivo: motivoCancelamento 
    });
  };

  const confirmarReagendamento = () => {
    const [hInicio, mInicio] = novaHoraInicio.split(":").map(Number);
    const [hFim, mFim] = novaHoraFim.split(":").map(Number);
    
    const novaDataInicio = new Date(novaData);
    novaDataInicio.setHours(hInicio, mInicio, 0, 0);
    
    const novaDataFim = new Date(novaData);
    novaDataFim.setHours(hFim, mFim, 0, 0);

    reagendarAgendamento.mutate({
      idOriginal: agendamento.id,
      novaDataInicio: novaDataInicio,
      novaDataFim: novaDataFim,
    });
  };

  // Determinar quais botões estão habilitados
  const canConfirmar = status === "Agendado";
  const canChegou = status === "Confirmado";
  const canAtender = status === "Aguardando";
  const canEncerrar = status === "Em atendimento";
  const canContinuar = status === "Em atendimento";
  const canReagendar = !["Aguardando", "Em atendimento", "Realizado", "Cancelado", "Reagendado", "Faltou"].includes(status);
  const canFaltou = ["Agendado", "Confirmado"].includes(status);
  const canCancelar = !["Em atendimento", "Realizado", "Cancelado", "Reagendado", "Faltou"].includes(status);
  const canProxima = status === "Realizado";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden">
          
          {/* SEÇÃO 1: Header do Modal */}
          <div className="bg-[#6B8CBE] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${CORES_TIPO[agendamento.tipoCompromisso] || "bg-white"}`}></span>
              <span className="font-semibold text-base">{agendamento.tipoCompromisso}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "Agendado" ? "bg-gray-400" :
              status === "Confirmado" ? "bg-emerald-500" :
              status === "Aguardando" ? "bg-amber-500" :
              status === "Em atendimento" ? "bg-[#5A7DB0]" :
              status === "Realizado" ? "bg-gray-600" :
              status === "Cancelado" ? "bg-red-500" :
              status === "Faltou" ? "bg-orange-500" :
              "bg-gray-500"
            }`}>
              {status}
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEÇÃO 2: Dados do Paciente */}
          {agendamento.pacienteNome && (
            <div className="bg-[#F5F7FA] border-b border-[#D1DBEA] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D1DBEA] text-[#4A6A9A] flex items-center justify-center font-semibold text-base">
                    {getIniciais(agendamento.pacienteNome)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-gray-900">{agendamento.pacienteNome}</span>
                      <button 
                        onClick={handleWhatsApp}
                        className="text-[#25D366] hover:opacity-80 transition-opacity"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <span className="text-gray-400 text-sm">#{agendamento.idAgendamento}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>CPF: {agendamento.pacienteCpf || "N/A"}</span>
                      <span>•</span>
                      <span>Data Nasc.: {agendamento.pacienteNascimento ? new Date(agendamento.pacienteNascimento).toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>
                  </div>
                </div>
                {agendamento.pacienteId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleVerProntuario}
                    className="border-[#D1DBEA] text-[#6B8CBE] hover:bg-[#E8EDF5]"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Prontuário
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* SEÇÃO 3: Cards Data/Hora e Local */}
          <div className="px-6 py-5 grid grid-cols-5 gap-4">
            <div className="col-span-3 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                <CalendarIcon className="w-3.5 h-3.5" />
                Data e Horário
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {new Date(agendamento.dataHoraInicio).toLocaleDateString("pt-BR", { weekday: 'long' })}
              </div>
              <div className="text-xl font-bold text-gray-900 mb-2">
                {new Date(agendamento.dataHoraInicio).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5 text-base font-medium text-[#6B8CBE]">
                <Clock className="w-4 h-4" />
                {formatarHora(agendamento.dataHoraInicio)} – {formatarHora(agendamento.dataHoraFim)}
              </div>
            </div>
            
            <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                <MapPin className="w-3.5 h-3.5" />
                Local
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {agendamento.local || "Não informado"}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                {agendamento.endereco || ""}
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Stepper de Etapas */}
          {!isFinished && (
            <div className="bg-gray-50 border-t border-b border-gray-200 px-6 py-5">
              <div className="text-center text-sm font-medium text-gray-700 mb-5">
                Etapas do Atendimento
              </div>
              <div className="flex items-center justify-between">
                {STEPPER_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isStepCompleted(index, status) 
                          ? "bg-emerald-500 text-white" 
                          : isStepCurrent(index, status)
                            ? "bg-[#6B8CBE] text-white ring-4 ring-[#D1DBEA]"
                            : "bg-gray-300 text-gray-500"
                      }`}>
                        {isStepCompleted(index, status) ? (
                          <Check className="w-4 h-4" />
                        ) : isStepCurrent(index, status) ? (
                          "●"
                        ) : (
                          "○"
                        )}
                      </div>
                      <span className={`text-[11px] mt-2 text-center max-w-[70px] ${
                        isStepCurrent(index, status) 
                          ? "text-[#4A6A9A] font-semibold" 
                          : "text-gray-500"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < STEPPER_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-6 ${
                        isStepCompleted(index, status) ? "bg-emerald-500" : "bg-gray-300"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status finais - mensagens informativas */}
          {status === "Realizado" && (
            <div className="mx-6 my-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-800 font-medium">Atendimento finalizado com sucesso</p>
            </div>
          )}

          {status === "Faltou" && (
            <div className="mx-6 my-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 font-medium">Paciente não compareceu</p>
            </div>
          )}

          {status === "Cancelado" && (
            <div className="mx-6 my-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800 font-medium">Agendamento cancelado</p>
              </div>
              {agendamento.motivoCancelamento && (
                <p className="text-xs text-red-700">Motivo: {agendamento.motivoCancelamento}</p>
              )}
            </div>
          )}

          {/* SEÇÃO 5: Botões de Ação (TODOS VISÍVEIS) */}
          {!isFinished && (
            <div className="px-6 py-5 bg-white border-t border-gray-100">
              {/* Linha 1: Ações de Progresso */}
              <div className="flex justify-center gap-2.5 mb-3">
                <Button
                  onClick={handleConfirmar}
                  disabled={!canConfirmar || confirmarAgendamento.isPending}
                  className={`px-4 py-2 text-sm font-medium ${
                    canConfirmar 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-emerald-500/40 text-white cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Confirmar
                </Button>

                <Button
                  onClick={handleChegou}
                  disabled={!canChegou || marcarAguardando.isPending}
                  className={`px-4 py-2 text-sm font-medium ${
                    canChegou 
                      ? "bg-amber-500 hover:bg-amber-600 text-white" 
                      : "bg-amber-500/40 text-white cursor-not-allowed"
                  }`}
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  Chegou
                </Button>

                <Button
                  onClick={handleAtender}
                  disabled={!canAtender || iniciarAtendimento.isPending}
                  className={`px-4 py-2 text-sm font-medium ${
                    canAtender 
                      ? "bg-[#6B8CBE] hover:bg-[#5A7DB0] text-white" 
                      : "bg-[#6B8CBE]/40 text-white cursor-not-allowed"
                  }`}
                >
                  <Stethoscope className="w-4 h-4 mr-1.5" />
                  Atender
                </Button>

                <Button
                  onClick={handleEncerrar}
                  disabled={!canEncerrar || realizarAgendamento.isPending}
                  className={`px-4 py-2 text-sm font-medium ${
                    canEncerrar 
                      ? "bg-gray-700 hover:bg-gray-800 text-white" 
                      : "bg-gray-700/40 text-white cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Encerrar Atendimento
                </Button>

                <Button
                  onClick={handleContinuar}
                  disabled={!canContinuar}
                  className={`px-4 py-2 text-sm font-medium ${
                    canContinuar 
                      ? "bg-[#5A7DB0] hover:bg-[#4A6A9A] text-white" 
                      : "bg-[#5A7DB0]/40 text-white cursor-not-allowed"
                  }`}
                >
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  Continuar
                </Button>
              </div>

              {/* Linha 2: Ações Secundárias */}
              <div className="flex justify-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleReagendar}
                  disabled={!canReagendar}
                  className={`px-4 py-2 text-sm font-medium ${
                    canReagendar 
                      ? "border-gray-300 text-gray-700 hover:bg-gray-50" 
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Reagendar
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFaltou}
                  disabled={!canFaltou || marcarFalta.isPending}
                  className={`px-4 py-2 text-sm font-medium ${
                    canFaltou 
                      ? "border-amber-500 text-amber-600 hover:bg-amber-50" 
                      : "border-amber-300 text-amber-400 cursor-not-allowed"
                  }`}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Faltou
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancelar}
                  disabled={!canCancelar}
                  className={`px-4 py-2 text-sm font-medium ${
                    canCancelar 
                      ? "border-red-500 text-red-600 hover:bg-red-50" 
                      : "border-red-300 text-red-400 cursor-not-allowed"
                  }`}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Cancelar
                </Button>

                <Button
                  variant="outline"
                  onClick={handleProximaConsulta}
                  disabled={!canProxima}
                  className={`px-4 py-2 text-sm font-medium ${
                    canProxima 
                      ? "border-[#6B8CBE] text-[#6B8CBE] hover:bg-[#F5F7FA]" 
                      : "border-[#D1DBEA] text-[#A8BEDA] cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Agendar próxima consulta
                </Button>
              </div>
            </div>
          )}

          {/* Botões para status finalizados */}
          {isFinished && (
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300"
              >
                Fechar
              </Button>
              {status === "Realizado" && (
                <Button
                  onClick={handleProximaConsulta}
                  className="bg-[#6B8CBE] hover:bg-[#5A7DB0] text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Agendar próxima consulta
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cancelar Agendamento</h3>
            <p className="text-sm text-gray-500">
              O agendamento será marcado como cancelado, mas permanecerá visível no histórico.
            </p>
            <div>
              <Label>Motivo do Cancelamento</Label>
              <Textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalCancelarAberto(false)}>
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmarCancelamento}
                disabled={cancelarAgendamento.isPending}
              >
                {cancelarAgendamento.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Reagendar */}
      <Dialog open={modalReagendarAberto} onOpenChange={setModalReagendarAberto}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reagendar</h3>
            <p className="text-sm text-gray-500">
              O agendamento original ficará marcado como "Reagendado" e um novo será criado.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Nova Data</Label>
                <Input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={novaHoraInicio}
                  onChange={(e) => setNovaHoraInicio(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={novaHoraFim}
                  onChange={(e) => setNovaHoraFim(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalReagendarAberto(false)}>
                Voltar
              </Button>
              <Button 
                onClick={confirmarReagendamento}
                disabled={reagendarAgendamento.isPending}
                className="bg-[#6B8CBE] hover:bg-[#5A7DB0]"
              >
                {reagendarAgendamento.isPending ? "Reagendando..." : "Confirmar Reagendamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
