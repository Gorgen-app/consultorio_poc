import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProfilePhotoUploadProps {
  userName?: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export default function ProfilePhotoUpload({ userName, size = "md", editable = true }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profilePhoto, refetch } = trpc.profilePhoto.get.useQuery();
  const uploadFile = trpc.upload.file.useMutation();
  const savePhoto = trpc.profilePhoto.save.useMutation();
  const deletePhoto = trpc.profilePhoto.delete.useMutation();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas imagens)
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
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
        contentType: selectedFile.type,
        folder: "profile-photos",
      });

      // Salvar referência no banco de dados
      await savePhoto.mutateAsync({
        fotoUrl: uploadResult.url,
        fotoKey: uploadResult.key,
        fotoNome: uploadResult.fileName,
      });

      toast.success("Foto atualizada com sucesso!");
      setDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      refetch();
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;

    try {
      await deletePhoto.mutateAsync();
      toast.success("Foto removida com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao remover foto");
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={profilePhoto?.fotoUrl} alt={userName || "Foto de perfil"} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dialog de confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Confirme a nova foto de perfil
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {previewUrl && (
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewUrl} alt="Preview" />
              </Avatar>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {profilePhoto && (
              <Button variant="destructive" onClick={handleDelete} disabled={deletePhoto.isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Atual
              </Button>
            )}
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente simples para exibição (sem edição)
export function ProfileAvatar({ userName, photoUrl, size = "sm" }: { userName?: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={photoUrl || undefined} alt={userName || "Foto de perfil"} />
      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
        {getInitials(userName)}
      </AvatarFallback>
    </Avatar>
  );
}
