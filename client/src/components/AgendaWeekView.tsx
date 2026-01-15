/**
 * Componente de Visualização Semanal da Agenda
 * 
 * Exibe uma semana completa com 7 dias lado a lado
 * Horários de 00:00 até 23:30 com slots de 30 minutos
 */

import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, getWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface Event {
  id: string;
  title: string;
  category: string;
  startAt: Date;
  endAt: Date;
  color?: string;
  status?: string;
}

interface AgendaWeekViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, time: string) => void;
  onSearch?: (query: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 até 23:00
const SLOT_HEIGHT = 60; // pixels por 30 minutos

export function AgendaWeekView({
  events,
  onEventClick,
  onSlotClick,
  onSearch,
}: AgendaWeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekNumber = getWeek(currentDate, { weekStartsOn: 0 });

  const eventsByDay = useMemo(() => {
    const result: Record<string, Event[]> = {};
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      result[dayKey] = events.filter((event) =>
        isSameDay(new Date(event.startAt), day)
      );
    });
    return result;
  }, [events, weekDays]);

  const getEventStyle = (event: Event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes =
      (end.getTime() - start.getTime()) / (1000 * 60);

    const top = (startMinutes / 30) * SLOT_HEIGHT;
    const height = (durationMinutes / 30) * SLOT_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: event.color || "#3B82F6",
    };
  };

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[250px]">
            {format(weekStart, "MMMM yyyy", { locale: ptBR })} - semana {weekNumber}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-64"
          />
        </div>
      </div>

      {/* Grid de semana */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header com dias da semana */}
          <div className="flex border-b">
            <div className="w-20 flex-shrink-0 border-r bg-gray-50 p-2">
              <div className="text-xs font-semibold text-gray-600">Hora</div>
            </div>
            {weekDays.map((day) => (
              <div
                key={format(day, "yyyy-MM-dd")}
                className="flex-1 min-w-[150px] border-r p-2 text-center"
              >
                <div className="text-xs font-semibold text-gray-600">
                  {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isSameDay(day, new Date())
                      ? "text-blue-600 bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                      : "text-gray-900"
                  }`}
                >
                  {format(day, "dd")}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horários e eventos */}
          <div className="flex">
            {/* Coluna de horários */}
            <div className="w-20 flex-shrink-0 border-r bg-gray-50">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b text-xs text-gray-600 p-1 text-center font-semibold"
                  style={{ height: `${SLOT_HEIGHT * 2}px` }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
              {/* Linha para 23:30 */}
              <div
                className="border-b text-xs text-gray-600 p-1 text-center font-semibold"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                23:30
              </div>
            </div>

            {/* Colunas de dias */}
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[dayKey] || [];

              return (
                <div
                  key={dayKey}
                  className="flex-1 min-w-[150px] border-r relative"
                >
                  {/* Grid de horários */}
                  {HOURS.map((hour) => (
                    <div
                      key={`${dayKey}-${hour}`}
                      className="border-b relative cursor-pointer hover:bg-blue-50 transition-colors"
                      style={{ height: `${SLOT_HEIGHT * 2}px` }}
                      onClick={() =>
                        onSlotClick?.(day, `${String(hour).padStart(2, "0")}:00`)
                      }
                    >
                      {/* Linhas de meia hora */}
                      <div
                        className="absolute top-1/2 w-full border-t border-gray-200"
                        style={{ height: "1px" }}
                      />
                    </div>
                  ))}
                  {/* Slot final 23:30 */}
                  <div
                    className="border-b relative cursor-pointer hover:bg-blue-50 transition-colors"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onClick={() =>
                      onSlotClick?.(day, "23:30")
                    }
                  />

                  {/* Eventos do dia */}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-0 right-0 mx-1 rounded-md p-1 text-white text-xs cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                      style={getEventStyle(event)}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-semibold truncate">
                        {format(new Date(event.startAt), "HH:mm")}
                      </div>
                      <div className="truncate">{event.title}</div>
                      <div className="text-xs opacity-90 truncate">
                        {event.category}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
