import { eq, like, and, or, sql, desc, asc, getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pacientes, atendimentos, InsertPaciente, InsertAtendimento, Paciente, Atendimento } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== PACIENTES =====

export async function createPaciente(data: InsertPaciente): Promise<Paciente> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pacientes).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(pacientes).where(eq(pacientes.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getPacienteById(id: number): Promise<Paciente | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
  return result[0];
}

export async function getPacienteByIdPaciente(idPaciente: string): Promise<Paciente | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pacientes).where(eq(pacientes.idPaciente, idPaciente)).limit(1);
  return result[0];
}

export async function listPacientes(filters?: {
  nome?: string;
  cpf?: string;
  convenio?: string;
  diagnostico?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(pacientes);
  
  const conditions = [];
  
  if (filters?.nome) {
    conditions.push(like(pacientes.nome, `%${filters.nome}%`));
  }
  if (filters?.cpf) {
    conditions.push(like(pacientes.cpf, `%${filters.cpf}%`));
  }
  if (filters?.convenio) {
    conditions.push(
      or(
        like(pacientes.operadora1, `%${filters.convenio}%`),
        like(pacientes.operadora2, `%${filters.convenio}%`)
      )!
    );
  }
  if (filters?.diagnostico) {
    conditions.push(
      or(
        like(pacientes.grupoDiagnostico, `%${filters.diagnostico}%`),
        like(pacientes.diagnosticoEspecifico, `%${filters.diagnostico}%`)
      )!
    );
  }
  if (filters?.status) {
    conditions.push(eq(pacientes.statusCaso, filters.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  query = query.orderBy(desc(pacientes.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  const result = await query;
  
  // Adicionar idade calculada a cada paciente
  const { adicionarIdadeAosPacientes } = await import('./idade-helper');
  return adicionarIdadeAosPacientes(result);
}

export async function updatePaciente(id: number, data: Partial<InsertPaciente>): Promise<Paciente | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(pacientes).set(data).where(eq(pacientes.id, id));
  return getPacienteById(id);
}

export async function deletePaciente(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(pacientes).where(eq(pacientes.id, id));
  return true;
}

export async function countPacientes(filters?: {
  status?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let query = db.select({ count: sql<number>`count(*)` }).from(pacientes);

  if (filters?.status) {
    query = query.where(eq(pacientes.statusCaso, filters.status)) as any;
  }

  const result = await query;
  return Number(result[0]?.count || 0);
}

// ===== ATENDIMENTOS =====

export async function createAtendimento(data: InsertAtendimento): Promise<Atendimento> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(atendimentos).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(atendimentos).where(eq(atendimentos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getAtendimentoById(id: number): Promise<Atendimento | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  return result[0];
}

export async function listAtendimentos(filters?: {
  pacienteId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  tipo?: string;
  convenio?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const atendimentosColumns = getTableColumns(atendimentos);
  const pacientesColumns = getTableColumns(pacientes);
  
  let query = db
    .select({
      ...atendimentosColumns,
      pacientes: {
        id: pacientesColumns.id,
        nome: pacientesColumns.nome,
        idPaciente: pacientesColumns.idPaciente,
        dataNascimento: pacientesColumns.dataNascimento,
      }
    })
    .from(atendimentos)
    .leftJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id));
  
  const conditions = [];
  
  if (filters?.pacienteId) {
    conditions.push(eq(atendimentos.pacienteId, filters.pacienteId));
  }
  if (filters?.dataInicio) {
    conditions.push(sql`${atendimentos.dataAtendimento} >= ${filters.dataInicio}`);
  }
  if (filters?.dataFim) {
    conditions.push(sql`${atendimentos.dataAtendimento} <= ${filters.dataFim}`);
  }
  if (filters?.tipo) {
    conditions.push(eq(atendimentos.tipoAtendimento, filters.tipo));
  }
  if (filters?.convenio) {
    conditions.push(like(atendimentos.convenio, `%${filters.convenio}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  query = query.orderBy(desc(atendimentos.dataAtendimento)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  const result = await query;
  
  // Adicionar idade calculada para cada paciente nos atendimentos
  const { calcularIdade } = await import('./idade-helper');
  return result.map(atd => ({
    ...atd,
    pacientes: atd.pacientes ? {
      ...atd.pacientes,
      idade: calcularIdade(atd.pacientes.dataNascimento)
    } : null
  }));
}

export async function updateAtendimento(id: number, data: Partial<InsertAtendimento>): Promise<Atendimento | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(atendimentos).set(data).where(eq(atendimentos.id, id));
  return getAtendimentoById(id);
}

export async function deleteAtendimento(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(atendimentos).where(eq(atendimentos.id, id));
  return true;
}

export async function countAtendimentos(filters?: {
  pacienteId?: number;
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let query = db.select({ count: sql<number>`count(*)` }).from(atendimentos);

  const conditions = [];
  if (filters?.pacienteId) {
    conditions.push(eq(atendimentos.pacienteId, filters.pacienteId));
  }
  if (filters?.dataInicio) {
    conditions.push(sql`${atendimentos.dataAtendimento} >= ${filters.dataInicio}`);
  }
  if (filters?.dataFim) {
    conditions.push(sql`${atendimentos.dataAtendimento} <= ${filters.dataFim}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  const result = await query;
  return Number(result[0]?.count || 0);
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const totalPacientes = await countPacientes();
  const pacientesAtivos = await countPacientes({ status: "Ativo" });
  const totalAtendimentos = await countAtendimentos();

  // Faturamento total previsto e realizado
  const faturamento = await db
    .select({
      previsto: sql<number>`SUM(${atendimentos.faturamentoPrevistoFinal})`,
      realizado: sql<number>`SUM(CASE WHEN ${atendimentos.pagamentoEfetivado} = 1 THEN ${atendimentos.faturamentoPrevistoFinal} ELSE 0 END)`,
    })
    .from(atendimentos);

  // Distribuição por convênio
  const distribuicaoConvenio = await db
    .select({
      convenio: atendimentos.convenio,
      total: sql<number>`COUNT(*)`,
    })
    .from(atendimentos)
    .groupBy(atendimentos.convenio)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(10);

  return {
    totalPacientes,
    pacientesAtivos,
    totalAtendimentos,
    faturamentoPrevisto: Number(faturamento[0]?.previsto || 0),
    faturamentoRealizado: Number(faturamento[0]?.realizado || 0),
    distribuicaoConvenio: distribuicaoConvenio.map(d => ({
      convenio: d.convenio || "Não informado",
      total: Number(d.total),
    })),
  };
}

export async function getNextPacienteId(): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const currentYear = new Date().getFullYear().toString();
  
  // Buscar todos os IDs de pacientes do ano atual no formato correto (YYYY-NNNNNNN)
  const result = await db
    .select({ idPaciente: pacientes.idPaciente })
    .from(pacientes)
    .where(like(pacientes.idPaciente, `${currentYear}-%`));

  if (result.length === 0) {
    return `${currentYear}-0000001`;
  }

  // Encontrar o maior número sequencial entre os IDs válidos
  let maxNumber = 0;
  for (const row of result) {
    const idPaciente = row.idPaciente;
    if (!idPaciente) continue;
    
    // Verificar se o ID está no formato YYYY-NNNNNNN (7 dígitos)
    const match = idPaciente.match(/^\d{4}-(\d{7})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber + 1;
  return `${currentYear}-${String(nextNumber).padStart(7, "0")}`;
}

/**
 * Gera o próximo ID de atendimento no formato: ID_PACIENTE-YYYYNNNN
 * Exemplo: 2025-0000009-20260001
 * Onde:
 * - ID_PACIENTE: ID do paciente (ex: 2025-0000009)
 * - YYYY: Ano do atendimento (ex: 2026)
 * - NNNN: Número sequencial do atendimento no ano para aquele paciente (4 dígitos, começa em 0001)
 */
export async function getNextAtendimentoId(pacienteId: number, dataAtendimento: Date): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Buscar o ID do paciente (formato: 2025-0000009)
  const paciente = await db
    .select({ idPaciente: pacientes.idPaciente })
    .from(pacientes)
    .where(eq(pacientes.id, pacienteId))
    .limit(1);

  if (paciente.length === 0) {
    throw new Error(`Paciente com ID ${pacienteId} não encontrado`);
  }

  const idPaciente = paciente[0].idPaciente;
  const year = dataAtendimento.getFullYear();

  // Buscar o último atendimento deste paciente neste ano
  // Formato esperado: 2025-0000009-20260001
  const prefix = `${idPaciente}-${year}`;
  
  const result = await db
    .select({ atendimento: atendimentos.atendimento })
    .from(atendimentos)
    .where(
      and(
        eq(atendimentos.pacienteId, pacienteId),
        like(atendimentos.atendimento, `${prefix}%`)
      )!
    )
    .orderBy(desc(atendimentos.atendimento))
    .limit(1);

  if (result.length === 0) {
    // Primeiro atendimento deste paciente neste ano
    return `${prefix}0001`;
  }

  const lastId = result[0].atendimento;
  if (!lastId) {
    return `${prefix}0001`;
  }

  // Extrair o número sequencial (4 últimos dígitos)
  const lastNumber = parseInt(lastId.slice(-4));
  const nextNumber = lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}


// ===== AUDITORIA E SOFT DELETE =====

import { auditLog, InsertAuditLog, AuditLog } from "../drizzle/schema";

export interface AuditContext {
  userId?: number;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma ação no log de auditoria
 */
export async function createAuditLog(
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE",
  entityType: "paciente" | "atendimento" | "user",
  entityId: number,
  entityIdentifier: string | null,
  oldValues: Record<string, any> | null,
  newValues: Record<string, any> | null,
  context: AuditContext
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Database not available, skipping audit log");
    return;
  }

  // Calcular campos alterados
  let changedFields: string[] | null = null;
  if (action === "UPDATE" && oldValues && newValues) {
    changedFields = Object.keys(newValues).filter(
      key => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
    );
  }

  try {
    await db.insert(auditLog).values({
      userId: context.userId,
      userName: context.userName,
      userEmail: context.userEmail,
      action,
      entityType,
      entityId,
      entityIdentifier,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      changedFields: changedFields ? JSON.stringify(changedFields) : null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    } as any);
  } catch (error) {
    console.error("[Audit] Failed to create audit log:", error);
  }
}

/**
 * Lista logs de auditoria com filtros
 */
export async function listAuditLogs(filters?: {
  entityType?: "paciente" | "atendimento" | "user";
  entityId?: number;
  action?: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  userId?: number;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(auditLog);
  
  const conditions = [];
  
  if (filters?.entityType) {
    conditions.push(eq(auditLog.entityType, filters.entityType));
  }
  if (filters?.entityId) {
    conditions.push(eq(auditLog.entityId, filters.entityId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLog.action, filters.action));
  }
  if (filters?.userId) {
    conditions.push(eq(auditLog.userId, filters.userId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  query = query.orderBy(desc(auditLog.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

/**
 * Soft delete de paciente
 */
export async function softDeletePaciente(id: number, deletedBy: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(pacientes).set({
    deletedAt: new Date(),
    deletedBy,
  } as any).where(eq(pacientes.id, id));
  
  return true;
}

/**
 * Restaurar paciente excluído
 */
export async function restorePaciente(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(pacientes).set({
    deletedAt: null,
    deletedBy: null,
  } as any).where(eq(pacientes.id, id));
  
  return true;
}

/**
 * Soft delete de atendimento
 */
export async function softDeleteAtendimento(id: number, deletedBy: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(atendimentos).set({
    deletedAt: new Date(),
    deletedBy,
  } as any).where(eq(atendimentos.id, id));
  
  return true;
}

/**
 * Restaurar atendimento excluído
 */
export async function restoreAtendimento(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(atendimentos).set({
    deletedAt: null,
    deletedBy: null,
  } as any).where(eq(atendimentos.id, id));
  
  return true;
}

/**
 * Lista pacientes incluindo ou excluindo deletados
 */
export async function listPacientesWithDeleted(includeDeleted: boolean = false): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(pacientes);
  
  if (!includeDeleted) {
    query = query.where(sql`${pacientes.deletedAt} IS NULL`) as any;
  }

  query = query.orderBy(desc(pacientes.createdAt)) as any;

  const result = await query;
  
  const { adicionarIdadeAosPacientes } = await import('./idade-helper');
  return adicionarIdadeAosPacientes(result);
}

/**
 * Lista atendimentos incluindo ou excluindo deletados
 */
export async function listAtendimentosWithDeleted(includeDeleted: boolean = false): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const atendimentosColumns = getTableColumns(atendimentos);
  const pacientesColumns = getTableColumns(pacientes);
  
  let query = db
    .select({
      ...atendimentosColumns,
      pacientes: {
        id: pacientesColumns.id,
        nome: pacientesColumns.nome,
        idPaciente: pacientesColumns.idPaciente,
        dataNascimento: pacientesColumns.dataNascimento,
      }
    })
    .from(atendimentos)
    .leftJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id));

  if (!includeDeleted) {
    query = query.where(sql`${atendimentos.deletedAt} IS NULL`) as any;
  }

  query = query.orderBy(desc(atendimentos.dataAtendimento)) as any;

  const result = await query;
  
  const { calcularIdade } = await import('./idade-helper');
  return result.map(atd => ({
    ...atd,
    pacientes: atd.pacientes ? {
      ...atd.pacientes,
      idade: calcularIdade(atd.pacientes.dataNascimento)
    } : null
  }));
}


// ===== PRONTUÁRIO MÉDICO ELETRÔNICO =====

import { 
  resumoClinico, InsertResumoClinico, ResumoClinico,
  problemasAtivos, InsertProblemaAtivo, ProblemaAtivo,
  alergias, InsertAlergia, Alergia,
  medicamentosUso, InsertMedicamentoUso, MedicamentoUso,
  evolucoes, InsertEvolucao, Evolucao,
  internacoes, InsertInternacao, Internacao,
  cirurgias, InsertCirurgia, Cirurgia,
  examesLaboratoriais, InsertExameLaboratorial, ExameLaboratorial,
  examesImagem, InsertExameImagem, ExameImagem,
  endoscopias, InsertEndoscopia, Endoscopia,
  cardiologia, InsertCardiologia, Cardiologia,
  terapias, InsertTerapia, Terapia,
  obstetricia, InsertObstetricia, Obstetricia,
  documentosMedicos, InsertDocumentoMedico, DocumentoMedico
} from "../drizzle/schema";

// ===== RESUMO CLÍNICO =====

export async function getResumoClinico(pacienteId: number): Promise<ResumoClinico | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(resumoClinico)
    .where(eq(resumoClinico.pacienteId, pacienteId))
    .limit(1);
  
  return result[0] || null;
}

export async function upsertResumoClinico(data: InsertResumoClinico): Promise<ResumoClinico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calcular IMC se peso e altura foram fornecidos
  if (data.pesoAtual && data.altura) {
    const peso = Number(data.pesoAtual);
    const altura = Number(data.altura);
    if (altura > 0) {
      data.imc = String(Math.round((peso / (altura * altura)) * 10) / 10);
    }
  }
  
  const existing = await getResumoClinico(data.pacienteId);
  
  if (existing) {
    await db
      .update(resumoClinico)
      .set(data)
      .where(eq(resumoClinico.pacienteId, data.pacienteId));
    return { ...existing, ...data } as ResumoClinico;
  } else {
    const [result] = await db.insert(resumoClinico).values(data);
    return { id: result.insertId, ...data } as ResumoClinico;
  }
}

// ===== PROBLEMAS ATIVOS =====

export async function listProblemasAtivos(pacienteId: number): Promise<ProblemaAtivo[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(problemasAtivos)
    .where(eq(problemasAtivos.pacienteId, pacienteId))
    .orderBy(desc(problemasAtivos.dataInicio));
}

export async function createProblemaAtivo(data: InsertProblemaAtivo): Promise<ProblemaAtivo> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(problemasAtivos).values(data);
  return { id: result.insertId, ...data } as ProblemaAtivo;
}

export async function updateProblemaAtivo(id: number, data: Partial<InsertProblemaAtivo>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(problemasAtivos).set(data).where(eq(problemasAtivos.id, id));
}

// ===== ALERGIAS =====

export async function listAlergias(pacienteId: number): Promise<Alergia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(alergias)
    .where(eq(alergias.pacienteId, pacienteId))
    .orderBy(desc(alergias.createdAt));
}

export async function createAlergia(data: InsertAlergia): Promise<Alergia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(alergias).values(data);
  return { id: result.insertId, ...data } as Alergia;
}

export async function deleteAlergia(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(alergias).where(eq(alergias.id, id));
}

// ===== MEDICAMENTOS EM USO =====

export async function listMedicamentosUso(pacienteId: number, apenasAtivos = true): Promise<MedicamentoUso[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (apenasAtivos) {
    return db
      .select()
      .from(medicamentosUso)
      .where(and(
        eq(medicamentosUso.pacienteId, pacienteId),
        eq(medicamentosUso.ativo, true)
      ))
      .orderBy(desc(medicamentosUso.dataInicio));
  }
  
  return db
    .select()
    .from(medicamentosUso)
    .where(eq(medicamentosUso.pacienteId, pacienteId))
    .orderBy(desc(medicamentosUso.dataInicio));
}

export async function createMedicamentoUso(data: InsertMedicamentoUso): Promise<MedicamentoUso> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(medicamentosUso).values(data);
  return { id: result.insertId, ...data } as MedicamentoUso;
}

export async function updateMedicamentoUso(id: number, data: Partial<InsertMedicamentoUso>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(medicamentosUso).set(data).where(eq(medicamentosUso.id, id));
}

// ===== EVOLUÇÕES =====

export async function listEvolucoes(pacienteId: number): Promise<Evolucao[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.pacienteId, pacienteId))
    .orderBy(desc(evolucoes.dataEvolucao));
}

export async function getEvolucao(id: number): Promise<Evolucao | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createEvolucao(data: InsertEvolucao): Promise<Evolucao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calcular IMC se peso e altura foram fornecidos
  if (data.peso && data.altura) {
    const peso = Number(data.peso);
    const altura = Number(data.altura);
    if (altura > 0) {
      data.imc = String(Math.round((peso / (altura * altura)) * 10) / 10);
    }
  }
  
  const [result] = await db.insert(evolucoes).values(data);
  return { id: result.insertId, ...data } as Evolucao;
}

export async function updateEvolucao(id: number, data: Partial<InsertEvolucao>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Recalcular IMC se peso ou altura foram atualizados
  if (data.peso || data.altura) {
    const existing = await getEvolucao(id);
    if (existing) {
      const peso = Number(data.peso || existing.peso);
      const altura = Number(data.altura || existing.altura);
      if (altura > 0) {
        data.imc = String(Math.round((peso / (altura * altura)) * 10) / 10);
      }
    }
  }
  
  await db.update(evolucoes).set(data).where(eq(evolucoes.id, id));
}

// ===== INTERNAÇÕES =====

export async function listInternacoes(pacienteId: number): Promise<Internacao[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(internacoes)
    .where(eq(internacoes.pacienteId, pacienteId))
    .orderBy(desc(internacoes.dataAdmissao));
}

export async function createInternacao(data: InsertInternacao): Promise<Internacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(internacoes).values(data);
  return { id: result.insertId, ...data } as Internacao;
}

export async function updateInternacao(id: number, data: Partial<InsertInternacao>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(internacoes).set(data).where(eq(internacoes.id, id));
}

// ===== CIRURGIAS =====

export async function listCirurgias(pacienteId: number): Promise<Cirurgia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(cirurgias)
    .where(eq(cirurgias.pacienteId, pacienteId))
    .orderBy(desc(cirurgias.dataCirurgia));
}

export async function createCirurgia(data: InsertCirurgia): Promise<Cirurgia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(cirurgias).values(data);
  return { id: result.insertId, ...data } as Cirurgia;
}

export async function updateCirurgia(id: number, data: Partial<InsertCirurgia>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cirurgias).set(data).where(eq(cirurgias.id, id));
}

// ===== EXAMES LABORATORIAIS =====

export async function listExamesLaboratoriais(pacienteId: number): Promise<ExameLaboratorial[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(examesLaboratoriais)
    .where(eq(examesLaboratoriais.pacienteId, pacienteId))
    .orderBy(desc(examesLaboratoriais.dataColeta));
}

export async function createExameLaboratorial(data: InsertExameLaboratorial): Promise<ExameLaboratorial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(examesLaboratoriais).values(data);
  return { id: result.insertId, ...data } as ExameLaboratorial;
}

// ===== EXAMES DE IMAGEM =====

export async function listExamesImagem(pacienteId: number): Promise<ExameImagem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(examesImagem)
    .where(eq(examesImagem.pacienteId, pacienteId))
    .orderBy(desc(examesImagem.dataExame));
}

export async function createExameImagem(data: InsertExameImagem): Promise<ExameImagem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(examesImagem).values(data);
  return { id: result.insertId, ...data } as ExameImagem;
}

// ===== ENDOSCOPIAS =====

export async function listEndoscopias(pacienteId: number): Promise<Endoscopia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(endoscopias)
    .where(eq(endoscopias.pacienteId, pacienteId))
    .orderBy(desc(endoscopias.dataExame));
}

export async function createEndoscopia(data: InsertEndoscopia): Promise<Endoscopia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(endoscopias).values(data);
  return { id: result.insertId, ...data } as Endoscopia;
}

// ===== CARDIOLOGIA =====

export async function listCardiologia(pacienteId: number): Promise<Cardiologia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(cardiologia)
    .where(eq(cardiologia.pacienteId, pacienteId))
    .orderBy(desc(cardiologia.dataExame));
}

export async function createCardiologia(data: InsertCardiologia): Promise<Cardiologia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(cardiologia).values(data);
  return { id: result.insertId, ...data } as Cardiologia;
}

// ===== TERAPIAS =====

export async function listTerapias(pacienteId: number): Promise<Terapia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(terapias)
    .where(eq(terapias.pacienteId, pacienteId))
    .orderBy(desc(terapias.dataTerapia));
}

export async function createTerapia(data: InsertTerapia): Promise<Terapia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(terapias).values(data);
  return { id: result.insertId, ...data } as Terapia;
}

// ===== OBSTETRÍCIA =====

export async function listObstetricia(pacienteId: number): Promise<Obstetricia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(obstetricia)
    .where(eq(obstetricia.pacienteId, pacienteId))
    .orderBy(desc(obstetricia.dataRegistro));
}

export async function createObstetricia(data: InsertObstetricia): Promise<Obstetricia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(obstetricia).values(data);
  return { id: result.insertId, ...data } as Obstetricia;
}

// ===== DOCUMENTOS MÉDICOS =====

export async function listDocumentosMedicos(pacienteId: number, tipo?: string): Promise<DocumentoMedico[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (tipo) {
    return db
      .select()
      .from(documentosMedicos)
      .where(and(
        eq(documentosMedicos.pacienteId, pacienteId),
        eq(documentosMedicos.tipo, tipo as any)
      ))
      .orderBy(desc(documentosMedicos.dataEmissao));
  }
  
  return db
    .select()
    .from(documentosMedicos)
    .where(eq(documentosMedicos.pacienteId, pacienteId))
    .orderBy(desc(documentosMedicos.dataEmissao));
}

export async function createDocumentoMedico(data: InsertDocumentoMedico): Promise<DocumentoMedico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(documentosMedicos).values(data);
  return { id: result.insertId, ...data } as DocumentoMedico;
}

export async function getDocumentoMedico(id: number): Promise<DocumentoMedico | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(documentosMedicos)
    .where(eq(documentosMedicos.id, id))
    .limit(1);
  
  return result[0] || null;
}

// ===== DADOS COMPLETOS DO PRONTUÁRIO =====

export interface ProntuarioCompleto {
  paciente: Paciente;
  resumoClinico: ResumoClinico | null;
  problemasAtivos: ProblemaAtivo[];
  alergias: Alergia[];
  medicamentosUso: MedicamentoUso[];
  evolucoes: Evolucao[];
  internacoes: Internacao[];
  cirurgias: Cirurgia[];
  examesLaboratoriais: ExameLaboratorial[];
  examesImagem: ExameImagem[];
  endoscopias: Endoscopia[];
  cardiologia: Cardiologia[];
  terapias: Terapia[];
  obstetricia: Obstetricia[];
  documentos: DocumentoMedico[];
}

export async function getProntuarioCompleto(pacienteId: number): Promise<ProntuarioCompleto | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar paciente
  const pacienteResult = await db
    .select()
    .from(pacientes)
    .where(eq(pacientes.id, pacienteId))
    .limit(1);
  
  if (pacienteResult.length === 0) return null;
  
  const paciente = pacienteResult[0];
  
  // Buscar todos os dados do prontuário em paralelo
  const [
    resumo,
    problemas,
    alergiasData,
    medicamentos,
    evolucoesData,
    internacoesData,
    cirurgiasData,
    examesLab,
    examesImg,
    endoscopiasData,
    cardiologiaData,
    terapiasData,
    obstetriciaData,
    documentosData
  ] = await Promise.all([
    getResumoClinico(pacienteId),
    listProblemasAtivos(pacienteId),
    listAlergias(pacienteId),
    listMedicamentosUso(pacienteId),
    listEvolucoes(pacienteId),
    listInternacoes(pacienteId),
    listCirurgias(pacienteId),
    listExamesLaboratoriais(pacienteId),
    listExamesImagem(pacienteId),
    listEndoscopias(pacienteId),
    listCardiologia(pacienteId),
    listTerapias(pacienteId),
    listObstetricia(pacienteId),
    listDocumentosMedicos(pacienteId)
  ]);
  
  return {
    paciente,
    resumoClinico: resumo,
    problemasAtivos: problemas,
    alergias: alergiasData,
    medicamentosUso: medicamentos,
    evolucoes: evolucoesData,
    internacoes: internacoesData,
    cirurgias: cirurgiasData,
    examesLaboratoriais: examesLab,
    examesImagem: examesImg,
    endoscopias: endoscopiasData,
    cardiologia: cardiologiaData,
    terapias: terapiasData,
    obstetricia: obstetriciaData,
    documentos: documentosData
  };
}
