/**
 * GORGEN - Router de Endpoints para Cron Jobs Externos
 * 
 * Este módulo expõe endpoints HTTP seguros para que agendadores externos
 * (como GitHub Actions, AWS EventBridge, ou crontab) possam disparar
 * as tarefas de backup do sistema.
 * 
 * Segurança:
 * - Todos os endpoints requerem autenticação via Bearer Token (CRON_SECRET)
 * - Rate limiting para prevenir abuso
 * - Logging detalhado de todas as chamadas
 * 
 * Endpoints:
 * - GET  /api/cron/health          - Verificar saúde do serviço
 * - POST /api/cron/backup/daily    - Executar backup diário
 * - POST /api/cron/backup/cleanup  - Executar limpeza de backups antigos
 * - POST /api/cron/restore-test    - Executar teste de restauração
 * - POST /api/cron/integrity-check - Executar verificação de integridade
 * - POST /api/cron/audit-report    - Gerar relatório de auditoria
 */

import { Router, Request, Response, NextFunction } from "express";
import { __test__ as backupTasks, getSchedulerStatus } from "./backup-scheduler";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const CRON_SECRET = process.env.CRON_SECRET;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // máximo 10 requisições por minuto

// Estado para rate limiting simples
const requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================

function authenticateCronRequest(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  // Log da tentativa de acesso
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  console.log(`[CronRouter] Tentativa de acesso de ${clientIp} para ${req.path}`);
  
  // Verificar se CRON_SECRET está configurado
  if (!CRON_SECRET) {
    console.error("[CronRouter] ERRO: CRON_SECRET não está configurado no ambiente");
    res.status(500).json({
      success: false,
      error: "Configuração de segurança incompleta",
      code: "CRON_SECRET_NOT_CONFIGURED",
    });
    return;
  }
  
  // Verificar header de autorização
  if (!authHeader) {
    console.warn(`[CronRouter] Requisição sem header de autorização de ${clientIp}`);
    res.status(401).json({
      success: false,
      error: "Header de autorização ausente",
      code: "MISSING_AUTH_HEADER",
    });
    return;
  }
  
  // Verificar formato do token
  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    console.warn(`[CronRouter] Formato de autorização inválido de ${clientIp}`);
    res.status(401).json({
      success: false,
      error: "Formato de autorização inválido. Use: Bearer <token>",
      code: "INVALID_AUTH_FORMAT",
    });
    return;
  }
  
  // Verificar token
  if (token !== CRON_SECRET) {
    console.warn(`[CronRouter] Token inválido de ${clientIp}`);
    res.status(403).json({
      success: false,
      error: "Token de autorização inválido",
      code: "INVALID_TOKEN",
    });
    return;
  }
  
  console.log(`[CronRouter] Autenticação bem-sucedida de ${clientIp}`);
  next();
}

// ==========================================
// MIDDLEWARE DE RATE LIMITING
// ==========================================

function rateLimitCronRequest(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
  const now = Date.now();
  
  let clientData = requestCounts.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    // Novo período ou primeiro request
    clientData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    requestCounts.set(clientIp, clientData);
  } else {
    clientData.count++;
  }
  
  if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[CronRouter] Rate limit excedido para ${clientIp}`);
    res.status(429).json({
      success: false,
      error: "Muitas requisições. Tente novamente em 1 minuto.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
    return;
  }
  
  next();
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

interface CronTaskResult {
  success: boolean;
  taskName: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  results?: any[];
  error?: string;
}

async function executeTask(
  taskName: string,
  taskFn: () => Promise<void>
): Promise<CronTaskResult> {
  const startedAt = new Date();
  
  try {
    console.log(`[CronRouter] Iniciando tarefa: ${taskName}`);
    
    await taskFn();
    
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    
    console.log(`[CronRouter] Tarefa ${taskName} concluída em ${duration}ms`);
    
    return {
      success: true,
      taskName,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      duration,
    };
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[CronRouter] Erro na tarefa ${taskName}:`, errorMessage);
    
    return {
      success: false,
      taskName,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      duration,
      error: errorMessage,
    };
  }
}

// ==========================================
// CRIAR ROUTER
// ==========================================

export function createCronRouter(): Router {
  const router = Router();
  
  // Aplicar middlewares a todas as rotas
  router.use(rateLimitCronRequest);
  router.use(authenticateCronRequest);
  
  // ----------------------------------------
  // GET /api/cron/health
  // Verificar saúde do serviço de backup
  // ----------------------------------------
  router.get("/health", async (req: Request, res: Response) => {
    try {
      const status = getSchedulerStatus();
      
      res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        scheduler: {
          initialized: status.initialized,
          tasksCount: status.tasks.length,
          tasks: status.tasks.map(t => ({
            name: t.name,
            schedule: t.cronExpression,
            lastRun: t.lastRun,
            lastStatus: t.lastStatus,
          })),
        },
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        status: "unhealthy",
        error: errorMessage,
      });
    }
  });
  
  // ----------------------------------------
  // POST /api/cron/backup/daily
  // Executar backup diário para todos os tenants
  // ----------------------------------------
  router.post("/backup/daily", async (req: Request, res: Response) => {
    const result = await executeTask("daily-backup", backupTasks.runDailyBackup);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  // ----------------------------------------
  // POST /api/cron/backup/cleanup
  // Executar limpeza de backups antigos
  // ----------------------------------------
  router.post("/backup/cleanup", async (req: Request, res: Response) => {
    const result = await executeTask("cleanup", backupTasks.runCleanup);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  // ----------------------------------------
  // POST /api/cron/restore-test
  // Executar teste de restauração semanal
  // ----------------------------------------
  router.post("/restore-test", async (req: Request, res: Response) => {
    const result = await executeTask("restore-test", backupTasks.runWeeklyRestoreTest);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  // ----------------------------------------
  // POST /api/cron/integrity-check
  // Executar verificação de integridade
  // ----------------------------------------
  router.post("/integrity-check", async (req: Request, res: Response) => {
    const result = await executeTask("integrity-check", backupTasks.runWeeklyIntegrityCheck);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  // ----------------------------------------
  // POST /api/cron/audit-report
  // Gerar relatório de auditoria mensal
  // ----------------------------------------
  router.post("/audit-report", async (req: Request, res: Response) => {
    const result = await executeTask("audit-report", backupTasks.runMonthlyAuditReport);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  return router;
}

// ==========================================
// EXPORTAÇÃO PADRÃO
// ==========================================

export const cronRouter = createCronRouter();
