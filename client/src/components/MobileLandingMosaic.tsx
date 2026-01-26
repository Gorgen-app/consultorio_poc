import { useLocation } from "wouter";
import { 
  Lock, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  MessageSquare, 
  HelpCircle, 
  Settings,
  Shield,
  CheckCircle
} from "lucide-react";

interface MosaicCardProps {
  icon: React.ReactNode;
  label: string;
  size: "large" | "medium" | "small";
  variant?: "default" | "accent" | "purple" | "gold" | "cyan";
  onClick?: () => void;
}

function MosaicCard({ icon, label, size, variant = "default", onClick }: MosaicCardProps) {
  const sizeClasses = {
    large: "col-span-6 min-h-[120px]",
    medium: "col-span-3 min-h-[140px]",
    small: "col-span-2 min-h-[100px] p-4"
  };

  const variantClasses = {
    default: "bg-white/[0.08]",
    accent: "bg-gradient-to-br from-[#BE6B7D] to-[#9A4D5D]",
    purple: "bg-gradient-to-br from-[#8E7DBE] to-[#6B5A9E]",
    gold: "bg-gradient-to-br from-[#BEA06B] to-[#9E8050]",
    cyan: "bg-gradient-to-br from-[#6BB0BE] to-[#4A8E9E]"
  };

  const iconSizes = {
    large: "w-10 h-10",
    medium: "w-8 h-8",
    small: "w-6 h-6"
  };

  const labelSizes = {
    large: "text-lg",
    medium: "text-sm",
    small: "text-xs"
  };

  const isLarge = size === "large";

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${isLarge ? "bg-gradient-to-br from-[#4A6A9A] to-[#2E4366]" : variantClasses[variant]}
        rounded-2xl p-5 flex flex-col justify-between
        border border-white/5
        transition-all duration-200
        hover:bg-white/[0.12] hover:-translate-y-0.5
        active:scale-[0.98]
        text-left
      `}
    >
      <div className={`${iconSizes[size]} text-white`}>
        {icon}
      </div>
      <span className={`${labelSizes[size]} font-medium text-white mt-4`}>
        {label}
      </span>
    </button>
  );
}

export default function MobileLandingMosaic() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#6B8CBE] rounded-full flex items-center justify-center text-white font-semibold">
            G
          </div>
          <div>
            <h2 className="text-white font-semibold">Olá, Visitante</h2>
            <p className="text-white/50 text-xs">Bem-vindo ao Gorgen</p>
          </div>
        </div>
        <button 
          onClick={() => setLocation("/login")}
          className="px-4 py-2 border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Entrar
        </button>
      </header>

      {/* Mosaico Grid */}
      <div className="flex-1 px-4 pb-6">
        <div className="grid grid-cols-6 gap-3">
          {/* Card Grande - Acessar */}
          <MosaicCard
            icon={<Lock className="w-full h-full" />}
            label="Acessar"
            size="large"
            onClick={() => setLocation("/login")}
          />

          {/* Cards Médios - Linha 1 */}
          <MosaicCard
            icon={<Users className="w-full h-full" />}
            label="Meus Médicos"
            size="medium"
            onClick={() => setLocation("/login")}
          />
          <MosaicCard
            icon={<Calendar className="w-full h-full" />}
            label="Agendamentos"
            size="medium"
            variant="accent"
            onClick={() => setLocation("/login")}
          />

          {/* Cards Médios - Linha 2 */}
          <MosaicCard
            icon={<FileText className="w-full h-full" />}
            label="Meu Prontuário"
            size="medium"
            variant="cyan"
            onClick={() => setLocation("/login")}
          />
          <MosaicCard
            icon={<Activity className="w-full h-full" />}
            label="Exames"
            size="medium"
            variant="purple"
            onClick={() => setLocation("/login")}
          />

          {/* Cards Pequenos */}
          <MosaicCard
            icon={<MessageSquare className="w-full h-full" />}
            label="Mensagens"
            size="small"
            onClick={() => setLocation("/login")}
          />
          <MosaicCard
            icon={<HelpCircle className="w-full h-full" />}
            label="Ajuda"
            size="small"
            variant="gold"
            onClick={() => setLocation("/login")}
          />
          <MosaicCard
            icon={<Settings className="w-full h-full" />}
            label="Config"
            size="small"
            onClick={() => setLocation("/login")}
          />
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-6 py-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
          <Shield className="w-3 h-3" />
          <span>LGPD</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
          <Lock className="w-3 h-3" />
          <span>AES-256</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
          <CheckCircle className="w-3 h-3" />
          <span>99.9% Uptime</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <span className="text-white/60 text-xs font-semibold tracking-wider">GORGEN</span>
      </footer>
    </div>
  );
}
