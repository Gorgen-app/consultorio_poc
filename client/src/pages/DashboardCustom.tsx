// Dashboard Customizável com Drag-and-Drop, Redimensionamento e Modo Tela Cheia
// DashboardLayout é aplicado globalmente no App.tsx
import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
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

// Tipos
type PeriodoTempo = '7d' | '30d' | '3m' | '6m' | '1a' | '3a' | '5a' | 'todo';
type TamanhoWidget = 'pequeno' | 'medio' | 'grande';

type CategoriaMetrica = 
  | 'populacao_pacientes'
  | 'atendimentos'
  | 'economico_financeiro'
  | 'qualidade_atendimento'
  | 'diversas';

interface MetricaDefinicao {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaMetrica;
  tipoGrafico: 'linha' | 'barra' | 'pizza' | 'area' | 'numero' | 'tabela' | 'gauge';
  unidade?: string;
  corPrimaria: string;
  icone: string;
  subcategorias?: string[];
}

interface WidgetConfig {
  id: string;
  tamanho: TamanhoWidget;
  periodoIndividual?: PeriodoTempo;
}

// Definição das 50 métricas
const todasMetricas: MetricaDefinicao[] = [
  // POPULAÇÃO DE PACIENTES (10)
  { id: 'pac_total_ativos', nome: 'Total de Pacientes Ativos', descricao: 'Número total de pacientes com status ativo', categoria: 'populacao_pacientes', tipoGrafico: 'numero', icone: 'Users', corPrimaria: '#3B82F6' },
  { id: 'pac_novos_periodo', nome: 'Novos Pacientes', descricao: 'Pacientes cadastrados no período', categoria: 'populacao_pacientes', tipoGrafico: 'linha', icone: 'UserPlus', corPrimaria: '#10B981' },
  { id: 'pac_distribuicao_sexo', nome: 'Distribuição por Sexo', descricao: 'Proporção masculino/feminino', categoria: 'populacao_pacientes', tipoGrafico: 'pizza', icone: 'PieChart', corPrimaria: '#8B5CF6' },
  { id: 'pac_faixa_etaria', nome: 'Distribuição por Faixa Etária', descricao: 'Pacientes por faixa etária', categoria: 'populacao_pacientes', tipoGrafico: 'barra', icone: 'BarChart3', corPrimaria: '#F59E0B' },
  { id: 'pac_distribuicao_cidade', nome: 'Distribuição Geográfica', descricao: 'Pacientes por cidade', categoria: 'populacao_pacientes', tipoGrafico: 'barra', icone: 'MapPin', corPrimaria: '#EF4444' },
  { id: 'pac_taxa_retencao', nome: 'Taxa de Retenção', descricao: 'Pacientes que retornaram', categoria: 'populacao_pacientes', tipoGrafico: 'gauge', unidade: '%', icone: 'RefreshCw', corPrimaria: '#06B6D4' },
  { id: 'pac_tempo_acompanhamento', nome: 'Tempo Médio de Acompanhamento', descricao: 'Tempo desde primeiro atendimento', categoria: 'populacao_pacientes', tipoGrafico: 'numero', unidade: 'anos', icone: 'Clock', corPrimaria: '#84CC16' },
  { id: 'pac_inativos_periodo', nome: 'Pacientes Inativos', descricao: 'Sem atendimento há 360+ dias', categoria: 'populacao_pacientes', tipoGrafico: 'numero', icone: 'UserMinus', corPrimaria: '#F97316' },
  { id: 'pac_obitos_periodo', nome: 'Óbitos no Período', descricao: 'Registro de óbitos', categoria: 'populacao_pacientes', tipoGrafico: 'linha', icone: 'Heart', corPrimaria: '#6B7280' },
  { id: 'pac_distribuicao_convenio', nome: 'Distribuição por Convênio', descricao: 'Pacientes por operadora', categoria: 'populacao_pacientes', tipoGrafico: 'pizza', icone: 'Building2', corPrimaria: '#EC4899' },
  
  // ATENDIMENTOS (10)
  { id: 'atd_total_periodo', nome: 'Total de Atendimentos', descricao: 'Quantidade no período', categoria: 'atendimentos', tipoGrafico: 'numero', icone: 'Calendar', corPrimaria: '#3B82F6', subcategorias: ['Todos', 'Consulta', 'Retorno', 'Cirurgia', 'Procedimento'] },
  { id: 'atd_evolucao_temporal', nome: 'Evolução de Atendimentos', descricao: 'Tendência ao longo do tempo', categoria: 'atendimentos', tipoGrafico: 'area', icone: 'TrendingUp', corPrimaria: '#10B981', subcategorias: ['Todos', 'Consulta', 'Retorno', 'Cirurgia', 'Procedimento'] },
  { id: 'atd_por_tipo', nome: 'Atendimentos por Tipo', descricao: 'Distribuição por tipo', categoria: 'atendimentos', tipoGrafico: 'pizza', icone: 'PieChart', corPrimaria: '#8B5CF6' },
  { id: 'atd_por_local', nome: 'Atendimentos por Local', descricao: 'Distribuição por local', categoria: 'atendimentos', tipoGrafico: 'barra', icone: 'Building', corPrimaria: '#F59E0B' },
  { id: 'atd_por_convenio', nome: 'Atendimentos por Convênio', descricao: 'Quantidade por operadora', categoria: 'atendimentos', tipoGrafico: 'barra', icone: 'CreditCard', corPrimaria: '#EF4444' },
  { id: 'atd_media_diaria', nome: 'Média de Atendimentos/Dia', descricao: 'Média por dia útil', categoria: 'atendimentos', tipoGrafico: 'numero', icone: 'Activity', corPrimaria: '#06B6D4' },
  { id: 'atd_dia_semana', nome: 'Atendimentos por Dia da Semana', descricao: 'Distribuição semanal', categoria: 'atendimentos', tipoGrafico: 'barra', icone: 'CalendarDays', corPrimaria: '#84CC16' },
  { id: 'atd_hora_pico', nome: 'Horários de Pico', descricao: 'Distribuição por horário', categoria: 'atendimentos', tipoGrafico: 'area', icone: 'Clock', corPrimaria: '#F97316' },
  { id: 'atd_novos_vs_retorno', nome: 'Novos vs Retornos', descricao: 'Proporção primeira consulta/retorno', categoria: 'atendimentos', tipoGrafico: 'pizza', icone: 'RefreshCw', corPrimaria: '#EC4899' },
  { id: 'atd_procedimentos_realizados', nome: 'Procedimentos Realizados', descricao: 'Top procedimentos', categoria: 'atendimentos', tipoGrafico: 'barra', icone: 'Stethoscope', corPrimaria: '#14B8A6' },
  
  // ECONÔMICO-FINANCEIRO (10)
  { id: 'fin_faturamento_total', nome: 'Faturamento Total', descricao: 'Valor faturado no período', categoria: 'economico_financeiro', tipoGrafico: 'numero', unidade: 'R$', icone: 'DollarSign', corPrimaria: '#10B981' },
  { id: 'fin_evolucao_faturamento', nome: 'Evolução do Faturamento', descricao: 'Tendência do faturamento', categoria: 'economico_financeiro', tipoGrafico: 'area', unidade: 'R$', icone: 'TrendingUp', corPrimaria: '#3B82F6' },
  { id: 'fin_faturamento_convenio', nome: 'Faturamento por Convênio', descricao: 'Receita por operadora', categoria: 'economico_financeiro', tipoGrafico: 'pizza', unidade: 'R$', icone: 'PieChart', corPrimaria: '#8B5CF6' },
  { id: 'fin_ticket_medio', nome: 'Ticket Médio', descricao: 'Valor médio por atendimento', categoria: 'economico_financeiro', tipoGrafico: 'numero', unidade: 'R$', icone: 'Receipt', corPrimaria: '#F59E0B' },
  { id: 'fin_taxa_recebimento', nome: 'Taxa de Recebimento', descricao: 'Percentual recebido', categoria: 'economico_financeiro', tipoGrafico: 'gauge', unidade: '%', icone: 'CheckCircle', corPrimaria: '#10B981' },
  { id: 'fin_glosas', nome: 'Glosas', descricao: 'Valor de glosas', categoria: 'economico_financeiro', tipoGrafico: 'linha', unidade: 'R$', icone: 'XCircle', corPrimaria: '#EF4444' },
  { id: 'fin_inadimplencia', nome: 'Inadimplência', descricao: 'Valor em aberto', categoria: 'economico_financeiro', tipoGrafico: 'numero', unidade: 'R$', icone: 'AlertTriangle', corPrimaria: '#F97316' },
  { id: 'fin_faturamento_tipo', nome: 'Faturamento por Tipo', descricao: 'Receita por tipo de atendimento', categoria: 'economico_financeiro', tipoGrafico: 'barra', unidade: 'R$', icone: 'BarChart3', corPrimaria: '#06B6D4' },
  { id: 'fin_comparativo_mensal', nome: 'Comparativo Mensal', descricao: 'Comparação mês a mês', categoria: 'economico_financeiro', tipoGrafico: 'barra', unidade: 'R$', icone: 'TrendingUp', corPrimaria: '#84CC16' },
  { id: 'fin_projecao', nome: 'Projeção de Faturamento', descricao: 'Estimativa futura', categoria: 'economico_financeiro', tipoGrafico: 'area', unidade: 'R$', icone: 'Target', corPrimaria: '#EC4899' },
  
  // QUALIDADE DO ATENDIMENTO (10)
  { id: 'qua_tempo_espera', nome: 'Tempo Médio de Espera', descricao: 'Tempo até atendimento', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', unidade: 'min', icone: 'Clock', corPrimaria: '#3B82F6' },
  { id: 'qua_duracao_consulta', nome: 'Duração Média da Consulta', descricao: 'Tempo de atendimento', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', unidade: 'min', icone: 'Timer', corPrimaria: '#10B981' },
  { id: 'qua_taxa_retorno', nome: 'Taxa de Retorno', descricao: 'Pacientes que retornaram', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'RefreshCw', corPrimaria: '#8B5CF6' },
  { id: 'qua_taxa_falta', nome: 'Taxa de Faltas', descricao: 'Pacientes que faltaram', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'UserX', corPrimaria: '#EF4444' },
  { id: 'qua_taxa_cancelamento', nome: 'Taxa de Cancelamento', descricao: 'Consultas canceladas', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'XCircle', corPrimaria: '#F97316' },
  { id: 'qua_satisfacao', nome: 'Satisfação do Paciente', descricao: 'Avaliação média', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '/5', icone: 'Star', corPrimaria: '#F59E0B' },
  { id: 'qua_nps', nome: 'NPS', descricao: 'Net Promoter Score', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', icone: 'ThumbsUp', corPrimaria: '#06B6D4' },
  { id: 'qua_reclamacoes', nome: 'Reclamações', descricao: 'Quantidade de reclamações', categoria: 'qualidade_atendimento', tipoGrafico: 'linha', icone: 'MessageSquare', corPrimaria: '#84CC16' },
  { id: 'qua_diagnosticos_frequentes', nome: 'Diagnósticos Frequentes', descricao: 'Top diagnósticos', categoria: 'qualidade_atendimento', tipoGrafico: 'barra', icone: 'FileText', corPrimaria: '#EC4899' },
  { id: 'qua_encaminhamentos', nome: 'Encaminhamentos', descricao: 'Pacientes encaminhados', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', icone: 'ArrowRight', corPrimaria: '#14B8A6' },
  
  // DIVERSAS (10)
  { id: 'div_proximos_atendimentos', nome: 'Próximos Atendimentos', descricao: 'Agenda dos próximos dias', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'Calendar', corPrimaria: '#3B82F6' },
  { id: 'div_aniversariantes', nome: 'Aniversariantes do Mês', descricao: 'Pacientes que fazem aniversário', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'Cake', corPrimaria: '#10B981' },
  { id: 'div_alertas_pendentes', nome: 'Alertas Pendentes', descricao: 'Itens que requerem atenção', categoria: 'diversas', tipoGrafico: 'numero', icone: 'Bell', corPrimaria: '#EF4444' },
  { id: 'div_tarefas', nome: 'Tarefas Pendentes', descricao: 'Lista de tarefas', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'CheckSquare', corPrimaria: '#8B5CF6' },
  { id: 'div_lembretes', nome: 'Lembretes', descricao: 'Lembretes ativos', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'Bell', corPrimaria: '#F59E0B' },
  { id: 'div_documentos_pendentes', nome: 'Documentos Pendentes', descricao: 'Documentos a assinar', categoria: 'diversas', tipoGrafico: 'numero', icone: 'FileText', corPrimaria: '#F97316' },
  { id: 'div_exames_pendentes', nome: 'Exames Pendentes', descricao: 'Resultados aguardando', categoria: 'diversas', tipoGrafico: 'numero', icone: 'TestTube', corPrimaria: '#06B6D4' },
  { id: 'div_prescricoes_vencendo', nome: 'Prescrições Vencendo', descricao: 'Receitas próximas do vencimento', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'Pill', corPrimaria: '#84CC16' },
  { id: 'div_retornos_agendados', nome: 'Retornos Agendados', descricao: 'Retornos programados', categoria: 'diversas', tipoGrafico: 'numero', icone: 'CalendarCheck', corPrimaria: '#EC4899' },
  { id: 'div_ocupacao_agenda', nome: 'Ocupação da Agenda', descricao: 'Percentual de ocupação', categoria: 'diversas', tipoGrafico: 'gauge', unidade: '%', icone: 'CalendarDays', corPrimaria: '#14B8A6' },
];

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
  pequeno: 'col-span-1',
  medio: 'col-span-1 md:col-span-2',
  grande: 'col-span-1 md:col-span-2 lg:col-span-3',
};

const tamanhoAlturas: Record<TamanhoWidget, string> = {
  pequeno: 'h-[280px]',
  medio: 'h-[320px]',
  grande: 'h-[400px]',
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
          
          {/* Seletor de tamanho */}
          <Select value={config.tamanho} onValueChange={(v) => onChangeTamanho(v as TamanhoWidget)}>
            <SelectTrigger className="h-7 w-20 text-xs bg-background/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pequeno">Pequeno</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="grande">Grande</SelectItem>
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
        
        <CardHeader className="pb-2 pt-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{metrica.nome}</CardTitle>
            <Badge variant="outline" style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}>
              {categorias.find(c => c.valor === metrica.categoria)?.label.split(' ')[0]}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {metrica.descricao}
            {config.periodoIndividual && (
              <span className="ml-2 text-primary">({periodos.find(p => p.valor === config.periodoIndividual)?.label})</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
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
  
  const { data: atdTotalPeriodo } = trpc.dashboardMetricas.atdTotalPeriodo.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_total_periodo' }
  );
  
  const { data: atdEvolucao } = trpc.dashboardMetricas.atdEvolucaoTemporal.useQuery(
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
  
  const { data: atdMediaDiaria } = trpc.dashboardMetricas.atdMediaDiaria.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_media_diaria' }
  );
  
  const { data: atdDiaSemana } = trpc.dashboardMetricas.atdDiaSemana.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_dia_semana' }
  );
  
  const { data: atdNovosVsRetorno } = trpc.dashboardMetricas.atdNovosVsRetorno.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_novos_vs_retorno' }
  );
  
  const { data: atdProcedimentos } = trpc.dashboardMetricas.atdProcedimentos.useQuery(
    { periodo },
    { enabled: metrica.id === 'atd_procedimentos_realizados' }
  );
  
  const { data: finFaturamentoTotal } = trpc.dashboardMetricas.finFaturamentoTotal.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_faturamento_total' }
  );
  
  const { data: finEvolucao } = trpc.dashboardMetricas.finEvolucaoFaturamento.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_evolucao_faturamento' }
  );
  
  const { data: finPorConvenio } = trpc.dashboardMetricas.finFaturamentoConvenio.useQuery(
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
  
  const { data: finInadimplencia } = trpc.dashboardMetricas.finInadimplencia.useQuery(undefined, {
    enabled: metrica.id === 'fin_inadimplencia',
  });
  
  const { data: finPorTipo } = trpc.dashboardMetricas.finFaturamentoPorTipo.useQuery(
    { periodo },
    { enabled: metrica.id === 'fin_faturamento_tipo' }
  );
  
  const { data: finComparativo } = trpc.dashboardMetricas.finComparativoMensal.useQuery(undefined, {
    enabled: metrica.id === 'fin_comparativo_mensal',
  });
  
  const { data: quaDiagnosticos } = trpc.dashboardMetricas.quaDiagnosticosFrequentes.useQuery(
    { periodo },
    { enabled: metrica.id === 'qua_diagnosticos_frequentes' }
  );
  
  const { data: quaTaxaRetorno } = trpc.dashboardMetricas.quaTaxaRetorno.useQuery(
    { periodo },
    { enabled: metrica.id === 'qua_taxa_retorno' }
  );
  
  const { data: divProximos } = trpc.dashboardMetricas.divProximosAtendimentos.useQuery(undefined, {
    enabled: metrica.id === 'div_proximos_atendimentos',
  });
  
  const { data: divAniversariantes } = trpc.dashboardMetricas.divAniversariantes.useQuery(undefined, {
    enabled: metrica.id === 'div_aniversariantes',
  });
  
  const { data: divAlertas } = trpc.dashboardMetricas.divAlertasPendentes.useQuery(undefined, {
    enabled: metrica.id === 'div_alertas_pendentes',
  });

  const alturaGrafico = isFullscreen ? 400 : (tamanho === 'grande' ? 280 : tamanho === 'medio' ? 200 : 140);

  // Métricas de número
  if (metrica.tipoGrafico === 'numero') {
    let valor: number | string = '-';
    
    if (metrica.id === 'pac_total_ativos' && pacTotalAtivos) valor = pacTotalAtivos.valor;
    if (metrica.id === 'pac_tempo_acompanhamento' && pacTempoAcompanhamento) valor = pacTempoAcompanhamento.valor;
    if (metrica.id === 'pac_inativos_periodo' && pacInativos) valor = pacInativos.valor;
    if (metrica.id === 'atd_total_periodo' && atdTotalPeriodo) valor = atdTotalPeriodo.valor;
    if (metrica.id === 'atd_media_diaria' && atdMediaDiaria) valor = atdMediaDiaria.valor;
    if (metrica.id === 'fin_faturamento_total' && finFaturamentoTotal) valor = finFaturamentoTotal.valor;
    if (metrica.id === 'fin_ticket_medio' && finTicketMedio) valor = finTicketMedio.valor;
    if (metrica.id === 'fin_inadimplencia' && finInadimplencia) valor = finInadimplencia.valor;
    if (metrica.id === 'div_alertas_pendentes' && divAlertas) valor = divAlertas.valor;
    
    const formatarValor = (v: number | string) => {
      if (typeof v === 'string') return v;
      if (metrica.unidade === 'R$') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
      }
      return new Intl.NumberFormat('pt-BR').format(v) + (metrica.unidade ? ` ${metrica.unidade}` : '');
    };
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className={`font-bold ${isFullscreen ? 'text-6xl' : 'text-4xl'}`} style={{ color: metrica.corPrimaria }}>
          {formatarValor(valor)}
        </span>
      </div>
    );
  }
  
  // Métricas de gauge
  if (metrica.tipoGrafico === 'gauge') {
    let valor = 0;
    
    if (metrica.id === 'fin_taxa_recebimento' && finTaxaRecebimento) valor = finTaxaRecebimento.valor;
    if (metrica.id === 'qua_taxa_retorno' && quaTaxaRetorno) valor = quaTaxaRetorno.valor;
    
    const tamanhoGauge = isFullscreen ? 160 : (tamanho === 'grande' ? 120 : tamanho === 'medio' ? 100 : 80);
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative" style={{ width: tamanhoGauge, height: tamanhoGauge }}>
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={metrica.corPrimaria}
              strokeWidth="8"
              strokeDasharray={`${valor * 2.51} 251`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xl font-bold"
              fill={metrica.corPrimaria}
            >
              {valor}%
            </text>
          </svg>
        </div>
      </div>
    );
  }
  
  // Gráficos de pizza
  if (metrica.tipoGrafico === 'pizza') {
    let dados: { nome: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_distribuicao_sexo' && pacDistribuicaoSexo && Array.isArray(pacDistribuicaoSexo.dados)) dados = pacDistribuicaoSexo.dados;
    if (metrica.id === 'pac_distribuicao_convenio' && pacDistribuicaoConvenio && Array.isArray(pacDistribuicaoConvenio.dados)) dados = pacDistribuicaoConvenio.dados;
    if (metrica.id === 'atd_por_tipo' && atdPorTipo && Array.isArray(atdPorTipo.dados)) dados = atdPorTipo.dados;
    if (metrica.id === 'atd_novos_vs_retorno' && atdNovosVsRetorno && Array.isArray(atdNovosVsRetorno.dados)) dados = atdNovosVsRetorno.dados;
    if (metrica.id === 'fin_faturamento_convenio' && finPorConvenio && Array.isArray(finPorConvenio.dados)) dados = finPorConvenio.dados;
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={alturaGrafico}>
        <RechartsPieChart>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={tamanho === 'pequeno' ? 25 : 40}
            outerRadius={tamanho === 'pequeno' ? 50 : 70}
            dataKey="valor"
            nameKey="nome"
            label={tamanho !== 'pequeno'}
          >
            {dados.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {tamanho !== 'pequeno' && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  }
  
  // Gráficos de barra
  if (metrica.tipoGrafico === 'barra') {
    let dados: { nome: string; valor: number }[] = [];
    
    if (metrica.id === 'pac_faixa_etaria' && pacFaixaEtaria && Array.isArray(pacFaixaEtaria.dados)) dados = pacFaixaEtaria.dados;
    if (metrica.id === 'pac_distribuicao_cidade' && pacDistribuicaoCidade && Array.isArray(pacDistribuicaoCidade.dados)) dados = pacDistribuicaoCidade.dados;
    if (metrica.id === 'atd_por_local' && atdPorLocal && Array.isArray(atdPorLocal.dados)) dados = atdPorLocal.dados;
    if (metrica.id === 'atd_por_convenio' && atdPorConvenio && Array.isArray(atdPorConvenio.dados)) dados = atdPorConvenio.dados;
    if (metrica.id === 'atd_dia_semana' && atdDiaSemana && Array.isArray(atdDiaSemana.dados)) dados = atdDiaSemana.dados;
    if (metrica.id === 'atd_procedimentos_realizados' && atdProcedimentos && Array.isArray(atdProcedimentos.dados)) dados = atdProcedimentos.dados;
    if (metrica.id === 'fin_faturamento_tipo' && finPorTipo && Array.isArray(finPorTipo.dados)) dados = finPorTipo.dados;
    if (metrica.id === 'fin_comparativo_mensal' && finComparativo && Array.isArray(finComparativo.dados)) dados = finComparativo.dados;
    if (metrica.id === 'qua_diagnosticos_frequentes' && quaDiagnosticos && Array.isArray(quaDiagnosticos.dados)) dados = quaDiagnosticos.dados;
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={alturaGrafico}>
        <BarChart data={dados} layout="vertical" margin={{ left: tamanho === 'pequeno' ? 40 : 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="nome" width={tamanho === 'pequeno' ? 40 : 80} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="valor" fill={metrica.corPrimaria} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  // Gráficos de área
  if (metrica.tipoGrafico === 'area') {
    let dados: { data: string; valor: number }[] = [];
    
    if (metrica.id === 'atd_evolucao_temporal' && atdEvolucao && Array.isArray(atdEvolucao.dados)) dados = atdEvolucao.dados;
    if (metrica.id === 'fin_evolucao_faturamento' && finEvolucao && Array.isArray(finEvolucao.dados)) dados = finEvolucao.dados;
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={alturaGrafico}>
        <AreaChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="valor" 
            stroke={metrica.corPrimaria} 
            fill={`${metrica.corPrimaria}40`}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  
  // Tabelas
  if (metrica.tipoGrafico === 'tabela') {
    let dados: any[] = [];
    let colunas: string[] = [];
    
    if (metrica.id === 'div_proximos_atendimentos' && divProximos && Array.isArray(divProximos.dados)) {
      dados = divProximos.dados;
      colunas = ['data', 'paciente', 'tipo'];
    }
    if (metrica.id === 'div_aniversariantes' && divAniversariantes && Array.isArray(divAniversariantes.dados)) {
      dados = divAniversariantes.dados;
      colunas = ['nome', 'data', 'idade'];
    }
    
    if (dados.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>;
    }
    
    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {colunas.map(col => (
                <th key={col} className="text-left p-2 font-medium capitalize">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.slice(0, tamanho === 'grande' ? 10 : 5).map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                {colunas.map(col => (
                  <td key={col} className="p-2">{item[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  return <div className="flex items-center justify-center h-full text-muted-foreground">Carregando...</div>;
}

// Componente principal
export default function DashboardCustom() {
  const [periodo, setPeriodo] = useState<PeriodoTempo>('30d');
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<string[]>([
    'pac_total_ativos',
    'pac_novos_periodo',
    'pac_distribuicao_sexo',
    'pac_faixa_etaria',
    'pac_distribuicao_cidade',
    'pac_taxa_retencao',
    'pac_tempo_acompanhamento',
    'pac_inativos_periodo',
    'pac_distribuicao_convenio',
    'atd_total_periodo',
    'atd_evolucao_temporal',
    'fin_faturamento_total',
    'fin_taxa_recebimento',
    'qua_diagnosticos_frequentes',
    'qua_taxa_retorno',
    'div_alertas_pendentes',
  ]);
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, WidgetConfig>>({});
  const [dialogAberto, setDialogAberto] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaMetrica | 'todas'>('todas');
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  
  // Buscar configuração salva
  const { data: configSalva, isLoading: carregandoConfig } = trpc.dashboardMetricas.getConfig.useQuery();
  
  // Mutation para salvar configuração
  const salvarConfig = trpc.dashboardMetricas.saveConfig.useMutation({
    onSuccess: () => {
      setDialogAberto(false);
    },
  });
  
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
          setMetricasSelecionadas(metricas);
        }
        if (configSalva.periodoDefault) {
          setPeriodo(configSalva.periodoDefault as PeriodoTempo);
        }
        if (configSalva.widgetSizes) {
          const sizes = JSON.parse(configSalva.widgetSizes);
          const configs: Record<string, WidgetConfig> = {};
          Object.entries(sizes).forEach(([id, tamanho]) => {
            configs[id] = { id, tamanho: tamanho as TamanhoWidget };
          });
          setWidgetConfigs(configs);
        }
        if (configSalva.widgetPeriods) {
          const periods = JSON.parse(configSalva.widgetPeriods);
          setWidgetConfigs(prev => {
            const updated = { ...prev };
            Object.entries(periods).forEach(([id, periodo]) => {
              if (updated[id]) {
                updated[id].periodoIndividual = periodo as PeriodoTempo;
              } else {
                updated[id] = { id, tamanho: 'pequeno', periodoIndividual: periodo as PeriodoTempo };
              }
            });
            return updated;
          });
        }
      } catch (e) {
        console.error('Erro ao carregar configuração:', e);
      }
    }
  }, [configSalva]);
  
  const toggleMetrica = (id: string) => {
    setMetricasSelecionadas(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };
  
  const metricasFiltradas = categoriaFiltro === 'todas' 
    ? todasMetricas 
    : todasMetricas.filter(m => m.categoria === categoriaFiltro);
  
  const metricasExibidas = metricasSelecionadas
    .map(id => todasMetricas.find(m => m.id === id))
    .filter((m): m is MetricaDefinicao => m !== undefined);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setMetricasSelecionadas((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getWidgetConfig = (id: string): WidgetConfig => {
    return widgetConfigs[id] || { id, tamanho: 'pequeno' };
  };

  const updateWidgetTamanho = (id: string, tamanho: TamanhoWidget) => {
    setWidgetConfigs(prev => ({
      ...prev,
      [id]: { ...getWidgetConfig(id), tamanho }
    }));
  };

  const updateWidgetPeriodo = (id: string, periodo: PeriodoTempo | undefined) => {
    setWidgetConfigs(prev => ({
      ...prev,
      [id]: { ...getWidgetConfig(id), periodoIndividual: periodo || undefined }
    }));
  };

  const handleSalvarConfig = () => {
    const widgetSizes: Record<string, string> = {};
    const widgetPeriods: Record<string, string> = {};
    
    Object.entries(widgetConfigs).forEach(([id, config]) => {
      widgetSizes[id] = config.tamanho;
      if (config.periodoIndividual) {
        widgetPeriods[id] = config.periodoIndividual;
      }
    });
    
    salvarConfig.mutate({
      metricasSelecionadas: JSON.stringify(metricasSelecionadas),
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

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {metricasSelecionadas.length} métricas selecionadas de {todasMetricas.length} disponíveis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Seletor de período global */}
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoTempo)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodos.map(p => (
                <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Botão de configurar */}
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurar Dashboard</DialogTitle>
              </DialogHeader>
              
              {/* Filtro por categoria */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  variant={categoriaFiltro === 'todas' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setCategoriaFiltro('todas')}
                >
                  Todas
                </Button>
                {categorias.map(cat => (
                  <Button 
                    key={cat.valor}
                    variant={categoriaFiltro === cat.valor ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setCategoriaFiltro(cat.valor)}
                    style={categoriaFiltro === cat.valor ? { backgroundColor: cat.cor } : {}}
                  >
                    {cat.icone}
                    <span className="ml-1">{cat.label}</span>
                  </Button>
                ))}
              </div>
              
              {/* Lista de métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {metricasFiltradas.map(metrica => (
                  <div 
                    key={metrica.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      metricasSelecionadas.includes(metrica.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleMetrica(metrica.id)}
                  >
                    <Checkbox 
                      checked={metricasSelecionadas.includes(metrica.id)}
                      onCheckedChange={() => toggleMetrica(metrica.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{metrica.nome}</div>
                      <div className="text-xs text-muted-foreground">{metrica.descricao}</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}
                    >
                      {metrica.tipoGrafico}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {/* Botões de ação */}
              <div className="flex justify-between mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMetricasSelecionadas(todasMetricas.map(m => m.id))}
                  >
                    Selecionar Todas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMetricasSelecionadas([])}
                  >
                    Limpar Seleção
                  </Button>
                </div>
                <Button onClick={handleSalvarConfig} disabled={salvarConfig.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvarConfig.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Botão de atualizar */}
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Instruções de uso */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <strong>Dica:</strong> Arraste os widgets pelo ícone <GripVertical className="h-4 w-4 inline" /> para reorganizar. 
        Passe o mouse sobre um widget para acessar controles de tamanho, período individual e tela cheia.
      </div>
      
      {/* Grid de métricas com Drag-and-Drop */}
      {metricasExibidas.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma métrica selecionada</h3>
          <p className="text-muted-foreground mb-4">
            Clique em "Configurar" para selecionar as métricas que deseja visualizar.
          </p>
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Métricas
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={metricasSelecionadas} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {metricasExibidas.map(metrica => (
                <SortableWidget
                  key={metrica.id}
                  metrica={metrica}
                  periodo={periodo}
                  config={getWidgetConfig(metrica.id)}
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
            const qtdSelecionadas = metricasSelecionadas.filter(id => 
              todasMetricas.find(m => m.id === id)?.categoria === cat.valor
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
