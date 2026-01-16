import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  Users,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Percent,
  Settings,
  UserPlus,
  UserMinus,
  Clock,
  Receipt,
  PieChart,
  BarChart3,
  Activity,
  MapPin,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

// Cores do Design System Gorgen
const CORES_GORGEN = {
  primary: "#203864",
  primary100: "#E0E8F2",
  primary700: "#203864",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",
};

// Paleta de cores para gráficos
const CORES_GRAFICOS = [
  "#203864",
  "#2B4A7D",
  "#3B5F96",
  "#5A7DB0",
  "#8BA3C9",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

// Cores das categorias
const CORES_CATEGORIAS: Record<string, { bg: string; text: string }> = {
  "População": { bg: "bg-[#E0E8F2]", text: "text-[#203864]" },
  "Atendimentos": { bg: "bg-blue-100", text: "text-blue-700" },
  "Econômico-Financeiro": { bg: "bg-green-100", text: "text-green-700" },
  "Qualidade": { bg: "bg-amber-100", text: "text-amber-700" },
  "Diversas": { bg: "bg-gray-100", text: "text-gray-700" },
};

export default function DashboardCustom() {
  const [periodoGlobal, setPeriodoGlobal] = useState("all");
  
  // Query para estatísticas do dashboard
  const { data: dashboardStats, isLoading } = trpc.dashboard.stats.useQuery();

  // Labels de período
  const periodoLabels: Record<string, string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "90d": "Últimos 3 meses",
    "180d": "Últimos 6 meses",
    "1y": "Último ano",
    "all": "Todo período",
  };

  const periodoLabel = periodoLabels[periodoGlobal] || "Todo período";

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Dados dos KPIs
  const kpis = [
    {
      label: "Faturamento Total",
      value: formatCurrency(dashboardStats?.faturamentoTotal || 0),
      unit: periodoLabel,
      variacao: dashboardStats?.faturamentoVariacao,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Pacientes Ativos",
      value: formatNumber(dashboardStats?.totalPacientes || 0),
      unit: "pacientes",
      variacao: dashboardStats?.pacientesVariacao,
      icon: Users,
      iconBg: "bg-[#E0E8F2]",
      iconColor: "text-[#203864]",
    },
    {
      label: "Atendimentos",
      value: formatNumber(dashboardStats?.totalAtendimentos || 0),
      unit: periodoLabel,
      variacao: dashboardStats?.atendimentosVariacao,
      icon: Stethoscope,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Taxa de Recebimento",
      value: `${(dashboardStats?.taxaRecebimento || 0).toFixed(1)}%`,
      unit: "do faturado",
      variacao: dashboardStats?.taxaVariacao,
      icon: Percent,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <DashboardLayout>
      {/* Header com Filtro Global */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Select value={periodoGlobal} onValueChange={setPeriodoGlobal}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="180d">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Painel de KPIs (Painel de Voo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.iconBg} ${kpi.iconColor}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-[#203864]">{kpi.value}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{kpi.unit}</span>
              {kpi.variacao !== undefined && kpi.variacao !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                    kpi.variacao >= 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
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

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget: Novos Pacientes */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Novos Pacientes</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["População"].bg} ${CORES_CATEGORIAS["População"].text}`}>
                População
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-2xl font-bold text-[#203864]">
                  {formatNumber(dashboardStats?.novosPacientes || 0)}
                </span>
                <p className="text-xs text-gray-400">no período</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#E0E8F2] text-[#203864]">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Pacientes Inativos */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Pacientes Inativos</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["População"].bg} ${CORES_CATEGORIAS["População"].text}`}>
                População
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-2xl font-bold text-[#203864]">
                  {formatNumber(dashboardStats?.pacientesInativos || 0)}
                </span>
                <p className="text-xs text-gray-400">sem atendimento há 360+ dias</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                <UserMinus className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Tempo Médio de Acompanhamento */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Tempo Médio Acompanhamento</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["População"].bg} ${CORES_CATEGORIAS["População"].text}`}>
                População
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-2xl font-bold text-[#203864]">
                  {(dashboardStats?.tempoMedioAcompanhamento || 0).toFixed(1)}
                </span>
                <p className="text-xs text-gray-400">anos em média</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Ticket Médio */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["Econômico-Financeiro"].bg} ${CORES_CATEGORIAS["Econômico-Financeiro"].text}`}>
                Econômico-Financeiro
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-2xl font-bold text-[#203864]">
                  {formatCurrency(dashboardStats?.ticketMedio || 0)}
                </span>
                <p className="text-xs text-gray-400">por atendimento</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Distribuição por Sexo (Gráfico) */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Distribuição por Sexo</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["População"].bg} ${CORES_CATEGORIAS["População"].text}`}>
                População
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={dashboardStats?.distribuicaoSexo || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(dashboardStats?.distribuicaoSexo || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Evolução de Atendimentos (Gráfico) */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Evolução de Atendimentos</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["Atendimentos"].bg} ${CORES_CATEGORIAS["Atendimentos"].text}`}>
                Atendimentos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats?.evolucaoAtendimentos || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="atendimentos"
                    stroke="#203864"
                    strokeWidth={2}
                    dot={{ fill: "#203864", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Widget: Distribuição por Faixa Etária */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Distribuição por Faixa Etária</CardTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CORES_CATEGORIAS["População"].bg} ${CORES_CATEGORIAS["População"].text}`}>
                População
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats?.distribuicaoFaixaEtaria || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#203864" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Categorias */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas por Categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(CORES_CATEGORIAS).map(([categoria, cores]) => {
            const catData = dashboardStats?.metricasPorCategoria?.find(
              (c: { categoria: string }) => c.categoria === categoria
            );
            const metricasCount = catData?.metricas?.length || 0;
            return (
              <div key={categoria} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cores.bg} ${cores.text}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{categoria}</span>
                </div>
                <p className="text-2xl font-bold text-[#203864]">
                  {metricasCount}
                  <span className="text-sm font-normal text-gray-400">/10</span>
                </p>
                <p className="text-xs text-gray-400">métricas ativas</p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
