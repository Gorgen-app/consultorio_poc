import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, tenantProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import * as performance from "./performance";
import * as dashboardMetricas from "./dashboardMetricas";
import * as backup from "./backup";
import { authRouter } from "./auth-router";
import * as exportModule from "./export";

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
  
  // Router de autenticação local (login/registro com senha)
  localAuth: authRouter,
  
  // Alias para compatibilidade com frontend (trpc.auth.*)
  auth: authRouter,
  
  // Router de métricas de performance (apenas admin)
  performance: router({
    getOverview: protectedProcedure
      .query(async ({ ctx }) => {
        // Verificar se é admin
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        const stats = performance.getOverallStats();
        const system = performance.getSystemMetrics();
        const slowest = performance.getSlowestEndpoints(5);
        const history = performance.getResponseTimeHistory();
        
        return {
          stats,
          system,
          slowest,
          history,
        };
      }),
    
    getEndpoints: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return performance.getAggregatedMetrics();
      }),
    
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return performance.getResponseTimeHistory();
      }),
    
    // Alertas
    getAlerts: protectedProcedure
      .input(z.object({ includeAcknowledged: z.boolean().default(false) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        // Verificar e gerar novos alertas
        performance.checkAndGenerateAlerts();
        
        return performance.getAlerts(input?.includeAcknowledged ?? false);
      }),
    
    getAlertConfig: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return performance.getAlertConfig();
      }),
    
    setAlertConfig: protectedProcedure
      .input(z.object({
        responseTimeThreshold: z.number().min(100).max(30000).optional(),
        errorRateThreshold: z.number().min(1).max(100).optional(),
        enabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        performance.setAlertConfig(input);
        return performance.getAlertConfig();
      }),
    
    acknowledgeAlert: protectedProcedure
      .input(z.object({ alertId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return performance.acknowledgeAlert(input.alertId);
      }),
    
    acknowledgeAllAlerts: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return performance.acknowledgeAllAlerts();
      }),
    
    // Exportação
    exportCSV: protectedProcedure
      .input(z.object({ type: z.enum(['raw', 'aggregated']) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        if (input.type === 'raw') {
          return performance.exportMetricsToCSV();
        } else {
          return performance.exportAggregatedMetricsToCSV();
        }
      }),
  }),
  
  // Router de métricas do dashboard customizável
  dashboardMetricas: router({
    // Configuração do dashboard
    getConfig: tenantProcedure
      .query(async ({ ctx }) => {
        const config = await dashboardMetricas.getDashboardConfig(ctx.tenant.tenantId, ctx.user.id);
        return config;
      }),
    
    saveConfig: tenantProcedure
      .input(z.object({
        metricasSelecionadas: z.string(), // JSON string
        ordemMetricas: z.string().optional(), // JSON string
        periodoDefault: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']).optional(),
        layoutColunas: z.number().min(1).max(4).optional(),
        temaGraficos: z.enum(['padrao', 'escuro', 'colorido']).optional(),
        widgetSizes: z.string().optional(), // JSON string
        widgetPeriods: z.string().optional(), // JSON string
      }))
      .mutation(async ({ ctx, input }) => {
        return await dashboardMetricas.saveDashboardConfig(
          ctx.tenant.tenantId,
          ctx.user.id,
          input
        );
      }),
    
    // Métricas de População de Pacientes
    pacTotalAtivos: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesTotalAtivos(ctx.tenant.tenantId)),
    
    pacNovosPeriodo: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getPacientesNovosPeriodo(ctx.tenant.tenantId, input.periodo)),
    
    pacDistribuicaoSexo: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesDistribuicaoSexo(ctx.tenant.tenantId)),
    
    pacFaixaEtaria: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesFaixaEtaria(ctx.tenant.tenantId)),
    
    pacDistribuicaoCidade: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesDistribuicaoCidade(ctx.tenant.tenantId)),
    
    pacTaxaRetencao: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getPacientesTaxaRetencao(ctx.tenant.tenantId, input.periodo)),
    
    pacTempoAcompanhamento: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesTempoAcompanhamento(ctx.tenant.tenantId)),
    
    pacInativos: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesInativos(ctx.tenant.tenantId)),
    
    pacObitos: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getPacientesObitos(ctx.tenant.tenantId, input.periodo)),
    
    pacDistribuicaoConvenio: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPacientesDistribuicaoConvenio(ctx.tenant.tenantId)),
    
    // Métricas de Atendimentos
    atdTotalPeriodo: tenantProcedure
      .input(z.object({ 
        periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']),
        subcategoria: z.string().optional()
      }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosTotalPeriodo(ctx.tenant.tenantId, input.periodo, input.subcategoria)),
    
    atdEvolucaoTemporal: tenantProcedure
      .input(z.object({ 
        periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']),
        subcategoria: z.string().optional()
      }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosEvolucaoTemporal(ctx.tenant.tenantId, input.periodo, input.subcategoria)),
    
    atdPorTipo: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosPorTipo(ctx.tenant.tenantId, input.periodo)),
    
    atdPorLocal: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosPorLocal(ctx.tenant.tenantId, input.periodo)),
    
    atdPorConvenio: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosPorConvenio(ctx.tenant.tenantId, input.periodo)),
    
    atdMediaDiaria: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosMediaDiaria(ctx.tenant.tenantId, input.periodo)),
    
    atdDiaSemana: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosDiaSemana(ctx.tenant.tenantId, input.periodo)),
    
    atdNovosVsRetorno: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosNovosVsRetorno(ctx.tenant.tenantId, input.periodo)),
    
    atdProcedimentos: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getAtendimentosProcedimentos(ctx.tenant.tenantId, input.periodo)),
    
    // Métricas Financeiras
    finFaturamentoTotal: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getFaturamentoTotal(ctx.tenant.tenantId, input.periodo)),
    
    finEvolucaoFaturamento: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getFaturamentoEvolucao(ctx.tenant.tenantId, input.periodo)),
    
    finFaturamentoConvenio: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getFaturamentoPorConvenio(ctx.tenant.tenantId, input.periodo)),
    
    finTicketMedio: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getTicketMedio(ctx.tenant.tenantId, input.periodo)),
    
    finTaxaRecebimento: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getTaxaRecebimento(ctx.tenant.tenantId, input.periodo)),
    
    finGlosas: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getGlosas(ctx.tenant.tenantId, input.periodo)),
    
    finInadimplencia: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getInadimplencia(ctx.tenant.tenantId)),
    
    finFaturamentoPorTipo: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getFaturamentoPorTipo(ctx.tenant.tenantId, input.periodo)),
    
    finPrevisaoRecebimento: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getPrevisaoRecebimento(ctx.tenant.tenantId)),
    
    finComparativoMensal: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getComparativoMensal(ctx.tenant.tenantId)),
    
    // Métricas de Qualidade
    quaDiagnosticosFrequentes: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getDiagnosticosFrequentes(ctx.tenant.tenantId, input.periodo)),
    
    quaTaxaRetorno: tenantProcedure
      .input(z.object({ periodo: z.enum(['7d', '30d', '3m', '6m', '1a', '3a', '5a', 'todo']) }))
      .query(async ({ ctx, input }) => dashboardMetricas.getTaxaRetorno(ctx.tenant.tenantId, input.periodo)),
    
    // Métricas Diversas
    divProximosAtendimentos: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getProximosAtendimentos(ctx.tenant.tenantId)),
    
    divAniversariantes: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getAniversariantesMes(ctx.tenant.tenantId)),
    
    divAlertasPendentes: tenantProcedure
      .query(async ({ ctx }) => dashboardMetricas.getAlertasPendentes(ctx.tenant.tenantId)),
  }),
  
  // Router de notificações
  notificacoes: router({
    listar: tenantProcedure
      .query(async ({ ctx }) => {
        // Contar pacientes duplicados
        const duplicados = await db.contarPacientesDuplicados(ctx.tenant.tenantId);
        
        // Contar atendimentos sem evolução (placeholder - será implementado quando houver módulo de evolução)
        const pendenciasDocumentacao = 0;
        
        // Contar pagamentos pendentes (placeholder)
        const pagamentosPendentes = 0;
        
        return {
          duplicados,
          pendenciasDocumentacao,
          pagamentosPendentes,
          total: duplicados + pendenciasDocumentacao + pagamentosPendentes,
        };
      }),
  }),

  // auth: authRouter já definido acima como alias

  pacientes: router({
    getNextId: tenantProcedure
      .query(async ({ ctx }) => {
        return await db.getNextPacienteId(ctx.tenant.tenantId);
      }),

    checkCpfDuplicado: tenantProcedure
      .input(z.object({
        cpf: z.string(),
        excludeId: z.number().optional(), // Para excluir o próprio paciente na edição
      }))
      .query(async ({ input, ctx }) => {
        return await db.checkCpfDuplicado(ctx.tenant.tenantId, input.cpf, input.excludeId);
      }),

    create: tenantProcedure
      .input(pacienteSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await db.createPaciente(ctx.tenant.tenantId, input as any);
        
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
            tenantId: ctx.tenant.tenantId,
          }
        );
        
        return result;
      }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getPacienteById(ctx.tenant.tenantId, input.id);
      }),

    list: tenantProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          cpf: z.string().optional(),
          convenio: z.string().optional(),
          diagnostico: z.string().optional(),
          status: z.string().optional(),
          cidade: z.string().optional(),
          uf: z.string().optional(),
          busca: z.string().optional(), // Busca global (nome, CPF, ID)
          limit: z.number().optional(),
          offset: z.number().optional(),
          includeDeleted: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (input.includeDeleted) {
          return await db.listPacientesWithDeleted(ctx.tenant.tenantId, true);
        }
        return await db.listPacientes(ctx.tenant.tenantId, input);
      }),

    // Listar pacientes com paginação server-side (retorna pacientes + total)
    listPaginated: tenantProcedure
      .input(
        z.object({
          busca: z.string().optional(),
          convenio: z.string().optional(),
          diagnostico: z.string().optional(),
          status: z.string().optional(),
          cidade: z.string().optional(),
          uf: z.string().optional(),
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(20),
        })
      )
      .query(async ({ input, ctx }) => {
        const { page, pageSize, ...filters } = input;
        const offset = (page - 1) * pageSize;
        
        // Buscar total e pacientes em paralelo
        const [total, pacientes] = await Promise.all([
          db.countPacientes(ctx.tenant.tenantId, filters),
          db.listPacientes(ctx.tenant.tenantId, { ...filters, limit: pageSize, offset })
        ]);
        
        return {
          pacientes,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
      }),

    // Contar total de pacientes (para paginação server-side)
    count: tenantProcedure
      .input(
        z.object({
          busca: z.string().optional(),
          convenio: z.string().optional(),
          diagnostico: z.string().optional(),
          status: z.string().optional(),
          cidade: z.string().optional(),
          uf: z.string().optional(),
        }).optional()
      )
      .query(async ({ input, ctx }) => {
        return await db.countPacientes(ctx.tenant.tenantId, input);
      }),

    // Obter métricas de atendimento para pacientes
    getMetricasAtendimento: tenantProcedure
      .input(z.object({
        pacienteIds: z.array(z.number()),
      }))
      .query(async ({ input, ctx }) => {
        const metricas = await db.calcularMetricasAtendimento(ctx.tenant.tenantId, input.pacienteIds);
        // Converter Map para objeto para serialização
        const resultado: Record<number, { totalAtendimentos: number; atendimentos12m: number; diasSemAtendimento: number | null; ultimoAtendimento: string | null; primeiroAtendimento: string | null }> = {};
        metricas.forEach((value, key) => {
          resultado[key] = {
            totalAtendimentos: value.totalAtendimentos,
            atendimentos12m: value.atendimentos12m,
            diasSemAtendimento: value.diasSemAtendimento,
            ultimoAtendimento: value.ultimoAtendimento?.toISOString() || null,
            primeiroAtendimento: value.primeiroAtendimento?.toISOString() || null,
          };
        });
        return resultado;
      }),

    // Inativar pacientes sem atendimento há mais de 360 dias
    inativarSemAtendimento: tenantProcedure
      .mutation(async ({ ctx }) => {
        // Verificar se é admin
        const profile = await db.getUserProfile(ctx.user?.id || 0);
        if (!profile?.isAdminMaster) {
          throw new Error("Acesso negado: apenas administradores podem executar esta ação");
        }
        const count = await db.inativarPacientesSemAtendimento(ctx.tenant.tenantId);
        return { inativados: count };
      }),

    // Busca rápida de pacientes para autocomplete (otimizada)
    searchRapido: tenantProcedure
      .input(z.object({
        termo: z.string(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ input, ctx }) => {
        return await db.searchPacientesRapido(ctx.tenant.tenantId, input.termo, input.limit);
      }),

    // Buscar pacientes ativos com 360+ dias sem atendimento (para notificação)
    buscarPacientesInativos: tenantProcedure
      .query(async ({ ctx }) => {
        const pacientes = await db.buscarPacientesInativosPendentes(ctx.tenant.tenantId);
        return pacientes;
      }),

    // Notificar sobre pacientes inativos
    notificarPacientesInativos: tenantProcedure
      .mutation(async ({ ctx }) => {
        const { notifyOwner } = await import("./_core/notification");
        const pacientes = await db.buscarPacientesInativosPendentes(ctx.tenant.tenantId);
        
        if (pacientes.length === 0) {
          return { enviado: false, mensagem: "Nenhum paciente ativo com 360+ dias sem atendimento" };
        }

        // Limitar a lista para os 20 primeiros para não sobrecarregar a notificação
        const top20 = pacientes.slice(0, 20);
        const listaPacientes = top20.map(p => `- ${p.nome} (${p.diasSemAtendimento} dias)`).join("\n");
        
        const titulo = `⚠️ ${pacientes.length} pacientes ativos com 360+ dias sem atendimento`;
        const conteudo = `Os seguintes pacientes estão marcados como ATIVOS mas não têm atendimentos há mais de 360 dias:\n\n${listaPacientes}${pacientes.length > 20 ? `\n\n... e mais ${pacientes.length - 20} pacientes` : ""}\n\nRecomendação: Revise o status destes pacientes ou entre em contato para reativação.`;

        const enviado = await notifyOwner({ title: titulo, content: conteudo });
        return { enviado, total: pacientes.length };
      }),

    update: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          data: pacienteSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Buscar valores antigos para auditoria
        const oldPaciente = await db.getPacienteById(ctx.tenant.tenantId, input.id);
        
        const result = await db.updatePaciente(ctx.tenant.tenantId, input.id, input.data as any);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    delete: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Buscar paciente para auditoria
        const paciente = await db.getPacienteById(ctx.tenant.tenantId, input.id);
        
        // Soft delete
        const result = await db.softDeletePaciente(ctx.tenant.tenantId, input.id, ctx.user?.id || 0);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    restore: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.restorePaciente(ctx.tenant.tenantId, input.id);
        
        // Buscar paciente restaurado para auditoria
        const paciente = await db.getPacienteById(ctx.tenant.tenantId, input.id);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    // Exportar pacientes para Excel, CSV ou PDF
    export: tenantProcedure
      .input(
        z.object({
          format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
          busca: z.string().optional(),
          convenio: z.string().optional(),
          diagnostico: z.string().optional(),
          status: z.string().optional(),
          cidade: z.string().optional(),
          uf: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { format, ...filters } = input;
        const result = await exportModule.exportPacientes(ctx.tenant.tenantId, format, filters);
        const filename = exportModule.generateFilename('pacientes_gorgen', result.extension);
        
        // Registrar auditoria
        await db.createAuditLog(
          "EXPORT",
          "paciente",
          0,
          filename,
          null,
          { formato: format, filtros: filters, totalRegistros: 'exportado' },
          {
            userId: ctx.user?.id,
            userName: ctx.user?.name || undefined,
            userEmail: ctx.user?.email || undefined,
            tenantId: ctx.tenant.tenantId,
          }
        );
        
        // Retornar como base64 para download no frontend
        return {
          filename,
          data: result.buffer.toString('base64'),
          mimeType: result.mimeType,
        };
      }),

    // Merge de pacientes duplicados (apenas admin_master)
    mergeDuplicados: tenantProcedure
      .input(z.object({
        pacientePrincipalId: z.number(),
        pacientesParaExcluirIds: z.array(z.number()),
        camposParaCopiar: z.record(z.string(), z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin_master
        const perfil = await db.getUserProfile(ctx.user?.id || 0);
        if (perfil?.perfilAtivo !== 'admin_master') {
          throw new Error('Apenas administradores master podem unificar pacientes');
        }

        const result = await db.mergePacientesDuplicados(
          ctx.tenant.tenantId,
          input.pacientePrincipalId,
          input.pacientesParaExcluirIds,
          input.camposParaCopiar || {}
        );

        // Registrar auditoria
        await db.createAuditLog(
          "UPDATE",
          "paciente",
          input.pacientePrincipalId,
          result.idPacientePrincipal,
          { pacientesExcluidos: input.pacientesParaExcluirIds },
          { pacientePrincipal: input.pacientePrincipalId, camposCopiados: input.camposParaCopiar },
          {
            userId: ctx.user?.id,
            userName: ctx.user?.name || undefined,
            tenantId: ctx.tenant.tenantId,
          }
        );

        return result;
      }),
  }),

  atendimentos: router({
    getNextId: tenantProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataAtendimento: z.date(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.getNextAtendimentoId(ctx.tenant.tenantId, input.pacienteId, input.dataAtendimento);
      }),

    create: tenantProcedure
      .input(atendimentoSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await db.createAtendimento(ctx.tenant.tenantId, input as any);
        
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
            tenantId: ctx.tenant.tenantId,
          }
        );
        
        return result;
      }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getAtendimentoById(ctx.tenant.tenantId, input.id);
      }),

    list: tenantProcedure
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
      .query(async ({ input, ctx }) => {
        if (input.includeDeleted) {
          return await db.listAtendimentosWithDeleted(ctx.tenant.tenantId, true);
        }
        return await db.listAtendimentos(ctx.tenant.tenantId, input);
      }),

    update: tenantProcedure
      .input(
        z.object({
          id: z.number(),
          data: atendimentoSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Buscar valores antigos para auditoria
        const oldAtendimento = await db.getAtendimentoById(ctx.tenant.tenantId, input.id);
        
        const result = await db.updateAtendimento(ctx.tenant.tenantId, input.id, input.data as any);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    delete: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Buscar atendimento para auditoria
        const atendimento = await db.getAtendimentoById(ctx.tenant.tenantId, input.id);
        
        // Soft delete
        const result = await db.softDeleteAtendimento(ctx.tenant.tenantId, input.id, ctx.user?.id || 0);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    restore: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.restoreAtendimento(ctx.tenant.tenantId, input.id);
        
        // Buscar atendimento restaurado para auditoria
        const atendimento = await db.getAtendimentoById(ctx.tenant.tenantId, input.id);
        
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
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return result;
      }),

    count: tenantProcedure
      .input(
        z.object({
          pacienteId: z.number().optional(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.countAtendimentos(ctx.tenant.tenantId, input);
      }),

    // Exportar atendimentos para Excel, CSV ou PDF
    export: tenantProcedure
      .input(
        z.object({
          format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
          pacienteId: z.number().optional(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
          tipo: z.string().optional(),
          convenio: z.string().optional(),
          local: z.string().optional(),
          pagamentoEfetivado: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { format, ...filters } = input;
        const result = await exportModule.exportAtendimentos(ctx.tenant.tenantId, format, filters);
        const filename = exportModule.generateFilename('atendimentos_gorgen', result.extension);
        
        // Registrar auditoria
        await db.createAuditLog(
          "EXPORT",
          "atendimento",
          0,
          filename,
          null,
          { formato: format, filtros: filters, totalRegistros: 'exportado' },
          {
            userId: ctx.user?.id,
            userName: ctx.user?.name || undefined,
            userEmail: ctx.user?.email || undefined,
            tenantId: ctx.tenant.tenantId,
          }
        );
        
        // Retornar como base64 para download no frontend
        return {
          filename,
          data: result.buffer.toString('base64'),
          mimeType: result.mimeType,
        };
      }),
  }),

  dashboard: router({
    stats: tenantProcedure.query(async ({ ctx }) => {
      return await db.getDashboardStats(ctx.tenant.tenantId);
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
    completo: tenantProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getProntuarioCompleto(ctx.tenant.tenantId, input.pacienteId);
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
      registrar: tenantProcedure
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
          return await db.registrarMedida(ctx.tenant.tenantId, {
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
    getNextId: tenantProcedure
      .query(async ({ ctx }) => {
        return await db.getNextAgendamentoId(ctx.tenant.tenantId);
      }),

    create: tenantProcedure
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
        // Dados para criação automática de paciente
        novoPaciente: z.object({
          nome: z.string(),
          telefone: z.string().optional(),
          email: z.string().optional(),
          cpf: z.string().optional(),
          convenio: z.string().optional(),
        }).optional(),
        // Flag para forçar agendamento mesmo com conflito
        forcarConflito: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { dataHoraInicio, dataHoraFim, forcarConflito } = input;
        
        // VALIDAÇÃO 1: Hora de fim deve ser posterior à hora de início
        if (dataHoraFim <= dataHoraInicio) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A hora de término deve ser posterior à hora de início.",
          });
        }
        
        // VALIDAÇÃO 2: Não permitir agendamento no passado (Erro 4)
        const agora = new Date();
        // Permitir uma margem de 5 minutos para evitar problemas de sincronização
        const margemMinutos = 5;
        const limitePassado = new Date(agora.getTime() - margemMinutos * 60 * 1000);
        if (dataHoraInicio < limitePassado) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível criar agendamentos em datas/horários passados.",
          });
        }
        
        // VALIDAÇÃO 3: Duração mínima de 5 minutos (Erro 13)
        const duracaoMinutos = (dataHoraFim.getTime() - dataHoraInicio.getTime()) / (1000 * 60);
        const duracaoMinima = 5; // minutos
        if (duracaoMinutos < duracaoMinima) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `A duração mínima do agendamento é de ${duracaoMinima} minutos.`,
          });
        }
        
        // VALIDAÇÃO 4: Verificar conflitos de horário (se não forçado)
        if (!forcarConflito) {
          const conflitos = await db.verificarConflitosAgendamento(
            dataHoraInicio,
            dataHoraFim
          );
          
          if (conflitos && conflitos.length > 0) {
            const detalhes = conflitos.map((c: any) => {
              const hora = new Date(c.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              if (c.tipo === 'bloqueio') {
                return `[BLOQUEIO] ${c.titulo || c.tipoCompromisso} às ${hora}`;
              }
              return `${c.pacienteNome || c.tipoCompromisso} às ${hora}`;
            }).join(", ");
            
            throw new TRPCError({
              code: "CONFLICT",
              message: `Conflito de horário detectado com: ${detalhes}. Use a opção "forçar" para agendar mesmo assim.`,
            });
          }
        }
        
        let pacienteId = input.pacienteId;
        let pacienteNome = input.pacienteNome;
        
        // Se não tem pacienteId mas tem novoPaciente, criar automaticamente
        if (!pacienteId && input.novoPaciente && input.tipoCompromisso !== "Reunião") {
          // Gerar próximo ID de paciente
          const nextId = await db.getNextPacienteId(ctx.tenant.tenantId);
          
          // Criar paciente com dados mínimos
          const novoPaciente = await db.createPaciente(ctx.tenant.tenantId, {
            idPaciente: nextId,
            nome: input.novoPaciente.nome,
            telefone: input.novoPaciente.telefone || null,
            email: input.novoPaciente.email || null,
            cpf: input.novoPaciente.cpf || null,
            operadora1: input.novoPaciente.convenio || null,
            dataInclusao: new Date().toISOString().split('T')[0],
          } as any);
          
          pacienteId = novoPaciente.id;
          pacienteNome = input.novoPaciente.nome;
          
          // Registrar auditoria da criação automática
          await db.createAuditLog(
            "CREATE",
            "paciente",
            novoPaciente.id,
            nextId,
            null,
            { ...input.novoPaciente, origem: "agendamento_automatico" },
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return await db.createAgendamento({
          ...input,
          tenantId: ctx.tenant.tenantId,
          pacienteId,
          pacienteNome,
          criadoPor: ctx.user?.name || "Sistema",
        } as any);
      }),

    list: tenantProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        pacienteId: z.number().optional(),
        tipo: z.string().optional(),
        status: z.string().optional(),
        incluirCancelados: z.boolean().optional().default(true),
      }))
      .query(async ({ input, ctx }) => {
        return await db.listAgendamentos({ ...input, tenantId: ctx.tenant.tenantId });
      }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getAgendamentoById(input.id, ctx.tenant.tenantId);
      }),

    cancelar: tenantProcedure
      .input(z.object({
        id: z.number(),
        motivo: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.cancelarAgendamento(
          input.id,
          input.motivo,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
      }),

    reagendar: tenantProcedure
      .input(z.object({
        idOriginal: z.number(),
        novaDataInicio: z.date(),
        novaDataFim: z.date(),
        motivo: z.string().optional(),
        forcarConflito: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { novaDataInicio, novaDataFim, forcarConflito, idOriginal } = input;
        
        // VALIDAÇÃO 1: Hora de fim deve ser posterior à hora de início
        if (novaDataFim <= novaDataInicio) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A hora de término deve ser posterior à hora de início.",
          });
        }
        
        // VALIDAÇÃO 2: Verificar conflitos de horário (excluindo o agendamento original)
        if (!forcarConflito) {
          const conflitos = await db.verificarConflitosAgendamento(
            novaDataInicio,
            novaDataFim,
            idOriginal // Excluir o próprio agendamento da verificação
          );
          
          if (conflitos && conflitos.length > 0) {
            const detalhes = conflitos.map((c: any) => {
              const hora = new Date(c.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              if (c.tipo === 'bloqueio') {
                return `[BLOQUEIO] ${c.titulo || c.tipoCompromisso} às ${hora}`;
              }
              return `${c.pacienteNome || c.tipoCompromisso} às ${hora}`;
            }).join(", ");
            
            throw new TRPCError({
              code: "CONFLICT",
              message: `Conflito de horário detectado com: ${detalhes}. Use a opção "forçar" para reagendar mesmo assim.`,
            });
          }
        }
        
        return await db.reagendarAgendamento(
          input.idOriginal,
          input.novaDataInicio,
          input.novaDataFim,
          ctx.user?.name || "Sistema",
          input.motivo,
          ctx.tenant.tenantId
        );
      }),

    confirmar: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.confirmarAgendamento(
          input.id,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
      }),

    realizar: tenantProcedure
      .input(z.object({
        id: z.number(),
        atendimentoId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.realizarAgendamento(
          input.id,
          ctx.user?.name || "Sistema",
          input.atendimentoId,
          ctx.tenant.tenantId
        );
      }),

    marcarFalta: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.marcarFaltaAgendamento(
          input.id,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
      }),

    historico: tenantProcedure
      .input(z.object({ agendamentoId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getHistoricoAgendamento(input.agendamentoId, ctx.tenant.tenantId);
      }),

    // Importar eventos do Google Calendar (ICS)
    importarICS: tenantProcedure
      .input(z.object({
        eventos: z.array(z.object({
          uid: z.string(),
          summary: z.string().optional().nullable(),
          dataInicio: z.date(),
          dataFim: z.date().optional().nullable(),
          tipoAtendimento: z.enum(["Consulta", "Cirurgia", "Visita internado", "Procedimento em consultório", "Exame", "Reunião", "Bloqueio"]),
          convenio: z.string().optional().nullable(),
          nomePaciente: z.string().optional().nullable(),
          cpf: z.string().optional().nullable(),
          telefone: z.string().optional().nullable(),
          email: z.string().optional().nullable(),
          status: z.enum(["Agendado", "Confirmado", "Realizado", "Cancelado", "Reagendado", "Faltou"]),
          local: z.string().optional().nullable(),
          descricao: z.string().optional().nullable(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = { importados: 0, duplicados: 0, erros: 0, detalhes: [] as string[] };
        
        for (const evento of input.eventos) {
          try {
            // Verificar se já existe pelo UID
            const existente = await db.getAgendamentoByGoogleUid(evento.uid);
            if (existente) {
              results.duplicados++;
              continue;
            }
            
            // Gerar ID de agendamento
            const idAgendamento = await db.getNextAgendamentoId();
            
            // Criar agendamento
            await db.createAgendamentoImportado({
              idAgendamento,
              googleUid: evento.uid,
              tipoCompromisso: evento.tipoAtendimento,
              pacienteNome: evento.nomePaciente,
              dataHoraInicio: evento.dataInicio,
              dataHoraFim: evento.dataFim || new Date(evento.dataInicio.getTime() + 30 * 60000),
              local: evento.local,
              titulo: evento.summary?.substring(0, 255),
              descricao: evento.descricao?.substring(0, 5000),
              status: evento.status,
              convenio: evento.convenio,
              cpfPaciente: evento.cpf,
              telefonePaciente: evento.telefone,
              emailPaciente: evento.email,
              importadoDe: 'google_calendar',
              criadoPor: ctx.user?.name || 'Importação ICS',
            });
            
            results.importados++;
          } catch (error: any) {
            results.erros++;
            if (results.detalhes.length < 10) {
              results.detalhes.push(`Erro em ${evento.summary?.substring(0, 30)}: ${error.message}`);
            }
          }
        }
        
        return results;
      }),

    // Sincronizar com Google Calendar - Exportar evento para Google
    exportarParaGoogle: tenantProcedure
      .input(z.object({
        agendamentoId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const agendamento = await db.getAgendamentoById(input.agendamentoId, ctx.tenant.tenantId);
        if (!agendamento) {
          throw new Error('Agendamento não encontrado');
        }
        
        // Retornar dados formatados para o MCP criar o evento
        const dataInicio = new Date(agendamento.dataHoraInicio);
        const dataFim = agendamento.dataHoraFim 
          ? new Date(agendamento.dataHoraFim) 
          : new Date(dataInicio.getTime() + 30 * 60000);
        
        return {
          summary: agendamento.titulo || `${agendamento.tipoCompromisso} - ${agendamento.pacienteNome || 'Sem paciente'}`,
          description: agendamento.descricao || `ID: ${agendamento.idAgendamento}\nConvênio: ${agendamento.convenio || 'N/A'}`,
          start_time: dataInicio.toISOString(),
          end_time: dataFim.toISOString(),
          location: agendamento.local || 'Consultório',
          agendamentoId: agendamento.id,
          idAgendamento: agendamento.idAgendamento,
        };
      }),

    // Atualizar google_uid após criar evento no Google
    atualizarGoogleUid: tenantProcedure
      .input(z.object({
        agendamentoId: z.number(),
        googleUid: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.atualizarAgendamentoGoogleUid(input.agendamentoId, input.googleUid, ctx.tenant.tenantId);
      }),

    // Listar agendamentos não sincronizados com Google
    listNaoSincronizados: tenantProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.listAgendamentosNaoSincronizados({ ...input, tenantId: ctx.tenant.tenantId });
      }),

    // Vincular agendamento a paciente
    vincularPaciente: tenantProcedure
      .input(z.object({
        agendamentoId: z.number(),
        pacienteId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.vincularAgendamentoPaciente(
          input.agendamentoId,
          input.pacienteId,
          ctx.user?.name || 'Sistema',
          ctx.tenant.tenantId
        );
      }),

    // Listar agendamentos pendentes de vinculação
    listPendentesVinculacao: tenantProcedure
      .query(async ({ ctx }) => {
        return await db.listAgendamentosPendentesVinculacao(ctx.tenant.tenantId);
      }),

    // ===== AGENDA V6 - NOVAS ROTAS =====
    
    // Transferir agendamento para nova data (cria novo e marca original como Transferido)
    transferir: tenantProcedure
      .input(z.object({
        idOriginal: z.number(),
        novaDataInicio: z.date(),
        novaDataFim: z.date(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.transferirAgendamento(
          input.idOriginal,
          input.novaDataInicio,
          input.novaDataFim,
          ctx.user?.name || "Sistema",
          input.motivo,
          ctx.tenant.tenantId
        );
      }),

    // Atualizar status com validação de transições
    atualizarStatus: tenantProcedure
      .input(z.object({
        id: z.number(),
        novoStatus: z.enum(["Agendado", "Confirmado", "Aguardando", "Em atendimento", "Encerrado", "Cancelado", "Falta", "Transferido"]),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.atualizarStatusAgendamento(
          input.id,
          input.novoStatus,
          ctx.user?.name || "Sistema",
          input.motivo,
          ctx.tenant.tenantId
        );
      }),

    // Obter histórico completo de alterações do agendamento
    getHistorico: tenantProcedure
      .input(z.object({ agendamentoId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getHistoricoAgendamento(input.agendamentoId, ctx.tenant.tenantId);
      }),

    // Reativar agendamento cancelado
    reativar: tenantProcedure
      .input(z.object({
        id: z.number(),
        manterDataOriginal: z.boolean().default(true),
        novaDataInicio: z.date().optional(),
        novaDataFim: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.reativarAgendamento(
          input.id,
          ctx.user?.name || "Sistema",
          input.manterDataOriginal,
          input.novaDataInicio,
          input.novaDataFim,
          ctx.tenant.tenantId
        );
      }),

    // Marcar paciente como chegou (Aguardando)
    pacienteChegou: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.marcarPacienteChegou(
          input.id,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
      }),

    // Iniciar atendimento
    iniciarAtendimento: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.iniciarAtendimento(
          input.id,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
      }),

    // Encerrar atendimento
    encerrarAtendimento: tenantProcedure
      .input(z.object({ 
        id: z.number(),
        atendimentoId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.encerrarAtendimento(
          input.id,
          ctx.user?.name || "Sistema",
          input.atendimentoId,
          ctx.tenant.tenantId
        );
      }),

    // ===== AGENDA V8 - DRAG AND DROP =====
    
    // Mover agendamento via drag-and-drop (atualiza in-place sem criar novo registro)
    mover: tenantProcedure
      .input(z.object({
        id: z.number(),
        novaDataInicio: z.date(),
        novaDataFim: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.moverAgendamento(
          input.id,
          input.novaDataInicio,
          input.novaDataFim,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
        );
       }),

    // ===== ALIASES EM PORTUGUÊS =====
    
    // Alias para 'list' em português
    listar: tenantProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        pacienteId: z.number().optional(),
        tipo: z.string().optional(),
        status: z.string().optional(),
        incluirCancelados: z.boolean().optional().default(true),
      }).optional())
      .query(async ({ input, ctx }) => {
        return await db.listAgendamentos({ ...(input || {}), tenantId: ctx.tenant.tenantId });
      }),

    // Alias para 'create' em português
    criar: tenantProcedure
      .input(z.object({
        tipoCompromisso: z.enum(["Consulta", "Cirurgia", "Visita internado", "Procedimento em consultório", "Exame", "Reunião", "Bloqueio"]),
        titulo: z.string().optional().nullable(),
        dataHoraInicio: z.string(),
        dataHoraFim: z.string().optional().nullable(),
        local: z.string().optional().nullable(),
        status: z.string().optional().default("Agendado"),
        pacienteId: z.number().optional().nullable(),
        pacienteNome: z.string().optional().nullable(),
        descricao: z.string().optional().nullable(),
        convenio: z.string().optional().nullable(),
        // Dados para criação automática de paciente
        novoPaciente: z.object({
          nome: z.string(),
          telefone: z.string().optional(),
          email: z.string().optional(),
          cpf: z.string().optional(),
          convenio: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const idAgendamento = await db.getNextAgendamentoId(ctx.tenant.tenantId);
        
        let pacienteId = input.pacienteId;
        let pacienteNome = input.pacienteNome;
        
        // Se não tem pacienteId mas tem novoPaciente, criar automaticamente
        if (!pacienteId && input.novoPaciente && input.tipoCompromisso !== "Reunião") {
          // Gerar próximo ID de paciente
          const nextId = await db.getNextPacienteId(ctx.tenant.tenantId);
          
          // Criar paciente com dados mínimos
          const novoPaciente = await db.createPaciente(ctx.tenant.tenantId, {
            idPaciente: nextId,
            nome: input.novoPaciente.nome,
            telefone: input.novoPaciente.telefone || null,
            email: input.novoPaciente.email || null,
            cpf: input.novoPaciente.cpf || null,
            operadora1: input.novoPaciente.convenio || input.convenio || null,
            dataInclusao: new Date().toISOString().split('T')[0],
          } as any);
          
          pacienteId = novoPaciente.id;
          pacienteNome = input.novoPaciente.nome;
          
          // Registrar auditoria da criação automática
          await db.createAuditLog(
            "CREATE",
            "paciente",
            novoPaciente.id,
            nextId,
            null,
            { ...input.novoPaciente, origem: "agendamento_automatico" },
            {
              userId: ctx.user?.id,
              userName: ctx.user?.name || undefined,
              userEmail: ctx.user?.email || undefined,
              tenantId: ctx.tenant.tenantId,
            }
          );
        }
        
        return await db.createAgendamento({
          idAgendamento,
          tenantId: ctx.tenant.tenantId,
          tipoCompromisso: input.tipoCompromisso,
          titulo: input.titulo,
          dataHoraInicio: new Date(input.dataHoraInicio),
          dataHoraFim: input.dataHoraFim ? new Date(input.dataHoraFim) : new Date(new Date(input.dataHoraInicio).getTime() + 30 * 60000),
          local: input.local,
          status: input.status as any,
          pacienteId,
          pacienteNome,
          descricao: input.descricao,
          criadoPor: ctx.user?.name || "Sistema",
        } as any);
      }),
  }),

  // ===== BLOQUEIOS DE HORÁRIO =====
  bloqueios: router({
    getNextId: tenantProcedure
      .query(async ({ ctx }) => {
        return await db.getNextBloqueioId(ctx.tenant.tenantId);
      }),

    create: tenantProcedure
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
          tenantId: ctx.tenant.tenantId,
          criadoPor: ctx.user?.name || "Sistema",
        } as any);
      }),

    list: tenantProcedure
      .input(z.object({
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        incluirCancelados: z.boolean().optional().default(false),
      }))
      .query(async ({ input, ctx }) => {
        return await db.listBloqueios({ ...input, tenantId: ctx.tenant.tenantId });
      }),

    cancelar: tenantProcedure
      .input(z.object({
        id: z.number(),
        motivo: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.cancelarBloqueio(
          input.id,
          input.motivo,
          ctx.user?.name || "Sistema",
          ctx.tenant.tenantId
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
        
        // Converter boolean para number (TINYINT) para compatibilidade com MySQL
        // Remover campos que não existem no schema (isFinanceiro, isVisualizador)
        const { isFinanceiro, isVisualizador, ...validInput } = input;
        const profileInput = {
          ...validInput,
          isAdminMaster: validInput.isAdminMaster !== undefined ? (validInput.isAdminMaster ? 1 : 0) : undefined,
          isMedico: validInput.isMedico !== undefined ? (validInput.isMedico ? 1 : 0) : undefined,
          isSecretaria: validInput.isSecretaria !== undefined ? (validInput.isSecretaria ? 1 : 0) : undefined,
        };
        
        const existing = await db.getUserProfile(input.userId);
        if (existing) {
          return await db.updateUserProfile(input.userId, profileInput);
        } else {
          const { userId, ...profileData } = profileInput;
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
    criarVinculo: tenantProcedure
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

        return await db.criarVinculo(ctx.tenant.tenantId, ctx.user.openId, input.medicoUserId);
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
    set: tenantProcedure
      .input(z.object({
        categoria: z.string(),
        chave: z.string(),
        valor: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile) throw new Error("Perfil não encontrado");
        
        await db.upsertUserSetting(ctx.tenant.tenantId, {
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
        
        // Criar o documento com status de OCR pendente
        const documento = await db.createDocumentoExterno({
          ...input,
          dataDocumento: input.dataDocumento || null,
          uploadPor: username,
          textoOcr: "[OCR em processamento...] Aguarde alguns segundos.",
        } as any);

        // Disparar extração de OCR em background (não bloqueia a resposta)
        const tipoArquivo = input.arquivoOriginalTipo || "";
        const isImage = tipoArquivo.startsWith("image/");
        const isPdf = tipoArquivo === "application/pdf";

        if (isImage || isPdf) {
          // Processar OCR em background usando setImmediate para não bloquear
          setImmediate(async () => {
            try {
              let messageContent: any[];

              if (isImage) {
                messageContent = [
                  {
                    type: "text",
                    text: "Extraia TODO o texto visível nesta imagem de documento médico. Transcreva exatamente como está escrito, mantendo a formatação original (parágrafos, listas, tabelas). Se houver valores de exames, mantenha os números e unidades. Não adicione interpretações, apenas transcreva o texto."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: input.arquivoOriginalUrl,
                      detail: "high"
                    }
                  }
                ];
              } else {
                messageContent = [
                  {
                    type: "text",
                    text: "Extraia TODO o texto deste documento PDF médico. Transcreva exatamente como está escrito, mantendo a formatação original (parágrafos, listas, tabelas). Se houver valores de exames, mantenha os números e unidades. Não adicione interpretações, apenas transcreva o texto."
                  },
                  {
                    type: "file_url",
                    file_url: {
                      url: input.arquivoOriginalUrl,
                      mime_type: "application/pdf"
                    }
                  }
                ];
              }

              const response = await invokeLLM({
                messages: [
                  {
                    role: "system",
                    content: "Você é um assistente especializado em transcrição de documentos médicos. Sua tarefa é extrair e transcrever fielmente todo o texto visível em documentos, mantendo a formatação original. Não interprete, não resuma, apenas transcreva."
                  },
                  {
                    role: "user",
                    content: messageContent
                  }
                ]
              });

              const textoExtraido = response.choices[0]?.message?.content;
              
              if (textoExtraido && typeof textoExtraido === "string") {
                const textoOcr = `[OCR Extraído em ${new Date().toLocaleString("pt-BR")}]\n\n${textoExtraido}`;
                await db.updateDocumentoExterno(documento.id, { textoOcr });
                
                // Se for exame laboratorial, extrair dados estruturados automaticamente
                if (input.categoria === "Exame Laboratorial") {
                  try {
                    console.log(`[LAB-EXTRACT] Iniciando extração automática de dados laboratoriais para documento ${documento.id}, tipo: ${tipoArquivo}`);
                    
                    const labResponse = await invokeLLM({
                      messages: [
                        {
                          role: "system",
                          content: `Você é um especialista em extração de dados de exames laboratoriais.
Analise o documento e extraia TODOS os resultados de exames laboratoriais.
Para cada exame, extraia:
- nome_exame: nome do exame como aparece no laudo
- resultado: valor do resultado (pode ser texto como ">90" ou "Não reagente")
- resultado_numerico: valor numérico quando aplicável (apenas números)
- unidade: unidade de medida
- valor_referencia_texto: faixa de referência como aparece no laudo
- valor_referencia_min: valor mínimo da referência (apenas números)
- valor_referencia_max: valor máximo da referência (apenas números)
- data_coleta: data da coleta no formato YYYY-MM-DD
- laboratorio: nome do laboratório

PRIORIZE a extração do "LAUDO EVOLUTIVO" ou "FLUXOGRAMA" se existir, pois contém histórico consolidado.

Retorne um JSON válido com a estrutura:
{
  "exames": [
    {
      "nome_exame": "string",
      "resultado": "string",
      "resultado_numerico": number | null,
      "unidade": "string",
      "valor_referencia_texto": "string",
      "valor_referencia_min": number | null,
      "valor_referencia_max": number | null,
      "data_coleta": "YYYY-MM-DD",
      "laboratorio": "string"
    }
  ],
  "laboratorio_principal": "string",
  "data_principal": "YYYY-MM-DD"
}`
                        },
                        {
                          role: "user",
                          content: [
                            {
                              type: "file_url" as const,
                              file_url: {
                                url: input.arquivoOriginalUrl,
                                mime_type: "application/pdf" as const
                              }
                            },
                            {
                              type: "text" as const,
                              text: "Extraia todos os resultados de exames laboratoriais deste documento. Retorne apenas o JSON, sem texto adicional."
                            }
                          ]
                        }
                      ],
                      response_format: {
                        type: "json_schema",
                        json_schema: {
                          name: "exames_laboratoriais",
                          strict: true,
                          schema: {
                            type: "object",
                            properties: {
                              exames: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    nome_exame: { type: "string" },
                                    resultado: { type: "string" },
                                    resultado_numerico: { type: ["number", "null"] },
                                    unidade: { type: ["string", "null"] },
                                    valor_referencia_texto: { type: ["string", "null"] },
                                    valor_referencia_min: { type: ["number", "null"] },
                                    valor_referencia_max: { type: ["number", "null"] },
                                    data_coleta: { type: "string" },
                                    laboratorio: { type: ["string", "null"] }
                                  },
                                  required: ["nome_exame", "resultado", "data_coleta"],
                                  additionalProperties: false
                                }
                              },
                              laboratorio_principal: { type: ["string", "null"] },
                              data_principal: { type: ["string", "null"] }
                            },
                            required: ["exames"],
                            additionalProperties: false
                          }
                        }
                      }
                    });

                    console.log(`[LAB-EXTRACT] Resposta LLM recebida para documento ${documento.id}`);
                    const labContent = labResponse.choices[0]?.message?.content;
                    console.log(`[LAB-EXTRACT] Conteúdo: ${labContent && typeof labContent === 'string' ? labContent.substring(0, 200) + '...' : 'NULL'}`);
                    if (labContent && typeof labContent === "string") {
                      const dados = JSON.parse(labContent);
                      console.log(`[LAB-EXTRACT] Exames encontrados: ${dados.exames?.length || 0}`);
                      if (dados.exames && Array.isArray(dados.exames) && dados.exames.length > 0) {
                        const resultados = dados.exames.map((exame: any) => ({
                          pacienteId: input.pacienteId,
                          documentoExternoId: documento.id,
                          nomeExameOriginal: exame.nome_exame || "Exame sem nome",
                          dataColeta: exame.data_coleta || new Date().toISOString().split('T')[0],
                          resultado: exame.resultado || "N/A",
                          resultadoNumerico: exame.resultado_numerico != null ? String(exame.resultado_numerico) : null,
                          unidade: exame.unidade || null,
                          valorReferenciaTexto: exame.valor_referencia_texto || null,
                          valorReferenciaMin: exame.valor_referencia_min != null ? String(exame.valor_referencia_min) : null,
                          valorReferenciaMax: exame.valor_referencia_max != null ? String(exame.valor_referencia_max) : null,
                          laboratorio: exame.laboratorio || dados.laboratorio_principal || null,
                          extraidoPorIa: true,
                        }));
                        
                        const count = await db.createManyResultadosLaboratoriais(resultados);
                        console.log(`[LAB-EXTRACT] Extração automática concluída: ${count} resultados inseridos para documento ${documento.id}`);
                      }
                    }
                  } catch (labError: any) {
                    console.error(`[LAB-EXTRACT] ERRO na extração automática de dados laboratoriais para documento ${documento.id}:`, labError.message, labError.stack);
                    // Não falha o upload, apenas loga o erro
                  }
                }
              } else {
                await db.updateDocumentoExterno(documento.id, {
                  textoOcr: `[Erro no OCR] Não foi possível extrair texto do documento.`
                });
              }
            } catch (error: any) {
              console.error("Erro no OCR em background:", error);
              await db.updateDocumentoExterno(documento.id, {
                textoOcr: `[Erro no OCR em ${new Date().toLocaleString("pt-BR")}]\n\nNão foi possível extrair o texto: ${error.message || "Erro desconhecido"}\n\nClique em "Reprocessar OCR" para tentar novamente.`
              });
            }
          });
        }

        return documento;
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

    extractOcr: protectedProcedure
      .input(z.object({ documentoId: z.number() }))
      .mutation(async ({ input }) => {
        // Buscar o documento
        const documento = await db.getDocumentoExterno(input.documentoId);
        if (!documento) {
          throw new Error("Documento não encontrado");
        }

        if (!documento.arquivoOriginalUrl) {
          throw new Error("Documento não possui arquivo anexado");
        }

        // Marcar como processando
        await db.updateDocumentoExterno(input.documentoId, {
          textoOcr: `[Processando OCR...] Iniciado em ${new Date().toLocaleString("pt-BR")}`,
        });

        try {
          // Determinar o tipo de conteúdo para o LLM
          const tipoArquivo = documento.arquivoOriginalTipo || "";
          const isImage = tipoArquivo.startsWith("image/");
          const isPdf = tipoArquivo === "application/pdf";

          let messageContent: any[];

          if (isImage) {
            // Para imagens, usar image_url
            messageContent = [
              {
                type: "text",
                text: "Extraia TODO o texto visível nesta imagem de documento médico. Transcreva exatamente como está escrito, mantendo a formatação original (parágrafos, listas, tabelas). Se houver valores de exames, mantenha os números e unidades. Não adicione interpretações, apenas transcreva o texto."
              },
              {
                type: "image_url",
                image_url: {
                  url: documento.arquivoOriginalUrl,
                  detail: "high"
                }
              }
            ];
          } else if (isPdf) {
            // Para PDFs, usar file_url
            messageContent = [
              {
                type: "text",
                text: "Extraia TODO o texto deste documento PDF médico. Transcreva exatamente como está escrito, mantendo a formatação original (parágrafos, listas, tabelas). Se houver valores de exames, mantenha os números e unidades. Não adicione interpretações, apenas transcreva o texto."
              },
              {
                type: "file_url",
                file_url: {
                  url: documento.arquivoOriginalUrl,
                  mime_type: "application/pdf"
                }
              }
            ];
          } else {
            throw new Error(`Tipo de arquivo não suportado para OCR: ${tipoArquivo}`);
          }

          // Chamar o LLM para extrair o texto
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Você é um assistente especializado em transcrição de documentos médicos. Sua tarefa é extrair e transcrever fielmente todo o texto visível em documentos, mantendo a formatação original. Não interprete, não resuma, apenas transcreva."
              },
              {
                role: "user",
                content: messageContent
              }
            ]
          });

          // Extrair o texto da resposta
          const textoExtraido = response.choices[0]?.message?.content;
          
          if (!textoExtraido || typeof textoExtraido !== "string") {
            throw new Error("Não foi possível extrair texto do documento");
          }

          // Salvar o texto extraído
          const textoOcr = `[OCR Extraído em ${new Date().toLocaleString("pt-BR")}]\n\n${textoExtraido}`;

          await db.updateDocumentoExterno(input.documentoId, {
            textoOcr,
          });

          return { success: true, textoOcr };
        } catch (error: any) {
          // Em caso de erro, salvar mensagem de erro
          const textoErro = `[Erro no OCR em ${new Date().toLocaleString("pt-BR")}]\n\nNão foi possível extrair o texto: ${error.message || "Erro desconhecido"}\n\nTente novamente mais tarde.`;
          
          await db.updateDocumentoExterno(input.documentoId, {
            textoOcr: textoErro,
          });

          throw new Error(`Falha na extração de OCR: ${error.message}`);
        }
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

  // ===== RESULTADOS LABORATORIAIS ESTRUTURADOS =====
  resultadosLaboratoriais: router({
    list: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.listResultadosLaboratoriais(input.pacienteId);
      }),

    listPorExame: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        nomeExame: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.listResultadosPorExame(input.pacienteId, input.nomeExame);
      }),

    fluxograma: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFluxogramaLaboratorial(input.pacienteId);
      }),

    extrairDePdf: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        documentoExternoId: z.number(),
        pdfUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[LAB-EXTRACT] Iniciando extração de dados laboratoriais para documento ${input.documentoExternoId}`);
        
        // Buscar o documento para obter o texto OCR já extraído
        const documento = await db.getDocumentoExterno(input.documentoExternoId);
        if (!documento) {
          throw new Error("Documento não encontrado");
        }
        
        // Verificar se tem texto OCR
        const textoOcr = documento.textoOcr;
        if (!textoOcr || textoOcr.includes("[OCR em processamento")||textoOcr.includes("[Erro no OCR")) {
          throw new Error("Texto OCR ainda não foi extraído. Aguarde o processamento ou clique em Reprocessar OCR.");
        }
        
        console.log(`[LAB-EXTRACT] Usando texto OCR já extraído (${textoOcr.length} caracteres)`);
        
        // Usar LLM para extrair dados estruturados do texto OCR
        let response;
        try {
          response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em extração de dados de exames laboratoriais.
Analise o texto de um laudo de exames e extraia TODOS os resultados de exames laboratoriais.
Para cada exame, extraia:
- nome_exame: nome do exame como aparece no laudo
- resultado: valor do resultado (pode ser texto como ">90" ou "Não reagente")
- resultado_numerico: valor numérico quando aplicável (apenas números)
- unidade: unidade de medida
- valor_referencia_texto: faixa de referência como aparece no laudo
- valor_referencia_min: valor mínimo da referência (apenas números)
- valor_referencia_max: valor máximo da referência (apenas números)
- data_coleta: data da coleta no formato YYYY-MM-DD
- laboratorio: nome do laboratório

PRIORIZE a extração do "LAUDO EVOLUTIVO" ou "FLUXOGRAMA" se existir, pois contém histórico consolidado.

Retorne um JSON válido com a estrutura:
{
  "exames": [
    {
      "nome_exame": "string",
      "resultado": "string",
      "resultado_numerico": number | null,
      "unidade": "string",
      "valor_referencia_texto": "string",
      "valor_referencia_min": number | null,
      "valor_referencia_max": number | null,
      "data_coleta": "YYYY-MM-DD",
      "laboratorio": "string"
    }
  ],
  "laboratorio_principal": "string",
  "data_principal": "YYYY-MM-DD"
}`
            },
            {
              role: "user",
              content: `Extraia todos os resultados de exames laboratoriais do seguinte texto de laudo. Retorne apenas o JSON, sem texto adicional.\n\nTEXTO DO LAUDO:\n${textoOcr}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "exames_laboratoriais",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  exames: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome_exame: { type: "string" },
                        resultado: { type: "string" },
                        resultado_numerico: { type: ["number", "null"] },
                        unidade: { type: ["string", "null"] },
                        valor_referencia_texto: { type: ["string", "null"] },
                        valor_referencia_min: { type: ["number", "null"] },
                        valor_referencia_max: { type: ["number", "null"] },
                        data_coleta: { type: "string" },
                        laboratorio: { type: ["string", "null"] }
                      },
                      required: ["nome_exame", "resultado", "data_coleta"],
                      additionalProperties: false
                    }
                  },
                  laboratorio_principal: { type: ["string", "null"] },
                  data_principal: { type: ["string", "null"] }
                },
                required: ["exames"],
                additionalProperties: false
              }
            }
          }
        });
        } catch (llmError: any) {
          console.error("Erro ao chamar LLM:", llmError.message);
          throw new Error(`Erro ao processar documento: ${llmError.message}`);
        }

        console.log("Resposta LLM recebida:", response ? "OK" : "NULL", "choices:", response?.choices?.length || 0);

        // Verificar se a resposta existe
        if (!response || !response.choices || response.choices.length === 0) {
          console.error("Resposta LLM vazia ou inválida:", JSON.stringify(response).substring(0, 500));
          throw new Error("Não foi possível obter resposta do LLM - resposta vazia");
        }

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          console.error("Conteúdo da resposta inválido:", content);
          throw new Error("Não foi possível extrair dados do PDF");
        }

        console.log("Resposta LLM recebida, tamanho:", content.length);

        let dados;
        try {
          dados = JSON.parse(content);
        } catch (parseError) {
          console.error("Erro ao parsear JSON:", parseError, "Conteúdo:", content.substring(0, 500));
          throw new Error("Resposta inválida do LLM - não é um JSON válido");
        }

        if (!dados.exames || !Array.isArray(dados.exames)) {
          console.error("Estrutura de dados inválida:", JSON.stringify(dados));
          throw new Error("Nenhum exame encontrado no documento");
        }

        console.log(`Encontrados ${dados.exames.length} exames para processar`);

        // Inserir resultados no banco
        const resultados = dados.exames.map((exame: any) => ({
          pacienteId: input.pacienteId,
          documentoExternoId: input.documentoExternoId,
          nomeExameOriginal: exame.nome_exame || "Exame sem nome",
          dataColeta: exame.data_coleta || new Date().toISOString().split('T')[0],
          resultado: exame.resultado || "N/A",
          resultadoNumerico: exame.resultado_numerico != null ? String(exame.resultado_numerico) : null,
          unidade: exame.unidade || null,
          valorReferenciaTexto: exame.valor_referencia_texto || null,
          valorReferenciaMin: exame.valor_referencia_min != null ? String(exame.valor_referencia_min) : null,
          valorReferenciaMax: exame.valor_referencia_max != null ? String(exame.valor_referencia_max) : null,
          laboratorio: exame.laboratorio || dados.laboratorio_principal || null,
          extraidoPorIa: true,
        }));

        if (resultados.length === 0) {
          throw new Error("Nenhum resultado válido para inserir");
        }

        const count = await db.createManyResultadosLaboratoriais(resultados);

        return {
          success: true,
          count,
          laboratorio: dados.laboratorio_principal,
          dataPrincipal: dados.data_principal,
        };
      }),

    deletePorDocumento: protectedProcedure
      .input(z.object({ documentoExternoId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteResultadosLaboratoriaisPorDocumento(input.documentoExternoId);
        return { success: true };
      }),
  }),

  examesPadronizados: router({
    list: protectedProcedure
      .query(async () => {
        return await db.listExamesPadronizados();
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        categoria: z.enum(["Hemograma", "Bioquímica", "Função Renal", "Função Hepática", "Perfil Lipídico", "Coagulação", "Hormônios", "Marcadores Tumorais", "Eletrólitos", "Urinálise", "Sorologias", "Metabolismo do Ferro", "Vitaminas", "Outros"]),
        unidadePadrao: z.string().optional(),
        sinonimos: z.string().optional(),
        descricao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExamePadronizado(input as any);
      }),
  }),

  // ===== EXAMES FAVORITOS =====
  examesFavoritos: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.listExamesFavoritos(ctx.user.openId);
      }),

    add: tenantProcedure
      .input(z.object({
        nomeExame: z.string(),
        categoria: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addExameFavorito(ctx.tenant.tenantId, ctx.user.openId, input.nomeExame, input.categoria);
      }),

    remove: protectedProcedure
      .input(z.object({ nomeExame: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeExameFavorito(ctx.user.openId, input.nomeExame);
        return { success: true };
      }),

    updateOrdem: protectedProcedure
      .input(z.object({
        exames: z.array(z.object({
          nomeExame: z.string(),
          ordem: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateOrdemExamesFavoritos(ctx.user.openId, input.exames);
        return { success: true };
      }),

    // Extrair apenas os exames favoritos de um documento
    extrairDoDocumento: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        documentoExternoId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log(`[EXAMES-FAV] Iniciando extração de exames favoritos para documento ${input.documentoExternoId}`);
        
        // Buscar exames favoritos do usuário
        const favoritos = await db.listExamesFavoritos(ctx.user.openId);
        if (favoritos.length === 0) {
          throw new Error("Nenhum exame favorito configurado. Vá em Configurações > Exames Favoritos para selecionar os exames que deseja acompanhar.");
        }
        
        const nomesFavoritos = favoritos.map(f => f.nomeExame);
        console.log(`[EXAMES-FAV] Exames favoritos: ${nomesFavoritos.join(", ")}`);
        
        // Buscar o documento para obter o texto OCR
        const documento = await db.getDocumentoExterno(input.documentoExternoId);
        if (!documento) {
          throw new Error("Documento não encontrado");
        }
        
        const textoOcr = documento.textoOcr;
        if (!textoOcr || textoOcr.includes("[OCR em processamento") || textoOcr.includes("[Erro no OCR")) {
          throw new Error("Texto OCR ainda não foi extraído. Aguarde o processamento.");
        }
        
        console.log(`[EXAMES-FAV] Texto OCR: ${textoOcr.length} caracteres`);
        
        // Usar LLM para extrair apenas os exames favoritos
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em extração de dados de exames laboratoriais.
Você deve extrair APENAS os seguintes exames do texto: ${nomesFavoritos.join(", ")}.

Para cada exame encontrado, extraia:
- nome_exame: nome exato como listado acima
- resultado: valor do resultado
- resultado_numerico: valor numérico (apenas números)
- unidade: unidade de medida
- valor_referencia_texto: faixa de referência
- valor_referencia_min: valor mínimo (apenas números)
- valor_referencia_max: valor máximo (apenas números)
- data_coleta: data no formato YYYY-MM-DD

Retorne um JSON válido com a estrutura:
{
  "exames": [...],
  "laboratorio": "nome do laboratório",
  "data_principal": "YYYY-MM-DD"
}`
            },
            {
              role: "user",
              content: `Extraia os resultados dos exames: ${nomesFavoritos.join(", ")}\n\nTEXTO DO LAUDO:\n${textoOcr.substring(0, 15000)}`
            }
          ]
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error("Não foi possível extrair dados do documento");
        }
        
        console.log(`[EXAMES-FAV] Resposta LLM: ${content.substring(0, 200)}...`);
        
        // Limpar o conteúdo (remover markdown se presente)
        let jsonContent = content;
        if (content.includes("```json")) {
          jsonContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        } else if (content.includes("```")) {
          jsonContent = content.replace(/```\n?/g, "").trim();
        }
        
        const dados = JSON.parse(jsonContent);
        
        if (!dados.exames || !Array.isArray(dados.exames) || dados.exames.length === 0) {
          throw new Error("Nenhum dos exames favoritos foi encontrado no documento");
        }
        
        console.log(`[EXAMES-FAV] Encontrados ${dados.exames.length} exames`);
        console.log(`[EXAMES-FAV] Dados brutos do LLM:`, JSON.stringify(dados, null, 2));
        
        // Inserir resultados
        const resultados = dados.exames.map((exame: any) => {
          const resultado = {
            pacienteId: input.pacienteId,
            documentoExternoId: input.documentoExternoId,
            nomeExameOriginal: String(exame.nome_exame || "Exame sem nome"),
            resultado: String(exame.resultado || "N/A"),
            resultadoNumerico: exame.resultado_numerico != null ? String(exame.resultado_numerico) : null,
            unidade: exame.unidade ? String(exame.unidade) : null,
            valorReferenciaTexto: exame.valor_referencia_texto ? String(exame.valor_referencia_texto) : null,
            valorReferenciaMin: exame.valor_referencia_min != null ? String(exame.valor_referencia_min) : null,
            valorReferenciaMax: exame.valor_referencia_max != null ? String(exame.valor_referencia_max) : null,
            dataColeta: String(exame.data_coleta || dados.data_principal || new Date().toISOString().split("T")[0]),
            laboratorio: exame.laboratorio ? String(exame.laboratorio) : (dados.laboratorio ? String(dados.laboratorio) : null),
            extraidoPorIa: true,
          };
          console.log(`[EXAMES-FAV] Resultado mapeado:`, JSON.stringify(resultado, null, 2));
          return resultado;
        });
        
        console.log(`[EXAMES-FAV] Total de resultados a inserir: ${resultados.length}`);
        const count = await db.createManyResultadosLaboratoriais(resultados);
        console.log(`[EXAMES-FAV] Inseridos ${count} resultados`);
        
        return {
          success: true,
          count,
          examesEncontrados: dados.exames.map((e: any) => e.nome_exame),
        };
      }),
  }),

  // Router de Tenants (Multi-tenant)
  tenants: router({
    list: protectedProcedure.query(async () => {
      return await db.listTenants();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTenantById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        slug: z.string().min(1),
        cnpj: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        plano: z.enum(["free", "basic", "professional", "enterprise"]).optional(),
        maxUsuarios: z.number().optional(),
        maxPacientes: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se slug já existe
        const existing = await db.getTenantBySlug(input.slug);
        if (existing) {
          throw new Error("Slug já existe");
        }
        await db.createTenant(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        slug: z.string().optional(),
        cnpj: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        plano: z.enum(["free", "basic", "professional", "enterprise"]).optional(),
        status: z.enum(["ativo", "inativo", "suspenso"]).optional(),
        maxUsuarios: z.number().optional(),
        maxPacientes: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTenant(id, data);
        return { success: true };
      }),

    toggleStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["ativo", "inativo", "suspenso"]),
      }))
      .mutation(async ({ input }) => {
        await db.toggleTenantStatus(input.id, input.status);
        return { success: true };
      }),
    // Funções de seleção de tenant para usuários
    getUserTenants: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return [];
        return await db.getUserTenants(ctx.user.id);
      }),
    getActiveTenant: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return null;
        return await db.getUserActiveTenant(ctx.user.id);
      }),
    setActiveTenant: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) return { success: false, error: 'Usuário não autenticado' };
        const success = await db.setUserActiveTenant(ctx.user.id, input.tenantId);
        return { success, error: success ? null : 'Acesso negado a este tenant' };
      }),
  }),

  // Procedures de administração de tenants (apenas admin)
  admin: router({
    listTenants: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return await db.listAllTenants();
      }),
    
    getTenantStats: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return await db.getTenantStats(input.tenantId);
      }),
    
    listTenantUsers: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return await db.listTenantUsers(input.tenantId);
      }),
    
    createTenant: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        slug: z.string().min(1),
        plano: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return await db.createTenant(input);
      }),
    
    updateTenantStatus: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        status: z.enum(['ativo', 'inativo', 'suspenso']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        await db.toggleTenantStatus(input.tenantId, input.status);
        return { success: true };
      }),
   }),

  // ============================================
  // CROSS-TENANT SHARING
  // ============================================
  crossTenant: router({
    // Solicitar autorização de acesso cross-tenant
    solicitarAutorizacao: tenantProcedure
      .input(z.object({
        tenantOrigemId: z.number(),
        pacienteId: z.number(),
        tipoAutorizacao: z.enum(['leitura', 'escrita', 'completo']).default('leitura'),
        escopoAutorizacao: z.enum(['prontuario', 'atendimentos', 'exames', 'documentos', 'completo']).default('completo'),
        motivo: z.string().min(10),
        dataFim: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCrossTenantAutorizacao({
          tenantOrigemId: input.tenantOrigemId,
          tenantDestinoId: ctx.tenant.tenantId,
          pacienteId: input.pacienteId,
          criadoPorUserId: ctx.user!.id,
          tipoAutorizacao: input.tipoAutorizacao,
          escopoAutorizacao: input.escopoAutorizacao,
          motivo: input.motivo,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        });
      }),

    // Listar autorizações concedidas pelo meu tenant
    listAutorizacoesConcedidas: tenantProcedure
      .input(z.object({
        status: z.enum(['pendente', 'ativa', 'revogada', 'expirada', 'rejeitada']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.listAutorizacoesConcedidas(
          ctx.tenant.tenantId,
          input?.status,
          input?.limit,
          input?.offset
        );
      }),

    // Listar autorizações recebidas pelo meu tenant
    listAutorizacoesRecebidas: tenantProcedure
      .input(z.object({
        status: z.enum(['pendente', 'ativa', 'revogada', 'expirada', 'rejeitada']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.listAutorizacoesRecebidas(
          ctx.tenant.tenantId,
          input?.status,
          input?.limit,
          input?.offset
        );
      }),

    // Aprovar solicitação de autorização
    aprovarAutorizacao: tenantProcedure
      .input(z.object({
        autorizacaoId: z.number(),
        consentimentoLGPD: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se a autorização pertence ao tenant de origem
        const auth = await db.getCrossTenantAutorizacao(input.autorizacaoId);
        if (!auth || auth.tenantOrigemId !== ctx.tenant.tenantId) {
          throw new Error('Autorização não encontrada ou sem permissão');
        }
        
        return await db.approveCrossTenantAutorizacao(
          input.autorizacaoId,
          input.consentimentoLGPD,
          ctx.req?.ip || 'unknown'
        );
      }),

    // Rejeitar solicitação de autorização
    rejeitarAutorizacao: tenantProcedure
      .input(z.object({
        autorizacaoId: z.number(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const auth = await db.getCrossTenantAutorizacao(input.autorizacaoId);
        if (!auth || auth.tenantOrigemId !== ctx.tenant.tenantId) {
          throw new Error('Autorização não encontrada ou sem permissão');
        }
        
        return await db.updateAutorizacaoStatus(input.autorizacaoId, 'rejeitada');
      }),

    // Revogar autorização ativa
    revogarAutorizacao: tenantProcedure
      .input(z.object({
        autorizacaoId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const auth = await db.getCrossTenantAutorizacao(input.autorizacaoId);
        if (!auth || auth.tenantOrigemId !== ctx.tenant.tenantId) {
          throw new Error('Autorização não encontrada ou sem permissão');
        }
        
        return await db.revokeCrossTenantAutorizacao(input.autorizacaoId);
      }),

    // Acessar prontuário de outro tenant (com validação)
    getProntuario: tenantProcedure
      .input(z.object({
        tenantOrigemId: z.number(),
        pacienteId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getProntuarioCrossTenant(
          ctx.tenant.tenantId,
          input.tenantOrigemId,
          input.pacienteId,
          ctx.user!.id,
          ctx.req?.ip,
          ctx.req?.headers['user-agent']
        );
      }),

    // Acessar atendimentos de outro tenant (com validação)
    getAtendimentos: tenantProcedure
      .input(z.object({
        tenantOrigemId: z.number(),
        pacienteId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getAtendimentosCrossTenant(
          ctx.tenant.tenantId,
          input.tenantOrigemId,
          input.pacienteId,
          ctx.user!.id,
          ctx.req?.ip,
          ctx.req?.headers['user-agent']
        );
      }),

    // Listar logs de acesso (auditoria)
    listAccessLogs: tenantProcedure
      .input(z.object({
        pacienteId: z.number().optional(),
        autorizacaoId: z.number().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.listCrossTenantAccessLogs({
          tenantOrigemId: ctx.tenant.tenantId,
          pacienteId: input?.pacienteId,
          autorizacaoId: input?.autorizacaoId,
          dataInicio: input?.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input?.dataFim ? new Date(input.dataFim) : undefined,
          limit: input?.limit,
          offset: input?.offset,
        });
      }),

    // Contar logs de acesso
    countAccessLogs: tenantProcedure
      .input(z.object({
        pacienteId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.countCrossTenantAccessLogs({
          tenantOrigemId: ctx.tenant.tenantId,
          pacienteId: input?.pacienteId,
        });
      }),

    // Obter estatísticas de compartilhamento
    getStats: tenantProcedure
      .query(async ({ ctx }) => {
        return await db.getCrossTenantStats(ctx.tenant.tenantId);
      }),

    // Obter autorizações prestes a expirar
    getAutorizacoesExpirando: tenantProcedure
      .input(z.object({
        diasAntecedencia: z.number().default(7),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAutorizacoesExpirando(input?.diasAntecedencia || 7);
      }),

    // Atualizar autorizações expiradas (job de manutenção)
    atualizarExpiradas: tenantProcedure
      .mutation(async () => {
        return await db.atualizarAutorizacoesExpiradas();
      }),
  }),

  // ==========================================
  // BACKUP - Sistema de Backup Automático
  // ==========================================
  backup: router({
    // Executar backup manual
    executeBackup: tenantProcedure
      .input(z.object({
        type: z.enum(["full", "incremental"]).default("full"),
      }).optional())
      .mutation(async ({ ctx }) => {
        // Capturar informações de auditoria
        const auditInfo = {
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString() || ctx.req.socket.remoteAddress || 'unknown',
          userAgent: ctx.req.headers['user-agent'] || 'unknown',
        };
        return await backup.executeFullBackup(
          ctx.tenant.tenantId,
          "manual",
          ctx.user?.id,
          auditInfo
        );
      }),

    // Gerar backup para download offline (HD externo)
    generateOfflineBackup: tenantProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        // Capturar informações de auditoria
        const auditInfo = {
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString() || ctx.req.socket.remoteAddress || 'unknown',
          userAgent: ctx.req.headers['user-agent'] || 'unknown',
        };
        return await backup.generateOfflineBackup(
          ctx.tenant.tenantId,
          ctx.user.id,
          auditInfo
        );
      }),

    // Listar histórico de backups
    listHistory: tenantProcedure
      .input(z.object({
        limit: z.number().default(50),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await backup.listBackupHistory(
          ctx.tenant.tenantId,
          input?.limit || 50
        );
      }),

    // Obter último backup bem-sucedido
    getLastBackup: tenantProcedure
      .query(async ({ ctx }) => {
        return await backup.getLastSuccessfulBackup(ctx.tenant.tenantId);
      }),

    // Obter configuração de backup
    getConfig: tenantProcedure
      .query(async ({ ctx }) => {
        return await backup.getBackupConfig(ctx.tenant.tenantId);
      }),

    // Atualizar configuração de backup
    updateConfig: tenantProcedure
      .input(z.object({
        backupEnabled: z.boolean().optional(),
        dailyBackupTime: z.string().optional(),
        weeklyBackupDay: z.number().min(0).max(6).optional(),
        monthlyBackupDay: z.number().min(1).max(28).optional(),
        dailyRetentionDays: z.number().min(7).max(365).optional(),
        weeklyRetentionWeeks: z.number().min(4).max(52).optional(),
        monthlyRetentionMonths: z.number().min(6).max(84).optional(),
        notifyOnSuccess: z.boolean().optional(),
        notifyOnFailure: z.boolean().optional(),
        notificationEmail: z.string().email().optional(),
        offlineBackupEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Converter boolean para number (TINYINT) para compatibilidade com MySQL
        const configData = {
          ...input,
          backupEnabled: input.backupEnabled !== undefined ? (input.backupEnabled ? 1 : 0) : undefined,
          notifyOnSuccess: input.notifyOnSuccess !== undefined ? (input.notifyOnSuccess ? 1 : 0) : undefined,
          notifyOnFailure: input.notifyOnFailure !== undefined ? (input.notifyOnFailure ? 1 : 0) : undefined,
          offlineBackupEnabled: input.offlineBackupEnabled !== undefined ? (input.offlineBackupEnabled ? 1 : 0) : undefined,
        };
        await backup.upsertBackupConfig(ctx.tenant.tenantId, configData);
        return { success: true };
      }),

    // Validar integridade de um backup
    validateBackup: tenantProcedure
      .input(z.object({
        backupId: z.number(),
      }))
      .query(async ({ input }) => {
        const isValid = await backup.validateBackup(input.backupId);
        return { valid: isValid };
      }),

    // Limpar backups antigos (conforme política de retenção)
    cleanupOldBackups: tenantProcedure
      .mutation(async ({ ctx }) => {
        const removed = await backup.cleanupOldBackups(ctx.tenant.tenantId);
        return { removedCount: removed };
      }),

    // Validar arquivo de backup antes da restauração
    validateBackupFile: tenantProcedure
      .input(z.object({
        fileData: z.string(), // Base64 encoded
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        return await backup.validateBackupFile(ctx.tenant.tenantId, buffer);
      }),

    // Restaurar backup
    restoreBackup: tenantProcedure
      .input(z.object({
        fileData: z.string(), // Base64 encoded
        confirmRestore: z.boolean(), // Confirmação explícita
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        if (!input.confirmRestore) throw new Error("Confirmação de restauração necessária");
        
        // Capturar informações de auditoria
        const auditInfo = {
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString() || ctx.req.socket.remoteAddress || 'unknown',
          userAgent: ctx.req.headers['user-agent'] || 'unknown',
        };
        
        const buffer = Buffer.from(input.fileData, "base64");
        return await backup.restoreBackup(
          ctx.tenant.tenantId,
          buffer,
          ctx.user.id,
          auditInfo
        );
      }),

    // Executar backup incremental
    executeIncrementalBackup: tenantProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        
        const auditInfo = {
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString() || ctx.req.socket.remoteAddress || 'unknown',
          userAgent: ctx.req.headers['user-agent'] || 'unknown',
        };
        
        return await backup.executeIncrementalBackup(
          ctx.tenant.tenantId,
          "manual",
          ctx.user.id,
          auditInfo
        );
      }),

    // Verificar integridade de um backup específico
    verifyIntegrity: tenantProcedure
      .input(z.object({
        backupId: z.number(),
      }))
      .query(async ({ input }) => {
        return await backup.verifyBackupIntegrity(input.backupId);
      }),

    // Executar verificação de integridade em todos os backups recentes
    runIntegrityCheck: tenantProcedure
      .input(z.object({
        daysBack: z.number().default(30),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        return await backup.runIntegrityCheck(
          ctx.tenant.tenantId,
          input?.daysBack || 30
        );
      }),

    // Gerar relatório de auditoria de backups
    generateAuditReport: tenantProcedure
      .input(z.object({
        startDate: z.string(), // ISO date string
        endDate: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const userName = ctx.user?.name || "system";
        return await backup.generateBackupAuditReport(
          ctx.tenant.tenantId,
          new Date(input.startDate),
          new Date(input.endDate),
          userName
        );
      }),

    // Gerar relatório mensal de auditoria
    generateMonthlyReport: tenantProcedure
      .mutation(async ({ ctx }) => {
        return await backup.generateMonthlyAuditReport(ctx.tenant.tenantId);
      }),

    // Executar teste de restauração em ambiente isolado
    runRestoreTest: tenantProcedure
      .input(z.object({
        backupId: z.number().optional(), // Se não informado, usa o backup mais recente
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const auditInfo = {
          userId: ctx.user?.id?.toString(),
          userIp: ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString() || ctx.req.socket.remoteAddress || 'unknown',
        };
        return await backup.runRestoreTest(
          ctx.tenant.tenantId,
          input?.backupId,
          auditInfo.userId,
          auditInfo.userIp
        );
      }),

    // Obter histórico de testes de restauração
    getRestoreTestHistory: tenantProcedure
      .input(z.object({
        limit: z.number().default(10),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await backup.getRestoreTestHistory(
          ctx.tenant.tenantId,
          input?.limit || 10
        );
      }),
  }),

  // ===== DELEGADOS DA AGENDA =====
  delegadosAgenda: router({
    // Listar delegados do médico logado
    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.listDelegadosAgenda(ctx.user.id);
      }),

    // Adicionar delegado
    create: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        nome: z.string().optional(),
        permissao: z.enum(["visualizar", "editar"]).default("visualizar"),
        dataFim: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.createDelegadoAgenda({
          medicoUserId: ctx.user.id,
          delegadoEmail: input.email,
          delegadoNome: input.nome || null,
          permissao: input.permissao,
          dataFim: input.dataFim || null,
          criadoPor: ctx.user.name || ctx.user.email || "Sistema",
        });
      }),

    // Atualizar permissão do delegado
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        permissao: z.enum(["visualizar", "editar"]).optional(),
        dataFim: z.date().optional().nullable(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.updateDelegadoAgenda(input.id, ctx.user.id, {
          permissao: input.permissao,
          dataFim: input.dataFim,
          ativo: input.ativo,
        });
      }),

    // Remover delegado (soft delete - desativar)
    remove: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Usuário não autenticado");
        return await db.removeDelegadoAgenda(input.id, ctx.user.id);
      }),

    // Verificar se o usuário logado tem permissão de delegado para algum médico
    minhasPermissoes: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.email) return [];
        return await db.getDelegadoPermissoes(ctx.user.email);
      }),
  }),
});
export type AppRouter = typeof appRouter;
