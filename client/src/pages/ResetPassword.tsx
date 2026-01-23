import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, AlertCircle, Loader2, CheckCircle2, Shield, Lock } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = (): string | null => {
    if (!formData.newPassword) {
      return "Nova senha é obrigatória";
    }
    if (formData.newPassword.length < 8) {
      return "Senha deve ter pelo menos 8 caracteres";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      return "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return "As senhas não coincidem";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperação inválido");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });
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
              <h2 className="text-2xl font-bold text-[#002B49] mb-2">Senha Redefinida!</h2>
              <p className="text-gray-500 mb-8">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
              </p>
              <Button
                className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                onClick={() => setLocation("/login")}
              >
                Ir para Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se tem token - Tela de erro
  if (!token) {
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

        {/* Painel direito - Erro */}
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
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#002B49] mb-2">Link Inválido</h2>
              <p className="text-gray-500 mb-8">
                O link de recuperação de senha é inválido ou expirou.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium"
                  onClick={() => setLocation("/forgot-password")}
                >
                  Solicitar Novo Link
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-[#0056A4]"
                  onClick={() => setLocation("/login")}
                >
                  Voltar ao Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de redefinição
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
                <KeyRound className="h-8 w-8 text-[#0056A4]" />
              </div>
              <h2 className="text-2xl font-bold text-[#002B49]">Redefinir Senha</h2>
              <p className="text-gray-500 mt-2">Digite sua nova senha abaixo</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#002B49] font-medium">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    autoFocus
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
                <p className="text-xs text-gray-400">
                  Mínimo 8 caracteres, com maiúscula, minúscula e número
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#002B49] font-medium">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-12 border-gray-200 focus:border-[#0056A4] focus:ring-[#0056A4] pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] text-white font-medium mt-6"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Redefinir Senha
                  </>
                )}
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
