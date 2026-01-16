import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, GripVertical, Search, FlaskConical, Heart, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// Lista de exames comuns pré-definidos
const EXAMES_SUGERIDOS = [
  // Hemograma
  { nome: "Hemoglobina", categoria: "Hemograma" },
  { nome: "Hematócrito", categoria: "Hemograma" },
  { nome: "Hemácias", categoria: "Hemograma" },
  { nome: "Leucócitos", categoria: "Hemograma" },
  { nome: "Plaquetas", categoria: "Hemograma" },
  { nome: "VCM", categoria: "Hemograma" },
  { nome: "HCM", categoria: "Hemograma" },
  { nome: "CHCM", categoria: "Hemograma" },
  { nome: "RDW", categoria: "Hemograma" },
  
  // Função Hepática
  { nome: "TGO", categoria: "Função Hepática" },
  { nome: "TGP", categoria: "Função Hepática" },
  { nome: "AST", categoria: "Função Hepática" },
  { nome: "ALT", categoria: "Função Hepática" },
  { nome: "Gama GT", categoria: "Função Hepática" },
  { nome: "Fosfatase Alcalina", categoria: "Função Hepática" },
  { nome: "Bilirrubina Total", categoria: "Função Hepática" },
  { nome: "Bilirrubina Direta", categoria: "Função Hepática" },
  { nome: "Bilirrubina Indireta", categoria: "Função Hepática" },
  
  // Função Renal
  { nome: "Creatinina", categoria: "Função Renal" },
  { nome: "Ureia", categoria: "Função Renal" },
  { nome: "Ácido Úrico", categoria: "Função Renal" },
  { nome: "TFG", categoria: "Função Renal" },
  
  // Perfil Lipídico
  { nome: "Colesterol Total", categoria: "Perfil Lipídico" },
  { nome: "HDL", categoria: "Perfil Lipídico" },
  { nome: "LDL", categoria: "Perfil Lipídico" },
  { nome: "VLDL", categoria: "Perfil Lipídico" },
  { nome: "Triglicerídeos", categoria: "Perfil Lipídico" },
  
  // Glicemia
  { nome: "Glicose", categoria: "Glicemia" },
  { nome: "Glicemia de Jejum", categoria: "Glicemia" },
  { nome: "Hemoglobina Glicada", categoria: "Glicemia" },
  { nome: "HbA1c", categoria: "Glicemia" },
  
  // Hormônios
  { nome: "TSH", categoria: "Hormônios" },
  { nome: "T4 Livre", categoria: "Hormônios" },
  { nome: "T3", categoria: "Hormônios" },
  { nome: "Insulina", categoria: "Hormônios" },
  { nome: "Cortisol", categoria: "Hormônios" },
  
  // Eletrólitos
  { nome: "Sódio", categoria: "Eletrólitos" },
  { nome: "Potássio", categoria: "Eletrólitos" },
  { nome: "Cálcio", categoria: "Eletrólitos" },
  { nome: "Magnésio", categoria: "Eletrólitos" },
  { nome: "Fósforo", categoria: "Eletrólitos" },
  
  // Coagulação
  { nome: "TP", categoria: "Coagulação" },
  { nome: "INR", categoria: "Coagulação" },
  { nome: "TTPA", categoria: "Coagulação" },
  { nome: "Fibrinogênio", categoria: "Coagulação" },
  
  // Marcadores
  { nome: "PCR", categoria: "Marcadores Inflamatórios" },
  { nome: "VHS", categoria: "Marcadores Inflamatórios" },
  { nome: "Ferritina", categoria: "Metabolismo do Ferro" },
  { nome: "Ferro Sérico", categoria: "Metabolismo do Ferro" },
  { nome: "Vitamina D", categoria: "Vitaminas" },
  { nome: "Vitamina B12", categoria: "Vitaminas" },
  { nome: "Ácido Fólico", categoria: "Vitaminas" },
  
  // Proteínas
  { nome: "Albumina", categoria: "Proteínas" },
  { nome: "Proteínas Totais", categoria: "Proteínas" },
  
  // Marcadores Tumorais
  { nome: "PSA Total", categoria: "Marcadores Tumorais" },
  { nome: "PSA Livre", categoria: "Marcadores Tumorais" },
  { nome: "CEA", categoria: "Marcadores Tumorais" },
  { nome: "CA 125", categoria: "Marcadores Tumorais" },
  { nome: "CA 19-9", categoria: "Marcadores Tumorais" },
  { nome: "AFP", categoria: "Marcadores Tumorais" },
];

export default function ExamesFavoritos() {
  const [busca, setBusca] = useState("");
  const [novoExame, setNovoExame] = useState("");
  
  const { data: favoritos, isLoading, refetch } = trpc.examesFavoritos.list.useQuery();
  const addMutation = trpc.examesFavoritos.add.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Exame adicionado aos favoritos");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const removeMutation = trpc.examesFavoritos.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Exame removido dos favoritos");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleAddExame = (nome: string, categoria?: string) => {
    addMutation.mutate({ nomeExame: nome, categoria });
  };
  
  const handleRemoveExame = (nome: string) => {
    removeMutation.mutate({ nomeExame: nome });
  };
  
  const handleAddCustomExame = () => {
    if (novoExame.trim()) {
      handleAddExame(novoExame.trim());
      setNovoExame("");
    }
  };
  
  const favoritosNomes = new Set(favoritos?.map(f => f.nomeExame) || []);
  
  const examesFiltrados = EXAMES_SUGERIDOS.filter(
    e => e.nome.toLowerCase().includes(busca.toLowerCase()) ||
         e.categoria.toLowerCase().includes(busca.toLowerCase())
  );
  
  // Agrupar exames por categoria
  const examesPorCategoria = examesFiltrados.reduce((acc, exame) => {
    if (!acc[exame.categoria]) {
      acc[exame.categoria] = [];
    }
    acc[exame.categoria].push(exame);
    return acc;
  }, {} as Record<string, typeof EXAMES_SUGERIDOS>);
  
  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Exames Favoritos</h1>
            <p className="text-muted-foreground">
              Selecione os exames que você deseja acompanhar no fluxograma laboratorial
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exames Selecionados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Meus Exames Favoritos
              </CardTitle>
              <CardDescription>
                {favoritos?.length || 0} exames selecionados para acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : favoritos && favoritos.length > 0 ? (
                <div className="space-y-2">
                  {favoritos.map((exame) => (
                    <div
                      key={exame.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="font-medium">{exame.nomeExame}</span>
                        {exame.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {exame.categoria}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        tooltip="Fechar" onClick={() => handleRemoveExame(exame.nomeExame)}
                        disabled={removeMutation.isPending}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum exame favorito selecionado</p>
                  <p className="text-sm">Selecione exames da lista ao lado</p>
                </div>
              )}
              
              {/* Adicionar exame personalizado */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Adicionar exame personalizado:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do exame..."
                    value={novoExame}
                    onChange={(e) => setNovoExame(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomExame()}
                  />
                  <Button
                    onClick={handleAddCustomExame}
                    disabled={!novoExame.trim() || addMutation.isPending}
                   tooltip="Adicionar">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de Exames Sugeridos */}
          <Card>
            <CardHeader>
              <CardTitle>Exames Disponíveis</CardTitle>
              <CardDescription>
                Clique para adicionar aos favoritos
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar exame..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {Object.entries(examesPorCategoria).map(([categoria, exames]) => (
                <div key={categoria} className="mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    {categoria}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exames.map((exame) => {
                      const isFavorito = favoritosNomes.has(exame.nome);
                      return (
                        <Badge
                          key={exame.nome}
                          variant={isFavorito ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            isFavorito
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-primary/10"
                          }`}
                          onClick={() => {
                            if (isFavorito) {
                              handleRemoveExame(exame.nome);
                            } else {
                              handleAddExame(exame.nome, exame.categoria);
                            }
                          }}
                        >
                          {isFavorito && <span className="mr-1">✓</span>}
                          {exame.nome}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Instruções */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Como funciona?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Selecione os exames que você deseja acompanhar regularmente</li>
              <li>• Ao fazer upload de um laudo laboratorial, o sistema buscará apenas esses exames</li>
              <li>• Os resultados serão exibidos no fluxograma do prontuário do paciente</li>
              <li>• Você pode adicionar exames personalizados que não estão na lista</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
