/**
 * Script de Importação Direta de Eventos ICS para Agenda do Gorgen
 * Executa a importação em lotes para melhor performance
 * 
 * Uso: node scripts/execute-import.mjs
 */

import fs from 'fs';

// Ler os eventos do arquivo de estatísticas
const statsPath = '/home/ubuntu/consultorio_poc/scripts/import-stats.json';
const data = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));

console.log(`📊 Total de eventos para importar: ${data.allEvents.length}`);

// Filtrar eventos com tipo válido (excluir "Outro" que não é um tipo válido no enum)
const tiposValidos = ["Consulta", "Cirurgia", "Visita internado", "Procedimento em consultório", "Exame", "Reunião", "Bloqueio"];

const eventosValidos = data.allEvents.filter(e => tiposValidos.includes(e.tipoAtendimento));
const eventosOutros = data.allEvents.filter(e => !tiposValidos.includes(e.tipoAtendimento));

console.log(`✅ Eventos com tipo válido: ${eventosValidos.length}`);
console.log(`⚠️ Eventos com tipo "Outro" (serão convertidos para Consulta): ${eventosOutros.length}`);

// Converter eventos "Outro" para "Consulta" (tipo mais comum)
const todosEventos = data.allEvents.map(e => ({
  ...e,
  tipoAtendimento: tiposValidos.includes(e.tipoAtendimento) ? e.tipoAtendimento : 'Consulta'
}));

// Gerar SQL de inserção em lotes
const BATCH_SIZE = 100;
let sqlStatements = [];
let counter = 0;

// Gerar IDs de agendamento
function gerarIdAgendamento(dataInicio, index) {
  const date = new Date(dataInicio);
  const year = date.getFullYear();
  return `AG-${year}-${String(index).padStart(5, '0')}`;
}

// Escapar string para SQL
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Formatar data para MySQL
function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  const date = new Date(dateStr);
  return `'${date.toISOString().slice(0, 19).replace('T', ' ')}'`;
}

// Mapear status
function mapStatus(status) {
  const statusMap = {
    'Agendado': 'Agendado',
    'Confirmado': 'Confirmado',
    'Realizado': 'Realizado',
    'Cancelado': 'Cancelado',
    'Reagendado': 'Reagendado',
    'Faltou': 'Faltou'
  };
  return statusMap[status] || 'Agendado';
}

console.log('\n📝 Gerando SQL de inserção...');

for (let i = 0; i < todosEventos.length; i++) {
  const e = todosEventos[i];
  counter++;
  
  const idAgendamento = gerarIdAgendamento(e.dataInicio, 10000 + counter);
  const dataFim = e.dataFim || new Date(new Date(e.dataInicio).getTime() + 30 * 60000).toISOString();
  
  const sql = `INSERT INTO agendamentos (
    tenant_id, id_agendamento, google_uid, titulo, descricao,
    data_hora_inicio, data_hora_fim, tipo_compromisso,
    local, status, paciente_nome, cpf_paciente, telefone_paciente, email_paciente,
    convenio, importado_de, created_at, updated_at
  ) VALUES (
    1,
    ${escapeSql(idAgendamento)},
    ${escapeSql(e.uid)},
    ${escapeSql(e.summary?.substring(0, 255))},
    NULL,
    ${formatDate(e.dataInicio)},
    ${formatDate(dataFim)},
    ${escapeSql(e.tipoAtendimento)},
    ${escapeSql(e.local)},
    ${escapeSql(mapStatus(e.status))},
    ${escapeSql(e.nomePaciente?.substring(0, 255))},
    ${escapeSql(e.cpf)},
    ${escapeSql(e.telefone)},
    ${escapeSql(e.email)},
    ${escapeSql(e.convenio)},
    'google_calendar',
    NOW(),
    NOW()
  );`;
  
  sqlStatements.push(sql);
}

// Salvar SQL em arquivo
const sqlPath = '/home/ubuntu/consultorio_poc/scripts/import-data.sql';
fs.writeFileSync(sqlPath, sqlStatements.join('\n'));

console.log(`\n✅ SQL gerado: ${sqlStatements.length} inserções`);
console.log(`📁 Arquivo salvo em: ${sqlPath}`);
console.log('\nPara executar a importação, use o webdev_execute_sql com o conteúdo do arquivo.');
