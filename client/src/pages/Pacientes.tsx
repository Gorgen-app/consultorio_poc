import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, ClipboardList } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OPERADORAS } from "@/lib/operadoras";
import { EditarPacienteModal } from "@/components/EditarPacienteModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type SortField = "idPaciente" | "nome" | "cpf" | "telefone" | "cidade" | "uf" | "operadora1" | "operadora2" | "diagnosticoEspecifico" | "statusCaso" | "totalAtendimentos" | "atendimentos12m" | "diasDesdeUltimoAtendimento";
type SortDirection = "asc" | "desc" | null;

export default function Pacientes() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Foco automático no campo de busca quando vem do menu "Buscar Paciente"
  useEffect(() => {
    if (searchParams.includes("buscar=true") && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams]);
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filtros individuais por coluna (removidos Nome, CPF, Telefone)
  const [filtroIdade, setFiltroIdade] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroOperadora, setFiltroOperadora] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");
  const [filtroAtendimentos12m, setFiltroAtendimentos12m] = useState("");
  const [filtroDiasDesdeUltimoAtend, setFiltroDiasDesdeUltimoAtend] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Modal de edição
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Dialog de exclusão
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.pacientes.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso!");
      utils.pacientes.list.invalidate();
      setDialogExcluirAberto(false);
      setPacienteParaExcluir(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir paciente: ${error.message}`);
    },
  });

  const handleEditar = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setModalEditarAberto(true);
  };

  const handleExcluir = (paciente: any) => {
    setPacienteParaExcluir(paciente);
    setDialogExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (pacienteParaExcluir) {
      deleteMutation.mutate({ id: pacienteParaExcluir.id });
    }
  };

  const { data: pacientes, isLoading } = trpc.pacientes.list.useQuery({
    limit: 50000,
  });

  // Buscar métricas de TODOS os pacientes para permitir ordenação e filtro
  const todosPacienteIds = useMemo(() => {
    return pacientes?.map(p => p.id) || [];
  }, [pacientes]);

  const { data: todasMetricas } = trpc.pacientes.getMetricasAtendimento.useQuery(
    { pacienteIds: todosPacienteIds },
    { enabled: todosPacienteIds.length > 0 }
  );

  // Função de ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, alterna a direção
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        // Terceiro clique remove a ordenação
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // Novo campo, começa com ascendente
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Busca e filtros
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes) return [];

    let resultado = pacientes;

    // Busca global (Nome, CPF ou ID)
    if (searchTerm) {
      const termo = searchTerm.toLowerCase().trim();
      resultado = resultado.filter((p) => {
        // Garantir que nome seja string e fazer busca
        const nomeStr = String(p.nome || "").toLowerCase();
        const cpfStr = String(p.cpf || "").replace(/[^\d]/g, "");
        const idStr = String(p.idPaciente || "").toLowerCase();
        const termoLimpo = termo.replace(/[^\d]/g, "");
        
        // Verificar se o termo está em qualquer um dos campos
        const matchNome = nomeStr.includes(termo);
        const matchCpf = termoLimpo.length > 0 && cpfStr.includes(termoLimpo);
        const matchId = idStr.includes(termo);
        
        return matchNome || matchCpf || matchId;
      });
    }

    // Filtros por coluna
    if (filtroIdade) {
      resultado = resultado.filter((p) => {
        return p.idade?.toString() === filtroIdade;
      });
    }

    if (filtroCidade) {
      resultado = resultado.filter((p) =>
        p.cidade?.toLowerCase().includes(filtroCidade.toLowerCase())
      );
    }

    if (filtroUF) {
      resultado = resultado.filter((p) =>
        p.uf?.toLowerCase().includes(filtroUF.toLowerCase())
      );
    }

    if (filtroOperadora && filtroOperadora !== "todos") {
      resultado = resultado.filter((p) =>
        p.operadora1?.toLowerCase().includes(filtroOperadora.toLowerCase()) ||
        p.operadora2?.toLowerCase().includes(filtroOperadora.toLowerCase())
      );
    }

    if (filtroStatus && filtroStatus !== "todos") {
      resultado = resultado.filter((p) => p.statusCaso === filtroStatus);
    }

    if (filtroDiagnostico) {
      resultado = resultado.filter((p) =>
        p.grupoDiagnostico?.toLowerCase().includes(filtroDiagnostico.toLowerCase()) ||
        p.diagnosticoEspecifico?.toLowerCase().includes(filtroDiagnostico.toLowerCase())
      );
    }

    // Filtro por Data de Inclusão
    if (filtroDataDe) {
      const dataDe = new Date(filtroDataDe);
      resultado = resultado.filter((p) => {
        if (!p.dataInclusao) return false;
        const dataInclusao = new Date(p.dataInclusao);
        return dataInclusao >= dataDe;
      });
    }

    if (filtroDataAte) {
      const dataAte = new Date(filtroDataAte);
      dataAte.setHours(23, 59, 59, 999);
      resultado = resultado.filter((p) => {
        if (!p.dataInclusao) return false;
        const dataInclusao = new Date(p.dataInclusao);
        return dataInclusao <= dataAte;
      });
    }

    // Filtro por Atendimentos 12 meses
    if (filtroAtendimentos12m && todasMetricas) {
      const filtroNum = parseInt(filtroAtendimentos12m);
      if (!isNaN(filtroNum)) {
        resultado = resultado.filter((p) => {
          const atend = todasMetricas[p.id]?.atendimentos12m ?? 0;
          return atend >= filtroNum;
        });
      }
    }

    // Filtro por Dias desde último atendimento
    if (filtroDiasDesdeUltimoAtend && todasMetricas) {
      const filtroNum = parseInt(filtroDiasDesdeUltimoAtend);
      if (!isNaN(filtroNum)) {
        resultado = resultado.filter((p) => {
          const dias = todasMetricas[p.id]?.diasSemAtendimento;
          if (dias === null || dias === undefined) return false;
          return dias >= filtroNum;
        });
      }
    }

    // Ordenação
    if (sortField && sortDirection && todasMetricas) {
      resultado = [...resultado].sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        // Ordenação especial para campos de métricas
        if (sortField === "totalAtendimentos") {
          aVal = todasMetricas[a.id]?.totalAtendimentos ?? -1;
          bVal = todasMetricas[b.id]?.totalAtendimentos ?? -1;
          const comparison = aVal - bVal;
          return sortDirection === "asc" ? comparison : -comparison;
        } else if (sortField === "atendimentos12m") {
          aVal = todasMetricas[a.id]?.atendimentos12m ?? -1;
          bVal = todasMetricas[b.id]?.atendimentos12m ?? -1;
          const comparison = aVal - bVal;
          return sortDirection === "asc" ? comparison : -comparison;
        } else if (sortField === "diasDesdeUltimoAtendimento") {
          aVal = todasMetricas[a.id]?.diasSemAtendimento ?? 999999;
          bVal = todasMetricas[b.id]?.diasSemAtendimento ?? 999999;
          const comparison = aVal - bVal;
          return sortDirection === "asc" ? comparison : -comparison;
        } else {
          aVal = a[sortField] || "";
          bVal = b[sortField] || "";
          const comparison = String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true });
          return sortDirection === "asc" ? comparison : -comparison;
        }
      });
    }

    return resultado;
  }, [pacientes, searchTerm, filtroIdade, filtroCidade, filtroUF, filtroOperadora, filtroStatus, filtroDiagnostico, filtroDataDe, filtroDataAte, filtroAtendimentos12m, filtroDiasDesdeUltimoAtend, sortField, sortDirection, todasMetricas]);

  // Paginação
  const totalPaginas = Math.ceil(pacientesFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const pacientesPaginados = pacientesFiltrados.slice(indiceInicio, indiceFim);

  // Função para formatar dias sem atendimento
  const formatarDiasSemAtendimento = (dias: number | null | undefined): string => {
    if (dias === null || dias === undefined) return "-";
    if (dias === 0) return "Hoje";
    if (dias === 1) return "1 dia";
    if (dias < 30) return `${dias} dias`;
    if (dias < 365) {
      const meses = Math.floor(dias / 30);
      return meses === 1 ? "1 mês" : `${meses} meses`;
    }
    const anos = Math.floor(dias / 365);
    return anos === 1 ? "1 ano" : `${anos} anos`;
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroCidade("");
    setFiltroUF("");
    setFiltroOperadora("");
    setFiltroStatus("");
    setFiltroDiagnostico("");
    setFiltroDataDe("");
    setFiltroDataAte("");
    setFiltroAtendimentos12m("");
    setFiltroDiasDesdeUltimoAtend("");
    setSortField(null);
    setSortDirection(null);
    setPaginaAtual(1);
  };

  const temFiltrosAtivos = searchTerm || filtroCidade || filtroUF || filtroOperadora || filtroStatus || filtroDiagnostico || filtroDataDe || filtroDataAte || filtroAtendimentos12m || filtroDiasDesdeUltimoAtend;

  // Resetar página ao mudar filtros
  useMemo(() => {
    setPaginaAtual(1);
  }, [searchTerm, filtroCidade, filtroUF, filtroOperadora, filtroStatus, filtroDiagnostico, filtroDataDe, filtroDataAte, filtroAtendimentos12m, filtroDiasDesdeUltimoAtend]);

  // Componente de cabeçalho ordenável
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">Gerenciar cadastro de pacientes</p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Buscar Pacientes</CardTitle>
              <CardDescription>Buscar por nome, CPF ou ID do paciente</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca Global */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Digite nome, CPF ou ID do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {temFiltrosAtivos && (
              <Button variant="outline" onClick={limparFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Filtros por Coluna (simplificados - 2 linhas) */}
          {showFilters && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {/* Primeira linha: Idade, Cidade, UF, Operadora, Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Idade</label>
                  <Input
                    type="number"
                    placeholder="Idade..."
                    value={filtroIdade}
                    onChange={(e) => setFiltroIdade(e.target.value)}
                    min="0"
                    max="150"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <Input
                    placeholder="Filtrar por cidade..."
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">UF</label>
                  <Input
                    placeholder="Filtrar por UF..."
                    value={filtroUF}
                    onChange={(e) => setFiltroUF(e.target.value)}
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Operadora</label>
                  <Select value={filtroOperadora} onValueChange={setFiltroOperadora}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {OPERADORAS.map((op) => (
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Óbito">Óbito</SelectItem>
                      <SelectItem value="Perda de Seguimento">Perda de Seguimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda linha: Diagnóstico, Data De, Data Até */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diagnóstico</label>
                  <Input
                    placeholder="Filtrar por diagnóstico..."
                    value={filtroDiagnostico}
                    onChange={(e) => setFiltroDiagnostico(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inclusão (De)</label>
                  <Input
                    type="date"
                    value={filtroDataDe}
                    onChange={(e) => setFiltroDataDe(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inclusão (Até)</label>
                  <Input
                    type="date"
                    value={filtroDataAte}
                    onChange={(e) => setFiltroDataAte(e.target.value)}
                  />
                </div>
              </div>

              {/* Terceira linha: Atendimentos 12m, Dias desde último atendimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Atendimentos 12 meses (mínimo)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 1 (pacientes com pelo menos 1 atendimento)"
                    value={filtroAtendimentos12m}
                    onChange={(e) => setFiltroAtendimentos12m(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dias desde último atendimento (mínimo)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 180 (pacientes sem atendimento há 180+ dias)"
                    value={filtroDiasDesdeUltimoAtend}
                    onChange={(e) => setFiltroDiasDesdeUltimoAtend(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription>
                Mostrando {indiceInicio + 1} a {Math.min(indiceFim, pacientesFiltrados.length)} de {pacientesFiltrados.length} pacientes
                {temFiltrosAtivos && ` (${pacientes?.length || 0} no total)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select value={String(itensPorPagina)} onValueChange={(v) => { setItensPorPagina(Number(v)); setPaginaAtual(1); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : pacientesPaginados && pacientesPaginados.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="idPaciente">ID</SortableHeader>
                      <SortableHeader field="nome">Nome</SortableHeader>
                      <TableHead>Idade</TableHead>
                      <SortableHeader field="cpf">CPF</SortableHeader>
                      <SortableHeader field="telefone">Telefone</SortableHeader>
                      <SortableHeader field="cidade">Cidade</SortableHeader>
                      <SortableHeader field="uf">UF</SortableHeader>
                      <SortableHeader field="operadora1">Convênio 1</SortableHeader>
                      <SortableHeader field="operadora2">Convênio 2</SortableHeader>
                      <SortableHeader field="diagnosticoEspecifico">Diagnóstico</SortableHeader>
                      <SortableHeader field="totalAtendimentos">Total Atend.</SortableHeader>
                      <SortableHeader field="atendimentos12m">Atend. 12m</SortableHeader>
                      <SortableHeader field="diasDesdeUltimoAtendimento">Dias desde último atend.</SortableHeader>
                      <SortableHeader field="statusCaso">Status</SortableHeader>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesPaginados.map((paciente) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium">{paciente.idPaciente}</TableCell>
                        <TableCell>
                          <Link href={`/prontuario/${paciente.id}`} className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium">
                            {paciente.nome}
                          </Link>
                        </TableCell>
                        <TableCell>{paciente.idade ?? "-"}</TableCell>
                        <TableCell>{paciente.cpf || "-"}</TableCell>
                        <TableCell>{paciente.telefone || "-"}</TableCell>
                        <TableCell>{paciente.cidade || "-"}</TableCell>
                        <TableCell>{paciente.uf || "-"}</TableCell>
                        <TableCell>{paciente.operadora1 || "-"}</TableCell>
                        <TableCell>{paciente.operadora2 || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {paciente.diagnosticoEspecifico || paciente.grupoDiagnostico || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${(todasMetricas?.[paciente.id]?.totalAtendimentos || 0) > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {todasMetricas?.[paciente.id]?.totalAtendimentos ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${(todasMetricas?.[paciente.id]?.atendimentos12m || 0) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {todasMetricas?.[paciente.id]?.atendimentos12m ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const dias = todasMetricas?.[paciente.id]?.diasSemAtendimento;
                            const isInativo = dias !== null && dias !== undefined && dias > 360;
                            return (
                              <span className={`font-medium ${isInativo ? 'text-red-600' : dias !== null && dias !== undefined && dias > 180 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                {formatarDiasSemAtendimento(dias)}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <span className={`badge-${paciente.statusCaso === "Ativo" ? "success" : "warning"} px-2 py-1 rounded text-xs`}>
                            {paciente.statusCaso || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Ações: Editar + Novo Atendimento */}
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/prontuario/${paciente.id}`)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Abrir prontuário"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(paciente)}
                              className="h-8 w-8 p-0"
                              title="Editar paciente"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/atendimentos/novo?pacienteId=${paciente.id}`)}
                              className="h-8 w-8 p-0"
                              title="Novo atendimento"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluir(paciente)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir paciente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {paginaAtual} de {totalPaginas}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum paciente encontrado com os filtros aplicados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditarPacienteModal
        paciente={pacienteSelecionado}
        open={modalEditarAberto}
        onOpenChange={setModalEditarAberto}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>{pacienteParaExcluir?.nome}</strong>?
              <br /><br />
              ID: {pacienteParaExcluir?.idPaciente}
              <br />
              CPF: {pacienteParaExcluir?.cpf || "Não informado"}
              <br /><br />
              Esta ação pode ser revertida posteriormente pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
