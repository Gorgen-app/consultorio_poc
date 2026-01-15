import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AgendaWeekView } from "@/components/AgendaWeekView";
import { ConsultationDetailsModal } from "@/components/ConsultationDetailsModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  category: string;
  startAt: Date;
  endAt: Date;
  color?: string;
  status?: string;
  patientId?: string;
  professionalId?: string;
}

export default function Agenda() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar eventos da agenda
  const { data: events = [], isLoading } = trpc.agenda.events.list.useQuery({
    startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias à frente
    searchQuery: searchQuery || undefined,
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleSlotClick = (date: Date, time: string) => {
    // TODO: Abrir dialog de novo agendamento
    toast.info(`Novo agendamento em ${date.toLocaleDateString()} às ${time}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await trpc.agenda.events.delete.mutate({ id: selectedEvent.id });
      toast.success("Evento deletado com sucesso");
      setIsDetailsOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Erro ao deletar evento");
    }
  };

  // Converter eventos do banco para formato do componente
  const formattedEvents: Event[] = events.map((event: any) => ({
    id: event.id,
    title: event.title || `${event.category}`,
    category: event.category,
    startAt: new Date(event.startAt),
    endAt: new Date(event.endAt),
    color: event.color || "#3B82F6",
    status: event.status,
    patientId: event.patientId,
    professionalId: event.professionalId,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando agenda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Agenda Week View */}
      <AgendaWeekView
        events={formattedEvents}
        onEventClick={handleEventClick}
        onSlotClick={handleSlotClick}
        onSearch={handleSearch}
      />

      {/* Detalhes Modal */}
      <ConsultationDetailsModal
        isOpen={isDetailsOpen}
        consultation={selectedEvent}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={() => {
          // TODO: Abrir dialog de edição
          toast.info("Edição em desenvolvimento");
        }}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
