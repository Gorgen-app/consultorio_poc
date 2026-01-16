import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OPERADORAS } from "@/lib/operadoras";

export default function Relatorios() {
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroOperadora, setFiltroOperadora] = useState("");
  const [filtroDiasMinimo, setFiltroDiasMinimo] = useState("");
  const [filtroAtendimentosMinimo, setFiltroAtendimentosMinimo] = useState("");
  
  // Estado de exportação
  const [exportando, setExportando] = useState(false);

  // Buscar todos os pacientes
  const { data: pacientes, isLoading: loadingPacientes } = trpc.pacientes.list.useQuery({});
  
  // Buscar métricas de todos os pacientes
  const pacienteIds = pacientes?.map(p => p.id) || [];
  const { data: metricas, isLoading: loadingMetricas } = trpc.pacientes.getMetricasAtendimento.useQuery(
    { pacienteIds },
    { enabled: pacienteIds.length > 0 }
  );

  // Aplicar filtros
  const pacientesFiltrados = (pacientes || []).filter(p => {
    // Filtro por status
    if (filtroStatus && p.statusCaso !== filtroStatus) return false;
    
    // Filtro por operadora
    if (filtroOperadora && p.operadora1 !== filtroOperadora && p.operadora2 !== filtroOperadora) return false;
    
    // Filtro por dias sem atendimento
    if (filtroDiasMinimo && metricas) {
      const dias = metricas[p.id]?.diasSemAtendimento;
      if (dias === null || dias === undefined || dias < parseInt(filtroDiasMinimo)) return false;
    }
    
    // Filtro por total de atendimentos
    if (filtroAtendimentosMinimo && metricas) {
      const total = metricas[p.id]?.totalAtendimentos ?? 0;
      if (total < parseInt(filtroAtendimentosMinimo)) return false;
    }
    
    return true;
  });

  // Função para exportar CSV
  const exportarCSV = () => {
    if (!pacientesFiltrados.length) {
      toast.error("Nenhum paciente para exportar");
      return;
    }

    setExportando(true);

    try {
      // Cabeçalhos
      const headers = [
        "ID",
        "Nome",
        "CPF",
        "Telefone",
        "Email",
        "Cidade",
        "UF",
        "Convênio 1",
        "Convênio 2",
        "Diagnóstico",
        "Status",
        "Total Atendimentos",
        "Atendimentos 12m",
        "Dias sem Atendimento",
        "Primeiro Atendimento",
        "Último Atendimento"
      ];

      // Dados
      const rows = pacientesFiltrados.map(p => {
        const m = metricas?.[p.id];
        return [
          p.idPaciente || "",
          p.nome || "",
          p.cpf || "",
          p.telefone || "",
          p.email || "",
          p.cidade || "",
          p.uf || "",
          p.operadora1 || "",
          p.operadora2 || "",
          p.diagnosticoEspecifico || p.grupoDiagnostico || "",
          p.statusCaso || "",
          m?.totalAtendimentos ?? 0,
          m?.atendimentos12m ?? 0,
          m?.diasSemAtendimento ?? "",
          m?.primeiroAtendimento ? new Date(m.primeiroAtendimento).toLocaleDateString('pt-BR') : "",
          m?.ultimoAtendimento ? new Date(m.ultimoAtendimento).toLocaleDateString('pt-BR') : ""
        ];
      });

      // Criar CSV
      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

      // BOM para Excel reconhecer UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_pacientes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportado ${pacientesFiltrados.length} pacientes para CSV`);
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    } finally {
      setExportando(false);
    }
  };

  // Função para exportar Excel (XLSX via CSV compatível)
  const exportarExcel = () => {
    // Por simplicidade, usamos o mesmo formato CSV que o Excel abre corretamente
    exportarCSV();
  };

  const isLoading = loadingPacientes || loadingMetricas;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Exporte dados de pacientes para análise externa</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
          <CardDescription>
            Configure os filtros para selecionar os pacientes que deseja exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Paciente</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Convênio</label>
              <Select value={filtroOperadora} onValueChange={setFiltroOperadora}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os convênios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os convênios</SelectItem>
                  {OPERADORAS.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dias sem atendimento (mínimo)</label>
              <Input
                type="number"
                placeholder="Ex: 180"
                value={filtroDiasMinimo}
                onChange={(e) => setFiltroDiasMinimo(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total de atendimentos (mínimo)</label>
              <Input
                type="number"
                placeholder="Ex: 5"
                value={filtroAtendimentosMinimo}
                onChange={(e) => setFiltroAtendimentosMinimo(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button 
              variant="outline" 
              tooltip="Limpar campos" onClick={() => {
                setFiltroStatus("");
                setFiltroOperadora("");
                setFiltroDiasMinimo("");
                setFiltroAtendimentosMinimo("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado e Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Relatório
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              "Carregando dados..."
            ) : (
              `${pacientesFiltrados.length} pacientes selecionados com os filtros atuais`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={exportarCSV}
              disabled={isLoading || exportando || pacientesFiltrados.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
             tooltip="Exportar dados">
              {exportando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar CSV
            </Button>

            <Button
              onClick={exportarExcel}
              disabled={isLoading || exportando || pacientesFiltrados.length === 0}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
             tooltip="Exportar dados">
              {exportando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar Excel (CSV)
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Campos incluídos no relatório:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
              <span>• ID do Paciente</span>
              <span>• Nome</span>
              <span>• CPF</span>
              <span>• Telefone</span>
              <span>• Email</span>
              <span>• Cidade</span>
              <span>• UF</span>
              <span>• Convênio 1</span>
              <span>• Convênio 2</span>
              <span>• Diagnóstico</span>
              <span>• Status</span>
              <span>• Total Atendimentos</span>
              <span>• Atendimentos 12m</span>
              <span>• Dias sem Atendimento</span>
              <span>• Primeiro Atendimento</span>
              <span>• Último Atendimento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Pré-definidos */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Rápidos</CardTitle>
          <CardDescription>
            Clique para aplicar filtros pré-configurados e exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              tooltip="Exportar dados" onClick={() => {
                setFiltroStatus("Ativo");
                setFiltroDiasMinimo("360");
                setFiltroOperadora("");
                setFiltroAtendimentosMinimo("");
              }}
            >
              <span className="font-medium">Pacientes Inativos</span>
              <span className="text-xs text-muted-foreground">Ativos com 360+ dias sem atendimento</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => {
                setFiltroStatus("Ativo");
                setFiltroDiasMinimo("");
                setFiltroOperadora("");
                setFiltroAtendimentosMinimo("5");
              }}
            >
              <span className="font-medium">Pacientes Frequentes</span>
              <span className="text-xs text-muted-foreground">Ativos com 5+ atendimentos</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => {
                setFiltroStatus("");
                setFiltroDiasMinimo("");
                setFiltroOperadora("");
                setFiltroAtendimentosMinimo("");
              }}
            >
              <span className="font-medium">Todos os Pacientes</span>
              <span className="text-xs text-muted-foreground">Exportar base completa</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
