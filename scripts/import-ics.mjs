/**
 * Script de Importação de Eventos ICS para Agenda do Gorgen
 * 
 * Este script lê um arquivo ICS exportado do Google Calendar e importa
 * os eventos para a tabela de agendamentos do Gorgen.
 * 
 * Uso: node scripts/import-ics.mjs <caminho-do-arquivo.ics>
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

// Configuração do banco de dados
const DB_URL = process.env.DATABASE_URL;

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
  
  return 'Consulta'; // Default para eventos médicos
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

// Detectar se o evento foi cancelado (pelo emoji ou texto)
function detectCancelado(summary) {
  if (summary.includes('❌') || summary.includes('🚨❌')) return true;
  if (summary.toUpperCase().includes('CANCELAD')) return true;
  return false;
}

// Detectar se o evento foi confirmado/realizado
function detectConfirmado(summary) {
  if (summary.includes('✅')) return true;
  return false;
}

// Extrair nome do paciente do summary
function extractNomePaciente(summary) {
  // Remover emojis
  let clean = summary.replace(/[❌✅🚨❗🛄]/g, '').trim();
  
  // Tentar extrair do padrão com parênteses
  const parenMatch = clean.match(/\(([^)]+)\)/);
  if (parenMatch) {
    let nome = parenMatch[1].trim();
    // Limpar sufixos
    nome = nome.replace(/\s*-\s*(UNIMED|BRADESCO|IPE|PARTICULAR|CASSI|RETORNO|URGENCIA).*$/i, '').trim();
    return nome.toUpperCase();
  }
  
  return null;
}

// Extrair CPF da descrição
function extractCPF(description) {
  if (!description) return null;
  
  const cpfMatch = description.match(/CPF[:\s]+(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i);
  if (cpfMatch) {
    return cpfMatch[1].replace(/[.-]/g, '');
  }
  
  return null;
}

// Extrair telefone da descrição
function extractTelefone(description) {
  if (!description) return null;
  
  const telMatch = description.match(/(?:Tel(?:efone)?|Fone)[.:\s]+\(?(\d{2})\)?[\s-]?(\d{4,5})[\s-]?(\d{4})/i);
  if (telMatch) {
    return `(${telMatch[1]}) ${telMatch[2]}-${telMatch[3]}`;
  }
  
  return null;
}

// Extrair email da descrição
function extractEmail(description) {
  if (!description) return null;
  
  const emailMatch = description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return emailMatch[0].toLowerCase();
  }
  
  return null;
}

// Converter data ICS para Date
function parseICSDate(icsDate) {
  if (!icsDate) return null;
  
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  
  const [, year, month, day, hour, minute, second] = match;
  const isUTC = icsDate.endsWith('Z');
  
  if (isUTC) {
    return new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    ));
  } else {
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }
}

// Decodificar texto ICS (remover escapes)
function decodeICSText(text) {
  if (!text) return null;
  
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\r\n /g, '')
    .replace(/\n /g, '')
    .trim();
}

// Extrair campo do evento
function extractField(eventText, fieldName) {
  // Lidar com campos multi-linha
  const regex = new RegExp(`^${fieldName}[^:]*:(.+?)(?=\\n[A-Z][A-Z-]*:|$)`, 'ms');
  const match = eventText.match(regex);
  if (match) {
    return decodeICSText(match[1]);
  }
  return null;
}

// Parsear um evento ICS
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
  
  // Processar campos derivados
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

// Determinar status do agendamento
function determinarStatus(event) {
  if (event.cancelado) return 'Cancelado';
  
  const agora = new Date();
  if (event.dataFim && event.dataFim < agora) {
    return 'Realizado';
  }
  
  if (event.confirmado) return 'Confirmado';
  
  return 'Agendado';
}

// Determinar local baseado no texto
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

// Gerar ID de agendamento
let agendamentoCounter = 0;
function gerarIdAgendamento(dataInicio) {
  const year = dataInicio ? dataInicio.getFullYear() : new Date().getFullYear();
  agendamentoCounter++;
  return `AG-${year}-${String(agendamentoCounter).padStart(5, '0')}`;
}

async function main() {
  const icsPath = process.argv[2];
  
  if (!icsPath) {
    console.error('Uso: node scripts/import-ics.mjs <caminho-do-arquivo.ics>');
    process.exit(1);
  }
  
  console.log(`📅 Importando eventos de: ${icsPath}`);
  
  // Ler arquivo ICS
  const icsContent = fs.readFileSync(icsPath, 'utf-8');
  
  // Extrair todos os eventos
  const events = [];
  let match;
  while ((match = EVENT_REGEX.exec(icsContent)) !== null) {
    const event = parseEvent(match[1]);
    if (event.dataInicio) { // Só importar eventos com data válida
      events.push(event);
    }
  }
  
  console.log(`📊 Total de eventos válidos: ${events.length}`);
  
  // Estatísticas
  const stats = {
    total: events.length,
    porTipo: {},
    porConvenio: {},
    porStatus: {},
    comPaciente: 0,
    comCPF: 0,
  };
  
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
  
  // Conectar ao banco de dados
  if (!DB_URL) {
    console.error('\n❌ DATABASE_URL não definida');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(DB_URL);
  console.log('\n🔗 Conectado ao banco de dados');
  
  // Buscar tenant do Dr. André Gorgen
  const [tenants] = await connection.execute(
    "SELECT id FROM tenants WHERE name LIKE '%André%' OR name LIKE '%Gorgen%' LIMIT 1"
  );
  
  if (tenants.length === 0) {
    console.error('❌ Tenant não encontrado');
    await connection.end();
    process.exit(1);
  }
  
  const tenantId = tenants[0].id;
  console.log(`📍 Tenant ID: ${tenantId}`);
  
  // Buscar último ID de agendamento para continuar a sequência
  const [lastAgendamento] = await connection.execute(
    "SELECT id_agendamento FROM agendamentos WHERE tenant_id = ? ORDER BY id DESC LIMIT 1",
    [tenantId]
  );
  
  if (lastAgendamento.length > 0) {
    const lastId = lastAgendamento[0].id_agendamento;
    const lastNum = parseInt(lastId.split('-')[2]) || 0;
    agendamentoCounter = lastNum;
    console.log(`📍 Último ID de agendamento: ${lastId} (contador: ${agendamentoCounter})`);
  }
  
  // Importar eventos
  let importados = 0;
  let erros = 0;
  let duplicados = 0;
  
  for (const event of events) {
    try {
      // Verificar se já existe pelo UID
      const [existing] = await connection.execute(
        'SELECT id FROM agendamentos WHERE google_uid = ? AND tenant_id = ?',
        [event.uid, tenantId]
      );
      
      if (existing.length > 0) {
        duplicados++;
        continue;
      }
      
      // Determinar valores
      const status = determinarStatus(event);
      const local = detectLocal(event.summary, event.description, event.location);
      const tipoAtendimento = event.tipoAtendimento;
      const idAgendamento = gerarIdAgendamento(event.dataInicio);
      
      // Calcular data fim (se não existir, adicionar 30 minutos)
      const dataFim = event.dataFim || new Date(event.dataInicio.getTime() + 30 * 60000);
      
      // Inserir agendamento
      await connection.execute(
        `INSERT INTO agendamentos (
          tenant_id, id_agendamento, google_uid, titulo, descricao, 
          data_hora_inicio, data_hora_fim, tipo_compromisso,
          local, status, 
          paciente_nome, cpf_paciente, telefone_paciente, email_paciente,
          convenio, importado_de, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          tenantId,
          idAgendamento,
          event.uid,
          event.summary?.substring(0, 255) || 'Sem título',
          event.description?.substring(0, 5000) || null,
          event.dataInicio,
          dataFim,
          tipoAtendimento,
          local,
          status,
          event.nomePaciente?.substring(0, 255) || null,
          event.cpf || null,
          event.telefone || null,
          event.email || null,
          event.convenio,
          'google_calendar'
        ]
      );
      
      importados++;
      
      if (importados % 100 === 0) {
        console.log(`   Importados: ${importados}...`);
      }
    } catch (error) {
      erros++;
      if (erros <= 10) {
        console.error(`❌ Erro ao importar evento: ${event.summary?.substring(0, 50)}`, error.message);
      }
    }
  }
  
  await connection.end();
  
  console.log('\n✅ Importação concluída!');
  console.log(`   Importados: ${importados}`);
  console.log(`   Duplicados (ignorados): ${duplicados}`);
  console.log(`   Erros: ${erros}`);
}

main().catch(console.error);
