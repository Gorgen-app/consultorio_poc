import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const requirements: Requirement[] = useMemo(() => [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Letra maiúscula (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Letra minúscula (a-z)", met: /[a-z]/.test(password) },
    { label: "Número (0-9)", met: /\d/.test(password) },
    { label: "Caractere especial (!@#$%)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength: PasswordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, label: "", color: "bg-gray-200", bgColor: "bg-gray-100" };
    }

    const metCount = requirements.filter(r => r.met).length;

    if (metCount <= 1) {
      return { score: 1, label: "Muito fraca", color: "bg-red-500", bgColor: "bg-red-50" };
    }
    if (metCount === 2) {
      return { score: 2, label: "Fraca", color: "bg-orange-500", bgColor: "bg-orange-50" };
    }
    if (metCount === 3) {
      return { score: 3, label: "Média", color: "bg-yellow-500", bgColor: "bg-yellow-50" };
    }
    if (metCount === 4) {
      return { score: 4, label: "Forte", color: "bg-green-500", bgColor: "bg-green-50" };
    }
    return { score: 5, label: "Muito forte", color: "bg-emerald-500", bgColor: "bg-emerald-50" };
  }, [password, requirements]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                level <= strength.score ? strength.color : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        {strength.label && (
          <p className={`text-xs font-medium ${
            strength.score <= 2 ? "text-red-600" :
            strength.score === 3 ? "text-yellow-600" :
            "text-green-600"
          }`}>
            Força: {strength.label}
          </p>
        )}
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <div className={`p-3 rounded-lg ${strength.bgColor} transition-colors duration-300`}>
          <p className="text-xs font-medium text-gray-600 mb-2">Requisitos da senha:</p>
          <ul className="space-y-1">
            {requirements.map((req, index) => (
              <li 
                key={index} 
                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                  req.met ? "text-green-600" : "text-gray-500"
                }`}
              >
                {req.met ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-gray-400" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Versão compacta apenas com a barra
export function PasswordStrengthBar({ password }: { password: string }) {
  return <PasswordStrengthIndicator password={password} showRequirements={false} />;
}

// Componente de confirmação de senha
interface PasswordConfirmIndicatorProps {
  password: string;
  confirmPassword: string;
}

export function PasswordConfirmIndicator({ password, confirmPassword }: PasswordConfirmIndicatorProps) {
  if (!confirmPassword) return null;

  const matches = password === confirmPassword;

  return (
    <div className={`flex items-center gap-2 mt-2 text-xs font-medium transition-colors duration-200 ${
      matches ? "text-green-600" : "text-red-600"
    }`}>
      {matches ? (
        <>
          <Check className="h-4 w-4" />
          <span>Senhas coincidem</span>
        </>
      ) : (
        <>
          <X className="h-4 w-4" />
          <span>Senhas não coincidem</span>
        </>
      )}
    </div>
  );
}
