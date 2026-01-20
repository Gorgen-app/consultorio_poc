/**
 * Módulo de Exportação para Excel
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Gera arquivos Excel (.xlsx) com dados de pacientes e atendimentos
 */

import * as XLSX from 'xlsx';
import * as db from './db';

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

/**
 * Formata uma data para exibição no Excel
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata um valor para exibição no Excel
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
 * Exporta lista de pacientes para Excel
 */
export async function exportPacientesToExcel(
  tenantId: number,
  filters?: {
    busca?: string;
    convenio?: string;
    diagnostico?: string;
    status?: string;
    cidade?: string;
    uf?: string;
  }
): Promise<Buffer> {
  // Buscar pacientes com os filtros aplicados (sem limite para exportação)
  const pacientes = await db.listPacientes(tenantId, {
    ...filters,
    limit: 50000, // Limite alto para exportação
  });
  
  // Preparar dados para o Excel
  const data = pacientes.map(paciente => {
    const row: Record<string, string | number> = {};
    for (const field of PACIENTE_FIELDS) {
      const header = PACIENTE_HEADERS[field] || field;
      row[header] = formatValue(paciente[field], field);
    }
    return row;
  });
  
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
 * Exporta lista de atendimentos para Excel
 */
export async function exportAtendimentosToExcel(
  tenantId: number,
  filters?: {
    pacienteId?: number;
    dataInicio?: Date;
    dataFim?: Date;
    tipo?: string;
    convenio?: string;
  }
): Promise<Buffer> {
  // Buscar atendimentos com os filtros aplicados
  const atendimentos = await db.listAtendimentos(tenantId, {
    ...filters,
    limit: 50000, // Limite alto para exportação
  });
  
  // Headers para atendimentos
  const ATENDIMENTO_HEADERS: Record<string, string> = {
    atendimento: 'ID Atendimento',
    dataAtendimento: 'Data',
    nomePaciente: 'Paciente',
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
  
  const ATENDIMENTO_FIELDS = Object.keys(ATENDIMENTO_HEADERS);
  
  // Preparar dados para o Excel
  const data = atendimentos.map(atd => {
    const row: Record<string, string | number> = {};
    for (const field of ATENDIMENTO_FIELDS) {
      const header = ATENDIMENTO_HEADERS[field];
      let value = atd[field];
      
      // Tratar nome do paciente que vem do join
      if (field === 'nomePaciente' && atd.pacientes?.nome) {
        value = atd.pacientes.nome;
      }
      
      // Tratar booleanos
      if (field === 'pagamentoEfetivado') {
        value = value ? 'Sim' : 'Não';
      }
      
      row[header] = formatValue(value, field);
    }
    return row;
  });
  
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas
  const colWidths = ATENDIMENTO_FIELDS.map(field => {
    const header = ATENDIMENTO_HEADERS[field];
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
 * Gera nome do arquivo com timestamp
 */
export function generateExcelFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.xlsx`;
}
