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
  CalendarCheck,
  CalendarClock,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  XCircle,
  FileCheck,
  ClipboardCheck,
  Scissors,
  Search,
  Loader2
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";

// Tipos de compromisso
const TIPOS_COMPROMISSO = [
  "Consulta",
  "Cirurgia",
  "Visita internado",
  "Procedimento em consultório",
  "Exame",
  "Reunião",
] as const;

// Cores por tipo de compromisso
const CORES_TIPO: Record<string, string> = {
  "Consulta": "bg-blue-500",
  "Cirurgia": "bg-red-500",
  "Visita internado": "bg-purple-500",
  "Procedimento em consultório": "bg-orange-500",
  "Exame": "bg-green-500",
  "Reunião": "bg-yellow-500",
};

// Cores por status
const CORES_STATUS: Record<string, string> = {
  "Confirmado": "border-l-4 border-green-500",
  "Pendente": "border-l-4 border-yellow-500",
  "Cancelado": "opacity-50",
  "Realizado": "border-l-4 border-blue-500",
  "Faltou": "border-l-4 border-red-500",
};

const formatarHora = (data: string | Date) => {
  const d = new Date(data);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const formatarData = (data: Date) => {
  return data.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }).toUpperCase();
};

const getNomeMes = (data: Date) => {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                 "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[data.getMonth()];
};

export default function Agenda() {
  const { user } = useAuth();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia">("semana");
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string | null>(null);
  const [novoAgendamento, setNovoAgendamento] = useState({
    pacienteId: "",
    pacienteNome: "",
    dataHoraInicio: "",
    dataHoraFim: "",
    tipoCompromisso: "Consulta",
    status: "Confirmado",
    local: "Consultório",
    notas: "",
    novoPaciente: false,
    telefone: "",
    cpf: "",
    convenio: "",
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  // Buscar agendamentos
  const { data: agendamentos = [], isLoading } = trpc.agendamentos.list.useQuery({
    dataInicio: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() - 7),
    dataFim: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 7),
  });

  // Buscar profissionais
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();

  // Gerar semana (segunda a domingo)
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

  // Agrupar agendamentos por dia
  const agendamentosPorDia = useMemo(() => {
    const agrupado: Record<string, any[]> = {};
    agendamentos.forEach((ag) => {
      const data = new Date(ag.dataHoraInicio);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      if (!agrupado[chave]) agrupado[chave] = [];
      agrupado[chave].push(ag);
    });
    return agrupado;
  }, [agendamentos]);

  // Horários de 7:00 até 22:00
  const horarios = Array.from({ length: 16 }, (_, i) => i + 7);

  const renderizarEvento = (ag: any) => {
    const inicio = new Date(ag.dataHoraInicio);
    const fim = ag.dataHoraFim ? new Date(ag.dataHoraFim) : new Date(inicio.getTime() + 30 * 60000);
    const duracaoMinutos = (fim.getTime() - inicio.getTime()) / 60000;
    
    // Altura: cada minuto = 1px (60min = 60px)
    const alturaPixels = Math.max(20, duracaoMinutos);
    
    // Offset vertical: minutos do dia / minutos totais * altura da célula
    const minutosDia = inicio.getHours() * 60 + inicio.getMinutes();
    const offsetPixels = (minutosDia % 60) * (48 / 60); // 48px = altura de 1 hora
    
    return (
      <div
        key={ag.id}
        onClick={() => {
          setAgendamentoSelecionado(ag);
          setDetalhesAberto(true);
        }}
        style={{
          height: `${alturaPixels}px`,
          top: `${offsetPixels}px`,
          minHeight: '20px'
        }}
        className={`
          absolute left-0 right-0 px-2 py-1 rounded cursor-pointer text-white text-xs overflow-hidden
          ${CORES_TIPO[ag.tipoCompromisso] || "bg-gray-500"}
          ${CORES_STATUS[ag.status]}
          hover:opacity-80 transition-opacity
        `}
        title={`${ag.pacienteNome || ag.titulo} - ${formatarHora(ag.dataHoraInicio)}`}
      >
        <div className="font-medium truncate">{formatarHora(ag.dataHoraInicio)}</div>
        <div className="text-xs truncate">{ag.pacienteNome || ag.titulo}</div>
      </div>
    );
  };

  const avancarSemana = () => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + 7);
    setDataAtual(novaData);
  };

  const retrocederSemana = () => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() - 7);
    setDataAtual(novaData);
  };

  const irHoje = () => {
    setDataAtual(new Date());
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">{getNomeMes(dataAtual)} de {dataAtual.getFullYear()}</p>
        </div>
        <Button onClick={() => setDialogAberto(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controles de Navegação */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={retrocederSemana}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={irHoje}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={avancarSemana}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={profissionalSelecionado || "all"} onValueChange={(v) => setProfissionalSelecionado(v === "all" ? null : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {profissionais.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visualização Semanal (Google Calendar Style) */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          {/* Cabeçalho com dias da semana */}
          <div className="grid gap-0" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            {/* Canto superior esquerdo vazio */}
            <div className="border-b border-r bg-muted p-2 text-xs font-semibold text-center h-16 flex items-center justify-center">
              BRA
            </div>

            {/* Dias da semana */}
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
          </div>

          {/* Horários e Eventos */}
          <div className="grid gap-0" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            {horarios.map((hora) => (
              <>
                {/* Coluna de horários */}
                <div key={`hora-${hora}`} className="border-b border-r bg-muted p-2 text-xs font-semibold text-center h-12 flex items-center justify-center">
                  {hora.toString().padStart(2, "0")}:00
                </div>

                {/* Colunas de dias */}
                {diasSemana.map((dia, i) => {
                  const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
                  const agendamentosDia = agendamentosPorDia[chave] || [];
                  const agendamentosHora = agendamentosDia.filter((ag) => {
                    const dataAg = new Date(ag.dataHoraInicio);
                    return dataAg.getHours() === hora;
                  });

                  return (
                    <div
                      key={`${hora}-${i}`}
                      className="border-b border-r bg-white relative h-12 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        const novaData = new Date(dia);
                        novaData.setHours(hora, 0, 0, 0);
                        setNovoAgendamento({
                          ...novoAgendamento,
                          dataHoraInicio: novaData.toISOString().slice(0, 16),
                          dataHoraFim: new Date(novaData.getTime() + 30 * 60000).toISOString().slice(0, 16),
                        });
                        setDialogAberto(true);
                      }}
                    >
                      {agendamentosHora.map(renderizarEvento)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Novo Agendamento */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo de Compromisso */}
            <div className="space-y-2">
              <Label>Tipo de Compromisso</Label>
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

            {/* Data e Hora */}
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

            {/* Paciente */}
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Input
                placeholder="Nome do paciente"
                value={novoAgendamento.pacienteNome}
                onChange={(e) => setNovoAgendamento({ ...novoAgendamento, pacienteNome: e.target.value })}
              />
            </div>

            {/* Telefone, CPF, Convênio */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={novoAgendamento.telefone}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  placeholder="123.456.789-00"
                  value={novoAgendamento.cpf}
                  onChange={(e) => setNovoAgendamento({ ...novoAgendamento, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Convênio</Label>
                <Select value={novoAgendamento.convenio} onValueChange={(v) => setNovoAgendamento({ ...novoAgendamento, convenio: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="unimed">Unimed</SelectItem>
                    <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
                    <SelectItem value="sulamerica">SulAmérica</SelectItem>
                    <SelectItem value="amil">Amil</SelectItem>
                    <SelectItem value="hapvida">Hapvida</SelectItem>
                    <SelectItem value="notre_dame">Notre Dame</SelectItem>
                    <SelectItem value="intermédica">Intermédica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={novoAgendamento.status} onValueChange={(v) => setNovoAgendamento({ ...novoAgendamento, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observações adicionais"
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
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={detalhesAberto} onOpenChange={setDetalhesAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{agendamentoSelecionado.pacienteNome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">{formatarHora(agendamentoSelecionado.dataHoraInicio)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{agendamentoSelecionado.tipoCompromisso}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{agendamentoSelecionado.status}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
