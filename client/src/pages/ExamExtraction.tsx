/**
 * Página de Extração de Exames - GORGEN
 * 
 * Interface para upload e extração automática de dados de exames laboratoriais de PDFs.
 * Integra com o módulo server/exam-extraction para processamento.
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Download,
  Trash2,
  Eye,
  FlaskConical,
  Calendar,
  User,
  Activity,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Tipos
interface ExameExtraido {
  id?: number;
  paciente: string;
  nome_exame: string;
  resultado: string;
  unidade: string;
  valor_referencia: string;
  data_coleta: string;
  laboratorio: string;
  alterado: boolean;
  arquivo_origem: string;
}

interface ArquivoUpload {
  id: string;
  nome: string;
  tamanho: number;
  status: 'pendente' | 'processando' | 'sucesso' | 'erro' | 'ignorado';
  progresso: number;
  mensagem?: string;
  examesExtraidos?: number;
}

interface ResultadoProcessamento {
  total_arquivos: number;
  arquivos_processados: number;
  arquivos_ignorados: number;
  total_exames: number;
  tempo_total_ms: number;
  exames: ExameExtraido[];
  ignorados: { arquivo: string; motivo: string }[];
  erros: { arquivo: string; erro: string }[];
}

export default function ExamExtraction() {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null);
  const [examesSelecionados, setExamesSelecionados] = useState<ExameExtraido[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [exameDetalhe, setExameDetalhe] = useState<ExameExtraido | null>(null);
  const [abaAtiva, setAbaAtiva] = useState("upload");

  // Mutation para processar PDFs
  const processarMutation = trpc.exames.processarPDFs.useMutation({
    onSuccess: (data: ResultadoProcessamento) => {
      setResultado(data);
      setAbaAtiva("resultados");
      toast.success(`${data.total_exames} exames extraídos de ${data.arquivos_processados} arquivos`);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao processar: ${error.message}`);
    },
    onSettled: () => {
      setProcessando(false);
    }
  });

  // Mutation para salvar exames no banco
  const salvarMutation = trpc.exames.salvarExtraidosNoBanco.useMutation({
    onSuccess: (data: { salvos: number; mensagem: string }) => {
      toast.success(`${data.salvos} exames salvos com sucesso!`);
      setExamesSelecionados([]);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  // Handler de upload de arquivos
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const novosArquivos: ArquivoUpload[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      nome: file.name,
      tamanho: file.size,
      status: 'pendente' as const,
      progresso: 0,
    }));

    setArquivos(prev => [...prev, ...novosArquivos]);
  }, []);

  // Handler de drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    const novosArquivos: ArquivoUpload[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map((file, index) => ({
        id: `${Date.now()}-${index}`,
        nome: file.name,
        tamanho: file.size,
        status: 'pendente' as const,
        progresso: 0,
      }));

    if (novosArquivos.length === 0) {
      toast.error("Por favor, selecione apenas arquivos PDF");
      return;
    }

    setArquivos(prev => [...prev, ...novosArquivos]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Remover arquivo da lista
  const removerArquivo = useCallback((id: string) => {
    setArquivos(prev => prev.filter(a => a.id !== id));
  }, []);

  // Limpar todos os arquivos
  const limparArquivos = useCallback(() => {
    setArquivos([]);
    setResultado(null);
  }, []);

  // Iniciar processamento
  const iniciarProcessamento = useCallback(async () => {
    if (arquivos.length === 0) {
      toast.error("Adicione pelo menos um arquivo PDF");
      return;
    }

    setProcessando(true);
    
    // Simular upload e processamento
    // Na implementação real, isso enviaria os arquivos para o servidor
    const nomesArquivos = arquivos.map(a => a.nome);
    
    processarMutation.mutate({ arquivos: nomesArquivos });
  }, [arquivos, processarMutation]);

  // Selecionar/deselecionar exame
  const toggleExameSelecionado = useCallback((exame: ExameExtraido) => {
    setExamesSelecionados(prev => {
      const existe = prev.some(e => 
        e.paciente === exame.paciente && 
        e.nome_exame === exame.nome_exame && 
        e.data_coleta === exame.data_coleta
      );
      
      if (existe) {
        return prev.filter(e => 
          !(e.paciente === exame.paciente && 
            e.nome_exame === exame.nome_exame && 
            e.data_coleta === exame.data_coleta)
        );
      } else {
        return [...prev, exame];
      }
    });
  }, []);

  // Selecionar todos os exames
  const selecionarTodos = useCallback(() => {
    if (resultado?.exames) {
      setExamesSelecionados(resultado.exames);
    }
  }, [resultado]);

  // Deselecionar todos
  const deselecionarTodos = useCallback(() => {
    setExamesSelecionados([]);
  }, []);

  // Salvar exames selecionados
  const salvarExamesSelecionados = useCallback(() => {
    if (examesSelecionados.length === 0) {
      toast.error("Selecione pelo menos um exame para salvar");
      return;
    }

    salvarMutation.mutate({ exames: examesSelecionados });
  }, [examesSelecionados, salvarMutation]);

  // Ver detalhes do exame
  const verDetalhes = useCallback((exame: ExameExtraido) => {
    setExameDetalhe(exame);
    setDialogAberto(true);
  }, []);

  // Formatar tamanho do arquivo
  const formatarTamanho = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Ícone de status
  const StatusIcon = ({ status }: { status: ArquivoUpload['status'] }) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'erro':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'ignorado':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'processando':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-gorgen-600" />
            Extração de Exames
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload de PDFs de exames laboratoriais para extração automática de dados
          </p>
        </div>
      </div>

      {/* Alerta informativo */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>Extração Inteligente</AlertTitle>
        <AlertDescription>
          O sistema identifica automaticamente o tipo de documento, extrai dados de exames laboratoriais
          e ignora receitas e outros documentos não relacionados. Suporta laudos evolutivos com múltiplas datas.
        </AlertDescription>
      </Alert>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="resultados" className="flex items-center gap-2" disabled={!resultado}>
            <FileSpreadsheet className="h-4 w-4" />
            Resultados
            {resultado && (
              <Badge variant="secondary" className="ml-1">
                {resultado.total_exames}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba de Upload */}
        <TabsContent value="upload" className="space-y-4">
          {/* Área de Drop */}
          <Card>
            <CardContent className="pt-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gorgen-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">
                  Arraste arquivos PDF aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Suporta múltiplos arquivos PDF de exames laboratoriais
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Arquivos */}
          {arquivos.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Arquivos Selecionados</CardTitle>
                  <CardDescription>
                    {arquivos.length} arquivo(s) pronto(s) para processamento
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={limparArquivos}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  <Button 
                    onClick={iniciarProcessamento} 
                    disabled={processando}
                    className="bg-gorgen-600 hover:bg-gorgen-700"
                  >
                    {processando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Extrair Exames
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {arquivos.map((arquivo) => (
                      <div
                        key={arquivo.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={arquivo.status} />
                          <div>
                            <p className="font-medium">{arquivo.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatarTamanho(arquivo.tamanho)}
                              {arquivo.examesExtraidos !== undefined && (
                                <span className="ml-2 text-green-600">
                                  • {arquivo.examesExtraidos} exames
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {arquivo.status === 'processando' && (
                            <Progress value={arquivo.progresso} className="w-24" />
                          )}
                          {arquivo.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerArquivo(arquivo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Resultados */}
        <TabsContent value="resultados" className="space-y-4">
          {resultado && (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Arquivos</p>
                        <p className="text-2xl font-bold">{resultado.arquivos_processados}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-full">
                        <FlaskConical className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Exames Extraídos</p>
                        <p className="text-2xl font-bold">{resultado.total_exames}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ignorados</p>
                        <p className="text-2xl font-bold">{resultado.arquivos_ignorados}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo</p>
                        <p className="text-2xl font-bold">{(resultado.tempo_total_ms / 1000).toFixed(1)}s</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Exames */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Exames Extraídos</CardTitle>
                    <CardDescription>
                      {examesSelecionados.length} de {resultado.exames.length} selecionados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selecionarTodos}>
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselecionarTodos}>
                      Limpar Seleção
                    </Button>
                    <Button 
                      onClick={salvarExamesSelecionados}
                      disabled={examesSelecionados.length === 0 || salvarMutation.isPending}
                      className="bg-gorgen-600 hover:bg-gorgen-700"
                    >
                      {salvarMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Salvar Selecionados
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Paciente
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4" />
                              Exame
                            </div>
                          </TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Referência</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Data
                            </div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.exames.map((exame, index) => {
                          const selecionado = examesSelecionados.some(e => 
                            e.paciente === exame.paciente && 
                            e.nome_exame === exame.nome_exame && 
                            e.data_coleta === exame.data_coleta
                          );
                          
                          return (
                            <TableRow 
                              key={index}
                              className={selecionado ? "bg-gorgen-50" : ""}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selecionado}
                                  onChange={() => toggleExameSelecionado(exame)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{exame.paciente}</TableCell>
                              <TableCell>{exame.nome_exame}</TableCell>
                              <TableCell>
                                <span className={exame.alterado ? "text-red-600 font-semibold" : ""}>
                                  {exame.resultado} {exame.unidade}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {exame.valor_referencia}
                              </TableCell>
                              <TableCell>{exame.data_coleta}</TableCell>
                              <TableCell>
                                {exame.alterado ? (
                                  <Badge variant="destructive">Alterado</Badge>
                                ) : (
                                  <Badge variant="secondary">Normal</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => verDetalhes(exame)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Arquivos Ignorados */}
              {resultado.ignorados.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Arquivos Ignorados
                    </CardTitle>
                    <CardDescription>
                      Documentos identificados como não sendo exames laboratoriais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {resultado.ignorados.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium">{item.arquivo}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{item.motivo}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Erros */}
              {resultado.erros.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Erros de Processamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {resultado.erros.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="font-medium">{item.arquivo}</span>
                          </div>
                          <span className="text-sm text-red-600">{item.erro}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Exame</DialogTitle>
            <DialogDescription>
              Informações completas do exame extraído
            </DialogDescription>
          </DialogHeader>
          {exameDetalhe && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{exameDetalhe.paciente}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Coleta</p>
                  <p className="font-medium">{exameDetalhe.data_coleta}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exame</p>
                  <p className="font-medium">{exameDetalhe.nome_exame}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Laboratório</p>
                  <p className="font-medium">{exameDetalhe.laboratorio || "Não identificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p className={`font-medium ${exameDetalhe.alterado ? "text-red-600" : ""}`}>
                    {exameDetalhe.resultado} {exameDetalhe.unidade}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor de Referência</p>
                  <p className="font-medium">{exameDetalhe.valor_referencia}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arquivo de Origem</p>
                <p className="font-medium">{exameDetalhe.arquivo_origem}</p>
              </div>
              {exameDetalhe.alterado && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Resultado Alterado</AlertTitle>
                  <AlertDescription>
                    Este resultado está fora dos valores de referência.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
