/**
 * Script para importar eventos via API tRPC do Gorgen
 * Executa a importação em lotes menores para evitar timeout
 */

import fs from 'fs';

// Ler os eventos do arquivo de estatísticas
const statsPath = '/home/ubuntu/consultorio_poc/scripts/import-stats.json';
const data = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));

console.log(`📊 Total de eventos para importar: ${data.allEvents.length}`);

// Tipos válidos no enum do banco
const tiposValidos = ["Consulta", "Cirurgia", "Visita internado", "Procedimento em consultório", "Exame", "Reunião", "Bloqueio"];

// Preparar eventos para importação
const eventos = data.allEvents.map(e => ({
  uid: e.uid,
  summary: e.summary,
  dataInicio: e.dataInicio,
  dataFim: e.dataFim,
  tipoAtendimento: tiposValidos.includes(e.tipoAtendimento) ? e.tipoAtendimento : 'Consulta',
  convenio: e.convenio,
  nomePaciente: e.nomePaciente,
  cpf: e.cpf,
  telefone: e.telefone,
  email: e.email,
  status: e.status || 'Agendado',
  local: e.local,
  cancelado: e.cancelado,
  confirmado: e.confirmado,
}));

// Salvar eventos preparados para uso via API
const outputPath = '/home/ubuntu/consultorio_poc/scripts/eventos-para-importar.json';
fs.writeFileSync(outputPath, JSON.stringify(eventos, null, 2));

console.log(`✅ Eventos preparados salvos em: ${outputPath}`);
console.log(`\nPara importar, use a API: POST /api/trpc/agenda.importarICS`);
