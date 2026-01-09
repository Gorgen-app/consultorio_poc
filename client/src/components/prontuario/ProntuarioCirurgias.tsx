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
import { Plus, Scissors, Calendar, Upload } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  cirurgias: any[];
  onUpdate: () => void;
}

export default function ProntuarioCirurgias({ pacienteId, cirurgias, onUpdate }: Props) {
  
  const [novaCirurgia, setNovaCirurgia] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [cirurgiaIdParaUpload, setCirurgiaIdParaUpload] = useState<number | null>(null);
  const [form, setForm] = useState({
    dataCirurgia: new Date().toISOString().split("T")[0],
    procedimento: "",
    hospital: "",
    cirurgiaoResponsavel: "",
    indicacao: "",
    descricaoCirurgica: "",
  });
  
  const createCirurgia = trpc.prontuario.cirurgias.create.useMutation({
    onSuccess: () => {
      toast.success("Cirurgia registrada!");
      setNovaCirurgia(false);
      onUpdate();
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cirurgias</h2>
          <p className="text-sm text-gray-500">Histórico de procedimentos cirúrgicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setCirurgiaIdParaUpload(null); setModalUploadAberto(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload de Documento
          </Button>
          <Dialog open={novaCirurgia} onOpenChange={setNovaCirurgia}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Cirurgia</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Cirurgia</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={form.dataCirurgia} onChange={(e) => setForm({...form, dataCirurgia: e.target.value})} /></div>
                <div><Label>Hospital</Label><Input value={form.hospital} onChange={(e) => setForm({...form, hospital: e.target.value})} /></div>
              </div>
              <div><Label>Procedimento *</Label><Input value={form.procedimento} onChange={(e) => setForm({...form, procedimento: e.target.value})} /></div>
              <div><Label>Cirurgião Responsável</Label><Input value={form.cirurgiaoResponsavel} onChange={(e) => setForm({...form, cirurgiaoResponsavel: e.target.value})} /></div>
              <div><Label>Indicação</Label><Textarea value={form.indicacao} onChange={(e) => setForm({...form, indicacao: e.target.value})} /></div>
              <div><Label>Descrição Cirúrgica</Label><Textarea rows={4} value={form.descricaoCirurgica} onChange={(e) => setForm({...form, descricaoCirurgica: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovaCirurgia(false)}>Cancelar</Button>
              <Button onClick={() => createCirurgia.mutate({ pacienteId, dataCirurgia: new Date(form.dataCirurgia), procedimento: form.procedimento, hospital: form.hospital || null, cirurgiaoResponsavel: form.cirurgiaoResponsavel || null, indicacao: form.indicacao || null, descricaoCirurgica: form.descricaoCirurgica || null })} disabled={!form.procedimento}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {cirurgias.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhuma cirurgia registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {cirurgias.map((cir) => (
            <Card key={cir.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cir.procedimento}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCirurgiaIdParaUpload(cir.id);
                        setModalUploadAberto(true);
                      }}
                      title="Anexar documento"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Badge variant={cir.status === "Realizada" ? "default" : "secondary"}>{cir.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><span className="text-gray-500">Data:</span> {new Date(cir.dataCirurgia).toLocaleDateString("pt-BR")}</div>
                {cir.hospital && <div><span className="text-gray-500">Hospital:</span> {cir.hospital}</div>}
                {cir.cirurgiaoResponsavel && <div><span className="text-gray-500">Cirurgião:</span> {cir.cirurgiaoResponsavel}</div>}
                {cir.descricaoCirurgica && <p className="mt-2 whitespace-pre-wrap">{cir.descricaoCirurgica}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de upload */}
      <DocumentoUpload
        pacienteId={pacienteId}
        categoria="Cirurgia"
        registroId={cirurgiaIdParaUpload || undefined}
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setCirurgiaIdParaUpload(null);
        }}
        onSuccess={() => {
          onUpdate();
        }}
      />
    </div>
  );
}
