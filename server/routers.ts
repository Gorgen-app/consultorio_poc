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
      .mutation(async ({ input, ctx }) => {
        const result = await db.createPaciente(input as any);
        
        // Registrar auditoria
        await db.createAuditLog(
          "CREATE",
          "paciente",
          result.id,
          result.idPaciente,
          null,
          input as any,
          {
            userId: ctx.user?.id,
            userName: ctx.user?.name || undefined,
            userEmail: ctx.user?.email || undefined,
          }
        );
        
        return result;
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
          includeDeleted: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        if (input.includeDeleted) {
          return await db.listPacientesWithDeleted(true);
        }
        return await db.listPacientes(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: pacienteSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Buscar valores antigos para auditoria
        const oldPaciente = await db.getPacienteById(input.id);
        
        const result = await db.updatePaciente(input.id, input.data as any);
        
        // Registrar auditoria
        if (oldPaciente) {
          await db.createAuditLog(
            "UPDATE",
            "paciente",
            input.id,
            oldPaciente.idPaciente,
            oldPaciente as any,
            input.data as any,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Buscar paciente para auditoria
        const paciente = await db.getPacienteById(input.id);
        
        // Soft delete
        const result = await db.softDeletePaciente(input.id, ctx.user?.id || 0);
        
        // Registrar auditoria
        if (paciente) {
          await db.createAuditLog(
            "DELETE",
            "paciente",
            input.id,
            paciente.idPaciente,
            paciente as any,
            null,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
      }),

    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.restorePaciente(input.id);
        
        // Buscar paciente restaurado para auditoria
        const paciente = await db.getPacienteById(input.id);
        
        if (paciente) {
          await db.createAuditLog(
            "RESTORE",
            "paciente",
            input.id,
            paciente.idPaciente,
            null,
            paciente as any,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
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
      .mutation(async ({ input, ctx }) => {
        const result = await db.createAtendimento(input as any);
        
        // Registrar auditoria
        await db.createAuditLog(
          "CREATE",
          "atendimento",
          result.id,
          result.atendimento,
          null,
          input as any,
          {
            userId: ctx.user?.id,
            userName: ctx.user?.name || undefined,
            userEmail: ctx.user?.email || undefined,
          }
        );
        
        return result;
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
          includeDeleted: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        if (input.includeDeleted) {
          return await db.listAtendimentosWithDeleted(true);
        }
        return await db.listAtendimentos(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: atendimentoSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Buscar valores antigos para auditoria
        const oldAtendimento = await db.getAtendimentoById(input.id);
        
        const result = await db.updateAtendimento(input.id, input.data as any);
        
        // Registrar auditoria
        if (oldAtendimento) {
          await db.createAuditLog(
            "UPDATE",
            "atendimento",
            input.id,
            oldAtendimento.atendimento,
            oldAtendimento as any,
            input.data as any,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Buscar atendimento para auditoria
        const atendimento = await db.getAtendimentoById(input.id);
        
        // Soft delete
        const result = await db.softDeleteAtendimento(input.id, ctx.user?.id || 0);
        
        // Registrar auditoria
        if (atendimento) {
          await db.createAuditLog(
            "DELETE",
            "atendimento",
            input.id,
            atendimento.atendimento,
            atendimento as any,
            null,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
      }),

    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.restoreAtendimento(input.id);
        
        // Buscar atendimento restaurado para auditoria
        const atendimento = await db.getAtendimentoById(input.id);
        
        if (atendimento) {
          await db.createAuditLog(
            "RESTORE",
            "atendimento",
            input.id,
            atendimento.atendimento,
            null,
            atendimento as any,
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
            }
          );
        }
        
        return result;
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

  audit: router({
    list: protectedProcedure
      .input(
        z.object({
          entityType: z.enum(["paciente", "atendimento", "user"]).optional(),
          entityId: z.number().optional(),
          action: z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"]).optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.listAuditLogs(input);
      }),
  }),

  // ===== PRONTUÁRIO MÉDICO ELETRÔNICO =====
  
  prontuario: router({
    // Buscar prontuário completo
    completo: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProntuarioCompleto(input.pacienteId);
      }),

    // Resumo Clínico
    resumoClinico: router({
      get: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.getResumoClinico(input.pacienteId);
        }),
      
      upsert: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          historiaClinica: z.string().optional().nullable(),
          antecedentesPessoais: z.string().optional().nullable(),
          antecedentesFamiliares: z.string().optional().nullable(),
          habitos: z.string().optional().nullable(),
          gestacoes: z.number().optional().nullable(),
          partos: z.number().optional().nullable(),
          abortos: z.number().optional().nullable(),
          dum: z.string().optional().nullable(),
          pesoAtual: z.string().optional().nullable(),
          altura: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.upsertResumoClinico(input as any);
        }),
    }),

    // Problemas Ativos
    problemas: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listProblemasAtivos(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          descricao: z.string().min(1),
          cid10: z.string().optional().nullable(),
          dataInicio: z.string().optional().nullable(),
          dataResolucao: z.string().optional().nullable(),
          ativo: z.boolean().default(true),
          observacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createProblemaAtivo(input as any);
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          descricao: z.string().optional(),
          cid10: z.string().optional().nullable(),
          dataInicio: z.string().optional().nullable(),
          dataResolucao: z.string().optional().nullable(),
          ativo: z.boolean().optional(),
          observacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateProblemaAtivo(id, data as any);
        }),
    }),

    // Alergias
    alergias: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listAlergias(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          tipo: z.enum(["Medicamento", "Alimento", "Ambiental", "Outro"]),
          substancia: z.string().min(1),
          reacao: z.string().optional().nullable(),
          gravidade: z.enum(["Leve", "Moderada", "Grave"]).optional().nullable(),
          confirmada: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
          return await db.createAlergia(input as any);
        }),
      
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await db.deleteAlergia(input.id);
        }),
    }),

    // Medicamentos em Uso
    medicamentos: router({
      list: protectedProcedure
        .input(z.object({ 
          pacienteId: z.number(),
          apenasAtivos: z.boolean().default(true),
        }))
        .query(async ({ input }) => {
          return await db.listMedicamentosUso(input.pacienteId, input.apenasAtivos);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          medicamento: z.string().min(1),
          principioAtivo: z.string().optional().nullable(),
          dosagem: z.string().optional().nullable(),
          posologia: z.string().optional().nullable(),
          viaAdministracao: z.string().optional().nullable(),
          dataInicio: z.string().optional().nullable(),
          dataFim: z.string().optional().nullable(),
          motivoUso: z.string().optional().nullable(),
          prescritoPor: z.string().optional().nullable(),
          ativo: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          return await db.createMedicamentoUso(input as any);
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          medicamento: z.string().optional(),
          principioAtivo: z.string().optional().nullable(),
          dosagem: z.string().optional().nullable(),
          posologia: z.string().optional().nullable(),
          viaAdministracao: z.string().optional().nullable(),
          dataInicio: z.string().optional().nullable(),
          dataFim: z.string().optional().nullable(),
          motivoUso: z.string().optional().nullable(),
          prescritoPor: z.string().optional().nullable(),
          ativo: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateMedicamentoUso(id, data as any);
        }),
    }),

    // Evoluções
    evolucoes: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listEvolucoes(input.pacienteId);
        }),
      
      get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await db.getEvolucao(input.id);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          atendimentoId: z.number().optional().nullable(),
          dataEvolucao: z.date(),
          tipo: z.enum(["Consulta", "Retorno", "Urgência", "Teleconsulta", "Parecer"]).default("Consulta"),
          subjetivo: z.string().optional().nullable(),
          objetivo: z.string().optional().nullable(),
          avaliacao: z.string().optional().nullable(),
          plano: z.string().optional().nullable(),
          pressaoArterial: z.string().optional().nullable(),
          frequenciaCardiaca: z.number().optional().nullable(),
          temperatura: z.string().optional().nullable(),
          peso: z.string().optional().nullable(),
          altura: z.string().optional().nullable(),
          profissionalNome: z.string().optional().nullable(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await db.createEvolucao({
            ...input,
            profissionalId: ctx.user?.id,
            profissionalNome: input.profissionalNome || ctx.user?.name,
          } as any);
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          subjetivo: z.string().optional().nullable(),
          objetivo: z.string().optional().nullable(),
          avaliacao: z.string().optional().nullable(),
          plano: z.string().optional().nullable(),
          pressaoArterial: z.string().optional().nullable(),
          frequenciaCardiaca: z.number().optional().nullable(),
          temperatura: z.string().optional().nullable(),
          peso: z.string().optional().nullable(),
          altura: z.string().optional().nullable(),
          assinado: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateEvolucao(id, data as any);
        }),
    }),

    // Internações
    internacoes: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listInternacoes(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          hospital: z.string().min(1),
          setor: z.string().optional().nullable(),
          leito: z.string().optional().nullable(),
          dataAdmissao: z.date(),
          dataAlta: z.date().optional().nullable(),
          motivoInternacao: z.string().optional().nullable(),
          diagnosticoAdmissao: z.string().optional().nullable(),
          cid10Admissao: z.string().optional().nullable(),
          diagnosticoAlta: z.string().optional().nullable(),
          cid10Alta: z.string().optional().nullable(),
          tipoAlta: z.enum(["Melhorado", "Curado", "Transferido", "Óbito", "Evasão", "A pedido"]).optional().nullable(),
          resumoInternacao: z.string().optional().nullable(),
          complicacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createInternacao(input as any);
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          hospital: z.string().optional(),
          setor: z.string().optional().nullable(),
          leito: z.string().optional().nullable(),
          dataAlta: z.date().optional().nullable(),
          diagnosticoAlta: z.string().optional().nullable(),
          cid10Alta: z.string().optional().nullable(),
          tipoAlta: z.enum(["Melhorado", "Curado", "Transferido", "Óbito", "Evasão", "A pedido"]).optional().nullable(),
          resumoInternacao: z.string().optional().nullable(),
          complicacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateInternacao(id, data as any);
        }),
    }),

    // Cirurgias
    cirurgias: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listCirurgias(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          internacaoId: z.number().optional().nullable(),
          dataCirurgia: z.date(),
          procedimento: z.string().min(1),
          codigosCbhpm: z.string().optional().nullable(),
          hospital: z.string().optional().nullable(),
          salaOperatoria: z.string().optional().nullable(),
          cirurgiaoResponsavel: z.string().optional().nullable(),
          equipe: z.string().optional().nullable(),
          anestesista: z.string().optional().nullable(),
          tipoAnestesia: z.string().optional().nullable(),
          indicacao: z.string().optional().nullable(),
          descricaoCirurgica: z.string().optional().nullable(),
          achados: z.string().optional().nullable(),
          complicacoes: z.string().optional().nullable(),
          duracaoMinutos: z.number().optional().nullable(),
          sangramento: z.string().optional().nullable(),
          status: z.enum(["Agendada", "Realizada", "Cancelada", "Adiada"]).default("Agendada"),
        }))
        .mutation(async ({ input }) => {
          return await db.createCirurgia(input as any);
        }),
      
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          dataCirurgia: z.date().optional(),
          procedimento: z.string().optional(),
          codigosCbhpm: z.string().optional().nullable(),
          hospital: z.string().optional().nullable(),
          salaOperatoria: z.string().optional().nullable(),
          cirurgiaoResponsavel: z.string().optional().nullable(),
          equipe: z.string().optional().nullable(),
          anestesista: z.string().optional().nullable(),
          tipoAnestesia: z.string().optional().nullable(),
          indicacao: z.string().optional().nullable(),
          descricaoCirurgica: z.string().optional().nullable(),
          achados: z.string().optional().nullable(),
          complicacoes: z.string().optional().nullable(),
          duracaoMinutos: z.number().optional().nullable(),
          sangramento: z.string().optional().nullable(),
          status: z.enum(["Agendada", "Realizada", "Cancelada", "Adiada"]).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateCirurgia(id, data as any);
        }),
    }),

    // Exames Laboratoriais
    examesLab: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listExamesLaboratoriais(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          dataColeta: z.string(),
          dataResultado: z.string().optional().nullable(),
          laboratorio: z.string().optional().nullable(),
          tipoExame: z.string().min(1),
          exame: z.string().min(1),
          resultado: z.string().optional().nullable(),
          valorReferencia: z.string().optional().nullable(),
          unidade: z.string().optional().nullable(),
          alterado: z.boolean().default(false),
          observacoes: z.string().optional().nullable(),
          arquivoUrl: z.string().optional().nullable(),
          arquivoNome: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createExameLaboratorial(input as any);
        }),
    }),

    // Exames de Imagem
    examesImagem: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listExamesImagem(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          dataExame: z.string(),
          tipoExame: z.enum(["Raio-X", "Tomografia", "Ressonância", "Ultrassonografia", "Mamografia", "Densitometria", "PET-CT", "Cintilografia", "Outro"]),
          regiao: z.string().min(1),
          clinicaServico: z.string().optional().nullable(),
          medicoSolicitante: z.string().optional().nullable(),
          medicoLaudador: z.string().optional().nullable(),
          indicacao: z.string().optional().nullable(),
          laudo: z.string().optional().nullable(),
          conclusao: z.string().optional().nullable(),
          arquivoLaudoUrl: z.string().optional().nullable(),
          arquivoImagemUrl: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createExameImagem(input as any);
        }),
    }),

    // Endoscopias
    endoscopias: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listEndoscopias(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          dataExame: z.string(),
          tipoExame: z.enum(["EDA", "Colonoscopia", "Retossigmoidoscopia", "CPRE", "Ecoendoscopia", "Enteroscopia", "Outro"]),
          clinicaServico: z.string().optional().nullable(),
          medicoExecutor: z.string().optional().nullable(),
          indicacao: z.string().optional().nullable(),
          preparo: z.string().optional().nullable(),
          sedacao: z.string().optional().nullable(),
          descricao: z.string().optional().nullable(),
          conclusao: z.string().optional().nullable(),
          biopsia: z.boolean().default(false),
          localBiopsia: z.string().optional().nullable(),
          resultadoBiopsia: z.string().optional().nullable(),
          arquivoLaudoUrl: z.string().optional().nullable(),
          arquivoImagensUrl: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createEndoscopia(input as any);
        }),
    }),

    // Cardiologia
    cardiologia: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listCardiologia(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          dataExame: z.string(),
          tipoExame: z.enum(["ECG", "Ecocardiograma", "Teste Ergométrico", "Holter 24h", "MAPA", "Cintilografia Miocárdica", "Cateterismo", "Angiotomografia", "Outro"]),
          clinicaServico: z.string().optional().nullable(),
          medicoExecutor: z.string().optional().nullable(),
          indicacao: z.string().optional().nullable(),
          descricao: z.string().optional().nullable(),
          conclusao: z.string().optional().nullable(),
          feve: z.string().optional().nullable(),
          ddve: z.string().optional().nullable(),
          dsve: z.string().optional().nullable(),
          ae: z.string().optional().nullable(),
          arquivoLaudoUrl: z.string().optional().nullable(),
          arquivoExameUrl: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createCardiologia(input as any);
        }),
    }),

    // Terapias
    terapias: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listTerapias(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          dataTerapia: z.date(),
          tipoTerapia: z.enum(["Quimioterapia", "Imunoterapia", "Terapia Alvo", "Imunobiológico", "Infusão", "Transfusão", "Outro"]),
          protocolo: z.string().optional().nullable(),
          ciclo: z.number().optional().nullable(),
          dia: z.number().optional().nullable(),
          medicamentos: z.string().optional().nullable(),
          local: z.string().optional().nullable(),
          preQuimio: z.string().optional().nullable(),
          intercorrencias: z.string().optional().nullable(),
          observacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createTerapia(input as any);
        }),
    }),

    // Obstetrícia
    obstetricia: router({
      list: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.listObstetricia(input.pacienteId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          tipoRegistro: z.enum(["Pré-natal", "Parto", "Puerpério", "Aborto"]),
          dataRegistro: z.string(),
          dum: z.string().optional().nullable(),
          dpp: z.string().optional().nullable(),
          idadeGestacional: z.string().optional().nullable(),
          tipoParto: z.enum(["Normal", "Cesárea", "Fórceps", "Vácuo"]).optional().nullable(),
          dataParto: z.date().optional().nullable(),
          hospital: z.string().optional().nullable(),
          pesoRn: z.number().optional().nullable(),
          apgar1: z.number().optional().nullable(),
          apgar5: z.number().optional().nullable(),
          sexoRn: z.enum(["M", "F"]).optional().nullable(),
          observacoes: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          return await db.createObstetricia(input as any);
        }),
    }),

    // Documentos Médicos
    documentos: router({
      list: protectedProcedure
        .input(z.object({ 
          pacienteId: z.number(),
          tipo: z.string().optional(),
        }))
        .query(async ({ input }) => {
          return await db.listDocumentosMedicos(input.pacienteId, input.tipo);
        }),
      
      get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await db.getDocumentoMedico(input.id);
        }),
      
      create: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          evolucaoId: z.number().optional().nullable(),
          tipo: z.enum(["Receita", "Receita Especial", "Solicitação de Exames", "Atestado Comparecimento", "Atestado Afastamento", "Laudo Médico", "Relatório Médico", "Protocolo Cirurgia", "Guia SADT", "Guia Internação", "Outro"]),
          dataEmissao: z.date(),
          conteudo: z.string().optional().nullable(),
          medicamentos: z.string().optional().nullable(),
          cid10: z.string().optional().nullable(),
          diasAfastamento: z.number().optional().nullable(),
          dataInicio: z.string().optional().nullable(),
          dataFim: z.string().optional().nullable(),
          examesSolicitados: z.string().optional().nullable(),
          justificativa: z.string().optional().nullable(),
          procedimentoProposto: z.string().optional().nullable(),
          dataPrevista: z.string().optional().nullable(),
          hospitalPrevisto: z.string().optional().nullable(),
          crm: z.string().optional().nullable(),
          arquivoUrl: z.string().optional().nullable(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await db.createDocumentoMedico({
            ...input,
            profissionalId: ctx.user?.id,
            profissionalNome: ctx.user?.name,
          } as any);
        }),
    }),

    // Histórico de Medidas Antropométricas
    // Pilar Fundamental: Imutabilidade e Preservação Histórica
    historicoMedidas: router({
      registrar: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          peso: z.number().optional(),
          altura: z.number().optional(),
          pressaoSistolica: z.number().optional(),
          pressaoDiastolica: z.number().optional(),
          frequenciaCardiaca: z.number().optional(),
          temperatura: z.number().optional(),
          saturacao: z.number().optional(),
          observacoes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await db.registrarMedida({
            ...input,
            registradoPor: ctx.user?.name || "Sistema",
          });
        }),
      
      listar: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          limit: z.number().optional().default(50),
        }))
        .query(async ({ input }) => {
          return await db.listarHistoricoMedidas(input.pacienteId, input.limit);
        }),
      
      ultimaMedida: protectedProcedure
        .input(z.object({ pacienteId: z.number() }))
        .query(async ({ input }) => {
          return await db.getUltimaMedida(input.pacienteId);
        }),
      
      evolucaoIMC: protectedProcedure
        .input(z.object({
          pacienteId: z.number(),
          meses: z.number().optional().default(12),
        }))
        .query(async ({ input }) => {
          return await db.getEvolucaoIMC(input.pacienteId, input.meses);
        }),
    }),
  }),

  // ===== AGENDA =====
  agenda: router({
    getNextId: protectedProcedure
      .query(async () => {
        return await db.getNextAgendamentoId();
      }),

    create: protectedProcedure
      .input(z.object({
        idAgendamento: z.string(),
        tipoCompromisso: z.enum(["Consulta", "Cirurgia", "Visita internado", "Procedimento em consultório", "Exame", "Reunião", "Bloqueio"]),
        pacienteId: z.number().optional().nullable(),
        pacienteNome: z.string().optional().nullable(),
        dataHoraInicio: z.date(),
        dataHoraFim: z.date(),
        local: z.string().optional().nullable(),
        titulo: z.string().optional().nullable(),
        descricao: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createAgendamento({
          ...input,
          criadoPor: ctx.user?.name || "Sistema",
        } as any);
      }),

    list: protectedProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        pacienteId: z.number().optional(),
        tipo: z.string().optional(),
        status: z.string().optional(),
        incluirCancelados: z.boolean().optional().default(true),
      }))
      .query(async ({ input }) => {
        return await db.listAgendamentos(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgendamentoById(input.id);
      }),

    cancelar: protectedProcedure
      .input(z.object({
        id: z.number(),
        motivo: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.cancelarAgendamento(
          input.id,
          input.motivo,
          ctx.user?.name || "Sistema"
        );
      }),

    reagendar: protectedProcedure
      .input(z.object({
        idOriginal: z.number(),
        novaDataInicio: z.date(),
        novaDataFim: z.date(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.reagendarAgendamento(
          input.idOriginal,
          input.novaDataInicio,
          input.novaDataFim,
          ctx.user?.name || "Sistema",
          input.motivo
        );
      }),

    confirmar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.confirmarAgendamento(
          input.id,
          ctx.user?.name || "Sistema"
        );
      }),

    realizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        atendimentoId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.realizarAgendamento(
          input.id,
          ctx.user?.name || "Sistema",
          input.atendimentoId
        );
      }),

    marcarFalta: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.marcarFaltaAgendamento(
          input.id,
          ctx.user?.name || "Sistema"
        );
      }),

    historico: protectedProcedure
      .input(z.object({ agendamentoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getHistoricoAgendamento(input.agendamentoId);
      }),
  }),

  // ===== BLOQUEIOS DE HORÁRIO =====
  bloqueios: router({
    getNextId: protectedProcedure
      .query(async () => {
        return await db.getNextBloqueioId();
      }),

    create: protectedProcedure
      .input(z.object({
        idBloqueio: z.string(),
        dataHoraInicio: z.date(),
        dataHoraFim: z.date(),
        tipoBloqueio: z.enum(["Férias", "Feriado", "Reunião fixa", "Congresso", "Particular", "Outro"]),
        titulo: z.string(),
        descricao: z.string().optional().nullable(),
        recorrente: z.boolean().optional().default(false),
        padraoRecorrencia: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createBloqueio({
          ...input,
          criadoPor: ctx.user?.name || "Sistema",
        } as any);
      }),

    list: protectedProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        incluirCancelados: z.boolean().optional().default(false),
      }))
      .query(async ({ input }) => {
        return await db.listBloqueios(input);
      }),

    cancelar: protectedProcedure
      .input(z.object({
        id: z.number(),
        motivo: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.cancelarBloqueio(
          input.id,
          input.motivo,
          ctx.user?.name || "Sistema"
        );
      }),
  }),

  // ============================================
  // PERFIS DE USUÁRIO
  // ============================================
  perfil: router({
    // Obter perfil do usuário logado
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return null;
      const profile = await db.getUserProfile(ctx.user.id);
      if (!profile) {
        // Criar perfil padrão se não existir
        return await db.ensureUserProfile(ctx.user.id, {
          name: ctx.user.name || undefined,
          email: ctx.user.email || undefined,
        });
      }
      return profile;
    }),

    // Obter perfis disponíveis para o usuário
    getAvailablePerfis: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      return await db.getAvailablePerfis(ctx.user.id);
    }),

    // Trocar perfil ativo
    setPerfilAtivo: protectedProcedure
      .input(z.object({
        perfil: z.enum(["admin_master", "medico", "secretaria", "auditor", "paciente"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.setPerfilAtivo(ctx.user.id, input.perfil);
      }),

    // Atualizar perfil do usuário
    update: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string().optional(),
        cpf: z.string().optional(),
        email: z.string().email().optional(),
        crm: z.string().optional(),
        especialidade: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.updateUserProfile(ctx.user.id, input);
      }),

    // Listar todos os perfis (admin only)
    list: protectedProcedure.query(async ({ ctx }) => {
      // Verificar se é admin
      const profile = await db.getUserProfile(ctx.user?.id || 0);
      if (!profile?.isAdminMaster) {
        throw new Error("Acesso negado: apenas administradores podem listar perfis");
      }
      return await db.listUserProfiles();
    }),

    // Criar ou atualizar perfil de outro usuário (admin only)
    upsert: protectedProcedure
      .input(z.object({
        userId: z.number(),
        nomeCompleto: z.string(),
        cpf: z.string(),
        email: z.string().email(),
        isAdminMaster: z.boolean().optional(),
        isMedico: z.boolean().optional(),
        isSecretaria: z.boolean().optional(),
        isFinanceiro: z.boolean().optional(),
        isVisualizador: z.boolean().optional(),
        crm: z.string().optional(),
        especialidade: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin
        const adminProfile = await db.getUserProfile(ctx.user?.id || 0);
        if (!adminProfile?.isAdminMaster) {
          throw new Error("Acesso negado: apenas administradores podem gerenciar perfis");
        }
        
        const existing = await db.getUserProfile(input.userId);
        if (existing) {
          return await db.updateUserProfile(input.userId, input);
        } else {
          const { userId, ...profileData } = input;
          return await db.createUserProfile({
            userId,
            ...profileData,
          });
        }
      }),

    // ========================================
    // VÍNCULOS SECRETÁRIA-MÉDICO
    // ========================================

    // Criar vínculo entre secretária e médico
    criarVinculo: protectedProcedure
      .input(z.object({
        medicoUserId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.openId) throw new Error("Usuário não autenticado");
        
        // Verificar se o usuário tem perfil de secretária
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile?.isSecretaria) {
          throw new Error("Apenas secretárias podem criar vínculos");
        }

        return await db.criarVinculo(ctx.user.openId, input.medicoUserId);
      }),

    // Listar vínculos da secretária logada
    listarMeusVinculos: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.openId) return [];
      
      const profile = await db.getUserProfile(ctx.user.id);
      if (!profile) return [];

      // Se for secretária, listar médicos vinculados
      if (profile.isSecretaria) {
        return await db.listarVinculosSecretaria(ctx.user.openId);
      }
      
      // Se for médico, listar secretárias vinculadas
      if (profile.isMedico) {
        return await db.listarVinculosMedico(ctx.user.openId);
      }

      return [];
    }),

    // Renovar vínculo (médico aceita renovação)
    renovarVinculo: protectedProcedure
      .input(z.object({
        vinculoId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.openId) throw new Error("Usuário não autenticado");
        
        // Verificar se o usuário é o médico do vínculo
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile?.isMedico) {
          throw new Error("Apenas médicos podem renovar vínculos");
        }

        await db.renovarVinculo(input.vinculoId);
        return { success: true };
      }),

    // Cancelar vínculo
    cancelarVinculo: protectedProcedure
      .input(z.object({
        vinculoId: z.number(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.openId) throw new Error("Usuário não autenticado");
        
        await db.cancelarVinculo(input.vinculoId, input.motivo);
        return { success: true };
      }),

    // ========================================
    // ESPECIALIDADES DO MÉDICO
    // ========================================

    // Atualizar especialidades do médico
    atualizarEspecialidades: protectedProcedure
      .input(z.object({
        especialidadePrincipal: z.string().nullable(),
        especialidadeSecundaria: z.string().nullable(),
        areaAtuacao: z.string().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.openId) throw new Error("Usuário não autenticado");
        
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile?.isMedico) {
          throw new Error("Apenas médicos podem atualizar especialidades");
        }

        await db.atualizarEspecialidadesMedico(
          ctx.user.openId,
          input.especialidadePrincipal,
          input.especialidadeSecundaria,
          input.areaAtuacao
        );
        return { success: true };
      }),

    // Obter especialidades do médico
    getEspecialidades: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.openId) return null;
      return await db.getEspecialidadesMedico(ctx.user.openId);
    }),

    // Listar médicos disponíveis para vínculo (para secretárias)
    listarMedicosDisponiveis: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      
      const profile = await db.getUserProfile(ctx.user.id);
      if (!profile?.isSecretaria) return [];

      // Buscar todos os usuários com perfil de médico
      const profiles = await db.listUserProfiles();
      return profiles
        .filter(p => p.isMedico)
        .map(p => ({
          userId: p.userId,
          nomeCompleto: p.nomeCompleto,
          email: p.email,
          crm: p.crm,
          especialidade: p.especialidade,
        }));
    }),
  }),

  // ============================================
  // CONFIGURAÇÕES DO USUÁRIO
  // ============================================
  configuracoes: router({
    // Obter configurações do usuário
    get: protectedProcedure
      .input(z.object({
        categoria: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.id) return [];
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile) return [];
        return await db.getUserSettings(profile.id, input?.categoria);
      }),

    // Salvar configuração
    set: protectedProcedure
      .input(z.object({
        categoria: z.string(),
        chave: z.string(),
        valor: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile) throw new Error("Perfil não encontrado");
        
        await db.upsertUserSetting({
          userProfileId: profile.id,
          categoria: input.categoria,
          chave: input.chave,
          valor: input.valor,
        });
        return { success: true };
      }),

    // Remover configuração
    delete: protectedProcedure
      .input(z.object({
        categoria: z.string(),
        chave: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile) throw new Error("Perfil não encontrado");
        
        await db.deleteUserSetting(profile.id, input.categoria, input.chave);
        return { success: true };
      }),
  }),

  // ===== DOCUMENTOS EXTERNOS =====
  documentosExternos: router({
    list: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        categoria: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.listDocumentosExternos(input.pacienteId, input.categoria);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        categoria: z.enum(["Evolução", "Internação", "Cirurgia", "Exame Laboratorial", "Exame de Imagem", "Endoscopia", "Cardiologia", "Patologia"]),
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        dataDocumento: z.string().optional(),
        arquivoOriginalUrl: z.string(),
        arquivoOriginalNome: z.string(),
        arquivoOriginalTipo: z.string().optional(),
        arquivoOriginalTamanho: z.number().optional(),
        arquivoPdfUrl: z.string().optional(),
        arquivoPdfNome: z.string().optional(),
        textoOcr: z.string().optional(),
        evolucaoId: z.number().optional(),
        internacaoId: z.number().optional(),
        cirurgiaId: z.number().optional(),
        exameLaboratorialId: z.number().optional(),
        exameImagemId: z.number().optional(),
        endoscopiaId: z.number().optional(),
        cardiologiaId: z.number().optional(),
        patologiaId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const username = ctx.user?.name || ctx.user?.email || "Sistema";
        return await db.createDocumentoExterno({
          ...input,
          dataDocumento: input.dataDocumento || null,
          uploadPor: username,
        } as any);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentoExterno(input.id);
      }),

    updateOcr: protectedProcedure
      .input(z.object({
        id: z.number(),
        textoOcr: z.string(),
        arquivoPdfUrl: z.string().optional(),
        arquivoPdfNome: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDocumentoExterno(input.id, {
          textoOcr: input.textoOcr,
          arquivoPdfUrl: input.arquivoPdfUrl,
          arquivoPdfNome: input.arquivoPdfNome,
        });
        return { success: true };
      }),
  }),

  // ===== PATOLOGIA =====
  patologia: router({
    list: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.listPatologias(input.pacienteId);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        dataColeta: z.string(),
        dataResultado: z.string().optional(),
        tipoExame: z.enum(["Anatomopatológico", "Citopatológico", "Imunohistoquímica", "Hibridização in situ", "Biópsia Líquida", "Outro"]),
        origemMaterial: z.string().optional(),
        tipoProcedimento: z.string().optional(),
        laboratorio: z.string().optional(),
        patologistaResponsavel: z.string().optional(),
        descricaoMacroscopica: z.string().optional(),
        descricaoMicroscopica: z.string().optional(),
        diagnostico: z.string().optional(),
        conclusao: z.string().optional(),
        estadiamentoTnm: z.string().optional(),
        grauHistologico: z.string().optional(),
        margemCirurgica: z.string().optional(),
        invasaoLinfovascular: z.boolean().optional(),
        invasaoPerineural: z.boolean().optional(),
        ki67: z.string().optional(),
        receptorEstrogeno: z.string().optional(),
        receptorProgesterona: z.string().optional(),
        her2: z.string().optional(),
        pdl1: z.string().optional(),
        outrosMarcadores: z.string().optional(),
        arquivoLaudoUrl: z.string().optional(),
        arquivoLaminasUrl: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPatologia(input as any);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPatologia(input.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        dataResultado: z.string().optional(),
        diagnostico: z.string().optional(),
        conclusao: z.string().optional(),
        arquivoLaudoUrl: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePatologia(id, data as any);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
