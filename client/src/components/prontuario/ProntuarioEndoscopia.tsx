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
import { Plus, Scan } from "lucide-react";

interface Props { pacienteId: number; exames: any[]; onUpdate: () => void; }

export default function ProntuarioEndoscopia({ pacienteId, exames, onUpdate }: Props) {
  
  const [novoExame, setNovoExame] = useState(false);
  const [form, setForm] = useState({ dataExame: new Date().toISOString().split("T")[0], tipoExame: "", clinica: "", medico: "", achados: "", conclusao: "", biopsia: false, resultadoBiopsia: "" });
  const createExame = trpc.prontuario.endoscopias.create.useMutation({ onSuccess: () => { toast.success("Exame registrado!"); setNovoExame(false); onUpdate(); } });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Endoscopia</h2><p className="text-sm text-gray-500">EDA, Colonoscopia, Broncoscopia, etc.</p></div>
        <Dialog open={novoExame} onOpenChange={setNovoExame}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Exame</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Exame Endoscópico</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={form.dataExame} onChange={(e) => setForm({...form, dataExame: e.target.value})} /></div>
                <div><Label>Tipo *</Label>
                  <Select value={form.tipoExame} onValueChange={(v) => setForm({...form, tipoExame: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDA">Endoscopia Digestiva Alta</SelectItem>
                      <SelectItem value="Colonoscopia">Colonoscopia</SelectItem>
                      <SelectItem value="Retossigmoidoscopia">Retossigmoidoscopia</SelectItem>
                      <SelectItem value="CPRE">CPRE</SelectItem>
                      <SelectItem value="Ecoendoscopia">Ecoendoscopia</SelectItem>
                      <SelectItem value="Broncoscopia">Broncoscopia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Clínica/Hospital</Label><Input value={form.clinica} onChange={(e) => setForm({...form, clinica: e.target.value})} /></div>
                <div><Label>Médico Executor</Label><Input value={form.medico} onChange={(e) => setForm({...form, medico: e.target.value})} /></div>
              </div>
              <div><Label>Achados</Label><Textarea rows={4} value={form.achados} onChange={(e) => setForm({...form, achados: e.target.value})} /></div>
              <div><Label>Conclusão</Label><Textarea value={form.conclusao} onChange={(e) => setForm({...form, conclusao: e.target.value})} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="biopsia" checked={form.biopsia} onChange={(e) => setForm({...form, biopsia: e.target.checked})} />
                <Label htmlFor="biopsia">Realizada biópsia</Label>
              </div>
              {form.biopsia && <div><Label>Resultado da Biópsia</Label><Textarea value={form.resultadoBiopsia} onChange={(e) => setForm({...form, resultadoBiopsia: e.target.value})} /></div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoExame(false)}>Cancelar</Button>
              <Button onClick={() => createExame.mutate({ pacienteId, dataExame: form.dataExame, tipoExame: form.tipoExame as "EDA" | "Colonoscopia" | "Retossigmoidoscopia" | "CPRE" | "Ecoendoscopia" | "Enteroscopia" | "Outro", clinicaServico: form.clinica || null, medicoExecutor: form.medico || null, descricao: form.achados || null, conclusao: form.conclusao || null, biopsia: form.biopsia, resultadoBiopsia: form.resultadoBiopsia || null })} disabled={!form.tipoExame}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {exames.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Scan className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum exame endoscópico registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {exames.map((ex) => (
            <Card key={ex.id}>
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{ex.tipoExame}</CardTitle><span className="text-sm text-gray-500">{new Date(ex.dataExame).toLocaleDateString("pt-BR")}</span></div></CardHeader>
              <CardContent className="text-sm space-y-2">
                {ex.conclusao && <p className="font-medium">Conclusão: {ex.conclusao}</p>}
                {ex.achados && <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">{ex.achados}</pre>}
                {ex.biopsia && <p className="text-orange-600">Biópsia: {ex.resultadoBiopsia || "Aguardando resultado"}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
