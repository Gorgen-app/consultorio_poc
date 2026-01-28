import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  AlertTriangle,
  Activity,
  Building2,
  Scissors,
  TestTube,
  Image,
  Heart,
  Syringe,
  Baby,
  FileOutput,
  Plus,
  Edit,
  Scale,
  Ruler,
  UserPlus,
  ClipboardList,
  Pencil,
  LineChart,
  CheckCircle,
  Upload,
  Microscope
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EditarPacienteModal } from "@/components/EditarPacienteModal";

// Componentes das seções
import ProntuarioEvolucoes from "@/components/prontuario/ProntuarioEvolucoes";
import ProntuarioInternacoes from "@/components/prontuario/ProntuarioInternacoes";
import ProntuarioCirurgias from "@/components/prontuario/ProntuarioCirurgias";
import ProntuarioExamesLab from "@/components/prontuario/ProntuarioExamesLab";
import ProntuarioExamesImagem from "@/components/prontuario/ProntuarioExamesImagem";
import ProntuarioEndoscopia from "@/components/prontuario/ProntuarioEndoscopia";
import ProntuarioCardiologia from "@/components/prontuario/ProntuarioCardiologia";
import ProntuarioTerapias from "@/components/prontuario/ProntuarioTerapias";
import ProntuarioObstetricia from "@/components/prontuario/ProntuarioObstetricia";
import ProntuarioDocumentos from "@/components/prontuario/ProntuarioDocumentos";
import ProntuarioAtendimentos from "@/components/prontuario/ProntuarioAtendimentos";
import ProntuarioResumoClinico from "@/components/prontuario/ProntuarioResumoClinico";
import ProntuarioPatologia from "@/components/prontuario/ProntuarioPatologia";
import HistoricoMedidas from "@/components/prontuario/HistoricoMedidas";
import { DocumentoUpload, DocumentosList } from "@/components/prontuario/DocumentoUpload";

// Função para calcular idade
function calcularIdade(dataNascimento: Date | string | null): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

// Função para formatar data
function formatarData(data: string | Date | null): string {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

// Função para calcular IMC
function calcularIMC(peso: number | null, altura: number | null): string {
  if (!peso || !altura || altura === 0) return "-";
  const imc = peso / (altura * altura);
  return imc.toFixed(1);
}

// Função para classificar IMC
function classificarIMC(imc: number): { texto: string; cor: string } {
  if (imc < 18.5) return { texto: "Abaixo do peso", cor: "text-yellow-600" };
  if (imc < 25) return { texto: "Normal", cor: "text-emerald-600" };
  if (imc < 30) return { texto: "Sobrepeso", cor: "text-yellow-600" };
  if (imc < 35) return { texto: "Obesidade I", cor: "text-orange-600" };
  if (imc < 40) return { texto: "Obesidade II", cor: "text-red-600" };
  return { texto: "Obesidade III", cor: "text-red-700" };
}

// Função para calcular tempo de seguimento
function calcularTempoSeguimento(dataInclusao: Date | string | null): string {
  if (!dataInclusao) return "-";
  const inicio = typeof dataInclusao === 'string' ? new Date(dataInclusao) : dataInclusao;
  const hoje = new Date();
  
  let anos = hoje.getFullYear() - inicio.getFullYear();
  let meses = hoje.getMonth() - inicio.getMonth();
  let dias = hoje.getDate() - inicio.getDate();
  
  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }
  
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  
  const partes: string[] = [];
  if (anos > 0) partes.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} mês${meses > 1 ? 'es' : ''}`);
  if (dias > 0 && anos === 0) partes.push(`${dias} dia${dias > 1 ? 's' : ''}`);
  
  return partes.length > 0 ? partes.join(', ') : 'Hoje';
}

// Função para determinar se paciente está ativo
function isPacienteAtivo(obitoPerda: string | null | undefined): boolean {
  if (!obitoPerda) return true;
  const statusInativos = ['obito', 'óbito', 'perda', 'inativo', 'não', 'nao', 'falecido'];
  return !statusInativos.some(s => obitoPerda.toLowerCase().includes(s));
}

export default function Prontuario() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const pacienteId = parseInt(params.id || "0");
  
  // Ler parâmetros de URL para abrir evolução automaticamente
  const urlParams = new URLSearchParams(window.location.search);
  const secaoParam = urlParams.get('secao');
  const novaEvolucaoParam = urlParams.get('novaEvolucao') === 'true';
  const agendamentoIdParam = urlParams.get('agendamentoId');
  
  // Estado para controlar se já processamos os parâmetros de URL
  const [parametrosProcessados, setParametrosProcessados] = useState(false);
  const [abrirNovaEvolucao, setAbrirNovaEvolucao] = useState(false);
  const [agendamentoIdVinculado, setAgendamentoIdVinculado] = useState<number | null>(null);
  
  const [secaoAtiva, setSecaoAtiva] = useState(secaoParam || "resumo");
  
  // Estados para modal de nova medida
  const [modalMedidaAberto, setModalMedidaAberto] = useState(false);
  const [novoPeso, setNovoPeso] = useState("");
  const [novaAltura, setNovaAltura] = useState("");
  
  // Estado para modal de gráfico
  const [modalGraficoAberto, setModalGraficoAberto] = useState(false);
  
  // Estado para modal de edição de cadastro do paciente
  const [modalEditarPacienteAberto, setModalEditarPacienteAberto] = useState(false);
  const [modalEditarPacienteAbaInicial, setModalEditarPacienteAbaInicial] = useState<"dados-basicos" | "contato" | "convenios" | "clinico" | "historico">("dados-basicos");
  
  // Estados para modais de Alergias
  const [modalNovaAlergia, setModalNovaAlergia] = useState(false);
  const [modalTimelineAlergias, setModalTimelineAlergias] = useState(false);
  const [novaAlergiaSubstancia, setNovaAlergiaSubstancia] = useState("");
  const [novaAlergiaGravidade, setNovaAlergiaGravidade] = useState<"Leve" | "Moderada" | "Grave">("Leve");
  const [novaAlergiaReacao, setNovaAlergiaReacao] = useState("");
  
  // Estados para modais de Problemas
  const [modalNovoProblema, setModalNovoProblema] = useState(false);
  const [modalTimelineProblemas, setModalTimelineProblemas] = useState(false);
  const [novoProblemaDescricao, setNovoProblemaDescricao] = useState("");
  const [novoProblemaDataInicio, setNovoProblemaDataInicio] = useState("");
  const [novoProblemaCID, setNovoProblemaCID] = useState("");
  
  // Estados para resolver problema
  const [modalResolverProblema, setModalResolverProblema] = useState(false);
  const [problemaParaResolver, setProblemaParaResolver] = useState<{id: number; descricao: string} | null>(null);
  const [dataResolucaoProblema, setDataResolucaoProblema] = useState("");
  
  // Estados para modais de Medicamentos
  const [modalNovoMedicamento, setModalNovoMedicamento] = useState(false);
  const [modalTimelineMedicamentos, setModalTimelineMedicamentos] = useState(false);
  const [novoMedicamentoNome, setNovoMedicamentoNome] = useState("");
  const [novoMedicamentoDose, setNovoMedicamentoDose] = useState("");
  const [novoMedicamentoFrequencia, setNovoMedicamentoFrequencia] = useState("");
  const [novoMedicamentoDataInicio, setNovoMedicamentoDataInicio] = useState("");
  
  // Buscar prontuário completo
  const { data: prontuario, isLoading, error, refetch } = trpc.prontuario.completo.useQuery(
    { pacienteId },
    { enabled: pacienteId > 0 }
  );
  
  // Mutation para registrar acesso ao prontuário
  const registrarAcesso = trpc.pacientes.registrarAcesso.useMutation();
  
  // Registrar acesso ao prontuário quando a página carregar
  useEffect(() => {
    if (pacienteId > 0) {
      registrarAcesso.mutate({ pacienteId });
    }
  }, [pacienteId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Query para histórico de medidas (para o gráfico) - DEVE estar antes dos early returns
  const { data: historicoMedidas } = trpc.prontuario.historicoMedidas.listar.useQuery(
    { pacienteId, limit: 50 },
    { enabled: pacienteId > 0 }
  );
  
  // Mutation para registrar nova medida - DEVE estar antes dos early returns
  const registrarMedida = trpc.prontuario.historicoMedidas.registrar.useMutation({
    onSuccess: () => {
      toast.success("Medida registrada com sucesso!");
      setModalMedidaAberto(false);
      setNovoPeso("");
      setNovaAltura("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao registrar medida: " + err.message);
    },
  });
  
  // Mutation para adicionar nova alergia
  const criarAlergia = trpc.prontuario.alergias.create.useMutation({
    onSuccess: () => {
      toast.success("Alergia registrada com sucesso!");
      setModalNovaAlergia(false);
      setNovaAlergiaSubstancia("");
      setNovaAlergiaGravidade("Leve");
      setNovaAlergiaReacao("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao registrar alergia: " + err.message);
    },
  });
  
  // Mutation para adicionar novo problema
  const criarProblema = trpc.prontuario.problemas.create.useMutation({
    onSuccess: () => {
      toast.success("Problema registrado com sucesso!");
      setModalNovoProblema(false);
      setNovoProblemaDescricao("");
      setNovoProblemaDataInicio("");
      setNovoProblemaCID("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao registrar problema: " + err.message);
    },
  });
  
  // Mutation para adicionar novo medicamento
  const criarMedicamento = trpc.prontuario.medicamentos.create.useMutation({
    onSuccess: () => {
      toast.success("Medicamento registrado com sucesso!");
      setModalNovoMedicamento(false);
      setNovoMedicamentoNome("");
      setNovoMedicamentoDose("");
      setNovoMedicamentoFrequencia("");
      setNovoMedicamentoDataInicio("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao registrar medicamento: " + err.message);
    },
  });
  
  // Mutation para resolver problema (marcar como inativo com data de resolução)
  const resolverProblema = trpc.prontuario.problemas.update.useMutation({
    onSuccess: () => {
      toast.success("Problema marcado como resolvido!");
      setModalResolverProblema(false);
      setProblemaParaResolver(null);
      setDataResolucaoProblema("");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao resolver problema: " + err.message);
    },
  });
  
  // Efeito para processar parâmetros de URL (abrir evolução automaticamente)
  useEffect(() => {
    if (!parametrosProcessados && novaEvolucaoParam) {
      setSecaoAtiva('evolucoes');
      setAbrirNovaEvolucao(true);
      if (agendamentoIdParam) {
        setAgendamentoIdVinculado(parseInt(agendamentoIdParam));
      }
      setParametrosProcessados(true);
      
      // Limpar parâmetros da URL após processar (para evitar reprocessamento)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [parametrosProcessados, novaEvolucaoParam, agendamentoIdParam]);
  
  // Callback quando evolução é criada (para limpar estados)
  const handleEvolucaoCriada = () => {
    setAbrirNovaEvolucao(false);
    setAgendamentoIdVinculado(null);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !prontuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Erro ao carregar prontuário</h2>
            <p className="text-gray-500 mb-4">
              {error?.message || "Paciente não encontrado"}
            </p>
            <Button onClick={() => setLocation("/pacientes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { paciente, resumoClinico, problemasAtivos, alergias, medicamentosUso, totalAtendimentos } = prontuario;
  const idade = calcularIdade(paciente.dataNascimento);
  const isMulher = paciente.sexo === "F";
  
  // Status do paciente
  const pacienteAtivo = isPacienteAtivo(paciente.obitoPerda);
  const tempoSeguimento = calcularTempoSeguimento(paciente.dataInclusao);
  
  // Calcular IMC
  const peso = resumoClinico?.pesoAtual ? Number(resumoClinico.pesoAtual) : null;
  const altura = resumoClinico?.altura ? Number(resumoClinico.altura) : null;
  const imcValor = peso && altura ? peso / (altura * altura) : null;
  const imcClassificacao = imcValor ? classificarIMC(imcValor) : null;
  
  // Função para salvar nova medida
  const handleSalvarMedida = () => {
    if (!novoPeso && !novaAltura) {
      toast.error("Preencha pelo menos um campo");
      return;
    }
    registrarMedida.mutate({
      pacienteId,
      peso: novoPeso ? parseFloat(novoPeso) : undefined,
      altura: novaAltura ? parseFloat(novaAltura) : undefined,
    });
  };
  
  // Formatar dados para o gráfico
  const dadosGrafico = historicoMedidas?.map(m => ({
    data: new Date(m.dataMedicao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    dataCompleta: new Date(m.dataMedicao).toLocaleDateString('pt-BR'),
    peso: m.peso ? Number(m.peso) : null,
    altura: m.altura ? Number(m.altura) : null,
    imc: m.imc ? Number(m.imc) : null,
    registradoPor: m.registradoPor,
  })).reverse() || [];
  
  // Menu lateral
  const menuItems = [
    { id: "resumo", label: "Resumo Clínico", icon: ClipboardList },
    { id: "atendimentos", label: "Atendimentos", icon: Stethoscope },
    { id: "medidas", label: "Medidas Antropométricas", icon: Scale },
    { id: "evolucoes", label: "Evoluções", icon: FileText },
    { id: "internacoes", label: "Internações", icon: Building2 },
    { id: "cirurgias", label: "Cirurgias", icon: Scissors },
    { id: "exames-lab", label: "Exames Laboratoriais", icon: TestTube },
    { id: "exames-imagem", label: "Exames de Imagem", icon: Image },
    { id: "endoscopia", label: "Endoscopia", icon: Stethoscope },
    { id: "cardiologia", label: "Cardiologia", icon: Heart },
    { id: "patologia", label: "Patologia", icon: Microscope },
    { id: "terapias", label: "Terapias e Infusões", icon: Syringe },
    ...(isMulher ? [{ id: "obstetricia", label: "Obstetrícia", icon: Baby }] : []),
    { id: "documentos", label: "Documentos", icon: FileOutput },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com dados do paciente */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          {/* Botão voltar e título */}
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/pacientes")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Prontuário Médico</h1>
              <p className="text-sm text-gray-500">ID: {paciente.idPaciente}</p>
            </div>
            {/* Botão Novo Atendimento */}
            <Button 
              onClick={() => {
                // Passar dados do paciente via query params para pré-preenchimento
                const params = new URLSearchParams({
                  pacienteId: paciente.id.toString(),
                  pacienteNome: paciente.nome,
                  ...(paciente.operadora1 && { convenio: paciente.operadora1 }),
                  ...(paciente.planoModalidade1 && { planoModalidade: paciente.planoModalidade1 }),
                  ...(paciente.matriculaConvenio1 && { matriculaConvenio: paciente.matriculaConvenio1 }),
                });
                setLocation(`/atendimentos/novo?${params.toString()}`);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
{/* Card de Status do Paciente */}
            <div className="bg-white border rounded-lg p-3 shadow-sm min-w-[180px]">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={pacienteAtivo ? "default" : "destructive"} className="font-semibold">
                    {pacienteAtivo ? "ATIVO" : "INATIVO"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tempo de seguimento:</span>
                  <span className="font-medium text-gray-700">{tempoSeguimento}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nº de atendimentos:</span>
                  <span className="font-medium text-[#0056A4]">{totalAtendimentos ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dados do paciente */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Coluna 1: Identificação */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Identificação
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalEditarPacienteAberto(true)}
                    title="Editar cadastro do paciente"
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-lg font-semibold">{paciente.nome}</p>
                  <p className="text-sm text-gray-500">
                    {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Feminino" : "-"}, {idade ? `${idade} anos` : "-"}
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">CPF:</span> {paciente.cpf || "-"}</p>
                  <p><span className="text-gray-500">Nascimento:</span> {formatarData(paciente.dataNascimento)}</p>
                  <p><span className="text-gray-500">Mãe:</span> {paciente.nomeMae || "-"}</p>
                  <p><span className="text-gray-500">Convênio:</span> {paciente.operadora1 || "-"}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Coluna 2: Contato */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setModalEditarPacienteAbaInicial("contato");
                      setModalEditarPacienteAberto(true);
                    }}
                    title="Editar dados de contato"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{paciente.telefone || "-"}</span>
                  {paciente.telefone && (
                    <a
                      href={`https://wa.me/55${paciente.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Abrir WhatsApp"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {paciente.email ? (
                    <a href={`mailto:${paciente.email}`} className="truncate text-[#0056A4] hover:underline">
                      {paciente.email}
                    </a>
                  ) : (
                    <span className="truncate">-</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    {paciente.endereco ? `${paciente.endereco}, ${paciente.bairro || ""} - ${paciente.cidade || ""}/${paciente.uf || ""}` : "-"}
                  </span>
                </div>
                {/* Responsável */}
                {paciente.responsavelNome && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      Responsável / Contato de Emergência
                    </p>
                    <p className="font-medium">{paciente.responsavelNome}</p>
                    <p className="text-gray-500">{paciente.responsavelParentesco || "-"}</p>
                    <p>{paciente.responsavelTelefone || "-"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Coluna 3: Dados Antropométricos */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Dados Antropométricos
                  </CardTitle>
                  <div className="flex gap-1">
                    {/* Botão de Gráfico */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setModalGraficoAberto(true)}
                      title="Ver evolução"
                    >
                      <LineChart className="h-3.5 w-3.5 text-gray-500 hover:text-[#0056A4]" />
                    </Button>
                    {/* Botão de Edição (inserir novo dado) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setModalMedidaAberto(true)}
                      title="Registrar nova medida"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-500 hover:text-[#0056A4]" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#0056A4]">
                      {peso ? `${peso}` : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Peso (kg)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {altura ? `${altura}` : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Altura (m)</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${imcClassificacao?.cor || "text-gray-400"}`}>
                      {imcValor ? imcValor.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-gray-500">IMC</p>
                    {imcClassificacao && (
                      <p className={`text-xs ${imcClassificacao.cor}`}>{imcClassificacao.texto}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Coluna 4: Resumo Rápido */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Resumo Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Alergias */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Alergias
                    </p>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalTimelineAlergias(true)}
                        title="Ver timeline"
                      >
                        <LineChart className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalNovaAlergia(true)}
                        title="Adicionar alergia"
                      >
                        <Pencil className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                    </div>
                  </div>
                  {alergias.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {alergias.map((a) => (
                        <Badge 
                          key={a.id} 
                          variant={a.gravidade === "Grave" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {a.substancia}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                      Nenhuma alergia conhecida
                    </Badge>
                  )}
                </div>
                
                {/* Problemas Ativos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      Problemas Ativos ({problemasAtivos.filter(p => p.ativo).length})
                    </p>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalTimelineProblemas(true)}
                        title="Ver timeline"
                      >
                        <LineChart className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalNovoProblema(true)}
                        title="Adicionar problema"
                      >
                        <Pencil className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                    </div>
                  </div>
                  {problemasAtivos.filter(p => p.ativo).slice(0, 3).map((p) => (
                    <p key={p.id} className="text-xs truncate">{p.descricao}</p>
                  ))}
                  {problemasAtivos.filter(p => p.ativo).length > 3 && (
                    <p className="text-xs text-[#0056A4]">+{problemasAtivos.filter(p => p.ativo).length - 3} mais...</p>
                  )}
                </div>
                
                {/* Medicamentos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      Medicamentos em Uso ({medicamentosUso.length})
                    </p>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalTimelineMedicamentos(true)}
                        title="Ver timeline"
                      >
                        <LineChart className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setModalNovoMedicamento(true)}
                        title="Adicionar medicamento"
                      >
                        <Pencil className="h-3 w-3 text-gray-400 hover:text-[#0056A4]" />
                      </Button>
                    </div>
                  </div>
                  {medicamentosUso.slice(0, 2).map((m) => (
                    <p key={m.id} className="text-xs truncate">{m.medicamento}</p>
                  ))}
                  {medicamentosUso.length > 2 && (
                    <p className="text-xs text-[#0056A4]">+{medicamentosUso.length - 2} mais...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal com menu lateral */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* Menu lateral */}
        <div className="w-64 bg-white border-r min-h-[calc(100vh-280px)] p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSecaoAtiva(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    secaoAtiva === item.id
                      ? "bg-blue-50 text-[#0056A4] font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Área de conteúdo */}
        <div className="flex-1 p-6">
          {secaoAtiva === "resumo" && (
            <ProntuarioResumoClinico 
              pacienteId={pacienteId} 
              resumoClinico={resumoClinico}
              problemasAtivos={problemasAtivos}
              alergias={alergias}
              medicamentosUso={medicamentosUso}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "atendimentos" && (
            <ProntuarioAtendimentos 
              pacienteId={pacienteId} 
            />
          )}
          {secaoAtiva === "medidas" && (
            <HistoricoMedidas 
              pacienteId={pacienteId} 
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "evolucoes" && (
            <div className="space-y-4">
              {/* Cabeçalho com dados do paciente para consulta rápida */}
              <Card className="bg-[#0056A4]/5 border-[#0056A4]/20">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-[#0056A4]" />
                        <span className="font-semibold text-lg">{paciente.nome}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span><strong>CPF:</strong> {paciente.cpf || "-"}</span>
                        <span><strong>ID:</strong> {paciente.idPaciente}</span>
                        <span><strong>Idade:</strong> {idade ? `${idade} anos` : "-"}</span>
                        <span><strong>Convênio:</strong> {paciente.operadora1 || "Particular"}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSecaoAtiva("resumo")}
                      className="border-[#0056A4] text-[#0056A4] hover:bg-[#0056A4]/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir Prontuário Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <ProntuarioEvolucoes 
                pacienteId={pacienteId} 
                evolucoes={prontuario.evolucoes}
                onUpdate={refetch}
                abrirNovaEvolucao={abrirNovaEvolucao}
                agendamentoIdVinculado={agendamentoIdVinculado}
                onEvolucaoCriada={handleEvolucaoCriada}
                onAtendimentoEncerrado={() => setLocation("/agenda")}
                paciente={{
                  nome: paciente.nome,
                  cpf: paciente.cpf,
                  dataNascimento: paciente.dataNascimento,
                  idPaciente: paciente.idPaciente
                }}
              />
            </div>
          )}
          {secaoAtiva === "internacoes" && (
            <ProntuarioInternacoes 
              pacienteId={pacienteId} 
              internacoes={prontuario.internacoes}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "cirurgias" && (
            <ProntuarioCirurgias 
              pacienteId={pacienteId} 
              cirurgias={prontuario.cirurgias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "exames-lab" && (
            <ProntuarioExamesLab 
              pacienteId={pacienteId} 
              exames={prontuario.examesLaboratoriais}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "exames-imagem" && (
            <ProntuarioExamesImagem 
              pacienteId={pacienteId} 
              exames={prontuario.examesImagem}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "endoscopia" && (
            <ProntuarioEndoscopia 
              pacienteId={pacienteId} 
              exames={prontuario.endoscopias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "cardiologia" && (
            <ProntuarioCardiologia 
              pacienteId={pacienteId} 
              exames={prontuario.cardiologia}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "terapias" && (
            <ProntuarioTerapias 
              pacienteId={pacienteId} 
              terapias={prontuario.terapias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "obstetricia" && isMulher && (
            <ProntuarioObstetricia 
              pacienteId={pacienteId} 
              registros={prontuario.obstetricia}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "documentos" && (
            <ProntuarioDocumentos 
              pacienteId={pacienteId}
              pacienteNome={paciente.nome}
              documentos={prontuario.documentos}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "patologia" && (
            <ProntuarioPatologia 
              pacienteId={pacienteId}
              onUpdate={refetch}
            />
          )}
        </div>
      </div>
      
      {/* Modal para registrar nova medida */}
      <Dialog open={modalMedidaAberto} onOpenChange={setModalMedidaAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Registrar Nova Medida
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Os dados anteriores serão preservados no histórico para consulta.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="novoPeso">Peso (kg)</Label>
                <Input
                  id="novoPeso"
                  type="number"
                  step="0.1"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder={peso ? `Atual: ${peso}` : "Ex: 75.5"}
                />
              </div>
              <div>
                <Label htmlFor="novaAltura">Altura (m)</Label>
                <Input
                  id="novaAltura"
                  type="number"
                  step="0.01"
                  value={novaAltura}
                  onChange={(e) => setNovaAltura(e.target.value)}
                  placeholder={altura ? `Atual: ${altura}` : "Ex: 1.75"}
                />
              </div>
            </div>
            {(novoPeso || novaAltura) && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-[#0056A4]">
                  <strong>IMC Calculado:</strong>{" "}
                  {novoPeso && (novaAltura || altura) 
                    ? (parseFloat(novoPeso) / Math.pow(parseFloat(novaAltura || String(altura)), 2)).toFixed(1)
                    : "-"
                  } kg/m²
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMedidaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarMedida} disabled={registrarMedida.isPending}>
              {registrarMedida.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Gráfico de Evolução */}
      <Dialog open={modalGraficoAberto} onOpenChange={setModalGraficoAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Evolução das Medidas Antropométricas
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {dadosGrafico.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum histórico de medidas encontrado.</p>
                <p className="text-sm">Registre a primeira medida para visualizar a evolução.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gráfico de Peso */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#0056A4]" />
                    Evolução do Peso (kg)
                  </h4>
                  <div className="h-48 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-end justify-between h-full gap-2">
                      {dadosGrafico.filter(d => d.peso).slice(-12).map((d, i) => {
                        const pesos = dadosGrafico.filter(x => x.peso).map(x => x.peso!);
                        const maxPeso = Math.max(...pesos);
                        const minPeso = Math.min(...pesos);
                        const range = maxPeso - minPeso || 1;
                        const heightPercent = ((d.peso! - minPeso) / range) * 70 + 20;
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                            <span className="text-xs font-medium text-[#0056A4] mb-1">{d.peso}</span>
                            <div 
                              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                              style={{ height: `${heightPercent}%` }}
                              title={`${d.dataCompleta}\nPeso: ${d.peso} kg\nRegistrado por: ${d.registradoPor}`}
                            />
                            <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{d.data}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Gráfico de IMC */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Evolução do IMC
                  </h4>
                  <div className="h-48 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-end justify-between h-full gap-2">
                      {dadosGrafico.filter(d => d.imc).slice(-12).map((d, i) => {
                        const imcs = dadosGrafico.filter(x => x.imc).map(x => x.imc!);
                        const maxIMC = Math.max(...imcs);
                        const minIMC = Math.min(...imcs);
                        const range = maxIMC - minIMC || 1;
                        const heightPercent = ((d.imc! - minIMC) / range) * 70 + 20;
                        const cor = d.imc! < 18.5 ? 'bg-yellow-500' : d.imc! < 25 ? 'bg-emerald-500' : d.imc! < 30 ? 'bg-yellow-500' : 'bg-red-500';
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                            <span className="text-xs font-medium text-emerald-600 mb-1">{d.imc}</span>
                            <div 
                              className={`w-full ${cor} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                              style={{ height: `${heightPercent}%` }}
                              title={`${d.dataCompleta}\nIMC: ${d.imc}\nRegistrado por: ${d.registradoPor}`}
                            />
                            <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{d.data}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Tabela de Histórico */}
                <div>
                  <h4 className="font-medium mb-3">Histórico Completo</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Data</th>
                          <th className="px-3 py-2 text-right">Peso (kg)</th>
                          <th className="px-3 py-2 text-right">Altura (m)</th>
                          <th className="px-3 py-2 text-right">IMC</th>
                          <th className="px-3 py-2 text-left">Registrado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosGrafico.slice().reverse().map((d, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2">{d.dataCompleta}</td>
                            <td className="px-3 py-2 text-right font-medium text-[#0056A4]">{d.peso || "-"}</td>
                            <td className="px-3 py-2 text-right">{d.altura || "-"}</td>
                            <td className="px-3 py-2 text-right font-medium text-emerald-600">{d.imc || "-"}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{d.registradoPor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar nova alergia */}
      <Dialog open={modalNovaAlergia} onOpenChange={setModalNovaAlergia}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Registrar Nova Alergia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Os dados anteriores serão preservados no histórico para consulta.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="substancia">Substância *</Label>
                <Input
                  id="substancia"
                  value={novaAlergiaSubstancia}
                  onChange={(e) => setNovaAlergiaSubstancia(e.target.value)}
                  placeholder="Ex: Penicilina, Amendoim, Pólen"
                />
              </div>
              <div>
                <Label htmlFor="gravidade">Gravidade</Label>
                <Select value={novaAlergiaGravidade} onValueChange={(v: "Leve" | "Moderada" | "Grave") => setNovaAlergiaGravidade(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Moderada">Moderada</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reacao">Reação</Label>
                <Input
                  id="reacao"
                  value={novaAlergiaReacao}
                  onChange={(e) => setNovaAlergiaReacao(e.target.value)}
                  placeholder="Ex: Urticária, Edema, Anafilaxia"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovaAlergia(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!novaAlergiaSubstancia) {
                  toast.error("Informe a substância");
                  return;
                }
                criarAlergia.mutate({
                  pacienteId,
                  tipo: "Medicamento",
                  substancia: novaAlergiaSubstancia,
                  gravidade: novaAlergiaGravidade,
                  reacao: novaAlergiaReacao || null,
                });
              }}
              disabled={criarAlergia.isPending}
            >
              {criarAlergia.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Timeline de Alergias */}
      <Dialog open={modalTimelineAlergias} onOpenChange={setModalTimelineAlergias}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Timeline de Alergias
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {alergias.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma alergia registrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline visual */}
                <div className="relative">
                  {alergias.map((a, i) => (
                    <div key={a.id} className="flex items-start gap-4 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${a.gravidade === 'Grave' ? 'bg-red-500' : a.gravidade === 'Moderada' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                        {i < alergias.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{a.substancia}</span>
                          <Badge variant={a.gravidade === 'Grave' ? 'destructive' : 'outline'}>
                            {a.gravidade || 'Não especificada'}
                          </Badge>
                        </div>
                        {a.reacao && <p className="text-sm text-gray-600 mt-1">Reação: {a.reacao}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Tipo: {a.tipo} | Registrado em: {a.createdAt ? new Date(a.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar novo problema */}
      <Dialog open={modalNovoProblema} onOpenChange={setModalNovoProblema}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#0056A4]" />
              Registrar Novo Problema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Os dados anteriores serão preservados no histórico para consulta.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="descricaoProblema">Descrição *</Label>
                <Input
                  id="descricaoProblema"
                  value={novoProblemaDescricao}
                  onChange={(e) => setNovoProblemaDescricao(e.target.value)}
                  placeholder="Ex: Hipertensão Arterial, Diabetes Mellitus"
                />
              </div>
              <div>
                <Label htmlFor="cidProblema">CID-10</Label>
                <Input
                  id="cidProblema"
                  value={novoProblemaCID}
                  onChange={(e) => setNovoProblemaCID(e.target.value)}
                  placeholder="Ex: I10, E11"
                />
              </div>
              <div>
                <Label htmlFor="dataInicioProblema">Data de Início</Label>
                <Input
                  id="dataInicioProblema"
                  type="date"
                  value={novoProblemaDataInicio}
                  onChange={(e) => setNovoProblemaDataInicio(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoProblema(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!novoProblemaDescricao) {
                  toast.error("Informe a descrição do problema");
                  return;
                }
                criarProblema.mutate({
                  pacienteId,
                  descricao: novoProblemaDescricao,
                  cid10: novoProblemaCID || null,
                  dataInicio: novoProblemaDataInicio || null,
                  ativo: true,
                });
              }}
              disabled={criarProblema.isPending}
            >
              {criarProblema.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Timeline de Problemas */}
      <Dialog open={modalTimelineProblemas} onOpenChange={setModalTimelineProblemas}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#0056A4]" />
              Timeline de Problemas de Saúde
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {problemasAtivos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum problema registrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline visual */}
                <div className="relative">
                  {problemasAtivos.map((p, i) => (
                    <div key={p.id} className="flex items-start gap-4 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${p.ativo ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {i < problemasAtivos.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.descricao}</span>
                          <div className="flex items-center gap-2">
                            {p.ativo && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  setProblemaParaResolver({ id: p.id, descricao: p.descricao });
                                  setDataResolucaoProblema(new Date().toISOString().split('T')[0]);
                                  setModalResolverProblema(true);
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Resolver
                              </Button>
                            )}
                            <Badge variant={p.ativo ? 'destructive' : 'outline'}>
                              {p.ativo ? 'Ativo' : 'Resolvido'}
                            </Badge>
                          </div>
                        </div>
                        {p.cid10 && <p className="text-sm text-gray-600 mt-1">CID-10: {p.cid10}</p>}
                        <div className="text-xs text-gray-400 mt-1 flex gap-4">
                          <span>Início: {p.dataInicio ? new Date(p.dataInicio).toLocaleDateString('pt-BR') : '-'}</span>
                          {p.dataResolucao && <span>Resolução: {new Date(p.dataResolucao).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar novo medicamento */}
      <Dialog open={modalNovoMedicamento} onOpenChange={setModalNovoMedicamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Registrar Novo Medicamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Os dados anteriores serão preservados no histórico para consulta.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="nomeMedicamento">Nome do Medicamento *</Label>
                <Input
                  id="nomeMedicamento"
                  value={novoMedicamentoNome}
                  onChange={(e) => setNovoMedicamentoNome(e.target.value)}
                  placeholder="Ex: Losartana, Metformina"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="doseMedicamento">Dosagem</Label>
                  <Input
                    id="doseMedicamento"
                    value={novoMedicamentoDose}
                    onChange={(e) => setNovoMedicamentoDose(e.target.value)}
                    placeholder="Ex: 50mg"
                  />
                </div>
                <div>
                  <Label htmlFor="frequenciaMedicamento">Frequência</Label>
                  <Input
                    id="frequenciaMedicamento"
                    value={novoMedicamentoFrequencia}
                    onChange={(e) => setNovoMedicamentoFrequencia(e.target.value)}
                    placeholder="Ex: 12/12h"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dataInicioMedicamento">Data de Início</Label>
                <Input
                  id="dataInicioMedicamento"
                  type="date"
                  value={novoMedicamentoDataInicio}
                  onChange={(e) => setNovoMedicamentoDataInicio(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoMedicamento(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!novoMedicamentoNome) {
                  toast.error("Informe o nome do medicamento");
                  return;
                }
                criarMedicamento.mutate({
                  pacienteId,
                  medicamento: novoMedicamentoNome,
                  dosagem: novoMedicamentoDose || null,
                  posologia: novoMedicamentoFrequencia || null,
                  dataInicio: novoMedicamentoDataInicio || null,
                  ativo: true,
                });
              }}
              disabled={criarMedicamento.isPending}
            >
              {criarMedicamento.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Timeline de Medicamentos */}
      <Dialog open={modalTimelineMedicamentos} onOpenChange={setModalTimelineMedicamentos}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Timeline de Medicamentos
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {medicamentosUso.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum medicamento registrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline visual */}
                <div className="relative">
                  {medicamentosUso.map((m, i) => (
                    <div key={m.id} className="flex items-start gap-4 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${m.ativo ? 'bg-purple-500' : 'bg-gray-400'}`} />
                        {i < medicamentosUso.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.medicamento}</span>
                          <Badge variant={m.ativo ? 'default' : 'outline'}>
                            {m.ativo ? 'Em uso' : 'Suspenso'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {m.dosagem && <span>{m.dosagem}</span>}
                          {m.posologia && <span> - {m.posologia}</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-4">
                          <span>Início: {m.dataInicio ? new Date(m.dataInicio).toLocaleDateString('pt-BR') : '-'}</span>
                          {m.dataFim && <span>Fim: {new Date(m.dataFim).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal para resolver problema */}
      <Dialog open={modalResolverProblema} onOpenChange={setModalResolverProblema}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Resolver Problema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Você está marcando o problema como resolvido:
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{problemaParaResolver?.descricao}</p>
            </div>
            <p className="text-sm text-gray-500">
              O problema será marcado como inativo e a data de resolução será registrada.
              O histórico será preservado para consulta futura.
            </p>
            <div>
              <Label htmlFor="dataResolucao">Data de Resolução *</Label>
              <Input
                id="dataResolucao"
                type="date"
                value={dataResolucaoProblema}
                onChange={(e) => setDataResolucaoProblema(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModalResolverProblema(false);
              setProblemaParaResolver(null);
              setDataResolucaoProblema("");
            }}>
              Cancelar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!dataResolucaoProblema) {
                  toast.error("Informe a data de resolução");
                  return;
                }
                if (!problemaParaResolver) return;
                resolverProblema.mutate({
                  id: problemaParaResolver.id,
                  ativo: false,
                  dataResolucao: dataResolucaoProblema,
                });
              }}
              disabled={resolverProblema.isPending}
            >
              {resolverProblema.isPending ? "Salvando..." : "Confirmar Resolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Edição de Cadastro do Paciente */}
      <EditarPacienteModal
        paciente={paciente}
        open={modalEditarPacienteAberto}
        onOpenChange={(open) => {
          setModalEditarPacienteAberto(open);
          if (!open) {
            refetch(); // Recarrega os dados do prontuário após fechar o modal
            setModalEditarPacienteAbaInicial("dados-basicos"); // Reset para aba padrão
          }
        }}
        initialTab={modalEditarPacienteAbaInicial}
      />
    </div>
  );
}
