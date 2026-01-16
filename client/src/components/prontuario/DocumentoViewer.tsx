import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  FileText, 
  Image, 
  Loader2, 
  Download, 
  X, 
  ScanText,
  Copy,
  Check,
  FlaskConical,
  Table2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DocumentoViewerProps {
  documento: {
    id: number;
    pacienteId?: number;
    titulo: string;
    descricao?: string | null;
    dataDocumento?: string | null;
    arquivoOriginalUrl: string;
    arquivoOriginalNome: string;
    arquivoOriginalTipo?: string | null;
    arquivoOriginalTamanho?: number | null;
    textoOcr?: string | null;
    uploadPor: string;
    uploadEm: Date | string;
    categoria?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentoViewer({ documento, isOpen, onClose }: DocumentoViewerProps) {
  const [activeTab, setActiveTab] = useState("visualizar");
  const [copied, setCopied] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingLab, setIsExtractingLab] = useState(false);

  const utils = trpc.useUtils();
  const extractOcrMutation = trpc.documentosExternos.extractOcr.useMutation({
    onSuccess: () => {
      utils.documentosExternos.list.invalidate();
    },
  });

  // Usar extração de exames favoritos ao invés da extração genérica
  const extractLabMutation = trpc.examesFavoritos.extrairDoDocumento.useMutation({
    onSuccess: (data) => {
      utils.resultadosLaboratoriais.fluxograma.invalidate();
      utils.resultadosLaboratoriais.list.invalidate();
      toast.success(`${data.count} exames extraídos: ${data.examesEncontrados?.join(", ")}`);
    },
    onError: (error) => {
      toast.error(`Erro ao extrair dados: ${error.message}`);
    },
  });

  const isImage = documento.arquivoOriginalTipo?.startsWith("image/");
  const isPdf = documento.arquivoOriginalTipo === "application/pdf";
  const isLabDocument = documento.categoria === "Exame Laboratorial";

  const handleExtractOcr = async () => {
    setIsExtracting(true);
    try {
      await extractOcrMutation.mutateAsync({ documentoId: documento.id });
    } catch (error) {
      console.error("Erro ao extrair OCR:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractLabData = async () => {
    if (!documento.pacienteId) {
      toast.error("ID do paciente não encontrado");
      return;
    }
    setIsExtractingLab(true);
    try {
      await extractLabMutation.mutateAsync({
        pacienteId: documento.pacienteId,
        documentoExternoId: documento.id,
      });
    } catch (error) {
      console.error("Erro ao extrair dados laboratoriais:", error);
    } finally {
      setIsExtractingLab(false);
    }
  };

  const handleCopyText = () => {
    if (documento.textoOcr) {
      navigator.clipboard.writeText(documento.textoOcr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Tamanho desconhecido";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Data não informada";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? (
              <Image className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-red-500" />
            )}
            {documento.titulo}
          </DialogTitle>
          <DialogDescription>
            {documento.descricao || "Sem descrição"} • {formatDate(documento.dataDocumento)} • {formatFileSize(documento.arquivoOriginalTamanho)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className={`grid w-full ${isLabDocument ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="visualizar" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </TabsTrigger>
            <TabsTrigger value="texto" className="flex items-center gap-2">
              <ScanText className="h-4 w-4" />
              Texto OCR
            </TabsTrigger>
            {isLabDocument && (
              <TabsTrigger value="dados" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Dados Estruturados
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="visualizar" className="flex-1 overflow-auto mt-4">
            <div className="bg-gray-100 rounded-lg p-2 min-h-[400px] flex items-center justify-center">
              {isImage ? (
                <img
                  src={documento.arquivoOriginalUrl}
                  alt={documento.titulo}
                  className="max-w-full max-h-[500px] object-contain rounded"
                />
              ) : isPdf ? (
                <iframe
                  src={documento.arquivoOriginalUrl}
                  className="w-full h-[500px] rounded border"
                  title={documento.titulo}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Visualização não disponível para este tipo de arquivo.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    tooltip="Baixar" onClick={() => window.open(documento.arquivoOriginalUrl, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="texto" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {documento.textoOcr ? (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Texto extraído via OCR
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExtractOcr}
                        disabled={isExtracting}
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <ScanText className="h-4 w-4 mr-2" />
                            Reprocessar OCR
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyText}
                       tooltip="Confirmar">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Texto
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {documento.textoOcr}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ScanText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">
                    Nenhum texto extraído deste documento.
                  </p>
                  <Button
                    onClick={handleExtractOcr}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo texto...
                      </>
                    ) : (
                      <>
                        <ScanText className="h-4 w-4 mr-2" />
                        Extrair Texto (OCR)
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    O processo pode levar alguns segundos
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {isLabDocument && (
            <TabsContent value="dados" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <FlaskConical className="h-16 w-16 mx-auto mb-4 text-purple-300" />
                  <h3 className="font-medium text-lg mb-2">Extrair Dados Laboratoriais</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    Extrai automaticamente os resultados dos seus <strong>Exames Favoritos</strong> deste documento. Configure seus exames favoritos em Configurações.
                  </p>
                  <Button
                    onClick={handleExtractLabData}
                    disabled={isExtractingLab}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isExtractingLab ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo dados...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Extrair Resultados de Exames
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Apenas os exames configurados como favoritos serão extraídos.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-xs text-gray-400">
            Enviado por {documento.uploadPor} em {formatDate(documento.uploadEm)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              tooltip="Baixar" onClick={() => window.open(documento.arquivoOriginalUrl, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} tooltip="Fechar janela">
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
