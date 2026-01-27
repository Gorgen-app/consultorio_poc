import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Scale, Ruler, Activity, TrendingUp, TrendingDown, Minus, History } from "lucide-react";

interface Props {
  pacienteId: number;
  onUpdate: () => void;
}

export default function HistoricoMedidas({ pacienteId, onUpdate }: Props) {
  const [novasMedidas, setNovasMedidas] = useState(false);
  const [medidasForm, setMedidasForm] = useState({
    peso: "",
    altura: "",
    pressaoSistolica: "",
    pressaoDiastolica: "",
    frequenciaCardiaca: "",
    temperatura: "",
    saturacao: "",
    observacoes: "",
  });

  // Queries
  const { data: historico, isLoading } = trpc.prontuario.historicoMedidas.listar.useQuery({
    pacienteId,
    limit: 20,
  });

  const { data: ultimaMedida } = trpc.prontuario.historicoMedidas.ultimaMedida.useQuery({
    pacienteId,
  });

  const { data: evolucaoIMC } = trpc.prontuario.historicoMedidas.evolucaoIMC.useQuery({
    pacienteId,
    meses: 12,
  });

  // Mutation
  const registrarMedida = trpc.prontuario.historicoMedidas.registrar.useMutation({
    onSuccess: () => {
      toast.success("Medidas registradas com sucesso!");
      setNovasMedidas(false);
      setMedidasForm({
        peso: "",
        altura: "",
        pressaoSistolica: "",
        pressaoDiastolica: "",
        frequenciaCardiaca: "",
        temperatura: "",
        saturacao: "",
        observacoes: "",
      });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar: " + error.message);
    },
  });

  // Calcular IMC em tempo real
  const calcularIMC = (peso: string, altura: string) => {
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    if (p > 0 && a > 0) {
      return (p / (a * a)).toFixed(1);
    }
    return null;
  };

  // Classificar IMC
  const classificarIMC = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-yellow-600" };
    if (imc < 25) return { label: "Peso normal", color: "text-emerald-600" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
    if (imc < 35) return { label: "Obesidade Grau I", color: "text-orange-600" };
    if (imc < 40) return { label: "Obesidade Grau II", color: "text-red-600" };
    return { label: "Obesidade Grau III", color: "text-red-700" };
  };

  // Calcular tendência de peso
  const calcularTendencia = () => {
    if (!evolucaoIMC || evolucaoIMC.length < 2) return null;
    const primeiro = parseFloat(evolucaoIMC[0]?.peso || "0");
    const ultimo = parseFloat(evolucaoIMC[evolucaoIMC.length - 1]?.peso || "0");
    const diff = ultimo - primeiro;
    if (diff > 0.5) return { icon: TrendingUp, label: `+${diff.toFixed(1)}kg`, color: "text-red-500" };
    if (diff < -0.5) return { icon: TrendingDown, label: `${diff.toFixed(1)}kg`, color: "text-emerald-500" };
    return { icon: Minus, label: "Estável", color: "text-gray-500" };
  };

  const imcAtual = calcularIMC(medidasForm.peso, medidasForm.altura);
  const tendencia = calcularTendencia();

  const handleSubmit = () => {
    registrarMedida.mutate({
      pacienteId,
      peso: medidasForm.peso ? parseFloat(medidasForm.peso) : undefined,
      altura: medidasForm.altura ? parseFloat(medidasForm.altura) : undefined,
      pressaoSistolica: medidasForm.pressaoSistolica ? parseInt(medidasForm.pressaoSistolica) : undefined,
      pressaoDiastolica: medidasForm.pressaoDiastolica ? parseInt(medidasForm.pressaoDiastolica) : undefined,
      frequenciaCardiaca: medidasForm.frequenciaCardiaca ? parseInt(medidasForm.frequenciaCardiaca) : undefined,
      temperatura: medidasForm.temperatura ? parseFloat(medidasForm.temperatura) : undefined,
      saturacao: medidasForm.saturacao ? parseInt(medidasForm.saturacao) : undefined,
      observacoes: medidasForm.observacoes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Medidas Antropométricas
          </h2>
          <p className="text-sm text-gray-500">
            Histórico de peso, altura, IMC e sinais vitais
          </p>
        </div>
        <Dialog open={novasMedidas} onOpenChange={setNovasMedidas}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Medidas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novas Medidas</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Peso e Altura */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Peso (kg)</Label>
                  <NumberInput
                    decimals={1}
                    value={medidasForm.peso}
                    onChange={(value) => setMedidasForm({ ...medidasForm, peso: value?.toString() || "" })}
                    placeholder="Ex: 75,5"
                    suffix="kg"
                  />
                </div>
                <div>
                  <Label>Altura (m)</Label>
                  <NumberInput
                    decimals={2}
                    value={medidasForm.altura}
                    onChange={(value) => setMedidasForm({ ...medidasForm, altura: value?.toString() || "" })}
                    placeholder="Ex: 1,75"
                    suffix="m"
                  />
                </div>
                <div>
                  <Label>IMC Calculado</Label>
                  <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md">
                    {imcAtual ? (
                      <span className={classificarIMC(parseFloat(imcAtual)).color}>
                        {imcAtual} kg/m² - {classificarIMC(parseFloat(imcAtual)).label}
                      </span>
                    ) : (
                      <span className="text-gray-400">Preencha peso e altura</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sinais Vitais */}
              <div>
                <h4 className="font-medium mb-3">Sinais Vitais</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>PA Sistólica (mmHg)</Label>
                    <NumberInput
                      decimals={0}
                      value={medidasForm.pressaoSistolica}
                      onChange={(value) => setMedidasForm({ ...medidasForm, pressaoSistolica: value?.toString() || "" })}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <Label>PA Diastólica (mmHg)</Label>
                    <NumberInput
                      decimals={0}
                      value={medidasForm.pressaoDiastolica}
                      onChange={(value) => setMedidasForm({ ...medidasForm, pressaoDiastolica: value?.toString() || "" })}
                      placeholder="80"
                    />
                  </div>
                  <div>
                    <Label>FC (bpm)</Label>
                    <NumberInput
                      decimals={0}
                      value={medidasForm.frequenciaCardiaca}
                      onChange={(value) => setMedidasForm({ ...medidasForm, frequenciaCardiaca: value?.toString() || "" })}
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <Label>SpO2 (%)</Label>
                    <NumberInput
                      decimals={0}
                      value={medidasForm.saturacao}
                      onChange={(value) => setMedidasForm({ ...medidasForm, saturacao: value?.toString() || "" })}
                      placeholder="98"
                      suffix="%"
                    />
                  </div>
                </div>
              </div>

              {/* Temperatura */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temperatura (°C)</Label>
                  <NumberInput
                    decimals={1}
                    value={medidasForm.temperatura}
                    onChange={(value) => setMedidasForm({ ...medidasForm, temperatura: value?.toString() || "" })}
                    placeholder="36,5"
                    suffix="°C"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={medidasForm.observacoes}
                  onChange={(e) => setMedidasForm({ ...medidasForm, observacoes: e.target.value })}
                  placeholder="Observações sobre as medidas..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovasMedidas(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={registrarMedida.isPending}>
                {registrarMedida.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Peso Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#0056A4]" />
              <span className="text-2xl font-bold">
                {ultimaMedida?.peso ? `${ultimaMedida.peso} kg` : "—"}
              </span>
            </div>
            {tendencia && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${tendencia.color}`}>
                <tendencia.icon className="h-4 w-4" />
                <span>{tendencia.label} (12 meses)</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Altura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">
                {ultimaMedida?.altura ? `${ultimaMedida.altura} m` : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">IMC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {ultimaMedida?.imc ? `${ultimaMedida.imc}` : "—"}
              </span>
            </div>
            {ultimaMedida?.imc && (
              <p className={`text-sm mt-1 ${classificarIMC(parseFloat(ultimaMedida.imc)).color}`}>
                {classificarIMC(parseFloat(ultimaMedida.imc)).label}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Última Medição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-medium">
                {ultimaMedida?.dataMedicao
                  ? new Date(ultimaMedida.dataMedicao).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Medidas</CardTitle>
          <CardDescription>
            Todas as medidas são preservadas para análise longitudinal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4 text-gray-500">Carregando...</p>
          ) : !historico || historico.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              Nenhuma medida registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Altura</TableHead>
                    <TableHead>IMC</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>FC</TableHead>
                    <TableHead>SpO2</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {new Date(m.dataMedicao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{m.peso ? `${m.peso} kg` : "—"}</TableCell>
                      <TableCell>{m.altura ? `${m.altura} m` : "—"}</TableCell>
                      <TableCell>
                        {m.imc ? (
                          <span className={classificarIMC(parseFloat(m.imc)).color}>
                            {m.imc}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {m.pressaoSistolica && m.pressaoDiastolica
                          ? `${m.pressaoSistolica}/${m.pressaoDiastolica}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {m.frequenciaCardiaca ? `${m.frequenciaCardiaca} bpm` : "—"}
                      </TableCell>
                      <TableCell>
                        {m.saturacao ? `${m.saturacao}%` : "—"}
                      </TableCell>
                      <TableCell>
                        {m.temperatura ? `${m.temperatura}°C` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {m.registradoPor}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota sobre preservação de dados */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-[#0056A4]">
          <strong>Pilar Fundamental - Imutabilidade:</strong> Todas as medidas registradas são 
          preservadas permanentemente para análise longitudinal. Os dados não são editados ou 
          excluídos, garantindo rastreabilidade completa da evolução do paciente.
        </p>
      </div>
    </div>
  );
}
