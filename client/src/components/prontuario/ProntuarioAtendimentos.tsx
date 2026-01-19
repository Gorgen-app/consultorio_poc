import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Copy, Calendar, DollarSign, Building2, FileText } from "lucide-react";
import { useLocation } from "wouter";

interface ProntuarioAtendimentosProps {
  pacienteId: number;
}

export default function ProntuarioAtendimentos({ pacienteId }: ProntuarioAtendimentosProps) {
  const [, navigate] = useLocation();
  
  const { data: atendimentos, isLoading } = trpc.atendimentos.list.useQuery({
    pacienteId,
    limit: 100,
  });

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

  const formatarMoeda = (valor: any): string => {
    if (!valor && valor !== 0) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor));
  };

  const handleNovoAtendimento = () => {
    navigate(`/atendimentos/novo?pacienteId=${pacienteId}`);
  };

  const handleDuplicar = (atd: any) => {
    const params = new URLSearchParams({
      duplicar: "true",
      pacienteId: atd.pacienteId?.toString() || "",
      pacienteNome: atd.pacienteNome || "",
      tipoAtendimento: atd.tipoAtendimento || "",
      local: atd.local || "",
      convenio: atd.convenio || "",
      carteirinha: atd.carteirinha || "",
      guia: atd.guia || "",
      faturamentoPrevisto: atd.faturamentoPrevistoFinal?.toString() || "",
      desconto: atd.desconto?.toString() || "0",
      observacoes: atd.observacoes || "",
    });
    navigate(`/atendimentos/novo?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalFaturamento = atendimentos?.reduce((acc, atd) => acc + (Number(atd.faturamentoPrevistoFinal) || 0), 0) || 0;
  const totalRecebido = atendimentos?.reduce((acc, atd) => acc + (atd.dataPagamento ? (Number(atd.faturamentoPrevistoFinal) || 0) : 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Histórico de Atendimentos</h2>
          <p className="text-muted-foreground">
            {atendimentos?.length || 0} atendimentos registrados
          </p>
        </div>
        <Button onClick={handleNovoAtendimento}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{atendimentos?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0056A4]">{formatarMoeda(totalFaturamento)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatarMoeda(totalRecebido)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de atendimentos */}
      {atendimentos && atendimentos.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.map((atd) => (
                  <TableRow key={atd.id}>
                    <TableCell className="font-medium">
                      {formatarData(atd.dataAtendimento)}
                    </TableCell>
                    <TableCell>{atd.tipoAtendimento || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        {atd.local || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{atd.convenio || "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatarMoeda(atd.faturamentoPrevistoFinal)}
                    </TableCell>
                    <TableCell>
                      {atd.dataPagamento ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Pago</Badge>
                      ) : atd.dataFaturamento ? (
                        <Badge className="badge-warning">Faturado</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
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
                          onClick={() => navigate(`/atendimentos?buscar=${atd.atendimento}`)}
                          title="Ver detalhes"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Nenhum atendimento registrado para este paciente.</p>
            <Button onClick={handleNovoAtendimento}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeiro Atendimento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
