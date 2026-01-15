import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, FileSpreadsheet, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FluxogramaLaboratorialProps {
  pacienteId: number;
}

export function FluxogramaLaboratorial({ pacienteId }: FluxogramaLaboratorialProps) {
  const [selectedExame, setSelectedExame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tabela");

  const { data: fluxograma, isLoading, refetch } = trpc.resultadosLaboratoriais.fluxograma.useQuery(
    { pacienteId },
    { enabled: !!pacienteId }
  );

  const { data: historicoExame } = trpc.resultadosLaboratoriais.listPorExame.useQuery(
    { pacienteId, nomeExame: selectedExame || "" },
    { enabled: !!selectedExame }
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando fluxograma...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fluxograma || fluxograma.exames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Fluxograma Laboratorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum resultado laboratorial estruturado encontrado.
            <br />
            <span className="text-sm">
              Faça upload de um PDF de exames laboratoriais e clique em "Extrair Dados" para popular o fluxograma.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getTrendIcon = (tipo: string) => {
    switch (tipo) {
      case "Aumentado":
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case "Diminuído":
        return <TrendingDown className="h-3 w-3 text-blue-500" />;
      default:
        return <Minus className="h-3 w-3 text-green-500" />;
    }
  };

  const getChartData = () => {
    if (!historicoExame) return [];
    return historicoExame
      .map((r) => ({
        data: formatDate(String(r.dataColeta)),
        valor: r.resultadoNumerico ? parseFloat(r.resultadoNumerico) : null,
        min: r.valorReferenciaMin ? parseFloat(r.valorReferenciaMin) : null,
        max: r.valorReferenciaMax ? parseFloat(r.valorReferenciaMax) : null,
      }))
      .reverse();
  };

  const chartData = getChartData();
  const refMin = chartData.find((d) => d.min !== null)?.min;
  const refMax = chartData.find((d) => d.max !== null)?.max;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Fluxograma Laboratorial
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {fluxograma.exames.length} exames • {fluxograma.datas.length} datas
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="grafico" disabled={!selectedExame}>
              Gráfico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tabela" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background min-w-[180px]">Exame</TableHead>
                    {fluxograma.datas.slice(0, 8).map((data) => (
                      <TableHead key={data} className="text-center min-w-[100px]">
                        {formatDate(data)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fluxograma.exames.map((exame) => (
                    <TableRow
                      key={exame}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        selectedExame === exame && "bg-muted"
                      )}
                      onClick={() => {
                        setSelectedExame(exame);
                        setActiveTab("grafico");
                      }}
                    >
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          {exame}
                        </div>
                      </TableCell>
                      {fluxograma.datas.slice(0, 8).map((data) => {
                        const resultado = fluxograma.resultados[exame]?.[data];
                        if (!resultado) {
                          return (
                            <TableCell key={data} className="text-center text-muted-foreground">
                              -
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={data} className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={cn(
                                  resultado.foraRef && "font-semibold",
                                  resultado.tipo === "Aumentado" && "text-red-600",
                                  resultado.tipo === "Diminuído" && "text-blue-600"
                                )}
                              >
                                {resultado.valor}
                              </span>
                              {resultado.foraRef && getTrendIcon(resultado.tipo)}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {fluxograma.datas.length > 8 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Mostrando as 8 datas mais recentes de {fluxograma.datas.length} disponíveis
              </p>
            )}
          </TabsContent>

          <TabsContent value="grafico" className="mt-0">
            {selectedExame && historicoExame && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedExame}</h4>
                    <p className="text-sm text-muted-foreground">
                      {historicoExame.length} resultados • Unidade: {historicoExame[0]?.unidade || "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {refMin !== null && refMax !== null && (
                      <Badge variant="outline">
                        Ref: {refMin} - {refMax}
                      </Badge>
                    )}
                  </div>
                </div>

                {chartData.some((d) => d.valor !== null) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        {refMin !== null && (
                          <ReferenceLine
                            y={refMin}
                            stroke="#203864"
                            strokeDasharray="5 5"
                            label={{ value: "Mín", position: "left", fontSize: 10 }}
                          />
                        )}
                        {refMax !== null && (
                          <ReferenceLine
                            y={refMax}
                            stroke="#EF4444"
                            strokeDasharray="5 5"
                            label={{ value: "Máx", position: "left", fontSize: 10 }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="#3B5F96"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Não há valores numéricos para exibir no gráfico
                  </p>
                )}

                <Button variant="outline" size="sm" onClick={() => setActiveTab("tabela")}>
                  Voltar para tabela
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
