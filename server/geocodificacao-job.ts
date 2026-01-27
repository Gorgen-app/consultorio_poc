/**
 * Job de Pré-carregamento de Coordenadas de CEPs
 * Executa em background para popular o cache de geocodificação
 * Respeita os limites de rate limiting da API do Google Maps
 */

import { ENV } from './_core/env';
import { getPooledDb } from './_core/database';
import { cepCoordenadas, pacientes } from '../drizzle/schema';
import { eq, sql, isNotNull, ne, and, notInArray } from 'drizzle-orm';

// Configuração do Manus Proxy
const FORGE_BASE_URL = ENV.forgeApiUrl || 'https://forge.manus.ai';
const API_KEY = ENV.forgeApiKey;
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Configurações do job
const BATCH_SIZE = 10; // CEPs por lote
const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo entre lotes
const DELAY_BETWEEN_REQUESTS = 200; // 200ms entre requisições
const MAX_REQUESTS_PER_RUN = 180; // Limite por execução (margem de segurança)
const MAX_RETRIES = 3; // Máximo de tentativas por CEP

// Estado do job
interface JobStatus {
  isRunning: boolean;
  startedAt: Date | null;
  finishedAt: Date | null;
  totalCeps: number;
  processados: number;
  sucesso: number;
  erros: number;
  ignorados: number;
  progresso: number;
  ultimoCepProcessado: string | null;
  mensagem: string;
  estimativaTempoRestante: string | null;
}

let jobStatus: JobStatus = {
  isRunning: false,
  startedAt: null,
  finishedAt: null,
  totalCeps: 0,
  processados: 0,
  sucesso: 0,
  erros: 0,
  ignorados: 0,
  progresso: 0,
  ultimoCepProcessado: null,
  mensagem: 'Aguardando início',
  estimativaTempoRestante: null
};

/**
 * Geocodifica um único CEP
 */
async function geocodificarCep(cep: string): Promise<{
  sucesso: boolean;
  latitude?: number;
  longitude?: number;
  enderecoFormatado?: string;
  cidade?: string;
  uf?: string;
  erro?: string;
}> {
  if (!API_KEY) {
    return { sucesso: false, erro: 'API_KEY não configurada' };
  }

  try {
    const cepLimpo = cep.replace(/\D/g, '');
    const geocodeUrl = `${MAPS_PROXY_URL}/maps/api/geocode/json?address=${encodeURIComponent(cepLimpo)},Brazil&key=${API_KEY}`;
    
    const response = await fetch(geocodeUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return { sucesso: false, erro: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      const location = result.geometry?.location;
      
      let cidade: string | undefined;
      let uf: string | undefined;
      
      for (const component of result.address_components || []) {
        if (component.types.includes('administrative_area_level_2')) {
          cidade = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          uf = component.short_name;
        }
      }

      return {
        sucesso: true,
        latitude: location?.lat,
        longitude: location?.lng,
        enderecoFormatado: result.formatted_address,
        cidade,
        uf
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return { sucesso: false, erro: 'CEP não encontrado' };
    } else {
      return { sucesso: false, erro: `Google API: ${data.status}` };
    }
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Busca CEPs pendentes de geocodificação
 */
async function buscarCepsPendentes(): Promise<string[]> {
  const db = await getPooledDb();
  if (!db) return [];

  // Buscar CEPs únicos dos pacientes que ainda não estão no cache com sucesso
  const result = await db.execute(sql`
    SELECT DISTINCT REPLACE(p.cep, '-', '') as cep_limpo
    FROM pacientes p
    WHERE p.cep IS NOT NULL 
      AND p.cep != ''
      AND p.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM cep_coordenadas c 
        WHERE c.cep = REPLACE(p.cep, '-', '') 
        AND c.status = 'sucesso'
      )
    ORDER BY cep_limpo
    LIMIT ${MAX_REQUESTS_PER_RUN}
  `);

  const ceps: string[] = [];
  const rows = (result as any)[0] || result;
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (row.cep_limpo && row.cep_limpo.length >= 5) {
        ceps.push(row.cep_limpo);
      }
    }
  }

  return ceps;
}

/**
 * Conta total de CEPs únicos
 */
async function contarTotalCeps(): Promise<{ total: number; pendentes: number; processados: number }> {
  const db = await getPooledDb();
  if (!db) return { total: 0, pendentes: 0, processados: 0 };

  const totalResult = await db.execute(sql`
    SELECT COUNT(DISTINCT REPLACE(cep, '-', '')) as total
    FROM pacientes
    WHERE cep IS NOT NULL AND cep != '' AND deleted_at IS NULL
  `);

  const processadosResult = await db.execute(sql`
    SELECT COUNT(*) as total FROM cep_coordenadas WHERE status = 'sucesso'
  `);

  const total = Number((totalResult as any)[0]?.[0]?.total || 0);
  const processados = Number((processadosResult as any)[0]?.[0]?.total || 0);

  return {
    total,
    processados,
    pendentes: Math.max(0, total - processados)
  };
}

/**
 * Salva resultado da geocodificação no cache
 */
async function salvarNoCache(
  cep: string,
  resultado: {
    sucesso: boolean;
    latitude?: number;
    longitude?: number;
    enderecoFormatado?: string;
    cidade?: string;
    uf?: string;
    erro?: string;
  }
): Promise<void> {
  const db = await getPooledDb();
  if (!db) return;

  const status = resultado.sucesso ? 'sucesso' : (resultado.erro?.includes('não encontrado') ? 'nao_encontrado' : 'erro');

  await db.insert(cepCoordenadas)
    .values({
      cep,
      latitude: resultado.latitude?.toString() || null,
      longitude: resultado.longitude?.toString() || null,
      enderecoFormatado: resultado.enderecoFormatado || null,
      cidade: resultado.cidade || null,
      uf: resultado.uf || null,
      status,
      tentativas: 1,
      ultimoErro: resultado.erro || null,
      geocodificadoEm: new Date()
    })
    .onDuplicateKeyUpdate({
      set: {
        latitude: resultado.latitude?.toString() || null,
        longitude: resultado.longitude?.toString() || null,
        enderecoFormatado: resultado.enderecoFormatado || null,
        cidade: resultado.cidade || null,
        uf: resultado.uf || null,
        status,
        tentativas: sql`tentativas + 1`,
        ultimoErro: resultado.erro || null,
        geocodificadoEm: new Date()
      }
    });
}

/**
 * Calcula estimativa de tempo restante
 */
function calcularTempoRestante(processados: number, total: number, tempoDecorrido: number): string {
  if (processados === 0) return 'Calculando...';
  
  const taxaProcessamento = processados / (tempoDecorrido / 1000); // CEPs por segundo
  const restantes = total - processados;
  const segundosRestantes = restantes / taxaProcessamento;
  
  if (segundosRestantes < 60) {
    return `${Math.ceil(segundosRestantes)} segundos`;
  } else if (segundosRestantes < 3600) {
    return `${Math.ceil(segundosRestantes / 60)} minutos`;
  } else {
    const horas = Math.floor(segundosRestantes / 3600);
    const minutos = Math.ceil((segundosRestantes % 3600) / 60);
    return `${horas}h ${minutos}min`;
  }
}

/**
 * Executa o job de geocodificação
 */
export async function executarJobGeocodificacao(): Promise<JobStatus> {
  if (jobStatus.isRunning) {
    return { ...jobStatus, mensagem: 'Job já está em execução' };
  }

  // Inicializar status
  jobStatus = {
    isRunning: true,
    startedAt: new Date(),
    finishedAt: null,
    totalCeps: 0,
    processados: 0,
    sucesso: 0,
    erros: 0,
    ignorados: 0,
    progresso: 0,
    ultimoCepProcessado: null,
    mensagem: 'Iniciando job de geocodificação...',
    estimativaTempoRestante: null
  };

  console.log('[Geocodificação Job] Iniciando...');

  try {
    // Contar totais
    const totais = await contarTotalCeps();
    jobStatus.totalCeps = totais.total;
    jobStatus.processados = totais.processados;
    jobStatus.progresso = totais.total > 0 ? Math.round((totais.processados / totais.total) * 100) : 0;
    
    console.log(`[Geocodificação Job] Total: ${totais.total}, Processados: ${totais.processados}, Pendentes: ${totais.pendentes}`);

    if (totais.pendentes === 0) {
      jobStatus.mensagem = 'Todos os CEPs já foram geocodificados!';
      jobStatus.isRunning = false;
      jobStatus.finishedAt = new Date();
      return jobStatus;
    }

    // Buscar CEPs pendentes
    const cepsPendentes = await buscarCepsPendentes();
    console.log(`[Geocodificação Job] ${cepsPendentes.length} CEPs para processar nesta execução`);

    if (cepsPendentes.length === 0) {
      jobStatus.mensagem = 'Nenhum CEP pendente encontrado';
      jobStatus.isRunning = false;
      jobStatus.finishedAt = new Date();
      return jobStatus;
    }

    jobStatus.mensagem = `Processando ${cepsPendentes.length} CEPs...`;
    const startTime = Date.now();
    let processadosNestaExecucao = 0;

    // Processar em lotes
    for (let i = 0; i < cepsPendentes.length; i += BATCH_SIZE) {
      const batch = cepsPendentes.slice(i, i + BATCH_SIZE);
      
      for (const cep of batch) {
        // Geocodificar
        const resultado = await geocodificarCep(cep);
        
        // Salvar no cache
        await salvarNoCache(cep, resultado);
        
        // Atualizar estatísticas
        processadosNestaExecucao++;
        if (resultado.sucesso) {
          jobStatus.sucesso++;
        } else {
          jobStatus.erros++;
        }
        
        jobStatus.processados = totais.processados + processadosNestaExecucao;
        jobStatus.progresso = Math.round((jobStatus.processados / jobStatus.totalCeps) * 100);
        jobStatus.ultimoCepProcessado = cep;
        jobStatus.mensagem = `Processando CEP ${cep}... (${processadosNestaExecucao}/${cepsPendentes.length})`;
        
        // Calcular tempo restante
        const tempoDecorrido = Date.now() - startTime;
        jobStatus.estimativaTempoRestante = calcularTempoRestante(
          processadosNestaExecucao,
          cepsPendentes.length,
          tempoDecorrido
        );

        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }

      // Delay entre lotes
      if (i + BATCH_SIZE < cepsPendentes.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Finalizar
    jobStatus.isRunning = false;
    jobStatus.finishedAt = new Date();
    jobStatus.mensagem = `Concluído! ${jobStatus.sucesso} CEPs geocodificados com sucesso, ${jobStatus.erros} erros.`;
    jobStatus.estimativaTempoRestante = null;

    console.log(`[Geocodificação Job] Finalizado: ${jobStatus.sucesso} sucesso, ${jobStatus.erros} erros`);

  } catch (error: any) {
    console.error('[Geocodificação Job] Erro:', error);
    jobStatus.isRunning = false;
    jobStatus.finishedAt = new Date();
    jobStatus.mensagem = `Erro: ${error.message}`;
  }

  return jobStatus;
}

/**
 * Retorna o status atual do job
 */
export function obterStatusJob(): JobStatus {
  return { ...jobStatus };
}

/**
 * Cancela o job em execução
 */
export function cancelarJob(): boolean {
  if (jobStatus.isRunning) {
    jobStatus.isRunning = false;
    jobStatus.finishedAt = new Date();
    jobStatus.mensagem = 'Job cancelado pelo usuário';
    return true;
  }
  return false;
}

/**
 * Reseta o status do job
 */
export function resetarStatusJob(): void {
  jobStatus = {
    isRunning: false,
    startedAt: null,
    finishedAt: null,
    totalCeps: 0,
    processados: 0,
    sucesso: 0,
    erros: 0,
    ignorados: 0,
    progresso: 0,
    ultimoCepProcessado: null,
    mensagem: 'Aguardando início',
    estimativaTempoRestante: null
  };
}
