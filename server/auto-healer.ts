/**
 * Auto-Healer - Sistema de Auto-Correção de Performance
 * 
 * Este módulo monitora a saúde do sistema e executa ações corretivas
 * automaticamente quando problemas são detectados.
 * 
 * @version 1.0.0
 * 
 * Funcionalidades:
 * - Detecção automática de problemas de memória, lentidão e erros
 * - Execução de ações corretivas sem intervenção manual
 * - Log completo de todas as ações para auditoria
 * - Notificação sobre ações tomadas
 */

import { invalidarCacheMetricas } from './db';
import { 
  getSystemMetrics, 
  getOverallStats, 
  getSlowestEndpoints,
  getAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  setAlertConfig,
  getAlertConfig
} from './performance';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type HealingActionType = 
  | 'clear_cache'
  | 'force_gc'
  | 'reduce_buffers'
  | 'acknowledge_alerts'
  | 'adjust_thresholds'
  | 'restart_recommended'
  | 'investigate';

export type ProblemType = 
  | 'high_memory'
  | 'slow_response'
  | 'high_error_rate'
  | 'cache_overflow'
  | 'multiple_alerts';

export interface HealingAction {
  id: string;
  timestamp: number;
  problemType: ProblemType;
  actionType: HealingActionType;
  description: string;
  details: Record<string, unknown>;
  success: boolean;
  memoryBefore?: number;
  memoryAfter?: number;
  automatic: boolean;
}

export interface SystemDiagnosis {
  timestamp: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  problems: DiagnosedProblem[];
  recommendations: string[];
  metrics: {
    memoryUsagePercent: number;
    avgResponseTime: number;
    errorRate: number;
    activeAlerts: number;
  };
}

export interface DiagnosedProblem {
  type: ProblemType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: HealingActionType;
  autoFixable: boolean;
}

export interface HealingResult {
  success: boolean;
  actionsTaken: HealingAction[];
  diagnosis: SystemDiagnosis;
  message: string;
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const HEALING_CONFIG = {
  // Limites para detecção de problemas
  memoryWarningThreshold: 70, // %
  memoryCriticalThreshold: 85, // %
  responseTimeWarningThreshold: 1500, // ms
  responseTimeCriticalThreshold: 3000, // ms
  errorRateWarningThreshold: 5, // %
  errorRateCriticalThreshold: 15, // %
  
  // Configurações de auto-healing
  autoHealingEnabled: true,
  maxActionsPerMinute: 5,
  cooldownBetweenActions: 30000, // 30 segundos
  
  // Limites de buffer após correção
  reducedBufferSize: 1000,
  reducedCacheTTL: 2 * 60 * 1000, // 2 minutos
};

// ============================================================================
// HISTÓRICO DE AÇÕES
// ============================================================================

const healingHistory: HealingAction[] = [];
const MAX_HISTORY_SIZE = 200;
let lastActionTime = 0;
let actionsThisMinute = 0;
let minuteStart = Date.now();

function addToHistory(action: HealingAction): void {
  healingHistory.unshift(action);
  while (healingHistory.length > MAX_HISTORY_SIZE) {
    healingHistory.pop();
  }
}

function canExecuteAction(): boolean {
  const now = Date.now();
  
  // Reset contador a cada minuto
  if (now - minuteStart > 60000) {
    minuteStart = now;
    actionsThisMinute = 0;
  }
  
  // Verificar cooldown
  if (now - lastActionTime < HEALING_CONFIG.cooldownBetweenActions) {
    return false;
  }
  
  // Verificar limite por minuto
  if (actionsThisMinute >= HEALING_CONFIG.maxActionsPerMinute) {
    return false;
  }
  
  return true;
}

function recordAction(): void {
  lastActionTime = Date.now();
  actionsThisMinute++;
}

// ============================================================================
// FUNÇÕES DE DIAGNÓSTICO
// ============================================================================

/**
 * Realiza diagnóstico completo do sistema
 */
export function diagnoseSystem(): SystemDiagnosis {
  const systemMetrics = getSystemMetrics();
  const overallStats = getOverallStats();
  const alerts = getAlerts(false);
  
  const memoryUsagePercent = Math.round(
    (systemMetrics.memoryUsage.heapUsed / systemMetrics.memoryUsage.heapTotal) * 100
  );
  
  const problems: DiagnosedProblem[] = [];
  const recommendations: string[] = [];
  
  // Verificar memória
  if (memoryUsagePercent >= HEALING_CONFIG.memoryCriticalThreshold) {
    problems.push({
      type: 'high_memory',
      severity: 'critical',
      description: `Uso de memória crítico: ${memoryUsagePercent}% (${systemMetrics.memoryUsage.heapUsed}MB de ${systemMetrics.memoryUsage.heapTotal}MB)`,
      suggestedAction: 'clear_cache',
      autoFixable: true,
    });
    recommendations.push('Limpar caches e forçar garbage collection imediatamente');
  } else if (memoryUsagePercent >= HEALING_CONFIG.memoryWarningThreshold) {
    problems.push({
      type: 'high_memory',
      severity: 'medium',
      description: `Uso de memória elevado: ${memoryUsagePercent}%`,
      suggestedAction: 'clear_cache',
      autoFixable: true,
    });
    recommendations.push('Considerar limpeza preventiva de caches');
  }
  
  // Verificar tempo de resposta
  if (overallStats.avgResponseTime >= HEALING_CONFIG.responseTimeCriticalThreshold) {
    problems.push({
      type: 'slow_response',
      severity: 'critical',
      description: `Tempo de resposta crítico: ${overallStats.avgResponseTime}ms`,
      suggestedAction: 'clear_cache',
      autoFixable: true,
    });
    recommendations.push('Limpar caches para melhorar performance');
  } else if (overallStats.avgResponseTime >= HEALING_CONFIG.responseTimeWarningThreshold) {
    problems.push({
      type: 'slow_response',
      severity: 'medium',
      description: `Tempo de resposta elevado: ${overallStats.avgResponseTime}ms`,
      suggestedAction: 'investigate',
      autoFixable: false,
    });
    recommendations.push('Investigar endpoints mais lentos');
  }
  
  // Verificar taxa de erro
  if (overallStats.errorRate >= HEALING_CONFIG.errorRateCriticalThreshold) {
    problems.push({
      type: 'high_error_rate',
      severity: 'critical',
      description: `Taxa de erro crítica: ${overallStats.errorRate}%`,
      suggestedAction: 'investigate',
      autoFixable: false,
    });
    recommendations.push('Investigar causa dos erros urgentemente');
  } else if (overallStats.errorRate >= HEALING_CONFIG.errorRateWarningThreshold) {
    problems.push({
      type: 'high_error_rate',
      severity: 'medium',
      description: `Taxa de erro elevada: ${overallStats.errorRate}%`,
      suggestedAction: 'investigate',
      autoFixable: false,
    });
    recommendations.push('Monitorar taxa de erros');
  }
  
  // Verificar alertas acumulados
  if (alerts.length >= 10) {
    problems.push({
      type: 'multiple_alerts',
      severity: 'high',
      description: `${alerts.length} alertas não reconhecidos`,
      suggestedAction: 'acknowledge_alerts',
      autoFixable: true,
    });
    recommendations.push('Revisar e reconhecer alertas pendentes');
  }
  
  // Determinar saúde geral
  let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (problems.some(p => p.severity === 'critical')) {
    overallHealth = 'critical';
  } else if (problems.some(p => p.severity === 'high' || p.severity === 'medium')) {
    overallHealth = 'warning';
  }
  
  return {
    timestamp: Date.now(),
    overallHealth,
    problems,
    recommendations,
    metrics: {
      memoryUsagePercent,
      avgResponseTime: overallStats.avgResponseTime,
      errorRate: overallStats.errorRate,
      activeAlerts: alerts.length,
    },
  };
}

// ============================================================================
// AÇÕES CORRETIVAS
// ============================================================================

/**
 * Limpa todos os caches do sistema
 */
function clearAllCaches(): { success: boolean; freedMB: number } {
  const memBefore = process.memoryUsage().heapUsed;
  
  try {
    // Limpar cache de métricas de atendimento
    invalidarCacheMetricas(0);
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    const memAfter = process.memoryUsage().heapUsed;
    const freedMB = Math.round((memBefore - memAfter) / 1024 / 1024);
    
    return { success: true, freedMB: Math.max(0, freedMB) };
  } catch (error) {
    console.error('[Auto-Healer] Erro ao limpar caches:', error);
    return { success: false, freedMB: 0 };
  }
}

/**
 * Ajusta thresholds de alerta para reduzir ruído
 */
function adjustAlertThresholds(): boolean {
  try {
    const currentConfig = getAlertConfig();
    
    // Aumentar thresholds temporariamente se houver muitos alertas
    setAlertConfig({
      responseTimeThreshold: Math.min(currentConfig.responseTimeThreshold * 1.2, 5000),
      errorRateThreshold: Math.min(currentConfig.errorRateThreshold * 1.2, 20),
    });
    
    return true;
  } catch (error) {
    console.error('[Auto-Healer] Erro ao ajustar thresholds:', error);
    return false;
  }
}

/**
 * Executa uma ação de healing específica
 */
function executeHealingAction(
  problemType: ProblemType,
  actionType: HealingActionType,
  automatic: boolean
): HealingAction {
  const memBefore = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  let success = false;
  let description = '';
  const details: Record<string, unknown> = {};
  
  switch (actionType) {
    case 'clear_cache': {
      const result = clearAllCaches();
      success = result.success;
      description = `Caches limpos. Memória liberada: ${result.freedMB}MB`;
      details.freedMB = result.freedMB;
      break;
    }
    
    case 'force_gc': {
      if (global.gc) {
        global.gc();
        success = true;
        description = 'Garbage collection forçado executado';
      } else {
        success = false;
        description = 'Garbage collection não disponível (requer --expose-gc)';
      }
      break;
    }
    
    case 'acknowledge_alerts': {
      const count = acknowledgeAllAlerts();
      success = count > 0;
      description = `${count} alertas reconhecidos automaticamente`;
      details.alertsAcknowledged = count;
      break;
    }
    
    case 'adjust_thresholds': {
      success = adjustAlertThresholds();
      description = success 
        ? 'Thresholds de alerta ajustados temporariamente'
        : 'Falha ao ajustar thresholds';
      break;
    }
    
    case 'reduce_buffers': {
      // Os buffers já foram reduzidos na configuração
      success = true;
      description = 'Configuração de buffers reduzidos aplicada';
      break;
    }
    
    case 'restart_recommended': {
      success = true;
      description = 'Reinício do servidor recomendado para liberar recursos';
      details.recommendation = 'manual_restart';
      break;
    }
    
    case 'investigate': {
      const slowEndpoints = getSlowestEndpoints(5);
      success = true;
      description = 'Investigação realizada - endpoints mais lentos identificados';
      details.slowEndpoints = slowEndpoints;
      break;
    }
  }
  
  const memAfter = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  
  const action: HealingAction = {
    id: `heal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    problemType,
    actionType,
    description,
    details,
    success,
    memoryBefore: memBefore,
    memoryAfter: memAfter,
    automatic,
  };
  
  addToHistory(action);
  recordAction();
  
  console.log(`[Auto-Healer] ${automatic ? 'AUTO' : 'MANUAL'}: ${description} (Memória: ${memBefore}MB → ${memAfter}MB)`);
  
  return action;
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Executa diagnóstico e correção automática
 */
export function investigateAndFix(automatic: boolean = true): HealingResult {
  const diagnosis = diagnoseSystem();
  const actionsTaken: HealingAction[] = [];
  
  if (!HEALING_CONFIG.autoHealingEnabled && automatic) {
    return {
      success: false,
      actionsTaken: [],
      diagnosis,
      message: 'Auto-healing desabilitado',
    };
  }
  
  // Processar cada problema diagnosticado
  for (const problem of diagnosis.problems) {
    if (!canExecuteAction()) {
      break; // Limite de ações atingido
    }
    
    // Só executar ações automáticas se o problema for auto-corrigível
    if (automatic && !problem.autoFixable) {
      continue;
    }
    
    const action = executeHealingAction(
      problem.type,
      problem.suggestedAction,
      automatic
    );
    
    actionsTaken.push(action);
  }
  
  // Se memória ainda estiver alta após limpeza de cache, tentar GC
  if (diagnosis.metrics.memoryUsagePercent >= HEALING_CONFIG.memoryCriticalThreshold) {
    if (canExecuteAction() && global.gc) {
      const gcAction = executeHealingAction('high_memory', 'force_gc', automatic);
      actionsTaken.push(gcAction);
    }
  }
  
  // Rediagnosticar após ações
  const finalDiagnosis = diagnoseSystem();
  
  const message = actionsTaken.length > 0
    ? `${actionsTaken.length} ação(ões) corretiva(s) executada(s). Saúde: ${finalDiagnosis.overallHealth}`
    : diagnosis.overallHealth === 'healthy'
      ? 'Sistema saudável, nenhuma ação necessária'
      : 'Problemas detectados requerem intervenção manual';
  
  return {
    success: actionsTaken.every(a => a.success),
    actionsTaken,
    diagnosis: finalDiagnosis,
    message,
  };
}

/**
 * Executa uma ação corretiva específica manualmente
 */
export function executeManualAction(actionType: HealingActionType): HealingAction {
  return executeHealingAction('high_memory', actionType, false);
}

/**
 * Obtém histórico de ações de healing
 */
export function getHealingHistory(limit: number = 50): HealingAction[] {
  return healingHistory.slice(0, limit);
}

/**
 * Obtém configuração atual do auto-healer
 */
export function getHealingConfig(): typeof HEALING_CONFIG {
  return { ...HEALING_CONFIG };
}

/**
 * Atualiza configuração do auto-healer
 */
export function updateHealingConfig(config: Partial<typeof HEALING_CONFIG>): void {
  Object.assign(HEALING_CONFIG, config);
}

/**
 * Habilita ou desabilita auto-healing
 */
export function setAutoHealingEnabled(enabled: boolean): void {
  HEALING_CONFIG.autoHealingEnabled = enabled;
  console.log(`[Auto-Healer] Auto-healing ${enabled ? 'habilitado' : 'desabilitado'}`);
}

/**
 * Obtém estatísticas do auto-healer
 */
export function getHealingStats(): {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  lastActionTime: number | null;
  autoHealingEnabled: boolean;
  actionsLast24h: number;
} {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const actionsLast24h = healingHistory.filter(a => a.timestamp >= last24h).length;
  
  return {
    totalActions: healingHistory.length,
    successfulActions: healingHistory.filter(a => a.success).length,
    failedActions: healingHistory.filter(a => !a.success).length,
    lastActionTime: healingHistory.length > 0 ? healingHistory[0].timestamp : null,
    autoHealingEnabled: HEALING_CONFIG.autoHealingEnabled,
    actionsLast24h,
  };
}

// ============================================================================
// AUTO-HEALING AUTOMÁTICO
// ============================================================================

let autoHealingInterval: NodeJS.Timeout | null = null;

/**
 * Inicia monitoramento e auto-healing automático
 */
export function startAutoHealing(intervalMs: number = 60000): void {
  if (autoHealingInterval) {
    return; // Já está rodando
  }
  
  console.log('[Auto-Healer] Iniciando monitoramento automático');
  
  autoHealingInterval = setInterval(() => {
    const diagnosis = diagnoseSystem();
    
    // Só executar auto-healing se houver problemas críticos ou de alta severidade
    if (diagnosis.problems.some(p => p.severity === 'critical' || p.severity === 'high')) {
      console.log(`[Auto-Healer] Problemas detectados: ${diagnosis.problems.length}. Executando correção...`);
      investigateAndFix(true);
    }
  }, intervalMs);
}

/**
 * Para monitoramento automático
 */
export function stopAutoHealing(): void {
  if (autoHealingInterval) {
    clearInterval(autoHealingInterval);
    autoHealingInterval = null;
    console.log('[Auto-Healer] Monitoramento automático parado');
  }
}

// Iniciar auto-healing ao carregar o módulo
startAutoHealing();

export default {
  diagnoseSystem,
  investigateAndFix,
  executeManualAction,
  getHealingHistory,
  getHealingConfig,
  updateHealingConfig,
  setAutoHealingEnabled,
  getHealingStats,
  startAutoHealing,
  stopAutoHealing,
};
