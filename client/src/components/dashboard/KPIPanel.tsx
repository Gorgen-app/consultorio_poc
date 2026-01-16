/**
 * GORGEN Design System - KPI Panel (Painel de Voo)
 * Componente para exibir os 4 KPIs principais no topo do Dashboard
 */

import { DollarSign, Users, Stethoscope, TrendingUp, TrendingDown } from "lucide-react";

interface KPIData {
  faturamento: number;
  faturamentoVariacao?: number;
  pacientesAtivos: number;
  pacientesVariacao?: number;
  atendimentos: number;
  atendimentosVariacao?: number;
  taxaRecebimento: number;
  taxaVariacao?: number;
}

interface KPIPanelProps {
  data: KPIData;
  periodo?: string;
}

export function KPIPanel({ data, periodo = "Últimos 30 dias" }: KPIPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const kpis = [
    {
      label: "Faturamento Total",
      value: formatCurrency(data.faturamento),
      unit: periodo,
      variacao: data.faturamentoVariacao,
      icon: DollarSign,
      iconClass: "bg-gorgen-success-light text-gorgen-success"
    },
    {
      label: "Pacientes Ativos",
      value: formatNumber(data.pacientesAtivos),
      unit: "pacientes",
      variacao: data.pacientesVariacao,
      icon: Users,
      iconClass: "bg-gorgen-100 text-gorgen-700"
    },
    {
      label: "Atendimentos",
      value: formatNumber(data.atendimentos),
      unit: periodo,
      variacao: data.atendimentosVariacao,
      icon: Stethoscope,
      iconClass: "bg-gorgen-info-light text-gorgen-info"
    },
    {
      label: "Taxa de Recebimento",
      value: `${data.taxaRecebimento.toFixed(1)}%`,
      unit: "do faturado",
      variacao: data.taxaVariacao,
      icon: TrendingUp,
      iconClass: "bg-gorgen-warning-light text-gorgen-warning"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.iconClass}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </div>
          
          {/* Value */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gorgen-700">{kpi.value}</span>
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{kpi.unit}</span>
            {kpi.variacao !== undefined && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                  kpi.variacao >= 0
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {kpi.variacao >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPercent(kpi.variacao)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KPIPanel;
