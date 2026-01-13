// DashboardLayout é aplicado globalmente no App.tsx
import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Plus, 
  Users, 
  Calendar, 
  DollarSign, 
  Heart, 
  LayoutGrid,
  TrendingUp,
  PieChart,
  BarChart3,
  Activity,
  RefreshCw,
  GripVertical,
  Maximize2,
  Save
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  WidgetGallery, 
  todasMetricas, 
  tamanhosPermitidos,
  custoSlots,
  MAX_SLOTS,
  type MetricaDefinicao, 
  type WidgetConfig, 
  type TamanhoWidget, 
  type CategoriaMetrica,
  type PeriodoTempo 
} from '@/components/WidgetGallery';

const periodos: { valor: PeriodoTempo; label: string }[] = [
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: '3m', label: '3 meses' },
  { valor: '6m', label: '6 meses' },
  { valor: '1a', label: '1 ano' },
  { valor: '3a', label: '3 anos' },
  { valor: '5a', label: '5 anos' },
  { valor: 'todo', label: 'Todo período' },
];

const categorias: { valor: CategoriaMetrica; label: string; cor: string; icone: React.ReactNode }[] = [
  { valor: 'populacao_pacientes', label: 'População de Pacientes', cor: '#3B82F6', icone: <Users className="h-4 w-4" /> },
  { valor: 'atendimentos', label: 'Atendimentos', cor: '#10B981', icone: <Calendar className="h-4 w-4" /> },
  { valor: 'economico_financeiro', label: 'Econômico-Financeiro', cor: '#F59E0B', icone: <DollarSign className="h-4 w-4" /> },
  { valor: 'qualidade_atendimento', label: 'Qualidade do Atendimento', cor: '#8B5CF6', icone: <Heart className="h-4 w-4" /> },
  { valor: 'diversas', label: 'Diversas', cor: '#EC4899', icone: <LayoutGrid className="h-4 w-4" /> },
];

const CORES_GRAFICOS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#14B8A6'];

const tamanhoClasses: Record<TamanhoWidget, string> = {
  micro: 'col-span-1',
  pequeno: 'col-span-1',
  medio: 'col-span-1 md:col-span-2',
  grande: 'col-span-1 md:col-span-2 lg:col-span-3',
};

const tamanhoAlturas: Record<TamanhoWidget, string> = {
  micro: 'h-[150px]',
  pequeno: 'h-[300px]',
  medio: 'h-[380px]',
  grande: 'h-[480px]',
};

// Componente de Widget Sortable
interface SortableWidgetProps {
  metrica: MetricaDefinicao;
  periodo: PeriodoTempo;
  config: WidgetConfig;
  onChangeTamanho: (tamanho: TamanhoWidget) => void;
  onChangePeriodo: (periodo: PeriodoTempo | undefined) => void;
  onOpenFullscreen: () => void;
}

function SortableWidget({ metrica, periodo, config, onChangeTamanho, onChangePeriodo, onOpenFullscreen }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metrica.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const periodoAtivo = config.periodoIndividual || periodo;
  const [showControls, setShowControls] = useState(false);
  
  // Obter tamanhos permitidos para esta métrica
  const tamanhosDisponiveis = tamanhosPermitidos[metrica.id] || ['pequeno', 'medio', 'grande'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${tamanhoClasses[config.tamanho]} ${tamanhoAlturas[config.tamanho]}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Card className="h-full relative group">
        {/* Controles do Widget */}
        <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Seletor de período individual */}
          <Select value={config.periodoIndividual || 'global'} onValueChange={(v) => onChangePeriodo(v === 'global' ? undefined : v as PeriodoTempo)}>
            <SelectTrigger className="h-7 w-20 text-xs bg-background/80 backdrop-blur-sm">
              <SelectValue placeholder="Global" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              {periodos.map(p => (
                <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Seletor de tamanho - apenas tamanhos permitidos */}
          <Select value={config.tamanho} onValueChange={(v) => onChangeTamanho(v as TamanhoWidget)}>
            <SelectTrigger className="h-7 w-20 text-xs bg-background/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tamanhosDisponiveis.includes('micro') && <SelectItem value="micro">Micro</SelectItem>}
              {tamanhosDisponiveis.includes('pequeno') && <SelectItem value="pequeno">Pequeno</SelectItem>}
              {tamanhosDisponiveis.includes('medio') && <SelectItem value="medio">Médio</SelectItem>}
              {tamanhosDisponiveis.includes('grande') && <SelectItem value="grande">Grande</SelectItem>}
            </SelectContent>
          </Select>
          
          {/* Botão tela cheia */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 bg-background/80 backdrop-blur-sm"
            onClick={onOpenFullscreen}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Handle de arraste */}
        <div
          {...attributes}
          {...listeners}
          className={`absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <CardHeader className={`pb-2 ${config.tamanho === 'micro' ? 'pt-2 pb-1' : 'pt-8'}`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`font-medium ${config.tamanho === 'micro' ? 'text-xs' : 'text-sm'}`}>{metrica.nome}</CardTitle>
            {config.tamanho !== 'micro' && (
              <Badge variant="outline" style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}>
                {categorias.find(c => c.valor === metrica.categoria)?.label.split(' ')[0]}
              </Badge>
            )}
          </div>
          {config.tamanho !== 'micro' && (
            <CardDescription className="text-xs">
              {metrica.descricao}
              {config.periodoIndividual && (
                <span className="ml-2 text-primary">({periodos.find(p => p.valor === config.periodoIndividual)?.label})</span>
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={`${config.tamanho === 'micro' ? 'h-[calc(100%-40px)]' : 'h-[calc(100%-80px)]'}`}>
          <MetricaConteudo metrica={metrica} periodo={periodoAtivo} tamanho={config.tamanho} />
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de conteúdo da métrica
function MetricaConteudo({ metrica, periodo, tamanho, isFullscreen = false }: { metrica: MetricaDefinicao; periodo: PeriodoTempo; tamanho: TamanhoWidget; isFullscreen?: boolean }) {
  // Buscar dados baseado no tipo de métrica
  const { data: pacTotalAtivos } = trpc.dashboardMetricas.pacTotalAtivos.useQuery(undefined, {
    enabled: metrica.id === 'pac_total_ativos',
  });
  
  const { data: pacDistribuicaoSexo } = trpc.dashboardMetricas.pacDistribuicaoSexo.useQuery(undefined, {
    enabled: metrica.id === 'pac_distribuicao_sexo',
  });
  
  const { data: pacFaixaEtaria } = trpc.dashboardMetricas.pacFaixaEtaria.useQuery(undefined, {
    enabled: metrica.id === 'pac_faixa_etaria',
  });
  
  const { data: pacDistribuicaoCidade } = trpc.dashboardMetricas.pacDistribuicaoCidade.useQuery(undefined, {
    enabled: metrica.id === 'pac_distribuicao_cidade',
  });
  
  const { data: pacDistribuicaoConvenio } = trpc.dashboardMetricas.pacDistribuicaoConvenio.useQuery(undefined, {
    enabled: metrica.id === 'pac_distribuicao_convenio',
  });
  
  const { data: pacTempoAcompanhamento } = trpc.dashboardMetricas.pacTempoAcompanhamento.useQuery(undefined, {
    enabled: metrica.id === 'pac_tempo_acompanhamento',
  });
  
  const { data: pacInativos } = trpc.dashboardMetricas.pacInativos.useQuery(undefined, {
    enabled: metrica.id === 'pac_inativos_periodo',
  });
  
  const { data: pacNovosPeriodo } = trpc.dashboardMetricas.pacNovosPeriodo.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_novos_periodo' }
  );
  
  const { data: pacTaxaRetencao } = trpc.dashboardMetricas.pacTaxaRetencao.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_taxa_retencao' }
  );
  
  const { data: pacObitos } = trpc.dashboardMetricas.pacObitos.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_obitos_periodo' }
  );
  
  const { data: atdTotalPeriodo } = trpc.dashboardMetricas.atdTotalPeriodo.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_total_periodo' }
  );
  
  const { data: atdEvolucaoTemporal } = trpc.dashboardMetricas.atdEvolucaoTemporal.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_evolucao_temporal' }
  );
  
  const { data: finFaturamentoTotal } = trpc.dashboardMetricas.finFaturamentoTotal.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_faturamento_total' }
  );
  
  const { data: finTaxaRecebimento } = trpc.dashboardMetricas.finTaxaRecebimento.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_taxa_recebimento' }
  );
  
  const { data: quaDiagnosticosFrequentes } = trpc.dashboardMetricas.quaDiagnosticosFrequentes.useQuery(
    { periodo },
    { enabled: metrica.id === 'qua_diagnosticos_frequentes' }
  );
  
  const { data: quaTaxaRetorno } = trpc.dashboardMetricas.quaTaxaRetorno.useQuery(
    { periodo },
    { enabled: metrica.id === 'qua_taxa_retorno' }
  );
  
  const { data: divAlertasPendentes } = trpc.dashboardMetricas.divAlertasPendentes.useQuery(undefined, {
    enabled: metrica.id === 'div_alertas_pendentes',
  });
  
  // Calcular altura do gráfico baseado no tamanho
  const chartHeight = isFullscreen ? 500 : (tamanho === 'micro' ? 60 : tamanho === 'pequeno' ? 160 : tamanho === 'medio' ? 220 : 320);
  const fontSize = tamanho === 'micro' ? 8 : tamanho === 'pequeno' ? 10 : 12;
  
  // Renderizar baseado no tipo de métrica
  if (metrica.id === 'pac_total_ativos' && pacTotalAtivos?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-2xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {pacTotalAtivos.valor.toLocaleString('pt-BR')}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">pacientes ativos</div>}
      </div>
    );
  }
  
  if (metrica.id === 'pac_inativos_periodo' && pacInativos?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-2xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {pacInativos.valor.toLocaleString('pt-BR')}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">pacientes inativos</div>}
      </div>
    );
  }
  
  if (metrica.id === 'pac_tempo_acompanhamento' && pacTempoAcompanhamento?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-2xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {pacTempoAcompanhamento.valor.toFixed(1)}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">anos em média</div>}
      </div>
    );
  }
  
  if (metrica.id === 'atd_total_periodo' && atdTotalPeriodo?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-2xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {atdTotalPeriodo.valor.toLocaleString('pt-BR')}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">atendimentos no período</div>}
      </div>
    );
  }
  
  if (metrica.id === 'fin_faturamento_total' && finFaturamentoTotal?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-xl' : 'text-3xl'}`} style={{ color: metrica.corPrimaria }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finFaturamentoTotal.valor)}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">faturamento no período</div>}
      </div>
    );
  }
  
  if (metrica.id === 'div_alertas_pendentes' && divAlertasPendentes?.valor !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`font-bold ${tamanho === 'micro' ? 'text-2xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {divAlertasPendentes.valor.toLocaleString('pt-BR')}
        </div>
        {tamanho !== 'micro' && <div className="text-muted-foreground mt-1">alertas pendentes</div>}
      </div>
    );
  }
  
  // Gauges
  if (metrica.tipoGrafico === 'gauge') {
    let valor = 0;
    if (metrica.id === 'pac_taxa_retencao' && pacTaxaRetencao?.valor !== undefined) valor = pacTaxaRetencao.valor;
    if (metrica.id === 'fin_taxa_recebimento' && finTaxaRecebimento?.valor !== undefined) valor = finTaxaRecebimento.valor;
    if (metrica.id === 'qua_taxa_retorno' && quaTaxaRetorno?.valor !== undefined) valor = quaTaxaRetorno.valor;
    
    const gaugeSize = tamanho === 'micro' ? 80 : tamanho === 'pequeno' ? 120 : tamanho === 'medio' ? 160 : 200;
    const strokeWidth = tamanho === 'micro' ? 8 : 12;
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <svg width={gaugeSize} height={gaugeSize * 0.6} viewBox="0 0 120 72">
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={metrica.corPrimaria}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(valor / 100) * 157} 157`}
          />
        </svg>
        <div className={`font-bold ${tamanho === 'micro' ? 'text-lg' : 'text-2xl'} -mt-4`} style={{ color: metrica.corPrimaria }}>
          {valor.toFixed(1)}%
        </div>
      </div>
    );
  }
  
  // Gráficos de Pizza
  if (metrica.tipoGrafico === 'pizza') {
    let dados: { nome: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_distribuicao_sexo' && pacDistribuicaoSexo?.dados) {
      dados = pacDistribuicaoSexo.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'pac_distribuicao_convenio' && pacDistribuicaoConvenio?.dados) {
      dados = pacDistribuicaoConvenio.dados as { nome: string; valor: number }[];
    }
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>;
    }
    
    const outerRadius = tamanho === 'micro' ? 25 : tamanho === 'pequeno' ? 50 : tamanho === 'medio' ? 70 : 90;
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsPieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="valor"
            nameKey="nome"
            label={tamanho !== 'micro' ? ({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%` : false}
            labelLine={tamanho !== 'micro'}
          >
            {dados.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
            ))}
          </Pie>
          {tamanho !== 'micro' && <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />}
          {tamanho === 'grande' && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  }
  
  // Gráficos de Barra
  if (metrica.tipoGrafico === 'barra') {
    let dados: { nome: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_faixa_etaria' && pacFaixaEtaria?.dados) {
      dados = pacFaixaEtaria.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'pac_distribuicao_cidade' && pacDistribuicaoCidade?.dados) {
      dados = (pacDistribuicaoCidade.dados as { nome: string; valor: number }[]).slice(0, tamanho === 'micro' ? 3 : tamanho === 'pequeno' ? 5 : 10);
    }
    if (metrica.id === 'qua_diagnosticos_frequentes' && quaDiagnosticosFrequentes?.dados) {
      dados = (quaDiagnosticosFrequentes.dados as { nome: string; valor: number }[]).slice(0, tamanho === 'micro' ? 3 : tamanho === 'pequeno' ? 5 : 10);
    }
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={dados} layout="vertical" margin={{ left: tamanho === 'micro' ? 40 : 60, right: 10 }}>
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis type="number" tick={{ fontSize }} />
          <YAxis dataKey="nome" type="category" tick={{ fontSize }} width={tamanho === 'micro' ? 35 : 55} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Bar dataKey="valor" fill={metrica.corPrimaria} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  // Gráficos de Área
  if (metrica.tipoGrafico === 'area') {
    let dados: { data: string; valor: number }[] = [];
    
    if (metrica.id === 'atd_evolucao_temporal' && atdEvolucaoTemporal?.dados) {
      dados = atdEvolucaoTemporal.dados as { data: string; valor: number }[];
    }
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={dados}>
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="data" tick={{ fontSize }} />
          <YAxis tick={{ fontSize }} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Area 
            type="monotone" 
            dataKey="valor" 
            stroke={metrica.corPrimaria} 
            fill={`${metrica.corPrimaria}40`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  
  // Gráficos de Linha
  if (metrica.tipoGrafico === 'linha') {
    let dados: { data: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_novos_periodo' && pacNovosPeriodo?.dados) {
      dados = pacNovosPeriodo.dados as { data: string; valor: number }[];
    }
    if (metrica.id === 'pac_obitos_periodo' && pacObitos?.dados) {
      dados = pacObitos.dados as { data: string; valor: number }[];
    }
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={dados}>
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="data" tick={{ fontSize }} />
          <YAxis tick={{ fontSize }} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Line 
            type="monotone" 
            dataKey="valor" 
            stroke={metrica.corPrimaria} 
            strokeWidth={2}
            dot={{ fill: metrica.corPrimaria, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  
  return <div className="flex items-center justify-center h-full text-muted-foreground">Carregando...</div>;
}

// Componente principal
export default function DashboardCustom() {
  const [periodo, setPeriodo] = useState<PeriodoTempo>('30d');
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([
    { id: 'pac_total_ativos', tamanho: 'pequeno' },
    { id: 'pac_novos_periodo', tamanho: 'pequeno' },
    { id: 'pac_distribuicao_sexo', tamanho: 'pequeno' },
    { id: 'pac_faixa_etaria', tamanho: 'pequeno' },
    { id: 'atd_total_periodo', tamanho: 'pequeno' },
    { id: 'fin_faturamento_total', tamanho: 'pequeno' },
  ]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  
  // Buscar configuração salva
  const { data: configSalva, isLoading: carregandoConfig } = trpc.dashboardMetricas.getConfig.useQuery();
  
  // Mutation para salvar configuração
  const salvarConfig = trpc.dashboardMetricas.saveConfig.useMutation();
  
  // Sensors para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Carregar configuração salva
  useEffect(() => {
    if (configSalva) {
      try {
        const metricas = JSON.parse(configSalva.metricasSelecionadas);
        if (Array.isArray(metricas) && metricas.length > 0) {
          // Converter formato antigo (array de IDs) para novo formato (array de WidgetConfig)
          const configs: WidgetConfig[] = [];
          const sizes = configSalva.widgetSizes ? JSON.parse(configSalva.widgetSizes) : {};
          const periods = configSalva.widgetPeriods ? JSON.parse(configSalva.widgetPeriods) : {};
          
          metricas.forEach((id: string) => {
            configs.push({
              id,
              tamanho: (sizes[id] as TamanhoWidget) || 'pequeno',
              periodoIndividual: periods[id] as PeriodoTempo | undefined,
            });
          });
          
          setWidgetConfigs(configs);
        }
        if (configSalva.periodoDefault) {
          setPeriodo(configSalva.periodoDefault as PeriodoTempo);
        }
      } catch (e) {
        console.error('Erro ao carregar configuração:', e);
      }
    }
  }, [configSalva]);
  
  // Calcular slots usados
  const slotsUsados = useMemo(() => {
    return widgetConfigs.reduce((acc, w) => acc + custoSlots[w.tamanho], 0);
  }, [widgetConfigs]);
  
  const metricasExibidas = widgetConfigs
    .map(config => {
      const metrica = todasMetricas.find(m => m.id === config.id);
      return metrica ? { metrica, config } : null;
    })
    .filter((item): item is { metrica: MetricaDefinicao; config: WidgetConfig } => item !== null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgetConfigs((items) => {
        const oldIndex = items.findIndex(w => w.id === active.id);
        const newIndex = items.findIndex(w => w.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getWidgetConfig = (id: string): WidgetConfig => {
    return widgetConfigs.find(w => w.id === id) || { id, tamanho: 'pequeno' };
  };

  const updateWidgetTamanho = (id: string, tamanho: TamanhoWidget) => {
    setWidgetConfigs(prev => prev.map(w => 
      w.id === id ? { ...w, tamanho } : w
    ));
  };

  const updateWidgetPeriodo = (id: string, periodoIndividual: PeriodoTempo | undefined) => {
    setWidgetConfigs(prev => prev.map(w => 
      w.id === id ? { ...w, periodoIndividual } : w
    ));
  };

  const handleSalvarConfig = (newWidgets: WidgetConfig[]) => {
    setWidgetConfigs(newWidgets);
    
    const widgetSizes: Record<string, string> = {};
    const widgetPeriods: Record<string, string> = {};
    
    newWidgets.forEach((config) => {
      widgetSizes[config.id] = config.tamanho;
      if (config.periodoIndividual) {
        widgetPeriods[config.id] = config.periodoIndividual;
      }
    });
    
    salvarConfig.mutate({
      metricasSelecionadas: JSON.stringify(newWidgets.map(w => w.id)),
      periodoDefault: periodo,
      widgetSizes: JSON.stringify(widgetSizes),
      widgetPeriods: JSON.stringify(widgetPeriods),
    });
  };

  const fullscreenMetrica = fullscreenWidget ? todasMetricas.find(m => m.id === fullscreenWidget) : null;

  if (carregandoConfig) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Modal de Tela Cheia */}
      <Dialog open={!!fullscreenWidget} onOpenChange={(open) => !open && setFullscreenWidget(null)}>
        <DialogContent className="max-w-5xl h-[80vh]">
          {fullscreenMetrica && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{fullscreenMetrica.nome}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{fullscreenMetrica.descricao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={getWidgetConfig(fullscreenMetrica.id).periodoIndividual || periodo} 
                      onValueChange={(v) => updateWidgetPeriodo(fullscreenMetrica.id, v as PeriodoTempo)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map(p => (
                          <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 mt-4">
                <MetricaConteudo 
                  metrica={fullscreenMetrica} 
                  periodo={getWidgetConfig(fullscreenMetrica.id).periodoIndividual || periodo}
                  tamanho="grande"
                  isFullscreen={true}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Widget Gallery Modal */}
      <WidgetGallery
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        selectedWidgets={widgetConfigs}
        onSave={handleSalvarConfig}
      />

      {/* Cabeçalho simplificado */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Botão de configurações - tamanho harmonizado com título */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setDialogAberto(true)}
          title="Configurar Widgets"
          className="h-8 w-8"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Instruções de uso */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <strong>Dica:</strong> Arraste os widgets pelo ícone <GripVertical className="h-4 w-4 inline" /> para reorganizar. 
        Passe o mouse sobre um widget para acessar controles de tamanho, período e tela cheia.
        Clique no ícone <Settings className="h-4 w-4 inline" /> para adicionar ou remover widgets.
      </div>
      
      {/* Grid de métricas com Drag-and-Drop */}
      {metricasExibidas.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum widget selecionado</h3>
          <p className="text-muted-foreground mb-4">
            Clique em "Configurar Widgets" para selecionar as métricas que deseja visualizar.
          </p>
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Widgets
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgetConfigs.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {metricasExibidas.map(({ metrica, config }) => (
                <SortableWidget
                  key={metrica.id}
                  metrica={metrica}
                  periodo={periodo}
                  config={config}
                  onChangeTamanho={(t) => updateWidgetTamanho(metrica.id, t)}
                  onChangePeriodo={(p) => updateWidgetPeriodo(metrica.id, p)}
                  onOpenFullscreen={() => setFullscreenWidget(metrica.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Resumo das categorias */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Métricas por Categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categorias.map(cat => {
            const qtdTotal = todasMetricas.filter(m => m.categoria === cat.valor).length;
            const qtdSelecionadas = widgetConfigs.filter(w => 
              todasMetricas.find(m => m.id === w.id)?.categoria === cat.valor
            ).length;
            
            return (
              <Card key={cat.valor} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${cat.cor}20` }}
                  >
                    {cat.icone}
                  </div>
                  <span className="font-medium text-sm">{cat.label.split(' ')[0]}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: cat.cor }}>
                  {qtdSelecionadas}/{qtdTotal}
                </div>
                <div className="text-xs text-muted-foreground">métricas ativas</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
