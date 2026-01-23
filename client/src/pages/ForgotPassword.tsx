import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, AlertCircle, Loader2, CheckCircle2, ChevronRight } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Instruções enviadas para seu e-mail!");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("E-mail é obrigatório");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("E-mail inválido");
      return;
    }
    requestResetMutation.mutate({ email: email.trim().toLowerCase() });
  };

  const isLoading = requestResetMutation.isPending;

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex flex-col">
        {/* Desktop */}
        <div className="hidden lg:flex min-h-screen">
          <div className="w-1/2 bg-gradient-to-br from-[#0056A4] to-[#0A1628] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mb-8">
                <img src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" alt="Gorgen" className="w-28 h-28 object-contain" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">GORGEN</h1>
              <p className="text-white/70 text-center">Gestão em Saúde</p>
            </div>
          </div>
          <div className="w-1/2 flex items-center justify-center bg-[#F8FAFC]">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A1628] mb-2">E-mail Enviado!</h2>
              <p className="text-gray-500 mb-4">
                Se <strong>{email}</strong> estiver cadastrado, você receberá instruções.
              </p>
              <p className="text-sm text-gray-400 mb-6">Verifique sua caixa de entrada e spam. O link expira em 1 hora.</p>
              <Button className="w-full h-12 bg-[#0056A4] hover:bg-[#004080]" onClick={() => setLocation("/login")}>
                Voltar ao Login
              </Button>
              <button className="w-full text-gray-500 hover:text-[#0056A4] text-sm mt-4" onClick={() => { setSuccess(false); setEmail(""); }}>
                Tentar outro e-mail
              </button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">E-mail Enviado!</h1>
          <p className="text-white/50 text-sm text-center mb-2">
            Verifique <span className="text-white/70">{email}</span>
          </p>
          <p className="text-white/40 text-xs text-center mb-8">O link expira em 1 hora</p>
          <Button className="w-full max-w-xs h-12 bg-[#0056A4] hover:bg-[#004080] rounded-xl" onClick={() => setLocation("/login")}>
            Voltar ao Login
          </Button>
          <button className="text-white/50 text-sm mt-4 hover:text-white/70" onClick={() => { setSuccess(false); setEmail(""); }}>
            Tentar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  // Formulário de recuperação
  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* Desktop */}
      <div className="hidden lg:flex min-h-screen">
        <div className="w-1/2 bg-gradient-to-br from-[#0056A4] to-[#0A1628] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mb-8">
              <img src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" alt="Gorgen" className="w-28 h-28 object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">GORGEN</h1>
            <p className="text-white/70 text-center">Gestão em Saúde</p>
            <p className="text-white/50 text-sm mt-2">Paciente no centro do cuidado</p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#0056A4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-[#0056A4]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0A1628]">Esqueci Minha Senha</h2>
                <p className="text-gray-500 mt-2">Digite seu e-mail para recuperar</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" autoFocus />
                </div>
                <Button type="submit" className="w-full h-12 bg-[#0056A4] hover:bg-[#004080]" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="mr-2 h-4 w-4" />Enviar Instruções</>}
                </Button>
                <button type="button" className="w-full text-gray-500 hover:text-[#0056A4] text-sm" onClick={() => setLocation("/login")}>
                  ← Voltar ao Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Design minimalista */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <header className="p-4 flex items-center justify-between">
          <button onClick={() => setLocation("/login")} className="text-white/60 text-sm hover:text-white">← Voltar</button>
          <div className="flex items-center gap-2">
            <img src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" alt="Gorgen" className="w-6 h-6 object-contain" />
            <span className="text-white font-semibold text-sm">GORGEN</span>
          </div>
          <div className="w-12" />
        </header>

        <div className="flex-1 flex flex-col px-6 pt-8 pb-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#0056A4] rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-xl font-semibold">Recuperar Senha</h1>
            <p className="text-white/50 text-sm mt-1">Digite seu e-mail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label className="text-white/70 text-sm">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] focus:ring-[#0056A4]/30 rounded-xl"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] rounded-xl" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Instruções"}
            </Button>
          </form>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl text-white hover:bg-white/10"
            >
              <span className="text-sm">Voltar ao Login</span>
              <ChevronRight className="h-4 w-4 text-white/50" />
            </button>
            <p className="text-center text-white/30 text-xs mt-4">Protegido por criptografia AES-256</p>
          </div>
        </div>
      </div>
    </div>
  );
}
