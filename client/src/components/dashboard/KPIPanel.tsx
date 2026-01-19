import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  CalendarCheck, 
  Percent,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos
interface KPIData {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  description: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: 'dollar' | 'users' | 'calendar' | 'percent';
  variant: 'primary' | 'success' | 'warning' | 'accent';
}

interface KPIPanelProps {
  data: KPIData[];
  isLoading?: boolean;
}

// Mapeamento de ícones
const iconMap = {
  dollar: DollarSign,
  users: Users,
  calendar: CalendarCheck,
  percent: Percent,
};

// Mapeamento de variantes de cor
const variantStyles = {
  primary: {
    iconBg: 'bg-gorgen-100',
    iconColor: 'text-gorgen-500',
  },
  success: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  accent: {
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
};

// Componente de Card KPI individual
function KPICard({ kpi, isLoading }: { kpi: KPIData; isLoading?: boolean }) {
  const Icon = iconMap[kpi.icon];
  const styles = variantStyles[kpi.variant];

  if (isLoading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-28 bg-gray-200 rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/50">
      {/* Header com label e ícone */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {kpi.label}
        </span>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          styles.iconBg
        )}>
          <Icon className={cn('w-[18px] h-[18px]', styles.iconColor)} />
        </div>
      </div>

      {/* Valor principal */}
      <div className="text-[32px] font-bold text-foreground leading-tight tracking-tight">
        {kpi.value}
      </div>

      {/* Descrição/unidade */}
      <div className="text-sm text-muted-foreground mt-1">
        {kpi.description}
      </div>

      {/* Indicador de variação */}
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

// Componente principal do Painel de KPIs
export function KPIPanel({ data, isLoading }: KPIPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {data.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}

// Dados padrão para o Dashboard (podem ser substituídos por dados reais)
export function useKPIData(dashboardStats: any, periodo: string) {
  // Calcular variações (mock - substituir por cálculo real)
  const calcularVariacao = (atual: number, anterior: number): { value: number; isPositive: boolean } | undefined => {
    if (!anterior || anterior === 0) return undefined;
    const variacao = ((atual - anterior) / anterior) * 100;
    return {
      value: Math.abs(Number(variacao.toFixed(1))),
      isPositive: variacao >= 0,
    };
  };

  const kpis: KPIData[] = [
    {
      id: 'faturamento',
      label: 'Faturamento Total',
      value: dashboardStats?.faturamentoTotal 
        ? `R$ ${Number(dashboardStats.faturamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : 'R$ 0',
      description: 'no período selecionado',
      change: dashboardStats?.faturamentoAnterior 
        ? calcularVariacao(dashboardStats.faturamentoTotal, dashboardStats.faturamentoAnterior)
        : undefined,
      icon: 'dollar',
      variant: 'success',
    },
    {
      id: 'pacientes',
      label: 'Pacientes Ativos',
      value: dashboardStats?.totalPacientes?.toLocaleString('pt-BR') || '0',
      description: 'pacientes cadastrados',
      change: dashboardStats?.pacientesAnterior
        ? calcularVariacao(dashboardStats.totalPacientes, dashboardStats.pacientesAnterior)
        : undefined,
      icon: 'users',
      variant: 'primary',
    },
    {
      id: 'atendimentos',
      label: 'Atendimentos',
      value: dashboardStats?.totalAtendimentos?.toLocaleString('pt-BR') || '0',
      description: 'no período selecionado',
      change: dashboardStats?.atendimentosAnterior
        ? calcularVariacao(dashboardStats.totalAtendimentos, dashboardStats.atendimentosAnterior)
        : undefined,
      icon: 'calendar',
      variant: 'warning',
    },
    {
      id: 'taxa_recebimento',
      label: 'Taxa de Recebimento',
      value: dashboardStats?.taxaRecebimento 
        ? `${Number(dashboardStats.taxaRecebimento).toFixed(1)}%`
        : '0%',
      description: 'do faturamento recebido',
      change: dashboardStats?.taxaRecebimentoAnterior
        ? calcularVariacao(dashboardStats.taxaRecebimento, dashboardStats.taxaRecebimentoAnterior)
        : undefined,
      icon: 'percent',
      variant: 'accent',
    },
  ];

  return kpis;
}

export default KPIPanel;
