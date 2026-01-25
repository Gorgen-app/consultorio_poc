/**
 * ============================================================================
 * FASE 1 - CORREÇÕES PARA INTEGRAÇÃO SEGURA
 * ============================================================================
 * 
 * Este arquivo implementa todas as correções identificadas no dry run:
 * 1. Adição de tenantId em todas as funções
 * 2. Conversão de fs para fs.promises
 * 3. Verificação de duplicidade
 * 4. Adapter completo para conversão de tipos
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TIPOS CORRIGIDOS COM TENANT
// ============================================================================

export interface ExecutionContext {
  tenantId: number;
  userId: string;
  pacienteId: number;
  documentoExternoId?: number;
}

export interface DocumentoPDFComTenant {
  nome_arquivo: string;
  caminho: string;
  conteudo_texto: string;
  numero_paginas?: number;
  tamanho_bytes?: number;
  tenantId: number;
  pacienteId: number;
  documentoExternoId?: number;
}

export interface ExameExtraidoComTenant {
  paciente: string;
  nome_exame: string;
  resultado: string;
  unidade: string;
  valor_referencia: string;
  data_coleta: string;
  laboratorio: string;
  alterado: boolean;
  arquivo_origem: string;
  pagina?: number;
  observacoes?: string;
  tenantId: number;
  pacienteId: number;
  documentoExternoId?: number;
  resultado_numerico?: number;
  valor_referencia_min?: number;
  valor_referencia_max?: number;
  tipo_alteracao: 'Normal' | 'Aumentado' | 'Diminuído';
}

export interface InsertResultadoLaboratorial {
  tenantId: number;
  pacienteId: number;
  documentoExternoId?: number;
  examePadronizadoId?: number;
  nomeExameOriginal: string;
  dataColeta: string;
  resultado: string;
  resultadoNumerico?: string;
  unidade?: string;
  valorReferenciaTexto?: string;
  valorReferenciaMin?: string;
  valorReferenciaMax?: string;
  foraReferencia: boolean;
  tipoAlteracao: 'Normal' | 'Aumentado' | 'Diminuído';
  laboratorio?: string;
  extraidoPorIa: boolean;
  confiancaExtracao?: string;
  revisadoManualmente: boolean;
}

// ============================================================================
// CORREÇÃO 1: FUNÇÕES COM TENANT OBRIGATÓRIO
// ============================================================================

export function validarContexto(ctx: ExecutionContext): void {
  if (!ctx.tenantId || ctx.tenantId <= 0) {
    throw new Error('ERRO CRÍTICO: tenantId é obrigatório para todas as operações de extração');
  }
  if (!ctx.pacienteId || ctx.pacienteId <= 0) {
    throw new Error('ERRO: pacienteId é obrigatório');
  }
}

export function filtroRapidoSeguro(
  doc: DocumentoPDFComTenant,
  ctx: ExecutionContext
): { processar: boolean; motivo: string } {
  validarContexto(ctx);
  
  if (doc.tenantId !== ctx.tenantId) {
    return {
      processar: false,
      motivo: `ERRO DE SEGURANÇA: Documento pertence ao tenant ${doc.tenantId}, mas contexto é ${ctx.tenantId}`,
    };
  }

  const texto = doc.conteudo_texto.substring(0, 1000).toUpperCase();
  
  const NAO_EXAMES = [
    { padrao: /RECEITU[AÁ]RIO|RECEITA\s+(MÉDICA|ESPECIAL|SIMPLES)/i, tipo: 'RECEITA' },
    { padrao: /SOLICITA[CÇ][AÃ]O\s+DE\s+EXAME|GUIA\s+SADT|AUTORIZA[CÇ][AÃ]O/i, tipo: 'SOLICITAÇÃO' },
    { padrao: /EXTRATO\s+(DE\s+)?(PAGAMENTO|CONTA)|DEMONSTRATIVO/i, tipo: 'EXTRATO' },
    { padrao: /ATESTADO\s+(MÉDICO|DE\s+COMPARECIMENTO)/i, tipo: 'ATESTADO' },
  ];

  for (const naoExame of NAO_EXAMES) {
    if (naoExame.padrao.test(texto)) {
      return { processar: false, motivo: `Documento identificado como ${naoExame.tipo}` };
    }
  }

  const EXAMES = [/RESULTADO\s+DE\s+EXAME/i, /LAUDO\s+(LABORATORIAL|DE\s+EXAME)/i, /HEMOGRAMA|GLICOSE|COLESTEROL/i, /LABORAT[OÓ]RIO/i];

  for (const exame of EXAMES) {
    if (exame.test(texto)) {
      return { processar: true, motivo: 'Documento identificado como resultado de exame' };
    }
  }

  return { processar: true, motivo: 'Documento não identificado claramente, será processado' };
}

// ============================================================================
// CORREÇÃO 2: OPERAÇÕES ASSÍNCRONAS COM FS.PROMISES
// ============================================================================

export async function lerArquivoAsync(caminho: string): Promise<Buffer> {
  try {
    return await fs.readFile(caminho);
  } catch (error: any) {
    if (error.code === 'ENOENT') throw new Error(`Arquivo não encontrado: ${caminho}`);
    throw new Error(`Erro ao ler arquivo: ${error.message}`);
  }
}

export async function arquivoExisteAsync(caminho: string): Promise<boolean> {
  try {
    await fs.access(caminho);
    return true;
  } catch {
    return false;
  }
}

export async function escreverArquivoAsync(caminho: string, conteudo: string): Promise<void> {
  await fs.mkdir(path.dirname(caminho), { recursive: true });
  await fs.writeFile(caminho, conteudo, 'utf-8');
}

export async function listarArquivosAsync(diretorio: string, extensao?: string): Promise<string[]> {
  const arquivos = await fs.readdir(diretorio);
  return extensao ? arquivos.filter(f => f.toLowerCase().endsWith(extensao.toLowerCase())) : arquivos;
}

// ============================================================================
// CORREÇÃO 3: VERIFICAÇÃO DE DUPLICIDADE
// ============================================================================

export interface ChaveDuplicidade {
  tenantId: number;
  pacienteId: number;
  nomeExame: string;
  dataColeta: string;
}

const cacheDuplicidade = new Map<string, boolean>();

export function gerarChaveDuplicidade(tenantId: number, pacienteId: number, nomeExame: string, dataColeta: string): string {
  const nomeNormalizado = nomeExame.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, '_');
  let dataNormalizada = dataColeta;
  const matchBR = dataColeta.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (matchBR) {
    let ano = matchBR[3];
    if (ano.length === 2) ano = parseInt(ano) > 50 ? '19' + ano : '20' + ano;
    dataNormalizada = `${ano}-${matchBR[2]}-${matchBR[1]}`;
  }
  return `${tenantId}:${pacienteId}:${nomeNormalizado}:${dataNormalizada}`;
}

export function verificarDuplicidadeCache(chave: string): boolean {
  return cacheDuplicidade.has(chave);
}

export function registrarNoCache(chave: string): void {
  cacheDuplicidade.set(chave, true);
}

export function limparCacheDuplicidade(): void {
  cacheDuplicidade.clear();
}

export type VerificadorDuplicidadeBD = (tenantId: number, pacienteId: number, nomeExame: string, dataColeta: string) => Promise<boolean>;

export async function verificarDuplicidadeCompleta(
  chave: ChaveDuplicidade,
  verificarBD?: VerificadorDuplicidadeBD
): Promise<{ duplicado: boolean; fonte: 'cache' | 'banco' | 'nenhum' }> {
  const chaveStr = gerarChaveDuplicidade(chave.tenantId, chave.pacienteId, chave.nomeExame, chave.dataColeta);
  
  if (verificarDuplicidadeCache(chaveStr)) return { duplicado: true, fonte: 'cache' };
  
  if (verificarBD) {
    const existeNoBD = await verificarBD(chave.tenantId, chave.pacienteId, chave.nomeExame, chave.dataColeta);
    if (existeNoBD) {
      registrarNoCache(chaveStr);
      return { duplicado: true, fonte: 'banco' };
    }
  }
  
  return { duplicado: false, fonte: 'nenhum' };
}

// ============================================================================
// CORREÇÃO 4: ADAPTER COMPLETO
// ============================================================================

export function parsearValorReferencia(texto: string): { min?: number; max?: number; texto: string } {
  if (!texto) return { texto: '' };
  const resultado: { min?: number; max?: number; texto: string } = { texto };

  const matchRange = texto.match(/(\d+[.,]?\d*)\s*[-a]\s*(\d+[.,]?\d*)/);
  if (matchRange) {
    resultado.min = parseFloat(matchRange[1].replace(',', '.'));
    resultado.max = parseFloat(matchRange[2].replace(',', '.'));
    return resultado;
  }

  const matchMenor = texto.match(/<[=]?\s*(\d+[.,]?\d*)/);
  if (matchMenor) {
    resultado.max = parseFloat(matchMenor[1].replace(',', '.'));
    return resultado;
  }

  const matchMaior = texto.match(/>[=]?\s*(\d+[.,]?\d*)/);
  if (matchMaior) {
    resultado.min = parseFloat(matchMaior[1].replace(',', '.'));
    return resultado;
  }

  return resultado;
}

export function parsearResultadoNumerico(texto: string): number | undefined {
  if (!texto) return undefined;
  const limpo = texto.replace(/[<>]=?/g, '').trim();
  const match = limpo.match(/(\d+[.,]?\d*)/);
  return match ? parseFloat(match[1].replace(',', '.')) : undefined;
}

export function converterDataParaISO(data: string): string {
  if (!data) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  
  const match = data.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (match) {
    let ano = match[3];
    if (ano.length === 2) ano = parseInt(ano) > 50 ? '19' + ano : '20' + ano;
    return `${ano}-${match[2]}-${match[1]}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

export function determinarTipoAlteracao(
  resultadoNumerico: number | undefined,
  refMin: number | undefined,
  refMax: number | undefined
): 'Normal' | 'Aumentado' | 'Diminuído' {
  if (resultadoNumerico === undefined) return 'Normal';
  if (refMax !== undefined && resultadoNumerico > refMax) return 'Aumentado';
  if (refMin !== undefined && resultadoNumerico < refMin) return 'Diminuído';
  return 'Normal';
}

export function converterParaInsertBD(exame: ExameExtraidoComTenant, ctx: ExecutionContext): InsertResultadoLaboratorial {
  validarContexto(ctx);

  const refParsed = parsearValorReferencia(exame.valor_referencia);
  const resultadoNum = parsearResultadoNumerico(exame.resultado);
  const dataISO = converterDataParaISO(exame.data_coleta);
  const tipoAlteracao = determinarTipoAlteracao(resultadoNum, refParsed.min, refParsed.max);

  return {
    tenantId: ctx.tenantId,
    pacienteId: ctx.pacienteId,
    documentoExternoId: ctx.documentoExternoId,
    nomeExameOriginal: exame.nome_exame,
    dataColeta: dataISO,
    resultado: exame.resultado,
    resultadoNumerico: resultadoNum?.toString(),
    unidade: exame.unidade || undefined,
    valorReferenciaTexto: exame.valor_referencia || undefined,
    valorReferenciaMin: refParsed.min?.toString(),
    valorReferenciaMax: refParsed.max?.toString(),
    foraReferencia: exame.alterado || tipoAlteracao !== 'Normal',
    tipoAlteracao,
    laboratorio: exame.laboratorio || undefined,
    extraidoPorIa: true,
    confiancaExtracao: '0.85',
    revisadoManualmente: false,
  };
}

export async function converterLoteParaInsertBD(
  exames: ExameExtraidoComTenant[],
  ctx: ExecutionContext,
  verificarBD?: VerificadorDuplicidadeBD
): Promise<{ paraInserir: InsertResultadoLaboratorial[]; duplicados: string[]; erros: string[] }> {
  validarContexto(ctx);

  const paraInserir: InsertResultadoLaboratorial[] = [];
  const duplicados: string[] = [];
  const erros: string[] = [];

  for (const exame of exames) {
    try {
      const chave: ChaveDuplicidade = { tenantId: ctx.tenantId, pacienteId: ctx.pacienteId, nomeExame: exame.nome_exame, dataColeta: exame.data_coleta };
      const dupCheck = await verificarDuplicidadeCompleta(chave, verificarBD);
      
      if (dupCheck.duplicado) {
        duplicados.push(`${exame.nome_exame} (${exame.data_coleta}) - já existe no ${dupCheck.fonte}`);
        continue;
      }

      const insert = converterParaInsertBD(exame, ctx);
      paraInserir.push(insert);

      const chaveStr = gerarChaveDuplicidade(ctx.tenantId, ctx.pacienteId, exame.nome_exame, exame.data_coleta);
      registrarNoCache(chaveStr);
    } catch (error: any) {
      erros.push(`${exame.nome_exame}: ${error.message}`);
    }
  }

  return { paraInserir, duplicados, erros };
}

export default {
  validarContexto, filtroRapidoSeguro,
  lerArquivoAsync, arquivoExisteAsync, escreverArquivoAsync, listarArquivosAsync,
  gerarChaveDuplicidade, verificarDuplicidadeCache, registrarNoCache, limparCacheDuplicidade, verificarDuplicidadeCompleta,
  parsearValorReferencia, parsearResultadoNumerico, converterDataParaISO, determinarTipoAlteracao, converterParaInsertBD, converterLoteParaInsertBD,
};
