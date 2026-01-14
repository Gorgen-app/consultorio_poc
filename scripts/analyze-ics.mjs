/**
 * Script de Análise de Arquivo ICS do Google Calendar
 * Gera estatísticas e preview dos eventos para importação
 * 
 * Uso: node scripts/analyze-ics.mjs <caminho-do-arquivo.ics>
 */

import fs from 'fs';

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
  
  return 'Outro';
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

async function main() {
  const icsPath = process.argv[2];
  
  if (!icsPath) {
    console.error('Uso: node scripts/analyze-ics.mjs <caminho-do-arquivo.ics>');
    process.exit(1);
  }
  
  console.log(`📅 Analisando eventos de: ${icsPath}`);
  
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
  const stats = { total: events.length, porTipo: {}, porConvenio: {}, porStatus: {}, porLocal: {}, comPaciente: 0, comCPF: 0 };
  
  for (const event of events) {
    stats.porTipo[event.tipoAtendimento] = (stats.porTipo[event.tipoAtendimento] || 0) + 1;
    if (event.convenio) {
      stats.porConvenio[event.convenio] = (stats.porConvenio[event.convenio] || 0) + 1;
    }
    const status = determinarStatus(event);
    stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
    const local = detectLocal(event.summary, event.description, event.location);
    stats.porLocal[local] = (stats.porLocal[local] || 0) + 1;
    if (event.nomePaciente) stats.comPaciente++;
    if (event.cpf) stats.comCPF++;
  }
  
  console.log('\n📈 ESTATÍSTICAS:');
  console.log('\n🏥 Por Tipo de Atendimento:');
  Object.entries(stats.porTipo).sort((a, b) => b[1] - a[1]).forEach(([tipo, count]) => {
    console.log(`   ${tipo}: ${count}`);
  });
  
  console.log('\n💳 Por Convênio:');
  Object.entries(stats.porConvenio).sort((a, b) => b[1] - a[1]).forEach(([convenio, count]) => {
    console.log(`   ${convenio}: ${count}`);
  });
  
  console.log('\n📍 Por Status:');
  Object.entries(stats.porStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  
  console.log('\n🏢 Por Local:');
  Object.entries(stats.porLocal).sort((a, b) => b[1] - a[1]).forEach(([local, count]) => {
    console.log(`   ${local}: ${count}`);
  });
  
  console.log(`\n👤 Com nome de paciente: ${stats.comPaciente} (${Math.round(stats.comPaciente/stats.total*100)}%)`);
  console.log(`📋 Com CPF: ${stats.comCPF} (${Math.round(stats.comCPF/stats.total*100)}%)`);
  
  // Salvar estatísticas em JSON
  const statsPath = '/home/ubuntu/consultorio_poc/scripts/import-stats.json';
  const sampleEvents = events.slice(0, 20).map(e => ({
    summary: e.summary,
    dataInicio: e.dataInicio,
    tipoAtendimento: e.tipoAtendimento,
    convenio: e.convenio,
    nomePaciente: e.nomePaciente,
    cpf: e.cpf,
    status: determinarStatus(e),
    local: detectLocal(e.summary, e.description, e.location),
  }));
  
  fs.writeFileSync(statsPath, JSON.stringify({ stats, sampleEvents, allEvents: events.map(e => ({
    uid: e.uid,
    summary: e.summary?.substring(0, 100),
    dataInicio: e.dataInicio,
    dataFim: e.dataFim,
    tipoAtendimento: e.tipoAtendimento,
    convenio: e.convenio,
    nomePaciente: e.nomePaciente,
    cpf: e.cpf,
    telefone: e.telefone,
    email: e.email,
    status: determinarStatus(e),
    local: detectLocal(e.summary, e.description, e.location),
    cancelado: e.cancelado,
    confirmado: e.confirmado,
  })) }, null, 2));
  
  console.log(`\n✅ Dados completos salvos em: ${statsPath}`);
}

main().catch(console.error);
