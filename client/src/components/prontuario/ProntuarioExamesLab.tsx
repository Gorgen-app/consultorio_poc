import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, TestTube, FileText, Download, Upload, Loader2, ExternalLink, TrendingUp, TrendingDown, Minus, Activity, LineChart as LineChartIcon, X } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  pacienteId: number;
  exames: any[];
  onUpdate: () => void;
}

export default function ProntuarioExamesLab({ pacienteId, exames, onUpdate }: Props) {
  const [novoExame, setNovoExame] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [exameIdParaUpload, setExameIdParaUpload] = useState<number | null>(null);
  const [extraindoDocId, setExtraindoDocId] = useState<number | null>(null);
  const [graficoAberto, setGraficoAberto] = useState(false);
  const [exameSelecionado, setExameSelecionado] = useState<string | null>(null);
  const [form, setForm] = useState({
    dataColeta: new Date().toISOString().split("T")[0],
    laboratorio: "",
    tipoExame: "",
    resultados: "",
    observacoes: "",
  });

  // Query para fluxograma laboratorial
  const { data: fluxograma, isLoading: loadingFluxograma, refetch: refetchFluxograma } = trpc.resultadosLaboratoriais.fluxograma.useQuery(
    { pacienteId },
    { enabled: !!pacienteId }
  );

  // Query para histórico de um exame específico (para gráfico)
  const { data: historicoExame } = trpc.resultadosLaboratoriais.listPorExame.useQuery(
    { pacienteId, nomeExame: exameSelecionado || "" },
    { enabled: !!exameSelecionado }
  );

  // Query para documentos de exames laboratoriais
  const { data: documentos, refetch: refetchDocumentos } = trpc.documentosExternos.list.useQuery(
    { pacienteId, categoria: "Exame Laboratorial" },
    { enabled: !!pacienteId }
  );

  // Mutation para criar exame manual
  const createExame = trpc.prontuario.examesLab.create.useMutation({
    onSuccess: () => {
      toast.success("Exame registrado!");
      setNovoExame(false);
      onUpdate();
    },
  });

  // Mutation para extrair dados de PDF
  const extrairDados = trpc.resultadosLaboratoriais.extrairDePdf.useMutation({
    onSuccess: (result) => {
      if (result.sucesso) {
        toast.success(`${result.examesInseridos} exames extraídos com sucesso!`);
        refetchFluxograma();
        refetchDocumentos();
      } else {
        toast.warning(result.mensagem || "Documento não é um exame laboratorial");
      }
      setExtraindoDocId(null);
    },
    onError: (error) => {
      toast.error(`Erro na extração: ${error.message}`);
      setExtraindoDocId(null);
    },
  });

  const handleExtrairDados = (docId: number, pdfUrl: string) => {
    setExtraindoDocId(docId);
    extrairDados.mutate({
      pacienteId,
      documentoExternoId: docId,
      pdfUrl,
    });
  };

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
        return <TrendingDown className="h-3 w-3 text-[#0056A4]" />;
      default:
        return <Minus className="h-3 w-3 text-emerald-500" />;
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

  const handleExameClick = (nomeExame: string) => {
    setExameSelecionado(nomeExame);
    setGraficoAberto(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Exames Laboratoriais</h2>
          <p className="text-sm text-gray-500">Resultados de exames de sangue, urina, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setExameIdParaUpload(null); setModalUploadAberto(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload de PDF
          </Button>
          <Dialog open={novoExame} onOpenChange={setNovoExame}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Exame Manual</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Registrar Exame Laboratorial</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data da Coleta *</Label><Input type="date" value={form.dataColeta} onChange={(e) => setForm({...form, dataColeta: e.target.value})} /></div>
                  <div><Label>Laboratório</Label><Input value={form.laboratorio} onChange={(e) => setForm({...form, laboratorio: e.target.value})} /></div>
                </div>
                <div><Label>Tipo de Exame *</Label><Input value={form.tipoExame} onChange={(e) => setForm({...form, tipoExame: e.target.value})} placeholder="Ex: Hemograma completo, Glicemia, Perfil lipídico" /></div>
                <div><Label>Resultados</Label><Textarea rows={6} value={form.resultados} onChange={(e) => setForm({...form, resultados: e.target.value})} placeholder="Cole ou digite os resultados..." /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovoExame(false)}>Cancelar</Button>
                <Button onClick={() => createExame.mutate({ pacienteId, dataColeta: form.dataColeta, laboratorio: form.laboratorio || null, tipoExame: form.tipoExame, resultado: form.resultados || null, exame: form.tipoExame, observacoes: form.observacoes || null })} disabled={!form.tipoExame}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CARD 1: Fluxograma Laboratorial (Tabela de Resultados Extraídos) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Fluxograma Laboratorial
            </CardTitle>
            {fluxograma && fluxograma.exames.length > 0 && (
              <Badge variant="outline">
                {fluxograma.exames.length} exames • {fluxograma.datas.length} datas
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Clique em uma linha para ver o gráfico evolutivo do exame
          </p>
        </CardHeader>
        <CardContent>
          {loadingFluxograma ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Carregando fluxograma...
            </div>
          ) : !fluxograma || fluxograma.exames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum resultado laboratorial estruturado encontrado.</p>
              <p className="text-sm mt-2">
                Faça upload de um PDF de exames e clique em "Extrair Dados" para popular o fluxograma.
              </p>
            </div>
          ) : (
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
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleExameClick(exame)}
                    >
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="flex items-center gap-2">
                          <LineChartIcon className="h-4 w-4 text-muted-foreground" />
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
                                  resultado.tipo === "Diminuído" && "text-[#0056A4]"
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
              {fluxograma.datas.length > 8 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mostrando as 8 datas mais recentes de {fluxograma.datas.length} disponíveis
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 2: Lista de PDFs com botão Extrair Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos de Exames Laboratoriais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            PDFs de laudos de exames. Clique em "Extrair Dados" para processar automaticamente.
          </p>
        </CardHeader>
        <CardContent>
          {!documentos || documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum documento anexado.</p>
              <Button className="mt-4" variant="outline" onClick={() => setModalUploadAberto(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload de PDF
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome do Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          {doc.nomeOriginal || doc.nome || "Documento"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.dadosExtraidos ? (
                          <Badge variant="default" className="bg-emerald-500">Extraído</Badge>
                        ) : doc.textoOcr && !doc.textoOcr.includes("[OCR em processamento") ? (
                          <Badge variant="outline">Pronto para extração</Badge>
                        ) : (
                          <Badge variant="secondary">Processando OCR...</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, "_blank")}
                            title="Abrir PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtrairDados(doc.id, doc.url)}
                            disabled={extraindoDocId === doc.id || !doc.textoOcr || doc.textoOcr.includes("[OCR em processamento")}
                          >
                            {extraindoDocId === doc.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Extraindo...
                              </>
                            ) : (
                              <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Extrair Dados
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 3: Exames Manuais (legado) */}
      {exames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Exames Registrados Manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exames.map((ex) => (
              <div key={ex.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{ex.tipoExame}</span>
                  <span className="text-sm text-gray-500">{new Date(ex.dataColeta).toLocaleDateString("pt-BR")}</span>
                </div>
                {ex.laboratorio && <p className="text-sm text-gray-500 mb-2">Laboratório: {ex.laboratorio}</p>}
                {ex.resultados && <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">{ex.resultados}</pre>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal de Upload */}
      <DocumentoUpload
        pacienteId={pacienteId}
        categoria="Exame Laboratorial"
        registroId={exameIdParaUpload || undefined}
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setExameIdParaUpload(null);
        }}
        onSuccess={() => {
          onUpdate();
          refetchDocumentos();
        }}
      />

      {/* Modal de Gráfico Evolutivo */}
      <Dialog open={graficoAberto} onOpenChange={setGraficoAberto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Evolução: {exameSelecionado}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {historicoExame && historicoExame.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {historicoExame.length} resultados • Unidade: {historicoExame[0]?.unidade || "N/A"}
                  </p>
                  {refMin !== null && refMax !== null && (
                    <Badge variant="outline">
                      Referência: {refMin} - {refMax}
                    </Badge>
                  )}
                </div>

                {chartData.some((d) => d.valor !== null) ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: any) => [value, "Valor"]}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        {refMin !== null && (
                          <ReferenceLine
                            y={refMin}
                            stroke="#6B8CBE"
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
                          stroke="#4A6A9A"
                          strokeWidth={2}
                          dot={{ r: 5, fill: "#4A6A9A" }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Não há valores numéricos para exibir no gráfico
                  </p>
                )}

                {/* Tabela de valores */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoExame.slice(0, 10).map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(String(r.dataColeta))}</TableCell>
                          <TableCell className="font-medium">{r.resultado || r.resultadoNumerico || "-"}</TableCell>
                          <TableCell>{r.unidade || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.valorReferenciaMin && r.valorReferenciaMax 
                              ? `${r.valorReferenciaMin} - ${r.valorReferenciaMax}`
                              : r.valorReferenciaTexto || "-"}
                          </TableCell>
                          <TableCell>
                            {r.foraReferencia ? (
                              <Badge variant="destructive" className="text-xs">
                                {r.tipoAlteracao === "Aumentado" ? "↑ Alto" : "↓ Baixo"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Carregando histórico...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGraficoAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
