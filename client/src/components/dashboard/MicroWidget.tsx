import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface MicroWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * MicroWidget - Componente compacto para exibição de métricas numéricas
 * 
 * Características:
 * - Altura reduzida (metade de um widget padrão)
 * - Ideal para métricas numéricas simples
 * - Pode ser empilhado (2 por coluna)
 * - Segue o Gorgen Design System
 */
export function MicroWidget({ 
  label, 
  value, 
  unit, 
  icon,
  change,
  className 
}: MicroWidgetProps) {
  return (
    <Card className={cn("p-4 transition-all duration-200 hover:shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1 truncate">
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gorgen-700 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </span>
            {unit && (
              <span className="text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {change && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium mt-1',
              change.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {change.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {change.isPositive ? '+' : ''}{change.value}%
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gorgen-50 flex items-center justify-center text-gorgen-600 shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}

/**
 * MicroWidgetStack - Container para empilhar dois MicroWidgets
 */
interface MicroWidgetStackProps {
  children: React.ReactNode;
  className?: string;
}

export function MicroWidgetStack({ children, className }: MicroWidgetStackProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {children}
    </div>
  );
}

export default MicroWidget;
