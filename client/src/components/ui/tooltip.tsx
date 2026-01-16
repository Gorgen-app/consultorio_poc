/**
 * Tooltip - Componente de tooltip com delay de 2 segundos (padrão global)
 * 
 * Este componente substitui o tooltip.tsx original do Gorgen,
 * configurando o delay de 2 segundos como padrão em toda a aplicação.
 * 
 * IMPORTANTE: Este arquivo substitui client/src/components/ui/tooltip.tsx
 * 
 * @author Sistema Gorgen
 * @version 2.0.0
 */

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURAÇÃO GLOBAL DO TOOLTIP
// ============================================================================

/**
 * Delay padrão de 2 segundos (2000ms) conforme requisito
 * O tooltip só aparece após o cursor repousar por este tempo
 */
export const TOOLTIP_DELAY_MS = 2000;

/**
 * Delay para tooltips subsequentes quando já há um tooltip aberto
 * Permite navegação rápida entre tooltips após o primeiro
 */
export const SKIP_DELAY_MS = 300;

// ============================================================================
// COMPONENTES
// ============================================================================

/**
 * Provider global para tooltips com delay de 2 segundos
 * Deve envolver toda a aplicação (já configurado no App.tsx)
 */
function TooltipProvider({
  delayDuration = TOOLTIP_DELAY_MS,
  skipDelayDuration = SKIP_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

/**
 * Componente raiz do tooltip
 * Herda o delay do TooltipProvider pai, ou usa 2 segundos como padrão
 */
function Tooltip({
  delayDuration,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipPrimitive.Root 
      data-slot="tooltip" 
      delayDuration={delayDuration}
      {...props} 
    />
  );
}

/**
 * Trigger do tooltip - elemento que ativa o tooltip ao hover
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/**
 * Conteúdo do tooltip - caixa discreta com o texto
 * Estilizado para ser pequeno e discreto conforme requisito
 */
function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          // Estilo base: pequeno e discreto
          "z-50 overflow-hidden rounded-md px-3 py-1.5",
          // Cores
          "bg-foreground text-background",
          // Tipografia
          "text-xs text-balance",
          // Largura
          "w-fit max-w-xs",
          // Origem da transformação
          "origin-(--radix-tooltip-content-transform-origin)",
          // Animações suaves
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          // Animações direcionais
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow 
          className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" 
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider,
};
