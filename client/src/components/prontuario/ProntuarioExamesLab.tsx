import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, TestTube, FileText, Download, Upload } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  exames: any[];
  onUpdate: () => void;
}

export default function ProntuarioExamesLab({ pacienteId, exames, onUpdate }: Props) {
  
  const [novoExame, setNovoExame] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [exameIdParaUpload, setExameIdParaUpload] = useState<number | null>(null);
  const [form, setForm] = useState({
    dataColeta: new Date().toISOString().split("T")[0],
    laboratorio: "",
    tipoExame: "",
    resultados: "",
    observacoes: "",
  });
  
  const createExame = trpc.prontuario.examesLab.create.useMutation({
    onSuccess: () => {
      toast.success("Exame registrado!");
      setNovoExame(false);
      onUpdate();
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Exames Laboratoriais</h2>
          <p className="text-sm text-gray-500">Resultados de exames de sangue, urina, etc.</p>
        </div>
        <Dialog open={novoExame} onOpenChange={setNovoExame}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Exame</Button>
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
      {exames.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><TestTube className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum exame laboratorial registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {exames.map((ex) => (
            <Card key={ex.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><TestTube className="h-4 w-4" />{ex.tipoExame}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExameIdParaUpload(ex.id);
                        setModalUploadAberto(true);
                      }}
                      title="Anexar documento"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">{new Date(ex.dataColeta).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {ex.laboratorio && <p className="text-gray-500 mb-2">Laboratório: {ex.laboratorio}</p>}
                {ex.resultados && <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">{ex.resultados}</pre>}
                {ex.arquivoUrl && <Button variant="outline" size="sm" className="mt-2"><Download className="h-4 w-4 mr-2" />Ver Laudo</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de upload */}
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
        }}
      />
    </div>
  );
}
