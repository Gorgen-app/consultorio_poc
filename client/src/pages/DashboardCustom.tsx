import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download,
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

// Tipos
type PeriodoTempo = '7d' | '30d' | '3m' | '6m' | '1a' | '3a' | '5a' | 'todo';

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
  { id: 'fin_faturamento_tipo', nome: 'Faturamento por Tipo', descricao: 'Receita por procedimento', categoria: 'economico_financeiro', tipoGrafico: 'barra', unidade: 'R$', icone: 'BarChart', corPrimaria: '#06B6D4' },
  { id: 'fin_previsao_recebimento', nome: 'Previsão de Recebimento', descricao: 'Valores a receber', categoria: 'economico_financeiro', tipoGrafico: 'barra', unidade: 'R$', icone: 'Calendar', corPrimaria: '#84CC16' },
  { id: 'fin_comparativo_mensal', nome: 'Comparativo Mensal', descricao: 'Faturamento mês a mês', categoria: 'economico_financeiro', tipoGrafico: 'barra', unidade: 'R$', icone: 'BarChart3', corPrimaria: '#EC4899' },
  
  // QUALIDADE DO ATENDIMENTO (10)
  { id: 'qua_diagnosticos_frequentes', nome: 'Diagnósticos Frequentes', descricao: 'Top diagnósticos', categoria: 'qualidade_atendimento', tipoGrafico: 'barra', icone: 'FileText', corPrimaria: '#3B82F6' },
  { id: 'qua_tempo_medio_consulta', nome: 'Tempo Médio de Consulta', descricao: 'Duração média', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', unidade: 'min', icone: 'Clock', corPrimaria: '#10B981' },
  { id: 'qua_taxa_retorno', nome: 'Taxa de Retorno', descricao: 'Pacientes que retornam', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'RefreshCw', corPrimaria: '#8B5CF6' },
  { id: 'qua_tempo_espera', nome: 'Tempo de Espera', descricao: 'Tempo até atendimento', categoria: 'qualidade_atendimento', tipoGrafico: 'numero', unidade: 'dias', icone: 'Hourglass', corPrimaria: '#F59E0B' },
  { id: 'qua_evolucao_casos', nome: 'Evolução dos Casos', descricao: 'Acompanhamento clínico', categoria: 'qualidade_atendimento', tipoGrafico: 'linha', icone: 'TrendingUp', corPrimaria: '#EF4444' },
  { id: 'qua_taxa_complicacoes', nome: 'Taxa de Complicações', descricao: 'Casos com complicações', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'AlertCircle', corPrimaria: '#F97316' },
  { id: 'qua_adesao_tratamento', nome: 'Adesão ao Tratamento', descricao: 'Pacientes aderentes', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'CheckCircle2', corPrimaria: '#06B6D4' },
  { id: 'qua_tempo_seguimento', nome: 'Tempo de Seguimento', descricao: 'Tempo por diagnóstico', categoria: 'qualidade_atendimento', tipoGrafico: 'barra', unidade: 'meses', icone: 'Calendar', corPrimaria: '#84CC16' },
  { id: 'qua_desfechos_clinicos', nome: 'Desfechos Clínicos', descricao: 'Distribuição de desfechos', categoria: 'qualidade_atendimento', tipoGrafico: 'pizza', icone: 'Target', corPrimaria: '#EC4899' },
  { id: 'qua_satisfacao_paciente', nome: 'Satisfação do Paciente', descricao: 'Índice de satisfação', categoria: 'qualidade_atendimento', tipoGrafico: 'gauge', unidade: '%', icone: 'Smile', corPrimaria: '#14B8A6' },
  
  // DIVERSAS (10)
  { id: 'div_agenda_ocupacao', nome: 'Ocupação da Agenda', descricao: 'Slots preenchidos', categoria: 'diversas', tipoGrafico: 'gauge', unidade: '%', icone: 'Calendar', corPrimaria: '#3B82F6' },
  { id: 'div_taxa_no_show', nome: 'Taxa de No-Show', descricao: 'Pacientes que faltam', categoria: 'diversas', tipoGrafico: 'gauge', unidade: '%', icone: 'UserX', corPrimaria: '#EF4444' },
  { id: 'div_cancelamentos', nome: 'Cancelamentos', descricao: 'Consultas canceladas', categoria: 'diversas', tipoGrafico: 'linha', icone: 'XCircle', corPrimaria: '#F97316' },
  { id: 'div_reagendamentos', nome: 'Reagendamentos', descricao: 'Consultas reagendadas', categoria: 'diversas', tipoGrafico: 'linha', icone: 'RefreshCcw', corPrimaria: '#8B5CF6' },
  { id: 'div_proximos_atendimentos', nome: 'Próximos Atendimentos', descricao: 'Agenda 7 dias', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'ListTodo', corPrimaria: '#10B981' },
  { id: 'div_aniversariantes', nome: 'Aniversariantes do Mês', descricao: 'Pacientes aniversariantes', categoria: 'diversas', tipoGrafico: 'tabela', icone: 'Cake', corPrimaria: '#EC4899' },
  { id: 'div_alertas_pendentes', nome: 'Alertas Pendentes', descricao: 'Notificações pendentes', categoria: 'diversas', tipoGrafico: 'numero', icone: 'Bell', corPrimaria: '#F59E0B' },
  { id: 'div_documentos_pendentes', nome: 'Documentos Pendentes', descricao: 'Prontuários incompletos', categoria: 'diversas', tipoGrafico: 'numero', icone: 'FileWarning', corPrimaria: '#06B6D4' },
  { id: 'div_performance_sistema', nome: 'Performance do Sistema', descricao: 'Tempo de resposta', categoria: 'diversas', tipoGrafico: 'linha', unidade: 'ms', icone: 'Activity', corPrimaria: '#84CC16' },
  { id: 'div_uso_sistema', nome: 'Uso do Sistema', descricao: 'Acessos e operações', categoria: 'diversas', tipoGrafico: 'area', icone: 'BarChart2', corPrimaria: '#14B8A6' },
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

// Componente de Widget de Métrica
function MetricaWidget({ metrica, periodo }: { metrica: MetricaDefinicao; periodo: PeriodoTempo }) {
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

  // Renderizar conteúdo baseado no tipo de gráfico
  const renderConteudo = () => {
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
        <div className="flex flex-col items-center justify-center h-32">
          <span className="text-4xl font-bold" style={{ color: metrica.corPrimaria }}>
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
      
      return (
        <div className="flex flex-col items-center justify-center h-32">
          <div className="relative w-24 h-24">
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
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{valor}%</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Métricas de pizza
    if (metrica.tipoGrafico === 'pizza') {
      let dados: any[] = [];
      
      if (metrica.id === 'pac_distribuicao_sexo' && pacDistribuicaoSexo) dados = pacDistribuicaoSexo.dados as any[];
      if (metrica.id === 'pac_distribuicao_convenio' && pacDistribuicaoConvenio) dados = pacDistribuicaoConvenio.dados as any[];
      if (metrica.id === 'atd_por_tipo' && atdPorTipo) dados = atdPorTipo.dados as any[];
      if (metrica.id === 'atd_novos_vs_retorno' && atdNovosVsRetorno) dados = atdNovosVsRetorno.dados as any[];
      if (metrica.id === 'fin_faturamento_convenio' && finPorConvenio) dados = finPorConvenio.dados as any[];
      
      if (!dados || dados.length === 0) {
        return <div className="flex items-center justify-center h-32 text-muted-foreground">Sem dados</div>;
      }
      
      const dadosFormatados = dados.map((d: any, i: number) => ({
        name: d.categoria || d.convenio || d.tipo || d.nome || 'Outros',
        value: Number(d.quantidade || d.valor || 0),
        fill: CORES_GRAFICOS[i % CORES_GRAFICOS.length],
      }));
      
      return (
        <ResponsiveContainer width="100%" height={180}>
          <RechartsPieChart>
            <Pie
              data={dadosFormatados}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {dadosFormatados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }
    
    // Métricas de barra
    if (metrica.tipoGrafico === 'barra') {
      let dados: any[] = [];
      
      if (metrica.id === 'pac_faixa_etaria' && pacFaixaEtaria) dados = pacFaixaEtaria.dados as any[];
      if (metrica.id === 'pac_distribuicao_cidade' && pacDistribuicaoCidade) dados = pacDistribuicaoCidade.dados as any[];
      if (metrica.id === 'atd_por_local' && atdPorLocal) dados = atdPorLocal.dados as any[];
      if (metrica.id === 'atd_por_convenio' && atdPorConvenio) dados = atdPorConvenio.dados as any[];
      if (metrica.id === 'atd_dia_semana' && atdDiaSemana) dados = atdDiaSemana.dados as any[];
      if (metrica.id === 'atd_procedimentos_realizados' && atdProcedimentos) dados = atdProcedimentos.dados as any[];
      if (metrica.id === 'fin_faturamento_tipo' && finPorTipo) dados = finPorTipo.dados as any[];
      if (metrica.id === 'fin_comparativo_mensal' && finComparativo) dados = finComparativo.dados as any[];
      if (metrica.id === 'qua_diagnosticos_frequentes' && quaDiagnosticos) dados = quaDiagnosticos.dados as any[];
      
      if (!dados || dados.length === 0) {
        return <div className="flex items-center justify-center h-32 text-muted-foreground">Sem dados</div>;
      }
      
      const dadosFormatados = dados.map((d: any) => ({
        name: d.faixa_etaria || d.cidade || d.local || d.convenio || d.dia_semana || d.procedimento || d.tipo || d.mes || d.diagnostico || 'Outros',
        valor: Number(d.quantidade || d.valor || d.faturamento || 0),
      }));
      
      return (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dadosFormatados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="valor" fill={metrica.corPrimaria} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    // Métricas de área/linha
    if (metrica.tipoGrafico === 'area' || metrica.tipoGrafico === 'linha') {
      let dados: any[] = [];
      
      if (metrica.id === 'atd_evolucao_temporal' && atdEvolucao) dados = atdEvolucao.dados as any[];
      if (metrica.id === 'fin_evolucao_faturamento' && finEvolucao) dados = finEvolucao.dados as any[];
      
      if (!dados || dados.length === 0) {
        return <div className="flex items-center justify-center h-32 text-muted-foreground">Sem dados</div>;
      }
      
      const dadosFormatados = dados.map((d: any) => ({
        data: d.data,
        valor: Number(d.quantidade || d.valor || 0),
      }));
      
      return (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dadosFormatados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="valor" 
              stroke={metrica.corPrimaria} 
              fill={metrica.corPrimaria} 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    // Métricas de tabela
    if (metrica.tipoGrafico === 'tabela') {
      let dados: any[] = [];
      
      if (metrica.id === 'div_proximos_atendimentos' && divProximos) dados = divProximos.dados as any[];
      if (metrica.id === 'div_aniversariantes' && divAniversariantes) dados = divAniversariantes.dados as any[];
      
      if (!dados || dados.length === 0) {
        return <div className="flex items-center justify-center h-32 text-muted-foreground">Sem dados</div>;
      }
      
      return (
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-sm">
            <tbody>
              {dados.slice(0, 5).map((d: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="py-1 px-2">{d.nome || d.paciente}</td>
                  <td className="py-1 px-2 text-right text-muted-foreground">
                    {d.data_atendimento ? new Date(d.data_atendimento).toLocaleDateString('pt-BR') : 
                     d.data_nascimento ? `${d.dia}/${new Date().getMonth() + 1}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return <div className="flex items-center justify-center h-32 text-muted-foreground">Carregando...</div>;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{metrica.nome}</CardTitle>
          <Badge variant="outline" style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}>
            {categorias.find(c => c.valor === metrica.categoria)?.label.split(' ')[0]}
          </Badge>
        </div>
        <CardDescription className="text-xs">{metrica.descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderConteudo()}
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function DashboardCustom() {
  const [periodo, setPeriodo] = useState<PeriodoTempo>('30d');
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<string[]>([
    'pac_total_ativos',
    'atd_total_periodo',
    'fin_faturamento_total',
    'atd_evolucao_temporal',
    'pac_distribuicao_convenio',
    'fin_taxa_recebimento',
  ]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaMetrica | 'todas'>('todas');
  
  // Buscar configuração salva
  const { data: configSalva, isLoading: carregandoConfig } = trpc.dashboardMetricas.getConfig.useQuery();
  
  // Mutation para salvar configuração
  const salvarConfig = trpc.dashboardMetricas.saveConfig.useMutation({
    onSuccess: () => {
      setDialogAberto(false);
    },
  });
  
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
  
  const metricasExibidas = todasMetricas.filter(m => metricasSelecionadas.includes(m.id));

  if (carregandoConfig) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Customizável</h1>
            <p className="text-muted-foreground">
              {metricasSelecionadas.length} métricas selecionadas de {todasMetricas.length} disponíveis
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Seletor de período */}
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
                <Tabs value={categoriaFiltro} onValueChange={(v) => setCategoriaFiltro(v as any)}>
                  <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    {categorias.map(cat => (
                      <TabsTrigger key={cat.valor} value={cat.valor} className="text-xs">
                        {cat.icone}
                        <span className="ml-1 hidden md:inline">{cat.label.split(' ')[0]}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                {/* Lista de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {metricasFiltradas.map(metrica => (
                    <div 
                      key={metrica.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        metricasSelecionadas.includes(metrica.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleMetrica(metrica.id)}
                    >
                      <Checkbox 
                        checked={metricasSelecionadas.includes(metrica.id)}
                        onCheckedChange={() => toggleMetrica(metrica.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{metrica.nome}</div>
                        <div className="text-xs text-muted-foreground truncate">{metrica.descricao}</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: metrica.corPrimaria, color: metrica.corPrimaria }}
                      >
                        {metrica.tipoGrafico}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {/* Botões de ação */}
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {metricasSelecionadas.length} métricas selecionadas
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setMetricasSelecionadas([])}
                    >
                      Limpar
                    </Button>
                    <Button 
                      onClick={() => salvarConfig.mutate({
                        metricasSelecionadas,
                        periodoDefault: periodo,
                      })}
                      disabled={salvarConfig.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configuração
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Botão de atualizar */}
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Grid de métricas */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricasExibidas.map(metrica => (
              <MetricaWidget key={metrica.id} metrica={metrica} periodo={periodo} />
            ))}
          </div>
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
    </DashboardLayout>
  );
}
