import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Shield, Lock } from "lucide-react";
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
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#002B49]/50 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
        </div>

        {/* Painel direito - Formulário 2FA */}
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
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#0056A4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-[#0056A4]" />
                </div>
                <h2 className="text-2xl font-bold text-[#002B49]">Verificação em Duas Etapas</h2>
                <p className="text-gray-500 mt-2">
                  Digite o código de 6 dígitos do seu aplicativo autenticador
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="token2fa" className="text-[#002B49]">Código de Verificação</Label>
                  <Input
                    id="token2fa"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={token2FA}
                    onChange={(e) => setToken2FA(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest h-14 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4]"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                  disabled={isLoading || token2FA.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-[#0056A4]"
                  onClick={() => {
                    setRequires2FA(false);
                    setUserId2FA(null);
                    setToken2FA("");
                    setPassword("");
                  }}
                >
                  Voltar ao login
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de login principal
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
        {/* Decorative elements */}
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
                <Label htmlFor="username" className="text-[#002B49] font-medium">Nome de Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4]"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#002B49] font-medium">Senha</Label>
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
                    id="password"
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
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400">
                    ou continue com
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 font-medium"
                onClick={handleOAuthLogin}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Entrar com Google
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Não tem uma conta?{" "}
              <Button
                type="button"
                variant="link"
                className="px-0 font-semibold text-[#0056A4] hover:text-[#004080]"
                onClick={() => setLocation("/register")}
              >
                Criar conta
              </Button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 GORGEN. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
