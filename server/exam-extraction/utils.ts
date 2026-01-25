/**
 * ============================================================================
 * GORGEN EXAM EXTRACTOR - Utilitários e Funções Auxiliares
 * ============================================================================
 * 
 * Funções utilitárias para manipulação de PDFs, formatação de dados,
 * e operações de arquivo.
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExameExtraido, DocumentoPDF, IndicePaciente } from './exam-extractor';

// ============================================================================
// MANIPULAÇÃO DE ARQUIVOS
// ============================================================================

/**
 * Lê um arquivo PDF e extrai texto usando pdftotext (poppler-utils)
 */
export async function lerPDF(caminho: string): Promise<DocumentoPDF> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  // Verificar se arquivo existe
  if (!fs.existsSync(caminho)) {
    throw new Error(`Arquivo não encontrado: ${caminho}`);
  }

  const stats = fs.statSync(caminho);
  const nomeArquivo = path.basename(caminho);

  // Extrair texto usando pdftotext
  let conteudoTexto = '';
  let numeroPaginas = 0;

  try {
    // Extrair texto
    const { stdout } = await execAsync(`pdftotext -layout "${caminho}" -`, { maxBuffer: 50 * 1024 * 1024 });
    conteudoTexto = stdout;

    // Contar páginas
    const { stdout: pagesOut } = await execAsync(`pdfinfo "${caminho}" | grep Pages | awk '{print $2}'`);
    numeroPaginas = parseInt(pagesOut.trim()) || 1;
  } catch (error) {
    console.warn(`Aviso: Não foi possível extrair texto de ${nomeArquivo}: ${error}`);
    conteudoTexto = '';
    numeroPaginas = 0;
  }

  return {
    nome_arquivo: nomeArquivo,
    caminho,
    conteudo_texto: conteudoTexto,
    numero_paginas: numeroPaginas,
    tamanho_bytes: stats.size,
    data_modificacao: stats.mtime
  };
}

/**
 * Lê múltiplos PDFs de um diretório
 */
export async function lerPDFsDiretorio(diretorio: string): Promise<DocumentoPDF[]> {
  const arquivos = fs.readdirSync(diretorio)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(diretorio, f));

  const documentos: DocumentoPDF[] = [];
  
  for (const arquivo of arquivos) {
    try {
      const doc = await lerPDF(arquivo);
      documentos.push(doc);
    } catch (error) {
      console.error(`Erro ao ler ${arquivo}: ${error}`);
    }
  }

  return documentos;
}

// ============================================================================
// FORMATAÇÃO E EXPORTAÇÃO
// ============================================================================

/**
 * Exporta exames para CSV
 */
export function exportarCSV(exames: ExameExtraido[], caminho: string): void {
  const cabecalho = [
    'PACIENTE',
    'EXAME',
    'RESULTADO',
    'UNIDADE',
    'REFERÊNCIA',
    'DATA',
    'LABORATÓRIO',
    'ALTERADO',
    'ARQUIVO'
  ].join(',');

  const linhas = exames.map(e => [
    `"${e.paciente}"`,
    `"${e.nome_exame}"`,
    `"${e.resultado}"`,
    `"${e.unidade}"`,
    `"${e.valor_referencia}"`,
    `"${e.data_coleta}"`,
    `"${e.laboratorio}"`,
    e.alterado ? 'SIM' : 'NÃO',
    `"${e.arquivo_origem}"`
  ].join(','));

  const csv = [cabecalho, ...linhas].join('\n');
  fs.writeFileSync(caminho, csv, 'utf-8');
}

/**
 * Exporta exames para tabela pivotada (exames x datas)
 */
export function exportarTabelaPivotada(
  exames: ExameExtraido[],
  caminho: string,
  paciente?: string
): void {
  // Filtrar por paciente se especificado
  const examesFiltrados = paciente 
    ? exames.filter(e => e.paciente === paciente)
    : exames;

  // Agrupar por paciente
  const porPaciente = new Map<string, ExameExtraido[]>();
  for (const exame of examesFiltrados) {
    if (!porPaciente.has(exame.paciente)) {
      porPaciente.set(exame.paciente, []);
    }
    porPaciente.get(exame.paciente)!.push(exame);
  }

  let csv = '';

  porPaciente.forEach((examesPaciente, nomePaciente) => {
    // Obter datas únicas ordenadas
    const datasSet = new Set<string>();
    examesPaciente.forEach((e: ExameExtraido) => datasSet.add(e.data_coleta));
    const datas: string[] = Array.from(datasSet).sort((a: string, b: string) => {
      const [diaA, mesA, anoA] = a.split('/').map(Number);
      const [diaB, mesB, anoB] = b.split('/').map(Number);
      const dataA = new Date(anoA < 100 ? 2000 + anoA : anoA, mesA - 1, diaA);
      const dataB = new Date(anoB < 100 ? 2000 + anoB : anoB, mesB - 1, diaB);
      return dataA.getTime() - dataB.getTime();
    });
    
    // Obter exames únicos ordenados
    const nomesSet = new Set<string>();
    examesPaciente.forEach((e: ExameExtraido) => nomesSet.add(e.nome_exame));
    const nomesExames: string[] = Array.from(nomesSet).sort();

    // Cabeçalho
    csv += `# PACIENTE: ${nomePaciente}\n`;
    csv += `EXAME,${datas.join(',')}\n`;

    // Linhas de exames
    for (const nomeExame of nomesExames) {
      const valores = datas.map((data: string) => {
        const exame = examesPaciente.find((e: ExameExtraido) => e.nome_exame === nomeExame && e.data_coleta === data);
        if (exame) {
          return exame.alterado ? `${exame.resultado}*` : exame.resultado;
        }
        return '-';
      });
      csv += `${nomeExame},${valores.join(',')}\n`;
    }

    csv += '\n';
  });

  fs.writeFileSync(caminho, csv, 'utf-8');
}

/**
 * Exporta exames para JSON
 */
export function exportarJSON(exames: ExameExtraido[], caminho: string): void {
  const json = JSON.stringify(exames, null, 2);
  fs.writeFileSync(caminho, json, 'utf-8');
}

// ============================================================================
// ÍNDICE DE PACIENTES
// ============================================================================

/**
 * Carrega índice de pacientes de arquivo JSON
 */
export function carregarIndicePacientes(caminho: string): Map<string, IndicePaciente> {
  const indice = new Map<string, IndicePaciente>();
  
  if (fs.existsSync(caminho)) {
    try {
      const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
      for (const [nome, info] of Object.entries(dados)) {
        indice.set(nome, {
          ...(info as IndicePaciente),
          ultima_atualizacao: new Date((info as any).ultima_atualizacao)
        });
      }
    } catch (error) {
      console.warn(`Aviso: Não foi possível carregar índice de pacientes: ${error}`);
    }
  }

  return indice;
}

/**
 * Salva índice de pacientes em arquivo JSON
 */
export function salvarIndicePacientes(indice: Map<string, IndicePaciente>, caminho: string): void {
  const dados: Record<string, any> = {};
  
  indice.forEach((info, nome) => {
    dados[nome] = {
      ...info,
      ultima_atualizacao: info.ultima_atualizacao.toISOString()
    };
  });

  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

// ============================================================================
// FORMATAÇÃO DE DATAS
// ============================================================================

/**
 * Converte data brasileira (DD/MM/YYYY) para objeto Date
 */
export function parseDateBR(dataStr: string): Date | null {
  const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (!match) return null;

  let [, dia, mes, ano] = match;
  let anoNum = parseInt(ano);
  
  // Converter ano de 2 dígitos para 4 dígitos
  if (anoNum < 100) {
    anoNum = anoNum > 50 ? 1900 + anoNum : 2000 + anoNum;
  }

  return new Date(anoNum, parseInt(mes) - 1, parseInt(dia));
}

/**
 * Formata Date para string brasileira (DD/MM/YYYY)
 */
export function formatDateBR(data: Date): string {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Ordena array de datas brasileiras
 */
export function ordenarDatasBR(datas: string[]): string[] {
  return datas.sort((a, b) => {
    const dataA = parseDateBR(a);
    const dataB = parseDateBR(b);
    if (!dataA || !dataB) return 0;
    return dataA.getTime() - dataB.getTime();
  });
}

// ============================================================================
// NORMALIZAÇÃO DE TEXTO
// ============================================================================

/**
 * Remove acentos de uma string
 */
export function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza espaços em branco
 */
export function normalizarEspacos(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/**
 * Limpa texto para comparação
 */
export function limparTextoComparacao(texto: string): string {
  return removerAcentos(texto).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Valida se um valor numérico está dentro da faixa de referência
 */
export function validarReferencia(
  valor: number,
  min?: number,
  max?: number
): { valido: boolean; status: 'normal' | 'baixo' | 'alto' } {
  if (isNaN(valor)) {
    return { valido: true, status: 'normal' };
  }

  if (min !== undefined && valor < min) {
    return { valido: false, status: 'baixo' };
  }

  if (max !== undefined && valor > max) {
    return { valido: false, status: 'alto' };
  }

  return { valido: true, status: 'normal' };
}

/**
 * Parseia string de referência para objeto
 */
export function parseReferencia(refStr: string): { min?: number; max?: number } | null {
  // Padrão: "X - Y" ou "X a Y"
  const rangeMatch = refStr.match(/(\d+[.,]?\d*)\s*[-a]\s*(\d+[.,]?\d*)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1].replace(',', '.')),
      max: parseFloat(rangeMatch[2].replace(',', '.'))
    };
  }

  // Padrão: "< X" ou "menor que X"
  const menorMatch = refStr.match(/<\s*(\d+[.,]?\d*)/);
  if (menorMatch) {
    return { max: parseFloat(menorMatch[1].replace(',', '.')) };
  }

  // Padrão: "> X" ou "maior que X"
  const maiorMatch = refStr.match(/>\s*(\d+[.,]?\d*)/);
  if (maiorMatch) {
    return { min: parseFloat(maiorMatch[1].replace(',', '.')) };
  }

  return null;
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

/**
 * Calcula estatísticas de um conjunto de exames
 */
export function calcularEstatisticas(exames: ExameExtraido[]): {
  total: number;
  alterados: number;
  porPaciente: Record<string, number>;
  porLaboratorio: Record<string, number>;
  porTipo: Record<string, number>;
} {
  const stats = {
    total: exames.length,
    alterados: exames.filter(e => e.alterado).length,
    porPaciente: {} as Record<string, number>,
    porLaboratorio: {} as Record<string, number>,
    porTipo: {} as Record<string, number>
  };

  for (const exame of exames) {
    // Por paciente
    stats.porPaciente[exame.paciente] = (stats.porPaciente[exame.paciente] || 0) + 1;
    
    // Por laboratório
    stats.porLaboratorio[exame.laboratorio] = (stats.porLaboratorio[exame.laboratorio] || 0) + 1;
    
    // Por tipo (baseado no nome do exame)
    const tipo = categorizarExame(exame.nome_exame);
    stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
  }

  return stats;
}

/**
 * Categoriza exame por tipo
 */
export function categorizarExame(nomeExame: string): string {
  const nome = nomeExame.toUpperCase();

  const categorias: Record<string, RegExp[]> = {
    'HEMOGRAMA': [/ERITRÓCITOS|HEMOGLOBINA|HEMATÓCRITO|VCM|HCM|CHCM|RDW|LEUCÓCITOS|NEUTRÓFILOS|LINFÓCITOS|MONÓCITOS|EOSINÓFILOS|BASÓFILOS|PLAQUETAS/],
    'FUNÇÃO HEPÁTICA': [/TGO|TGP|AST|ALT|GAMA\s*GT|FOSFATASE\s*ALCALINA|BILIRRUBINA|ALBUMINA/],
    'FUNÇÃO RENAL': [/CREATININA|UREIA|TFG|CISTATINA|ÁCIDO\s*ÚRICO/],
    'PERFIL LIPÍDICO': [/COLESTEROL|TRIGLICERÍDEOS|HDL|LDL|VLDL|APOLIPOPROTEÍNA/],
    'GLICEMIA': [/GLICOSE|GLICEMIA|HEMOGLOBINA\s*GLICADA|HBA1C|INSULINA|PEPTÍDEO\s*C/],
    'ELETRÓLITOS': [/SÓDIO|POTÁSSIO|CÁLCIO|MAGNÉSIO|FÓSFORO|CLORO/],
    'COAGULAÇÃO': [/TP|TTPA|INR|FIBRINOGÊNIO|TEMPO\s*DE\s*PROTROMBINA|TEMPO\s*DE\s*TROMBOPLASTINA/],
    'TIREOIDE': [/TSH|T4|T3|TIREOGLOBULINA|ANTI-TPO|ANTI-TIREOGLOBULINA/],
    'HORMÔNIOS': [/FSH|LH|ESTRADIOL|PROGESTERONA|TESTOSTERONA|PROLACTINA|CORTISOL|ACTH/],
    'MARCADORES TUMORAIS': [/PSA|CEA|CA\s*\d+|AFP|BETA-HCG/],
    'INFLAMAÇÃO': [/PCR|VHS|FERRITINA|PROTEÍNA\s*C\s*REATIVA/],
    'IMAGEM': [/USG|ULTRASSONOGRAFIA|TOMOGRAFIA|RESSONÂNCIA|ECOCARDIOGRAMA|ELASTOGRAFIA|RADIOGRAFIA/],
    'ANATOMOPATOLÓGICO': [/ANATOMOPATOLÓGICO|BIÓPSIA|HISTOPATOLÓGICO/]
  };

  for (const [categoria, padroes] of Object.entries(categorias)) {
    for (const padrao of padroes) {
      if (padrao.test(nome)) {
        return categoria;
      }
    }
  }

  return 'OUTROS';
}

// ============================================================================
// MERGE DE TABELAS
// ============================================================================

/**
 * Faz merge de exames novos com tabela existente
 */
export function mergeExames(
  existentes: ExameExtraido[],
  novos: ExameExtraido[]
): ExameExtraido[] {
  const mapa = new Map<string, ExameExtraido>();

  // Adicionar existentes
  for (const exame of existentes) {
    const chave = `${exame.paciente}|${exame.nome_exame}|${exame.data_coleta}`;
    mapa.set(chave, exame);
  }

  // Adicionar ou atualizar com novos
  for (const exame of novos) {
    const chave = `${exame.paciente}|${exame.nome_exame}|${exame.data_coleta}`;
    mapa.set(chave, exame);
  }

  return Array.from(mapa.values());
}

/**
 * Carrega exames de arquivo CSV
 */
export function carregarExamesCSV(caminho: string): ExameExtraido[] {
  if (!fs.existsSync(caminho)) {
    return [];
  }

  const conteudo = fs.readFileSync(caminho, 'utf-8');
  const linhas = conteudo.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  
  if (linhas.length < 2) return [];

  const exames: ExameExtraido[] = [];
  
  // Pular cabeçalho
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(',').map(v => v.replace(/^"|"$/g, ''));
    
    if (valores.length >= 9) {
      exames.push({
        paciente: valores[0],
        nome_exame: valores[1],
        resultado: valores[2],
        unidade: valores[3],
        valor_referencia: valores[4],
        data_coleta: valores[5],
        laboratorio: valores[6],
        alterado: valores[7] === 'SIM',
        arquivo_origem: valores[8]
      });
    }
  }

  return exames;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Logger com níveis e formatação
 */
export class Logger {
  private nivel: 'debug' | 'info' | 'warn' | 'error';
  private prefixo: string;

  constructor(prefixo: string = 'GORGEN', nivel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.prefixo = prefixo;
    this.nivel = nivel;
  }

  private formatarMensagem(nivel: string, mensagem: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefixo}] [${nivel}] ${mensagem}`;
  }

  debug(mensagem: string): void {
    if (this.nivel === 'debug') {
      console.log(this.formatarMensagem('DEBUG', mensagem));
    }
  }

  info(mensagem: string): void {
    if (['debug', 'info'].includes(this.nivel)) {
      console.log(this.formatarMensagem('INFO', mensagem));
    }
  }

  warn(mensagem: string): void {
    if (['debug', 'info', 'warn'].includes(this.nivel)) {
      console.warn(this.formatarMensagem('WARN', mensagem));
    }
  }

  error(mensagem: string): void {
    console.error(this.formatarMensagem('ERROR', mensagem));
  }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  lerPDF,
  lerPDFsDiretorio,
  exportarCSV,
  exportarTabelaPivotada,
  exportarJSON,
  carregarIndicePacientes,
  salvarIndicePacientes,
  parseDateBR,
  formatDateBR,
  ordenarDatasBR,
  removerAcentos,
  normalizarEspacos,
  limparTextoComparacao,
  validarReferencia,
  parseReferencia,
  calcularEstatisticas,
  categorizarExame,
  mergeExames,
  carregarExamesCSV,
  Logger
};
