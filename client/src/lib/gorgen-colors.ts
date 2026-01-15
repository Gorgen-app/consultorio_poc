/**
 * Gorgen Design System - Constantes de Cores
 * ==========================================
 * 
 * Este arquivo exporta as cores do Design System como constantes TypeScript
 * para uso em gráficos, componentes dinâmicos e lógica de negócio.
 * 
 * @author Manus AI
 * @version 1.0
 * @date 15 de Janeiro de 2026
 */

/**
 * Paleta completa de cores do Gorgen Design System
 */
export const gorgenColors = {
  // Cor Primária - Azul Gorgen
  primary: {
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
  },
  
  // Cor de Destaque - Coral Gorgen
  accent: {
    100: '#FCEAE5',
    400: '#F0A08D',
    500: '#E8836A',
    600: '#DC6B4A', // COR PRINCIPAL
  },
  
  // Cores Semânticas
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
  },
  
  // Cores Neutras
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
  },
} as const;

/**
 * Cores para gráficos - Paleta harmonizada com Azul Gorgen
 */
export const gorgenChartColors = [
  '#203864', // Azul Gorgen 700 (principal)
  '#3B5F96', // Azul Gorgen 500
  '#5A7DB0', // Azul Gorgen 400
  '#10B981', // Verde (sucesso)
  '#F59E0B', // Âmbar (alerta)
  '#8B5CF6', // Violeta
  '#DC6B4A', // Coral Gorgen
  '#06B6D4', // Ciano
  '#84CC16', // Lima
  '#F97316', // Laranja
] as const;

/**
 * Cores por categoria de widget/métrica
 */
export const gorgenCategoryColors = {
  'População de Pacientes': gorgenColors.primary[700],
  'Atendimentos': gorgenColors.success.DEFAULT,
  'Econômico-Financeiro': gorgenColors.warning.DEFAULT,
  'Qualidade do Atendimento': '#8B5CF6', // Violeta
  'Diversas': gorgenColors.accent[600],
} as const;

/**
 * Tipo para as categorias de cores
 */
export type GorgenCategory = keyof typeof gorgenCategoryColors;

/**
 * Função helper para obter cor de categoria
 */
export function getCategoryColor(category: string): string {
  return gorgenCategoryColors[category as GorgenCategory] || gorgenColors.gray[500];
}

/**
 * Cores para status de atendimento
 */
export const gorgenStatusColors = {
  pago: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  pendente: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  agendado: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
} as const;

/**
 * Cores para perfis de usuário
 */
export const gorgenPerfilColors = {
  admin_master: { bg: 'bg-red-500', text: 'text-white' },
  medico: { bg: 'bg-primary', text: 'text-primary-foreground' },
  secretaria: { bg: 'bg-emerald-500', text: 'text-white' },
  auditor: { bg: 'bg-violet-500', text: 'text-white' },
  paciente: { bg: 'bg-gray-500', text: 'text-white' },
} as const;
