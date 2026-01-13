import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Users, 
  Calendar, 
  DollarSign, 
  Heart, 
  LayoutGrid,
  Plus,
  Check,
  GripVertical,
  TrendingUp,
  PieChart,
  BarChart3,
  Activity,
  Clock,
  Building2,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Star,
  Bell,
  FileText,
  CheckSquare,
  Cake,
  TestTube,
  Pill,
  CalendarCheck,
  CalendarDays,
  Stethoscope,
  Receipt,
  Target,
  XCircle,
  CheckCircle,
  CreditCard,
  Building,
  Timer,
  UserX,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
  UserPlus,
  UserMinus
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  useDraggable,
} from '@dnd-kit/core';

// Tipos
type PeriodoTempo = '7d' | '30d' | '3m' | '6m' | '1a' | '3a' | '5a' | 'todo';
type TamanhoWidget = 'micro' | 'pequeno' | 'medio' | 'grande';

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

// Definir quais tamanhos são permitidos para cada tipo de métrica
const tamanhosPermitidos: Record<string, TamanhoWidget[]> = {
  // Métricas numéricas simples - micro e pequeno apenas
  'pac_total_ativos': ['micro', 'pequeno'],
  'pac_inativos_periodo': ['micro', 'pequeno'],
  'pac_tempo_acompanhamento': ['micro', 'pequeno'],
  'atd_total_periodo': ['micro', 'pequeno'],
  'atd_media_diaria': ['micro', 'pequeno'],
  'fin_faturamento_total': ['micro', 'pequeno'],
  'fin_ticket_medio': ['micro', 'pequeno'],
  'fin_inadimplencia': ['micro', 'pequeno'],
  'qua_tempo_espera': ['micro', 'pequeno'],
  'qua_duracao_consulta': ['micro', 'pequeno'],
  'qua_nps': ['micro', 'pequeno'],
  'qua_encaminhamentos': ['micro', 'pequeno'],
  'div_alertas_pendentes': ['micro', 'pequeno'],
  'div_documentos_pendentes': ['micro', 'pequeno'],
  'div_exames_pendentes': ['micro', 'pequeno'],
  'div_retornos_agendados': ['micro', 'pequeno'],
  
  // Gauges - pequeno e médio
  'pac_taxa_retencao': ['pequeno', 'medio'],
  'fin_taxa_recebimento': ['pequeno', 'medio'],
  'qua_taxa_retorno': ['pequeno', 'medio'],
  'qua_taxa_falta': ['pequeno', 'medio'],
  'qua_taxa_cancelamento': ['pequeno', 'medio'],
  'qua_satisfacao': ['pequeno', 'medio'],
  'div_ocupacao_agenda': ['pequeno', 'medio'],
  
  // Gráficos de pizza - pequeno, médio e grande
  'pac_distribuicao_sexo': ['pequeno', 'medio', 'grande'],
  'pac_distribuicao_convenio': ['pequeno', 'medio', 'grande'],
  'atd_por_tipo': ['pequeno', 'medio', 'grande'],
  'atd_novos_vs_retorno': ['pequeno', 'medio', 'grande'],
  'fin_faturamento_convenio': ['pequeno', 'medio', 'grande'],
  
  // Gráficos de barra - pequeno, médio e grande
  'pac_faixa_etaria': ['pequeno', 'medio', 'grande'],
  'pac_distribuicao_cidade': ['pequeno', 'medio', 'grande'],
  'atd_por_local': ['pequeno', 'medio', 'grande'],
  'atd_por_convenio': ['pequeno', 'medio', 'grande'],
  'atd_dia_semana': ['pequeno', 'medio', 'grande'],
  'atd_procedimentos_realizados': ['pequeno', 'medio', 'grande'],
  'fin_faturamento_tipo': ['pequeno', 'medio', 'grande'],
  'fin_comparativo_mensal': ['pequeno', 'medio', 'grande'],
  'qua_diagnosticos_frequentes': ['pequeno', 'medio', 'grande'],
  
  // Gráficos de linha/área - pequeno, médio e grande
  'pac_novos_periodo': ['pequeno', 'medio', 'grande'],
  'pac_obitos_periodo': ['pequeno', 'medio', 'grande'],
  'atd_evolucao_temporal': ['pequeno', 'medio', 'grande'],
  'atd_hora_pico': ['pequeno', 'medio', 'grande'],
  'fin_evolucao_faturamento': ['pequeno', 'medio', 'grande'],
  'fin_glosas': ['pequeno', 'medio', 'grande'],
  'fin_projecao': ['pequeno', 'medio', 'grande'],
  'qua_reclamacoes': ['pequeno', 'medio', 'grande'],
  
  // Tabelas - médio e grande apenas
  'div_proximos_atendimentos': ['medio', 'grande'],
  'div_aniversariantes': ['medio', 'grande'],
  'div_tarefas': ['medio', 'grande'],
  'div_lembretes': ['medio', 'grande'],
  'div_prescricoes_vencendo': ['medio', 'grande'],
};

// Custo em slots para cada tamanho
const custoSlots: Record<TamanhoWidget, number> = {
  micro: 0.5,
  pequeno: 1,
  medio: 2,
  grande: 4,
};

const MAX_SLOTS = 12;

// Definição das métricas (mesmo do DashboardCustom)
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
  { id: 'atd_total_periodo', nome: 'Total de Atendimentos', descricao: 'Quantidade no período', categoria: 'atendimentos', tipoGrafico: 'numero', icone: 'Calendar', corPrimaria: '#3B82F6' },
  { id: 'atd_evolucao_temporal', nome: 'Evolução de Atendimentos', descricao: 'Tendência ao longo do tempo', categoria: 'atendimentos', tipoGrafico: 'area', icone: 'TrendingUp', corPrimaria: '#10B981' },
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

const categorias: { valor: CategoriaMetrica; label: string; cor: string }[] = [
  { valor: 'populacao_pacientes', label: 'População', cor: '#3B82F6' },
  { valor: 'atendimentos', label: 'Atendimentos', cor: '#10B981' },
  { valor: 'economico_financeiro', label: 'Financeiro', cor: '#F59E0B' },
  { valor: 'qualidade_atendimento', label: 'Qualidade', cor: '#8B5CF6' },
  { valor: 'diversas', label: 'Diversas', cor: '#EC4899' },
];

// Mapeamento de ícones
const iconeMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  UserMinus: <UserMinus className="h-4 w-4" />,
  PieChart: <PieChart className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
  RefreshCw: <RefreshCw className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Building: <Building2 className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  CalendarDays: <CalendarDays className="h-4 w-4" />,
  Stethoscope: <Stethoscope className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
  XCircle: <XCircle className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Timer: <Timer className="h-4 w-4" />,
  UserX: <UserX className="h-4 w-4" />,
  Star: <Star className="h-4 w-4" />,
  ThumbsUp: <ThumbsUp className="h-4 w-4" />,
  MessageSquare: <MessageSquare className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  ArrowRight: <ArrowRight className="h-4 w-4" />,
  Cake: <Cake className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  TestTube: <TestTube className="h-4 w-4" />,
  Pill: <Pill className="h-4 w-4" />,
  CalendarCheck: <CalendarCheck className="h-4 w-4" />,
};

// Componente de preview do widget
function WidgetPreview({ 
  metrica, 
  tamanho, 
  isSelected,
  onClick,
  disabled
}: { 
  metrica: MetricaDefinicao; 
  tamanho: TamanhoWidget;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const tamanhoLabels: Record<TamanhoWidget, string> = {
    micro: 'Micro',
    pequeno: 'Pequeno',
    medio: 'Médio',
    grande: 'Grande',
  };

  const tamanhoClasses: Record<TamanhoWidget, string> = {
    micro: 'w-[120px] h-[80px]',
    pequeno: 'w-[140px] h-[140px]',
    medio: 'w-[200px] h-[160px]',
    grande: 'w-[280px] h-[180px]',
  };

  return (
    <Card 
      className={`
        ${tamanhoClasses[tamanho]} 
        cursor-pointer transition-all duration-200 
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md hover:scale-105'}
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={disabled && !isSelected ? undefined : onClick}
    >
      <CardContent className="p-2 h-full flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <div 
            className="p-1 rounded" 
            style={{ backgroundColor: `${metrica.corPrimaria}20` }}
          >
            <div style={{ color: metrica.corPrimaria }}>
              {iconeMap[metrica.icone] || <LayoutGrid className="h-3 w-3" />}
            </div>
          </div>
          <span className="text-[10px] font-medium truncate flex-1">{metrica.nome}</span>
          {isSelected && <Check className="h-3 w-3 text-blue-500" />}
        </div>
        
        {/* Preview visual baseado no tipo de gráfico */}
        <div className="flex-1 flex items-center justify-center">
          {metrica.tipoGrafico === 'numero' && (
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: metrica.corPrimaria }}>
                {metrica.unidade === 'R$' ? 'R$ 0,00' : '0'}
              </div>
              {tamanho !== 'micro' && (
                <div className="text-[8px] text-muted-foreground">{metrica.unidade || 'unidades'}</div>
              )}
            </div>
          )}
          
          {metrica.tipoGrafico === 'gauge' && (
            <div className="relative">
              <svg width={tamanho === 'micro' ? 40 : 60} height={tamanho === 'micro' ? 25 : 35} viewBox="0 0 60 35">
                <path
                  d="M 5 30 A 25 25 0 0 1 55 30"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                />
                <path
                  d="M 5 30 A 25 25 0 0 1 30 5"
                  fill="none"
                  stroke={metrica.corPrimaria}
                  strokeWidth="6"
                />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <span className="text-[10px] font-bold" style={{ color: metrica.corPrimaria }}>50%</span>
              </div>
            </div>
          )}
          
          {metrica.tipoGrafico === 'pizza' && (
            <svg width={tamanho === 'micro' ? 30 : 50} height={tamanho === 'micro' ? 30 : 50} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="#e5e7eb" />
              <path
                d="M 25 25 L 25 5 A 20 20 0 0 1 45 25 Z"
                fill={metrica.corPrimaria}
              />
              <path
                d="M 25 25 L 45 25 A 20 20 0 0 1 25 45 Z"
                fill={`${metrica.corPrimaria}80`}
              />
            </svg>
          )}
          
          {(metrica.tipoGrafico === 'barra') && (
            <div className="flex items-end gap-1 h-full pb-2">
              {[0.6, 0.8, 0.4, 0.9, 0.5].slice(0, tamanho === 'micro' ? 3 : 5).map((h, i) => (
                <div 
                  key={i} 
                  className="w-2 rounded-t" 
                  style={{ 
                    height: `${h * (tamanho === 'micro' ? 20 : 40)}px`,
                    backgroundColor: i === 1 ? metrica.corPrimaria : `${metrica.corPrimaria}60`
                  }} 
                />
              ))}
            </div>
          )}
          
          {(metrica.tipoGrafico === 'linha' || metrica.tipoGrafico === 'area') && (
            <svg width={tamanho === 'micro' ? 60 : 100} height={tamanho === 'micro' ? 25 : 40} viewBox="0 0 100 40">
              <path
                d="M 0 30 Q 25 10, 50 20 T 100 15"
                fill="none"
                stroke={metrica.corPrimaria}
                strokeWidth="2"
              />
              {metrica.tipoGrafico === 'area' && (
                <path
                  d="M 0 30 Q 25 10, 50 20 T 100 15 L 100 40 L 0 40 Z"
                  fill={`${metrica.corPrimaria}30`}
                />
              )}
            </svg>
          )}
          
          {metrica.tipoGrafico === 'tabela' && (
            <div className="w-full px-1">
              {[1, 2, 3].slice(0, tamanho === 'micro' ? 2 : 3).map((_, i) => (
                <div key={i} className="flex gap-1 mb-1">
                  <div className="h-1.5 bg-gray-200 rounded flex-1" />
                  <div className="h-1.5 bg-gray-300 rounded w-8" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-[8px] text-center text-muted-foreground mt-auto">
          {tamanhoLabels[tamanho]} ({custoSlots[tamanho]} slot{custoSlots[tamanho] !== 1 ? 's' : ''})
        </div>
      </CardContent>
    </Card>
  );
}

interface WidgetGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWidgets: WidgetConfig[];
  onSave: (widgets: WidgetConfig[]) => void;
}

export function WidgetGallery({ open, onOpenChange, selectedWidgets, onSave }: WidgetGalleryProps) {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaMetrica | 'todas'>('todas');
  const [widgets, setWidgets] = useState<WidgetConfig[]>(selectedWidgets);

  // Resetar widgets quando o modal abre
  useMemo(() => {
    if (open) {
      setWidgets(selectedWidgets);
    }
  }, [open, selectedWidgets]);

  // Calcular slots usados
  const slotsUsados = useMemo(() => {
    return widgets.reduce((acc, w) => acc + custoSlots[w.tamanho], 0);
  }, [widgets]);

  const slotsDisponiveis = MAX_SLOTS - slotsUsados;

  // Filtrar métricas
  const metricasFiltradas = useMemo(() => {
    return todasMetricas.filter(m => {
      const matchBusca = busca === '' || 
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaAtiva === 'todas' || m.categoria === categoriaAtiva;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaAtiva]);

  // Verificar se um widget está selecionado
  const isWidgetSelected = (metricaId: string, tamanho: TamanhoWidget) => {
    return widgets.some(w => w.id === metricaId && w.tamanho === tamanho);
  };

  // Verificar se a métrica já está no dashboard (qualquer tamanho)
  const isMetricaNosDashboard = (metricaId: string) => {
    return widgets.some(w => w.id === metricaId);
  };

  // Toggle widget
  const toggleWidget = (metricaId: string, tamanho: TamanhoWidget) => {
    const existente = widgets.find(w => w.id === metricaId);
    
    if (existente) {
      // Se já existe com o mesmo tamanho, remove
      if (existente.tamanho === tamanho) {
        setWidgets(widgets.filter(w => w.id !== metricaId));
      } else {
        // Se existe com tamanho diferente, atualiza o tamanho
        const custoNovo = custoSlots[tamanho];
        const custoAntigo = custoSlots[existente.tamanho];
        const diferenca = custoNovo - custoAntigo;
        
        if (slotsDisponiveis >= diferenca) {
          setWidgets(widgets.map(w => 
            w.id === metricaId ? { ...w, tamanho } : w
          ));
        }
      }
    } else {
      // Adicionar novo widget se houver espaço
      const custo = custoSlots[tamanho];
      if (slotsDisponiveis >= custo) {
        setWidgets([...widgets, { id: metricaId, tamanho }]);
      }
    }
  };

  // Verificar se pode adicionar widget
  const podeAdicionar = (tamanho: TamanhoWidget, metricaId: string) => {
    const existente = widgets.find(w => w.id === metricaId);
    if (existente) {
      if (existente.tamanho === tamanho) return true; // Pode remover
      const diferenca = custoSlots[tamanho] - custoSlots[existente.tamanho];
      return slotsDisponiveis >= diferenca;
    }
    return slotsDisponiveis >= custoSlots[tamanho];
  };

  const handleSave = () => {
    onSave(widgets);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[95vw] w-[1400px] h-[85vh] max-h-[900px] p-0 gap-0 overflow-hidden bg-white"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          {/* Header unificado */}
          <div className="flex border-b">
            {/* Header da barra lateral */}
            <div className="w-[300px] min-w-[300px] p-4 bg-slate-50/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar widgets..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
            </div>
            {/* Header da área principal */}
            <div className="flex-1 p-4 flex items-center justify-between border-l">
              <div>
                <h2 className="text-lg font-semibold">Galeria de Widgets</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione os widgets para adicionar ao seu Dashboard
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {widgets.length} widget{widgets.length !== 1 ? 's' : ''} selecionado{widgets.length !== 1 ? 's' : ''}
                </Badge>
                <Button onClick={handleSave}>
                  Concluído
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="flex flex-1 overflow-hidden">
            {/* Barra lateral */}
            <div className="w-[300px] min-w-[300px] bg-slate-50/80 backdrop-blur-sm border-r flex flex-col">
              {/* Categorias */}
              <ScrollArea className="flex-1">
              <div className="p-2">
                <button
                  onClick={() => setCategoriaAtiva('todas')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    categoriaAtiva === 'todas' 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-slate-200'
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span className="font-medium">Todos os Widgets</span>
                </button>
                
                <div className="mt-2 space-y-1">
                  {categorias.map(cat => {
                    const count = todasMetricas.filter(m => m.categoria === cat.valor).length;
                    const selectedCount = widgets.filter(w => 
                      todasMetricas.find(m => m.id === w.id)?.categoria === cat.valor
                    ).length;
                    
                    return (
                      <button
                        key={cat.valor}
                        onClick={() => setCategoriaAtiva(cat.valor)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          categoriaAtiva === cat.valor 
                            ? 'bg-blue-500 text-white' 
                            : 'hover:bg-slate-200'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: categoriaAtiva === cat.valor ? 'white' : cat.cor }}
                        >
                          {categoriaAtiva === cat.valor ? (
                            <span className="text-blue-500 text-xs font-bold">{selectedCount}</span>
                          ) : (
                            <span className="text-white text-xs font-bold">{count}</span>
                          )}
                        </div>
                        <span className="font-medium">{cat.label}</span>
                        {selectedCount > 0 && categoriaAtiva !== cat.valor && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {selectedCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
            
            {/* Contador de slots */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Slots utilizados</span>
                <span className="text-sm font-bold">{slotsUsados} / {MAX_SLOTS}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(slotsUsados / MAX_SLOTS) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {slotsDisponiveis > 0 
                  ? `${slotsDisponiveis} slot${slotsDisponiveis !== 1 ? 's' : ''} disponível${slotsDisponiveis !== 1 ? 'is' : ''}`
                  : 'Dashboard cheio! Remova widgets para adicionar novos.'
                }
              </p>
            </div>
          </div>
          
          {/* Área principal */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-l">
            {/* Grid de widgets - todos lado a lado */}
            <ScrollArea className="flex-1 h-full">
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {metricasFiltradas.map(metrica => {
                    const isNoDashboard = isMetricaNosDashboard(metrica.id);
                    const isSelected = widgets.some(w => w.id === metrica.id);
                    const tamanhoAtual = widgets.find(w => w.id === metrica.id)?.tamanho || 'pequeno';
                    
                    return (
                      <div 
                        key={metrica.id} 
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            // Remove
                            setWidgets(widgets.filter(w => w.id !== metrica.id));
                          } else {
                            // Adiciona com tamanho padrão
                            const tamanhoDefault = (tamanhosPermitidos[metrica.id] || ['pequeno'])[0];
                            const custo = custoSlots[tamanhoDefault];
                            if (slotsDisponiveis >= custo) {
                              setWidgets([...widgets, { id: metrica.id, tamanho: tamanhoDefault }]);
                            }
                          }
                        }}
                      >
                        {/* Indicador de selecionado */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        {/* Ícone e nome */}
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${metrica.corPrimaria}20` }}
                          >
                            <div style={{ color: metrica.corPrimaria }}>
                              {iconeMap[metrica.icone] || <LayoutGrid className="h-4 w-4" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{metrica.nome}</h3>
                            <p className="text-xs text-muted-foreground truncate">{metrica.descricao}</p>
                          </div>
                        </div>
                        
                        {/* Preview do gráfico */}
                        <div className="h-16 flex items-center justify-center bg-slate-50 rounded-lg">
                          <div style={{ color: metrica.corPrimaria, opacity: 0.5 }}>
                            {metrica.tipoGrafico === 'numero' && <span className="text-2xl font-bold">123</span>}
                            {metrica.tipoGrafico === 'pizza' && <PieChart className="h-8 w-8" />}
                            {metrica.tipoGrafico === 'barra' && <BarChart3 className="h-8 w-8" />}
                            {metrica.tipoGrafico === 'linha' && <TrendingUp className="h-8 w-8" />}
                            {metrica.tipoGrafico === 'area' && <Activity className="h-8 w-8" />}
                            {metrica.tipoGrafico === 'gauge' && <Activity className="h-8 w-8" />}
                            {metrica.tipoGrafico === 'tabela' && <LayoutGrid className="h-8 w-8" />}
                          </div>
                        </div>
                        
                        {/* Badge de categoria */}
                        <div className="mt-2 flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}
                          >
                            {categorias.find(c => c.valor === metrica.categoria)?.label || metrica.categoria}
                          </Badge>
                          {isSelected && (
                            <span className="text-xs text-muted-foreground">
                              {custoSlots[tamanhoAtual]} slot{custoSlots[tamanhoAtual] !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {metricasFiltradas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum widget encontrado para "{busca}"</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Footer com dica */}
            <div className="p-3 border-t bg-slate-50 text-center">
              <p className="text-xs text-muted-foreground">
                <GripVertical className="h-3 w-3 inline mr-1" />
                Clique em um widget para adicionar ou remover do Dashboard. 
                Widgets micro ocupam 0.5 slot, pequeno 1 slot, médio 2 slots, grande 4 slots.
              </p>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { todasMetricas, tamanhosPermitidos, custoSlots, MAX_SLOTS };
export type { MetricaDefinicao, WidgetConfig, TamanhoWidget, CategoriaMetrica, PeriodoTempo };
