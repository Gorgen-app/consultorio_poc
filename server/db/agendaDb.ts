/**
 * Funções de acesso a dados para Agenda v2.0
 */

import { sql } from "drizzle-orm";
import { db } from "../_core/db";

/**
 * Criar novo evento
 */
export async function createEvent(data: {
  id: string;
  calendarId: string;
  title: string;
  category: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  timezone?: string;
  createdBy?: string;
}) {
  try {
    const result = await db.execute(sql`
      INSERT INTO events (id, calendar_id, title, category, description, start_at, end_at, timezone, created_by, created_at, updated_at)
      VALUES (${data.id}, ${data.calendarId}, ${data.title}, ${data.category}, ${data.description || null}, ${data.startAt}, ${data.endAt}, ${data.timezone || "America/Sao_Paulo"}, ${data.createdBy || null}, NOW(), NOW())
    `);
    return { success: true, eventId: data.id };
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    throw error;
  }
}

/**
 * Criar nova consulta
 */
export async function createConsultation(data: {
  eventId: string;
  patientId: string;
  professionalId?: string;
  payerType?: string;
  payerId?: string;
  payerName?: string;
  planName?: string;
  memberId?: string;
  chiefComplaint?: string;
  notes?: string;
}) {
  try {
    const result = await db.execute(sql`
      INSERT INTO consultations (event_id, patient_id, professional_id, payer_type, payer_id, payer_name, plan_name, member_id, chief_complaint, notes, status, created_at, updated_at)
      VALUES (${data.eventId}, ${data.patientId}, ${data.professionalId || null}, ${data.payerType || "particular"}, ${data.payerId || null}, ${data.payerName || null}, ${data.planName || null}, ${data.memberId || null}, ${data.chiefComplaint || null}, ${data.notes || null}, "agendado", NOW(), NOW())
    `);
    return { success: true, eventId: data.eventId };
  } catch (error) {
    console.error("Erro ao criar consulta:", error);
    throw error;
  }
}

/**
 * Obter evento por ID
 */
export async function getEventById(eventId: string) {
  try {
    const result = await db.execute(sql`
      SELECT * FROM events WHERE id = ${eventId} LIMIT 1
    `);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error("Erro ao obter evento:", error);
    throw error;
  }
}

/**
 * Obter consulta por ID
 */
export async function getConsultationById(eventId: string) {
  try {
    const result = await db.execute(sql`
      SELECT * FROM consultations WHERE event_id = ${eventId} LIMIT 1
    `);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error("Erro ao obter consulta:", error);
    throw error;
  }
}

/**
 * Listar eventos por período
 */
export async function listEventsByPeriod(data: {
  startAt: Date;
  endAt: Date;
  calendarId?: string;
  category?: string;
}) {
  try {
    let query = `SELECT * FROM events WHERE start_at >= ? AND start_at <= ?`;
    const params: any[] = [data.startAt, data.endAt];

    if (data.calendarId) {
      query += ` AND calendar_id = ?`;
      params.push(data.calendarId);
    }

    if (data.category) {
      query += ` AND category = ?`;
      params.push(data.category);
    }

    query += ` ORDER BY start_at ASC`;

    const result = await db.execute(sql.raw(query, params));
    return result.rows || [];
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    throw error;
  }
}

/**
 * Atualizar status de consulta
 */
export async function updateConsultationStatus(data: {
  eventId: string;
  newStatus: string;
  userId: string;
  note?: string;
}) {
  try {
    // Obter status atual
    const consultation = await getConsultationById(data.eventId);
    if (!consultation) {
      return { success: false, message: "Consulta não encontrada" };
    }

    const fromStatus = consultation.status;

    // Atualizar status
    await db.execute(sql`
      UPDATE consultations 
      SET status = ${data.newStatus}, updated_at = NOW()
      WHERE event_id = ${data.eventId}
    `);

    // Registrar no log
    await db.execute(sql`
      INSERT INTO consultation_status_log (id, event_id, from_status, to_status, changed_at, changed_by_user_id, note)
      VALUES (UUID(), ${data.eventId}, ${fromStatus}, ${data.newStatus}, NOW(), ${data.userId}, ${data.note || null})
    `);

    return { success: true, message: `Status alterado de ${fromStatus} para ${data.newStatus}` };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
}

/**
 * Obter histórico de status
 */
export async function getStatusHistory(eventId: string) {
  try {
    const result = await db.execute(sql`
      SELECT * FROM consultation_status_log 
      WHERE event_id = ${eventId}
      ORDER BY changed_at ASC
    `);
    return result.rows || [];
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    throw error;
  }
}

/**
 * Deletar evento
 */
export async function deleteEvent(eventId: string) {
  try {
    // Deletar consulta se existir
    await db.execute(sql`
      DELETE FROM consultations WHERE event_id = ${eventId}
    `);

    // Deletar evento
    await db.execute(sql`
      DELETE FROM events WHERE id = ${eventId}
    `);

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    throw error;
  }
}

/**
 * Criar calendário
 */
export async function createCalendar(data: {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  timezone?: string;
}) {
  try {
    await db.execute(sql`
      INSERT INTO calendars (id, tenant_id, name, description, color, timezone, created_at, updated_at)
      VALUES (${data.id}, ${data.tenantId}, ${data.name}, ${data.description || null}, ${data.color || "#3B82F6"}, ${data.timezone || "America/Sao_Paulo"}, NOW(), NOW())
    `);
    return { success: true, calendarId: data.id };
  } catch (error) {
    console.error("Erro ao criar calendário:", error);
    throw error;
  }
}

/**
 * Listar calendários
 */
export async function listCalendars(tenantId: string) {
  try {
    const result = await db.execute(sql`
      SELECT * FROM calendars WHERE tenant_id = ${tenantId} ORDER BY name ASC
    `);
    return result.rows || [];
  } catch (error) {
    console.error("Erro ao listar calendários:", error);
    throw error;
  }
}

/**
 * Verificar disponibilidade
 */
export async function checkAvailability(data: {
  calendarId: string;
  startAt: Date;
  endAt: Date;
}) {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as conflicts FROM events 
      WHERE calendar_id = ${data.calendarId}
      AND start_at < ${data.endAt}
      AND end_at > ${data.startAt}
    `);

    const conflicts = result.rows?.[0]?.conflicts || 0;
    return {
      available: conflicts === 0,
      conflicts: conflicts,
    };
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    throw error;
  }
}
