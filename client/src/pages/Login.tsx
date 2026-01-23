import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Lock, HelpCircle, User } from "lucide-react";
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

  // Tela de verificação 2FA - Estilo Itaú Mobile
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] to-[#002B49] flex flex-col">
        {/* Header Mobile */}
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => {
              setRequires2FA(false);
              setUserId2FA(null);
              setToken2FA("");
              setPassword("");
            }}
          >
            ← Voltar
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-semibold">GORGEN</span>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Verificação em Duas Etapas</h1>
          <p className="text-white/60 text-center mb-8 max-w-xs">
            Digite o código do seu aplicativo autenticador
          </p>

          <form onSubmit={handleVerify2FA} className="w-full max-w-sm space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
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
              className="h-16 text-center text-3xl tracking-[0.5em] font-mono bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/30"
              autoFocus
            />

            <Button
              type="submit"
              className="w-full h-14 bg-white text-[#002B49] hover:bg-white/90 font-semibold text-lg rounded-xl"
              disabled={isLoading || token2FA.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Verificar"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Tela de login principal - Estilo Itaú Mobile
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] to-[#002B49] flex flex-col">
      {/* Desktop: Layout split-screen */}
      <div className="hidden lg:flex min-h-screen">
        {/* Painel esquerdo - Branding */}
        <div className="w-1/2 bg-gradient-to-br from-[#0056A4] to-[#002B49] relative overflow-hidden flex items-center justify-center">
          <div className="relative z-10 flex flex-col items-center p-12">
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
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#002B49]/50 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
        </div>

        {/* Painel direito - Formulário Desktop */}
        <div className="w-1/2 flex items-center justify-center p-8 bg-[#F5F7FA]">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#002B49]">Bem-vindo de volta</h2>
                <p className="text-gray-500 mt-2">Entre na sua conta para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username-desktop" className="text-[#002B49] font-medium">Nome de Usuário</Label>
                  <Input
                    id="username-desktop"
                    type="text"
                    placeholder="seu.usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4]"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-desktop" className="text-[#002B49] font-medium">Senha</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 font-normal text-sm text-[#0056A4] hover:text-[#004080]"
                      onClick={() => setLocation("/forgot-password")}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password-desktop"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4] pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
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

                <div className="text-center pt-4">
                  <span className="text-gray-500 text-sm">Não tem uma conta? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="px-1 text-sm text-[#0056A4] hover:text-[#004080]"
                    onClick={() => setLocation("/register")}
                  >
                    Criar conta
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Estilo Itaú */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header Mobile */}
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setLocation("/")}
          >
            ← Início
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-semibold">GORGEN</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setLocation("/forgot-password")}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </header>

        {/* User Greeting (se tiver username salvo) */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-white/60 text-sm">Olá,</p>
          <p className="text-white text-xl font-semibold">Bem-vindo ao Gorgen</p>
        </div>

        {/* Cards Grid - Estilo Itaú */}
        <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
          {/* Card Principal - Acessar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 text-lg">Acessar</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username-mobile" className="text-white/80 text-sm">Usuário</Label>
                <Input
                  id="username-mobile"
                  type="text"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/30 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-mobile" className="text-white/80 text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="password-mobile"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/30 rounded-xl pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white/60" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/60" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-white text-[#002B49] hover:bg-white/90 font-semibold text-lg rounded-xl mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          {/* Cards Secundários - Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setLocation("/register")}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-left hover:bg-white/15 transition-colors"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-medium">Criar Conta</span>
            </button>

            <button 
              onClick={() => setLocation("/forgot-password")}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-left hover:bg-white/15 transition-colors"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-medium">Esqueci Senha</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="pt-4 text-center">
            <p className="text-white/40 text-xs">
              Protegido por criptografia AES-256
            </p>
            <p className="text-white/30 text-xs mt-1">
              LGPD Compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
