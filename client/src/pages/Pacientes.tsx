import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OPERADORAS } from "@/lib/operadoras";
import { EditarPacienteModal } from "@/components/EditarPacienteModal";

type SortField = "idPaciente" | "nome" | "cpf" | "telefone" | "cidade" | "uf" | "operadora1" | "operadora2" | "diagnosticoEspecifico" | "statusCaso";
type SortDirection = "asc" | "desc" | null;

export default function Pacientes() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Modal de edição
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  const handleEditar = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setModalEditarAberto(true);
  };

  const { data: pacientes, isLoading } = trpc.pacientes.list.useQuery({
    limit: 10000,
  });

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
        const nome = p.nome?.toLowerCase() || "";
        const cpf = p.cpf?.toLowerCase().replace(/[^\d]/g, "") || "";
        const id = p.idPaciente?.toLowerCase() || "";
        const termoLimpo = termo.replace(/[^\d]/g, "");
        
        return (
          nome.includes(termo) ||
          cpf.includes(termoLimpo) ||
          id.includes(termo)
        );
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

    // Ordenação
    if (sortField && sortDirection) {
      resultado = [...resultado].sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        
        const comparison = String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true });
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return resultado;
  }, [pacientes, searchTerm, filtroCidade, filtroUF, filtroOperadora, filtroStatus, filtroDiagnostico, filtroDataDe, filtroDataAte, sortField, sortDirection]);

  // Paginação
  const totalPaginas = Math.ceil(pacientesFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const pacientesPaginados = pacientesFiltrados.slice(indiceInicio, indiceFim);

  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroCidade("");
    setFiltroUF("");
    setFiltroOperadora("");
    setFiltroStatus("");
    setFiltroDiagnostico("");
    setFiltroDataDe("");
    setFiltroDataAte("");
    setSortField(null);
    setSortDirection(null);
    setPaginaAtual(1);
  };

  const temFiltrosAtivos = searchTerm || filtroCidade || filtroUF || filtroOperadora || filtroStatus || filtroDiagnostico || filtroDataDe || filtroDataAte;

  // Resetar página ao mudar filtros
  useMemo(() => {
    setPaginaAtual(1);
  }, [searchTerm, filtroCidade, filtroUF, filtroOperadora, filtroStatus, filtroDiagnostico, filtroDataDe, filtroDataAte]);

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
                      <SortableHeader field="statusCaso">Status</SortableHeader>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesPaginados.map((paciente) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium">{paciente.idPaciente}</TableCell>
                        <TableCell>{paciente.nome}</TableCell>
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
    </div>
  );
}
