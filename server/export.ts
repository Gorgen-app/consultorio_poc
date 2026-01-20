/**
 * Módulo de Exportação Multi-formato
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Gera arquivos Excel (.xlsx), CSV (.csv) e PDF (.pdf) com dados de pacientes e atendimentos
 */

import * as XLSX from 'xlsx';
import * as db from './db';
import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';

// Mapeamento de campos para nomes amigáveis em português
const PACIENTE_HEADERS: Record<string, string> = {
  id: 'ID Sistema',
  idPaciente: 'ID Paciente',
  nome: 'Nome Completo',
  dataNascimento: 'Data de Nascimento',
  idade: 'Idade',
  sexo: 'Sexo',
  cpf: 'CPF',
  nomeMae: 'Nome da Mãe',
  email: 'E-mail',
  telefone: 'Telefone',
  endereco: 'Endereço',
  bairro: 'Bairro',
  cep: 'CEP',
  cidade: 'Cidade',
  uf: 'UF',
  pais: 'País',
  operadora1: 'Convênio 1',
  planoModalidade1: 'Plano/Modalidade 1',
  matriculaConvenio1: 'Matrícula Convênio 1',
  vigente1: 'Vigente 1',
  operadora2: 'Convênio 2',
  planoModalidade2: 'Plano/Modalidade 2',
  matriculaConvenio2: 'Matrícula Convênio 2',
  vigente2: 'Vigente 2',
  statusCaso: 'Status do Caso',
  grupoDiagnostico: 'Grupo Diagnóstico',
  diagnosticoEspecifico: 'Diagnóstico Específico',
  dataInclusao: 'Data de Inclusão',
  createdAt: 'Criado em',
};

// Campos a serem exportados (ordem de exibição)
const PACIENTE_FIELDS = [
  'idPaciente',
  'nome',
  'dataNascimento',
  'idade',
  'sexo',
  'cpf',
  'telefone',
  'email',
  'cidade',
  'uf',
  'operadora1',
  'planoModalidade1',
  'statusCaso',
  'grupoDiagnostico',
  'diagnosticoEspecifico',
  'dataInclusao',
];

// Campos reduzidos para PDF (cabe melhor na página)
const PACIENTE_FIELDS_PDF = [
  'idPaciente',
  'nome',
  'idade',
  'sexo',
  'telefone',
  'cidade',
  'uf',
  'operadora1',
  'statusCaso',
];

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

interface ExportFilters {
  busca?: string;
  convenio?: string;
  diagnostico?: string;
  status?: string;
  cidade?: string;
  uf?: string;
}

/**
 * Formata uma data para exibição
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata um valor para exibição
 */
function formatValue(value: any, field: string): string | number {
  if (value === null || value === undefined) return '';
  
  // Campos de data
  if (field.includes('data') || field.includes('Data') || field === 'createdAt') {
    return formatDate(value);
  }
  
  // Campos numéricos
  if (field === 'idade' || field === 'id') {
    return typeof value === 'number' ? value : '';
  }
  
  // Campos de sexo
  if (field === 'sexo') {
    switch (value) {
      case 'M': return 'Masculino';
      case 'F': return 'Feminino';
      default: return value;
    }
  }
  
  return String(value);
}

/**
 * Busca pacientes com filtros
 */
async function fetchPacientes(tenantId: number, filters?: ExportFilters) {
  return await db.listPacientes(tenantId, {
    ...filters,
    limit: 50000, // Limite alto para exportação
  });
}

/**
 * Prepara dados formatados para exportação
 */
function prepareData(pacientes: any[], fields: string[]) {
  return pacientes.map(paciente => {
    const row: Record<string, string | number> = {};
    for (const field of fields) {
      const header = PACIENTE_HEADERS[field] || field;
      row[header] = formatValue(paciente[field], field);
    }
    return row;
  });
}

/**
 * Exporta lista de pacientes para Excel (.xlsx)
 */
export async function exportPacientesToExcel(
  tenantId: number,
  filters?: ExportFilters
): Promise<Buffer> {
  const pacientes = await fetchPacientes(tenantId, filters);
  const data = prepareData(pacientes, PACIENTE_FIELDS);
  
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas
  const colWidths = PACIENTE_FIELDS.map(field => {
    const header = PACIENTE_HEADERS[field] || field;
    const maxLen = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
  
  // Gerar buffer do arquivo
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Exporta lista de pacientes para CSV
 */
export async function exportPacientesToCSV(
  tenantId: number,
  filters?: ExportFilters
): Promise<Buffer> {
  const pacientes = await fetchPacientes(tenantId, filters);
  const data = prepareData(pacientes, PACIENTE_FIELDS);
  
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
  
  // Gerar CSV com BOM para UTF-8
  const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ';' }); // Usar ponto-e-vírgula para compatibilidade com Excel brasileiro
  const bom = '\uFEFF'; // BOM para UTF-8
  const buffer = Buffer.from(bom + csvContent, 'utf-8');
  
  return buffer;
}

/**
 * Exporta lista de pacientes para PDF
 */
export async function exportPacientesToPDF(
  tenantId: number,
  filters?: ExportFilters
): Promise<Buffer> {
  const pacientes = await fetchPacientes(tenantId, filters);
  const data = prepareData(pacientes, PACIENTE_FIELDS_PDF);
  
  // Gerar HTML para o PDF
  const headers = PACIENTE_FIELDS_PDF.map(f => PACIENTE_HEADERS[f] || f);
  
  const now = new Date();
  const dataGeracao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
  
  // Construir filtros aplicados para exibição
  const filtrosAplicados: string[] = [];
  if (filters?.busca) filtrosAplicados.push(`Busca: "${filters.busca}"`);
  if (filters?.convenio) filtrosAplicados.push(`Convênio: ${filters.convenio}`);
  if (filters?.diagnostico) filtrosAplicados.push(`Diagnóstico: ${filters.diagnostico}`);
  if (filters?.status) filtrosAplicados.push(`Status: ${filters.status}`);
  if (filters?.cidade) filtrosAplicados.push(`Cidade: ${filters.cidade}`);
  if (filters?.uf) filtrosAplicados.push(`UF: ${filters.uf}`);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Pacientes - Gorgen</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 9px;
      color: #333;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0056A4;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #0056A4;
      font-size: 18px;
      margin: 0;
    }
    .header .info {
      text-align: right;
      font-size: 8px;
      color: #666;
    }
    .filters {
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 8px;
    }
    .filters strong {
      color: #0056A4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    th {
      background: #0056A4;
      color: white;
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    td {
      padding: 5px 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 8px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .total {
      font-weight: bold;
      color: #0056A4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GORGEN - Relatório de Pacientes</h1>
    <div class="info">
      <div>Gerado em: ${dataGeracao}</div>
      <div class="total">Total: ${pacientes.length} pacientes</div>
    </div>
  </div>
  
  ${filtrosAplicados.length > 0 ? `
  <div class="filters">
    <strong>Filtros aplicados:</strong> ${filtrosAplicados.join(' | ')}
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <div>Gorgen - Aplicativo de Gestão em Saúde</div>
    <div>Documento gerado automaticamente - Uso interno</div>
  </div>
</body>
</html>
  `;
  
  // Converter HTML para PDF usando Puppeteer
  try {
    // Encontrar o caminho do Chromium instalado
    let chromiumPath = '/usr/bin/chromium-browser';
    try {
      chromiumPath = execSync('which chromium-browser || which chromium || which google-chrome', { encoding: 'utf-8' }).trim();
    } catch {
      // Usar caminho padrão
    }
    
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });
    
    await browser.close();
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    // Fallback: retornar HTML se PDF falhar
    return Buffer.from(html, 'utf-8');
  }
}

/**
 * Exporta pacientes no formato especificado
 */
export async function exportPacientes(
  tenantId: number,
  format: ExportFormat,
  filters?: ExportFilters
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  switch (format) {
    case 'xlsx':
      return {
        buffer: await exportPacientesToExcel(tenantId, filters),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    case 'csv':
      return {
        buffer: await exportPacientesToCSV(tenantId, filters),
        mimeType: 'text/csv; charset=utf-8',
        extension: 'csv',
      };
    case 'pdf':
      return {
        buffer: await exportPacientesToPDF(tenantId, filters),
        mimeType: 'application/pdf',
        extension: 'pdf',
      };
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}

/**
 * Gera nome do arquivo com timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

// Re-exportar funções do módulo antigo para compatibilidade
export { exportPacientesToExcel as exportPacientesToExcelLegacy };


// ============================================================================
// EXPORTAÇÃO DE ATENDIMENTOS
// ============================================================================

// Mapeamento de campos de atendimentos para nomes amigáveis em português
const ATENDIMENTO_HEADERS: Record<string, string> = {
  atendimento: 'ID Atendimento',
  dataAtendimento: 'Data',
  nomePaciente: 'Paciente',
  idPaciente: 'ID Paciente',
  tipoAtendimento: 'Tipo',
  procedimento: 'Procedimento',
  local: 'Local',
  convenio: 'Convênio',
  planoConvenio: 'Plano',
  faturamentoPrevistoFinal: 'Valor Previsto',
  pagamentoEfetivado: 'Pago',
  dataPagamento: 'Data Pagamento',
  observacoes: 'Observações',
};

// Campos a serem exportados para atendimentos
const ATENDIMENTO_FIELDS = [
  'atendimento',
  'dataAtendimento',
  'nomePaciente',
  'idPaciente',
  'tipoAtendimento',
  'procedimento',
  'local',
  'convenio',
  'planoConvenio',
  'faturamentoPrevistoFinal',
  'pagamentoEfetivado',
  'dataPagamento',
  'observacoes',
];

// Campos reduzidos para PDF de atendimentos
const ATENDIMENTO_FIELDS_PDF = [
  'atendimento',
  'dataAtendimento',
  'nomePaciente',
  'tipoAtendimento',
  'procedimento',
  'convenio',
  'faturamentoPrevistoFinal',
  'pagamentoEfetivado',
];

interface AtendimentoExportFilters {
  pacienteId?: number;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  tipo?: string;
  convenio?: string;
  local?: string;
  pagamentoEfetivado?: boolean;
}

/**
 * Busca atendimentos com filtros para exportação
 */
async function fetchAtendimentos(tenantId: number, filters?: AtendimentoExportFilters) {
  return await db.listAtendimentos(tenantId, {
    ...filters,
    dataInicio: filters?.dataInicio ? new Date(filters.dataInicio) : undefined,
    dataFim: filters?.dataFim ? new Date(filters.dataFim) : undefined,
    limit: 50000, // Limite alto para exportação
  });
}

/**
 * Prepara dados de atendimentos formatados para exportação
 */
function prepareAtendimentoData(atendimentos: any[], fields: string[]) {
  return atendimentos.map(atd => {
    const row: Record<string, string | number> = {};
    for (const field of fields) {
      const header = ATENDIMENTO_HEADERS[field] || field;
      let value = atd[field];
      
      // Tratar nome do paciente que vem do join
      if (field === 'nomePaciente') {
        value = atd.pacientes?.nome || atd.nomePaciente || '';
      }
      
      // Tratar ID do paciente
      if (field === 'idPaciente') {
        value = atd.pacientes?.idPaciente || atd.idPaciente || '';
      }
      
      // Tratar booleanos
      if (field === 'pagamentoEfetivado') {
        value = value ? 'Sim' : 'Não';
      }
      
      // Tratar valores monetários
      if (field === 'faturamentoPrevistoFinal' && typeof value === 'number') {
        row[header] = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        continue;
      }
      
      row[header] = formatValue(value, field);
    }
    return row;
  });
}

/**
 * Exporta lista de atendimentos para Excel (.xlsx)
 */
export async function exportAtendimentosToExcel(
  tenantId: number,
  filters?: AtendimentoExportFilters
): Promise<Buffer> {
  const atendimentos = await fetchAtendimentos(tenantId, filters);
  const data = prepareAtendimentoData(atendimentos, ATENDIMENTO_FIELDS);
  
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas
  const colWidths = ATENDIMENTO_FIELDS.map(field => {
    const header = ATENDIMENTO_HEADERS[field] || field;
    const maxLen = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Atendimentos');
  
  // Gerar buffer do arquivo
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Exporta lista de atendimentos para CSV
 */
export async function exportAtendimentosToCSV(
  tenantId: number,
  filters?: AtendimentoExportFilters
): Promise<Buffer> {
  const atendimentos = await fetchAtendimentos(tenantId, filters);
  const data = prepareAtendimentoData(atendimentos, ATENDIMENTO_FIELDS);
  
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Atendimentos');
  
  // Gerar CSV com BOM para UTF-8
  const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
  const bom = '\uFEFF';
  const buffer = Buffer.from(bom + csvContent, 'utf-8');
  
  return buffer;
}

/**
 * Exporta lista de atendimentos para PDF
 */
export async function exportAtendimentosToPDF(
  tenantId: number,
  filters?: AtendimentoExportFilters
): Promise<Buffer> {
  const atendimentos = await fetchAtendimentos(tenantId, filters);
  const data = prepareAtendimentoData(atendimentos, ATENDIMENTO_FIELDS_PDF);
  
  // Gerar HTML para o PDF
  const headers = ATENDIMENTO_FIELDS_PDF.map(f => ATENDIMENTO_HEADERS[f] || f);
  
  const now = new Date();
  const dataGeracao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
  
  // Construir filtros aplicados para exibição
  const filtrosAplicados: string[] = [];
  if (filters?.dataInicio) filtrosAplicados.push(`Data início: ${formatDate(filters.dataInicio)}`);
  if (filters?.dataFim) filtrosAplicados.push(`Data fim: ${formatDate(filters.dataFim)}`);
  if (filters?.tipo) filtrosAplicados.push(`Tipo: ${filters.tipo}`);
  if (filters?.convenio) filtrosAplicados.push(`Convênio: ${filters.convenio}`);
  if (filters?.local) filtrosAplicados.push(`Local: ${filters.local}`);
  if (filters?.pagamentoEfetivado !== undefined) {
    filtrosAplicados.push(`Pagamento: ${filters.pagamentoEfetivado ? 'Efetivado' : 'Pendente'}`);
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Atendimentos - Gorgen</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 9px;
      color: #333;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0056A4;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #0056A4;
      font-size: 18px;
      margin: 0;
    }
    .header .info {
      text-align: right;
      font-size: 8px;
      color: #666;
    }
    .filters {
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 8px;
    }
    .filters strong {
      color: #0056A4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    th {
      background: #0056A4;
      color: white;
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    td {
      padding: 5px 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 8px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .total {
      font-weight: bold;
      color: #0056A4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GORGEN - Relatório de Atendimentos</h1>
    <div class="info">
      <div>Gerado em: ${dataGeracao}</div>
      <div class="total">Total: ${atendimentos.length} atendimentos</div>
    </div>
  </div>
  
  ${filtrosAplicados.length > 0 ? `
  <div class="filters">
    <strong>Filtros aplicados:</strong> ${filtrosAplicados.join(' | ')}
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <div>Gorgen - Aplicativo de Gestão em Saúde</div>
    <div>Documento gerado automaticamente - Uso interno</div>
  </div>
</body>
</html>
  `;
  
  // Converter HTML para PDF usando Puppeteer
  try {
    let chromiumPath = '/usr/bin/chromium-browser';
    try {
      chromiumPath = execSync('which chromium-browser || which chromium || which google-chrome', { encoding: 'utf-8' }).trim();
    } catch {
      // Usar caminho padrão
    }
    
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });
    
    await browser.close();
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF de atendimentos:', error);
    return Buffer.from(html, 'utf-8');
  }
}

/**
 * Exporta atendimentos no formato especificado
 */
export async function exportAtendimentos(
  tenantId: number,
  format: ExportFormat,
  filters?: AtendimentoExportFilters
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  switch (format) {
    case 'xlsx':
      return {
        buffer: await exportAtendimentosToExcel(tenantId, filters),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    case 'csv':
      return {
        buffer: await exportAtendimentosToCSV(tenantId, filters),
        mimeType: 'text/csv; charset=utf-8',
        extension: 'csv',
      };
    case 'pdf':
      return {
        buffer: await exportAtendimentosToPDF(tenantId, filters),
        mimeType: 'application/pdf',
        extension: 'pdf',
      };
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}
