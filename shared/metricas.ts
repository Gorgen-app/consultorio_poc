// Definição das 50 métricas do Dashboard Customizável
// Organizado em 5 categorias com 10 métricas cada

export type PeriodoTempo = '7d' | '30d' | '3m' | '6m' | '1a' | '3a' | '5a' | 'todo';

export type TipoGrafico = 'linha' | 'barra' | 'pizza' | 'area' | 'numero' | 'tabela' | 'gauge';

export type CategoriaMetrica = 
  | 'populacao_pacientes'
  | 'atendimentos'
  | 'economico_financeiro'
  | 'qualidade_atendimento'
  | 'diversas';

export interface DefinicaoMetrica {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaMetrica;
  tipoGrafico: TipoGrafico;
  unidade?: string;
  subcategorias?: string[];
  corPrimaria: string;
  icone: string;
}

// ========================================
// CATEGORIA 1: POPULAÇÃO DE PACIENTES (10)
// ========================================
export const metricasPacientes: DefinicaoMetrica[] = [
  {
    id: 'pac_total_ativos',
    nome: 'Total de Pacientes Ativos',
    descricao: 'Número total de pacientes com status ativo no sistema',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'numero',
    icone: 'Users',
    corPrimaria: '#3B82F6',
  },
  {
    id: 'pac_novos_periodo',
    nome: 'Novos Pacientes',
    descricao: 'Quantidade de pacientes cadastrados no período selecionado',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'linha',
    icone: 'UserPlus',
    corPrimaria: '#10B981',
  },
  {
    id: 'pac_distribuicao_sexo',
    nome: 'Distribuição por Sexo',
    descricao: 'Proporção de pacientes masculinos e femininos',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'pizza',
    icone: 'PieChart',
    corPrimaria: '#8B5CF6',
  },
  {
    id: 'pac_faixa_etaria',
    nome: 'Distribuição por Faixa Etária',
    descricao: 'Pacientes agrupados por faixa etária (0-18, 19-30, 31-45, 46-60, 60+)',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'barra',
    icone: 'BarChart3',
    corPrimaria: '#F59E0B',
  },
  {
    id: 'pac_distribuicao_cidade',
    nome: 'Distribuição Geográfica',
    descricao: 'Pacientes por cidade/região',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'barra',
    icone: 'MapPin',
    corPrimaria: '#EF4444',
  },
  {
    id: 'pac_taxa_retencao',
    nome: 'Taxa de Retenção',
    descricao: 'Percentual de pacientes que retornaram para atendimento',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'RefreshCw',
    corPrimaria: '#06B6D4',
  },
  {
    id: 'pac_tempo_acompanhamento',
    nome: 'Tempo Médio de Acompanhamento',
    descricao: 'Tempo médio desde o primeiro atendimento dos pacientes ativos',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'numero',
    unidade: 'anos',
    icone: 'Clock',
    corPrimaria: '#84CC16',
  },
  {
    id: 'pac_inativos_periodo',
    nome: 'Pacientes Inativos',
    descricao: 'Pacientes sem atendimento há mais de 360 dias',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'linha',
    icone: 'UserMinus',
    corPrimaria: '#F97316',
  },
  {
    id: 'pac_obitos_periodo',
    nome: 'Óbitos no Período',
    descricao: 'Registro de óbitos de pacientes no período',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'linha',
    icone: 'Heart',
    corPrimaria: '#6B7280',
  },
  {
    id: 'pac_distribuicao_convenio',
    nome: 'Distribuição por Convênio',
    descricao: 'Pacientes agrupados por operadora de saúde',
    categoria: 'populacao_pacientes',
    tipoGrafico: 'pizza',
    icone: 'Building2',
    corPrimaria: '#EC4899',
  },
];

// ========================================
// CATEGORIA 2: ATENDIMENTOS (10)
// ========================================
export const metricasAtendimentos: DefinicaoMetrica[] = [
  {
    id: 'atd_total_periodo',
    nome: 'Total de Atendimentos',
    descricao: 'Quantidade total de atendimentos no período',
    categoria: 'atendimentos',
    tipoGrafico: 'numero',
    icone: 'Calendar',
    corPrimaria: '#3B82F6',
    subcategorias: ['Todos', 'Consulta', 'Retorno', 'Cirurgia', 'Procedimento', 'Exame'],
  },
  {
    id: 'atd_evolucao_temporal',
    nome: 'Evolução de Atendimentos',
    descricao: 'Tendência de atendimentos ao longo do tempo',
    categoria: 'atendimentos',
    tipoGrafico: 'area',
    icone: 'TrendingUp',
    corPrimaria: '#10B981',
    subcategorias: ['Todos', 'Consulta', 'Retorno', 'Cirurgia', 'Procedimento', 'Exame'],
  },
  {
    id: 'atd_por_tipo',
    nome: 'Atendimentos por Tipo',
    descricao: 'Distribuição de atendimentos por tipo (consulta, cirurgia, etc)',
    categoria: 'atendimentos',
    tipoGrafico: 'pizza',
    icone: 'PieChart',
    corPrimaria: '#8B5CF6',
  },
  {
    id: 'atd_por_local',
    nome: 'Atendimentos por Local',
    descricao: 'Distribuição por local de atendimento',
    categoria: 'atendimentos',
    tipoGrafico: 'barra',
    icone: 'Building',
    corPrimaria: '#F59E0B',
  },
  {
    id: 'atd_por_convenio',
    nome: 'Atendimentos por Convênio',
    descricao: 'Quantidade de atendimentos por operadora de saúde',
    categoria: 'atendimentos',
    tipoGrafico: 'barra',
    icone: 'CreditCard',
    corPrimaria: '#EF4444',
  },
  {
    id: 'atd_media_diaria',
    nome: 'Média de Atendimentos/Dia',
    descricao: 'Média de atendimentos realizados por dia útil',
    categoria: 'atendimentos',
    tipoGrafico: 'numero',
    icone: 'Activity',
    corPrimaria: '#06B6D4',
  },
  {
    id: 'atd_dia_semana',
    nome: 'Atendimentos por Dia da Semana',
    descricao: 'Distribuição de atendimentos por dia da semana',
    categoria: 'atendimentos',
    tipoGrafico: 'barra',
    icone: 'CalendarDays',
    corPrimaria: '#84CC16',
  },
  {
    id: 'atd_hora_pico',
    nome: 'Horários de Pico',
    descricao: 'Distribuição de atendimentos por horário do dia',
    categoria: 'atendimentos',
    tipoGrafico: 'area',
    icone: 'Clock',
    corPrimaria: '#F97316',
  },
  {
    id: 'atd_novos_vs_retorno',
    nome: 'Novos vs Retornos',
    descricao: 'Proporção entre primeiras consultas e retornos',
    categoria: 'atendimentos',
    tipoGrafico: 'pizza',
    icone: 'RefreshCw',
    corPrimaria: '#EC4899',
  },
  {
    id: 'atd_procedimentos_realizados',
    nome: 'Procedimentos Realizados',
    descricao: 'Top procedimentos mais realizados no período',
    categoria: 'atendimentos',
    tipoGrafico: 'barra',
    icone: 'Stethoscope',
    corPrimaria: '#14B8A6',
  },
];

// ========================================
// CATEGORIA 3: ECONÔMICO-FINANCEIRO (10)
// ========================================
export const metricasFinanceiras: DefinicaoMetrica[] = [
  {
    id: 'fin_faturamento_total',
    nome: 'Faturamento Total',
    descricao: 'Valor total faturado no período',
    categoria: 'economico_financeiro',
    tipoGrafico: 'numero',
    unidade: 'R$',
    icone: 'DollarSign',
    corPrimaria: '#10B981',
  },
  {
    id: 'fin_evolucao_faturamento',
    nome: 'Evolução do Faturamento',
    descricao: 'Tendência do faturamento ao longo do tempo',
    categoria: 'economico_financeiro',
    tipoGrafico: 'area',
    unidade: 'R$',
    icone: 'TrendingUp',
    corPrimaria: '#3B82F6',
  },
  {
    id: 'fin_faturamento_convenio',
    nome: 'Faturamento por Convênio',
    descricao: 'Distribuição do faturamento por operadora',
    categoria: 'economico_financeiro',
    tipoGrafico: 'pizza',
    unidade: 'R$',
    icone: 'PieChart',
    corPrimaria: '#8B5CF6',
  },
  {
    id: 'fin_ticket_medio',
    nome: 'Ticket Médio',
    descricao: 'Valor médio por atendimento',
    categoria: 'economico_financeiro',
    tipoGrafico: 'numero',
    unidade: 'R$',
    icone: 'Receipt',
    corPrimaria: '#F59E0B',
  },
  {
    id: 'fin_taxa_recebimento',
    nome: 'Taxa de Recebimento',
    descricao: 'Percentual do faturamento efetivamente recebido',
    categoria: 'economico_financeiro',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'CheckCircle',
    corPrimaria: '#10B981',
  },
  {
    id: 'fin_glosas',
    nome: 'Glosas',
    descricao: 'Valor de glosas por período',
    categoria: 'economico_financeiro',
    tipoGrafico: 'linha',
    unidade: 'R$',
    icone: 'XCircle',
    corPrimaria: '#EF4444',
  },
  {
    id: 'fin_inadimplencia',
    nome: 'Inadimplência',
    descricao: 'Valor em aberto além do prazo',
    categoria: 'economico_financeiro',
    tipoGrafico: 'numero',
    unidade: 'R$',
    icone: 'AlertTriangle',
    corPrimaria: '#F97316',
  },
  {
    id: 'fin_faturamento_tipo',
    nome: 'Faturamento por Tipo de Atendimento',
    descricao: 'Receita por tipo de procedimento',
    categoria: 'economico_financeiro',
    tipoGrafico: 'barra',
    unidade: 'R$',
    icone: 'BarChart',
    corPrimaria: '#06B6D4',
  },
  {
    id: 'fin_previsao_recebimento',
    nome: 'Previsão de Recebimento',
    descricao: 'Valores a receber nos próximos 30/60/90 dias',
    categoria: 'economico_financeiro',
    tipoGrafico: 'barra',
    unidade: 'R$',
    icone: 'Calendar',
    corPrimaria: '#84CC16',
  },
  {
    id: 'fin_comparativo_mensal',
    nome: 'Comparativo Mensal',
    descricao: 'Comparação de faturamento mês a mês',
    categoria: 'economico_financeiro',
    tipoGrafico: 'barra',
    unidade: 'R$',
    icone: 'BarChart3',
    corPrimaria: '#EC4899',
  },
];

// ========================================
// CATEGORIA 4: QUALIDADE DO ATENDIMENTO (10)
// ========================================
export const metricasQualidade: DefinicaoMetrica[] = [
  {
    id: 'qua_diagnosticos_frequentes',
    nome: 'Diagnósticos Mais Frequentes',
    descricao: 'Top diagnósticos registrados no período',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'barra',
    icone: 'FileText',
    corPrimaria: '#3B82F6',
  },
  {
    id: 'qua_tempo_medio_consulta',
    nome: 'Tempo Médio de Consulta',
    descricao: 'Duração média dos atendimentos',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'numero',
    unidade: 'min',
    icone: 'Clock',
    corPrimaria: '#10B981',
  },
  {
    id: 'qua_taxa_retorno',
    nome: 'Taxa de Retorno',
    descricao: 'Percentual de pacientes que retornam para acompanhamento',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'RefreshCw',
    corPrimaria: '#8B5CF6',
  },
  {
    id: 'qua_tempo_espera',
    nome: 'Tempo de Espera',
    descricao: 'Tempo médio entre agendamento e atendimento',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'numero',
    unidade: 'dias',
    icone: 'Hourglass',
    corPrimaria: '#F59E0B',
  },
  {
    id: 'qua_evolucao_casos',
    nome: 'Evolução dos Casos',
    descricao: 'Acompanhamento da evolução clínica dos pacientes',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'linha',
    icone: 'TrendingUp',
    corPrimaria: '#EF4444',
  },
  {
    id: 'qua_taxa_complicacoes',
    nome: 'Taxa de Complicações',
    descricao: 'Percentual de casos com complicações registradas',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'AlertCircle',
    corPrimaria: '#F97316',
  },
  {
    id: 'qua_adesao_tratamento',
    nome: 'Adesão ao Tratamento',
    descricao: 'Percentual de pacientes que seguem o tratamento prescrito',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'CheckCircle2',
    corPrimaria: '#06B6D4',
  },
  {
    id: 'qua_tempo_seguimento',
    nome: 'Tempo de Seguimento',
    descricao: 'Tempo médio de acompanhamento por diagnóstico',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'barra',
    unidade: 'meses',
    icone: 'Calendar',
    corPrimaria: '#84CC16',
  },
  {
    id: 'qua_desfechos_clinicos',
    nome: 'Desfechos Clínicos',
    descricao: 'Distribuição dos desfechos (cura, controle, óbito)',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'pizza',
    icone: 'Target',
    corPrimaria: '#EC4899',
  },
  {
    id: 'qua_satisfacao_paciente',
    nome: 'Satisfação do Paciente',
    descricao: 'Índice de satisfação baseado em feedbacks',
    categoria: 'qualidade_atendimento',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'Smile',
    corPrimaria: '#14B8A6',
  },
];

// ========================================
// CATEGORIA 5: MÉTRICAS DIVERSAS (10)
// ========================================
export const metricasDiversas: DefinicaoMetrica[] = [
  {
    id: 'div_agenda_ocupacao',
    nome: 'Ocupação da Agenda',
    descricao: 'Percentual de slots de agenda preenchidos',
    categoria: 'diversas',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'Calendar',
    corPrimaria: '#3B82F6',
  },
  {
    id: 'div_taxa_no_show',
    nome: 'Taxa de No-Show',
    descricao: 'Percentual de pacientes que faltam às consultas',
    categoria: 'diversas',
    tipoGrafico: 'gauge',
    unidade: '%',
    icone: 'UserX',
    corPrimaria: '#EF4444',
  },
  {
    id: 'div_cancelamentos',
    nome: 'Cancelamentos',
    descricao: 'Quantidade de consultas canceladas no período',
    categoria: 'diversas',
    tipoGrafico: 'linha',
    icone: 'XCircle',
    corPrimaria: '#F97316',
  },
  {
    id: 'div_reagendamentos',
    nome: 'Reagendamentos',
    descricao: 'Quantidade de consultas reagendadas',
    categoria: 'diversas',
    tipoGrafico: 'linha',
    icone: 'RefreshCcw',
    corPrimaria: '#8B5CF6',
  },
  {
    id: 'div_proximos_atendimentos',
    nome: 'Próximos Atendimentos',
    descricao: 'Atendimentos agendados para os próximos 7 dias',
    categoria: 'diversas',
    tipoGrafico: 'tabela',
    icone: 'ListTodo',
    corPrimaria: '#10B981',
  },
  {
    id: 'div_aniversariantes',
    nome: 'Aniversariantes do Mês',
    descricao: 'Lista de pacientes que fazem aniversário no mês',
    categoria: 'diversas',
    tipoGrafico: 'tabela',
    icone: 'Cake',
    corPrimaria: '#EC4899',
  },
  {
    id: 'div_alertas_pendentes',
    nome: 'Alertas Pendentes',
    descricao: 'Notificações e alertas que requerem atenção',
    categoria: 'diversas',
    tipoGrafico: 'numero',
    icone: 'Bell',
    corPrimaria: '#F59E0B',
  },
  {
    id: 'div_documentos_pendentes',
    nome: 'Documentos Pendentes',
    descricao: 'Prontuários ou documentos aguardando preenchimento',
    categoria: 'diversas',
    tipoGrafico: 'numero',
    icone: 'FileWarning',
    corPrimaria: '#06B6D4',
  },
  {
    id: 'div_performance_sistema',
    nome: 'Performance do Sistema',
    descricao: 'Tempo médio de resposta do sistema',
    categoria: 'diversas',
    tipoGrafico: 'linha',
    unidade: 'ms',
    icone: 'Activity',
    corPrimaria: '#84CC16',
  },
  {
    id: 'div_uso_sistema',
    nome: 'Uso do Sistema',
    descricao: 'Quantidade de acessos e operações realizadas',
    categoria: 'diversas',
    tipoGrafico: 'area',
    icone: 'BarChart2',
    corPrimaria: '#14B8A6',
  },
];

// Todas as métricas combinadas
export const todasMetricas: DefinicaoMetrica[] = [
  ...metricasPacientes,
  ...metricasAtendimentos,
  ...metricasFinanceiras,
  ...metricasQualidade,
  ...metricasDiversas,
];

// Períodos de tempo disponíveis
export const periodosTempo: { valor: PeriodoTempo; label: string }[] = [
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: '3m', label: '3 meses' },
  { valor: '6m', label: '6 meses' },
  { valor: '1a', label: '1 ano' },
  { valor: '3a', label: '3 anos' },
  { valor: '5a', label: '5 anos' },
  { valor: 'todo', label: 'Todo o período' },
];

// Categorias disponíveis
export const categorias: { valor: CategoriaMetrica; label: string; cor: string }[] = [
  { valor: 'populacao_pacientes', label: 'População de Pacientes', cor: '#3B82F6' },
  { valor: 'atendimentos', label: 'Atendimentos', cor: '#10B981' },
  { valor: 'economico_financeiro', label: 'Econômico-Financeiro', cor: '#F59E0B' },
  { valor: 'qualidade_atendimento', label: 'Qualidade do Atendimento', cor: '#8B5CF6' },
  { valor: 'diversas', label: 'Diversas', cor: '#EC4899' },
];
