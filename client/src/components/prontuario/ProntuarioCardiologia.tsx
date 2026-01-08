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
import { Plus, Heart } from "lucide-react";

interface Props { pacienteId: number; exames: any[]; onUpdate: () => void; }

export default function ProntuarioCardiologia({ pacienteId, exames, onUpdate }: Props) {
  
  const [novoExame, setNovoExame] = useState(false);
  const [form, setForm] = useState({ dataExame: new Date().toISOString().split("T")[0], tipoExame: "", clinica: "", medico: "", resultado: "", conclusao: "" });
  const createExame = trpc.prontuario.cardiologia.create.useMutation({ onSuccess: () => { toast.success("Exame registrado!"); setNovoExame(false); onUpdate(); } });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Cardiologia</h2><p className="text-sm text-gray-500">ECG, Ecocardiograma, Holter, MAPA, Teste Ergométrico</p></div>
        <Dialog open={novoExame} onOpenChange={setNovoExame}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Exame</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Exame Cardiológico</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={form.dataExame} onChange={(e) => setForm({...form, dataExame: e.target.value})} /></div>
                <div><Label>Tipo *</Label>
                  <Select value={form.tipoExame} onValueChange={(v) => setForm({...form, tipoExame: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECG">Eletrocardiograma</SelectItem>
                      <SelectItem value="Ecocardiograma">Ecocardiograma</SelectItem>
                      <SelectItem value="Holter">Holter 24h</SelectItem>
                      <SelectItem value="MAPA">MAPA</SelectItem>
                      <SelectItem value="Teste Ergométrico">Teste Ergométrico</SelectItem>
                      <SelectItem value="Cintilografia">Cintilografia Miocárdica</SelectItem>
                      <SelectItem value="Cateterismo">Cateterismo Cardíaco</SelectItem>
                      <SelectItem value="AngioTC">AngioTC Coronárias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Clínica/Hospital</Label><Input value={form.clinica} onChange={(e) => setForm({...form, clinica: e.target.value})} /></div>
                <div><Label>Cardiologista</Label><Input value={form.medico} onChange={(e) => setForm({...form, medico: e.target.value})} /></div>
              </div>
              <div><Label>Resultado/Laudo</Label><Textarea rows={5} value={form.resultado} onChange={(e) => setForm({...form, resultado: e.target.value})} /></div>
              <div><Label>Conclusão</Label><Textarea value={form.conclusao} onChange={(e) => setForm({...form, conclusao: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoExame(false)}>Cancelar</Button>
              <Button onClick={() => createExame.mutate({ pacienteId, dataExame: form.dataExame, tipoExame: form.tipoExame as "ECG" | "Ecocardiograma" | "Teste Ergométrico" | "Holter 24h" | "MAPA" | "Cintilografia Miocárdica" | "Cateterismo" | "Angiotomografia" | "Outro", clinicaServico: form.clinica || null, medicoExecutor: form.medico || null, descricao: form.resultado || null, conclusao: form.conclusao || null })} disabled={!form.tipoExame}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {exames.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum exame cardiológico registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {exames.map((ex) => (
            <Card key={ex.id}>
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" />{ex.tipoExame}</CardTitle><span className="text-sm text-gray-500">{new Date(ex.dataExame).toLocaleDateString("pt-BR")}</span></div></CardHeader>
              <CardContent className="text-sm">
                {ex.conclusao && <p className="font-medium mb-2">Conclusão: {ex.conclusao}</p>}
                {ex.resultado && <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">{ex.resultado}</pre>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
