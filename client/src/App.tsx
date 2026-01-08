import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import Atendimentos from "./pages/Atendimentos";
import NovoAtendimento from "./pages/NovoAtendimento";
import Prontuario from "./pages/Prontuario";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
