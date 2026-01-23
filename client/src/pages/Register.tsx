import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ChevronRight, UserPlus } from "lucide-react";
import { PasswordStrengthIndicator, PasswordConfirmIndicator } from "@/components/PasswordStrengthIndicator";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Conta criada com sucesso!");
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
    if (!formData.name.trim()) return "Nome é obrigatório";
    if (formData.name.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
    if (!formData.username.trim()) return "Nome de usuário é obrigatório";
    if (formData.username.length < 3) return "Nome de usuário deve ter pelo menos 3 caracteres";
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) return "Nome de usuário inválido";
    if (!formData.email.trim()) return "E-mail é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "E-mail inválido";
    if (!formData.password) return "Senha é obrigatória";
    if (formData.password.length < 8) return "Senha deve ter pelo menos 8 caracteres";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) return "Senha fraca";
    if (formData.password !== formData.confirmPassword) return "As senhas não coincidem";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    registerMutation.mutate({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  const isLoading = registerMutation.isPending;

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
              <h2 className="text-2xl font-bold text-[#0A1628] mb-2">Conta Criada!</h2>
              <p className="text-gray-500 mb-8">Agora você pode fazer login.</p>
              <Button className="w-full h-12 bg-[#0056A4] hover:bg-[#004080]" onClick={() => setLocation("/login")}>
                Ir para Login
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Conta Criada!</h1>
          <p className="text-white/50 text-sm mb-8">Agora você pode fazer login.</p>
          <Button className="w-full max-w-xs h-12 bg-[#0056A4] hover:bg-[#004080] rounded-xl" onClick={() => setLocation("/login")}>
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  // Formulário de registro
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
        <div className="w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC] overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[#0A1628]">Criar Conta</h2>
                <p className="text-gray-500 mt-2">Preencha os dados</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">Nome Completo</label>
                  <Input name="name" placeholder="Dr. João Silva" value={formData.name} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">Usuário</label>
                  <Input name="username" placeholder="joao.silva" value={formData.username} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">E-mail</label>
                  <Input name="email" type="email" placeholder="joao@exemplo.com" value={formData.email} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">Senha</label>
                  <div className="relative">
                    <Input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className="h-11 pr-12" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0A1628]">Confirmar Senha</label>
                  <div className="relative">
                    <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="h-11 pr-12" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <PasswordConfirmIndicator password={formData.password} confirmPassword={formData.confirmPassword} />
                </div>
                <Button type="submit" className="w-full h-12 bg-[#0056A4] hover:bg-[#004080]" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" />Criar Conta</>}
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Já tem conta? <button type="button" className="text-[#0056A4] hover:underline font-medium" onClick={() => setLocation("/login")}>Entrar</button>
                </p>
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

        <div className="flex-1 flex flex-col px-6 pt-4 pb-6 overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#0056A4] rounded-2xl flex items-center justify-center mb-3">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-xl font-semibold">Criar Conta</h1>
            <p className="text-white/50 text-sm mt-1">Preencha seus dados</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 flex-1">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <label className="text-white/70 text-sm">Nome Completo</label>
              <Input name="name" placeholder="Dr. João Silva" value={formData.name} onChange={handleChange} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] rounded-xl" />
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-sm">Usuário</label>
              <Input name="username" placeholder="joao.silva" value={formData.username} onChange={handleChange} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] rounded-xl" />
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-sm">E-mail</label>
              <Input name="email" type="email" placeholder="joao@exemplo.com" value={formData.email} onChange={handleChange} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] rounded-xl" />
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-sm">Senha</label>
              <div className="relative">
                <Input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] rounded-xl pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="[&_*]:text-white/60 [&_*]:border-white/20">
                <PasswordStrengthIndicator password={formData.password} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-sm">Confirmar Senha</label>
              <div className="relative">
                <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#0056A4] rounded-xl pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="[&_*]:text-white/60">
                <PasswordConfirmIndicator password={formData.password} confirmPassword={formData.confirmPassword} />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-[#0056A4] hover:bg-[#004080] rounded-xl mt-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-auto pt-4">
            <button type="button" onClick={() => setLocation("/login")} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl text-white hover:bg-white/10">
              <span className="text-sm">Já tem conta? Entrar</span>
              <ChevronRight className="h-4 w-4 text-white/50" />
            </button>
            <p className="text-center text-white/30 text-xs mt-4">Protegido por criptografia AES-256</p>
          </div>
        </div>
      </div>
    </div>
  );
}
