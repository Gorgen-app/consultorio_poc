import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { recordEndpointMetric } from "../performance";
import { initializeBackupSystem } from "./backup-init";
import { combinedRateLimiter, addRateLimitHeaders } from "./rateLimit";
import { cronRouter } from "../cron-router";
import { securityHeaders } from "./securityHeaders";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Headers de Segurança (CSP, X-Frame-Options, etc.)
  app.use(securityHeaders);
  
  // Rate Limiting - Proteção contra abuso
  app.use(addRateLimitHeaders);
  app.use(combinedRateLimiter);
  
  // Middleware de coleta de métricas de performance
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar o fim da resposta para registrar métricas
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endpoint = req.path;
      const method = req.method;
      const statusCode = res.statusCode;
      
      // Registrar métrica (ignorar assets estáticos)
      if (!endpoint.startsWith('/@') && !endpoint.startsWith('/node_modules') && !endpoint.endsWith('.js') && !endpoint.endsWith('.css') && !endpoint.endsWith('.map')) {
        recordEndpointMetric({
          endpoint,
          method,
          responseTime,
          statusCode,
        });
      }
    });
    
    next();
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Endpoint de upload de arquivos
  app.post("/api/upload", async (req, res) => {
    try {
      const { fileKey, fileData, contentType } = req.body;
      
      if (!fileKey || !fileData) {
        return res.status(400).json({ error: "fileKey e fileData são obrigatórios" });
      }

      // Converter base64 para buffer
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Fazer upload para S3
      const { url } = await storagePut(fileKey, buffer, contentType || "application/octet-stream");

      res.json({ url });
    } catch (error) {
      console.error("Erro no upload:", error);
      res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }
  });
  
  // ==========================================
  // ENDPOINTS DE CRON JOB EXTERNO (GitHub Actions)
  // ==========================================
  // Registrar rotas para agendadores externos chamarem as tarefas de backup
  // Autenticação via Bearer Token (CRON_SECRET)
  app.use("/api/cron", cronRouter);
  console.log("[GORGEN] Endpoints de cron job externo registrados em /api/cron/*");

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[GORGEN] Rate Limiting ativo: 100 req/min por IP, 300 req/min por usuário`);
    console.log(`[GORGEN] Headers de Segurança (CSP) ativos`);
    
    // Inicializar sistema de backup automático após servidor estar pronto
    // Modo híbrido: agendamento via GitHub Actions, execução via endpoints /api/cron/*
    initializeBackupSystem();
  });
}

startServer().catch(console.error);
