import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Save, RefreshCw, Calendar, MapPin } from "lucide-react";

// Tipos de compromisso disponíveis
const TIPOS_COMPROMISSO = [
  { value: "Consulta", label: "Consulta", corPadrao: "#3b82f6" },
  { value: "Cirurgia", label: "Cirurgia", corPadrao: "#ef4444" },
  { value: "Visita internado", label: "Visita Internado", corPadrao: "#8b5cf6" },
  { value: "Procedimento em consultório", label: "Procedimento em Consultório", corPadrao: "#f97316" },
  { value: "Exame", label: "Exame", corPadrao: "#22c55e" },
  { value: "Reunião", label: "Reunião", corPadrao: "#eab308" },
];

// Locais disponíveis
const LOCAIS = [
  "Consultório",
  "On-line",
  "HMV",
  "Santa Casa",
  "HMD",
  "HMD CG",
];

// Opções de duração em minutos
const OPCOES_DURACAO = [
  { value: 15, label: "15 minutos" },
  { value: 20, label: "20 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
];

interface ConfiguracaoDuracao {
  tipoCompromisso: string;
  duracaoMinutos: number;
  localPadrao: string | null;
  cor: string | null;
}

export function AgendaSettings() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoDuracao[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Buscar configurações atuais
  const { data: configsData, isLoading, refetch } = trpc.agenda.getConfiguracoesDuracao.useQuery();

  // Mutation para salvar configurações
  const updateConfigs = trpc.agenda.updateConfiguracoesDuracao.useMutation({
    onSuccess: () => {
      toast.success("Configurações de duração salvas com sucesso!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });

  // Inicializar configurações quando carregar
  useEffect(() => {
    if (configsData) {
      // Mapear dados do backend para o formato local
      const configsMap = new Map(
        configsData.map((c) => [c.tipoCompromisso, c])
      );

      // Criar array com todos os tipos, usando dados do backend ou valores padrão
      const configs = TIPOS_COMPROMISSO.map((tipo) => {
        const existing = configsMap.get(tipo.value);
        return {
          tipoCompromisso: tipo.value,
          duracaoMinutos: existing?.duracaoMinutos || 30,
          localPadrao: existing?.localPadrao || null,
          cor: existing?.cor || tipo.corPadrao,
        };
      });

      setConfiguracoes(configs);
    }
  }, [configsData]);

  const handleDuracaoChange = (tipoCompromisso: string, duracao: number) => {
    setConfiguracoes((prev) =>
      prev.map((c) =>
        c.tipoCompromisso === tipoCompromisso
          ? { ...c, duracaoMinutos: duracao }
          : c
      )
    );
    setHasChanges(true);
  };

  const handleLocalChange = (tipoCompromisso: string, local: string | null) => {
    setConfiguracoes((prev) =>
      prev.map((c) =>
        c.tipoCompromisso === tipoCompromisso
          ? { ...c, localPadrao: local }
          : c
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfigs.mutate(configuracoes);
  };

  const handleReset = () => {
    refetch();
    setHasChanges(false);
    toast.info("Configurações recarregadas");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duração Padrão por Tipo de Compromisso
          </CardTitle>
          <CardDescription>
            Configure a duração padrão e o local para cada tipo de agendamento.
            Essas configurações serão aplicadas automaticamente ao criar novos compromissos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabela de configurações */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo de Compromisso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Duração Padrão</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Local Padrão</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {configuracoes.map((config) => {
                  const tipoInfo = TIPOS_COMPROMISSO.find(
                    (t) => t.value === config.tipoCompromisso
                  );
                  return (
                    <tr key={config.tipoCompromisso} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.cor || tipoInfo?.corPadrao }}
                          />
                          <span className="font-medium">{tipoInfo?.label || config.tipoCompromisso}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={config.duracaoMinutos.toString()}
                          onValueChange={(v) =>
                            handleDuracaoChange(config.tipoCompromisso, parseInt(v))
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_DURACAO.map((opcao) => (
                              <SelectItem key={opcao.value} value={opcao.value.toString()}>
                                {opcao.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={config.localPadrao || ""}
                          onValueChange={(v) =>
                            handleLocalChange(config.tipoCompromisso, v || null)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {LOCAIS.map((local) => (
                              <SelectItem key={local} value={local}>
                                {local}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Descartar Alterações
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateConfigs.isPending}
            >
              {updateConfigs.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card informativo */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                Como funciona
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Ao criar um novo agendamento, o sistema aplicará automaticamente a duração
                e o local configurados para o tipo de compromisso selecionado. Você ainda
                poderá ajustar esses valores manualmente em cada agendamento individual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
