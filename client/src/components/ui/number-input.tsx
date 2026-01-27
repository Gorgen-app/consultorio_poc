import * as React from "react";
import { cn } from "@/lib/utils";
import { parseNumber, formatNumber } from "@/lib/formatters";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string | null;
  onChange?: (value: number | null) => void;
  decimals?: number;
  allowNegative?: boolean;
  suffix?: string;
}

/**
 * Input numérico com máscara brasileira (xxx.xxx,xx)
 * - Vírgula como separador decimal
 * - Ponto como separador de milhar
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, decimals = 2, allowNegative = false, suffix, ...props }, ref) => {
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
            setDisplayValue(formatNumber(num, decimals));
          }
        }
      }
    }, [value, decimals, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Remove formatação ao focar para facilitar edição
      if (value !== null && value !== undefined && value !== '') {
        const num = typeof value === 'string' ? parseNumber(value) : value;
        if (num !== null) {
          // Mostra apenas o número com vírgula decimal, sem separador de milhar
          setDisplayValue(num.toFixed(decimals).replace('.', ','));
        }
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Aplica formatação completa ao sair
      const parsed = parseNumber(displayValue);
      if (parsed !== null) {
        setDisplayValue(formatNumber(parsed, decimals));
        onChange?.(parsed);
      } else if (displayValue === '') {
        onChange?.(null);
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Permite apenas números, vírgula e opcionalmente sinal negativo
      const allowedChars = allowNegative ? /[^\d,\-]/g : /[^\d,]/g;
      inputValue = inputValue.replace(allowedChars, '');
      
      // Garante apenas uma vírgula
      const parts = inputValue.split(',');
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limita casas decimais
      if (parts.length === 2 && parts[1].length > decimals) {
        inputValue = parts[0] + ',' + parts[1].substring(0, decimals);
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
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            suffix && "pr-12",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
