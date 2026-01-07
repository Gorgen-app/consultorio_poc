import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Schema de validação para Paciente
const pacienteSchema = z.object({
  idPaciente: z.string().min(1),
  dataInclusao: z.string().optional().nullable(),
  pastaPaciente: z.string().optional().nullable(),
  nome: z.string().min(1),
  dataNascimento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F", "Outro"]).optional().nullable(),
  cpf: z.string().optional().nullable(),
  nomeMae: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  operadora1: z.string().optional().nullable(),
  planoModalidade1: z.string().optional().nullable(),
  matriculaConvenio1: z.string().optional().nullable(),
  vigente1: z.string().optional().nullable(),
  privativo1: z.string().optional().nullable(),
  operadora2: z.string().optional().nullable(),
  planoModalidade2: z.string().optional().nullable(),
  matriculaConvenio2: z.string().optional().nullable(),
  vigente2: z.string().optional().nullable(),
  privativo2: z.string().optional().nullable(),
  obitoPerda: z.string().optional().nullable(),
  dataObitoLastFU: z.string().optional().nullable(),
  statusCaso: z.string().optional().nullable(),
  grupoDiagnostico: z.string().optional().nullable(),
  diagnosticoEspecifico: z.string().optional().nullable(),
  tempoSeguimentoAnos: z.string().optional().nullable(),
});

// Schema de validação para Atendimento
const atendimentoSchema = z.object({
  atendimento: z.string().min(1),
  pacienteId: z.number().int().positive(),
  dataAtendimento: z.date(),
  semana: z.number().int().optional().nullable(),
  tipoAtendimento: z.string().optional().nullable(),
  procedimento: z.string().optional().nullable(),
  codigosCBHPM: z.string().optional().nullable(),
  nomePaciente: z.string().optional().nullable(),
  local: z.string().optional().nullable(),
  convenio: z.string().optional().nullable(),
  planoConvenio: z.string().optional().nullable(),
  pagamentoEfetivado: z.boolean().optional().nullable(),
  pagamentoPostergado: z.string().optional().nullable(),
  dataEnvioFaturamento: z.string().optional().nullable(),
  dataEsperadaPagamento: z.string().optional().nullable(),
  faturamentoPrevisto: z.string().optional().nullable(),
  registroManualValorHM: z.string().optional().nullable(),
  faturamentoPrevistoFinal: z.string().optional().nullable(),
  dataPagamento: z.string().optional().nullable(),
  notaFiscalCorrespondente: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  faturamentoLeticia: z.string().optional().nullable(),
  faturamentoAGLU: z.string().optional().nullable(),
  mes: z.number().int().optional().nullable(),
  ano: z.number().int().optional().nullable(),
  trimestre: z.string().optional().nullable(),
  trimestreAno: z.string().optional().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  pacientes: router({
    getNextId: protectedProcedure
      .query(async () => {
        return await db.getNextPacienteId();
      }),

    create: protectedProcedure
      .input(pacienteSchema)
      .mutation(async ({ input }) => {
        return await db.createPaciente(input as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPacienteById(input.id);
      }),

    list: protectedProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          cpf: z.string().optional(),
          convenio: z.string().optional(),
          diagnostico: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.listPacientes(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: pacienteSchema.partial(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updatePaciente(input.id, input.data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePaciente(input.id);
      }),

    count: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.countPacientes(input);
      }),
  }),

  atendimentos: router({
    getNextId: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAtendimento: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await db.getNextAtendimentoId(input.pacienteId, input.dataAtendimento);
      }),

    create: protectedProcedure
      .input(atendimentoSchema)
      .mutation(async ({ input }) => {
        return await db.createAtendimento(input as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAtendimentoById(input.id);
      }),

    list: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number().optional(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
          tipo: z.string().optional(),
          convenio: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.listAtendimentos(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: atendimentoSchema.partial(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateAtendimento(input.id, input.data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteAtendimento(input.id);
      }),

    count: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number().optional(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.countAtendimentos(input);
      }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
