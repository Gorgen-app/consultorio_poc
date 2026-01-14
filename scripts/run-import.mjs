/**
 * Wrapper para executar a importação ICS usando a conexão do servidor
 * Uso: npx tsx scripts/run-import.mjs <caminho-do-arquivo.ics>
 */

import fs from 'fs';
import { getDb } from '../server/db.js';
import { agendamentos } from '../drizzle/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Regex para extrair dados do ICS
const EVENT_REGEX = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;

// Mapeamento de tipos de atendimento
function detectTipoAtendimento(summary, description) {
  const text = (summary + ' ' + (description || '')).toUpperCase();
  
  if (text.includes('CIRURGIA')) return 'Cirurgia';
  if (text.includes('PROCEDIMENTO')) return 'Procedimento em consultório';
  if (text.includes('VISITA') && text.includes('INTERNADO')) return 'Visita internado';
  if (text.includes('EXAME')) return 'Exame';
  if (text.includes('CONSULTA')) return 'Consulta';
  if (text.includes('REUNIÃO') || text.includes('REUNIAO')) return 'Reunião';
  if (text.includes('BLOQUEIO') || text.includes('BLOQUEADO') || text.includes('FÉRIAS') || text.includes('FERIAS')) return 'Bloqueio';
  
  return 'Consulta';
}

// Mapeamento de convênios
function detectConvenio(summary, description) {
  const text = (summary + ' ' + (description || '')).toUpperCase();
  
  if (text.includes('UNIMED')) return 'UNIMED';
  if (text.includes('BRADESCO')) return 'BRADESCO SAÚDE';
  if (text.includes('SUL AMERICA') || text.includes('SUL-AMERICA') || text.includes('SULAMERICA')) return 'SUL AMÉRICA';
  if (text.includes('IPE')) return 'IPE SAÚDE';
  if (text.includes('CASSI')) return 'CASSI';
  if (text.includes('DOCTORCLIN')) return 'DOCTORCLIN';
  if (text.includes('SAUDE CAIXA') || text.includes('SAÚDE CAIXA')) return 'SAÚDE CAIXA';
  if (text.includes('SAUDE PAS') || text.includes('SAÚDE PAS')) return 'SAÚDE PAS';
  if (text.includes('PARTICULAR')) return 'Particular';
  
  return null;
}

function detectCancelado(summary) {
  if (summary.includes('❌') || summary.includes('🚨❌')) return true;
  if (summary.toUpperCase().includes('CANCELAD')) return true;
  return false;
}

function detectConfirmado(summary) {
  if (summary.includes('✅')) return true;
  return false;
}

function extractNomePaciente(summary) {
  let clean = summary.replace(/[❌✅🚨❗🛄]/g, '').trim();
  const parenMatch = clean.match(/\(([^)]+)\)/);
  if (parenMatch) {
    let nome = parenMatch[1].trim();
    nome = nome.replace(/\s*-\s*(UNIMED|BRADESCO|IPE|PARTICULAR|CASSI|RETORNO|URGENCIA).*$/i, '').trim();
    return nome.toUpperCase();
  }
  return null;
}

function extractCPF(description) {
  if (!description) return null;
  const cpfMatch = description.match(/CPF[:\s]+(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i);
  if (cpfMatch) {
    return cpfMatch[1].replace(/[.-]/g, '');
  }
  return null;
}

function extractTelefone(description) {
  if (!description) return null;
  const telMatch = description.match(/(?:Tel(?:efone)?|Fone)[.:\s]+\(?(\d{2})\)?[\s-]?(\d{4,5})[\s-]?(\d{4})/i);
  if (telMatch) {
    return `(${telMatch[1]}) ${telMatch[2]}-${telMatch[3]}`;
  }
  return null;
}

function extractEmail(description) {
  if (!description) return null;
  const emailMatch = description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return emailMatch[0].toLowerCase();
  }
  return null;
}

function parseICSDate(icsDate) {
  if (!icsDate) return null;
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const isUTC = icsDate.endsWith('Z');
  if (isUTC) {
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));
  } else {
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
  }
}

function decodeICSText(text) {
  if (!text) return null;
  return text.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').replace(/\r\n /g, '').replace(/\n /g, '').trim();
}

function extractField(eventText, fieldName) {
  const regex = new RegExp(`^${fieldName}[^:]*:(.+?)(?=\\n[A-Z][A-Z-]*:|$)`, 'ms');
  const match = eventText.match(regex);
  if (match) {
    return decodeICSText(match[1]);
  }
  return null;
}

function parseEvent(eventText) {
  const event = {
    uid: extractField(eventText, 'UID'),
    summary: extractField(eventText, 'SUMMARY'),
    description: extractField(eventText, 'DESCRIPTION'),
    location: extractField(eventText, 'LOCATION'),
    status: extractField(eventText, 'STATUS'),
    dtstart: extractField(eventText, 'DTSTART'),
    dtend: extractField(eventText, 'DTEND'),
  };
  
  event.dataInicio = parseICSDate(event.dtstart);
  event.dataFim = parseICSDate(event.dtend);
  event.tipoAtendimento = detectTipoAtendimento(event.summary || '', event.description);
  event.convenio = detectConvenio(event.summary || '', event.description);
  event.cancelado = detectCancelado(event.summary || '');
  event.confirmado = detectConfirmado(event.summary || '');
  event.nomePaciente = extractNomePaciente(event.summary || '');
  event.cpf = extractCPF(event.description);
  event.telefone = extractTelefone(event.description);
  event.email = extractEmail(event.description);
  
  return event;
}

function determinarStatus(event) {
  if (event.cancelado) return 'Cancelado';
  const agora = new Date();
  if (event.dataFim && event.dataFim < agora) {
    return 'Realizado';
  }
  if (event.confirmado) return 'Confirmado';
  return 'Agendado';
}

function detectLocal(summary, description, location) {
  const text = (summary + ' ' + (description || '') + ' ' + (location || '')).toUpperCase();
  if (text.includes('HMV') || text.includes('MOINHOS')) return 'HMV';
  if (text.includes('SANTA CASA') || text.includes('HSC')) return 'Santa Casa';
  if (text.includes('HMD') && text.includes('CG')) return 'HMD CG';
  if (text.includes('HMD')) return 'HMD';
  if (text.includes('HDVS') || text.includes('DIVINA')) return 'HDVS';
  if (text.includes('ON-LINE') || text.includes('ONLINE') || text.includes('TELEMEDICINA')) return 'On-line';
  if (text.includes('CONSULTÓRIO') || text.includes('CONSULTORIO') || text.includes('CRISTÓVÃO COLOMBO')) return 'Consultório';
  return 'Consultório';
}

let agendamentoCounter = 0;
function gerarIdAgendamento(dataInicio) {
  const year = dataInicio ? dataInicio.getFullYear() : new Date().getFullYear();
  agendamentoCounter++;
  return `AG-${year}-${String(agendamentoCounter).padStart(5, '0')}`;
}

async function main() {
  const icsPath = process.argv[2];
  
  if (!icsPath) {
    console.error('Uso: npx tsx scripts/run-import.mjs <caminho-do-arquivo.ics>');
    process.exit(1);
  }
  
  console.log(`📅 Importando eventos de: ${icsPath}`);
  
  const icsContent = fs.readFileSync(icsPath, 'utf-8');
  
  const events = [];
  let match;
  while ((match = EVENT_REGEX.exec(icsContent)) !== null) {
    const event = parseEvent(match[1]);
    if (event.dataInicio) {
      events.push(event);
    }
  }
  
  console.log(`📊 Total de eventos válidos: ${events.length}`);
  
  // Estatísticas
  const stats = { total: events.length, porTipo: {}, porConvenio: {}, porStatus: {}, comPaciente: 0, comCPF: 0 };
  
  for (const event of events) {
    stats.porTipo[event.tipoAtendimento] = (stats.porTipo[event.tipoAtendimento] || 0) + 1;
    if (event.convenio) {
      stats.porConvenio[event.convenio] = (stats.porConvenio[event.convenio] || 0) + 1;
    }
    const status = determinarStatus(event);
    stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
    if (event.nomePaciente) stats.comPaciente++;
    if (event.cpf) stats.comCPF++;
  }
  
  console.log('\n📈 Estatísticas:');
  console.log('Por tipo:', stats.porTipo);
  console.log('Por convênio:', stats.porConvenio);
  console.log('Por status:', stats.porStatus);
  console.log(`Com nome de paciente: ${stats.comPaciente}`);
  console.log(`Com CPF: ${stats.comCPF}`);
  
  // Salvar estatísticas em JSON
  const statsPath = '/home/ubuntu/consultorio_poc/scripts/import-stats.json';
  fs.writeFileSync(statsPath, JSON.stringify({ stats, sampleEvents: events.slice(0, 10) }, null, 2));
  console.log(`\n✅ Estatísticas salvas em: ${statsPath}`);
  console.log('\nPara executar a importação real, use a API do sistema.');
}

main().catch(console.error);
