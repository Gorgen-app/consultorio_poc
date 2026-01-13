import { getDb } from "./db";
import { sql, eq, and, gte, lte, count, desc, asc, isNull } from "drizzle-orm";
import { pacientes, atendimentos, dashboardConfigs } from "../drizzle/schema";
import { PeriodoTempo } from "../shared/metricas";

// Função auxiliar para calcular data de início baseada no período
// Retorna string no formato YYYY-MM-DD para uso em queries SQL
function calcularDataInicio(periodo: PeriodoTempo): string {
  const agora = new Date();
  let data: Date;
  
  switch (periodo) {
    case '7d':
      data = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      data = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
      data = new Date(agora);
      data.setMonth(data.getMonth() - 3);
      break;
    case '6m':
      data = new Date(agora);
      data.setMonth(data.getMonth() - 6);
      break;
    case '1a':
      data = new Date(agora);
      data.setFullYear(data.getFullYear() - 1);
      break;
    case '3a':
      data = new Date(agora);
      data.setFullYear(data.getFullYear() - 3);
      break;
    case '5a':
      data = new Date(agora);
      data.setFullYear(data.getFullYear() - 5);
      break;
    case 'todo':
    default:
      data = new Date('2000-01-01');
  }
  
  // Formatar como YYYY-MM-DD para SQL
  return data.toISOString().split('T')[0];
}

// ========================================
// MÉTRICAS DE POPULAÇÃO DE PACIENTES
// ========================================

export async function getPacientesTotalAtivos(tenantId: number) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const resultado = await db
    .select({ total: count() })
    .from(pacientes)
    .where(and(
      eq(pacientes.tenantId, tenantId),
      isNull(pacientes.deletedAt),
      eq(pacientes.statusCaso, 'Ativo')
    ));
  
  return { valor: resultado[0]?.total || 0 };
}

export async function getPacientesNovosPeriodo(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as data,
      COUNT(*) as valor
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND created_at >= ${dataInicio}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY data ASC
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ data: r.data, valor: Number(r.valor) })) };
}

export async function getPacientesDistribuicaoSexo(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(sexo, 'Não informado') as nome,
      COUNT(*) as valor
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
    GROUP BY sexo
    ORDER BY valor DESC
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ nome: r.nome, valor: Number(r.valor) })) };
}

export async function getPacientesFaixaEtaria(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      faixa_etaria as nome,
      COUNT(*) as valor
    FROM (
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) < 18 THEN '0-17 anos'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 18 AND 30 THEN '18-30 anos'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 31 AND 45 THEN '31-45 anos'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 46 AND 60 THEN '46-60 anos'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) > 60 THEN '60+ anos'
          ELSE 'Não informado'
        END as faixa_etaria
      FROM pacientes
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
    ) as sub
    GROUP BY faixa_etaria
    ORDER BY FIELD(faixa_etaria, '0-17 anos', '18-30 anos', '31-45 anos', '46-60 anos', '60+ anos', 'Não informado')
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ nome: r.nome, valor: Number(r.valor) })) };
}

export async function getPacientesDistribuicaoCidade(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(cidade, 'Não informado') as nome,
      COUNT(*) as valor
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
    GROUP BY COALESCE(cidade, 'Não informado')
    ORDER BY valor DESC
    LIMIT 10
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ nome: r.nome, valor: Number(r.valor) })) };
}

export async function getPacientesTaxaRetencao(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COUNT(DISTINCT CASE WHEN atd_count > 1 THEN p.id END) * 100.0 / 
      NULLIF(COUNT(DISTINCT p.id), 0) as taxa_retencao
    FROM pacientes p
    LEFT JOIN (
      SELECT paciente_id, COUNT(*) as atd_count
      FROM atendimentos
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND data_atendimento >= ${dataInicio}
      GROUP BY paciente_id
    ) a ON p.id = a.paciente_id
    WHERE p.tenant_id = ${tenantId}
      AND p.deleted_at IS NULL
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round(rows[0]?.taxa_retencao || 0) };
}

export async function getPacientesTempoAcompanhamento(tenantId: number) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const resultado = await db.execute(sql`
    SELECT 
      AVG(TIMESTAMPDIFF(MONTH, primeiro_atendimento, CURDATE())) / 12 as tempo_medio_anos
    FROM (
      SELECT 
        p.id,
        MIN(a.data_atendimento) as primeiro_atendimento
      FROM pacientes p
      INNER JOIN atendimentos a ON p.id = a.paciente_id AND a.tenant_id = p.tenant_id
      WHERE p.tenant_id = ${tenantId}
        AND p.deleted_at IS NULL
        AND a.deleted_at IS NULL
        AND p.status_caso = 'Ativo'
      GROUP BY p.id
    ) subquery
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round((rows[0]?.tempo_medio_anos || 0) * 10) / 10 };
}

export async function getPacientesInativos(tenantId: number) {
  const db = await getDb();
  if (!db) return { valor: 0, dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      p.id,
      p.nome,
      p.id_paciente,
      MAX(a.data_atendimento) as ultimo_atendimento,
      DATEDIFF(CURDATE(), MAX(a.data_atendimento)) as dias_sem_atendimento
    FROM pacientes p
    LEFT JOIN atendimentos a ON p.id = a.paciente_id AND a.tenant_id = p.tenant_id AND a.deleted_at IS NULL
    WHERE p.tenant_id = ${tenantId}
      AND p.deleted_at IS NULL
      AND p.status_caso = 'Ativo'
    GROUP BY p.id, p.nome, p.id_paciente
    HAVING dias_sem_atendimento > 360 OR ultimo_atendimento IS NULL
    ORDER BY dias_sem_atendimento DESC
    LIMIT 100
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: rows.length, dados: rows };
}

export async function getPacientesObitos(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      DATE_FORMAT(updated_at, '%Y-%m') as data,
      COUNT(*) as valor
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND status_caso = 'Óbito'
      AND updated_at >= ${dataInicio}
    GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
    ORDER BY data ASC
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ data: r.data, valor: Number(r.valor) })) };
}

export async function getPacientesDistribuicaoConvenio(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(operadora_1, 'Particular') as nome,
      COUNT(*) as valor
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
    GROUP BY COALESCE(operadora_1, 'Particular')
    ORDER BY valor DESC
    LIMIT 10
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { dados: rows.map(r => ({ nome: r.nome, valor: Number(r.valor) })) };
}

// ========================================
// MÉTRICAS DE ATENDIMENTOS
// ========================================

export async function getAtendimentosTotalPeriodo(tenantId: number, periodo: PeriodoTempo, subcategoria?: string) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  let query = sql`
    SELECT COUNT(*) as total
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
  `;
  
  if (subcategoria && subcategoria !== 'Todos') {
    query = sql`
      SELECT COUNT(*) as total
      FROM atendimentos
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND data_atendimento >= ${dataInicio}
        AND tipo_atendimento = ${subcategoria}
    `;
  }
  
  const resultado = await db.execute(query);
  const rows = (resultado[0] as unknown) as any[];
  return { valor: rows[0]?.total || 0 };
}

export async function getAtendimentosEvolucaoTemporal(tenantId: number, periodo: PeriodoTempo, subcategoria?: string) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  // Determinar granularidade baseada no período
  let dateFormat = '%Y-%m-%d';
  if (periodo === '1a' || periodo === '3a' || periodo === '5a' || periodo === 'todo') {
    dateFormat = '%Y-%m';
  }
  
  let query = sql`
    SELECT 
      DATE_FORMAT(data_atendimento, ${dateFormat}) as data,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY DATE_FORMAT(data_atendimento, ${dateFormat})
    ORDER BY data ASC
  `;
  
  if (subcategoria && subcategoria !== 'Todos') {
    query = sql`
      SELECT 
        DATE_FORMAT(data_atendimento, ${dateFormat}) as data,
        COUNT(*) as quantidade
      FROM atendimentos
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND data_atendimento >= ${dataInicio}
        AND tipo_atendimento = ${subcategoria}
      GROUP BY DATE_FORMAT(data_atendimento, ${dateFormat})
      ORDER BY data ASC
    `;
  }
  
  const resultado = await db.execute(query);
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosPorTipo(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(tipo_atendimento, 'Não informado') as tipo,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY tipo_atendimento
    ORDER BY quantidade DESC
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosPorLocal(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(local_atendimento, 'Não informado') as local,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY local_atendimento
    ORDER BY quantidade DESC
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosPorConvenio(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(convenio, 'Particular') as convenio,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY convenio
    ORDER BY quantidade DESC
    LIMIT 10
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosMediaDiaria(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COUNT(*) / NULLIF(COUNT(DISTINCT DATE(data_atendimento)), 0) as media_diaria
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round((rows[0]?.media_diaria || 0) * 10) / 10 };
}

export async function getAtendimentosDiaSemana(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      DAYNAME(data_atendimento) as dia_semana,
      DAYOFWEEK(data_atendimento) as dia_numero,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY DAYNAME(data_atendimento), DAYOFWEEK(data_atendimento)
    ORDER BY dia_numero
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosNovosVsRetorno(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      CASE 
        WHEN tipo_atendimento IN ('Retorno', 'Retorno Particular') THEN 'Retorno'
        ELSE 'Primeira Consulta'
      END as categoria,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY categoria
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAtendimentosProcedimentos(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(procedimento, 'Não informado') as procedimento,
      COUNT(*) as quantidade
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY procedimento
    ORDER BY quantidade DESC
    LIMIT 10
  `);
  
  return { dados: resultado[0] || [] };
}

// ========================================
// MÉTRICAS ECONÔMICO-FINANCEIRAS
// ========================================

export async function getFaturamentoTotal(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT COALESCE(SUM(faturamento_previsto_final), 0) as total
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: rows[0]?.total || 0 };
}

export async function getFaturamentoEvolucao(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  let dateFormat = '%Y-%m-%d';
  if (periodo === '1a' || periodo === '3a' || periodo === '5a' || periodo === 'todo') {
    dateFormat = '%Y-%m';
  }
  
  const resultado = await db.execute(sql`
    SELECT 
      DATE_FORMAT(data_atendimento, ${dateFormat}) as data,
      SUM(faturamento_previsto_final) as valor
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY DATE_FORMAT(data_atendimento, ${dateFormat})
    ORDER BY data ASC
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getFaturamentoPorConvenio(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(convenio, 'Particular') as convenio,
      SUM(faturamento_previsto_final) as valor
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY convenio
    ORDER BY valor DESC
    LIMIT 10
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getTicketMedio(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT AVG(faturamento_previsto_final) as ticket_medio
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
      AND faturamento_previsto_final > 0
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round(rows[0]?.ticket_medio || 0) };
}

export async function getTaxaRecebimento(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(SUM(CASE WHEN pagamento_efetivado = 1 THEN faturamento_previsto_final ELSE 0 END), 0) * 100.0 / NULLIF(SUM(faturamento_previsto_final), 0) as taxa
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round(rows[0]?.taxa || 0) };
}

export async function getGlosas(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0, dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      DATE_FORMAT(data_atendimento, '%Y-%m') as mes,
      SUM(valor_glosa) as valor
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
      AND valor_glosa > 0
    GROUP BY DATE_FORMAT(data_atendimento, '%Y-%m')
    ORDER BY mes ASC
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  const total = rows.reduce((acc: number, row: any) => acc + (row.valor || 0), 0);
  return { valor: total, dados: rows };
}

export async function getInadimplencia(tenantId: number) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const resultado = await db.execute(sql`
    SELECT COALESCE(SUM(CASE WHEN pagamento_efetivado = 0 THEN faturamento_previsto_final ELSE 0 END), 0) as inadimplencia
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND pagamento_efetivado = 0
      AND data_atendimento < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: rows[0]?.inadimplencia || 0 };
}

export async function getFaturamentoPorTipo(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(tipo_atendimento, 'Não informado') as tipo,
      SUM(faturamento_previsto_final) as valor
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
    GROUP BY tipo_atendimento
    ORDER BY valor DESC
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getPrevisaoRecebimento(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      CASE 
        WHEN DATEDIFF(data_esperada_pagamento, CURDATE()) <= 30 THEN '30 dias'
        WHEN DATEDIFF(data_esperada_pagamento, CURDATE()) <= 60 THEN '60 dias'
        WHEN DATEDIFF(data_esperada_pagamento, CURDATE()) <= 90 THEN '90 dias'
        ELSE 'Mais de 90 dias'
      END as periodo,
      SUM(CASE WHEN pagamento_efetivado = 0 THEN faturamento_previsto_final ELSE 0 END) as valor
    FROM atendimentos
    WHERE tenant_id = ${sql.raw(String(tenantId))}
      AND deleted_at IS NULL
      AND pagamento_efetivado = 0
      AND data_esperada_pagamento >= CURDATE()
    GROUP BY periodo
    ORDER BY 
      CASE periodo
        WHEN '30 dias' THEN 1
        WHEN '60 dias' THEN 2
        WHEN '90 dias' THEN 3
        ELSE 4
      END
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getComparativoMensal(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      DATE_FORMAT(data_atendimento, '%Y-%m') as mes,
      SUM(faturamento_previsto_final) as faturamento,
      COUNT(*) as atendimentos
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(data_atendimento, '%Y-%m')
    ORDER BY mes ASC
  `);
  
  return { dados: resultado[0] || [] };
}

// ========================================
// MÉTRICAS DE QUALIDADE
// ========================================

export async function getDiagnosticosFrequentes(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COALESCE(p.grupo_diagnostico, 'Não informado') as diagnostico,
      COUNT(DISTINCT a.id) as quantidade
    FROM atendimentos a
    INNER JOIN pacientes p ON a.paciente_id = p.id AND a.tenant_id = p.tenant_id
    WHERE a.tenant_id = ${tenantId}
      AND a.deleted_at IS NULL
      AND a.data_atendimento >= ${dataInicio}
    GROUP BY p.grupo_diagnostico
    ORDER BY quantidade DESC
    LIMIT 10
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getTaxaRetorno(tenantId: number, periodo: PeriodoTempo) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  const dataInicio = calcularDataInicio(periodo);
  
  const resultado = await db.execute(sql`
    SELECT 
      COUNT(CASE WHEN tipo_atendimento IN ('Retorno', 'Retorno Particular') THEN 1 END) * 100.0 /
      NULLIF(COUNT(*), 0) as taxa_retorno
    FROM atendimentos
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND data_atendimento >= ${dataInicio}
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: Math.round(rows[0]?.taxa_retorno || 0) };
}

// ========================================
// MÉTRICAS DIVERSAS
// ========================================

export async function getProximosAtendimentos(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      a.id,
      a.data_atendimento,
      p.nome as paciente,
      a.tipo_atendimento,
      a.local_atendimento
    FROM atendimentos a
    INNER JOIN pacientes p ON a.paciente_id = p.id AND a.tenant_id = p.tenant_id
    WHERE a.tenant_id = ${tenantId}
      AND a.deleted_at IS NULL
      AND a.data_atendimento >= CURDATE()
      AND a.data_atendimento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY a.data_atendimento ASC
    LIMIT 20
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAniversariantesMes(tenantId: number) {
  const db = await getDb();
  if (!db) return { dados: [] };
  
  const resultado = await db.execute(sql`
    SELECT 
      id,
      nome,
      data_nascimento,
      telefone,
      DAY(data_nascimento) as dia
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND status_caso = 'Ativo'
      AND MONTH(data_nascimento) = MONTH(CURDATE())
    ORDER BY DAY(data_nascimento) ASC
    LIMIT 50
  `);
  
  return { dados: resultado[0] || [] };
}

export async function getAlertasPendentes(tenantId: number) {
  const db = await getDb();
  if (!db) return { valor: 0 };
  
  // Contar pacientes inativos + documentos pendentes + pagamentos atrasados
  const resultado = await db.execute(sql`
    SELECT 
      (
        SELECT COUNT(*) FROM pacientes p
        LEFT JOIN (
          SELECT paciente_id, MAX(data_atendimento) as ultimo
          FROM atendimentos WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
          GROUP BY paciente_id
        ) a ON p.id = a.paciente_id
        WHERE p.tenant_id = ${tenantId}
          AND p.deleted_at IS NULL
          AND p.status_caso = 'Ativo'
          AND (a.ultimo IS NULL OR DATEDIFF(CURDATE(), a.ultimo) > 360)
      ) +
      (
        SELECT COUNT(*) FROM atendimentos
        WHERE tenant_id = ${tenantId}
          AND deleted_at IS NULL
          AND pagamento_efetivado = 0
          AND data_atendimento < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ) as total_alertas
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  return { valor: rows[0]?.total_alertas || 0 };
}

// ========================================
// CONFIGURAÇÃO DO DASHBOARD
// ========================================

export async function getDashboardConfig(tenantId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const resultado = await db
    .select()
    .from(dashboardConfigs)
    .where(and(
      eq(dashboardConfigs.tenantId, tenantId),
      eq(dashboardConfigs.userId, userId)
    ))
    .limit(1);
  
  return resultado[0] || null;
}

export async function saveDashboardConfig(
  tenantId: number,
  userId: number,
  config: {
    metricasSelecionadas: string; // JSON string
    ordemMetricas?: string; // JSON string
    periodoDefault?: string;
    layoutColunas?: number;
    temaGraficos?: string;
    widgetSizes?: string; // JSON string
    widgetPeriods?: string; // JSON string
  }
) {
  const db = await getDb();
  if (!db) return null;
  
  const existente = await getDashboardConfig(tenantId, userId);
  
  if (existente) {
    await db
      .update(dashboardConfigs)
      .set({
        metricasSelecionadas: config.metricasSelecionadas,
        ordemMetricas: config.ordemMetricas || null,
        periodoDefault: config.periodoDefault as any || '30d',
        layoutColunas: config.layoutColunas || 3,
        temaGraficos: config.temaGraficos as any || 'padrao',
        widgetSizes: config.widgetSizes || null,
        widgetPeriods: config.widgetPeriods || null,
      })
      .where(eq(dashboardConfigs.id, existente.id));
  } else {
    await db.insert(dashboardConfigs).values({
      tenantId,
      userId,
      metricasSelecionadas: config.metricasSelecionadas,
      ordemMetricas: config.ordemMetricas || null,
      periodoDefault: config.periodoDefault as any || '30d',
      layoutColunas: config.layoutColunas || 3,
      temaGraficos: config.temaGraficos as any || 'padrao',
      widgetSizes: config.widgetSizes || null,
      widgetPeriods: config.widgetPeriods || null,
    });
  }
  
  return await getDashboardConfig(tenantId, userId);
}
