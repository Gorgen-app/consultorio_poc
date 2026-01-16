import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
// Dashboard antiga removida - usando DashboardCustom como principal
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import Atendimentos from "./pages/Atendimentos";
import NovoAtendimento from "./pages/NovoAtendimento";
import Prontuario from "./pages/Prontuario";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import ExamesFavoritos from "./pages/ExamesFavoritos";
import AdminTenants from "./pages/AdminTenants";
import CrossTenantAutorizacoes from "./pages/CrossTenantAutorizacoes";
import RelatorioPacientes from "./pages/RelatorioPacientes";
import RelatorioDuplicados from "./pages/RelatorioDuplicados";
import Relatorios from "./pages/Relatorios";
import Performance from "./pages/Performance";
import BackupSettings from "./pages/BackupSettings";
import Dashboard from "./pages/DashboardCustom";
import { ProtectedRoute } from "./components/ProtectedRoute";
// Páginas de autenticação
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Rotas de autenticação (públicas, sem DashboardLayout)
function AuthRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
    </Switch>
  );
}

// Rotas protegidas (com DashboardLayout)
function ProtectedRouter() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute funcionalidade="dashboard">
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute funcionalidade="dashboard">
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/pacientes">
        <ProtectedRoute funcionalidade="pacientes">
          <Pacientes />
        </ProtectedRoute>
      </Route>
      <Route path="/pacientes/novo">
        <ProtectedRoute funcionalidade="pacientes.criar">
          <NovoPaciente />
        </ProtectedRoute>
      </Route>
      <Route path="/pacientes/relatorio">
        <ProtectedRoute funcionalidade="pacientes">
          <RelatorioPacientes />
        </ProtectedRoute>
      </Route>
      <Route path="/pacientes/duplicados">
        <ProtectedRoute funcionalidade="pacientes">
          <RelatorioDuplicados />
        </ProtectedRoute>
      </Route>
      <Route path="/atendimentos">
        <ProtectedRoute funcionalidade="atendimentos">
          <Atendimentos />
        </ProtectedRoute>
      </Route>
      <Route path="/atendimentos/novo">
        <ProtectedRoute funcionalidade="atendimentos.criar">
          <NovoAtendimento />
        </ProtectedRoute>
      </Route>
      <Route path="/atendimentos/relatorios">
        <ProtectedRoute funcionalidade="atendimentos">
          <Relatorios />
        </ProtectedRoute>
      </Route>
      <Route path="/prontuario/:id">
        <ProtectedRoute funcionalidade="prontuario">
          <Prontuario />
        </ProtectedRoute>
      </Route>
      <Route path="/agenda">
        <ProtectedRoute funcionalidade="agenda">
          <Agenda />
        </ProtectedRoute>
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute funcionalidade="configuracoes">
          <Configuracoes />
        </ProtectedRoute>
      </Route>
      <Route path="/configuracoes/exames-favoritos">
        <ProtectedRoute funcionalidade="configuracoes">
          <ExamesFavoritos />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/tenants">
        <ProtectedRoute funcionalidade="admin_tenants">
          <AdminTenants />
        </ProtectedRoute>
      </Route>
      <Route path="/compartilhamento">
        <ProtectedRoute funcionalidade="compartilhamento">
          <CrossTenantAutorizacoes />
        </ProtectedRoute>
      </Route>
      <Route path="/performance">
        <ProtectedRoute funcionalidade="admin_tenants">
          <Performance />
        </ProtectedRoute>
      </Route>
      <Route path="/configuracoes/backup">
        <ProtectedRoute funcionalidade="configuracoes.backup">
          <BackupSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/config-simples">
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Rotas públicas de autenticação (sem sidebar)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some(route => path.startsWith(route));
}

function AppContent() {
  const [location] = useLocation();
  
  // Se for rota de autenticação, renderiza sem DashboardLayout
  if (isAuthRoute(location)) {
    return <AuthRouter />;
  }
  
  // Rotas protegidas com DashboardLayout
  return (
    <DashboardLayout>
      <ProtectedRouter />
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
