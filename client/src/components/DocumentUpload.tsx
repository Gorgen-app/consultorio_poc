import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TIPOS_DOCUMENTO = [
  { value: "diploma_graduacao", label: "Diploma de Graduação", obrigatorio: true },
  { value: "carteira_conselho", label: "Carteira do Conselho", obrigatorio: true },
  { value: "certificado_especializacao", label: "Certificado de Especialização", obrigatorio: false },
  { value: "certificado_residencia", label: "Certificado de Residência", obrigatorio: false },
  { value: "certificado_mestrado", label: "Certificado de Mestrado", obrigatorio: false },
  { value: "certificado_doutorado", label: "Certificado de Doutorado", obrigatorio: false },
  { value: "certificado_curso", label: "Certificado de Curso", obrigatorio: false },
  { value: "outro", label: "Outro", obrigatorio: false },
] as const;

type TipoDocumento = typeof TIPOS_DOCUMENTO[number]["value"];

interface DocumentUploadProps {
  userProfileId: number;
}

export default function DocumentUpload({ userProfileId }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("diploma_graduacao");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documentos, refetch } = trpc.documentos.list.useQuery({ userProfileId });
  const { data: verificacao } = trpc.documentos.verificarObrigatorios.useQuery({ userProfileId });
  const uploadFile = trpc.upload.file.useMutation();
  const saveDocumento = trpc.documentos.save.useMutation();
  const deleteDocumento = trpc.documentos.delete.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas PDF)
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB");
      return;
    }

    setSelectedFile(file);
    setTitulo(file.name.replace(".pdf", ""));
    setDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remover o prefixo "data:application/pdf;base64,"
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      // Fazer upload para S3
      const uploadResult = await uploadFile.mutateAsync({
        fileName: selectedFile.name,
        fileData: base64Data,
        contentType: "application/pdf",
        folder: `documentos/${userProfileId}`,
      });

      // Salvar referência no banco de dados
      await saveDocumento.mutateAsync({
        userProfileId,
        tipo: tipoDocumento,
        titulo,
        descricao: descricao || undefined,
        arquivoUrl: uploadResult.url,
        arquivoKey: uploadResult.key,
        arquivoNome: uploadResult.fileName,
        arquivoTamanho: uploadResult.size,
      });

      toast.success("Documento enviado com sucesso!");
      setDialogOpen(false);
      setSelectedFile(null);
      setTitulo("");
      setDescricao("");
      refetch();
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      await deleteDocumento.mutateAsync({ id, userProfileId });
      toast.success("Documento excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir documento");
    }
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_DOCUMENTO.find(t => t.value === tipo)?.label || tipo;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documentos e Certificados</CardTitle>
            <CardDescription>
              Upload de diplomas, certificados e outros documentos (apenas PDF, máx. 10MB)
            </CardDescription>
          </div>
          {verificacao && (
            <div className="flex items-center gap-2">
              {verificacao.completo ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Documentos completos
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Faltando: {verificacao.faltando.join(", ")}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão de upload */}
        <div className="flex items-center gap-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="document-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Enviar Documento
          </Button>
        </div>

        {/* Lista de documentos */}
        {documentos && documentos.length > 0 ? (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium">{doc.titulo}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getTipoLabel(doc.tipo)}
                      </Badge>
                      {doc.arquivoTamanho && (
                        <span>{formatFileSize(doc.arquivoTamanho)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.arquivoUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteDocumento.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum documento enviado</p>
            <p className="text-sm">
              Diploma de graduação e carteira do conselho são obrigatórios
            </p>
          </div>
        )}

        {/* Dialog de upload */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
              <DialogDescription>
                Preencha as informações do documento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                        {tipo.obrigatorio && " *"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nome do documento"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição adicional"
                />
              </div>
              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={isUploading || !titulo}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
