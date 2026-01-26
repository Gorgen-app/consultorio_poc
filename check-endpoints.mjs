import * as performance from './server/performance.ts';

console.log('=== ENDPOINTS MAIS LENTOS ===');
const slowest = performance.getSlowestEndpoints(20);
console.log(JSON.stringify(slowest, null, 2));

console.log('\n=== MÉTRICAS AGREGADAS ===');
const aggregated = performance.getAggregatedMetrics();
console.log(JSON.stringify(aggregated.slice(0, 20), null, 2));

console.log('\n=== ESTATÍSTICAS GERAIS ===');
const stats = performance.getOverallStats();
console.log(JSON.stringify(stats, null, 2));
