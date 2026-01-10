import { eq, like, and, or, sql, desc, asc, getTableColumns, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pacientes, atendimentos, InsertPaciente, InsertAtendimento, Paciente, Atendimento, historicoMedidas, userProfiles, userSettings, UserProfile, InsertUserProfile, UserSetting, InsertUserSetting, vinculoSecretariaMedico, historicoVinculo, examesFavoritos } from "../drizzle/schema";
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
  totalAtendimentos: number;
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
    documentosData,
    totalAtendimentosPaciente
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
    listDocumentosMedicos(pacienteId),
    countAtendimentos({ pacienteId })
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
    documentos: documentosData,
    totalAtendimentos: totalAtendimentosPaciente
  };
}


// ==========================================
// HISTÓRICO DE MEDIDAS ANTROPOMÉTRICAS
// Pilar Fundamental: Imutabilidade e Preservação Histórica
// ==========================================

export async function registrarMedida(data: {
  pacienteId: number;
  peso?: number;
  altura?: number;
  pressaoSistolica?: number;
  pressaoDiastolica?: number;
  frequenciaCardiaca?: number;
  temperatura?: number;
  saturacao?: number;
  observacoes?: string;
  registradoPor: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular IMC se peso e altura foram fornecidos
  let imc: number | undefined;
  if (data.peso && data.altura) {
    imc = Number((data.peso / (data.altura * data.altura)).toFixed(1));
  }

  const result = await db.insert(historicoMedidas).values({
    pacienteId: data.pacienteId,
    dataMedicao: new Date(),
    peso: data.peso ? String(data.peso) : null,
    altura: data.altura ? String(data.altura) : null,
    imc: imc ? String(imc) : null,
    pressaoSistolica: data.pressaoSistolica,
    pressaoDiastolica: data.pressaoDiastolica,
    frequenciaCardiaca: data.frequenciaCardiaca,
    temperatura: data.temperatura ? String(data.temperatura) : null,
    saturacao: data.saturacao,
    observacoes: data.observacoes,
    registradoPor: data.registradoPor,
  });

  // Atualizar também o resumo clínico com os valores mais recentes (usando upsert)
  if (data.peso || data.altura) {
    const existing = await getResumoClinico(data.pacienteId);
    const dbUpdate = await getDb();
    if (dbUpdate) {
      if (existing) {
        // Atualizar registro existente
        await dbUpdate.update(resumoClinico)
        .set({
          pesoAtual: data.peso ? String(data.peso) : existing.pesoAtual,
          altura: data.altura ? String(data.altura) : existing.altura,
          imc: imc ? String(imc) : existing.imc,
          updatedAt: new Date(),
        })
        .where(eq(resumoClinico.pacienteId, data.pacienteId));
      } else {
        // Criar novo registro de resumo clínico
        await dbUpdate.insert(resumoClinico).values({
          pacienteId: data.pacienteId,
          pesoAtual: data.peso ? String(data.peso) : null,
          altura: data.altura ? String(data.altura) : null,
          imc: imc ? String(imc) : null,
        });
      }
    }
  }

  return result;
}

export async function listarHistoricoMedidas(pacienteId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(historicoMedidas)
    .where(eq(historicoMedidas.pacienteId, pacienteId))
    .orderBy(desc(historicoMedidas.dataMedicao))
    .limit(limit);
}

export async function getUltimaMedida(pacienteId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select()
    .from(historicoMedidas)
    .where(eq(historicoMedidas.pacienteId, pacienteId))
    .orderBy(desc(historicoMedidas.dataMedicao))
    .limit(1);
  
  return result[0] || null;
}

export async function getEvolucaoIMC(pacienteId: number, meses = 12) {
  const db = await getDb();
  if (!db) return [];
  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - meses);
  
  return await db.select({
    data: historicoMedidas.dataMedicao,
    peso: historicoMedidas.peso,
    altura: historicoMedidas.altura,
    imc: historicoMedidas.imc,
  })
    .from(historicoMedidas)
    .where(
      and(
        eq(historicoMedidas.pacienteId, pacienteId),
        gte(historicoMedidas.dataMedicao, dataInicio)
      )
    )
    .orderBy(asc(historicoMedidas.dataMedicao));
}


// ===== AGENDA =====

import { agendamentos, bloqueiosHorario, historicoAgendamentos, InsertAgendamento, InsertBloqueioHorario, InsertHistoricoAgendamento } from "../drizzle/schema";

// Gerar próximo ID de agendamento (formato: AG-YYYY-NNNNN)
export async function getNextAgendamentoId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const ano = new Date().getFullYear();
  const prefix = `AG-${ano}-`;
  
  const result = await db.select({ idAgendamento: agendamentos.idAgendamento })
    .from(agendamentos)
    .where(like(agendamentos.idAgendamento, `${prefix}%`))
    .orderBy(desc(agendamentos.idAgendamento))
    .limit(1);
  
  let nextNum = 1;
  if (result.length > 0 && result[0].idAgendamento) {
    const match = result[0].idAgendamento.match(/AG-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// Gerar próximo ID de bloqueio (formato: BL-YYYY-NNNNN)
export async function getNextBloqueioId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const ano = new Date().getFullYear();
  const prefix = `BL-${ano}-`;
  
  const result = await db.select({ idBloqueio: bloqueiosHorario.idBloqueio })
    .from(bloqueiosHorario)
    .where(like(bloqueiosHorario.idBloqueio, `${prefix}%`))
    .orderBy(desc(bloqueiosHorario.idBloqueio))
    .limit(1);
  
  let nextNum = 1;
  if (result.length > 0 && result[0].idBloqueio) {
    const match = result[0].idBloqueio.match(/BL-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// Criar agendamento
export async function createAgendamento(data: InsertAgendamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agendamentos).values(data);
  const insertedId = Number(result[0].insertId);
  
  // Registrar no histórico
  await db.insert(historicoAgendamentos).values({
    agendamentoId: insertedId,
    tipoAlteracao: "Criação",
    descricaoAlteracao: `Agendamento criado: ${data.tipoCompromisso} em ${data.dataHoraInicio}`,
    valoresNovos: data as any,
    realizadoPor: data.criadoPor || "Sistema",
  });
  
  return getAgendamentoById(insertedId);
}

// Buscar agendamento por ID
export async function getAgendamentoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(agendamentos)
    .where(eq(agendamentos.id, id))
    .limit(1);
  
  return result[0];
}

// Listar agendamentos por período
export async function listAgendamentos(filters?: {
  dataInicio?: Date;
  dataFim?: Date;
  pacienteId?: number;
  tipo?: string;
  status?: string;
  incluirCancelados?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  
  
  // Buscar todos os agendamentos ordenados por data
  const result = await db.select().from(agendamentos).orderBy(asc(agendamentos.dataHoraInicio));
  
  console.log('[listAgendamentos] Encontrados:', result.length, 'agendamentos');
  
  // Filtrar no JavaScript para garantir que funciona
  let filtered = result;
  
  if (filters?.dataInicio) {
    const inicio = new Date(filters.dataInicio).getTime();
    filtered = filtered.filter(ag => new Date(ag.dataHoraInicio).getTime() >= inicio);
  }
  if (filters?.dataFim) {
    const fim = new Date(filters.dataFim).getTime();
    filtered = filtered.filter(ag => new Date(ag.dataHoraInicio).getTime() <= fim);
  }
  if (filters?.pacienteId) {
    filtered = filtered.filter(ag => ag.pacienteId === filters.pacienteId);
  }
  if (filters?.tipo) {
    filtered = filtered.filter(ag => ag.tipoCompromisso === filters.tipo);
  }
  if (filters?.status) {
    filtered = filtered.filter(ag => ag.status === filters.status);
  }
  
  console.log('[listAgendamentos] Após filtros:', filtered.length, 'agendamentos');
  return filtered;
}

// Cancelar agendamento (não apaga, apenas marca como cancelado)
export async function cancelarAgendamento(id: number, motivo: string, canceladoPor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar dados anteriores
  const anterior = await getAgendamentoById(id);
  if (!anterior) throw new Error("Agendamento não encontrado");
  
  // Atualizar status
  await db.update(agendamentos)
    .set({
      status: "Cancelado",
      canceladoEm: new Date(),
      canceladoPor,
      motivoCancelamento: motivo,
    })
    .where(eq(agendamentos.id, id));
  
  // Registrar no histórico
  await db.insert(historicoAgendamentos).values({
    agendamentoId: id,
    tipoAlteracao: "Cancelamento",
    descricaoAlteracao: `Cancelado por ${canceladoPor}. Motivo: ${motivo}`,
    valoresAnteriores: anterior as any,
    realizadoPor: canceladoPor,
  });
  
  return getAgendamentoById(id);
}

// Reagendar (cria novo agendamento vinculado ao original)
export async function reagendarAgendamento(
  idOriginal: number,
  novaDataInicio: Date,
  novaDataFim: Date,
  reagendadoPor: string,
  motivo?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar agendamento original
  const original = await getAgendamentoById(idOriginal);
  if (!original) throw new Error("Agendamento original não encontrado");
  
  // Marcar original como reagendado
  await db.update(agendamentos)
    .set({
      status: "Reagendado",
    })
    .where(eq(agendamentos.id, idOriginal));
  
  // Registrar no histórico do original
  await db.insert(historicoAgendamentos).values({
    agendamentoId: idOriginal,
    tipoAlteracao: "Reagendamento",
    descricaoAlteracao: `Reagendado por ${reagendadoPor}. ${motivo || ''}`,
    valoresAnteriores: original as any,
    realizadoPor: reagendadoPor,
  });
  
  // Criar novo agendamento
  const novoId = await getNextAgendamentoId();
  const novoAgendamento: InsertAgendamento = {
    idAgendamento: novoId,
    tipoCompromisso: original.tipoCompromisso,
    pacienteId: original.pacienteId,
    pacienteNome: original.pacienteNome,
    dataHoraInicio: novaDataInicio,
    dataHoraFim: novaDataFim,
    local: original.local,
    status: "Agendado",
    titulo: original.titulo,
    descricao: original.descricao,
    reagendadoDe: idOriginal,
    criadoPor: reagendadoPor,
  };
  
  return createAgendamento(novoAgendamento);
}

// Confirmar agendamento
export async function confirmarAgendamento(id: number, confirmadoPor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agendamentos)
    .set({
      status: "Confirmado",
      confirmadoEm: new Date(),
      confirmadoPor,
    })
    .where(eq(agendamentos.id, id));
  
  await db.insert(historicoAgendamentos).values({
    agendamentoId: id,
    tipoAlteracao: "Confirmação",
    descricaoAlteracao: `Confirmado por ${confirmadoPor}`,
    realizadoPor: confirmadoPor,
  });
  
  return getAgendamentoById(id);
}

// Marcar como realizado
export async function realizarAgendamento(id: number, realizadoPor: string, atendimentoId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agendamentos)
    .set({
      status: "Realizado",
      realizadoEm: new Date(),
      realizadoPor,
      atendimentoId,
    })
    .where(eq(agendamentos.id, id));
  
  await db.insert(historicoAgendamentos).values({
    agendamentoId: id,
    tipoAlteracao: "Realização",
    descricaoAlteracao: `Realizado por ${realizadoPor}`,
    realizadoPor,
  });
  
  return getAgendamentoById(id);
}

// Marcar falta
export async function marcarFaltaAgendamento(id: number, marcadoPor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agendamentos)
    .set({
      status: "Faltou",
      marcadoFaltaEm: new Date(),
      marcadoFaltaPor: marcadoPor,
    })
    .where(eq(agendamentos.id, id));
  
  await db.insert(historicoAgendamentos).values({
    agendamentoId: id,
    tipoAlteracao: "Falta",
    descricaoAlteracao: `Falta registrada por ${marcadoPor}`,
    realizadoPor: marcadoPor,
  });
  
  return getAgendamentoById(id);
}

// ===== BLOQUEIOS DE HORÁRIO =====

export async function createBloqueio(data: InsertBloqueioHorario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bloqueiosHorario).values(data);
  const insertedId = Number(result[0].insertId);
  
  return getBloqueioById(insertedId);
}

export async function getBloqueioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(bloqueiosHorario)
    .where(eq(bloqueiosHorario.id, id))
    .limit(1);
  
  return result[0];
}

export async function listBloqueios(filters?: {
  dataInicio?: Date;
  dataFim?: Date;
  incluirCancelados?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (filters?.dataInicio) {
    conditions.push(sql`${bloqueiosHorario.dataHoraInicio} >= ${filters.dataInicio}`);
  }
  if (filters?.dataFim) {
    conditions.push(sql`${bloqueiosHorario.dataHoraInicio} <= ${filters.dataFim}`);
  }
  if (!filters?.incluirCancelados) {
    conditions.push(eq(bloqueiosHorario.cancelado, false));
  }
  
  let query = db.select().from(bloqueiosHorario);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }
  
  query = query.orderBy(asc(bloqueiosHorario.dataHoraInicio)) as any;
  
  return await query;
}

export async function cancelarBloqueio(id: number, motivo: string, canceladoPor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bloqueiosHorario)
    .set({
      cancelado: true,
      canceladoEm: new Date(),
      canceladoPor,
      motivoCancelamento: motivo,
    })
    .where(eq(bloqueiosHorario.id, id));
  
  return getBloqueioById(id);
}

// Buscar histórico de um agendamento
export async function getHistoricoAgendamento(agendamentoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(historicoAgendamentos)
    .where(eq(historicoAgendamentos.agendamentoId, agendamentoId))
    .orderBy(desc(historicoAgendamentos.createdAt));
}


// ============================================
// PERFIS DE USUÁRIO
// ============================================

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getUserProfileByCpf(cpf: string): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.cpf, cpf)).limit(1);
  return result[0] || null;
}

export async function createUserProfile(data: InsertUserProfile): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userProfiles).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(userProfiles).where(eq(userProfiles.id, insertId)).limit(1);
  return created[0];
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  return getUserProfile(userId);
}

export async function setPerfilAtivo(userId: number, perfil: "admin_master" | "medico" | "secretaria" | "auditor" | "paciente"): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Verificar se o usuário tem o perfil solicitado
  const profile = await getUserProfile(userId);
  if (!profile) return null;
  
  const perfilMap = {
    admin_master: profile.isAdminMaster,
    medico: profile.isMedico,
    secretaria: profile.isSecretaria,
    auditor: profile.isAuditor,
    paciente: profile.isPaciente,
  };
  
  if (!perfilMap[perfil]) {
    throw new Error(`Usuário não possui o perfil ${perfil}`);
  }
  
  await db.update(userProfiles).set({ perfilAtivo: perfil }).where(eq(userProfiles.userId, userId));
  return getUserProfile(userId);
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(userProfiles).orderBy(asc(userProfiles.nomeCompleto));
}

export async function getAvailablePerfis(userId: number): Promise<string[]> {
  const profile = await getUserProfile(userId);
  if (!profile) return [];
  
  const perfis: string[] = [];
  if (profile.isAdminMaster) perfis.push("admin_master");
  if (profile.isMedico) perfis.push("medico");
  if (profile.isSecretaria) perfis.push("secretaria");
  if (profile.isAuditor) perfis.push("auditor");
  if (profile.isPaciente) perfis.push("paciente");
  
  return perfis;
}

// ============================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================

export async function getUserSettings(userProfileId: number, categoria?: string): Promise<UserSetting[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (categoria) {
    return db.select().from(userSettings)
      .where(and(
        eq(userSettings.userProfileId, userProfileId),
        eq(userSettings.categoria, categoria)
      ));
  }
  
  return db.select().from(userSettings).where(eq(userSettings.userProfileId, userProfileId));
}

export async function upsertUserSetting(data: { userProfileId: number; categoria: string; chave: string; valor: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Verificar se já existe
  const existing = await db.select().from(userSettings)
    .where(and(
      eq(userSettings.userProfileId, data.userProfileId),
      eq(userSettings.categoria, data.categoria),
      eq(userSettings.chave, data.chave)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(userSettings)
      .set({ valor: data.valor })
      .where(eq(userSettings.id, existing[0].id));
  } else {
    await db.insert(userSettings).values(data);
  }
}

export async function deleteUserSetting(userProfileId: number, categoria: string, chave: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(userSettings).where(and(
    eq(userSettings.userProfileId, userProfileId),
    eq(userSettings.categoria, categoria),
    eq(userSettings.chave, chave)
  ));
}

// Função para criar ou vincular perfil ao usuário logado
export async function ensureUserProfile(userId: number, userData: { name?: string; email?: string }): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe perfil para este usuário
  let profile = await getUserProfile(userId);
  
  if (!profile) {
    // Criar perfil padrão
    profile = await createUserProfile({
      userId,
      nomeCompleto: userData.name || null,
      email: userData.email || null,
      perfilAtivo: "paciente",
      isPaciente: true,
    });
  }
  
  return profile;
}


// ========================================
// VÍNCULO SECRETÁRIA-MÉDICO
// ========================================

export interface VinculoSecretariaMedico {
  id: number;
  secretariaUserId: string;
  medicoUserId: string;
  dataInicio: Date;
  dataValidade: Date;
  status: "ativo" | "pendente_renovacao" | "expirado" | "cancelado";
  notificacaoEnviada: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cria um novo vínculo entre secretária e médico
 * Validade padrão: 1 ano a partir da data de início
 */
export async function criarVinculo(
  secretariaUserId: string,
  medicoUserId: string,
  dataInicio: Date = new Date()
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular data de validade (1 ano após início)
  const dataValidade = new Date(dataInicio);
  dataValidade.setFullYear(dataValidade.getFullYear() + 1);

  const result = await db.insert(vinculoSecretariaMedico).values({
    secretariaUserId,
    medicoUserId,
    dataInicio,
    dataValidade,
    status: "ativo",
    notificacaoEnviada: false,
  });

  const vinculoId = Number(result[0].insertId);

  // Registrar no histórico
  await db.insert(historicoVinculo).values({
    vinculoId,
    acao: "criado",
    observacao: `Vínculo criado com validade até ${dataValidade.toLocaleDateString("pt-BR")}`,
  });

  return vinculoId;
}

/**
 * Lista os vínculos de uma secretária
 */
export async function listarVinculosSecretaria(secretariaUserId: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const vinculos = await db
    .select()
    .from(vinculoSecretariaMedico)
    .where(eq(vinculoSecretariaMedico.secretariaUserId, secretariaUserId));

  // Buscar informações dos médicos vinculados
  const result = [];
  for (const vinculo of vinculos) {
    // Buscar o user pelo openId para obter o userId numérico
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.openId, vinculo.medicoUserId))
      .limit(1);
    
    if (userResult.length === 0) {
      result.push({ ...vinculo, medico: null });
      continue;
    }

    const medico = await db
      .select({
        nomeCompleto: userProfiles.nomeCompleto,
        email: userProfiles.email,
        crm: userProfiles.crm,
        especialidade: userProfiles.especialidade,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userResult[0].id))
      .limit(1);

    result.push({
      ...vinculo,
      medico: medico[0] || null,
    });
  }

  return result;
}

/**
 * Lista os vínculos de um médico (secretárias vinculadas)
 */
export async function listarVinculosMedico(medicoUserId: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const vinculos = await db
    .select()
    .from(vinculoSecretariaMedico)
    .where(eq(vinculoSecretariaMedico.medicoUserId, medicoUserId));

  // Buscar informações das secretárias vinculadas
  const result = [];
  for (const vinculo of vinculos) {
    // Buscar o user pelo openId para obter o userId numérico
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.openId, vinculo.secretariaUserId))
      .limit(1);
    
    if (userResult.length === 0) {
      result.push({ ...vinculo, secretaria: null });
      continue;
    }

    const secretaria = await db
      .select({
        nomeCompleto: userProfiles.nomeCompleto,
        email: userProfiles.email,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userResult[0].id))
      .limit(1);

    result.push({
      ...vinculo,
      secretaria: secretaria[0] || null,
    });
  }

  return result;
}

/**
 * Renova um vínculo por mais 1 ano
 */
export async function renovarVinculo(vinculoId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar vínculo atual
  const vinculoAtual = await db
    .select()
    .from(vinculoSecretariaMedico)
    .where(eq(vinculoSecretariaMedico.id, vinculoId))
    .limit(1);

  if (vinculoAtual.length === 0) {
    throw new Error("Vínculo não encontrado");
  }

  // Calcular nova data de validade (1 ano a partir de agora)
  const novaDataValidade = new Date();
  novaDataValidade.setFullYear(novaDataValidade.getFullYear() + 1);

  await db
    .update(vinculoSecretariaMedico)
    .set({
      dataValidade: novaDataValidade,
      status: "ativo",
      notificacaoEnviada: false,
    })
    .where(eq(vinculoSecretariaMedico.id, vinculoId));

  // Registrar no histórico
  await db.insert(historicoVinculo).values({
    vinculoId,
    acao: "renovado",
    observacao: `Vínculo renovado até ${novaDataValidade.toLocaleDateString("pt-BR")}`,
  });
}

/**
 * Cancela um vínculo
 */
export async function cancelarVinculo(vinculoId: number, motivo?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vinculoSecretariaMedico)
    .set({ status: "cancelado" })
    .where(eq(vinculoSecretariaMedico.id, vinculoId));

  // Registrar no histórico
  await db.insert(historicoVinculo).values({
    vinculoId,
    acao: "cancelado",
    observacao: motivo || "Vínculo cancelado pelo usuário",
  });
}

/**
 * Verifica vínculos próximos de expirar (30 dias) e marca para notificação
 */
export async function verificarVinculosExpirando(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + 30);

  // Buscar vínculos ativos que expiram nos próximos 30 dias e ainda não foram notificados
  const vinculosExpirando = await db
    .select()
    .from(vinculoSecretariaMedico)
    .where(
      and(
        eq(vinculoSecretariaMedico.status, "ativo"),
        eq(vinculoSecretariaMedico.notificacaoEnviada, false),
        sql`${vinculoSecretariaMedico.dataValidade} <= ${dataLimite}`
      )!
    );

  // Marcar como pendente de renovação
  for (const vinculo of vinculosExpirando) {
    await db
      .update(vinculoSecretariaMedico)
      .set({
        status: "pendente_renovacao",
        notificacaoEnviada: true,
      })
      .where(eq(vinculoSecretariaMedico.id, vinculo.id));
  }

  return vinculosExpirando;
}

/**
 * Atualiza especialidades do médico
 */
export async function atualizarEspecialidadesMedico(
  userId: string,
  especialidadePrincipal: string | null,
  especialidadeSecundaria: string | null,
  areaAtuacao: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(sql`
    UPDATE user_profiles 
    SET especialidade_principal = ${especialidadePrincipal},
        especialidade_secundaria = ${especialidadeSecundaria},
        area_atuacao = ${areaAtuacao}
    WHERE user_id = ${userId}
  `);
}

/**
 * Busca especialidades do médico
 */
export async function getEspecialidadesMedico(userId: string): Promise<{
  especialidadePrincipal: string | null;
  especialidadeSecundaria: string | null;
  areaAtuacao: string | null;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT especialidade_principal, especialidade_secundaria, area_atuacao
    FROM user_profiles
    WHERE user_id = ${userId}
  `);

  const rows = (result as unknown as any[][])[0];
  if (rows.length === 0) return null;

  return {
    especialidadePrincipal: rows[0].especialidade_principal,
    especialidadeSecundaria: rows[0].especialidade_secundaria,
    areaAtuacao: rows[0].area_atuacao,
  };
}


// ===== DOCUMENTOS EXTERNOS =====

import { documentosExternos, InsertDocumentoExterno, DocumentoExterno, patologias, InsertPatologia, Patologia } from "../drizzle/schema";

export async function listDocumentosExternos(pacienteId: number, categoria?: string): Promise<DocumentoExterno[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (categoria) {
    return db
      .select()
      .from(documentosExternos)
      .where(and(
        eq(documentosExternos.pacienteId, pacienteId),
        eq(documentosExternos.categoria, categoria as any)
      ))
      .orderBy(desc(documentosExternos.dataDocumento));
  }
  
  return db
    .select()
    .from(documentosExternos)
    .where(eq(documentosExternos.pacienteId, pacienteId))
    .orderBy(desc(documentosExternos.dataDocumento));
}

export async function createDocumentoExterno(data: InsertDocumentoExterno): Promise<DocumentoExterno> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(documentosExternos).values(data);
  return { id: result.insertId, ...data } as DocumentoExterno;
}

export async function getDocumentoExterno(id: number): Promise<DocumentoExterno | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(documentosExternos)
    .where(eq(documentosExternos.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function updateDocumentoExterno(id: number, data: Partial<InsertDocumentoExterno>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(documentosExternos).set(data).where(eq(documentosExternos.id, id));
}

// ===== PATOLOGIA =====

export async function listPatologias(pacienteId: number): Promise<Patologia[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(patologias)
    .where(eq(patologias.pacienteId, pacienteId))
    .orderBy(desc(patologias.dataColeta));
}

export async function createPatologia(data: InsertPatologia): Promise<Patologia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(patologias).values(data);
  return { id: result.insertId, ...data } as Patologia;
}

export async function getPatologia(id: number): Promise<Patologia | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(patologias)
    .where(eq(patologias.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function updatePatologia(id: number, data: Partial<InsertPatologia>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(patologias).set(data).where(eq(patologias.id, id));
}


// ===== RESULTADOS LABORATORIAIS ESTRUTURADOS =====

import { examesPadronizados, resultadosLaboratoriais, InsertResultadoLaboratorial, ResultadoLaboratorial, ExamePadronizado, InsertExamePadronizado } from "../drizzle/schema";

export async function listResultadosLaboratoriais(pacienteId: number): Promise<ResultadoLaboratorial[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(resultadosLaboratoriais)
    .where(eq(resultadosLaboratoriais.pacienteId, pacienteId))
    .orderBy(desc(resultadosLaboratoriais.dataColeta));
}

export async function listResultadosPorExame(pacienteId: number, nomeExame: string): Promise<ResultadoLaboratorial[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(resultadosLaboratoriais)
    .where(and(
      eq(resultadosLaboratoriais.pacienteId, pacienteId),
      eq(resultadosLaboratoriais.nomeExameOriginal, nomeExame)
    )!)
    .orderBy(desc(resultadosLaboratoriais.dataColeta));
}

export async function getFluxogramaLaboratorial(pacienteId: number): Promise<{
  exames: string[];
  datas: string[];
  resultados: Record<string, Record<string, { valor: string; foraRef: boolean; tipo: string }>>;
}> {
  const db = await getDb();
  if (!db) return { exames: [], datas: [], resultados: {} };
  
  const todos = await listResultadosLaboratoriais(pacienteId);
  
  // Agrupar por exame e data
  const examesSet = new Set<string>();
  const datasSet = new Set<string>();
  const resultados: Record<string, Record<string, { valor: string; foraRef: boolean; tipo: string }>> = {};
  
  for (const r of todos) {
    const exame = r.nomeExameOriginal;
    // dataColeta pode ser Date ou string dependendo do driver
    const dataStr = r.dataColeta instanceof Date 
      ? r.dataColeta.toISOString().split('T')[0] 
      : String(r.dataColeta);
    
    examesSet.add(exame);
    datasSet.add(dataStr);
    
    if (!resultados[exame]) resultados[exame] = {};
    resultados[exame][dataStr] = {
      valor: r.resultado,
      foraRef: r.foraReferencia || false,
      tipo: r.tipoAlteracao || 'Normal'
    };
  }
  
  // Ordenar datas (mais recente primeiro)
  const datas = Array.from(datasSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const exames = Array.from(examesSet).sort();
  
  return { exames, datas, resultados };
}

export async function createResultadoLaboratorial(data: InsertResultadoLaboratorial): Promise<ResultadoLaboratorial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Determinar se está fora da referência
  if (data.resultadoNumerico && (data.valorReferenciaMin || data.valorReferenciaMax)) {
    const valor = Number(data.resultadoNumerico);
    const min = data.valorReferenciaMin ? Number(data.valorReferenciaMin) : null;
    const max = data.valorReferenciaMax ? Number(data.valorReferenciaMax) : null;
    
    if (min !== null && valor < min) {
      data.foraReferencia = true;
      data.tipoAlteracao = 'Diminuído';
    } else if (max !== null && valor > max) {
      data.foraReferencia = true;
      data.tipoAlteracao = 'Aumentado';
    } else {
      data.foraReferencia = false;
      data.tipoAlteracao = 'Normal';
    }
  }
  
  const [result] = await db.insert(resultadosLaboratoriais).values(data);
  return { id: result.insertId, ...data } as ResultadoLaboratorial;
}

// Função para normalizar números do formato brasileiro para internacional
function normalizarNumero(valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  
  let str = String(valor).trim();
  
  // Remover caracteres não numéricos exceto vírgula, ponto e sinal negativo
  // Manter apenas o primeiro sinal negativo se existir
  const isNegative = str.startsWith('-');
  str = str.replace(/[^0-9.,]/g, '');
  
  // Detectar formato brasileiro: "14,2" ou "7.110" (milhar) ou "7.110,50"
  // Formato brasileiro usa ponto como separador de milhar e vírgula como decimal
  // Formato internacional usa vírgula como separador de milhar e ponto como decimal
  
  // Se tem vírgula e ponto, verificar qual vem por último (esse é o decimal)
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Formato brasileiro: 1.234,56 -> 1234.56
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Formato internacional: 1,234.56 -> 1234.56
    str = str.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    // Só tem vírgula: 14,2 -> 14.2
    str = str.replace(',', '.');
  }
  // Se só tem ponto, manter como está (já é formato internacional)
  
  if (isNegative) str = '-' + str;
  
  // Validar se é um número válido
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  
  return String(num);
}

export async function createManyResultadosLaboratoriais(dados: any[]): Promise<number> {
  console.log('[DB-FUNC] createManyResultadosLaboratoriais CHAMADA com', dados.length, 'itens');
  console.log('[DB-FUNC] Primeiro item:', JSON.stringify(dados[0], null, 2));
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dados.length === 0) return 0;
  
  // Processar cada resultado para normalizar números e determinar se está fora da referência
  const processados = dados.map(data => {
    // Normalizar valores numéricos
    const resultadoNumerico = normalizarNumero(data.resultadoNumerico);
    const valorReferenciaMin = normalizarNumero(data.valorReferenciaMin);
    const valorReferenciaMax = normalizarNumero(data.valorReferenciaMax);
    
    let foraReferencia = false;
    let tipoAlteracao = 'Normal';
    
    if (resultadoNumerico && (valorReferenciaMin || valorReferenciaMax)) {
      const valor = Number(resultadoNumerico);
      const min = valorReferenciaMin ? Number(valorReferenciaMin) : null;
      const max = valorReferenciaMax ? Number(valorReferenciaMax) : null;
      
      if (min !== null && valor < min) {
        foraReferencia = true;
        tipoAlteracao = 'Diminuído';
      } else if (max !== null && valor > max) {
        foraReferencia = true;
        tipoAlteracao = 'Aumentado';
      }
    }
    
    return {
      pacienteId: data.pacienteId,
      documentoExternoId: data.documentoExternoId || null,
      nomeExameOriginal: String(data.nomeExameOriginal || 'Exame'),
      dataColeta: String(data.dataColeta),
      resultado: String(data.resultado || 'N/A'),
      resultadoNumerico,
      unidade: data.unidade || null,
      valorReferenciaTexto: data.valorReferenciaTexto || null,
      valorReferenciaMin,
      valorReferenciaMax,
      foraReferencia,
      tipoAlteracao,
      laboratorio: data.laboratorio || null,
      extraidoPorIa: data.extraidoPorIa !== false,
    };
  });
  
  // Construir SQL direto para evitar problemas com o Drizzle ORM
  const escapeStr = (s: string | null | undefined): string => {
    if (s == null) return 'NULL';
    return `'${String(s).replace(/'/g, "''")}'`;
  };
  
  const escapeNum = (n: string | number | null | undefined): string => {
    if (n == null) return 'NULL';
    return String(n);
  };
  
  const valuesStr = processados.map(p => `(
    ${p.pacienteId},
    ${escapeNum(p.documentoExternoId)},
    ${escapeStr(p.nomeExameOriginal)},
    ${escapeStr(p.dataColeta)},
    ${escapeStr(p.resultado)},
    ${escapeNum(p.resultadoNumerico)},
    ${escapeStr(p.unidade)},
    ${escapeStr(p.valorReferenciaTexto)},
    ${escapeNum(p.valorReferenciaMin)},
    ${escapeNum(p.valorReferenciaMax)},
    ${p.foraReferencia ? 1 : 0},
    ${escapeStr(p.tipoAlteracao)},
    ${escapeStr(p.laboratorio)},
    ${p.extraidoPorIa ? 1 : 0}
  )`).join(',\n');
  
  const sqlQuery = `INSERT INTO resultados_laboratoriais 
    (paciente_id, documento_externo_id, nome_exame_original, data_coleta, resultado, 
     resultado_numerico, unidade, valor_referencia_texto, valor_referencia_min, 
     valor_referencia_max, fora_referencia, tipo_alteracao, laboratorio, extraido_por_ia) 
    VALUES ${valuesStr}`;
  
  console.log('[DB] Executando SQL direto para inserir resultados laboratoriais');
  await db.execute(sql.raw(sqlQuery));
  return processados.length;
}

export async function deleteResultadosLaboratoriaisPorDocumento(documentoExternoId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(resultadosLaboratoriais).where(eq(resultadosLaboratoriais.documentoExternoId, documentoExternoId));
}

// ===== EXAMES PADRONIZADOS =====

export async function listExamesPadronizados(): Promise<ExamePadronizado[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(examesPadronizados).orderBy(examesPadronizados.nome);
}

export async function getExamePadronizado(id: number): Promise<ExamePadronizado | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(examesPadronizados).where(eq(examesPadronizados.id, id)).limit(1);
  return result[0] || null;
}

export async function findExamePadronizadoPorNome(nome: string): Promise<ExamePadronizado | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar por nome exato primeiro
  let result = await db.select().from(examesPadronizados).where(eq(examesPadronizados.nome, nome)).limit(1);
  if (result[0]) return result[0];
  
  // Buscar por sinônimos (JSON array)
  const todos = await db.select().from(examesPadronizados);
  for (const exame of todos) {
    if (exame.sinonimos) {
      try {
        const sinonimos = JSON.parse(exame.sinonimos);
        if (Array.isArray(sinonimos) && sinonimos.some(s => s.toLowerCase() === nome.toLowerCase())) {
          return exame;
        }
      } catch {}
    }
  }
  
  return null;
}

export async function createExamePadronizado(data: InsertExamePadronizado): Promise<ExamePadronizado> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(examesPadronizados).values(data);
  return { id: result.insertId, ...data } as ExamePadronizado;
}


// ===== EXAMES FAVORITOS =====

export interface ExameFavorito {
  id: number;
  userId: string;
  nomeExame: string;
  categoria: string | null;
  ordem: number | null;
  ativo: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function listExamesFavoritos(userId: string): Promise<ExameFavorito[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(examesFavoritos)
    .where(and(
      eq(examesFavoritos.userId, userId),
      eq(examesFavoritos.ativo, true)
    ))
    .orderBy(examesFavoritos.ordem) as any;
}

export async function addExameFavorito(userId: string, nomeExame: string, categoria?: string): Promise<ExameFavorito> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db
    .select()
    .from(examesFavoritos)
    .where(and(
      eq(examesFavoritos.userId, userId),
      eq(examesFavoritos.nomeExame, nomeExame)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Reativar se estava inativo
    await db.update(examesFavoritos)
      .set({ ativo: true })
      .where(eq(examesFavoritos.id, existing[0].id));
    return existing[0] as ExameFavorito;
  }
  
  // Obter próxima ordem
  const maxOrdem = await db
    .select({ maxOrdem: sql<number>`MAX(ordem)` })
    .from(examesFavoritos)
    .where(eq(examesFavoritos.userId, userId));
  
  const ordem = (maxOrdem[0]?.maxOrdem || 0) + 1;
  
  const [result] = await db.insert(examesFavoritos).values({
    userId,
    nomeExame,
    categoria: categoria || "Geral",
    ordem,
    ativo: true,
  });
  
  return { id: result.insertId, userId, nomeExame, categoria: categoria || "Geral", ordem, ativo: true, createdAt: new Date(), updatedAt: new Date() };
}

export async function removeExameFavorito(userId: string, nomeExame: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(examesFavoritos)
    .set({ ativo: false })
    .where(and(
      eq(examesFavoritos.userId, userId),
      eq(examesFavoritos.nomeExame, nomeExame)
    ));
}

export async function updateOrdemExamesFavoritos(userId: string, exames: { nomeExame: string; ordem: number }[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const exame of exames) {
    await db.update(examesFavoritos)
      .set({ ordem: exame.ordem })
      .where(and(
        eq(examesFavoritos.userId, userId),
        eq(examesFavoritos.nomeExame, exame.nomeExame)
      ));
  }
}


// ===== CADASTRO COMPLETO DE MÉDICOS =====

// Interfaces para os tipos
export interface MedicoCadastroPessoal {
  id: number;
  userProfileId: number;
  nomeCompleto: string;
  nomeSocial: string | null;
  sexo: 'Masculino' | 'Feminino' | 'Outro' | null;
  dataNascimento: string | null;
  nacionalidade: string | null;
  ufNascimento: string | null;
  cidadeNascimento: string | null;
  dddCelular: string | null;
  celular: string | null;
  dddResidencial: string | null;
  telefoneResidencial: string | null;
  dddComercial: string | null;
  telefoneComercial: string | null;
  nomeMae: string | null;
  nomePai: string | null;
  estadoCivil: string | null;
  nomeConjuge: string | null;
}

export interface MedicoEndereco {
  id: number;
  userProfileId: number;
  logradouro: string | null;
  enderecoResidencial: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface MedicoDocumentacao {
  id: number;
  userProfileId: number;
  rg: string | null;
  rgUf: string | null;
  rgOrgaoEmissor: string | null;
  rgDataEmissao: string | null;
  rgDigitalizadoUrl: string | null;
  numeroPis: string | null;
  numeroCns: string | null;
  cpf: string | null;
  cpfDigitalizadoUrl: string | null;
}

export interface MedicoBancario {
  id: number;
  userProfileId: number;
  banco: string | null;
  agencia: string | null;
  contaCorrente: string | null;
  tipoConta: 'Corrente' | 'Poupança' | null;
  ativo: boolean;
}

export interface MedicoConselho {
  id: number;
  userProfileId: number;
  conselho: string | null;
  numeroRegistro: string | null;
  uf: string | null;
  carteiraConselhoUrl: string | null;
  certidaoRqeUrl: string | null;
  codigoValidacao: string | null;
}

export interface MedicoFormacao {
  id: number;
  userProfileId: number;
  curso: string;
  instituicao: string;
  anoConclusao: number | null;
  certificadoUrl: string | null;
}

export interface MedicoEspecializacao {
  id: number;
  userProfileId: number;
  especializacao: string;
  instituicao: string;
  tituloEspecialista: boolean;
  registroConselho: boolean;
  rqe: string | null;
  certificadoUrl: string | null;
}

export interface MedicoLinks {
  id: number;
  userProfileId: number;
  curriculoLattes: string | null;
  linkedin: string | null;
  orcid: string | null;
  researchGate: string | null;
}

// Buscar cadastro pessoal
export async function getMedicoCadastroPessoal(userProfileId: number): Promise<MedicoCadastroPessoal | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`SELECT * FROM medico_cadastro_pessoal WHERE user_profile_id = ${userProfileId} LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    nomeCompleto: row.nome_completo,
    nomeSocial: row.nome_social,
    sexo: row.sexo,
    dataNascimento: row.data_nascimento,
    nacionalidade: row.nacionalidade,
    ufNascimento: row.uf_nascimento,
    cidadeNascimento: row.cidade_nascimento,
    dddCelular: row.ddd_celular,
    celular: row.celular,
    dddResidencial: row.ddd_residencial,
    telefoneResidencial: row.telefone_residencial,
    dddComercial: row.ddd_comercial,
    telefoneComercial: row.telefone_comercial,
    nomeMae: row.nome_mae,
    nomePai: row.nome_pai,
    estadoCivil: row.estado_civil,
    nomeConjuge: row.nome_conjuge,
  };
}

// Salvar/atualizar cadastro pessoal
export async function upsertMedicoCadastroPessoal(data: Partial<MedicoCadastroPessoal> & { userProfileId: number }): Promise<MedicoCadastroPessoal | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMedicoCadastroPessoal(data.userProfileId);
  
  if (existing) {
    await db.execute(sql`
      UPDATE medico_cadastro_pessoal SET
        nome_completo = ${data.nomeCompleto || existing.nomeCompleto},
        nome_social = ${data.nomeSocial ?? existing.nomeSocial},
        sexo = ${data.sexo ?? existing.sexo},
        data_nascimento = ${data.dataNascimento ?? existing.dataNascimento},
        nacionalidade = ${data.nacionalidade ?? existing.nacionalidade},
        uf_nascimento = ${data.ufNascimento ?? existing.ufNascimento},
        cidade_nascimento = ${data.cidadeNascimento ?? existing.cidadeNascimento},
        ddd_celular = ${data.dddCelular ?? existing.dddCelular},
        celular = ${data.celular ?? existing.celular},
        ddd_residencial = ${data.dddResidencial ?? existing.dddResidencial},
        telefone_residencial = ${data.telefoneResidencial ?? existing.telefoneResidencial},
        ddd_comercial = ${data.dddComercial ?? existing.dddComercial},
        telefone_comercial = ${data.telefoneComercial ?? existing.telefoneComercial},
        nome_mae = ${data.nomeMae ?? existing.nomeMae},
        nome_pai = ${data.nomePai ?? existing.nomePai},
        estado_civil = ${data.estadoCivil ?? existing.estadoCivil},
        nome_conjuge = ${data.nomeConjuge ?? existing.nomeConjuge}
      WHERE user_profile_id = ${data.userProfileId}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO medico_cadastro_pessoal (user_profile_id, nome_completo, nome_social, sexo, data_nascimento, nacionalidade, uf_nascimento, cidade_nascimento, ddd_celular, celular, ddd_residencial, telefone_residencial, ddd_comercial, telefone_comercial, nome_mae, nome_pai, estado_civil, nome_conjuge)
      VALUES (${data.userProfileId}, ${data.nomeCompleto || ''}, ${data.nomeSocial || null}, ${data.sexo || null}, ${data.dataNascimento || null}, ${data.nacionalidade || 'Brasileira'}, ${data.ufNascimento || null}, ${data.cidadeNascimento || null}, ${data.dddCelular || null}, ${data.celular || null}, ${data.dddResidencial || null}, ${data.telefoneResidencial || null}, ${data.dddComercial || null}, ${data.telefoneComercial || null}, ${data.nomeMae || null}, ${data.nomePai || null}, ${data.estadoCivil || null}, ${data.nomeConjuge || null})
    `);
  }
  
  return getMedicoCadastroPessoal(data.userProfileId);
}

// Buscar endereço
export async function getMedicoEndereco(userProfileId: number): Promise<MedicoEndereco | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`SELECT * FROM medico_endereco WHERE user_profile_id = ${userProfileId} LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    logradouro: row.logradouro,
    enderecoResidencial: row.endereco_residencial,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    cidade: row.cidade,
    uf: row.uf,
    cep: row.cep,
  };
}

// Salvar/atualizar endereço
export async function upsertMedicoEndereco(data: Partial<MedicoEndereco> & { userProfileId: number }): Promise<MedicoEndereco | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMedicoEndereco(data.userProfileId);
  
  if (existing) {
    await db.execute(sql`
      UPDATE medico_endereco SET
        logradouro = ${data.logradouro ?? existing.logradouro},
        endereco_residencial = ${data.enderecoResidencial ?? existing.enderecoResidencial},
        numero = ${data.numero ?? existing.numero},
        complemento = ${data.complemento ?? existing.complemento},
        bairro = ${data.bairro ?? existing.bairro},
        cidade = ${data.cidade ?? existing.cidade},
        uf = ${data.uf ?? existing.uf},
        cep = ${data.cep ?? existing.cep}
      WHERE user_profile_id = ${data.userProfileId}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO medico_endereco (user_profile_id, logradouro, endereco_residencial, numero, complemento, bairro, cidade, uf, cep)
      VALUES (${data.userProfileId}, ${data.logradouro || null}, ${data.enderecoResidencial || null}, ${data.numero || null}, ${data.complemento || null}, ${data.bairro || null}, ${data.cidade || null}, ${data.uf || null}, ${data.cep || null})
    `);
  }
  
  return getMedicoEndereco(data.userProfileId);
}

// Buscar documentação
export async function getMedicoDocumentacao(userProfileId: number): Promise<MedicoDocumentacao | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`SELECT * FROM medico_documentacao WHERE user_profile_id = ${userProfileId} LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    rg: row.rg,
    rgUf: row.rg_uf,
    rgOrgaoEmissor: row.rg_orgao_emissor,
    rgDataEmissao: row.rg_data_emissao,
    rgDigitalizadoUrl: row.rg_digitalizado_url,
    numeroPis: row.numero_pis,
    numeroCns: row.numero_cns,
    cpf: row.cpf,
    cpfDigitalizadoUrl: row.cpf_digitalizado_url,
  };
}

// Salvar/atualizar documentação
export async function upsertMedicoDocumentacao(data: Partial<MedicoDocumentacao> & { userProfileId: number }): Promise<MedicoDocumentacao | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMedicoDocumentacao(data.userProfileId);
  
  if (existing) {
    await db.execute(sql`
      UPDATE medico_documentacao SET
        rg = ${data.rg ?? existing.rg},
        rg_uf = ${data.rgUf ?? existing.rgUf},
        rg_orgao_emissor = ${data.rgOrgaoEmissor ?? existing.rgOrgaoEmissor},
        rg_data_emissao = ${data.rgDataEmissao ?? existing.rgDataEmissao},
        rg_digitalizado_url = ${data.rgDigitalizadoUrl ?? existing.rgDigitalizadoUrl},
        numero_pis = ${data.numeroPis ?? existing.numeroPis},
        numero_cns = ${data.numeroCns ?? existing.numeroCns},
        cpf = ${data.cpf ?? existing.cpf},
        cpf_digitalizado_url = ${data.cpfDigitalizadoUrl ?? existing.cpfDigitalizadoUrl}
      WHERE user_profile_id = ${data.userProfileId}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO medico_documentacao (user_profile_id, rg, rg_uf, rg_orgao_emissor, rg_data_emissao, rg_digitalizado_url, numero_pis, numero_cns, cpf, cpf_digitalizado_url)
      VALUES (${data.userProfileId}, ${data.rg || null}, ${data.rgUf || null}, ${data.rgOrgaoEmissor || null}, ${data.rgDataEmissao || null}, ${data.rgDigitalizadoUrl || null}, ${data.numeroPis || null}, ${data.numeroCns || null}, ${data.cpf || null}, ${data.cpfDigitalizadoUrl || null})
    `);
  }
  
  return getMedicoDocumentacao(data.userProfileId);
}

// Buscar informações bancárias
export async function getMedicoBancario(userProfileId: number): Promise<MedicoBancario[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`SELECT * FROM medico_bancario WHERE user_profile_id = ${userProfileId} AND ativo = 1`);
  const rows = (result as any)[0] as any[];
  
  return rows.map(row => ({
    id: row.id,
    userProfileId: row.user_profile_id,
    banco: row.banco,
    agencia: row.agencia,
    contaCorrente: row.conta_corrente,
    tipoConta: row.tipo_conta,
    ativo: row.ativo,
  }));
}

// Adicionar conta bancária
export async function addMedicoBancario(data: Omit<MedicoBancario, 'id' | 'ativo'>): Promise<MedicoBancario> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO medico_bancario (user_profile_id, banco, agencia, conta_corrente, tipo_conta, ativo)
    VALUES (${data.userProfileId}, ${data.banco}, ${data.agencia}, ${data.contaCorrente}, ${data.tipoConta || 'Corrente'}, 1)
  `);
  
  return { ...data, id: (result[0] as any).insertId, ativo: true };
}

// Buscar conselho
export async function getMedicoConselho(userProfileId: number): Promise<MedicoConselho | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`SELECT * FROM medico_conselho WHERE user_profile_id = ${userProfileId} LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    conselho: row.conselho,
    numeroRegistro: row.numero_registro,
    uf: row.uf,
    carteiraConselhoUrl: row.carteira_conselho_url,
    certidaoRqeUrl: row.certidao_rqe_url,
    codigoValidacao: row.codigo_validacao,
  };
}

// Salvar/atualizar conselho
export async function upsertMedicoConselho(data: Partial<MedicoConselho> & { userProfileId: number }): Promise<MedicoConselho | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMedicoConselho(data.userProfileId);
  
  if (existing) {
    await db.execute(sql`
      UPDATE medico_conselho SET
        conselho = ${data.conselho ?? existing.conselho},
        numero_registro = ${data.numeroRegistro ?? existing.numeroRegistro},
        uf = ${data.uf ?? existing.uf},
        carteira_conselho_url = ${data.carteiraConselhoUrl ?? existing.carteiraConselhoUrl},
        certidao_rqe_url = ${data.certidaoRqeUrl ?? existing.certidaoRqeUrl},
        codigo_validacao = ${data.codigoValidacao ?? existing.codigoValidacao}
      WHERE user_profile_id = ${data.userProfileId}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO medico_conselho (user_profile_id, conselho, numero_registro, uf, carteira_conselho_url, certidao_rqe_url, codigo_validacao)
      VALUES (${data.userProfileId}, ${data.conselho || 'CRM'}, ${data.numeroRegistro || null}, ${data.uf || null}, ${data.carteiraConselhoUrl || null}, ${data.certidaoRqeUrl || null}, ${data.codigoValidacao || null})
    `);
  }
  
  return getMedicoConselho(data.userProfileId);
}

// Buscar formações
export async function getMedicoFormacoes(userProfileId: number): Promise<MedicoFormacao[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`SELECT * FROM medico_formacoes WHERE user_profile_id = ${userProfileId}`);
  const rows = (result as any)[0] as any[];
  
  return rows.map(row => ({
    id: row.id,
    userProfileId: row.user_profile_id,
    curso: row.curso,
    instituicao: row.instituicao,
    anoConclusao: row.ano_conclusao,
    certificadoUrl: row.certificado_url,
  }));
}

// Adicionar formação
export async function addMedicoFormacao(data: Omit<MedicoFormacao, 'id'>): Promise<MedicoFormacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO medico_formacoes (user_profile_id, curso, instituicao, ano_conclusao, certificado_url)
    VALUES (${data.userProfileId}, ${data.curso}, ${data.instituicao}, ${data.anoConclusao || null}, ${data.certificadoUrl || null})
  `);
  
  return { ...data, id: (result[0] as any).insertId };
}

// Remover formação
export async function removeMedicoFormacao(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`DELETE FROM medico_formacoes WHERE id = ${id}`);
}

// Buscar especializações
export async function getMedicoEspecializacoes(userProfileId: number): Promise<MedicoEspecializacao[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`SELECT * FROM medico_especializacoes WHERE user_profile_id = ${userProfileId}`);
  const rows = (result as any)[0] as any[];
  
  return rows.map(row => ({
    id: row.id,
    userProfileId: row.user_profile_id,
    especializacao: row.especializacao,
    instituicao: row.instituicao,
    tituloEspecialista: row.titulo_especialista,
    registroConselho: row.registro_conselho,
    rqe: row.rqe,
    certificadoUrl: row.certificado_url,
  }));
}

// Adicionar especialização
export async function addMedicoEspecializacao(data: Omit<MedicoEspecializacao, 'id'>): Promise<MedicoEspecializacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO medico_especializacoes (user_profile_id, especializacao, instituicao, titulo_especialista, registro_conselho, rqe, certificado_url)
    VALUES (${data.userProfileId}, ${data.especializacao}, ${data.instituicao}, ${data.tituloEspecialista ? 1 : 0}, ${data.registroConselho ? 1 : 0}, ${data.rqe || null}, ${data.certificadoUrl || null})
  `);
  
  return { ...data, id: (result[0] as any).insertId };
}

// Remover especialização
export async function removeMedicoEspecializacao(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`DELETE FROM medico_especializacoes WHERE id = ${id}`);
}

// Buscar links profissionais
export async function getMedicoLinks(userProfileId: number): Promise<MedicoLinks | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`SELECT * FROM medico_links WHERE user_profile_id = ${userProfileId} LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    curriculoLattes: row.curriculo_lattes,
    linkedin: row.linkedin,
    orcid: row.orcid,
    researchGate: row.research_gate,
  };
}

// Salvar/atualizar links
export async function upsertMedicoLinks(data: Partial<MedicoLinks> & { userProfileId: number }): Promise<MedicoLinks | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMedicoLinks(data.userProfileId);
  
  if (existing) {
    await db.execute(sql`
      UPDATE medico_links SET
        curriculo_lattes = ${data.curriculoLattes ?? existing.curriculoLattes},
        linkedin = ${data.linkedin ?? existing.linkedin},
        orcid = ${data.orcid ?? existing.orcid},
        research_gate = ${data.researchGate ?? existing.researchGate}
      WHERE user_profile_id = ${data.userProfileId}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO medico_links (user_profile_id, curriculo_lattes, linkedin, orcid, research_gate)
      VALUES (${data.userProfileId}, ${data.curriculoLattes || null}, ${data.linkedin || null}, ${data.orcid || null}, ${data.researchGate || null})
    `);
  }
  
  return getMedicoLinks(data.userProfileId);
}

// Buscar cadastro completo do médico
export async function getMedicoCadastroCompleto(userProfileId: number) {
  const [pessoal, endereco, documentacao, bancario, conselho, formacoes, especializacoes, links] = await Promise.all([
    getMedicoCadastroPessoal(userProfileId),
    getMedicoEndereco(userProfileId),
    getMedicoDocumentacao(userProfileId),
    getMedicoBancario(userProfileId),
    getMedicoConselho(userProfileId),
    getMedicoFormacoes(userProfileId),
    getMedicoEspecializacoes(userProfileId),
    getMedicoLinks(userProfileId),
  ]);
  
  return {
    pessoal,
    endereco,
    documentacao,
    bancario,
    conselho,
    formacoes,
    especializacoes,
    links,
  };
}
