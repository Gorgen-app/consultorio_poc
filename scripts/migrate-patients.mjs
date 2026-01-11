/**
 * GORGEN - Script de Migração de Pacientes
 * 
 * Este script importa pacientes da planilha Excel para o banco de dados do Gorgen.
 * Inclui validações, tratamento de duplicatas e geração de relatório.
 * 
 * Uso: node scripts/migrate-patients.mjs [--dry-run] [--limit=N]
 * 
 * Opções:
 *   --dry-run    Simula a migração sem inserir dados
 *   --limit=N    Limita a N registros (para testes)
 *   --skip=N     Pula os primeiros N registros
 */

import XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  // Arquivo de entrada
  inputFile: '/home/ubuntu/consultorio_poc/data/22kpacientes.xlsx',
  
  // Arquivo de relatório
  reportFile: '/home/ubuntu/consultorio_poc/data/migration_report.json',
  
  // Tenant ID padrão
  tenantId: 1,
  
  // Batch size para inserções
  batchSize: 100,
  
  // Range de datas válidas
  minDate: new Date('1900-01-01'),
  maxDate: new Date('2025-12-31'),
};

// ============================================
// MAPEAMENTO DE CONVÊNIOS
// ============================================

const CONVENIO_MAP = {
  'UNIMED': 'UNIMED',
  'Particular': 'Particular',
  'IPE': 'IPE',
  'IPE-SAUDE': 'IPE',
  'BRADESCO SAÚDE': 'BRADESCO SAÚDE',
  'CASSI': 'CASSI',
  'CABERGS': 'CABERGS',
  'SAUDE PAS': 'SAUDE PAS',
  'COOPMED': 'COOPMED',
  'CCG': 'CCG',
  'SAUDE CAIXA': 'SAUDE CAIXA',
  'ACERTO ESPECIAL': 'ACERTO ESPECIAL',
  'CAF RBS': 'CAF RBS',
  'Janssen - Gastros': 'Janssen - Gastros',
  'PESQUISA/HCPA': 'PESQUISA/HCPA',
  'GEAP': 'GEAP',
  'SULAMERICA': 'SULAMERICA',
  'ASSEFAZ': 'ASSEFAZ',
  'FUNDAÇÃO COPEL': 'FUNDAÇÃO COPEL',
  'EMBRATEL': 'EMBRATEL',
  'PETROBRAS': 'PETROBRAS',
  'CAIXA ECONÔMICA': 'CAIXA ECONÔMICA',
  'BANCO DO BRASIL': 'BANCO DO BRASIL',
  'CORREIOS': 'CORREIOS',
  'ELETROSUL': 'ELETROSUL',
  'FURNAS': 'FURNAS',
  'ITAIPU': 'ITAIPU',
  'ELETRONORTE': 'ELETRONORTE',
  'CHESF': 'CHESF',
  'ELETROBRAS': 'ELETROBRAS',
  'NUCLEP': 'NUCLEP',
  'INFRAERO': 'INFRAERO',
  'SERPRO': 'SERPRO',
  'DATAPREV': 'DATAPREV',
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida e formata CPF
 */
function validateCPF(cpf) {
  if (!cpf) return null;
  
  // Remove caracteres não numéricos
  const cleaned = String(cpf).replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return null;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return null;
  
  // Formata: XXX.XXX.XXX-XX
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida e formata data de nascimento
 */
function validateDate(dateValue) {
  if (!dateValue) return null;
  
  let date;
  
  // Se for número (Excel serial date)
  if (typeof dateValue === 'number') {
    date = new Date((dateValue - 25569) * 86400 * 1000);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    date = new Date(dateValue);
  }
  
  // Verifica se é válida
  if (isNaN(date.getTime())) return null;
  
  // Verifica range
  if (date < CONFIG.minDate || date > CONFIG.maxDate) {
    return null;
  }
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Valida e normaliza email
 */
function validateEmail(email) {
  if (!email) return null;
  
  const cleaned = String(email).trim().toLowerCase();
  
  // Regex básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(cleaned)) return null;
  
  return cleaned;
}

/**
 * Formata CEP
 */
function formatCEP(cep) {
  if (!cep) return null;
  
  const cleaned = String(cep).replace(/\D/g, '');
  
  if (cleaned.length !== 8) return String(cep).trim();
  
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Normaliza sexo
 */
function normalizeSexo(sexo) {
  if (!sexo) return null;
  
  const s = String(sexo).toUpperCase().trim();
  
  if (s === 'M' || s === 'MASCULINO') return 'M';
  if (s === 'F' || s === 'FEMININO') return 'F';
  
  return 'Outro';
}

/**
 * Gera ID do paciente no formato YYYY-NNNNNNN
 */
function generatePatientId(index) {
  const year = new Date().getFullYear();
  const seq = String(index).padStart(7, '0');
  return `${year}-${seq}`;
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

/**
 * Lê e processa a planilha Excel
 */
function readExcelFile(filePath, limit = null, skip = 0) {
  console.log(`📂 Lendo arquivo: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converte para JSON
  let data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`   Total de linhas: ${data.length}`);
  
  // Filtra apenas registros com ID válido
  data = data.filter(row => row['ID paciente']);
  
  console.log(`   Registros com ID válido: ${data.length}`);
  
  // Aplica skip
  if (skip > 0) {
    data = data.slice(skip);
    console.log(`   Após skip(${skip}): ${data.length}`);
  }
  
  // Aplica limit
  if (limit) {
    data = data.slice(0, limit);
    console.log(`   Após limit(${limit}): ${data.length}`);
  }
  
  return data;
}

/**
 * Transforma uma linha da planilha em objeto do Gorgen
 */
function transformRow(row, index, existingIds) {
  const errors = [];
  const warnings = [];
  
  // Gera novo ID se necessário (evita duplicatas)
  let idPaciente = row['ID paciente'];
  if (existingIds.has(idPaciente)) {
    const newId = generatePatientId(index + 100000);
    warnings.push(`ID duplicado ${idPaciente} → ${newId}`);
    idPaciente = newId;
  }
  existingIds.add(idPaciente);
  
  // Valida data de nascimento
  const dataNascimento = validateDate(row['Data nascimento']);
  if (row['Data nascimento'] && !dataNascimento) {
    warnings.push(`Data nascimento inválida: ${row['Data nascimento']}`);
  }
  
  // Valida CPF
  const cpf = validateCPF(row['CPF']);
  if (row['CPF'] && !cpf) {
    warnings.push(`CPF inválido: ${row['CPF']}`);
  }
  
  // Valida email
  const email = validateEmail(row['E-mail']);
  if (row['E-mail'] && !email) {
    warnings.push(`Email inválido: ${row['E-mail']}`);
  }
  
  // Mapeia convênio
  const operadora1 = row['Operadora 1'];
  const convenioMapped = operadora1 ? (CONVENIO_MAP[operadora1] || operadora1) : null;
  
  // Monta objeto do paciente
  const paciente = {
    tenantId: CONFIG.tenantId,
    idPaciente: idPaciente,
    codigoLegado: row['ID paciente'], // Guarda ID original
    nome: String(row['Nome'] || '').trim(),
    dataNascimento: dataNascimento,
    sexo: normalizeSexo(row['Sexo']),
    cpf: cpf,
    nomeMae: row['Nome da mae'] ? String(row['Nome da mae']).trim() : null,
    email: email,
    telefone: row['Telefone'] ? String(row['Telefone']).trim() : null,
    endereco: row['Endereço'] ? String(row['Endereço']).trim() : null,
    bairro: row['Bairro'] ? String(row['Bairro']).trim() : null,
    cep: formatCEP(row['CEP']),
    cidade: row['Cidade'] ? String(row['Cidade']).trim() : null,
    uf: row['UF'] ? String(row['UF']).toUpperCase().trim() : null,
    pais: row['Pais'] || 'Brasil',
    operadora1: convenioMapped,
    planoModalidade1: row['Plano / Modalidade 1'] ? String(row['Plano / Modalidade 1']).trim() : null,
    matriculaConvenio1: row['Matricula convênio 1'] ? String(row['Matricula convênio 1']).trim() : null,
    vigente1: row['Vigente 1'] === true || row['Vigente 1'] === 'Sim' ? 'Sim' : 'Não',
    privativo1: row['Privativo 1'] === true || row['Privativo 1'] === 'Sim' ? 'Sim' : 'Não',
    operadora2: row['Operadora 2'] ? String(row['Operadora 2']).trim() : null,
    planoModalidade2: row['Plano / Modalidade 2'] ? String(row['Plano / Modalidade 2']).trim() : null,
    matriculaConvenio2: row['Matricula convênio 2'] ? String(row['Matricula convênio 2']).trim() : null,
    vigente2: row['Vigente 2'] === true || row['Vigente 2'] === 'Sim' ? 'Sim' : 'Não',
    privativo2: row['Privativo 2'] === true || row['Privativo 2'] === 'Sim' ? 'Sim' : 'Não',
    obitoPerda: row['Obito / Perda de seguimento'] === true ? 'Sim' : 'Não',
    statusCaso: row['Status do caso'] || 'Ativo',
  };
  
  // Validação final: nome é obrigatório
  if (!paciente.nome) {
    errors.push('Nome não informado');
  }
  
  return {
    paciente,
    errors,
    warnings,
    original: row,
  };
}

/**
 * Insere pacientes no banco em lotes
 */
async function insertBatch(connection, pacientes) {
  if (pacientes.length === 0) return 0;
  
  const columns = [
    'tenant_id', 'id_paciente', 'codigo_legado', 'nome', 'data_nascimento', 'sexo',
    'cpf', 'nome_mae', 'email', 'telefone', 'endereco', 'bairro', 'cep',
    'cidade', 'uf', 'pais', 'operadora_1', 'plano_modalidade_1', 'matricula_convenio_1',
    'vigente_1', 'privativo_1', 'operadora_2', 'plano_modalidade_2', 'matricula_convenio_2',
    'vigente_2', 'privativo_2', 'obito_perda', 'status_caso'
  ];
  
  const placeholders = pacientes.map(() => 
    `(${columns.map(() => '?').join(', ')})`
  ).join(', ');
  
  const values = pacientes.flatMap(p => [
    p.tenantId, p.idPaciente, p.codigoLegado, p.nome, p.dataNascimento, p.sexo,
    p.cpf, p.nomeMae, p.email, p.telefone, p.endereco, p.bairro, p.cep,
    p.cidade, p.uf, p.pais, p.operadora1, p.planoModalidade1, p.matriculaConvenio1,
    p.vigente1, p.privativo1, p.operadora2, p.planoModalidade2, p.matriculaConvenio2,
    p.vigente2, p.privativo2, p.obitoPerda, p.statusCaso
  ]);
  
  const sql = `INSERT INTO pacientes (${columns.join(', ')}) VALUES ${placeholders}`;
  
  const [result] = await connection.execute(sql, values);
  return result.affectedRows;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const skipArg = args.find(a => a.startsWith('--skip='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  const skip = skipArg ? parseInt(skipArg.split('=')[1]) : 0;
  
  console.log('═'.repeat(60));
  console.log('🏥 GORGEN - Migração de Pacientes');
  console.log('═'.repeat(60));
  console.log(`   Modo: ${dryRun ? '🔍 DRY-RUN (simulação)' : '🚀 PRODUÇÃO'}`);
  if (limit) console.log(`   Limite: ${limit} registros`);
  if (skip) console.log(`   Skip: ${skip} registros`);
  console.log('');
  
  // Estatísticas
  const stats = {
    total: 0,
    processed: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    startTime: new Date(),
    endTime: null,
  };
  
  let connection = null;
  
  try {
    // 1. Lê a planilha
    const rows = readExcelFile(CONFIG.inputFile, limit, skip);
    stats.total = rows.length;
    
    // 2. Conecta ao banco (se não for dry-run)
    if (!dryRun) {
      console.log('🔌 Conectando ao banco de dados...');
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'consultorio_poc',
      });
      console.log('   ✅ Conectado!\n');
    }
    
    // 3. Processa registros
    console.log('📋 Processando registros...\n');
    
    const existingIds = new Set();
    const pacientesToInsert = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const result = transformRow(row, i + 1, existingIds);
      
      stats.processed++;
      
      // Registra erros e warnings
      if (result.errors.length > 0) {
        stats.errors.push({
          row: i + 1,
          idOriginal: row['ID paciente'],
          nome: row['Nome'],
          errors: result.errors,
        });
        stats.skipped++;
        continue;
      }
      
      if (result.warnings.length > 0) {
        stats.warnings.push({
          row: i + 1,
          idOriginal: row['ID paciente'],
          nome: row['Nome'],
          warnings: result.warnings,
        });
      }
      
      pacientesToInsert.push(result.paciente);
      
      // Insere em lotes
      if (pacientesToInsert.length >= CONFIG.batchSize) {
        if (!dryRun) {
          const inserted = await insertBatch(connection, pacientesToInsert);
          stats.inserted += inserted;
        } else {
          stats.inserted += pacientesToInsert.length;
        }
        
        // Progresso
        const pct = ((stats.processed / stats.total) * 100).toFixed(1);
        process.stdout.write(`\r   Progresso: ${stats.processed}/${stats.total} (${pct}%) - Inseridos: ${stats.inserted}`);
        
        pacientesToInsert.length = 0;
      }
    }
    
    // Insere registros restantes
    if (pacientesToInsert.length > 0) {
      if (!dryRun) {
        const inserted = await insertBatch(connection, pacientesToInsert);
        stats.inserted += inserted;
      } else {
        stats.inserted += pacientesToInsert.length;
      }
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    stats.errors.push({ fatal: true, message: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  
  // Finaliza estatísticas
  stats.endTime = new Date();
  const duration = (stats.endTime - stats.startTime) / 1000;
  
  // Exibe resumo
  console.log('═'.repeat(60));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('═'.repeat(60));
  console.log(`   Total de registros: ${stats.total.toLocaleString()}`);
  console.log(`   Processados: ${stats.processed.toLocaleString()}`);
  console.log(`   Inseridos: ${stats.inserted.toLocaleString()}`);
  console.log(`   Ignorados (erros): ${stats.skipped.toLocaleString()}`);
  console.log(`   Warnings: ${stats.warnings.length.toLocaleString()}`);
  console.log(`   Duração: ${duration.toFixed(1)} segundos`);
  console.log(`   Taxa: ${(stats.processed / duration).toFixed(0)} registros/segundo`);
  console.log('');
  
  // Exibe erros
  if (stats.errors.length > 0) {
    console.log('❌ ERROS ENCONTRADOS:');
    stats.errors.slice(0, 10).forEach(e => {
      if (e.fatal) {
        console.log(`   FATAL: ${e.message}`);
      } else {
        console.log(`   Linha ${e.row}: ${e.nome} - ${e.errors.join(', ')}`);
      }
    });
    if (stats.errors.length > 10) {
      console.log(`   ... e mais ${stats.errors.length - 10} erros`);
    }
    console.log('');
  }
  
  // Exibe warnings
  if (stats.warnings.length > 0) {
    console.log('⚠️  AVISOS (primeiros 10):');
    stats.warnings.slice(0, 10).forEach(w => {
      console.log(`   Linha ${w.row}: ${w.nome} - ${w.warnings.join(', ')}`);
    });
    if (stats.warnings.length > 10) {
      console.log(`   ... e mais ${stats.warnings.length - 10} avisos`);
    }
    console.log('');
  }
  
  // Salva relatório
  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(stats, null, 2));
  console.log(`📄 Relatório salvo em: ${CONFIG.reportFile}`);
  
  console.log('═'.repeat(60));
  console.log(dryRun ? '🔍 Simulação concluída!' : '✅ Migração concluída!');
  console.log('═'.repeat(60));
}

// Executa
main().catch(console.error);
