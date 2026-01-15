import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Users, 
  Building2,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { CONVENIOS } from "@shared/glossary";

// Função para exportar para CSV/Excel
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const headers = [
    "ID Paciente",
    "Nome",
    "CPF",
    "Data Nascimento",
    "Sexo",
    "Convênio",
    "Telefone",
    "Email",
    "Cidade",
    "UF",
    "Status"
  ];

  const csvContent = [
    headers.join(";"),
    ...data.map(p => [
      p.idPaciente || "",
      p.nome || "",
      p.cpf || "",
      p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString("pt-BR") : "",
      p.sexo || "",
      p.convenio || "",
      p.telefone || "",
      p.email || "",
      p.cidade || "",
      p.uf || "",
      p.deletedAt ? "Inativo" : "Ativo"
    ].join(";"))
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  toast.success("Arquivo CSV exportado com sucesso!");
};

// Função para exportar para PDF (usando print)
const exportToPDF = (title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Popup bloqueado. Permita popups para exportar PDF.");
    return;
  }

  const tableElement = document.getElementById("relatorio-table");
  if (!tableElement) {
    toast.error("Tabela não encontrada");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1a365d; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #1a365d; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      ${tableElement.outerHTML}
      <p class="footer">Gorgen - Sistema de Gestão Médica</p>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);

  toast.success("PDF gerado com sucesso!");
};

export default function RelatorioPacientes() {
  const [filtroConvenio, setFiltroConvenio] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("ativos");
  const [filtroPeriodoInicio, setFiltroPeriodoInicio] = useState<string>("");
  const [filtroPeriodoFim, setFiltroPeriodoFim] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Buscar todos os pacientes
  const { data: pacientes, isLoading, refetch } = trpc.pacientes.list.useQuery({
    limit: 50000,
    offset: 0,
  });

  // Filtrar pacientes
  const pacientesFiltrados = useMemo(() => {
    if (!pacientes || !Array.isArray(pacientes)) return [];

    return pacientes.filter((p: any) => {
      // Filtro por convênio
      if (filtroConvenio !== "todos" && p.convenio !== filtroConvenio) {
        return false;
      }

      // Filtro por status
      if (filtroStatus === "ativos" && p.deletedAt) {
        return false;
      }
      if (filtroStatus === "inativos" && !p.deletedAt) {
        return false;
      }

      // Filtro por período de cadastro
      if (filtroPeriodoInicio && p.createdAt) {
        const dataInicio = new Date(filtroPeriodoInicio);
        const dataCadastro = new Date(p.createdAt);
        if (dataCadastro < dataInicio) return false;
      }

      if (filtroPeriodoFim && p.createdAt) {
        const dataFim = new Date(filtroPeriodoFim);
        dataFim.setHours(23, 59, 59, 999);
        const dataCadastro = new Date(p.createdAt);
        if (dataCadastro > dataFim) return false;
      }

      return true;
    });
  }, [pacientes, filtroConvenio, filtroStatus, filtroPeriodoInicio, filtroPeriodoFim]);

  // Estatísticas por convênio
  const estatisticasPorConvenio = useMemo(() => {
    if (!pacientesFiltrados) return [];

    const contagem: Record<string, number> = {};
    pacientesFiltrados.forEach((p: any) => {
      const conv = p.convenio || "Não informado";
      contagem[conv] = (contagem[conv] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([convenio, total]) => ({ convenio, total }))
      .sort((a, b) => b.total - a.total);
  }, [pacientesFiltrados]);

  // Paginação
  const totalPages = Math.ceil(pacientesFiltrados.length / pageSize);
  const pacientesPaginados = pacientesFiltrados.slice((page - 1) * pageSize, page * pageSize);

  const limparFiltros = () => {
    setFiltroConvenio("todos");
    setFiltroStatus("ativos");
    setFiltroPeriodoInicio("");
    setFiltroPeriodoFim("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatório de Pacientes</h1>
          <p className="text-muted-foreground">Análise e exportação de dados por convênio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(pacientesFiltrados, "relatorio_pacientes")}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button 
            onClick={() => exportToPDF("Relatório de Pacientes por Convênio")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select value={filtroConvenio} onValueChange={(v) => { setFiltroConvenio(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os convênios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os convênios</SelectItem>
                  {CONVENIOS.map(conv => (
                    <SelectItem key={conv} value={conv}>{conv}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cadastro de</Label>
              <Input 
                type="date" 
                value={filtroPeriodoInicio}
                onChange={(e) => { setFiltroPeriodoInicio(e.target.value); setPage(1); }}
              />
            </div>

            <div className="space-y-2">
              <Label>Cadastro até</Label>
              <Input 
                type="date" 
                value={filtroPeriodoFim}
                onChange={(e) => { setFiltroPeriodoFim(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Convênio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Distribuição por Convênio
          </CardTitle>
          <CardDescription>
            {pacientesFiltrados.length.toLocaleString("pt-BR")} pacientes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {estatisticasPorConvenio.slice(0, 12).map(({ convenio, total }) => (
              <div 
                key={convenio} 
                className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => { setFiltroConvenio(convenio); setPage(1); }}
              >
                <p className="text-sm font-medium truncate" title={convenio}>{convenio}</p>
                <p className="text-2xl font-bold">{total.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">
                  {((total / pacientesFiltrados.length) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
          {estatisticasPorConvenio.length > 12 && (
            <p className="text-sm text-muted-foreground mt-3">
              +{estatisticasPorConvenio.length - 12} outros convênios
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Pacientes
          </CardTitle>
          <CardDescription>
            Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, pacientesFiltrados.length)} de {pacientesFiltrados.length.toLocaleString("pt-BR")} pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Carregando...
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table id="relatorio-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Convênio</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesPaginados.map((paciente: any) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-mono text-xs">{paciente.idPaciente}</TableCell>
                        <TableCell className="font-medium">{paciente.nome}</TableCell>
                        <TableCell className="font-mono text-xs">{paciente.cpf || "-"}</TableCell>
                        <TableCell>
                          {paciente.dataNascimento 
                            ? new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{paciente.convenio || "Não informado"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{paciente.telefone || "-"}</TableCell>
                        <TableCell className="text-xs">
                          {paciente.cidade ? `${paciente.cidade}/${paciente.uf}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={paciente.deletedAt ? "destructive" : "default"}>
                            {paciente.deletedAt ? "Inativo" : "Ativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
