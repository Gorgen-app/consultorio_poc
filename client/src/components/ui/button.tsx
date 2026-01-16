/**
 * Button - Componente de botão com tooltip integrado (delay de 2 segundos)
 * 
 * Este componente substitui o Button original do Gorgen, adicionando
 * suporte nativo a tooltips que aparecem após 2 segundos de hover.
 * 
 * IMPORTANTE: Este arquivo substitui client/src/components/ui/button.tsx
 * 
 * @author Sistema Gorgen
 * @version 2.0.0
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURAÇÃO DO TOOLTIP
// ============================================================================

/**
 * Delay de 2 segundos (2000ms) antes de mostrar o tooltip
 */
const TOOLTIP_DELAY_MS = 2000;

/**
 * Delay reduzido para navegação entre tooltips
 */
const SKIP_DELAY_MS = 300;

// ============================================================================
// VARIANTES DO BOTÃO
// ============================================================================

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-transparent shadow-xs hover:bg-accent dark:bg-transparent dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================================================
// COMPONENTE TOOLTIP INTERNO
// ============================================================================

interface TooltipWrapperProps {
  children: React.ReactNode;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
  tooltipDelay?: number;
  tooltipDisabled?: boolean;
}

function TooltipWrapper({
  children,
  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipDelay = TOOLTIP_DELAY_MS,
  tooltipDisabled = false,
}: TooltipWrapperProps) {
  // Se não há tooltip ou está desabilitado, retorna apenas o children
  if (!tooltip || tooltipDisabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider 
      delayDuration={tooltipDelay} 
      skipDelayDuration={SKIP_DELAY_MS}
    >
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={tooltipSide}
            align={tooltipAlign}
            sideOffset={4}
            className={cn(
              // Estilo base: pequeno e discreto
              "z-50 overflow-hidden rounded-md px-3 py-1.5",
              // Cores discretas
              "bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900",
              // Tipografia pequena
              "text-xs font-medium",
              // Sombra sutil
              "shadow-md",
              // Largura máxima
              "max-w-xs",
              // Animações suaves
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              // Animações direcionais
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            {tooltip}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// ============================================================================
// COMPONENTE BUTTON PRINCIPAL
// ============================================================================

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Se true, renderiza como Slot para composição */
  asChild?: boolean;
  /** Texto do tooltip (se fornecido, ativa o tooltip com delay de 2s) */
  tooltip?: string;
  /** Posição do tooltip */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Alinhamento do tooltip */
  tooltipAlign?: "start" | "center" | "end";
  /** Delay customizado em ms (padrão: 2000ms) */
  tooltipDelay?: number;
  /** Desabilita o tooltip mantendo o botão funcional */
  tooltipDisabled?: boolean;
}

/**
 * Componente Button com suporte a tooltip integrado
 * 
 * @example
 * // Botão simples (sem tooltip)
 * <Button>Clique aqui</Button>
 * 
 * @example
 * // Botão com tooltip (aparece após 2 segundos)
 * <Button tooltip="Salvar documento">
 *   <SaveIcon />
 * </Button>
 * 
 * @example
 * // Botão com tooltip posicionado
 * <Button tooltip="Excluir item" tooltipSide="right" variant="destructive">
 *   <TrashIcon />
 * </Button>
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  tooltip,
  tooltipSide,
  tooltipAlign,
  tooltipDelay,
  tooltipDisabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const button = (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );

  // Se há tooltip, envolve o botão com o wrapper
  if (tooltip) {
    return (
      <TooltipWrapper
        tooltip={tooltip}
        tooltipSide={tooltipSide}
        tooltipAlign={tooltipAlign}
        tooltipDelay={tooltipDelay}
        tooltipDisabled={tooltipDisabled}
      >
        {button}
      </TooltipWrapper>
    );
  }

  return button;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Button, buttonVariants, TOOLTIP_DELAY_MS };
