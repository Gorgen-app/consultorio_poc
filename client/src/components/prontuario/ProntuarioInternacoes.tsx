import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Calendar, Upload, FileText } from "lucide-react";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface Props {
  pacienteId: number;
  internacoes: any[];
  onUpdate: () => void;
}

export default function ProntuarioInternacoes({ pacienteId, internacoes, onUpdate }: Props) {
  
  const [novaInternacao, setNovaInternacao] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [internacaoIdParaUpload, setInternacaoIdParaUpload] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    hospital: "",
    setor: "",
    leito: "",
    dataAdmissao: new Date().toISOString().split("T")[0],
    motivoInternacao: "",
    diagnosticoAdmissao: "",
    cid10Admissao: "",
  });
  
  const createInternacao = trpc.prontuario.internacoes.create.useMutation({
    onSuccess: () => {
      toast.success("Internação registrada!");
      setNovaInternacao(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Internações</h2>
          <p className="text-sm text-gray-500">Histórico de internações hospitalares</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setInternacaoIdParaUpload(null); setModalUploadAberto(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload de Documento
          </Button>
          <Dialog open={novaInternacao} onOpenChange={setNovaInternacao}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Internação</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Internação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hospital *</Label>
                  <Input value={form.hospital} onChange={(e) => setForm({...form, hospital: e.target.value})} />
                </div>
                <div>
                  <Label>Data de Admissão *</Label>
                  <Input type="date" value={form.dataAdmissao} onChange={(e) => setForm({...form, dataAdmissao: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Setor</Label>
                  <Input value={form.setor} onChange={(e) => setForm({...form, setor: e.target.value})} />
                </div>
                <div>
                  <Label>Leito</Label>
                  <Input value={form.leito} onChange={(e) => setForm({...form, leito: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Motivo da Internação</Label>
                <Textarea value={form.motivoInternacao} onChange={(e) => setForm({...form, motivoInternacao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Diagnóstico de Admissão</Label>
                  <Input value={form.diagnosticoAdmissao} onChange={(e) => setForm({...form, diagnosticoAdmissao: e.target.value})} />
                </div>
                <div>
                  <Label>CID-10</Label>
                  <Input value={form.cid10Admissao} onChange={(e) => setForm({...form, cid10Admissao: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovaInternacao(false)}>Cancelar</Button>
              <Button onClick={() => createInternacao.mutate({
                pacienteId,
                hospital: form.hospital,
                setor: form.setor || null,
                leito: form.leito || null,
                dataAdmissao: new Date(form.dataAdmissao),
                motivoInternacao: form.motivoInternacao || null,
                diagnosticoAdmissao: form.diagnosticoAdmissao || null,
                cid10Admissao: form.cid10Admissao || null,
              })} disabled={!form.hospital || createInternacao.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      {internacoes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma internação registrada.</p>
            <Button className="mt-4" onClick={() => setNovaInternacao(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeira Internação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {internacoes.map((int) => (
            <Card key={int.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {int.hospital}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInternacaoIdParaUpload(int.id);
                        setModalUploadAberto(true);
                      }}
                      title="Anexar documento"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Badge variant={int.dataAlta ? "secondary" : "default"}>
                      {int.dataAlta ? "Alta" : "Internado"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Admissão:</span> {new Date(int.dataAdmissao).toLocaleDateString("pt-BR")}
                  </div>
                  {int.dataAlta && (
                    <div>
                      <span className="text-gray-500">Alta:</span> {new Date(int.dataAlta).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                  {int.setor && <div><span className="text-gray-500">Setor:</span> {int.setor}</div>}
                  {int.diagnosticoAdmissao && <div><span className="text-gray-500">Diagnóstico:</span> {int.diagnosticoAdmissao}</div>}
                </div>
                {int.motivoInternacao && (
                  <p className="mt-2 text-sm"><span className="text-gray-500">Motivo:</span> {int.motivoInternacao}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de documentos anexados */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Anexados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentosList pacienteId={pacienteId} categoria="Internação" />
        </CardContent>
      </Card>

      {/* Modal de upload */}
      <DocumentoUpload
        pacienteId={pacienteId}
        categoria="Internação"
        registroId={internacaoIdParaUpload || undefined}
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setInternacaoIdParaUpload(null);
        }}
        onSuccess={() => {
          onUpdate();
        }}
      />
    </div>
  );
}
