/**
 * ============================================================================
 * MÓDULO: Funções de Banco de Dados para Documentos Pendentes
 * ============================================================================
 * Funções para gerenciar evoluções e documentos pendentes de assinatura
 * ============================================================================
 */

import { eq, and, desc, sql, or } from "drizzle-orm";
import { getDb } from "./db";
import { evolucoes, pacientes, documentosMedicos } from "../drizzle/schema";

// Interface para documento pendente
export interface DocumentoPendente {
  id: number;
  tipo: 'Evolução' | 'Documento Médico';
  pacienteId: number;
  pacienteNome: string;
  data: Date;
  createdAt: Date;
}

/**
 * Conta o total de documentos pendentes de assinatura
 * Inclui evoluções e documentos médicos com status 'pendente_assinatura' ou 'rascunho'
 */
export async function countDocumentosPendentes(tenantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Contar evoluções pendentes
    const evolucoesPendentes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(evolucoes)
      .where(
        and(
          eq(evolucoes.tenantId, tenantId),
          or(
            eq(evolucoes.statusAssinatura, 'pendente_assinatura'),
            eq(evolucoes.statusAssinatura, 'rascunho')
          ),
          eq(evolucoes.assinado, false)
        )
      );

    // Contar documentos médicos pendentes
    const documentosPendentes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentosMedicos)
      .where(
        and(
          eq(documentosMedicos.tenantId, tenantId),
          or(
            eq(documentosMedicos.statusAssinatura, 'pendente_assinatura'),
            eq(documentosMedicos.statusAssinatura, 'rascunho')
          ),
          eq(documentosMedicos.assinado, false)
        )
      );

    const totalEvolucoes = evolucoesPendentes[0]?.count || 0;
    const totalDocumentos = documentosPendentes[0]?.count || 0;

    return Number(totalEvolucoes) + Number(totalDocumentos);
  } catch (error) {
    console.error('[countDocumentosPendentes] Erro:', error);
    return 0;
  }
}

/**
 * Lista documentos pendentes de assinatura com detalhes do paciente
 */
export async function listDocumentosPendentes(
  tenantId: number,
  limit: number = 10,
  offset: number = 0
): Promise<DocumentoPendente[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar evoluções pendentes
    const evolucoesPendentes = await db
      .select({
        id: evolucoes.id,
        pacienteId: evolucoes.pacienteId,
        pacienteNome: pacientes.nome,
        data: evolucoes.dataEvolucao,
        createdAt: evolucoes.createdAt,
      })
      .from(evolucoes)
      .innerJoin(pacientes, eq(evolucoes.pacienteId, pacientes.id))
      .where(
        and(
          eq(evolucoes.tenantId, tenantId),
          or(
            eq(evolucoes.statusAssinatura, 'pendente_assinatura'),
            eq(evolucoes.statusAssinatura, 'rascunho')
          ),
          eq(evolucoes.assinado, false)
        )
      )
      .orderBy(desc(evolucoes.createdAt))
      .limit(limit)
      .offset(offset);

    // Mapear para o formato de DocumentoPendente
    const pendentes: DocumentoPendente[] = evolucoesPendentes.map(e => ({
      id: e.id,
      tipo: 'Evolução' as const,
      pacienteId: e.pacienteId,
      pacienteNome: e.pacienteNome || 'Paciente',
      data: e.data,
      createdAt: e.createdAt,
    }));

    return pendentes;
  } catch (error) {
    console.error('[listDocumentosPendentes] Erro:', error);
    return [];
  }
}

/**
 * Lista exames laboratoriais de um paciente (para importação na evolução)
 */
export async function listExamesPaciente(
  tenantId: number,
  pacienteId: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar documentos externos do tipo exame laboratorial
    const exames = await db.execute(sql`
      SELECT 
        de.id,
        de.nome_arquivo as nomeArquivo,
        de.categoria,
        de.data_documento as dataDocumento,
        de.laboratorio,
        de.created_at as createdAt
      FROM documentos_externos de
      WHERE de.tenant_id = ${tenantId}
        AND de.paciente_id = ${pacienteId}
        AND de.categoria = 'Exame Laboratorial'
      ORDER BY de.data_documento DESC, de.created_at DESC
      LIMIT 50
    `);

    return exames[0] as any[];
  } catch (error) {
    console.error('[listExamesPaciente] Erro:', error);
    return [];
  }
}
