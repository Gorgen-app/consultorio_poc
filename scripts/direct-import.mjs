/**
 * Script de importação direta via conexão MySQL
 * Usa a mesma conexão do servidor Gorgen
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ler configuração do banco do arquivo .env do projeto
const envPath = path.join(__dirname, '..', '.env');
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) DATABASE_URL = match[1];
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

// Ler eventos preparados
const eventosPath = path.join(__dirname, 'eventos-para-importar.json');
const eventos = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));

console.log(`📊 Total de eventos para importar: ${eventos.length}`);

// Conectar ao banco
const connection = await mysql.createConnection(DATABASE_URL);
console.log('✅ Conectado ao banco de dados');

// Verificar quantos já existem
const [existentes] = await connection.execute(
  "SELECT COUNT(*) as count FROM agendamentos WHERE importado_de = 'google_calendar'"
);
console.log(`📋 Eventos já importados: ${existentes[0].count}`);

// Importar em lotes
const BATCH_SIZE = 50;
let importados = 0;
let duplicados = 0;
let erros = 0;

for (let i = 0; i < eventos.length; i += BATCH_SIZE) {
  const batch = eventos.slice(i, i + BATCH_SIZE);
  
  for (const e of batch) {
    try {
      // Verificar se já existe pelo google_uid
      const [existing] = await connection.execute(
        'SELECT id FROM agendamentos WHERE google_uid = ?',
        [e.uid]
      );
      
      if (existing.length > 0) {
        duplicados++;
        continue;
      }
      
      // Gerar ID de agendamento
      const year = e.dataInicio ? new Date(e.dataInicio).getFullYear() : 2024;
      const counter = 10000 + importados + duplicados + erros + 1;
      const idAgendamento = `AG-${year}-${String(counter).padStart(5, '0')}`;
      
      // Calcular data fim
      let dataFim = e.dataFim;
      if (!dataFim && e.dataInicio) {
        dataFim = new Date(new Date(e.dataInicio).getTime() + 30 * 60000).toISOString();
      }
      
      // Inserir
      await connection.execute(
        `INSERT INTO agendamentos (
          tenant_id, id_agendamento, google_uid, titulo, descricao,
          data_hora_inicio, data_hora_fim, tipo_compromisso,
          local, status, paciente_nome, cpf_paciente, telefone_paciente, email_paciente,
          convenio, importado_de, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          1,
          idAgendamento,
          e.uid,
          e.summary?.substring(0, 255) || null,
          null,
          e.dataInicio ? new Date(e.dataInicio) : null,
          dataFim ? new Date(dataFim) : null,
          e.tipoAtendimento,
          e.local || 'Consultório',
          e.status || 'Agendado',
          e.nomePaciente?.substring(0, 255) || null,
          e.cpf || null,
          e.telefone || null,
          e.email || null,
          e.convenio || null,
          'google_calendar'
        ]
      );
      
      importados++;
    } catch (error) {
      erros++;
      if (erros <= 5) {
        console.error(`❌ Erro: ${error.message}`);
      }
    }
  }
  
  // Progresso
  const progress = Math.round(((i + batch.length) / eventos.length) * 100);
  process.stdout.write(`\r📥 Progresso: ${progress}% (${importados} importados, ${duplicados} duplicados, ${erros} erros)`);
}

console.log(`\n\n✅ Importação concluída!`);
console.log(`   📥 Importados: ${importados}`);
console.log(`   🔄 Duplicados: ${duplicados}`);
console.log(`   ❌ Erros: ${erros}`);

await connection.end();
