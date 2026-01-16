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
import { Plus, Droplets } from "lucide-react";

interface Props { pacienteId: number; terapias: any[]; onUpdate: () => void; }

export default function ProntuarioTerapias({ pacienteId, terapias, onUpdate }: Props) {
  
  const [novaTerapia, setNovaTerapia] = useState(false);
  const [form, setForm] = useState({ dataInicio: new Date().toISOString().split("T")[0], tipoTerapia: "", medicamento: "", dosagem: "", frequencia: "", local: "", indicacao: "" });
  const createTerapia = trpc.prontuario.terapias.create.useMutation({ onSuccess: () => { toast.success("Terapia registrada!"); setNovaTerapia(false); onUpdate(); } });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Terapias e Infusões</h2><p className="text-sm text-gray-500">Quimioterapia, Imunobiológicos, Infusões</p></div>
        <Dialog open={novaTerapia} onOpenChange={setNovaTerapia}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Terapia</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Terapia/Infusão</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data de Início *</Label><Input type="date" value={form.dataInicio} onChange={(e) => setForm({...form, dataInicio: e.target.value})} /></div>
                <div><Label>Tipo de Terapia *</Label><Input value={form.tipoTerapia} onChange={(e) => setForm({...form, tipoTerapia: e.target.value})} placeholder="Ex: Quimioterapia, Imunobiológico" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Medicamento *</Label><Input value={form.medicamento} onChange={(e) => setForm({...form, medicamento: e.target.value})} /></div>
                <div><Label>Dosagem</Label><Input value={form.dosagem} onChange={(e) => setForm({...form, dosagem: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Frequência</Label><Input value={form.frequencia} onChange={(e) => setForm({...form, frequencia: e.target.value})} placeholder="Ex: Semanal, Quinzenal, Mensal" /></div>
                <div><Label>Local</Label><Input value={form.local} onChange={(e) => setForm({...form, local: e.target.value})} /></div>
              </div>
              <div><Label>Indicação</Label><Textarea value={form.indicacao} onChange={(e) => setForm({...form, indicacao: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" tooltip="Cancelar operação" onClick={() => setNovaTerapia(false)}>Cancelar</Button>
              <Button tooltip="Salvar alterações" onClick={() => createTerapia.mutate({ pacienteId, dataTerapia: new Date(form.dataInicio), tipoTerapia: form.tipoTerapia as "Quimioterapia" | "Imunoterapia" | "Terapia Alvo" | "Imunobiológico" | "Infusão" | "Transfusão" | "Outro", medicamentos: form.medicamento, local: form.local || null })} disabled={!form.tipoTerapia || !form.medicamento}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {terapias.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Droplets className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhuma terapia registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {terapias.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.tipoTerapia} - {t.medicamento}</CardTitle>
                  <Badge variant={t.status === "Em andamento" ? "default" : "secondary"}>{t.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><span className="text-gray-500">Início:</span> {new Date(t.dataInicio).toLocaleDateString("pt-BR")}</div>
                {t.dosagem && <div><span className="text-gray-500">Dosagem:</span> {t.dosagem}</div>}
                {t.frequencia && <div><span className="text-gray-500">Frequência:</span> {t.frequencia}</div>}
                {t.indicacao && <div><span className="text-gray-500">Indicação:</span> {t.indicacao}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
