import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Lock, ChevronRight } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId2FA, setUserId2FA] = useState<number | null>(null);
  const [token2FA, setToken2FA] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.requires2FA && data.userId) {
        setRequires2FA(true);
        setUserId2FA(data.userId);
        setError("");
      } else if (data.success) {
        if (data.mustChangePassword) {
          toast.info("Por segurança, você precisa alterar sua senha provisória.");
          setLocation("/change-password");
        } else {
          toast.success("Login realizado com sucesso!");
          setLocation("/dashboard");
        }
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verify2FAMutation = trpc.auth.verify2FALogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Login realizado com sucesso!");
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password) {
      setError("Preencha todos os campos");
      return;
    }

    loginMutation.mutate({ username: username.trim(), password });
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token2FA || token2FA.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }

    if (userId2FA) {
      verify2FAMutation.mutate({ userId: userId2FA, token: token2FA });
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  const isLoading = loginMutation.isPending || verify2FAMutation.isPending;

  // Tela de verificação 2FA
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 -ml-2"
            onClick={() => {
              setRequires2FA(false);
              setUserId2FA(null);
              setToken2FA("");
              setPassword("");
            }}
          >
            ← Voltar
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <div className="w-16 h-16 bg-[#0056A4] rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2">Verificação 2FA</h1>
          <p className="text-white/50 text-sm text-center mb-8">
            Digite o código do autenticador
          </p>

          <form onSubmit={handleVerify2FA} className="w-full max-w-xs space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={token2FA}
              onChange={(e) => setToken2FA(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-center text-2xl tracking-[0.4em] font-mono bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#0056A4] focus:ring-[#0056A4]/30 rounded-xl"
              autoFocus
            />

            <Button
              type="submit"
              className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium rounded-xl"
              disabled={isLoading || token2FA.length !== 6}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Layout principal
  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* Desktop: Layout split-screen */}
      <div className="hidden lg:flex min-h-screen">
        {/* Painel esquerdo - Branding */}
        <div className="w-1/2 bg-gradient-to-br from-[#0056A4] to-[#0A1628] relative overflow-hidden flex items-center justify-center">
          <div className="relative z-10 flex flex-col items-center p-12">
            <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mb-8">
              <img 
                src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                alt="Gorgen Logo" 
                className="w-28 h-28 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-wide">GORGEN</h1>
            <p className="text-lg text-white/70 text-center max-w-sm">
              Gestão em Saúde com Arquitetura de Rede Social
            </p>
            <p className="text-white/50 text-center mt-3">
              Paciente no centro do cuidado
            </p>
          </div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
        </div>

        {/* Painel direito - Formulário Desktop */}
        <div className="w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#0A1628]">Bem-vindo</h2>
                <p className="text-gray-500 mt-2">Entre na sua conta</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">Usuário</label>
                  <Input
                    type="text"
                    placeholder="seu.usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4]"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#0A1628]">Senha</label>
                    <button
                      type="button"
                      className="text-sm text-[#0056A4] hover:underline"
                      onClick={() => setLocation("/forgot-password")}
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4] pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="text-[#0056A4] hover:underline font-medium"
                    onClick={() => setLocation("/register")}
                  >
                    Criar conta
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Design limpo e funcional */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header compacto */}
        <header className="p-4 flex items-center justify-between">
          <button 
            onClick={() => setLocation("/")}
            className="text-white/60 text-sm hover:text-white"
          >
            ← Início
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen" 
              className="w-6 h-6 object-contain"
            />
            <span className="text-white font-semibold text-sm">GORGEN</span>
          </div>
          <div className="w-12" />
        </header>

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col px-6 pt-8 pb-6">
          {/* Logo e título */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#0056A4] rounded-2xl flex items-center justify-center mb-4">
              <img 
                src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                alt="Gorgen" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <h1 className="text-white text-xl font-semibold">Entrar</h1>
            <p className="text-white/50 text-sm mt-1">Acesse sua conta</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4 flex-1">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label className="text-white/70 text-sm">Usuário</label>
              <Input
                type="text"
                placeholder="seu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] focus:ring-[#0056A4]/30 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/70 text-sm">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] focus:ring-[#0056A4]/30 rounded-xl pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </Button>

            <button
              type="button"
              className="w-full text-center text-white/50 text-sm hover:text-white/70 py-2"
              onClick={() => setLocation("/forgot-password")}
            >
              Esqueci minha senha
            </button>
          </form>

          {/* Links inferiores */}
          <div className="mt-auto pt-6 space-y-3">
            <button
              type="button"
              onClick={() => setLocation("/register")}
              className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm">Criar nova conta</span>
              <ChevronRight className="h-4 w-4 text-white/50" />
            </button>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-white/30 text-xs">
                Protegido por criptografia AES-256
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
