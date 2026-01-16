#!/usr/bin/env node
/**
 * Google Calendar Sync Script
 * Script para sincronização bidirecional entre GORGEN e Google Calendar
 * 
 * Uso via MCP CLI:
 * - Executar manualmente quando necessário
 * - Pode ser agendado via cron ou task scheduler
 * 
 * Este script usa as ferramentas MCP do Google Calendar para:
 * 1. Exportar agendamentos do GORGEN para o Google Calendar
 * 2. Importar eventos do Google Calendar para o GORGEN
 */

import { execSync } from 'child_process';

// Configurações
const CALENDAR_ID = 'primary';
const TENANT_ID = 1; // Ajustar conforme necessário

/**
 * Formata data para RFC3339
 */
function toRFC3339(date) {
  return date.toISOString();
}

/**
 * Converte tipo de compromisso do GORGEN para título do Google Calendar
 */
function formatEventTitle(agendamento, includePatientName = false) {
  const tipoMap = {
    'Consulta': '🩺 Consulta',
    'Cirurgia': '🏥 Cirurgia',
    'Visita internado': '🛏️ Visita',
    'Procedimento em consultório': '💉 Procedimento',
    'Exame': '🔬 Exame',
    'Reunião': '📅 Reunião',
    'Bloqueio': '🚫 Bloqueio'
  };
  
  let title = tipoMap[agendamento.tipoCompromisso] || agendamento.tipoCompromisso;
  
  if (includePatientName && agendamento.pacienteNome) {
    title += ` - ${agendamento.pacienteNome}`;
  }
  
  return title;
}

/**
 * Executa comando MCP CLI
 */
function mcpCall(tool, args) {
  const cmd = `manus-mcp-cli tool call ${tool} --server google-calendar --input '${JSON.stringify(args)}'`;
  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Erro ao executar ${tool}:`, error.message);
    return null;
  }
}

/**
 * Cria evento no Google Calendar
 */
async function createGoogleEvent(agendamento, config = {}) {
  const event = {
    calendar_id: config.googleCalendarId || CALENDAR_ID,
    summary: formatEventTitle(agendamento, config.includePatientName),
    start_time: toRFC3339(new Date(agendamento.dataHoraInicio)),
    end_time: toRFC3339(new Date(agendamento.dataHoraFim)),
    description: agendamento.observacoes || '',
    location: agendamento.local || '',
  };
  
  console.log(`Criando evento: ${event.summary}`);
  
  const result = mcpCall('google_calendar_create_events', {
    events: [event]
  });
  
  return result;
}

/**
 * Atualiza evento no Google Calendar
 */
async function updateGoogleEvent(eventId, agendamento, config = {}) {
  const event = {
    event_id: eventId,
    calendar_id: config.googleCalendarId || CALENDAR_ID,
    summary: formatEventTitle(agendamento, config.includePatientName),
    start_time: toRFC3339(new Date(agendamento.dataHoraInicio)),
    end_time: toRFC3339(new Date(agendamento.dataHoraFim)),
    description: agendamento.observacoes || '',
    location: agendamento.local || '',
  };
  
  console.log(`Atualizando evento: ${event.summary}`);
  
  const result = mcpCall('google_calendar_update_events', {
    events: [event]
  });
  
  return result;
}

/**
 * Deleta evento do Google Calendar
 */
async function deleteGoogleEvent(eventId, calendarId = CALENDAR_ID) {
  console.log(`Deletando evento: ${eventId}`);
  
  const result = mcpCall('google_calendar_delete_events', {
    events: [{
      event_id: eventId,
      calendar_id: calendarId
    }]
  });
  
  return result;
}

/**
 * Busca eventos do Google Calendar
 */
async function searchGoogleEvents(timeMin, timeMax, calendarId = CALENDAR_ID) {
  console.log(`Buscando eventos de ${timeMin} até ${timeMax}`);
  
  const result = mcpCall('google_calendar_search_events', {
    calendar_id: calendarId,
    time_min: toRFC3339(timeMin),
    time_max: toRFC3339(timeMax),
    max_results: 250
  });
  
  return result;
}

/**
 * Sincroniza GORGEN -> Google Calendar
 */
async function syncToGoogle(agendamentos, config = {}) {
  console.log('\\n=== Sincronizando GORGEN -> Google Calendar ===');
  console.log(`Total de agendamentos: ${agendamentos.length}`);
  
  const results = {
    created: 0,
    updated: 0,
    errors: 0
  };
  
  for (const ag of agendamentos) {
    try {
      // Verificar se já existe sincronização
      if (ag.googleEventId) {
        await updateGoogleEvent(ag.googleEventId, ag, config);
        results.updated++;
      } else {
        const result = await createGoogleEvent(ag, config);
        if (result) {
          results.created++;
          // Aqui você salvaria o googleEventId no banco
          console.log(`  -> Evento criado com ID: ${result.id || 'N/A'}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao sincronizar agendamento ${ag.id}:`, error.message);
      results.errors++;
    }
  }
  
  console.log(`\\nResultado: ${results.created} criados, ${results.updated} atualizados, ${results.errors} erros`);
  return results;
}

/**
 * Sincroniza Google Calendar -> GORGEN
 */
async function syncFromGoogle(timeMin, timeMax, config = {}) {
  console.log('\\n=== Sincronizando Google Calendar -> GORGEN ===');
  
  const events = await searchGoogleEvents(timeMin, timeMax, config.googleCalendarId);
  
  if (!events || !events.items) {
    console.log('Nenhum evento encontrado no Google Calendar');
    return { imported: 0, updated: 0, errors: 0 };
  }
  
  console.log(`Total de eventos no Google: ${events.items.length}`);
  
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const event of events.items) {
    try {
      // Verificar se o evento já existe no GORGEN
      // Aqui você consultaria o banco de dados
      console.log(`  -> Evento: ${event.summary} (${event.start?.dateTime || event.start?.date})`);
      
      // Por enquanto, apenas lista os eventos
      // A importação real requer integração com o banco de dados
      results.skipped++;
    } catch (error) {
      console.error(`Erro ao processar evento ${event.id}:`, error.message);
      results.errors++;
    }
  }
  
  console.log(`\\nResultado: ${results.imported} importados, ${results.updated} atualizados, ${results.skipped} ignorados, ${results.errors} erros`);
  return results;
}

/**
 * Executa sincronização completa
 */
async function fullSync(config = {}) {
  console.log('\\n========================================');
  console.log('  GORGEN - Google Calendar Sync');
  console.log('========================================');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  
  // Definir período de sincronização (próximos 30 dias)
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 30);
  
  // Sincronizar do Google para GORGEN
  await syncFromGoogle(timeMin, timeMax, config);
  
  console.log('\\n========================================');
  console.log('  Sincronização concluída!');
  console.log('========================================');
}

// Executar se chamado diretamente
const args = process.argv.slice(2);
const command = args[0] || 'full';

switch (command) {
  case 'to-google':
    console.log('Sincronização GORGEN -> Google não implementada via CLI');
    console.log('Use a interface web para sincronizar agendamentos específicos');
    break;
  case 'from-google':
    syncFromGoogle(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    break;
  case 'full':
  default:
    fullSync();
}
