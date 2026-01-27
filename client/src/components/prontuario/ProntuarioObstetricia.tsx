import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Baby } from "lucide-react";

interface Props { pacienteId: number; registros: any[]; onUpdate: () => void; }

export default function ProntuarioObstetricia({ pacienteId, registros, onUpdate }: Props) {
  
  const [novoRegistro, setNovoRegistro] = useState(false);
  const [form, setForm] = useState({ tipoRegistro: "", dataRegistro: new Date().toISOString().split("T")[0], dum: "", dpp: "", ig: "", gesta: "", para: "", abortos: "", observacoes: "" });
  const createRegistro = trpc.prontuario.obstetricia.create.useMutation({ onSuccess: () => { toast.success("Registro salvo!"); setNovoRegistro(false); onUpdate(); } });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Obstetrícia</h2><p className="text-sm text-gray-500">Gestações, pré-natal, partos</p></div>
        <Dialog open={novoRegistro} onOpenChange={setNovoRegistro}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Registro</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registro Obstétrico</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo *</Label>
                  <Select value={form.tipoRegistro} onValueChange={(v) => setForm({...form, tipoRegistro: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gestação">Nova Gestação</SelectItem>
                      <SelectItem value="Pré-natal">Consulta Pré-natal</SelectItem>
                      <SelectItem value="Parto">Parto</SelectItem>
                      <SelectItem value="Puerpério">Puerpério</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={form.dataRegistro} onChange={(e) => setForm({...form, dataRegistro: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>DUM</Label><Input type="date" value={form.dum} onChange={(e) => setForm({...form, dum: e.target.value})} /></div>
                <div><Label>DPP</Label><Input type="date" value={form.dpp} onChange={(e) => setForm({...form, dpp: e.target.value})} /></div>
                <div><Label>IG (semanas)</Label><Input value={form.ig} onChange={(e) => setForm({...form, ig: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Gesta</Label><NumberInput decimals={0} value={form.gesta} onChange={(value) => setForm({...form, gesta: value?.toString() || ""})} /></div>
                <div><Label>Para</Label><NumberInput decimals={0} value={form.para} onChange={(value) => setForm({...form, para: value?.toString() || ""})} /></div>
                <div><Label>Abortos</Label><NumberInput decimals={0} value={form.abortos} onChange={(value) => setForm({...form, abortos: value?.toString() || ""})} /></div>
              </div>
              <div><Label>Observações</Label><Textarea rows={4} value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoRegistro(false)}>Cancelar</Button>
              <Button onClick={() => createRegistro.mutate({ pacienteId, tipoRegistro: form.tipoRegistro as "Pré-natal" | "Parto" | "Puerpério" | "Aborto", dataRegistro: form.dataRegistro, dum: form.dum || null, dpp: form.dpp || null, idadeGestacional: form.ig || null, observacoes: form.observacoes || null })} disabled={!form.tipoRegistro}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {registros.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Baby className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum registro obstétrico.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {registros.map((r) => (
            <Card key={r.id}>
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Baby className="h-4 w-4 text-pink-500" />{r.tipoRegistro}</CardTitle><span className="text-sm text-gray-500">{new Date(r.dataRegistro).toLocaleDateString("pt-BR")}</span></div></CardHeader>
              <CardContent className="text-sm space-y-1">
                {r.ig && <div><span className="text-gray-500">IG:</span> {r.ig} semanas</div>}
                {(r.gesta || r.para || r.abortos) && <div><span className="text-gray-500">G{r.gesta || 0}P{r.para || 0}A{r.abortos || 0}</span></div>}
                {r.observacoes && <p className="mt-2 whitespace-pre-wrap">{r.observacoes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
