import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, FileText, Copy } from "lucide-react";
import { Link, useSearch, useLocation } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIPOS_ATENDIMENTO, LOCAIS_ATENDIMENTO } from "@/lib/atendimentos-constants";
import { OPERADORAS } from "@/lib/operadoras";
import { EditarAtendimentoModal } from "@/components/EditarAtendimentoModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type SortField = "atendimento" | "dataAtendimento" | "tipoAtendimento" | "pacienteNome" | "local" | "convenio" | "faturamentoPrevistoFinal";
type SortDirection = "asc" | "desc" | null;

// Helper para formatar data com segurança
const formatarData = (data: any): string => {
  if (!data) return "-";
  try {
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return "-";
    return dataObj.toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
};

export default function Atendimentos() {
  const searchParams = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Atendimento selecionado para atalho Ctrl+D
  const [atendimentoFocado, setAtendimentoFocado] = useState<any>(null);
  
  // Foco automático no campo de busca quando vem do menu "Buscar Atendimento"
  useEffect(() => {
    if (searchParams.includes("buscar=true") && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams]);

  // Atalho Ctrl+D para duplicar atendimento selecionado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (atendimentoFocado) {
          handleDuplicar(atendimentoFocado);
          toast.info("Duplicando atendimento...");
        } else {
          toast.info("Selecione um atendimento na tabela para duplicar (Ctrl+D)");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [atendimentoFocado]);
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filtros individuais por coluna
  const [filtroIdade, setFiltroIdade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroConvenio, setFiltroConvenio] = useState("");
  const [filtroPago, setFiltroPago] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Modal de edição
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Dialog de exclusão
  const [atendimentoParaExcluir, setAtendimentoParaExcluir] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  const utils = trpc.useUtils();

  const { data: atendimentos, isLoading } = trpc.atendimentos.list.useQuery({
    limit: 50000,
  });

  const deleteMutation = trpc.atendimentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Atendimento excluído com sucesso!");
      utils.atendimentos.list.invalidate();
      setDialogExcluirAberto(false);
      setAtendimentoParaExcluir(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir atendimento: ${error.message}`);
    },
  });

  const [, navigate] = useLocation();

  const handleEditar = (atendimento: any) => {
    setAtendimentoSelecionado(atendimento);
    setModalEditarAberto(true);
  };

  const handleDuplicar = (atendimento: any) => {
    // Codifica os dados do atendimento para passar via URL
    const params = new URLSearchParams({
      duplicar: "true",
      pacienteId: atendimento.pacienteId?.toString() || "",
      pacienteNome: atendimento.pacienteNome || "",
      tipoAtendimento: atendimento.tipoAtendimento || "",
      local: atendimento.local || "",
      convenio: atendimento.convenio || "",
      carteirinha: atendimento.carteirinha || "",
      guia: atendimento.guia || "",
      faturamentoPrevisto: atendimento.faturamentoPrevisto?.toString() || "",
      desconto: atendimento.desconto?.toString() || "0",
      observacoes: atendimento.observacoes || "",
    });
    navigate(`/atendimentos/novo?${params.toString()}`);
  };

  const handleExcluir = (atendimento: any) => {
    setAtendimentoParaExcluir(atendimento);
    setDialogExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (atendimentoParaExcluir) {
      deleteMutation.mutate({ id: atendimentoParaExcluir.id });
    }
  };

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

  // Componente de cabeçalho ordenável
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <TableHead
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-30" />
          )}
        </div>
      </TableHead>
    );
  };

  // Aplicar filtros e busca
  const atendimentosFiltrados = useMemo(() => {
    if (!atendimentos) return [];

    let resultado = [...atendimentos];

    // Busca global (ID, Paciente, Procedimento)
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (atd) =>
          atd.atendimento?.toLowerCase().includes(termo) ||
          atd.pacientes?.nome?.toLowerCase().includes(termo) ||
          atd.procedimento?.toLowerCase().includes(termo)
      );
    }

    // Filtros por coluna
    if (filtroIdade) {
      resultado = resultado.filter((atd) => {
        return atd.pacientes?.idade?.toString() === filtroIdade;
      });
    }

    if (filtroTipo && filtroTipo !== "todos") {
      resultado = resultado.filter((atd) => atd.tipoAtendimento === filtroTipo);
    }

    if (filtroLocal && filtroLocal !== "todos") {
      resultado = resultado.filter((atd) => atd.local === filtroLocal);
    }

    if (filtroConvenio && filtroConvenio !== "todos") {
      resultado = resultado.filter((atd) => atd.convenio === filtroConvenio);
    }

    if (filtroPago && filtroPago !== "todos") {
      const pago = filtroPago === "sim";
      resultado = resultado.filter((atd) => atd.pagamentoEfetivado === pago);
    }

    // Filtro por data
    if (filtroDataDe) {
      resultado = resultado.filter((atd) => {
        const dataAtd = new Date(atd.dataAtendimento);
        return dataAtd >= new Date(filtroDataDe);
      });
    }

    if (filtroDataAte) {
      resultado = resultado.filter((atd) => {
        const dataAtd = new Date(atd.dataAtendimento);
        return dataAtd <= new Date(filtroDataAte);
      });
    }

    // Ordenação
    if (sortField && sortDirection) {
      resultado.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        // Tratamento especial para nome do paciente
        if (sortField === "pacienteNome") {
          aVal = a.pacientes?.nome;
          bVal = b.pacientes?.nome;
        } else {
          aVal = a[sortField];
          bVal = b[sortField];
        }

        // Tratamento especial para datas
        if (sortField === "dataAtendimento") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        // Tratamento especial para valores numéricos
        if (sortField === "faturamentoPrevistoFinal") {
          aVal = parseFloat(aVal || "0");
          bVal = parseFloat(bVal || "0");
        }

        // Comparação
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return resultado;
  }, [atendimentos, searchTerm, filtroIdade, filtroTipo, filtroLocal, filtroConvenio, filtroPago, filtroDataDe, filtroDataAte, sortField, sortDirection]);

  // Paginação
  const totalPaginas = Math.ceil(atendimentosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const atendimentosPaginados = atendimentosFiltrados.slice(indiceInicio, indiceFim);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroTipo || filtroLocal || filtroConvenio || filtroPago || filtroDataDe || filtroDataAte || filtroIdade;

  const limparFiltros = () => {
    setFiltroIdade("");
    setFiltroTipo("");
    setFiltroLocal("");
    setFiltroConvenio("");
    setFiltroPago("");
    setFiltroDataDe("");
    setFiltroDataAte("");
    setPaginaAtual(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="text-muted-foreground mt-2">
            Gerenciar atendimentos realizados
            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">Ctrl+D para duplicar selecionado</span>
          </p>
        </div>
        <Link href="/atendimentos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Atendimento
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
                placeholder="Buscar por ID, Paciente ou Procedimento..."
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

          {/* Filtros por Coluna */}
          {showFilters && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {/* Primeira linha: Idade, Tipo, Local, Convênio, Pago */}
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
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {TIPOS_ATENDIMENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Local</label>
                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {LOCAIS_ATENDIMENTO.map((local) => (
                        <SelectItem key={local} value={local}>{local}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Convênio</label>
                  <Select value={filtroConvenio} onValueChange={setFiltroConvenio}>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pago</label>
                  <Select value={filtroPago} onValueChange={setFiltroPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda linha: Data De, Data Até */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Atendimento (De)</label>
                  <Input
                    type="date"
                    value={filtroDataDe}
                    onChange={(e) => setFiltroDataDe(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Atendimento (Até)</label>
                  <Input
                    type="date"
                    value={filtroDataAte}
                    onChange={(e) => setFiltroDataAte(e.target.value)}
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
              <CardTitle>Lista de Atendimentos</CardTitle>
              <CardDescription>
                Mostrando {indiceInicio + 1} a {Math.min(indiceFim, atendimentosFiltrados.length)} de {atendimentosFiltrados.length} atendimentos
                {temFiltrosAtivos && ` (${atendimentos?.length || 0} no total)`}
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
          ) : atendimentosPaginados && atendimentosPaginados.length > 0 ? (
            <>
              <div className="rounded-md border border-widget overflow-x-auto bg-sidebar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="atendimento">ID</SortableHeader>
                      <SortableHeader field="dataAtendimento">Data</SortableHeader>
                      <SortableHeader field="tipoAtendimento">Tipo</SortableHeader>
                      <SortableHeader field="pacienteNome">Paciente</SortableHeader>
                      <TableHead>Idade</TableHead>
                      <SortableHeader field="local">Local</SortableHeader>
                      <SortableHeader field="convenio">Convênio</SortableHeader>
                      <SortableHeader field="faturamentoPrevistoFinal">Valor</SortableHeader>
                      <TableHead>Pago</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendimentosPaginados.map((atd) => (
                      <TableRow 
                        key={atd.id}
                        onClick={() => setAtendimentoFocado(atd)}
                        className={`cursor-pointer hover:bg-gray-50 ${atendimentoFocado?.id === atd.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
                      >
                        <TableCell className="font-medium">{atd.atendimento}</TableCell>
                        <TableCell>{formatarData(atd.dataAtendimento)}</TableCell>
                        <TableCell>{atd.tipoAtendimento || "-"}</TableCell>
                        <TableCell>
                          {atd.pacientes?.id ? (
                            <Link href={`/prontuario/${atd.pacientes.id}`} className="text-primary hover:underline font-medium">
                              {atd.pacientes.nome || "-"}
                            </Link>
                          ) : (
                            atd.pacientes?.nome || "-"
                          )}
                        </TableCell>
                        <TableCell>{atd.pacientes?.idade ?? "-"}</TableCell>
                        <TableCell>{atd.local || "-"}</TableCell>
                        <TableCell>{atd.convenio || "-"}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            parseFloat(atd.faturamentoPrevistoFinal || "0")
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${atd.pagamentoEfetivado ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {atd.pagamentoEfetivado ? "Sim" : "Não"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {atd.pacientes?.id && (
                              <Link href={`/prontuario/${atd.pacientes.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ver prontuário do paciente"
                                  className="text-[#0056A4] hover:text-[#0056A4] hover:bg-blue-50"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicar(atd)}
                              title="Duplicar atendimento"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(atd)}
                              title="Editar atendimento"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluir(atd)}
                              title="Excluir atendimento"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {paginaAtual} de {totalPaginas}
                  </div>
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
              Nenhum atendimento encontrado com os filtros aplicados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditarAtendimentoModal
        atendimento={atendimentoSelecionado}
        open={modalEditarAberto}
        onOpenChange={setModalEditarAberto}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendimento <strong>{atendimentoParaExcluir?.atendimento}</strong>?
              <br /><br />
              Paciente: {atendimentoParaExcluir?.pacientes?.nome || atendimentoParaExcluir?.nomePaciente}
              <br />
              Data: {formatarData(atendimentoParaExcluir?.dataAtendimento)}
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
