/**
 * MaskedInput - Componente de input com máscaras padronizadas
 * 
 * Formatações conforme Glossário Gorgen v3.0:
 * - CPF: xxx.xxx.xxx-xx
 * - Telefone: (xx) xxxxx-xxxx
 * - CEP: xxxxx-xxx
 * - Números: xx.xxx.xxx,xx (separador de milhares: "." | decimal: ",")
 */
import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

type MaskType = "cpf" | "cnpj" | "telefone" | "cep" | "numero";

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: MaskType;
  /** Número de casas decimais (apenas para mask="numero") */
  casasDecimais?: number;
}

const masks = {
  /**
   * CPF: xxx.xxx.xxx-xx
   * Conforme Glossário Gorgen v3.0
   */
  cpf: (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  },
  /**
   * CNPJ: xx.xxx.xxx/xxxx-xx
   */
  cnpj: (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  },
  /**
   * Telefone: (xx) xxxxx-xxxx
   */
  telefone: (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  },
  /**
   * CEP: xxxxx-xxx
   */
  cep: (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  },
  /**
   * Número brasileiro: xx.xxx.xxx,xx
   * Separador de milhares: "." | Separador decimal: ","
   * Conforme Glossário Gorgen v3.0
   */
  numero: (value: string, casasDecimais: number = 2) => {
    // Remove tudo exceto dígitos e vírgula
    let limpo = value.replace(/[^\d,]/g, "");
    
    // Garante apenas uma vírgula
    const partes = limpo.split(",");
    if (partes.length > 2) {
      limpo = partes[0] + "," + partes.slice(1).join("");
    }
    
    // Separa parte inteira e decimal
    const [inteira, decimal] = limpo.split(",");
    
    // Formata parte inteira com pontos de milhar
    const inteiraFormatada = inteira
      ? inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      : "";
    
    // Limita casas decimais
    const decimalLimitado = decimal?.slice(0, casasDecimais) || "";
    
    // Retorna com ou sem decimal
    if (limpo.includes(",")) {
      return `${inteiraFormatada},${decimalLimitado}`;
    }
    return inteiraFormatada;
  },
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, casasDecimais = 2, onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let maskedValue: string;
      if (mask === "numero") {
        maskedValue = masks.numero(e.target.value, casasDecimais);
      } else {
        maskedValue = masks[mask](e.target.value);
      }
      e.target.value = maskedValue;
      onChange?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
