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
// FUNÇÃO AUXILIAR PARA AGRUPAMENTO DE CATEGORIAS
// ========================================

/**
 * Agrupa categorias com menos de 5% do total sob o nome "Outros"
 * Padrão de conduta do Gorgen para evitar poluição visual nos gráficos
 */
function agruparCategoriasOutros<T extends { nome?: string; convenio?: string; valor?: number; quantidade?: number }>(
  dados: T[],
  limitePercentual: number = 5
): T[] {
  if (!dados || dados.length === 0) return dados;
  
  // Calcular total
  const total = dados.reduce((acc, item) => {
    const valor = item.valor ?? item.quantidade ?? 0;
    return acc + Number(valor);
  }, 0);
  
  if (total === 0) return dados;
  
  const limiteAbsoluto = (limitePercentual / 100) * total;
  
  const categoriasGrandes: T[] = [];
  let somaOutros = 0;
  
  for (const item of dados) {
    const valor = Number(item.valor ?? item.quantidade ?? 0);
    if (valor >= limiteAbsoluto) {
      categoriasGrandes.push(item);
    } else {
      somaOutros += valor;
    }
  }
  
  // Se houver categorias agrupadas em "Outros", adicionar
  if (somaOutros > 0) {
    const outrosItem = {
      nome: 'Outros',
      convenio: 'Outros',
      valor: somaOutros,
      quantidade: somaOutros
    } as T;
    categoriasGrandes.push(outrosItem);
  }
  
  return categoriasGrandes;
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
  const dados = rows.map(r => ({ nome: r.nome, valor: Number(r.valor) }));
  // Aplicar regra de agrupamento: categorias < 5% viram "Outros"
  return { dados: agruparCategoriasOutros(dados) };
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
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  const dados = rows.map(r => ({ nome: r.nome, valor: Number(r.valor) }));
  // Aplicar regra de agrupamento: categorias < 5% viram "Outros"
  return { dados: agruparCategoriasOutros(dados) };
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
  const dadosBrutos = rows.map(r => ({ nome: r.nome, valor: Number(r.valor) }));
  // Aplicar agrupamento de categorias <5% como "Outros"
  return { dados: agruparCategoriasOutros(dadosBrutos) };
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
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  const dados = rows.map(r => ({ convenio: r.convenio, quantidade: Number(r.quantidade) }));
  // Aplicar regra de agrupamento: categorias < 5% viram "Outros"
  return { dados: agruparCategoriasOutros(dados) };
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
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  const dados = rows.map(r => ({ convenio: r.convenio, valor: Number(r.valor) }));
  // Aplicar regra de agrupamento: categorias < 5% viram "Outros"
  return { dados: agruparCategoriasOutros(dados) };
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


// ========================================
// MAPA DE CALOR DE CEPs
// ========================================

/**
 * Retorna a distribuição de pacientes por CEP para o mapa de calor.
 * Agrupa os CEPs pelo prefixo (5 primeiros dígitos) para melhor visualização.
 * @param tenantId - ID do tenant
 * @param nivelAgrupamento - Nível de agrupamento: 'regiao' (2 dígitos), 'subregiao' (5 dígitos), 'completo' (8 dígitos)
 */
export async function getPacientesDistribuicaoCep(
  tenantId: number, 
  nivelAgrupamento: 'regiao' | 'subregiao' | 'completo' = 'subregiao'
) {
  const db = await getDb();
  if (!db) return { dados: [], total: 0, maxContagem: 0 };
  
  // Determinar quantos dígitos usar baseado no nível de agrupamento
  let digitosPrefixo: number;
  switch (nivelAgrupamento) {
    case 'regiao':
      digitosPrefixo = 2; // Agrupa por região (ex: 90, 91, 92...)
      break;
    case 'subregiao':
      digitosPrefixo = 5; // Agrupa por sub-região (ex: 90000, 90010, 90020...)
      break;
    case 'completo':
    default:
      digitosPrefixo = 8; // CEP completo
  }
  
  const resultado = await db.execute(sql`
    SELECT 
      LEFT(REPLACE(REPLACE(cep, '-', ''), '.', ''), ${digitosPrefixo}) as cep_prefixo,
      COUNT(*) as quantidade,
      GROUP_CONCAT(DISTINCT COALESCE(cidade, 'N/I') ORDER BY cidade SEPARATOR ', ') as cidades
    FROM pacientes
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND cep IS NOT NULL
      AND cep != ''
      AND LENGTH(REPLACE(REPLACE(cep, '-', ''), '.', '')) >= ${digitosPrefixo}
    GROUP BY cep_prefixo
    ORDER BY quantidade DESC
  `);
  
  const rows = (resultado[0] as unknown) as any[];
  
  // Calcular total e máximo para normalização das cores
  const total = rows.reduce((acc: number, r: any) => acc + Number(r.quantidade), 0);
  const maxContagem = rows.length > 0 ? Math.max(...rows.map((r: any) => Number(r.quantidade))) : 0;
  
  const dados = rows.map((r: any) => ({
    cep: r.cep_prefixo,
    quantidade: Number(r.quantidade),
    cidades: r.cidades || '',
    // Calcular intensidade de 0 a 1 para o mapa de calor
    intensidade: maxContagem > 0 ? Number(r.quantidade) / maxContagem : 0
  }));
  
  return { 
    dados, 
    total,
    maxContagem,
    nivelAgrupamento
  };
}

/**
 * Retorna coordenadas aproximadas para CEPs brasileiros baseado no prefixo.
 * Mapeamento simplificado das regiões postais do Brasil.
 */
export function getCoordenadaCep(cepPrefixo: string): { lat: number; lng: number } | null {
  // Mapeamento aproximado das regiões postais brasileiras
  // Baseado nos 2 primeiros dígitos do CEP
  const regioes: Record<string, { lat: number; lng: number }> = {
    // São Paulo Capital e Grande SP
    '01': { lat: -23.5505, lng: -46.6333 },
    '02': { lat: -23.4800, lng: -46.6200 },
    '03': { lat: -23.5400, lng: -46.5800 },
    '04': { lat: -23.6100, lng: -46.6500 },
    '05': { lat: -23.5300, lng: -46.7000 },
    '06': { lat: -23.5200, lng: -46.8500 },
    '07': { lat: -23.4600, lng: -46.5300 },
    '08': { lat: -23.5100, lng: -46.4500 },
    '09': { lat: -23.6500, lng: -46.5500 },
    
    // Interior de São Paulo
    '11': { lat: -23.9600, lng: -46.3300 }, // Santos
    '12': { lat: -23.2000, lng: -45.9000 }, // Vale do Paraíba
    '13': { lat: -22.9100, lng: -47.0600 }, // Campinas
    '14': { lat: -21.1800, lng: -47.8100 }, // Ribeirão Preto
    '15': { lat: -20.8200, lng: -49.3800 }, // São José do Rio Preto
    '16': { lat: -21.2100, lng: -50.4300 }, // Araçatuba
    '17': { lat: -22.3200, lng: -49.0700 }, // Bauru
    '18': { lat: -23.5000, lng: -47.4600 }, // Sorocaba
    '19': { lat: -22.1200, lng: -51.3900 }, // Presidente Prudente
    
    // Rio de Janeiro
    '20': { lat: -22.9068, lng: -43.1729 },
    '21': { lat: -22.8800, lng: -43.2500 },
    '22': { lat: -22.9500, lng: -43.1800 },
    '23': { lat: -22.9200, lng: -43.4000 },
    '24': { lat: -22.8900, lng: -43.1000 },
    '25': { lat: -22.4500, lng: -42.9700 }, // Petrópolis
    '26': { lat: -22.7600, lng: -43.4500 }, // Nova Iguaçu
    '27': { lat: -22.4100, lng: -42.9700 }, // Teresópolis
    '28': { lat: -22.0100, lng: -41.0600 }, // Campos
    
    // Espírito Santo
    '29': { lat: -20.3155, lng: -40.3128 },
    
    // Minas Gerais
    '30': { lat: -19.9167, lng: -43.9345 }, // BH
    '31': { lat: -19.8700, lng: -43.9700 },
    '32': { lat: -20.0000, lng: -44.0500 },
    '33': { lat: -19.9300, lng: -43.8500 },
    '34': { lat: -19.8500, lng: -43.9200 },
    '35': { lat: -21.7600, lng: -43.3500 }, // Juiz de Fora
    '36': { lat: -21.2500, lng: -45.0000 }, // Varginha
    '37': { lat: -21.5500, lng: -45.4500 }, // Poços de Caldas
    '38': { lat: -18.9200, lng: -48.2800 }, // Uberlândia
    '39': { lat: -16.7200, lng: -43.8600 }, // Montes Claros
    
    // Bahia
    '40': { lat: -12.9714, lng: -38.5014 }, // Salvador
    '41': { lat: -12.9500, lng: -38.4500 },
    '42': { lat: -12.2600, lng: -38.9600 }, // Feira de Santana
    '43': { lat: -12.1400, lng: -38.4200 },
    '44': { lat: -14.8600, lng: -40.8400 }, // Vitória da Conquista
    '45': { lat: -14.7900, lng: -39.2800 }, // Ilhéus
    '46': { lat: -13.0100, lng: -38.5200 },
    '47': { lat: -10.5100, lng: -40.3100 }, // Petrolina
    '48': { lat: -12.2500, lng: -38.9500 },
    
    // Sergipe
    '49': { lat: -10.9472, lng: -37.0731 },
    
    // Pernambuco
    '50': { lat: -8.0476, lng: -34.8770 }, // Recife
    '51': { lat: -8.0300, lng: -34.9200 },
    '52': { lat: -8.0600, lng: -34.8900 },
    '53': { lat: -8.0100, lng: -34.8500 },
    '54': { lat: -8.1200, lng: -34.9100 },
    '55': { lat: -8.2800, lng: -35.9700 }, // Caruaru
    '56': { lat: -9.4000, lng: -40.5000 }, // Petrolina
    
    // Alagoas
    '57': { lat: -9.6658, lng: -35.7350 },
    
    // Paraíba
    '58': { lat: -7.1195, lng: -34.8450 },
    
    // Rio Grande do Norte
    '59': { lat: -5.7945, lng: -35.2110 },
    
    // Ceará
    '60': { lat: -3.7172, lng: -38.5433 }, // Fortaleza
    '61': { lat: -3.7500, lng: -38.5800 },
    '62': { lat: -3.6900, lng: -40.3500 }, // Sobral
    '63': { lat: -7.2100, lng: -39.3100 }, // Juazeiro do Norte
    
    // Piauí
    '64': { lat: -5.0892, lng: -42.8019 },
    
    // Maranhão
    '65': { lat: -2.5307, lng: -44.3068 },
    
    // Pará
    '66': { lat: -1.4558, lng: -48.4902 }, // Belém
    '67': { lat: -2.4400, lng: -54.7100 }, // Santarém
    '68': { lat: -0.0400, lng: -51.0700 }, // Macapá
    
    // Amazonas
    '69': { lat: -3.1190, lng: -60.0217 },
    
    // Distrito Federal
    '70': { lat: -15.7942, lng: -47.8822 },
    '71': { lat: -15.8300, lng: -47.9500 },
    '72': { lat: -15.7800, lng: -47.8000 },
    '73': { lat: -15.7500, lng: -47.7500 },
    
    // Goiás
    '74': { lat: -16.6869, lng: -49.2648 }, // Goiânia
    '75': { lat: -16.3300, lng: -48.9500 }, // Anápolis
    '76': { lat: -10.1800, lng: -48.3300 }, // Palmas
    
    // Mato Grosso
    '78': { lat: -15.6010, lng: -56.0974 },
    
    // Mato Grosso do Sul
    '79': { lat: -20.4697, lng: -54.6201 },
    
    // Paraná
    '80': { lat: -25.4284, lng: -49.2733 }, // Curitiba
    '81': { lat: -25.4500, lng: -49.2300 },
    '82': { lat: -25.4100, lng: -49.3200 },
    '83': { lat: -25.5200, lng: -49.2000 },
    '84': { lat: -25.0900, lng: -50.1600 }, // Ponta Grossa
    '85': { lat: -25.4200, lng: -49.2700 },
    '86': { lat: -23.3100, lng: -51.1600 }, // Londrina
    '87': { lat: -23.4200, lng: -51.9400 }, // Maringá
    
    // Santa Catarina
    '88': { lat: -27.5954, lng: -48.5480 }, // Florianópolis
    '89': { lat: -26.3000, lng: -48.8500 }, // Joinville
    
    // Rio Grande do Sul
    '90': { lat: -30.0346, lng: -51.2177 }, // Porto Alegre
    '91': { lat: -30.0500, lng: -51.1800 },
    '92': { lat: -29.9400, lng: -51.0800 }, // Canoas
    '93': { lat: -29.7900, lng: -51.1500 }, // São Leopoldo
    '94': { lat: -29.6800, lng: -51.0900 }, // Gravataí
    '95': { lat: -29.1700, lng: -51.1800 }, // Caxias do Sul
    '96': { lat: -31.7700, lng: -52.3400 }, // Pelotas
    '97': { lat: -29.6900, lng: -53.8100 }, // Santa Maria
    '98': { lat: -28.2600, lng: -54.2300 }, // Cruz Alta
    '99': { lat: -28.6600, lng: -56.0000 }, // Uruguaiana
  };
  
  // Pegar os 2 primeiros dígitos do CEP
  const prefixo2 = cepPrefixo.substring(0, 2);
  
  if (regioes[prefixo2]) {
    // Se temos mais dígitos, adicionar pequena variação para não sobrepor pontos
    if (cepPrefixo.length > 2) {
      const variacao = parseInt(cepPrefixo.substring(2, 5) || '0', 10) / 100000;
      return {
        lat: regioes[prefixo2].lat + (variacao - 0.005),
        lng: regioes[prefixo2].lng + (variacao - 0.005)
      };
    }
    return regioes[prefixo2];
  }
  
  return null;
}
