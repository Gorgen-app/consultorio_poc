/**
 * Sistema de Métricas de Performance
 * Coleta e armazena métricas de desempenho da aplicação
 */

// Estrutura para armazenar métricas de endpoints
interface EndpointMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: number;
  statusCode: number;
  userId?: number;
}

// Estrutura para métricas agregadas
interface AggregatedMetrics {
  endpoint: string;
  count: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  errorCount: number;
  lastHour: number;
}

// Estrutura para métricas do sistema
interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cacheStats: {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
  };
}

// Armazenamento em memória (últimas 24 horas)
const metricsBuffer: EndpointMetric[] = [];
const MAX_BUFFER_SIZE = 10000;
const RETENTION_PERIOD = 24 * 60 * 60 * 1000; // 24 horas

// Estatísticas de cache
let cacheHits = 0;
let cacheMisses = 0;

// Tempo de início do servidor
const serverStartTime = Date.now();

// Configurações de alertas
interface AlertConfig {
  responseTimeThreshold: number; // ms
  errorRateThreshold: number; // %
  enabled: boolean;
}

interface PerformanceAlert {
  id: string;
  type: 'slow_response' | 'high_error_rate' | 'memory_warning';
  message: string;
  endpoint?: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

let alertConfig: AlertConfig = {
  responseTimeThreshold: 2000, // 2 segundos
  errorRateThreshold: 10, // 10%
  enabled: true,
};

const alertsBuffer: PerformanceAlert[] = [];
const MAX_ALERTS = 100;
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos entre alertas do mesmo tipo/endpoint
const lastAlertTime = new Map<string, number>();

/**
 * Registra uma métrica de endpoint
 */
export function recordEndpointMetric(metric: Omit<EndpointMetric, 'timestamp'>): void {
  const entry: EndpointMetric = {
    ...metric,
    timestamp: Date.now(),
  };
  
  metricsBuffer.push(entry);
  
  // Limpar métricas antigas
  cleanOldMetrics();
}

/**
 * Registra hit de cache
 */
export function recordCacheHit(): void {
  cacheHits++;
}

/**
 * Registra miss de cache
 */
export function recordCacheMiss(): void {
  cacheMisses++;
}

/**
 * Limpa métricas antigas
 */
function cleanOldMetrics(): void {
  const cutoff = Date.now() - RETENTION_PERIOD;
  
  // Remover métricas antigas
  while (metricsBuffer.length > 0 && metricsBuffer[0].timestamp < cutoff) {
    metricsBuffer.shift();
  }
  
  // Limitar tamanho do buffer
  while (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }
}

/**
 * Calcula percentil
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Obtém métricas agregadas por endpoint
 */
export function getAggregatedMetrics(): AggregatedMetrics[] {
  cleanOldMetrics();
  
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const endpointMap = new Map<string, EndpointMetric[]>();
  
  // Agrupar por endpoint
  for (const metric of metricsBuffer) {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!endpointMap.has(key)) {
      endpointMap.set(key, []);
    }
    endpointMap.get(key)!.push(metric);
  }
  
  // Calcular métricas agregadas
  const aggregated: AggregatedMetrics[] = [];
  
  for (const [endpoint, metrics] of Array.from(endpointMap.entries())) {
    const responseTimes = metrics.map((m: EndpointMetric) => m.responseTime);
    const lastHourMetrics = metrics.filter((m: EndpointMetric) => m.timestamp >= oneHourAgo);
    const errorMetrics = metrics.filter((m: EndpointMetric) => m.statusCode >= 400);
    
    aggregated.push({
      endpoint,
      count: metrics.length,
      avgResponseTime: Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: Math.round(percentile(responseTimes, 95)),
      errorCount: errorMetrics.length,
      lastHour: lastHourMetrics.length,
    });
  }
  
  // Ordenar por contagem (mais acessados primeiro)
  return aggregated.sort((a, b) => b.count - a.count);
}

/**
 * Obtém métricas do sistema
 */
export function getSystemMetrics(): SystemMetrics {
  const memUsage = process.memoryUsage();
  const totalCacheRequests = cacheHits + cacheMisses;
  
  return {
    uptime: Date.now() - serverStartTime,
    memoryUsage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    cacheStats: {
      size: 0, // Será preenchido pelo db.ts
      hitRate: totalCacheRequests > 0 ? Math.round((cacheHits / totalCacheRequests) * 100) : 0,
      hits: cacheHits,
      misses: cacheMisses,
    },
  };
}

/**
 * Obtém histórico de tempo de resposta (últimas 24 horas, agrupado por hora)
 */
export function getResponseTimeHistory(): { hour: string; avgTime: number; count: number }[] {
  cleanOldMetrics();
  
  const hourlyMap = new Map<string, { times: number[]; count: number }>();
  
  for (const metric of metricsBuffer) {
    const date = new Date(metric.timestamp);
    const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
    
    if (!hourlyMap.has(hourKey)) {
      hourlyMap.set(hourKey, { times: [], count: 0 });
    }
    
    const entry = hourlyMap.get(hourKey)!;
    entry.times.push(metric.responseTime);
    entry.count++;
  }
  
  const history: { hour: string; avgTime: number; count: number }[] = [];
  
  // Gerar todas as 24 horas
  for (let i = 0; i < 24; i++) {
    const hourKey = `${i.toString().padStart(2, '0')}:00`;
    const data = hourlyMap.get(hourKey);
    
    history.push({
      hour: hourKey,
      avgTime: data ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length) : 0,
      count: data?.count || 0,
    });
  }
  
  return history;
}

/**
 * Obtém endpoints mais lentos
 */
export function getSlowestEndpoints(limit: number = 10): { endpoint: string; avgTime: number; count: number }[] {
  const aggregated = getAggregatedMetrics();
  
  return aggregated
    .filter((m: AggregatedMetrics) => m.count >= 5) // Apenas endpoints com pelo menos 5 requisições
    .sort((a: AggregatedMetrics, b: AggregatedMetrics) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, limit)
    .map((m: AggregatedMetrics) => ({
      endpoint: m.endpoint,
      avgTime: m.avgResponseTime,
      count: m.count,
    }));
}

/**
 * Obtém estatísticas gerais
 */
export function getOverallStats(): {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
} {
  cleanOldMetrics();
  
  if (metricsBuffer.length === 0) {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }
  
  const totalRequests = metricsBuffer.length;
  const avgResponseTime = Math.round(
    metricsBuffer.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );
  const errorCount = metricsBuffer.filter(m => m.statusCode >= 400).length;
  const errorRate = Math.round((errorCount / totalRequests) * 100);
  
  // Calcular requisições por minuto (baseado no período de coleta)
  const oldestMetric = metricsBuffer[0];
  const newestMetric = metricsBuffer[metricsBuffer.length - 1];
  const periodMinutes = (newestMetric.timestamp - oldestMetric.timestamp) / 1000 / 60;
  const requestsPerMinute = periodMinutes > 0 ? Math.round(totalRequests / periodMinutes) : 0;
  
  return {
    totalRequests,
    avgResponseTime,
    errorRate,
    requestsPerMinute,
  };
}

/**
 * Configurações de alertas
 */
export function getAlertConfig(): AlertConfig {
  return { ...alertConfig };
}

export function setAlertConfig(config: Partial<AlertConfig>): void {
  alertConfig = { ...alertConfig, ...config };
}

/**
 * Verifica e gera alertas
 */
export function checkAndGenerateAlerts(): void {
  if (!alertConfig.enabled) return;
  
  const now = Date.now();
  const aggregated = getAggregatedMetrics();
  
  // Verificar endpoints lentos
  for (const metric of aggregated) {
    if (metric.avgResponseTime > alertConfig.responseTimeThreshold && metric.count >= 5) {
      const alertKey = `slow_response:${metric.endpoint}`;
      const lastAlert = lastAlertTime.get(alertKey) || 0;
      
      if (now - lastAlert > ALERT_COOLDOWN) {
        createAlert({
          type: 'slow_response',
          message: `Endpoint ${metric.endpoint} com tempo médio de ${metric.avgResponseTime}ms (limite: ${alertConfig.responseTimeThreshold}ms)`,
          endpoint: metric.endpoint,
          value: metric.avgResponseTime,
          threshold: alertConfig.responseTimeThreshold,
        });
        lastAlertTime.set(alertKey, now);
      }
    }
  }
  
  // Verificar taxa de erro geral
  const stats = getOverallStats();
  if (stats.errorRate > alertConfig.errorRateThreshold && stats.totalRequests >= 10) {
    const alertKey = 'high_error_rate:global';
    const lastAlert = lastAlertTime.get(alertKey) || 0;
    
    if (now - lastAlert > ALERT_COOLDOWN) {
      createAlert({
        type: 'high_error_rate',
        message: `Taxa de erro alta: ${stats.errorRate}% (limite: ${alertConfig.errorRateThreshold}%)`,
        value: stats.errorRate,
        threshold: alertConfig.errorRateThreshold,
      });
      lastAlertTime.set(alertKey, now);
    }
  }
  
  // Verificar uso de memória
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapUsagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);
  
  if (heapUsagePercent > 85) {
    const alertKey = 'memory_warning:heap';
    const lastAlert = lastAlertTime.get(alertKey) || 0;
    
    if (now - lastAlert > ALERT_COOLDOWN) {
      createAlert({
        type: 'memory_warning',
        message: `Uso de memória heap alto: ${heapUsagePercent}% (${heapUsedMB}MB de ${heapTotalMB}MB)`,
        value: heapUsagePercent,
        threshold: 85,
      });
      lastAlertTime.set(alertKey, now);
    }
  }
}

function createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
  const newAlert: PerformanceAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    acknowledged: false,
  };
  
  alertsBuffer.unshift(newAlert);
  
  // Limitar tamanho do buffer
  while (alertsBuffer.length > MAX_ALERTS) {
    alertsBuffer.pop();
  }
}

/**
 * Obtém alertas ativos
 */
export function getAlerts(includeAcknowledged: boolean = false): PerformanceAlert[] {
  if (includeAcknowledged) {
    return [...alertsBuffer];
  }
  return alertsBuffer.filter(a => !a.acknowledged);
}

/**
 * Reconhece um alerta
 */
export function acknowledgeAlert(alertId: string): boolean {
  const alert = alertsBuffer.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

/**
 * Reconhece todos os alertas
 */
export function acknowledgeAllAlerts(): number {
  let count = 0;
  for (const alert of alertsBuffer) {
    if (!alert.acknowledged) {
      alert.acknowledged = true;
      count++;
    }
  }
  return count;
}

/**
 * Exporta métricas para CSV
 */
export function exportMetricsToCSV(): string {
  const headers = ['Timestamp', 'Endpoint', 'Method', 'Response Time (ms)', 'Status Code'];
  const rows = metricsBuffer.map(m => [
    new Date(m.timestamp).toISOString(),
    m.endpoint,
    m.method,
    m.responseTime.toString(),
    m.statusCode.toString(),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

/**
 * Exporta métricas agregadas para CSV
 */
export function exportAggregatedMetricsToCSV(): string {
  const aggregated = getAggregatedMetrics();
  const headers = ['Endpoint', 'Requests', 'Avg Time (ms)', 'Min Time (ms)', 'Max Time (ms)', 'P95 Time (ms)', 'Errors', 'Last Hour'];
  const rows = aggregated.map(m => [
    m.endpoint,
    m.count.toString(),
    m.avgResponseTime.toString(),
    m.minResponseTime.toString(),
    m.maxResponseTime.toString(),
    m.p95ResponseTime.toString(),
    m.errorCount.toString(),
    m.lastHour.toString(),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}
