import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  TrendingDown,
  PieChart,
  BarChart3,
  Activity,
  RefreshCw,
  GripVertical,
  Maximize2,
  Save,
  UserPlus,
  UserMinus,
  Clock,
  Receipt,
  CalendarCheck,
  Percent,
  X,
  MoreVertical,
  Scaling
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
import { cn } from '@/lib/utils';

// ============================================
// GORGEN DESIGN SYSTEM - Configurações
// ============================================

const periodos: { valor: PeriodoTempo; label: string }[] = [
  { valor: '7d', label: 'Últimos 7 dias' },
  { valor: '30d', label: 'Últimos 30 dias' },
  { valor: '3m', label: 'Últimos 3 meses' },
  { valor: '6m', label: 'Últimos 6 meses' },
  { valor: '1a', label: 'Último ano' },
  { valor: '3a', label: 'Últimos 3 anos' },
  { valor: '5a', label: 'Últimos 5 anos' },
  { valor: 'todo', label: 'Todo período' },
];

// Gorgen Design System - Cores das Categorias
const categorias: { valor: CategoriaMetrica; label: string; cor: string; icone: React.ReactNode }[] = [
  { valor: 'populacao_pacientes', label: 'População de Pacientes', cor: '#203864', icone: <Users className="h-4 w-4" /> },
  { valor: 'atendimentos', label: 'Atendimentos', cor: '#10B981', icone: <Calendar className="h-4 w-4" /> },
  { valor: 'economico_financeiro', label: 'Econômico-Financeiro', cor: '#F59E0B', icone: <DollarSign className="h-4 w-4" /> },
  { valor: 'qualidade_atendimento', label: 'Qualidade do Atendimento', cor: '#8B5CF6', icone: <Heart className="h-4 w-4" /> },
  { valor: 'diversas', label: 'Diversas', cor: '#DC6B4A', icone: <LayoutGrid className="h-4 w-4" /> },
];

// Gorgen Design System - Cores para Gráficos
const CORES_GRAFICOS = [
  '#203864', // Azul Gorgen 700 (principal)
  '#3B5F96', // Azul Gorgen 500
  '#5A7DB0', // Azul Gorgen 400
  '#10B981', // Verde (sucesso)
  '#F59E0B', // Âmbar (alerta)
  '#DC6B4A', // Coral Gorgen (accent)
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#6B7280', // Cinza
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Função para agrupar widgets micro em pares verticais
function agruparWidgetsMicro(items: { metrica: MetricaDefinicao; config: WidgetConfig }[]) {
  const resultado: (
    | { tipo: 'normal'; metrica: MetricaDefinicao; config: WidgetConfig }
    | { tipo: 'par_micro'; widgets: { metrica: MetricaDefinicao; config: WidgetConfig }[] }
  )[] = [];

  let bufferMicro: { metrica: MetricaDefinicao; config: WidgetConfig } | null = null;

  items.forEach((item) => {
    if (item.config.tamanho === 'micro') {
      if (bufferMicro) {
        // Temos um par completo
        resultado.push({
          tipo: 'par_micro',
          widgets: [bufferMicro, item]
        });
        bufferMicro = null;
      } else {
        // Primeiro do par
        bufferMicro = item;
      }
    } else {
      // Se tiver um micro pendente, adiciona ele sozinho (vai ocupar metade do slot visualmente)
      if (bufferMicro) {
        resultado.push({
          tipo: 'par_micro',
          widgets: [bufferMicro]
        });
        bufferMicro = null;
      }
      // Adiciona widget normal
      resultado.push({
        tipo: 'normal',
        metrica: item.metrica,
        config: item.config
      });
    }
  });

  // Se sobrou um micro no final
  if (bufferMicro) {
    resultado.push({
      tipo: 'par_micro',
      widgets: [bufferMicro]
    });
  }

  return resultado;
}

// ============================================
// KPI PANEL - Painel de Voo (CORRIGIDO)
// ============================================

interface KPIData {
  id: string;
  label: string;
  value: string | number;
  description: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function KPICard({ kpi, isLoading }: { kpi: KPIData; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-5 w-28" />
      </Card>
    );
  }

  return (
    <Card className="p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {kpi.label}
        </span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', kpi.iconBg)}>
          <span className={kpi.iconColor}>{kpi.icon}</span>
        </div>
      </div>

      <div className="text-[32px] font-bold text-gorgen-700 leading-tight tracking-tight">
        {kpi.value}
      </div>

      <div className="text-sm text-muted-foreground mt-1">
        {kpi.description}
      </div>

      {kpi.change && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded mt-2',
          kpi.change.isPositive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        )}>
          {kpi.change.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {kpi.change.isPositive ? '+' : ''}{kpi.change.value}% vs. período anterior
        </div>
      )}
    </Card>
  );
}

// KPIPanel agora usa os dados corretos do dashboard.stats com indicadores de variação
function KPIPanel({ stats, periodo, isLoading }: { stats: any; periodo: PeriodoTempo; isLoading: boolean }) {
  // Calcular taxa de recebimento
  const taxaRecebimento = stats?.faturamentoPrevisto > 0 
    ? (stats.faturamentoRealizado / stats.faturamentoPrevisto) * 100 
    : 0;

  const kpis: KPIData[] = [
    {
      id: 'faturamento',
      label: 'Faturamento Total',
      value: stats?.faturamentoPrevisto 
        ? `R$ ${Number(stats.faturamentoPrevisto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'R$ 0,00',
      description: 'faturamento previsto',
      change: stats?.faturamentoVariacao !== undefined && stats?.faturamentoVariacao !== 0 ? {
        value: Math.abs(stats.faturamentoVariacao),
        isPositive: stats.faturamentoVariacao >= 0,
      } : undefined,
      icon: <DollarSign className="w-[18px] h-[18px]" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'pacientes',
      label: 'Pacientes Ativos',
      value: stats?.pacientesAtivos?.toLocaleString('pt-BR') || '0',
      description: `de ${stats?.totalPacientes?.toLocaleString('pt-BR') || '0'} cadastrados`,
      change: undefined, // Pacientes não têm variação por período
      icon: <Users className="w-[18px] h-[18px]" />,
      iconBg: 'bg-gorgen-100',
      iconColor: 'text-gorgen-700',
    },
    {
      id: 'atendimentos',
      label: 'Atendimentos',
      value: stats?.totalAtendimentos?.toLocaleString('pt-BR') || '0',
      description: 'total de atendimentos',
      change: stats?.atendimentosVariacao !== undefined && stats?.atendimentosVariacao !== 0 ? {
        value: Math.abs(stats.atendimentosVariacao),
        isPositive: stats.atendimentosVariacao >= 0,
      } : undefined,
      icon: <CalendarCheck className="w-[18px] h-[18px]" />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'taxa_recebimento',
      label: 'Taxa de Recebimento',
      value: `${taxaRecebimento.toFixed(1)}%`,
      description: `R$ ${Number(stats?.faturamentoRealizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido`,
      change: undefined, // Taxa de recebimento é calculada, não tem variação direta
      icon: <Percent className="w-[18px] h-[18px]" />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}

// ============================================
// MICRO WIDGET - Para métricas numéricas
// ============================================

interface MicroWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  categoria?: CategoriaMetrica;
  onRemove?: () => void;
}

function MicroWidget({ label, value, unit, icon, categoria, onRemove }: MicroWidgetProps) {
  const cat = categorias.find(c => c.valor === categoria);
  
  return (
    <Card className="p-4 h-[150px] transition-all duration-200 hover:shadow-sm group relative">
      {/* Botão de exclusão */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-no-dnd="true"
          title="Remover widget"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1 truncate">
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gorgen-700 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </span>
            {unit && (
              <span className="text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ 
            backgroundColor: cat ? `${cat.cor}15` : '#20386415',
            color: cat?.cor || '#203864'
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// SORTABLE WIDGET - Widget com drag-and-drop
// ============================================

interface SortableWidgetProps {
  metrica: MetricaDefinicao;
  periodo: PeriodoTempo;
  config: WidgetConfig;
  onChangeTamanho: (tamanho: TamanhoWidget) => void;
  onChangePeriodo: (periodo: PeriodoTempo | undefined) => void;
  onOpenFullscreen: () => void;
  onRemove: () => void;
}

function SortableWidget({ 
  metrica, 
  periodo, 
  config,
  onChangeTamanho,
  onChangePeriodo,
  onOpenFullscreen,
  onRemove
}: SortableWidgetProps) {
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
  };

  const tamanho = config.tamanho;
  const periodoWidget = config.periodoIndividual || periodo;
  
  // Classes de tamanho para o grid
  const tamanhoClasses: Record<TamanhoWidget, string> = {
    micro: 'col-span-1',
    pequeno: 'col-span-1 h-[320px]',
    medio: 'col-span-2 h-[320px]',
    grande: 'col-span-3 h-[400px]',
  };

  // Encontrar a categoria para a cor do badge
  const categoria = categorias.find(c => c.valor === metrica.categoria);

  // Renderização especial para widgets micro
  if (tamanho === 'micro') {
    return (
      <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50 z-50')}>
        <MicroWidget
          label={metrica.nome}
          value={0}
          unit={metrica.unidade}
          icon={categoria?.icone || <LayoutGrid className="h-5 w-5" />}
          categoria={metrica.categoria}
          onRemove={onRemove}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        tamanhoClasses[tamanho],
        isDragging && 'opacity-50 z-50',
      )}
    >
      <Card className="h-full flex flex-col group relative overflow-hidden transition-all duration-200 hover:shadow-md">
        {/* Header do Widget */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <h3 className="font-semibold text-sm truncate">{metrica.nome}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{metrica.descricao}</p>
          </div>
          
          {/* Badge de categoria com cor correta */}
          <Badge 
            variant="secondary" 
            className="text-[10px] px-2 py-0.5 shrink-0"
            style={{ 
              backgroundColor: `${categoria?.cor}15`,
              color: categoria?.cor,
            }}
          >
            {categoria?.label.split(' ')[0]}
          </Badge>
        </div>

        {/* Controles on-hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Opções do widget"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tamanho</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onChangeTamanho('micro')} disabled={tamanho === 'micro'}>
                <Scaling className="mr-2 h-4 w-4" /> Micro (0.5 col)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeTamanho('pequeno')} disabled={tamanho === 'pequeno'}>
                <Scaling className="mr-2 h-4 w-4" /> Pequeno (1 col)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeTamanho('medio')} disabled={tamanho === 'medio'}>
                <Scaling className="mr-2 h-4 w-4" /> Médio (2 col)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeTamanho('grande')} disabled={tamanho === 'grande'}>
                <Scaling className="mr-2 h-4 w-4" /> Grande (3 col)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onOpenFullscreen}
            title="Expandir widget"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            data-no-dnd="true"
            title="Remover widget"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Conteúdo do Widget */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          <MetricaConteudo 
            metrica={metrica} 
            periodo={periodoWidget}
            tamanho={tamanho}
          />
        </div>
      </Card>
    </div>
  );
}

// ============================================
// MÉTRICA CONTEÚDO - Renderização do conteúdo
// ============================================

function MetricaConteudo({ 
  metrica, 
  periodo, 
  tamanho,
  isFullscreen = false
}: { 
  metrica: MetricaDefinicao; 
  periodo: PeriodoTempo;
  tamanho: TamanhoWidget;
  isFullscreen?: boolean;
}) {
  // Queries para buscar dados das métricas
  const { data: pacTotalAtivos } = trpc.dashboardMetricas.pacTotalAtivos.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_total_ativos' }
  );
  const { data: pacNovosPeriodo } = trpc.dashboardMetricas.pacNovosPeriodo.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_novos_periodo' }
  );
  const { data: pacDistribuicaoSexo } = trpc.dashboardMetricas.pacDistribuicaoSexo.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_distribuicao_sexo' }
  );
  const { data: pacFaixaEtaria } = trpc.dashboardMetricas.pacFaixaEtaria.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_faixa_etaria' }
  );
  const { data: pacDistribuicaoCidade } = trpc.dashboardMetricas.pacDistribuicaoCidade.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_distribuicao_cidade' }
  );
  const { data: pacDistribuicaoConvenio } = trpc.dashboardMetricas.pacDistribuicaoConvenio.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_distribuicao_convenio' }
  );
  const { data: pacInativos } = trpc.dashboardMetricas.pacInativos.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_inativos_periodo' }
  );
  const { data: pacObitos } = trpc.dashboardMetricas.pacObitos.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_obitos_periodo' }
  );
  const { data: pacTaxaRetencao } = trpc.dashboardMetricas.pacTaxaRetencao.useQuery(
    { periodo },
    { enabled: metrica.id === 'pac_taxa_retencao' }
  );
  const { data: pacTempoAcompanhamento } = trpc.dashboardMetricas.pacTempoAcompanhamento.useQuery(
    undefined,
    { enabled: metrica.id === 'pac_tempo_acompanhamento' }
  );
  const { data: atdTotalPeriodo } = trpc.dashboardMetricas.atdTotalPeriodo.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_total_periodo' }
  );
  const { data: atdEvolucaoTemporal } = trpc.dashboardMetricas.atdEvolucaoTemporal.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_evolucao_temporal' }
  );
  const { data: atdPorTipo } = trpc.dashboardMetricas.atdPorTipo.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_por_tipo' }
  );
  const { data: atdPorLocal } = trpc.dashboardMetricas.atdPorLocal.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_por_local' }
  );
  const { data: atdPorConvenio } = trpc.dashboardMetricas.atdPorConvenio.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_por_convenio' }
  );
  const { data: finFaturamentoTotal } = trpc.dashboardMetricas.finFaturamentoTotal.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_faturamento_total' }
  );
  const { data: finFaturamentoConvenio } = trpc.dashboardMetricas.finFaturamentoConvenio.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_faturamento_convenio' }
  );
  const { data: finTicketMedio } = trpc.dashboardMetricas.finTicketMedio.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_ticket_medio' }
  );
  const { data: finTaxaRecebimento } = trpc.dashboardMetricas.finTaxaRecebimento.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_taxa_recebimento' }
  );
  const { data: quaDiagnosticosFrequentes } = trpc.dashboardMetricas.quaDiagnosticosFrequentes.useQuery(
    { periodo },
    { enabled: metrica.id === 'qua_diagnosticos_frequentes' }
  );

  // Configurações de tamanho
  const chartHeight = isFullscreen ? 400 : tamanho === 'micro' ? 60 : tamanho === 'pequeno' ? 180 : tamanho === 'medio' ? 200 : 280;
  const fontSize = tamanho === 'micro' ? 10 : 11;

  // Métricas numéricas
  if (metrica.tipoGrafico === 'numero') {
    let valor: number | string = 0;
    let unidade = metrica.unidade || '';
    
    if (metrica.id === 'pac_total_ativos' && pacTotalAtivos) {
      valor = pacTotalAtivos.valor;
    }
    if (metrica.id === 'pac_inativos_periodo' && pacInativos) {
      valor = pacInativos.valor;
    }
    if (metrica.id === 'pac_tempo_acompanhamento' && pacTempoAcompanhamento) {
      valor = pacTempoAcompanhamento.valor;
    }
    if (metrica.id === 'atd_total_periodo' && atdTotalPeriodo) {
      valor = atdTotalPeriodo.valor;
    }
    if (metrica.id === 'fin_faturamento_total' && finFaturamentoTotal) {
      valor = `R$ ${Number(finFaturamentoTotal.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      unidade = '';
    }
    if (metrica.id === 'fin_ticket_medio' && finTicketMedio) {
      valor = `R$ ${Number(finTicketMedio.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      unidade = '';
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className={cn(
          "font-bold text-gorgen-700",
          tamanho === 'micro' ? 'text-2xl' : 'text-4xl'
        )}>
          {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
        </div>
        {unidade && (
          <div className="text-sm text-muted-foreground mt-1">{unidade}</div>
        )}
      </div>
    );
  }
  
  // Gráficos de Gauge
  if (metrica.tipoGrafico === 'gauge') {
    let valor = 0;
    
    if (metrica.id === 'fin_taxa_recebimento' && finTaxaRecebimento) {
      valor = finTaxaRecebimento.valor;
    }
    if (metrica.id === 'pac_taxa_retencao' && pacTaxaRetencao) {
      valor = pacTaxaRetencao.valor;
    }
    
    const data = [
      { name: 'Valor', value: valor },
      { name: 'Restante', value: 100 - valor },
    ];
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="70%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#203864" />
              <Cell fill="#E5E7EB" />
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="text-3xl font-bold text-gorgen-700 -mt-8">{valor.toFixed(1)}%</div>
        <div className="text-sm text-muted-foreground">{metrica.unidade}</div>
      </div>
    );
  }
  
  // Gráficos de Pizza - COM LABELS CUSTOMIZADOS (formato: xx (yy%))
  if (metrica.tipoGrafico === 'pizza') {
    let dadosOriginais: { nome: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_distribuicao_sexo' && pacDistribuicaoSexo?.dados) {
      dadosOriginais = pacDistribuicaoSexo.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'pac_distribuicao_convenio' && pacDistribuicaoConvenio?.dados) {
      dadosOriginais = pacDistribuicaoConvenio.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'atd_por_tipo' && atdPorTipo?.dados) {
      dadosOriginais = atdPorTipo.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'fin_faturamento_convenio' && finFaturamentoConvenio?.dados) {
      // Converter dados de faturamento por convênio para o formato padrão
      dadosOriginais = (finFaturamentoConvenio.dados as unknown as { convenio: string; valor: number }[]).map(item => ({
        nome: item.convenio,
        valor: item.valor
      }));
    }
    
    if (dadosOriginais.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>;
    }
    
    // Agrupar categorias menores que 5% em "Outros"
    const total = dadosOriginais.reduce((acc, item) => acc + item.valor, 0);
    const dadosAgrupados: { nome: string; valor: number }[] = [];
    let outrosValor = 0;
    
    dadosOriginais.forEach(item => {
      const percentual = (item.valor / total) * 100;
      if (percentual >= 5) {
        dadosAgrupados.push(item);
      } else {
        outrosValor += item.valor;
      }
    });
    
    if (outrosValor > 0) {
      dadosAgrupados.push({ nome: 'Outros', valor: outrosValor });
    }
    
    const dados = dadosAgrupados;
    
    // Função para renderizar label customizado no formato "xx (yy%)"
    const renderCustomLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
      index,
    }: {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      value: number;
      index: number;
    }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const percentual = ((value / total) * 100).toFixed(1);
      
      // Só mostrar label se o setor for grande o suficiente (>= 10%)
      if (parseFloat(percentual) < 10) return null;
      
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: tamanho === 'pequeno' ? '9px' : '11px', fontWeight: 600 }}
        >
          <tspan x={x} dy="-0.4em">{value.toLocaleString('pt-BR')}</tspan>
          <tspan x={x} dy="1.2em">({percentual}%)</tspan>
        </text>
      );
    };
    
    // Função para formatar a legenda com valor e percentual
    const formatLegend = (value: string, entry: any) => {
      const item = dados.find(d => d.nome === value);
      if (item) {
        const percentual = ((item.valor / total) * 100).toFixed(1);
        return (
          <span className="text-xs">
            {value}: {item.valor.toLocaleString('pt-BR')} ({percentual}%)
          </span>
        );
      }
      return <span className="text-xs">{value}</span>;
    };
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsPieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={tamanho === 'micro' ? 15 : tamanho === 'pequeno' ? 30 : 50}
            outerRadius={tamanho === 'micro' ? 25 : tamanho === 'pequeno' ? 55 : 80}
            dataKey="valor"
            nameKey="nome"
            stroke="none"
            label={tamanho !== 'micro' ? renderCustomLabel : undefined}
            labelLine={false}
          >
            {dados.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
            ))}
          </Pie>
          {tamanho !== 'micro' && (
            <Legend 
              layout="vertical" 
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: '10px', fontSize: '11px' }}
              formatter={formatLegend}
            />
          )}
          <Tooltip 
            formatter={(value: number) => {
              const percentual = ((value / total) * 100).toFixed(1);
              return `${value.toLocaleString('pt-BR')} (${percentual}%)`;
            }} 
          />
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
    if (metrica.id === 'atd_por_local' && atdPorLocal?.dados) {
      dados = atdPorLocal.dados as { nome: string; valor: number }[];
    }
    if (metrica.id === 'atd_por_convenio' && atdPorConvenio?.dados) {
      // Converter dados de atendimentos por convênio para o formato padrão
      dados = (atdPorConvenio.dados as unknown as { convenio: string; quantidade: number }[]).map(item => ({
        nome: item.convenio,
        valor: item.quantidade
      })).slice(0, 5);
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
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis type="number" tick={{ fontSize }} />
          <YAxis dataKey="nome" type="category" tick={{ fontSize }} width={tamanho === 'micro' ? 35 : 55} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Bar dataKey="valor" fill="#203864" radius={[0, 4, 4, 0]} />
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
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis dataKey="data" tick={{ fontSize }} />
          <YAxis tick={{ fontSize }} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Area 
            type="monotone" 
            dataKey="valor" 
            stroke="#203864"
            fill="#20386420"
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
          {tamanho !== 'micro' && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis dataKey="data" tick={{ fontSize }} />
          <YAxis tick={{ fontSize }} />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
          <Line 
            type="monotone" 
            dataKey="valor" 
            stroke="#203864"
            strokeWidth={2}
            dot={{ fill: '#203864', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  
  return <div className="flex items-center justify-center h-full text-muted-foreground">Carregando...</div>;
}



// ============================================
// COMPONENTE PRINCIPAL - Dashboard
// ============================================

export default function DashboardCustom() {
  const [periodo, setPeriodo] = useState<PeriodoTempo>('30d');
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([
    { id: 'atd_evolucao_temporal', tamanho: 'medio' },
    { id: 'pac_novos_periodo', tamanho: 'micro' },
    { id: 'pac_inativos_periodo', tamanho: 'micro' },
    { id: 'pac_tempo_acompanhamento', tamanho: 'micro' },
    { id: 'fin_ticket_medio', tamanho: 'micro' },
    { id: 'pac_distribuicao_convenio', tamanho: 'pequeno' },
    { id: 'pac_faixa_etaria', tamanho: 'medio' },
    { id: 'pac_taxa_retencao', tamanho: 'pequeno' },
  ]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  
  // CORREÇÃO: Usar a rota correta dashboard.stats em vez de getDashboardStats
  const { data: dashboardStats, isLoading: carregandoStats } = trpc.dashboard.stats.useQuery();
  
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

  // Função para remover widget e persistir a configuração
  const handleRemoveWidget = (widgetId: string) => {
    const newWidgets = widgetConfigs.filter(w => w.id !== widgetId);
    handleSalvarConfig(newWidgets);
  };

  const fullscreenMetrica = fullscreenWidget ? todasMetricas.find(m => m.id === fullscreenWidget) : null;

  if (carregandoConfig) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
                      <SelectTrigger className="w-40">
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

      {/* Header do Dashboard */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gorgen-700">Dashboard</h1>
        
        <div className="flex items-center gap-3">
          {/* Filtro Global de Período */}
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoTempo)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodos.map(p => (
                <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Botão de Configurações */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setDialogAberto(true)}
            title="Configurar Widgets"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Painel de KPIs (Painel de Voo) - CORRIGIDO */}
      <KPIPanel stats={dashboardStats} periodo={periodo} isLoading={carregandoStats} />
      
      {/* Grid de Widgets com Drag-and-Drop */}
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
              {agruparWidgetsMicro(metricasExibidas).map((item, index) => {
                // Par de widgets micro empilhados
                if ('tipo' in item && item.tipo === 'par_micro') {
                  return (
                    <div key={`micro-pair-${index}`} className="col-span-1 flex flex-col gap-4">
                      {item.widgets.map(({ metrica, config }) => (
                        <SortableWidget
                          key={metrica.id}
                          metrica={metrica}
                          periodo={periodo}
                          config={config}
                          onChangeTamanho={(t) => updateWidgetTamanho(metrica.id, t)}
                          onChangePeriodo={(p) => updateWidgetPeriodo(metrica.id, p)}
                          onOpenFullscreen={() => setFullscreenWidget(metrica.id)}
                          onRemove={() => handleRemoveWidget(metrica.id)}
                        />
                      ))}
                    </div>
                  );
                }
                // Widget normal (não-micro ou micro sozinho)
                const { metrica, config } = item as { metrica: MetricaDefinicao; config: WidgetConfig };
                return (
                  <SortableWidget
                    key={metrica.id}
                    metrica={metrica}
                    periodo={periodo}
                    config={config}
                    onChangeTamanho={(t) => updateWidgetTamanho(metrica.id, t)}
                    onChangePeriodo={(p) => updateWidgetPeriodo(metrica.id, p)}
                    onOpenFullscreen={() => setFullscreenWidget(metrica.id)}
                    onRemove={() => handleRemoveWidget(metrica.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Resumo das categorias - CORES CORRIGIDAS */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gorgen-700 mb-4">Métricas por Categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categorias.map(cat => {
            const qtdTotal = todasMetricas.filter(m => m.categoria === cat.valor).length;
            const qtdSelecionadas = widgetConfigs.filter(w => 
              todasMetricas.find(m => m.id === w.id)?.categoria === cat.valor
            ).length;
            
            return (
              <Card key={cat.valor} className="p-4 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${cat.cor}15` }}
                  >
                    <span style={{ color: cat.cor }}>{cat.icone}</span>
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
