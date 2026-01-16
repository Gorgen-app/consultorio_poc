/**
 * GORGEN Design System - Micro Widget
 * Componente compacto para métricas numéricas simples
 * Ocupa metade da altura de um widget padrão
 */

import { LucideIcon } from "lucide-react";

interface MicroWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function MicroWidget({
  label,
  value,
  unit,
  icon: Icon,
  iconClassName = "bg-gorgen-50 text-gorgen-600"
}: MicroWidgetProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gorgen-700">{value}</span>
          {unit && <span className="text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClassName}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default MicroWidget;
