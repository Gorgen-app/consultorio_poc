import * as React from "react";
import { cn } from "@/lib/utils";
import { parseNumber, formatCurrency } from "@/lib/formatters";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string | null;
  onChange?: (value: number | null) => void;
  allowNegative?: boolean;
}

/**
 * Input de moeda brasileira (R$ xxx.xxx,xx)
 * - Prefixo R$ automático
 * - Vírgula como separador decimal
 * - Ponto como separador de milhar
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, allowNegative = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Atualiza o valor exibido quando o valor externo muda
    React.useEffect(() => {
      if (!isFocused) {
        if (value === null || value === undefined || value === '') {
          setDisplayValue('');
        } else {
          const num = typeof value === 'string' ? parseNumber(value) : value;
          if (num !== null) {
            setDisplayValue(formatCurrency(num));
          }
        }
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Remove formatação ao focar para facilitar edição
      if (value !== null && value !== undefined && value !== '') {
        const num = typeof value === 'string' ? parseNumber(value) : value;
        if (num !== null) {
          // Mostra apenas o número com vírgula decimal
          setDisplayValue(num.toFixed(2).replace('.', ','));
        }
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Aplica formatação completa ao sair
      const parsed = parseNumber(displayValue);
      if (parsed !== null) {
        setDisplayValue(formatCurrency(parsed));
        onChange?.(parsed);
      } else if (displayValue === '') {
        onChange?.(null);
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove R$ e espaços
      inputValue = inputValue.replace(/R\$\s*/g, '');
      
      // Permite apenas números, vírgula e opcionalmente sinal negativo
      const allowedChars = allowNegative ? /[^\d,\-]/g : /[^\d,]/g;
      inputValue = inputValue.replace(allowedChars, '');
      
      // Garante apenas uma vírgula
      const parts = inputValue.split(',');
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limita a 2 casas decimais
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + ',' + parts[1].substring(0, 2);
      }
      
      setDisplayValue(inputValue);
      
      // Notifica mudança em tempo real
      const parsed = parseNumber(inputValue);
      if (parsed !== null || inputValue === '') {
        onChange?.(parsed);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={displayValue.replace(/R\$\s*/g, '')}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
