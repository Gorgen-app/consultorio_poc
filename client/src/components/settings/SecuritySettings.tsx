import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
  RefreshCw,
  LogOut,
  Monitor,
  Clock,
} from "lucide-react";

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <ChangePasswordSection />
      <Separator />
      <TwoFactorAuthSection />
      <Separator />
      <ActiveSessionsSection />
    </div>
  );
}

// ==================== SEÇÃO DE TROCA DE SENHA ====================
function ChangePasswordSection() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const { data: hasCredentials } = trpc.auth.hasLocalCredentials.useQuery();

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setError("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.currentPassword) {
      setError("Senha atual é obrigatória");
      return;
    }
    if (!formData.newPassword) {
      setError("Nova senha é obrigatória");
      return;
    }
    if (formData.newPassword.length < 8) {
      setError("Nova senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError("Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    changePasswordMutation.mutate(formData);
  };

  if (!hasCredentials?.hasCredentials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Você está usando login social. Crie uma senha para ter acesso alternativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLocalCredentialsForm />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Atualize sua senha regularmente para manter sua conta segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, com maiúscula, minúscula e número
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Alterando...
              </>
            ) : (
              "Alterar Senha"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== CRIAR CREDENCIAIS LOCAIS ====================
function CreateLocalCredentialsForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const createCredentialsMutation = trpc.auth.createLocalCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais criadas com sucesso!");
      utils.auth.hasLocalCredentials.invalidate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError("Nome de usuário é obrigatório");
      return;
    }
    if (formData.username.length < 3) {
      setError("Nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      setError("Nome de usuário pode conter apenas letras, números, pontos, hífens e underscores");
      return;
    }
    if (formData.password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError("Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    createCredentialsMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Nome de Usuário</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="seu.usuario"
          value={formData.username}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">
          Use apenas letras, números, pontos, hífens e underscores
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={createCredentialsMutation.isPending}>
        {createCredentialsMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando...
          </>
        ) : (
          "Criar Credenciais"
        )}
      </Button>
    </form>
  );
}

// ==================== SEÇÃO DE 2FA ====================
function TwoFactorAuthSection() {
  const { data: status, refetch } = trpc.auth.get2FAStatus.useQuery();
  const { data: hasCredentials } = trpc.auth.hasLocalCredentials.useQuery();

  if (!hasCredentials?.hasCredentials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em Duas Etapas (2FA)
          </CardTitle>
          <CardDescription>
            Você precisa criar uma senha antes de ativar o 2FA
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Autenticação em Duas Etapas (2FA)
            </CardTitle>
            <CardDescription>
              Adicione uma camada extra de segurança à sua conta
            </CardDescription>
          </div>
          {status?.isEnabled ? (
            <Badge className="bg-green-500">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Ativado
            </Badge>
          ) : (
            <Badge variant="outline">
              <ShieldOff className="h-3 w-3 mr-1" />
              Desativado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {status?.isEnabled ? (
          <Disable2FADialog onSuccess={refetch} />
        ) : (
          <Setup2FADialog onSuccess={refetch} />
        )}
      </CardContent>
    </Card>
  );
}

// ==================== DIALOG DE CONFIGURAÇÃO DO 2FA ====================
function Setup2FADialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");

  const setup2FAMutation = trpc.auth.setup2FA.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("verify");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verify2FAMutation = trpc.auth.verifyAndEnable2FA.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep("backup");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSetup = () => {
    setError("");
    setup2FAMutation.mutate();
  };

  const handleVerify = () => {
    setError("");
    if (token.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    verify2FAMutation.mutate({ token });
  };

  const handleClose = () => {
    setOpen(false);
    setStep("setup");
    setQrCode("");
    setSecret("");
    setToken("");
    setBackupCodes([]);
    setError("");
    if (step === "backup") {
      onSuccess();
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Código copiado!");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Códigos copiados!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Smartphone className="mr-2 h-4 w-4" />
          Configurar 2FA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "setup" && (
          <>
            <DialogHeader>
              <DialogTitle>Configurar Autenticação em Duas Etapas</DialogTitle>
              <DialogDescription>
                Use um aplicativo autenticador como Google Authenticator, Authy ou 1Password para gerar códigos de verificação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Você precisará de um aplicativo autenticador instalado no seu celular.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button onClick={handleSetup} disabled={setup2FAMutation.isPending}>
                {setup2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Escaneie o QR Code</DialogTitle>
              <DialogDescription>
                Escaneie o código abaixo com seu aplicativo autenticador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="space-y-2">
                <Label>Ou digite o código manualmente:</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Código de Verificação</Label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl tracking-widest"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleVerify}
                disabled={verify2FAMutation.isPending || token.length !== 6}
              >
                {verify2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar e Ativar"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                2FA Ativado com Sucesso!
              </DialogTitle>
              <DialogDescription>
                Guarde estes códigos de backup em um lugar seguro. Você pode usá-los caso perca acesso ao seu autenticador.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cada código só pode ser usado uma vez. Guarde-os em um lugar seguro!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={copyBackupCodes}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Códigos
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Concluir</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== DIALOG DE DESATIVAÇÃO DO 2FA ====================
function Disable2FADialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const disable2FAMutation = trpc.auth.disable2FA.useMutation({
    onSuccess: () => {
      toast.success("2FA desativado com sucesso");
      setOpen(false);
      setPassword("");
      onSuccess();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleDisable = () => {
    setError("");
    if (!password) {
      setError("Digite sua senha para confirmar");
      return;
    }
    disable2FAMutation.mutate({ password });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <ShieldOff className="mr-2 h-4 w-4" />
          Desativar 2FA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar Autenticação em Duas Etapas</DialogTitle>
          <DialogDescription>
            Isso tornará sua conta menos segura. Digite sua senha para confirmar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="disablePassword">Senha</Label>
            <Input
              id="disablePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={disable2FAMutation.isPending}
          >
            {disable2FAMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desativando...
              </>
            ) : (
              "Desativar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SEÇÃO DE SESSÕES ATIVAS ====================
function ActiveSessionsSection() {
  const { data: sessions, refetch } = trpc.auth.getActiveSessions.useQuery();

  const logoutAllMutation = trpc.auth.logoutAllOtherSessions.useMutation({
    onSuccess: () => {
      toast.success("Todas as outras sessões foram encerradas");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Sessões Ativas
            </CardTitle>
            <CardDescription>
              Gerencie os dispositivos conectados à sua conta
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions && sessions.length > 0 ? (
          <>
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {index === 0 ? "Sessão atual" : `Sessão ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ipAddress || "Desconhecido"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última atividade:{" "}
                        {session.lastActivityAt
                          ? new Date(session.lastActivityAt).toLocaleString("pt-BR")
                          : "Desconhecido"}
                      </p>
                    </div>
                  </div>
                  {index === 0 && (
                    <Badge variant="outline" className="text-green-600">
                      Atual
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {sessions.length > 1 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => logoutAllMutation.mutate()}
                disabled={logoutAllMutation.isPending}
              >
                {logoutAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Encerrando...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Encerrar Outras Sessões
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sessão ativa encontrada
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default SecuritySettings;
