/**
 * Memory Optimizer - Otimizações de uso de memória
 * 
 * Este módulo fornece funções para otimizar o uso de memória do servidor,
 * incluindo limpeza de caches, garbage collection forçado, e monitoramento.
 * 
 * @version 1.0.0
 */

import { invalidarCacheMetricas } from './db';

// Intervalo de limpeza automática (5 minutos)
const AUTO_CLEANUP_INTERVAL = 5 * 60 * 1000;

// Limite de uso de heap para trigger de limpeza (80%)
const HEAP_CLEANUP_THRESHOLD = 0.80;

/**
 * Força garbage collection se disponível
 * Nota: Requer flag --expose-gc no Node.js
 */
function forceGC(): boolean {
  if (global.gc) {
    global.gc();
    return true;
  }
  return false;
}

/**
 * Limpa todos os caches do sistema
 */
export async function clearAllCaches(): Promise<void> {
  console.log('[Memory Optimizer] Limpando todos os caches...');
  
  // Limpar cache de métricas de atendimento (todos os tenants)
  // Como não temos lista de tenants, vamos invalidar o cache global
  invalidarCacheMetricas(0);
  
  console.log('[Memory Optimizer] Caches limpos');
}

/**
 * Verifica uso de memória e limpa se necessário
 */
export function checkAndOptimizeMemory(): {
  heapUsedMB: number;
  heapTotalMB: number;
  heapUsagePercent: number;
  cleaned: boolean;
  gcRan: boolean;
} {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapUsagePercent = heapUsedMB / heapTotalMB;
  
  let cleaned = false;
  let gcRan = false;
  
  if (heapUsagePercent > HEAP_CLEANUP_THRESHOLD) {
    console.log(`[Memory Optimizer] Uso de heap alto (${Math.round(heapUsagePercent * 100)}%), iniciando limpeza...`);
    
    // Limpar caches
    clearAllCaches();
    cleaned = true;
    
    // Tentar forçar GC
    gcRan = forceGC();
    
    if (gcRan) {
      console.log('[Memory Optimizer] Garbage collection executado');
    }
  }
  
  return {
    heapUsedMB,
    heapTotalMB,
    heapUsagePercent: Math.round(heapUsagePercent * 100),
    cleaned,
    gcRan,
  };
}

/**
 * Obtém estatísticas de memória detalhadas
 */
export function getMemoryStats(): {
  heap: {
    used: number;
    total: number;
    usagePercent: number;
  };
  rss: number;
  external: number;
  arrayBuffers: number;
} {
  const memUsage = process.memoryUsage();
  
  return {
    heap: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    rss: Math.round(memUsage.rss / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    arrayBuffers: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024),
  };
}

/**
 * Inicia limpeza automática de memória
 */
let autoCleanupInterval: NodeJS.Timeout | null = null;

export function startAutoCleanup(): void {
  if (autoCleanupInterval) {
    return; // Já está rodando
  }
  
  console.log('[Memory Optimizer] Iniciando limpeza automática de memória');
  
  autoCleanupInterval = setInterval(() => {
    const result = checkAndOptimizeMemory();
    if (result.cleaned) {
      console.log(`[Memory Optimizer] Limpeza automática executada. Heap: ${result.heapUsedMB}MB/${result.heapTotalMB}MB (${result.heapUsagePercent}%)`);
    }
  }, AUTO_CLEANUP_INTERVAL);
}

export function stopAutoCleanup(): void {
  if (autoCleanupInterval) {
    clearInterval(autoCleanupInterval);
    autoCleanupInterval = null;
    console.log('[Memory Optimizer] Limpeza automática parada');
  }
}

// Iniciar limpeza automática ao carregar o módulo
startAutoCleanup();

export default {
  clearAllCaches,
  checkAndOptimizeMemory,
  getMemoryStats,
  startAutoCleanup,
  stopAutoCleanup,
};
