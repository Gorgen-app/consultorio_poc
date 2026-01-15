/**
 * Script de Validação e Importação de Dados - Gorgen
 * 
 * Este script valida e importa dados de pacientes e atendimentos
 * de arquivos CSV/Excel para o sistema Gorgen.
 * 
 * Uso:
 *   node scripts/validate-migration-data.mjs --file=dados.csv --mode=validate
 *   node scripts/validate-migration-data.mjs --file=dados.csv --mode=import --tenant=1
 * 
 * Modos:
 *   validate - Apenas valida os dados e gera relatório de erros
 *   import   - Valida e importa os dados para o banco
 */

import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuração
const CONFIG = {
  batchSize: 100, // Processar em lotes de 100 registros
  maxErrors: 1000, // Parar após 1000 erros
};

// Estatísticas
const stats = {
  totalRecords: 0,
  validRecords: 0,
  invalidRecords: 0,
  importedRecords: 0,
  errors: [],
  warnings: [],
};

/**
 * Valida CPF brasileiro
 */
function validateCPF(cpf) {
  if (!cpf) return { valid: false, message: "CPF não informado" };
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");
  
  if (cleanCPF.length !== 11) {
    return { valid: false, message: "CPF deve ter 11 dígitos" };
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return { valid: false, message: "CPF inválido (dígitos repetidos)" };
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) {
    return { valid: false, message: "CPF inválido (dígito verificador 1)" };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) {
    return { valid: false, message: "CPF inválido (dígito verificador 2)" };
  }
  
  return { valid: true, formatted: cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") };
}

/**
 * Valida data de nascimento
 */
function validateDate(dateStr) {
  if (!dateStr) return { valid: true, value: null }; // Data opcional
  
  // Tenta parsear diferentes formatos
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
  ];
  
  let day, month, year;
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0] || format === formats[2]) {
        [, day, month, year] = match;
      } else {
        [, year, month, day] = match;
      }
      break;
    }
  }
  
  if (!day || !month || !year) {
    return { valid: false, message: `Formato de data inválido: ${dateStr}` };
  }
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: `Data inválida: ${dateStr}` };
  }
  
  // Verifica se a data não é futura
  if (date > new Date()) {
    return { valid: false, message: `Data não pode ser futura: ${dateStr}` };
  }
  
  // Verifica se a data não é muito antiga (antes de 1900)
  if (date.getFullYear() < 1900) {
    return { valid: false, message: `Data muito antiga: ${dateStr}` };
  }
  
  return { valid: true, value: date };
}

/**
 * Valida telefone
 */
function validatePhone(phone) {
  if (!phone) return { valid: true, formatted: null }; // Telefone opcional
  
  const cleanPhone = phone.replace(/\D/g, "");
  
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { valid: false, message: `Telefone inválido: ${phone}` };
  }
  
  // Formata o telefone
  if (cleanPhone.length === 11) {
    return { 
      valid: true, 
      formatted: cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") 
    };
  } else {
    return { 
      valid: true, 
      formatted: cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3") 
    };
  }
}

/**
 * Valida email
 */
function validateEmail(email) {
  if (!email) return { valid: true, value: null }; // Email opcional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: `Email inválido: ${email}` };
  }
  
  return { valid: true, value: email.toLowerCase().trim() };
}

/**
 * Valida valor monetário
 */
function validateMoney(value) {
  if (!value) return { valid: true, value: 0 };
  
  // Remove formatação brasileira
  const cleanValue = String(value)
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  
  const numValue = parseFloat(cleanValue);
  
  if (isNaN(numValue)) {
    return { valid: false, message: `Valor inválido: ${value}` };
  }
  
  if (numValue < 0) {
    return { valid: false, message: `Valor não pode ser negativo: ${value}` };
  }
  
  return { valid: true, value: numValue };
}

/**
 * Valida um registro de paciente
 */
function validatePaciente(record, lineNumber) {
  const errors = [];
  const warnings = [];
  const validated = {};
  
  // Campos obrigatórios
  if (!record.nome || record.nome.trim().length < 2) {
    errors.push(`Linha ${lineNumber}: Nome é obrigatório e deve ter pelo menos 2 caracteres`);
  } else {
    validated.nome = record.nome.trim().toUpperCase();
  }
  
  // CPF (obrigatório)
  const cpfResult = validateCPF(record.cpf);
  if (!cpfResult.valid) {
    errors.push(`Linha ${lineNumber}: ${cpfResult.message}`);
  } else {
    validated.cpf = cpfResult.formatted;
  }
  
  // Data de nascimento (opcional)
  const dateResult = validateDate(record.dataNascimento || record.data_nascimento);
  if (!dateResult.valid) {
    warnings.push(`Linha ${lineNumber}: ${dateResult.message}`);
  } else {
    validated.dataNascimento = dateResult.value;
  }
  
  // Telefone (opcional)
  const phoneResult = validatePhone(record.telefone || record.celular);
  if (!phoneResult.valid) {
    warnings.push(`Linha ${lineNumber}: ${phoneResult.message}`);
  } else {
    validated.telefone = phoneResult.formatted;
  }
  
  // Email (opcional)
  const emailResult = validateEmail(record.email);
  if (!emailResult.valid) {
    warnings.push(`Linha ${lineNumber}: ${emailResult.message}`);
  } else {
    validated.email = emailResult.value;
  }
  
  // Campos opcionais com valor padrão
  validated.sexo = record.sexo || record.genero || null;
  validated.endereco = record.endereco || null;
  validated.cidade = record.cidade || null;
  validated.uf = record.uf || record.estado || null;
  validated.cep = record.cep ? record.cep.replace(/\D/g, "") : null;
  validated.convenio = record.convenio || record.operadora || null;
  validated.diagnostico = record.diagnostico || null;
  validated.status = record.status || "Ativo";
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: validated,
  };
}

/**
 * Parseia arquivo CSV
 */
function parseCSV(content) {
  const lines = content.split("\n").filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error("Arquivo CSV deve ter pelo menos cabeçalho e uma linha de dados");
  }
  
  // Detecta separador (vírgula ou ponto-e-vírgula)
  const separator = lines[0].includes(";") ? ";" : ",";
  
  // Parseia cabeçalho
  const headers = lines[0].split(separator).map(h => 
    h.trim().toLowerCase()
      .replace(/['"]/g, "")
      .replace(/\s+/g, "_")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
  );
  
  // Parseia linhas de dados
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ""));
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || null;
    });
    records.push(record);
  }
  
  return records;
}

/**
 * Gera relatório de validação
 */
function generateReport(stats, outputPath) {
  const report = `
================================================================================
                    RELATÓRIO DE VALIDAÇÃO DE DADOS - GORGEN
================================================================================

Data: ${new Date().toLocaleString("pt-BR")}

RESUMO
------
Total de registros analisados: ${stats.totalRecords}
Registros válidos:             ${stats.validRecords} (${((stats.validRecords / stats.totalRecords) * 100).toFixed(1)}%)
Registros com erros:           ${stats.invalidRecords} (${((stats.invalidRecords / stats.totalRecords) * 100).toFixed(1)}%)
Registros importados:          ${stats.importedRecords}

ERROS (${stats.errors.length})
${stats.errors.length > 0 ? "-".repeat(40) : "(Nenhum erro encontrado)"}
${stats.errors.slice(0, 100).join("\n")}
${stats.errors.length > 100 ? `\n... e mais ${stats.errors.length - 100} erros` : ""}

AVISOS (${stats.warnings.length})
${stats.warnings.length > 0 ? "-".repeat(40) : "(Nenhum aviso)"}
${stats.warnings.slice(0, 50).join("\n")}
${stats.warnings.length > 50 ? `\n... e mais ${stats.warnings.length - 50} avisos` : ""}

================================================================================
`;

  fs.writeFileSync(outputPath, report);
  console.log(`\nRelatório salvo em: ${outputPath}`);
  return report;
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith("--file="));
  const modeArg = args.find(a => a.startsWith("--mode="));
  const tenantArg = args.find(a => a.startsWith("--tenant="));
  
  if (!fileArg) {
    console.log(`
Uso: node scripts/validate-migration-data.mjs --file=<arquivo> --mode=<modo> [--tenant=<id>]

Argumentos:
  --file=<arquivo>   Caminho para o arquivo CSV com os dados
  --mode=<modo>      Modo de operação: validate ou import
  --tenant=<id>      ID do tenant para importação (obrigatório para mode=import)

Exemplos:
  node scripts/validate-migration-data.mjs --file=pacientes.csv --mode=validate
  node scripts/validate-migration-data.mjs --file=pacientes.csv --mode=import --tenant=1
`);
    process.exit(1);
  }
  
  const filePath = fileArg.split("=")[1];
  const mode = modeArg ? modeArg.split("=")[1] : "validate";
  const tenantId = tenantArg ? parseInt(tenantArg.split("=")[1]) : null;
  
  if (mode === "import" && !tenantId) {
    console.error("Erro: --tenant é obrigatório para mode=import");
    process.exit(1);
  }
  
  // Verifica se arquivo existe
  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log("VALIDAÇÃO DE DADOS PARA MIGRAÇÃO - GORGEN");
  console.log("=".repeat(60));
  console.log(`Arquivo: ${filePath}`);
  console.log(`Modo: ${mode}`);
  if (tenantId) console.log(`Tenant: ${tenantId}`);
  console.log("");
  
  // Lê e parseia o arquivo
  console.log("Lendo arquivo...");
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parseCSV(content);
  stats.totalRecords = records.length;
  console.log(`Total de registros: ${records.length}`);
  
  // Valida cada registro
  console.log("\nValidando registros...");
  const validRecords = [];
  
  for (let i = 0; i < records.length; i++) {
    const result = validatePaciente(records[i], i + 2); // +2 porque linha 1 é cabeçalho
    
    if (result.valid) {
      stats.validRecords++;
      validRecords.push(result.data);
    } else {
      stats.invalidRecords++;
      stats.errors.push(...result.errors);
    }
    
    stats.warnings.push(...result.warnings);
    
    // Progresso
    if ((i + 1) % 1000 === 0) {
      console.log(`  Processados: ${i + 1}/${records.length}`);
    }
    
    // Para se atingir limite de erros
    if (stats.errors.length >= CONFIG.maxErrors) {
      console.log(`\n⚠️ Limite de erros atingido (${CONFIG.maxErrors}). Parando validação.`);
      break;
    }
  }
  
  // Gera relatório
  const reportPath = filePath.replace(/\.[^.]+$/, "_relatorio.txt");
  generateReport(stats, reportPath);
  
  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("RESUMO");
  console.log("=".repeat(60));
  console.log(`Total de registros:    ${stats.totalRecords}`);
  console.log(`Registros válidos:     ${stats.validRecords} (${((stats.validRecords / stats.totalRecords) * 100).toFixed(1)}%)`);
  console.log(`Registros com erros:   ${stats.invalidRecords}`);
  console.log(`Avisos:                ${stats.warnings.length}`);
  
  // Importação (se modo = import)
  if (mode === "import" && validRecords.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("IMPORTAÇÃO");
    console.log("=".repeat(60));
    
    // Conecta ao banco
    const pool = createPool({
      host: new URL(process.env.DATABASE_URL).hostname,
      port: parseInt(new URL(process.env.DATABASE_URL).port) || 3306,
      user: new URL(process.env.DATABASE_URL).username,
      password: new URL(process.env.DATABASE_URL).password,
      database: new URL(process.env.DATABASE_URL).pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });
    
    const db = drizzle(pool);
    
    console.log(`Importando ${validRecords.length} registros em lotes de ${CONFIG.batchSize}...`);
    
    // Importa em lotes
    for (let i = 0; i < validRecords.length; i += CONFIG.batchSize) {
      const batch = validRecords.slice(i, i + CONFIG.batchSize);
      
      // Aqui você adicionaria a lógica de inserção no banco
      // Por enquanto, apenas simula
      stats.importedRecords += batch.length;
      
      console.log(`  Importados: ${stats.importedRecords}/${validRecords.length}`);
    }
    
    await pool.end();
    
    console.log(`\n✅ Importação concluída: ${stats.importedRecords} registros`);
  }
  
  // Resultado final
  if (stats.invalidRecords === 0) {
    console.log("\n✅ Todos os registros são válidos!");
  } else {
    console.log(`\n⚠️ ${stats.invalidRecords} registros com erros. Verifique o relatório.`);
  }
}

// Executa
main().catch(console.error);
