/**
 * Funções utilitárias para formatação de números e moedas no padrão brasileiro
 * Padrão: XX,XX (vírgula como decimal, ponto como separador de milhar)
 * Moeda: R$ XXX,XX
 */

/**
 * Formata um número para o padrão brasileiro (xxx.xxx,xx)
 * @param value - Valor numérico ou string
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada no padrão brasileiro
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata um valor para moeda brasileira (R$ xxx.xxx,xx)
 * @param value - Valor numérico ou string
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte uma string no formato brasileiro para número
 * @param value - String no formato brasileiro (xxx.xxx,xx)
 * @returns Número ou null se inválido
 */
export function parseNumber(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null;
  
  // Remove R$ se presente
  let cleaned = value.replace(/R\$\s*/g, '');
  
  // Remove pontos (separadores de milhar) e substitui vírgula por ponto
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

/**
 * Formata um número inteiro com separador de milhar brasileiro
 * @param value - Valor numérico ou string
 * @returns String formatada (xxx.xxx)
 */
export function formatInteger(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
  
  if (isNaN(num)) return '';
  
  return num.toLocaleString('pt-BR');
}

/**
 * Formata um número para exibição em campos de input (sem separador de milhar durante digitação)
 * @param value - Valor numérico ou string
 * @param decimals - Número de casas decimais
 * @returns String formatada para input
 */
export function formatNumberForInput(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  // Usa vírgula como separador decimal, sem separador de milhar
  return num.toFixed(decimals).replace('.', ',');
}

/**
 * Aplica máscara de número brasileiro durante digitação
 * @param value - Valor digitado
 * @param decimals - Número de casas decimais permitidas
 * @returns String com máscara aplicada
 */
export function maskNumber(value: string, decimals: number = 2): string {
  if (!value) return '';
  
  // Remove tudo exceto números e vírgula
  let cleaned = value.replace(/[^\d,]/g, '');
  
  // Garante apenas uma vírgula
  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita casas decimais
  if (parts.length === 2 && parts[1].length > decimals) {
    cleaned = parts[0] + ',' + parts[1].substring(0, decimals);
  }
  
  // Adiciona separador de milhar na parte inteira
  if (parts[0].length > 3) {
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    cleaned = parts.length > 1 ? intPart + ',' + parts[1] : intPart;
  }
  
  return cleaned;
}

/**
 * Aplica máscara de moeda brasileira durante digitação
 * @param value - Valor digitado
 * @returns String com máscara de moeda aplicada
 */
export function maskCurrency(value: string): string {
  if (!value) return '';
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos e depois para reais
  const cents = parseInt(numbers, 10);
  const reais = cents / 100;
  
  return formatCurrency(reais);
}

/**
 * Formata porcentagem no padrão brasileiro
 * @param value - Valor numérico (ex: 0.15 para 15%)
 * @param decimals - Número de casas decimais
 * @returns String formatada (ex: "15,00%")
 */
export function formatPercent(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return (num * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

/**
 * Formata peso em kg no padrão brasileiro
 * @param value - Valor em kg
 * @returns String formatada (ex: "75,5 kg")
 */
export function formatWeight(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return formatNumber(num, 1) + ' kg';
}

/**
 * Formata altura em metros no padrão brasileiro
 * @param value - Valor em metros
 * @returns String formatada (ex: "1,75 m")
 */
export function formatHeight(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return formatNumber(num, 2) + ' m';
}

/**
 * Formata temperatura no padrão brasileiro
 * @param value - Valor em graus Celsius
 * @returns String formatada (ex: "36,5 °C")
 */
export function formatTemperature(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return formatNumber(num, 1) + ' °C';
}
