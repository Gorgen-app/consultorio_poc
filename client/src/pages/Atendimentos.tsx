import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIPOS_ATENDIMENTO, LOCAIS_ATENDIMENTO } from "@/lib/atendimentos-constants";
import { OPERADORAS } from "@/lib/operadoras";

type SortField = "atendimento" | "dataAtendimento" | "tipoAtendimento" | "nomePaciente" | "local" | "convenio" | "faturamentoPrevistoFinal";
type SortDirection = "asc" | "desc" | null;

export default function Atendimentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filtros individuais por coluna
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroConvenio, setFiltroConvenio] = useState("");
  const [filtroPago, setFiltroPago] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const { data: atendimentos, isLoading } = trpc.atendimentos.list.useQuery({
    limit: 10000,
  });

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
          atd.nomePaciente?.toLowerCase().includes(termo) ||
          atd.procedimento?.toLowerCase().includes(termo)
      );
    }

    // Filtros por coluna
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
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

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
  }, [atendimentos, searchTerm, filtroTipo, filtroLocal, filtroConvenio, filtroPago, filtroDataDe, filtroDataAte, sortField, sortDirection]);

  // Paginação
  const totalPaginas = Math.ceil(atendimentosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const atendimentosPaginados = atendimentosFiltrados.slice(indiceInicio, indiceFim);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroTipo || filtroLocal || filtroConvenio || filtroPago || filtroDataDe || filtroDataAte;

  const limparFiltros = () => {
    setFiltroTipo("");
    setFiltroLocal("");
    setFiltroConvenio("");
    setFiltroPago("");
    setFiltroDataDe("");
    setFiltroDataAte("");
    setPaginaAtual(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="text-muted-foreground mt-2">Gerenciar atendimentos realizados</p>
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

          {/* Filtros por Coluna (2 linhas) */}
          {showFilters && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {/* Primeira linha: Tipo, Local, Convênio, Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {TIPOS_ATENDIMENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
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
                        <SelectItem key={local} value={local}>
                          {local}
                        </SelectItem>
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
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pagamento</label>
                  <Select value={filtroPago} onValueChange={setFiltroPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="sim">Pago</SelectItem>
                      <SelectItem value="nao">Pendente</SelectItem>
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
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="atendimento">ID</SortableHeader>
                      <SortableHeader field="dataAtendimento">Data</SortableHeader>
                      <SortableHeader field="tipoAtendimento">Tipo</SortableHeader>
                      <SortableHeader field="nomePaciente">Paciente</SortableHeader>
                      <SortableHeader field="local">Local</SortableHeader>
                      <SortableHeader field="convenio">Convênio</SortableHeader>
                      <SortableHeader field="faturamentoPrevistoFinal">Valor</SortableHeader>
                      <TableHead>Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendimentosPaginados.map((atd) => (
                      <TableRow key={atd.id}>
                        <TableCell className="font-medium">{atd.atendimento}</TableCell>
                        <TableCell>{new Date(atd.dataAtendimento).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{atd.tipoAtendimento || "-"}</TableCell>
                        <TableCell>{atd.nomePaciente || "-"}</TableCell>
                        <TableCell>{atd.local || "-"}</TableCell>
                        <TableCell>{atd.convenio || "-"}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            parseFloat(atd.faturamentoPrevistoFinal || "0")
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`badge-${atd.pagamentoEfetivado ? "success" : "warning"} px-2 py-1 rounded text-xs`}>
                            {atd.pagamentoEfetivado ? "Sim" : "Não"}
                          </span>
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
    </div>
  );
}
