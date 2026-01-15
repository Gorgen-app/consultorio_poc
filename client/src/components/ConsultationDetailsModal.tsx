/**
 * Modal de Detalhes de Consulta
 * 
 * Exibe informações completas da consulta com opções de:
 * - Editar (ícone de lápis)
 * - Deletar (ícone de lixeira)
 * - Fechar (ícone de X)
 */

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, X } from "lucide-react";

interface ConsultationDetailsModalProps {
  isOpen: boolean;
  consultation: any;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ConsultationDetailsModal({
  isOpen,
  consultation,
  onClose,
  onEdit,
  onDelete,
}: ConsultationDetailsModalProps) {
  if (!consultation) return null;

  const startTime = new Date(consultation.startAt);
  const endTime = new Date(consultation.endAt);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendado: "bg-blue-100 text-blue-800",
      confirmado: "bg-green-100 text-green-800",
      aguardando: "bg-yellow-100 text-yellow-800",
      em_consulta: "bg-purple-100 text-purple-800",
      finalizado: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Detalhes da Consulta</DialogTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="p-2"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="p-2 text-red-600 hover:text-red-700"
                title="Deletar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Básicas */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Tipo</label>
                <p className="font-medium">{consultation.category}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <Badge className={getStatusColor(consultation.status)}>
                  {consultation.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-600">Data</label>
                <p className="font-medium">
                  {format(startTime, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Horário</label>
                <p className="font-medium">
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                </p>
              </div>
            </div>
          </Card>

          {/* Informações do Paciente */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Paciente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">ID</label>
                <p className="font-medium">{consultation.patientId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Profissional</label>
                <p className="font-medium">
                  {consultation.professionalId || "Não atribuído"}
                </p>
              </div>
            </div>
          </Card>

          {/* Informações de Convênio */}
          {consultation.payerType === "convenio" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Convênio</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Operadora</label>
                  <p className="font-medium">{consultation.payerName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Plano</label>
                  <p className="font-medium">{consultation.planName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Matrícula</label>
                  <p className="font-medium">{consultation.memberId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Autorização</label>
                  <p className="font-medium">
                    {consultation.authorizationNumber || "Não informada"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Queixa Principal */}
          {consultation.chiefComplaint && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Queixa Principal</h3>
              <p className="text-sm text-gray-700">
                {consultation.chiefComplaint}
              </p>
            </Card>
          )}

          {/* Notas */}
          {consultation.notes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Notas</h3>
              <p className="text-sm text-gray-700">{consultation.notes}</p>
            </Card>
          )}

          {/* Datas */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Histórico</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Criado em</label>
                <p className="font-medium">
                  {format(new Date(consultation.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <label className="text-gray-600">Atualizado em</label>
                <p className="font-medium">
                  {format(new Date(consultation.updatedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
              Editar Consulta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
