import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  X,
  GripVertical,
  AlertCircle,
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

// Locais de atendimento
const LOCAIS_ATENDIMENTO = [
  "Consultório",
  "On-line",
  "HMV",
  "Santa Casa",
  "HMD",
  "HMD CG",
] as const;

// Cores por tipo
const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-blue-500",
  "Cirurgia": "bg-red-500",
  "Visita internado": "bg-purple-500",
  "Procedimento em consultório": "bg-orange-500",
  "Exame": "bg-green-500",
  "Reunião": "bg-yellow-500",
};

const formatarHora = (data: Date) => {
  return `${data.getHours().toString().padStart(2, "0")}:${data.getMinutes().toString().padStart(2, "0")}`;
};

const formatarData = (data: Date) => {
  return data.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
};

const getNomeMes = (data: Date) => {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[data.getMonth()];
};

export default function Agenda() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">("semana");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<any>(null);
  const [novoAgendamento, setNovoAgendamento] = useState({
    pacienteNome: "",
    tipoCompromisso: "Consulta",
    local: "Consultório",
    dataHoraInicio: "",
    dataHoraFim: "",
    notas: "",
  });

  // Buscar agendamentos
  const { data: agendamentos = [], isLoading, refetch } = trpc.agendamentos.list.useQuery({
    dataInicio: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1),
    dataFim: new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0),
  });

  // Gerar array de horários (00:00 até 23:30)
  const horarios = useMemo(() => {
    const horas = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        horas.push({ hora: h, minuto: m });
      }
    }
    return horas;
  }, []);

  // Gerar dias da semana
  const diasSemana = useMemo(() => {
    const dias = [];
    const hoje = new Date(dataAtual);
    const diaSemana = hoje.getDay();
    const diferenca = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const segunda = new Date(hoje.setDate(diferenca));

    for (let i = 0; i < 7; i++) {
      const dia = new Date(segunda);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }
    return dias;
  }, [dataAtual]);

  // Agrupar agendamentos por data
  const agendamentosPorData = useMemo(() => {
    const agrupado: Record<string, any[]> = {};
    agendamentos.forEach((ag) => {
      const data = new Date(ag.dataHoraInicio);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      if (!agrupado[chave]) agrupado[chave] = [];
      agrupado[chave].push(ag);
    });
    return agrupado;
  }, [agendamentos]);

  // Renderizar evento
  const renderizarEvento = (ag: any, indiceColuna?: number) => {
    const inicio = new Date(ag.dataHoraInicio);
    const fim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(inicio.getTime() + 30 * 60000);
    const duracaoMinutos = (fim.getTime() - inicio.getTime()) / 60000;
    const alturaPixels = Math.max(20, (duracaoMinutos / 30) * 48); // 48px por slot de 30min

    return (
      <div
        key={ag.id}
        draggable
        onDragStart={() => setDraggedEvent(ag)}
        onDragEnd={() => setDraggedEvent(null)}
        onClick={() => {
          setAgendamentoSelecionado(ag);
          setDetalhesAberto(true);
        }}
        style={{
          height: `${alturaPixels}px`,
          left: indiceColuna ? `${(indiceColuna * 14.28)}%` : "0",
          width: indiceColuna ? "14.28%" : "100%",
        }}
        className={`
          absolute px-2 py-1 rounded cursor-move text-white text-xs overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          hover:opacity-80 transition-opacity border border-white/20
        `}
        title={`${ag.pacienteNome} - ${formatarHora(inicio)}`}
      >
        <div className="font-semibold truncate">{formatarHora(inicio)}</div>
        <div className="text-xs truncate">{ag.tipoCompromisso}</div>
        <div className="text-xs truncate">{ag.pacienteNome}</div>
      </div>
    );
  };

  // Renderizar visualização de dia
  const renderizarDia = () => {
    const chave = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(dataAtual.getDate()).padStart(2, "0")}`;
    const agendamentosDia = agendamentosPorData[chave] || [];

    return (
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{formatarData(dataAtual)}</h2>
        <div className="grid grid-cols-1 gap-0 bg-white rounded-lg border overflow-hidden">
          {/* Cabeçalho */}
          <div className="grid grid-cols-4 gap-0 bg-muted border-b">
            <div className="p-3 text-sm font-semibold">Horário</div>
            <div className="p-3 text-sm font-semibold">Tipo</div>
            <div className="p-3 text-sm font-semibold">Paciente</div>
            <div className="p-3 text-sm font-semibold">Local</div>
          </div>

          {/* Eventos */}
          {agendamentosDia.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum agendamento para este dia</div>
          ) : (
            agendamentosDia.map((ag) => (
              <div
                key={ag.id}
                onClick={() => {
                  setAgendamentoSelecionado(ag);
                  setDetalhesAberto(true);
                }}
                className="grid grid-cols-4 gap-0 border-b hover:bg-blue-50 cursor-pointer transition-colors p-3"
              >
                <div className="text-sm">{formatarHora(new Date(ag.dataHoraInicio))}</div>
                <div className="text-sm">{ag.tipoCompromisso}</div>
                <div className="text-sm font-medium">{ag.pacienteNome}</div>
                <div className="text-sm">{ag.local}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Renderizar visualização de semana
  const renderizarSemana = () => {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{getNomeMes(dataAtual)} de {dataAtual.getFullYear()}</h2>
        <div className="bg-white rounded-lg border overflow-x-auto">
          <div className="grid gap-0" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            {/* Cabeçalho com dias */}
            <div className="border-b border-r bg-muted p-2 text-xs font-semibold text-center h-16 flex items-center justify-center">
              Hora
            </div>
            {diasSemana.map((dia, i) => {
              const hoje = dia.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`border-b border-r p-2 text-center h-16 flex flex-col items-center justify-center ${
                    hoje ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="text-xs font-semibold text-muted-foreground">
                    {dia.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase()}
                  </div>
                  <div className={`text-lg font-bold ${hoje ? "bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center" : ""}`}>
                    {dia.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Horários e eventos */}
            {horarios.map((slot) => (
              <div key={`${slot.hora}-${slot.minuto}`}>
                {/* Coluna de horários */}
                {slot.minuto === 0 && (
                  <div className="border-b border-r bg-muted p-2 text-xs font-semibold text-center h-12 flex items-center justify-center">
                    {slot.hora.toString().padStart(2, "0")}:00
                  </div>
                )}

                {/* Colunas de dias */}
                {diasSemana.map((dia, i) => {
                  const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
                  const agendamentosDia = agendamentosPorData[chave] || [];
                  const agendamentosSlot = agendamentosDia.filter((ag) => {
                    const dataAg = new Date(ag.dataHoraInicio);
                    return dataAg.getHours() === slot.hora && dataAg.getMinutes() === slot.minuto;
                  });

                  return (
                    <div
                      key={`${slot.hora}-${slot.minuto}-${i}`}
                      className={`border-b border-r relative h-12 transition-colors cursor-pointer ${
                        dragOverSlot?.hora === slot.hora && dragOverSlot?.minuto === slot.minuto ? "bg-blue-100" : "bg-white hover:bg-gray-50"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlot({ hora: slot.hora, minuto: slot.minuto, dia: dia });
                      }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={() => {
                        if (draggedEvent) {
                          const novaData = new Date(dia);
                          novaData.setHours(slot.hora, slot.minuto, 0, 0);
                          toast.success("Agendamento reagendado!");
                          setDraggedEvent(null);
                          setDragOverSlot(null);
                          refetch();
                        }
                      }}
                      onClick={() => {
                        const novaData = new Date(dia);
                        novaData.setHours(slot.hora, slot.minuto, 0, 0);
                        setNovoAgendamento({
                          ...novoAgendamento,
                          dataHoraInicio: novaData.toISOString().slice(0, 16),
                          dataHoraFim: new Date(novaData.getTime() + 30 * 60000).toISOString().slice(0, 16),
                        });
                        setDialogAberto(true);
                      }}
                    >
                      {agendamentosSlot.map((ag) => renderizarEvento(ag))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar visualização de mês
  const renderizarMes = () => {
    const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    const diasMes = [];

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      diasMes.push(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i));
    }

    const diasSemanaInicio = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1;
    const diasVazios = Array.from({ length: diasSemanaInicio }, (_, i) => null);

    return (
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{getNomeMes(dataAtual)} de {dataAtual.getFullYear()}</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Cabeçalho com dias da semana */}
          <div className="grid grid-cols-7 gap-0 bg-muted border-b">
            {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((dia) => (
              <div key={dia} className="p-3 text-sm font-semibold text-center border-r last:border-r-0">
                {dia}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-0">
            {[...diasVazios, ...diasMes].map((dia, i) => {
              const chave = dia ? `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}` : null;
              const agendamentosDia = chave ? (agendamentosPorData[chave] || []) : [];
              const hoje = dia?.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`border-r border-b last:border-r-0 p-2 min-h-24 cursor-pointer transition-colors ${
                    dia ? (hoje ? "bg-blue-50" : "bg-white hover:bg-gray-50") : "bg-gray-100"
                  }`}
                  onClick={() => {
                    if (dia) {
                      setDataAtual(dia);
                      setVisualizacao("dia");
                    }
                  }}
                >
                  {dia && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${hoje ? "text-blue-600" : ""}`}>
                        {dia.getDate()}
                      </div>
                      <div className="space-y-1">
                        {agendamentosDia.slice(0, 2).map((ag) => (
                          <div
                            key={ag.id}
                            className={`text-xs p-1 rounded text-white truncate ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAgendamentoSelecionado(ag);
                              setDetalhesAberto(true);
                            }}
                          >
                            {formatarHora(new Date(ag.dataHoraInicio))} {ag.pacienteNome}
                          </div>
                        ))}
                        {agendamentosDia.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{agendamentosDia.length - 2} mais</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const avancar = () => {
    const novaData = new Date(dataAtual);
    if (visualizacao === "dia") {
      novaData.setDate(novaData.getDate() + 1);
    } else if (visualizacao === "semana") {
      novaData.setDate(novaData.getDate() + 7);
    } else {
      novaData.setMonth(novaData.getMonth() + 1);
    }
    setDataAtual(novaData);
  };

  const retroceder = () => {
    const novaData = new Date(dataAtual);
    if (visualizacao === "dia") {
      novaData.setDate(novaData.getDate() - 1);
    } else if (visualizacao === "semana") {
      novaData.setDate(novaData.getDate() - 7);
    } else {
      novaData.setMonth(novaData.getMonth() - 1);
    }
    setDataAtual(novaData);
  };

  const irHoje = () => {
    setDataAtual(new Date());
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => setDialogAberto(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={retroceder}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={irHoje}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={avancar}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={visualizacao === "dia" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("dia")}
          >
            Dia
          </Button>
          <Button
            variant={visualizacao === "semana" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("semana")}
          >
            Semana
          </Button>
          <Button
            variant={visualizacao === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("mes")}
          >
            Mês
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <>
          {visualizacao === "dia" && renderizarDia()}
          {visualizacao === "semana" && renderizarSemana()}
          {visualizacao === "mes" && renderizarMes()}
        </>
      )}

      {/* Dialog Novo Agendamento */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input
                  placeholder="Nome do paciente"
                  value={novoAgendamento.pacienteNome}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, pacienteNome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={novoAgendamento.tipoCompromisso} onValueChange={(v) => setNovoAgendamento({ ...novoAgendamento, tipoCompromisso: v })}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data/Hora Início</Label>
                <Input
                  type="datetime-local"
                  value={novoAgendamento.dataHoraInicio}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, dataHoraInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data/Hora Fim</Label>
                <Input
                  type="datetime-local"
                  value={novoAgendamento.dataHoraFim}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, dataHoraFim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <Select value={novoAgendamento.local} onValueChange={(v) => setNovoAgendamento({ ...novoAgendamento, local: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCAIS_ATENDIMENTO.map((local) => (
                    <SelectItem key={local} value={local}>{local}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observações"
                value={novoAgendamento.notas}
                onChange={(e) => setNovoAgendamento({ ...novoAgendamento, notas: e.target.value })}
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button onClick={() => {
              toast.success("Agendamento criado!");
              setDialogAberto(false);
              refetch();
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={detalhesAberto} onOpenChange={setDetalhesAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Agendamento</span>
              <div className="flex gap-2">
                <button onClick={() => {
                  setAgendamentoSelecionado(null);
                  setDetalhesAberto(false);
                }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{agendamentoSelecionado.pacienteNome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{agendamentoSelecionado.tipoCompromisso}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{agendamentoSelecionado.local}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-medium">{formatarData(new Date(agendamentoSelecionado.dataHoraInicio))} {formatarHora(new Date(agendamentoSelecionado.dataHoraInicio))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fim</p>
                  <p className="font-medium">{formatarHora(new Date(agendamentoSelecionado.dataHoraFim))}</p>
                </div>
              </div>
              {agendamentoSelecionado.notas && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm">{agendamentoSelecionado.notas}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAgendamentoSelecionado(null);
              setDetalhesAberto(false);
            }}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
