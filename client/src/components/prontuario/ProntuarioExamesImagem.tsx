import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Image, Download } from "lucide-react";

interface Props { pacienteId: number; exames: any[]; onUpdate: () => void; }

export default function ProntuarioExamesImagem({ pacienteId, exames, onUpdate }: Props) {
  
  const [novoExame, setNovoExame] = useState(false);
  const [form, setForm] = useState({ dataExame: new Date().toISOString().split("T")[0], tipoExame: "", regiao: "", clinica: "", laudo: "", conclusao: "" });
  const createExame = trpc.prontuario.examesImagem.create.useMutation({ onSuccess: () => { toast.success("Exame registrado!"); setNovoExame(false); onUpdate(); } });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Exames de Imagem</h2><p className="text-sm text-gray-500">Raio-X, Tomografia, Ressonância, Ultrassom</p></div>
        <Dialog open={novoExame} onOpenChange={setNovoExame}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Exame</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Exame de Imagem</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={form.dataExame} onChange={(e) => setForm({...form, dataExame: e.target.value})} /></div>
                <div><Label>Tipo *</Label>
                  <Select value={form.tipoExame} onValueChange={(v) => setForm({...form, tipoExame: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raio-X">Raio-X</SelectItem>
                      <SelectItem value="Tomografia">Tomografia</SelectItem>
                      <SelectItem value="Ressonância">Ressonância</SelectItem>
                      <SelectItem value="Ultrassom">Ultrassom</SelectItem>
                      <SelectItem value="PET-CT">PET-CT</SelectItem>
                      <SelectItem value="Cintilografia">Cintilografia</SelectItem>
                      <SelectItem value="Mamografia">Mamografia</SelectItem>
                      <SelectItem value="Densitometria">Densitometria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Região Examinada</Label><Input value={form.regiao} onChange={(e) => setForm({...form, regiao: e.target.value})} placeholder="Ex: Abdome, Tórax, Crânio" /></div>
                <div><Label>Clínica/Hospital</Label><Input value={form.clinica} onChange={(e) => setForm({...form, clinica: e.target.value})} /></div>
              </div>
              <div><Label>Laudo</Label><Textarea rows={5} value={form.laudo} onChange={(e) => setForm({...form, laudo: e.target.value})} /></div>
              <div><Label>Conclusão</Label><Textarea value={form.conclusao} onChange={(e) => setForm({...form, conclusao: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoExame(false)}>Cancelar</Button>
              <Button onClick={() => createExame.mutate({ pacienteId, dataExame: form.dataExame, tipoExame: form.tipoExame as "Raio-X" | "Tomografia" | "Ressonância" | "Ultrassonografia" | "Mamografia" | "Densitometria" | "PET-CT" | "Cintilografia" | "Outro", regiao: form.regiao || "", laudo: form.laudo || null, conclusao: form.conclusao || null })} disabled={!form.tipoExame}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {exames.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Image className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum exame de imagem registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {exames.map((ex) => (
            <Card key={ex.id}>
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{ex.tipoExame} - {ex.regiao || "Região não especificada"}</CardTitle><span className="text-sm text-gray-500">{new Date(ex.dataExame).toLocaleDateString("pt-BR")}</span></div></CardHeader>
              <CardContent className="text-sm">
                {ex.clinica && <p className="text-gray-500 mb-2">Clínica: {ex.clinica}</p>}
                {ex.conclusao && <p className="font-medium mb-2">Conclusão: {ex.conclusao}</p>}
                {ex.laudo && <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">{ex.laudo}</pre>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
