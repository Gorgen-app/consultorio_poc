/**
 * Router tRPC para Agenda v2.0
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as agendaDb from "../db/agendaDb";
import {
  isTransitionAllowed,
  getStatusLabel,
  getStatusColor,
  getAvailableActions,
} from "../services/consultationStateMachine";
import { randomUUID } from "crypto";

const uuidv4 = randomUUID;

export const agendaRouter = router({
  // ===== CALENDÁRIOS =====
  calendars: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          color: z.string().optional(),
          timezone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const calendarId = uuidv4();
        return await agendaDb.createCalendar({
          id: calendarId,
          tenantId: ctx.user?.id || "default",
          name: input.name,
          description: input.description,
          color: input.color,
          timezone: input.timezone,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await agendaDb.listCalendars(ctx.user?.id || "default");
    }),
  }),

  // ===== EVENTOS =====
  events: router({
    create: protectedProcedure
      .input(
        z.object({
          calendarId: z.string(),
          title: z.string(),
          category: z.enum([
            "consulta",
            "cirurgia",
            "procedimento",
            "visita_internado",
            "exame",
            "reuniao",
            "outro",
          ]),
          description: z.string().optional(),
          startAt: z.date(),
          endAt: z.date(),
          timezone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const eventId = uuidv4();

        // Verificar disponibilidade
        const availability = await agendaDb.checkAvailability({
          calendarId: input.calendarId,
          startAt: input.startAt,
          endAt: input.endAt,
        });

        if (!availability.available) {
          throw new Error("Horário indisponível - conflito com outro evento");
        }

        return await agendaDb.createEvent({
          id: eventId,
          calendarId: input.calendarId,
          title: input.title,
          category: input.category,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
          timezone: input.timezone,
          createdBy: ctx.user?.id,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        return await agendaDb.getEventById(input.eventId);
      }),

    listByPeriod: protectedProcedure
      .input(
        z.object({
          startAt: z.date(),
          endAt: z.date(),
          calendarId: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await agendaDb.listEventsByPeriod(input);
      }),

    delete: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .mutation(async ({ input }) => {
        return await agendaDb.deleteEvent(input.eventId);
      }),
  }),

  // ===== CONSULTAS =====
  consultations: router({
    create: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          patientId: z.string(),
          professionalId: z.string().optional(),
          payerType: z.enum(["particular", "convenio"]).optional(),
          payerId: z.string().optional(),
          payerName: z.string().optional(),
          planName: z.string().optional(),
          memberId: z.string().optional(),
          chiefComplaint: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await agendaDb.createConsultation(input);
      }),

    getById: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        return await agendaDb.getConsultationById(input.eventId);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          newStatus: z.enum([
            "agendado",
            "confirmado",
            "aguardando",
            "em_consulta",
            "finalizado",
            "cancelado",
          ]),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Validar transição
        const consultation = await agendaDb.getConsultationById(input.eventId);
        if (!consultation) {
          throw new Error("Consulta não encontrada");
        }

        const transition = isTransitionAllowed(
          consultation.status,
          input.newStatus
        );
        if (!transition.allowed) {
          throw new Error(transition.reason);
        }

        return await agendaDb.updateConsultationStatus({
          eventId: input.eventId,
          newStatus: input.newStatus,
          userId: ctx.user?.id || "system",
          note: input.note,
        });
      }),

    getStatusHistory: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        return await agendaDb.getStatusHistory(input.eventId);
      }),

    getAvailableActions: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        const consultation = await agendaDb.getConsultationById(input.eventId);
        if (!consultation) {
          throw new Error("Consulta não encontrada");
        }

        const actions = getAvailableActions(consultation.status);
        return actions.map((action) => ({
          status: action,
          label: getStatusLabel(action),
          color: getStatusColor(action),
        }));
      }),
  }),

  // ===== UTILIDADES =====
  utils: router({
    getStatusLabel: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(({ input }) => {
        return getStatusLabel(
          input.status as any
        );
      }),

    getStatusColor: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(({ input }) => {
        return getStatusColor(input.status as any);
      }),

    checkAvailability: protectedProcedure
      .input(
        z.object({
          calendarId: z.string(),
          startAt: z.date(),
          endAt: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await agendaDb.checkAvailability(input);
      }),
  }),
});
