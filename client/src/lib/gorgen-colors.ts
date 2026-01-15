/**
 * Gorgen Design System - Paleta de Cores
 * 
 * Este arquivo centraliza todas as cores do sistema Gorgen para garantir
 * consistência visual em toda a aplicação.
 * 
 * Cor Principal: Azul Gorgen #203864
 * Tipografia: Inter
 */

// Paleta Primária - Azul Gorgen
export const gorgenPrimary = {
  50: '#F0F4F9',
  100: '#E0E8F2',
  200: '#B8C9DE',
  300: '#8BA3C9',
  400: '#5A7DB0',
  500: '#3B5F96',
  600: '#2B4A7D',
  700: '#203864', // COR PRINCIPAL
  800: '#1A2B47',
  900: '#152238',
  950: '#0D1729',
} as const;

// Cor de Destaque (Accent) - Coral
export const gorgenAccent = {
  100: '#FCEAE5',
  400: '#F0A08D',
  500: '#E8836A',
  600: '#DC6B4A',
} as const;

// Cores Semânticas
export const gorgenSemantic = {
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
} as const;

// Cores Neutras
export const gorgenGray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  700: '#374151',
  900: '#111827',
} as const;

// Cores para Gráficos - Escala harmonizada com Azul Gorgen
export const gorgenChartColors = [
  '#203864', // Azul Gorgen 700 (principal)
  '#3B5F96', // Azul Gorgen 500
  '#5A7DB0', // Azul Gorgen 400
  '#10B981', // Verde (sucesso)
  '#F59E0B', // Âmbar (alerta)
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#06B6D4', // Ciano
  '#84CC16', // Lima
  '#F97316', // Laranja
] as const;

// Cores por Categoria de Métricas
export const gorgenCategoryColors = {
  populacao_pacientes: gorgenPrimary[700],  // Azul Gorgen
  atendimentos: gorgenSemantic.success,      // Verde
  economico_financeiro: gorgenSemantic.warning, // Âmbar
  qualidade_atendimento: '#8B5CF6',          // Violeta
  diversas: '#EC4899',                       // Rosa
} as const;

// Cores para Status
export const gorgenStatusColors = {
  ativo: gorgenSemantic.success,
  inativo: gorgenGray[400],
  pendente: gorgenSemantic.warning,
  cancelado: gorgenSemantic.error,
  agendado: gorgenPrimary[500],
  realizado: gorgenSemantic.success,
  faltou: gorgenSemantic.error,
} as const;

// Exportação padrão com todas as cores
export const gorgenColors = {
  primary: gorgenPrimary,
  accent: gorgenAccent,
  semantic: gorgenSemantic,
  gray: gorgenGray,
  chart: gorgenChartColors,
  category: gorgenCategoryColors,
  status: gorgenStatusColors,
} as const;

export default gorgenColors;
