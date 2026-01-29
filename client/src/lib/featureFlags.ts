/**
 * ============================================================================
 * SISTEMA DE FEATURE FLAGS - GORGEN
 * ============================================================================
 * 
 * Sistema simples de feature flags para controlar a ativação de novas
 * funcionalidades de forma gradual e segura.
 * 
 * USO:
 * import { isFeatureEnabled, FEATURES } from '@/lib/featureFlags';
 * 
 * if (isFeatureEnabled(FEATURES.NOVO_MODAL_EVOLUCAO)) {
 *   // Usar novo componente
 * } else {
 *   // Usar componente antigo
 * }
 * 
 * ============================================================================
 */

// Definição das feature flags disponíveis
export const FEATURES = {
  /**
   * Novo modal de evolução v4 com editor de texto rico,
   * sistema de minimização e alertas de documentos pendentes.
   */
  NOVO_MODAL_EVOLUCAO: 'novo_modal_evolucao_v4',
  
  /**
   * Página de documentos pendentes de assinatura
   */
  PAGINA_DOCUMENTOS_PENDENTES: 'pagina_documentos_pendentes',
  
  /**
   * Importação de resultados de exames na evolução
   */
  IMPORTAR_EXAMES_EVOLUCAO: 'importar_exames_evolucao',
} as const;

export type FeatureFlag = typeof FEATURES[keyof typeof FEATURES];

// Configuração das feature flags
// Em produção, isso pode ser substituído por um serviço externo (LaunchDarkly, Vercel Flags, etc.)
const featureFlagsConfig: Record<FeatureFlag, boolean> = {
  // Novo modal de evolução - ATIVO para testes
  [FEATURES.NOVO_MODAL_EVOLUCAO]: true,
  
  // Página de documentos pendentes - ATIVO
  [FEATURES.PAGINA_DOCUMENTOS_PENDENTES]: true,
  
  // Importação de exames - ATIVO
  [FEATURES.IMPORTAR_EXAMES_EVOLUCAO]: true,
};

// Flags que podem ser sobrescritas via localStorage (para desenvolvimento)
const LOCAL_STORAGE_KEY = 'gorgen_feature_flags';

/**
 * Verifica se uma feature flag está ativa
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Verificar override local (para desenvolvimento)
  if (typeof window !== 'undefined') {
    try {
      const localOverrides = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localOverrides) {
        const overrides = JSON.parse(localOverrides);
        if (feature in overrides) {
          return overrides[feature];
        }
      }
    } catch (e) {
      // Ignorar erros de localStorage
    }
  }
  
  // Retornar valor da configuração
  return featureFlagsConfig[feature] ?? false;
}

/**
 * Ativa ou desativa uma feature flag localmente (para desenvolvimento)
 */
export function setFeatureFlag(feature: FeatureFlag, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localOverrides = localStorage.getItem(LOCAL_STORAGE_KEY);
    const overrides = localOverrides ? JSON.parse(localOverrides) : {};
    overrides[feature] = enabled;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Erro ao salvar feature flag:', e);
  }
}

/**
 * Remove override local de uma feature flag
 */
export function clearFeatureFlag(feature: FeatureFlag): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localOverrides = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localOverrides) {
      const overrides = JSON.parse(localOverrides);
      delete overrides[feature];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
    }
  } catch (e) {
    console.error('Erro ao limpar feature flag:', e);
  }
}

/**
 * Lista todas as feature flags e seus estados
 */
export function listFeatureFlags(): Record<FeatureFlag, boolean> {
  const result: Record<string, boolean> = {};
  
  for (const feature of Object.values(FEATURES)) {
    result[feature] = isFeatureEnabled(feature);
  }
  
  return result as Record<FeatureFlag, boolean>;
}

/**
 * Hook React para usar feature flags
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  // Em uma implementação mais robusta, isso poderia usar useState e useEffect
  // para reagir a mudanças nas flags
  return isFeatureEnabled(feature);
}

export default {
  FEATURES,
  isFeatureEnabled,
  setFeatureFlag,
  clearFeatureFlag,
  listFeatureFlags,
  useFeatureFlag,
};
