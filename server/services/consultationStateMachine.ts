/**
 * Serviço de Máquina de Estados para Consultas
 * 
 * Implementa a lógica de transição de estados de uma consulta:
 * agendado → confirmado → aguardando → em_consulta → finalizado
 *                      ↘ cancelado (em qualquer momento)
 */

import { sql } from "drizzle-orm";

export type ConsultationStatus =
  | "agendado"
  | "confirmado"
  | "aguardando"
  | "em_consulta"
  | "finalizado"
  | "cancelado";

export interface StateTransition {
  from: ConsultationStatus;
  to: ConsultationStatus;
  allowed: boolean;
  reason?: string;
}

/**
 * Matriz de transições de estado permitidas
 */
const ALLOWED_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  agendado: ["confirmado", "cancelado"],
  confirmado: ["aguardando", "cancelado"],
  aguardando: ["em_consulta", "cancelado"],
  em_consulta: ["finalizado", "cancelado"],
  finalizado: [],
  cancelado: [],
};

/**
 * Valida se uma transição de estado é permitida
 */
export function isTransitionAllowed(
  from: ConsultationStatus,
  to: ConsultationStatus
): StateTransition {
  const allowed = ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

  return {
    from,
    to,
    allowed,
    reason: allowed
      ? undefined
      : `Transição de ${from} para ${to} não é permitida`,
  };
}

/**
 * Obtém descrição legível do status
 */
export function getStatusLabel(status: ConsultationStatus): string {
  const labels: Record<ConsultationStatus, string> = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    aguardando: "Aguardando",
    em_consulta: "Em Consulta",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };

  return labels[status] || status;
}

/**
 * Obtém cor para exibição visual do status
 */
export function getStatusColor(status: ConsultationStatus): string {
  const colors: Record<ConsultationStatus, string> = {
    agendado: "#3B82F6", // Azul
    confirmado: "#10B981", // Verde
    aguardando: "#F59E0B", // Âmbar
    em_consulta: "#8B5CF6", // Roxo
    finalizado: "#6B7280", // Cinza
    cancelado: "#EF4444", // Vermelho
  };

  return colors[status] || "#000000";
}

/**
 * Obtém as ações disponíveis para um status atual
 */
export function getAvailableActions(
  currentStatus: ConsultationStatus
): ConsultationStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] ?? [];
}
