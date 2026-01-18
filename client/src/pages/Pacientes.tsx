import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, ClipboardList, Loader2, AlertTriangle, Users } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OPERADORAS } from "@/lib/operadoras";
import { EditarPacienteModal } from "@/components/EditarPacienteModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SortField = "idPaciente" | "nome" | "cpf" | "telefone" | "cidade" | "uf" | "operadora1" | "operadora2" | "diagnosticoEspecifico" | "statusCaso" | "totalAtendimentos" | "atendimentos12m" | "diasDesdeUltimoAtendimento" | "primeiroAtendimento";
type SortDirection = "asc" | "desc" | null;

// Cache de métricas em memória
const metricasCache = new Map<number, {
  totalAtendimentos: number;
  atendimentos12m: number;
  diasSemAtendimento: number | null;
  ultimoAtendimento: string | null;
  primeiroAtendimento: string | null;
  cachedAt: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export default function Pacientes() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce da busca para evitar muitas requisições
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Foco automático no campo de busca quando vem do menu "Buscar Paciente"
  useEffect(() => {
    if (searchParams.includes("buscar=true") && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams]);
  
  // Ordenação (client-side para campos básicos, server-side para métricas seria ideal mas complexo)
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filtros server-side
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroUF, setFiltroUF] = useState("");
  const [filtroOperadora, setFiltroOperadora] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState("");

  // Paginação server-side
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Modal de edição
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Dialog de exclusão
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  // Estado para métricas carregadas via lazy loading
  const [metricasCarregadas, setMetricasCarregadas] = useState<Record<number, any>>({});

  const utils = trpc.useUtils();

  const deleteMutation = trpc.pacientes.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso!");
      utils.pacientes.listPaginated.invalidate();
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

  // Verificar se há filtros ativos
  const temFiltrosAtivos = !!(debouncedSearchTerm || filtroCidade || filtroUF || 
    (filtroOperadora && filtroOperadora !== "todos") || 
    (filtroStatus && filtroStatus !== "todos") || 
    filtroDiagnostico);

  // Query com paginação server-side - só executa se houver filtros
  const { data: paginatedData, isLoading, isFetching } = trpc.pacientes.listPaginated.useQuery({
    busca: debouncedSearchTerm || undefined,
    convenio: filtroOperadora && filtroOperadora !== "todos" ? filtroOperadora : undefined,
    diagnostico: filtroDiagnostico || undefined,
    status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined,
    cidade: filtroCidade || undefined,
    uf: filtroUF || undefined,
    page: paginaAtual,
    pageSize: itensPorPagina,
  });

  const pacientes = paginatedData?.pacientes || [];
  const totalPacientes = paginatedData?.total || 0;
  const totalPaginas = paginatedData?.totalPages || 1;
  // Nota: semFiltro, excedeuLimite e totalBruto não são retornados pela query atual
  const semFiltro = !temFiltrosAtivos;
  const excedeuLimite = false;
  const totalBruto = totalPacientes;

  // Verificar se há próxima página para pré-carregamento
  const hasNextPage = paginaAtual < totalPaginas;

  // IDs dos pacientes da página atual para carregar métricas
  const pacienteIdsDaPagina = useMemo(() => pacientes.map(p => p.id), [pacientes]);

  // Lazy loading de métricas - carrega apenas para os pacientes visíveis
  const { data: metricasPagina } = trpc.pacientes.getMetricasAtendimento.useQuery(
    { pacienteIds: pacienteIdsDaPagina },
    { 
      enabled: pacienteIdsDaPagina.length > 0,
      staleTime: CACHE_TTL, // Cache por 5 minutos
    }
  );

  // Pré-carregamento dos dados da próxima página para navegação fluida
  const { data: proximaPaginaData } = trpc.pacientes.listPaginated.useQuery(
    {
      busca: debouncedSearchTerm || undefined,
      convenio: filtroOperadora && filtroOperadora !== "todos" ? filtroOperadora : undefined,
      diagnostico: filtroDiagnostico || undefined,
      status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined,
      cidade: filtroCidade || undefined,
      uf: filtroUF || undefined,
      page: paginaAtual + 1,
      pageSize: itensPorPagina,
    },
    {
      enabled: hasNextPage && !isLoading && !isFetching && temFiltrosAtivos,
      staleTime: 30000,
    }
  );

  // Pré-carregar métricas da próxima página em background
  const proximaPaginaIds = useMemo(
    () => proximaPaginaData?.pacientes?.map(p => p.id) || [],
    [proximaPaginaData]
  );
  
  trpc.pacientes.getMetricasAtendimento.useQuery(
    { pacienteIds: proximaPaginaIds },
    {
      enabled: proximaPaginaIds.length > 0 && hasNextPage,
      staleTime: CACHE_TTL,
    }
  );

  // Atualizar cache local quando métricas chegam
  useEffect(() => {
    if (metricasPagina) {
      const now = Date.now();
      Object.entries(metricasPagina).forEach(([id, metricas]) => {
        metricasCache.set(Number(id), { ...metricas, cachedAt: now });
      });
      setMetricasCarregadas(prev => ({ ...prev, ...metricasPagina }));
    }
  }, [metricasPagina]);

  // Função de ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Ordenação client-side dos pacientes da página atual
  const pacientesOrdenados = useMemo(() => {
    if (!sortField || !sortDirection) return pacientes;
    
    return [...pacientes].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      // Ordenação especial para campos de métricas
      if (sortField === "totalAtendimentos") {
        aVal = metricasCarregadas[a.id]?.totalAtendimentos ?? metricasPagina?.[a.id]?.totalAtendimentos ?? -1;
        bVal = metricasCarregadas[b.id]?.totalAtendimentos ?? metricasPagina?.[b.id]?.totalAtendimentos ?? -1;
        const comparison = aVal - bVal;
        return sortDirection === "asc" ? comparison : -comparison;
      } else if (sortField === "atendimentos12m") {
        aVal = metricasCarregadas[a.id]?.atendimentos12m ?? metricasPagina?.[a.id]?.atendimentos12m ?? -1;
        bVal = metricasCarregadas[b.id]?.atendimentos12m ?? metricasPagina?.[b.id]?.atendimentos12m ?? -1;
        const comparison = aVal - bVal;
        return sortDirection === "asc" ? comparison : -comparison;
      } else if (sortField === "diasDesdeUltimoAtendimento") {
        aVal = metricasCarregadas[a.id]?.diasSemAtendimento ?? metricasPagina?.[a.id]?.diasSemAtendimento ?? 999999;
        bVal = metricasCarregadas[b.id]?.diasSemAtendimento ?? metricasPagina?.[b.id]?.diasSemAtendimento ?? 999999;
        const comparison = aVal - bVal;
        return sortDirection === "asc" ? comparison : -comparison;
      } else if (sortField === "primeiroAtendimento") {
        const aDate = metricasCarregadas[a.id]?.primeiroAtendimento ?? metricasPagina?.[a.id]?.primeiroAtendimento;
        const bDate = metricasCarregadas[b.id]?.primeiroAtendimento ?? metricasPagina?.[b.id]?.primeiroAtendimento;
        aVal = aDate ? new Date(aDate).getTime() : 0;
        bVal = bDate ? new Date(bDate).getTime() : 0;
        const comparison = aVal - bVal;
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        aVal = a[sortField] || "";
        bVal = b[sortField] || "";
        const comparison = String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true });
        return sortDirection === "asc" ? comparison : -comparison;
      }
    });
  }, [pacientes, sortField, sortDirection, metricasCarregadas, metricasPagina]);

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
    setSortField(null);
    setSortDirection(null);
    setPaginaAtual(1);
  };

  // Resetar página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [debouncedSearchTerm, filtroCidade, filtroUF, filtroOperadora, filtroStatus, filtroDiagnostico]);

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

  // Obter métricas de um paciente (do cache ou da query)
  const getMetricas = useCallback((pacienteId: number) => {
    // Primeiro tenta do cache local
    const cached = metricasCache.get(pacienteId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return cached;
    }
    // Depois tenta da query atual
    return metricasPagina?.[pacienteId] || metricasCarregadas[pacienteId];
  }, [metricasPagina, metricasCarregadas]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">
            Gerenciar cadastro de pacientes
          </p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Card de Busca e Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Busca Global */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nome, CPF ou ID do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
            {temFiltrosAtivos && (
              <Button variant="ghost" onClick={limparFiltros} className="gap-2">
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1 block">Cidade</label>
                <Input
                  placeholder="Filtrar por cidade"
                  value={filtroCidade}
                  onChange={(e) => setFiltroCidade(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">UF</label>
                <Input
                  placeholder="Ex: RS"
                  value={filtroUF}
                  onChange={(e) => setFiltroUF(e.target.value)}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Convênio</label>
                <Select value={filtroOperadora} onValueChange={setFiltroOperadora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {OPERADORAS.map((op) => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Óbito">Óbito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Diagnóstico</label>
                <Input
                  placeholder="Filtrar por diagnóstico"
                  value={filtroDiagnostico}
                  onChange={(e) => setFiltroDiagnostico(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagem quando não há filtros */}
      {semFiltro && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Busque um paciente</h3>
                <p className="text-muted-foreground max-w-md">
                  Digite o <strong>nome</strong>, <strong>CPF</strong> ou <strong>ID</strong> do paciente no campo de busca acima, 
                  ou utilize os filtros avançados para encontrar pacientes específicos.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => searchInputRef.current?.focus()}
                className="mt-4"
              >
                <Search className="h-4 w-4 mr-2" />
                Iniciar Busca
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso quando excedeu limite de 1000 */}
      {excedeuLimite && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Muitos resultados encontrados</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Sua busca retornou <strong>{totalBruto.toLocaleString('pt-BR')}</strong> pacientes. 
            Estamos exibindo apenas os primeiros <strong>1.000</strong> resultados. 
            Refine sua busca para encontrar pacientes específicos.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Pacientes - só exibe se houver filtros ativos */}
      {temFiltrosAtivos && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados da Busca</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    "Buscando pacientes..."
                  ) : totalPacientes > 0 ? (
                    <>
                      Mostrando {((paginaAtual - 1) * itensPorPagina) + 1} a {Math.min(paginaAtual * itensPorPagina, totalPacientes)} de {totalPacientes.toLocaleString('pt-BR')} pacientes
                      {excedeuLimite && ` (limitado de ${totalBruto.toLocaleString('pt-BR')})`}
                    </>
                  ) : (
                    "Nenhum paciente encontrado"
                  )}
                </CardDescription>
              </div>
              {totalPacientes > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Itens por página:</span>
                  <Select value={String(itensPorPagina)} onValueChange={(v) => { setItensPorPagina(Number(v)); setPaginaAtual(1); }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Buscando pacientes...</span>
              </div>
            ) : pacientesOrdenados.length > 0 ? (
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
                        <SortableHeader field="primeiroAtendimento">1º Atend.</SortableHeader>
                        <SortableHeader field="statusCaso">Status</SortableHeader>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pacientesOrdenados.map((paciente) => {
                        const metricas = getMetricas(paciente.id);
                        const dias = metricas?.diasSemAtendimento;
                        const isInativo = dias !== null && dias !== undefined && dias > 360;
                        
                        return (
                          <TableRow 
                            key={paciente.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setLocation(`/prontuario/${paciente.id}`)}
                          >
                          <TableCell>{paciente.idPaciente}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate text-blue-600 hover:text-blue-800 hover:underline">{paciente.nome}</TableCell>
                          <TableCell>{paciente.idade || "-"}</TableCell>
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
                            <span className={`font-medium ${(metricas?.totalAtendimentos || 0) > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                              {metricas?.totalAtendimentos ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-medium ${(metricas?.atendimentos12m || 0) > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                              {metricas?.atendimentos12m ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-medium ${isInativo ? 'text-red-600' : dias !== null && dias !== undefined && dias > 180 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                              {formatarDiasSemAtendimento(dias)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {metricas?.primeiroAtendimento 
                              ? new Date(metricas.primeiroAtendimento).toLocaleDateString('pt-BR')
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <span className={`badge-${paciente.statusCaso === "Ativo" ? "success" : "warning"} px-2 py-1 rounded text-xs`}>
                              {paciente.statusCaso || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/prontuario/${paciente.id}`)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Ver Prontuário"
                              >
                                <ClipboardList className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditar(paciente)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluir(paciente)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    {/* Botão Primeira Página */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(1)}
                      disabled={paginaAtual === 1 || isFetching}
                      title="Ir para primeira página"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Botão Anterior */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    {/* Campo para ir direto para página */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Página</span>
                      <Input
                        type="number"
                        min={1}
                        max={totalPaginas}
                        value={paginaAtual}
                        onChange={(e) => {
                          const valor = parseInt(e.target.value);
                          if (!isNaN(valor) && valor >= 1 && valor <= totalPaginas) {
                            setPaginaAtual(valor);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const valor = parseInt((e.target as HTMLInputElement).value);
                            if (!isNaN(valor) && valor >= 1 && valor <= totalPaginas) {
                              setPaginaAtual(valor);
                            }
                          }
                        }}
                        className="w-16 h-8 text-center text-sm"
                        disabled={isFetching}
                      />
                      <span className="text-sm text-muted-foreground">de {totalPaginas}</span>
                    </div>
                    
                    {/* Botão Próxima */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas || isFetching}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Botão Última Página */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      disabled={paginaAtual === totalPaginas || isFetching}
                      title="Ir para última página"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
                <p className="text-muted-foreground mt-1">
                  Tente ajustar os termos de busca ou filtros aplicados.
                </p>
                <Button variant="outline" onClick={limparFiltros} className="mt-4">
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      {pacienteSelecionado && (
        <EditarPacienteModal
          paciente={pacienteSelecionado}
          open={modalEditarAberto}
          onOpenChange={(open) => {
            setModalEditarAberto(open);
            if (!open) {
              utils.pacientes.listPaginated.invalidate();
              setPacienteSelecionado(null);
            }
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>{pacienteParaExcluir?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
