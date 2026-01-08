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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/pacientes/novo" component={NovoPaciente} />
      <Route path="/atendimentos" component={Atendimentos} />
      <Route path="/atendimentos/novo" component={NovoAtendimento} />
      <Route path="/prontuario/:id" component={Prontuario} />
      <Route path="/agenda" component={Agenda} />
      <Route path="/configuracoes" component={Configuracoes} />
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
