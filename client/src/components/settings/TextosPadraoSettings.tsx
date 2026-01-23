import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw, FileText } from "lucide-react";

export function TextosPadraoSettings() {
  const [subjetivoPadrao, setSubjetivoPadrao] = useState("");
  const [objetivoPadrao, setObjetivoPadrao] = useState("");
  const [avaliacaoPadrao, setAvaliacaoPadrao] = useState("");
  const [planoPadrao, setPlanoPadrao] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: textosPadrao, isLoading, refetch } = trpc.prontuario.evolucoes.getTextosPadrao.useQuery();

  const saveMutation = trpc.prontuario.evolucoes.saveTextosPadrao.useMutation({
    onSuccess: () => {
      toast.success("Textos padrão salvos com sucesso!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Carregar textos padrão quando disponíveis
  useEffect(() => {
    if (textosPadrao) {
      setSubjetivoPadrao(textosPadrao.subjetivoPadrao || "");
      setObjetivoPadrao(textosPadrao.objetivoPadrao || "");
      setAvaliacaoPadrao(textosPadrao.avaliacaoPadrao || "");
      setPlanoPadrao(textosPadrao.planoPadrao || "");
    }
  }, [textosPadrao]);

  const handleSave = () => {
    saveMutation.mutate({
      subjetivoPadrao: subjetivoPadrao || null,
      objetivoPadrao: objetivoPadrao || null,
      avaliacaoPadrao: avaliacaoPadrao || null,
      planoPadrao: planoPadrao || null,
    });
  };

  const handleReset = () => {
    if (textosPadrao) {
      setSubjetivoPadrao(textosPadrao.subjetivoPadrao || "");
      setObjetivoPadrao(textosPadrao.objetivoPadrao || "");
      setAvaliacaoPadrao(textosPadrao.avaliacaoPadrao || "");
      setPlanoPadrao(textosPadrao.planoPadrao || "");
      setHasChanges(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    switch (field) {
      case "subjetivo":
        setSubjetivoPadrao(value);
        break;
      case "objetivo":
        setObjetivoPadrao(value);
        break;
      case "avaliacao":
        setAvaliacaoPadrao(value);
        break;
      case "plano":
        setPlanoPadrao(value);
        break;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Textos Padrão para Evoluções (SOAP)
          </CardTitle>
          <CardDescription>
            Configure textos padrão que serão inseridos automaticamente ao clicar em "Inserir Padrão" 
            durante o registro de evoluções. Você pode personalizar cada campo conforme sua preferência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subjetivo */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-[#0056A4] px-2 py-0.5 rounded text-xs font-bold">S</span>
              Subjetivo (Queixa / História)
            </Label>
            <Textarea
              rows={4}
              value={subjetivoPadrao}
              onChange={(e) => handleChange("subjetivo", e.target.value)}
              placeholder="Ex: Paciente refere:\n\nHistória da doença atual:\n"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Texto inicial para registro de queixas e história clínica do paciente.
            </p>
          </div>

          {/* Objetivo */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">O</span>
              Objetivo (Exame Físico)
            </Label>
            <Textarea
              rows={4}
              value={objetivoPadrao}
              onChange={(e) => handleChange("objetivo", e.target.value)}
              placeholder="Ex: Exame físico:\n- Estado geral: \n- Sinais vitais: \n- Abdome: \n"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Estrutura padrão para registro do exame físico e achados objetivos.
            </p>
          </div>

          {/* Avaliação */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">A</span>
              Avaliação (Diagnóstico)
            </Label>
            <Textarea
              rows={3}
              value={avaliacaoPadrao}
              onChange={(e) => handleChange("avaliacao", e.target.value)}
              placeholder="Ex: Hipóteses diagnósticas:\n1. \n\nCID-10: "
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Modelo para registro de hipóteses diagnósticas e CID-10.
            </p>
          </div>

          {/* Plano */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">P</span>
              Plano (Conduta)
            </Label>
            <Textarea
              rows={4}
              value={planoPadrao}
              onChange={(e) => handleChange("plano", e.target.value)}
              placeholder="Ex: Conduta:\n1. \n\nExames solicitados:\n\nRetorno: "
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Estrutura padrão para registro de conduta, prescrições e encaminhamentos.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Desfazer Alterações
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Textos Padrão"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dica de uso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> Os textos padrão configurados aqui aparecerão quando você clicar no botão 
            "Inserir Padrão" ao lado de cada campo durante o registro de uma evolução. 
            Você pode editar o texto inserido a qualquer momento durante o atendimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
