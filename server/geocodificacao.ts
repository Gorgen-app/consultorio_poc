/**
 * Serviço de Geocodificação com Cache
 * Utiliza o Manus Proxy para acessar a API do Google Maps
 * e armazena os resultados em cache no banco de dados
 */

import { ENV } from './_core/env';
import { getPooledDb } from './_core/database';
import { cepCoordenadas } from '../drizzle/schema';
import { eq, inArray, sql } from 'drizzle-orm';

// Configuração do Manus Proxy
const FORGE_BASE_URL = ENV.forgeApiUrl || 'https://forge.manus.ai';
const API_KEY = ENV.forgeApiKey;
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Limite de requisições por lote (para evitar rate limiting)
const BATCH_SIZE = 10;
const DELAY_BETWEEN_REQUESTS = 100; // ms

interface GeocodingResult {
  cep: string;
  latitude: number | null;
  longitude: number | null;
  enderecoFormatado: string | null;
  cidade: string | null;
  uf: string | null;
  status: 'sucesso' | 'nao_encontrado' | 'erro';
  erro?: string;
}

interface CoordenadaCep {
  cep: string;
  latitude: number;
  longitude: number;
  enderecoFormatado: string | null;
  cidade: string | null;
  uf: string | null;
  quantidade?: number;
}

/**
 * Geocodifica um único CEP usando a API do Google Maps via Manus Proxy
 */
async function geocodificarCep(cep: string): Promise<GeocodingResult> {
  if (!API_KEY) {
    return {
      cep,
      latitude: null,
      longitude: null,
      enderecoFormatado: null,
      cidade: null,
      uf: null,
      status: 'erro',
      erro: 'API_KEY não configurada'
    };
  }

  try {
    // Formatar CEP para busca (remover hífen)
    const cepLimpo = cep.replace(/\D/g, '');
    const geocodeUrl = `${MAPS_PROXY_URL}/maps/api/geocode/json?address=${encodeURIComponent(cepLimpo)},Brazil&key=${API_KEY}`;
    
    const response = await fetch(geocodeUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return {
        cep,
        latitude: null,
        longitude: null,
        enderecoFormatado: null,
        cidade: null,
        uf: null,
        status: 'erro',
        erro: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      const location = result.geometry?.location;
      
      // Extrair cidade e UF dos componentes de endereço
      let cidade: string | null = null;
      let uf: string | null = null;
      
      for (const component of result.address_components || []) {
        if (component.types.includes('administrative_area_level_2')) {
          cidade = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          uf = component.short_name;
        }
      }

      return {
        cep,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        enderecoFormatado: result.formatted_address || null,
        cidade,
        uf,
        status: 'sucesso'
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return {
        cep,
        latitude: null,
        longitude: null,
        enderecoFormatado: null,
        cidade: null,
        uf: null,
        status: 'nao_encontrado'
      };
    } else {
      return {
        cep,
        latitude: null,
        longitude: null,
        enderecoFormatado: null,
        cidade: null,
        uf: null,
        status: 'erro',
        erro: `Google API: ${data.status} - ${data.error_message || ''}`
      };
    }
  } catch (error: any) {
    return {
      cep,
      latitude: null,
      longitude: null,
      enderecoFormatado: null,
      cidade: null,
      uf: null,
      status: 'erro',
      erro: error.message
    };
  }
}

/**
 * Busca coordenadas do cache ou geocodifica se necessário
 */
export async function obterCoordenadasCep(cep: string): Promise<CoordenadaCep | null> {
  const db = await getPooledDb();
  if (!db) return null;

  // Normalizar CEP
  const cepNormalizado = cep.replace(/\D/g, '');
  if (cepNormalizado.length < 5) return null;

  // Buscar no cache
  const cached = await db.select()
    .from(cepCoordenadas)
    .where(eq(cepCoordenadas.cep, cepNormalizado))
    .limit(1);

  if (cached.length > 0 && cached[0].status === 'sucesso') {
    return {
      cep: cached[0].cep,
      latitude: Number(cached[0].latitude),
      longitude: Number(cached[0].longitude),
      enderecoFormatado: cached[0].enderecoFormatado,
      cidade: cached[0].cidade,
      uf: cached[0].uf
    };
  }

  // Se não está no cache ou falhou anteriormente, geocodificar
  const resultado = await geocodificarCep(cepNormalizado);

  // Salvar no cache
  await db.insert(cepCoordenadas)
    .values({
      cep: cepNormalizado,
      latitude: resultado.latitude?.toString() || null,
      longitude: resultado.longitude?.toString() || null,
      enderecoFormatado: resultado.enderecoFormatado,
      cidade: resultado.cidade,
      uf: resultado.uf,
      status: resultado.status,
      tentativas: 1,
      ultimoErro: resultado.erro || null,
      geocodificadoEm: new Date()
    })
    .onDuplicateKeyUpdate({
      set: {
        latitude: resultado.latitude?.toString() || null,
        longitude: resultado.longitude?.toString() || null,
        enderecoFormatado: resultado.enderecoFormatado,
        cidade: resultado.cidade,
        uf: resultado.uf,
        status: resultado.status,
        tentativas: sql`tentativas + 1`,
        ultimoErro: resultado.erro || null,
        geocodificadoEm: new Date()
      }
    });

  if (resultado.status === 'sucesso' && resultado.latitude && resultado.longitude) {
    return {
      cep: cepNormalizado,
      latitude: resultado.latitude,
      longitude: resultado.longitude,
      enderecoFormatado: resultado.enderecoFormatado,
      cidade: resultado.cidade,
      uf: resultado.uf
    };
  }

  return null;
}

/**
 * Busca coordenadas para múltiplos CEPs (com cache)
 */
export async function obterCoordenadasMultiplosCeps(ceps: string[]): Promise<CoordenadaCep[]> {
  const db = await getPooledDb();
  if (!db) return [];

  // Normalizar CEPs
  const cepsNormalizados = Array.from(new Set(ceps.map(c => c.replace(/\D/g, '')).filter(c => c.length >= 5)));
  if (cepsNormalizados.length === 0) return [];

  // Buscar todos do cache
  const cached = await db.select()
    .from(cepCoordenadas)
    .where(inArray(cepCoordenadas.cep, cepsNormalizados));

  const cacheMap = new Map(cached.map(c => [c.cep, c]));
  const resultados: CoordenadaCep[] = [];
  const cepsParaGeocodificar: string[] = [];

  // Separar os que já estão no cache dos que precisam geocodificar
  for (const cep of cepsNormalizados) {
    const cachedItem = cacheMap.get(cep);
    if (cachedItem && cachedItem.status === 'sucesso' && cachedItem.latitude && cachedItem.longitude) {
      resultados.push({
        cep: cachedItem.cep,
        latitude: Number(cachedItem.latitude),
        longitude: Number(cachedItem.longitude),
        enderecoFormatado: cachedItem.enderecoFormatado,
        cidade: cachedItem.cidade,
        uf: cachedItem.uf
      });
    } else if (!cachedItem || (cachedItem.status !== 'sucesso' && (cachedItem.tentativas || 0) < 3)) {
      cepsParaGeocodificar.push(cep);
    }
  }

  // Geocodificar os que faltam (em lotes para evitar rate limiting)
  if (cepsParaGeocodificar.length > 0) {
    console.log(`[Geocodificação] ${cepsParaGeocodificar.length} CEPs para geocodificar`);
    
    for (let i = 0; i < cepsParaGeocodificar.length; i += BATCH_SIZE) {
      const batch = cepsParaGeocodificar.slice(i, i + BATCH_SIZE);
      
      for (const cep of batch) {
        const coordenada = await obterCoordenadasCep(cep);
        if (coordenada) {
          resultados.push(coordenada);
        }
        
        // Delay entre requisições
        if (i < cepsParaGeocodificar.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
      }
    }
  }

  return resultados;
}

/**
 * Obtém coordenadas agrupadas por CEP com contagem de pacientes
 * Para uso no mapa de calor
 */
export async function obterCoordenadasParaMapaCalor(tenantId: number): Promise<CoordenadaCep[]> {
  const db = await getPooledDb();
  if (!db) return [];

  // Buscar CEPs únicos dos pacientes com contagem
  const pacientesComCep = await db.execute(sql`
    SELECT 
      REPLACE(cep, '-', '') as cep_limpo,
      COUNT(*) as quantidade
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND cep IS NOT NULL 
      AND cep != ''
      AND deleted_at IS NULL
    GROUP BY REPLACE(cep, '-', '')
    HAVING cep_limpo != ''
  `);

  // Extrair dados do resultado
  const cepsComQuantidade: { cep: string; quantidade: number }[] = [];
  if (Array.isArray(pacientesComCep) && pacientesComCep.length > 0) {
    // O resultado pode vir em diferentes formatos dependendo do driver
    const rows = (pacientesComCep as any)[0] || pacientesComCep;
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row.cep_limpo) {
          cepsComQuantidade.push({
            cep: row.cep_limpo,
            quantidade: Number(row.quantidade) || 1
          });
        }
      }
    }
  }

  if (cepsComQuantidade.length === 0) return [];

  // Obter coordenadas para todos os CEPs
  const ceps = cepsComQuantidade.map(c => c.cep);
  const coordenadas = await obterCoordenadasMultiplosCeps(ceps);

  // Combinar coordenadas com quantidades
  const quantidadeMap = new Map(cepsComQuantidade.map(c => [c.cep, c.quantidade]));
  
  return coordenadas.map(coord => ({
    ...coord,
    quantidade: quantidadeMap.get(coord.cep) || 1
  }));
}

/**
 * Estatísticas do cache de geocodificação
 */
export async function obterEstatisticasCache(): Promise<{
  total: number;
  sucesso: number;
  naoEncontrado: number;
  erro: number;
  pendente: number;
}> {
  const db = await getPooledDb();
  if (!db) return { total: 0, sucesso: 0, naoEncontrado: 0, erro: 0, pendente: 0 };

  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucesso,
      SUM(CASE WHEN status = 'nao_encontrado' THEN 1 ELSE 0 END) as nao_encontrado,
      SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erro,
      SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendente
    FROM cep_coordenadas
  `);

  const row = (stats as any)[0]?.[0] || {};
  return {
    total: Number(row.total) || 0,
    sucesso: Number(row.sucesso) || 0,
    naoEncontrado: Number(row.nao_encontrado) || 0,
    erro: Number(row.erro) || 0,
    pendente: Number(row.pendente) || 0
  };
}
