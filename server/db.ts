import { eq, like, and, or, sql, desc, asc } from "drizzle-orm";
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
}): Promise<Paciente[]> {
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

  return query;
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
}): Promise<Atendimento[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(atendimentos);
  
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

  return query;
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

  const result = await db
    .select({ idPaciente: pacientes.idPaciente })
    .from(pacientes)
    .orderBy(desc(pacientes.id))
    .limit(1);

  if (result.length === 0) {
    return `${new Date().getFullYear()}-0000001`;
  }

  const lastId = result[0].idPaciente;
  if (!lastId) {
    return `${new Date().getFullYear()}-0000001`;
  }

  const parts = lastId.split("-");
  const year = new Date().getFullYear().toString();
  const lastNumber = parseInt(parts[1] || "0");
  const nextNumber = lastNumber + 1;

  return `${year}-${String(nextNumber).padStart(7, "0")}`;
}
