import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Image, Loader2, X, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";


type CategoriaDocumento = 
  | "Evolução" 
  | "Internação" 
  | "Cirurgia" 
  | "Exame Laboratorial" 
  | "Exame de Imagem" 
  | "Endoscopia" 
  | "Cardiologia" 
  | "Patologia";

interface DocumentoUploadProps {
  pacienteId: number;
  categoria: CategoriaDocumento;
  registroId?: number; // ID do registro específico (evolução, internação, etc.)
  onSuccess?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function DocumentoUpload({
  pacienteId,
  categoria,
  registroId,
  onSuccess,
  onClose,
  isOpen,
}: DocumentoUploadProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataDocumento, setDataDocumento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const createDocumento = trpc.documentosExternos.create.useMutation({
    onSuccess: () => {
      utils.documentosExternos.list.invalidate({ pacienteId });
      onSuccess?.();
      resetForm();
      onClose?.();
    },
  });

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setDataDocumento(new Date().toISOString().split("T")[0]);
    setArquivo(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP) ou PDF.");
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Tamanho máximo: 10MB.");
      return;
    }

    setArquivo(file);

    // Criar preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    // Auto-preencher título se vazio
    if (!titulo) {
      const nomeBase = file.name.replace(/\.[^/.]+$/, "");
      setTitulo(nomeBase);
    }
  };

  const handleUpload = async () => {
    if (!arquivo || !titulo) {
      alert("Preencha o título e selecione um arquivo.");
      return;
    }

    setIsUploading(true);

    try {
      // Converter arquivo para base64 e fazer upload via API
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = arquivo.name.split(".").pop();
        const fileKey = `documentos/${pacienteId}/${categoria.toLowerCase().replace(/ /g, "-")}/${timestamp}-${randomSuffix}.${extension}`;

        // Upload para S3 via endpoint do servidor
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileKey,
            fileData: base64,
            contentType: arquivo.type,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Erro ao fazer upload do arquivo");
        }

        const { url } = await uploadResponse.json();

        // Criar registro no banco
        const registroIdField = getRegistroIdField(categoria);
        await createDocumento.mutateAsync({
          pacienteId,
          categoria,
          titulo,
          descricao: descricao || undefined,
          dataDocumento: dataDocumento || undefined,
          arquivoOriginalUrl: url,
          arquivoOriginalNome: arquivo.name,
          arquivoOriginalTipo: arquivo.type,
          arquivoOriginalTamanho: arquivo.size,
          ...(registroId && registroIdField ? { [registroIdField]: registroId } : {}),
        });

        setIsUploading(false);
      };

      reader.readAsDataURL(arquivo);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload do documento. Tente novamente.");
      setIsUploading(false);
    }
  };

  const getRegistroIdField = (cat: CategoriaDocumento): string | null => {
    const mapping: Record<CategoriaDocumento, string | null> = {
      "Evolução": "evolucaoId",
      "Internação": "internacaoId",
      "Cirurgia": "cirurgiaId",
      "Exame Laboratorial": "exameLaboratorialId",
      "Exame de Imagem": "exameImagemId",
      "Endoscopia": "endoscopiaId",
      "Cardiologia": "cardiologiaId",
      "Patologia": "patologiaId",
    };
    return mapping[cat];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload de Documento - {categoria}</DialogTitle>
          <DialogDescription>
            Faça upload de um documento externo (imagem ou PDF). O documento será
            armazenado e poderá ser processado com OCR futuramente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Área de upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              arquivo
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {arquivo ? (
              <div className="space-y-2">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded"
                  />
                ) : (
                  <FileText className="h-12 w-12 mx-auto text-green-600" />
                )}
                <p className="text-sm font-medium text-green-700">
                  {arquivo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArquivo(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Clique para selecionar ou arraste um arquivo
                </p>
                <p className="text-xs text-gray-400">
                  Imagens (JPEG, PNG, GIF, WebP) ou PDF - Máx. 10MB
                </p>
              </div>
            )}
          </div>

          {/* Campos do formulário */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Laudo de Biópsia - Mama"
              />
            </div>

            <div>
              <Label htmlFor="dataDocumento">Data do Documento</Label>
              <Input
                id="dataDocumento"
                type="date"
                value={dataDocumento}
                onChange={(e) => setDataDocumento(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Observações sobre o documento..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!arquivo || !titulo || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente para listar documentos de uma categoria
interface DocumentosListProps {
  pacienteId: number;
  categoria: CategoriaDocumento;
}

export function DocumentosList({ pacienteId, categoria }: DocumentosListProps) {
  const { data: documentos, isLoading } = trpc.documentosExternos.list.useQuery({
    pacienteId,
    categoria,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!documentos || documentos.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        Nenhum documento anexado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documentos.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            {doc.arquivoOriginalTipo?.startsWith("image/") ? (
              <Image className="h-4 w-4 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">{doc.titulo}</p>
              <p className="text-xs text-gray-500">
                {doc.dataDocumento
                  ? new Date(doc.dataDocumento).toLocaleDateString("pt-BR")
                  : "Data não informada"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(doc.arquivoOriginalUrl, "_blank")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
