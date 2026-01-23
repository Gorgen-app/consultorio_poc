import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, AlertCircle, Loader2, CheckCircle2, ArrowLeft, Shield, Lock } from "lucide-react";

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

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Painel esquerdo - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0056A4] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0056A4] to-[#002B49]" />
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
              <img 
                src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                alt="Gorgen Logo" 
                className="w-36 h-36 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-wide">GORGEN</h1>
            <p className="text-xl text-white/80 text-center max-w-md">
              Gestão em Saúde com Arquitetura de Rede Social
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#002B49]/50 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
        </div>

        {/* Painel direito - Sucesso */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F7FA]">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[#0056A4] rounded-full flex items-center justify-center mb-4">
                <img 
                  src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                  alt="Gorgen Logo" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#002B49]">GORGEN</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#002B49] mb-2">E-mail Enviado!</h2>
              <p className="text-gray-500 mb-4">
                Se o e-mail <strong className="text-[#002B49]">{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.
              </p>
              
              <Alert className="mb-6 text-left">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                  onClick={() => setLocation("/login")}
                >
                  Voltar ao Login
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-[#0056A4]"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                >
                  Tentar outro e-mail
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de recuperação
  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0056A4] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0056A4] to-[#002B49]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen Logo" 
              className="w-36 h-36 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-wide">GORGEN</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Gestão em Saúde com Arquitetura de Rede Social
          </p>
          <p className="text-lg text-white/60 text-center mt-4 max-w-sm">
            Paciente no centro do cuidado
          </p>
          <div className="mt-12 flex items-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>LGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>AES-256</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#002B49]/50 to-transparent" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>

      {/* Painel direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#0056A4] rounded-full flex items-center justify-center mb-4">
              <img 
                src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                alt="Gorgen Logo" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#002B49]">GORGEN</h1>
            <p className="text-gray-500 text-sm">Gestão em Saúde</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0056A4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-[#0056A4]" />
              </div>
              <h2 className="text-2xl font-bold text-[#002B49]">Esqueci Minha Senha</h2>
              <p className="text-gray-500 mt-2">
                Digite seu e-mail para receber instruções de recuperação
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#002B49] font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Instruções
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-500 hover:text-[#0056A4]"
                onClick={() => setLocation("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 GORGEN. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
