import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  Share2,
  Users,
  Stethoscope,
  Receipt,
  Megaphone,
  UserCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Bell,
  Menu,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/compartilhamento", label: "Compartilhamento", icon: Share2 },
  { path: "/pacientes", label: "Pacientes", icon: Users },
  { path: "/atendimentos", label: "Atendimentos", icon: Stethoscope },
  { path: "/faturamento", label: "Faturamento e Gestão", icon: Receipt, badge: "Em breve" },
  { path: "/leads", label: "Leads e Marketing", icon: Megaphone, badge: "Em breve" },
  { path: "/portal", label: "Portal do Paciente", icon: UserCircle, badge: "Em breve" },
  { path: "/performance", label: "Performance", icon: Activity },
];

// Cores dos perfis de usuário - Design System Gorgen
const profileColors: Record<string, string> = {
  admin_master: "bg-[#203864]",
  medico: "bg-[#2B4A7D]",
  secretaria: "bg-[#10B981]",
  auditor: "bg-[#F59E0B]",
  paciente: "bg-[#3B82F6]",
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const userProfileColor = profileColors[user?.role || ""] || "bg-[#203864]";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-white border-r border-gray-200
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "w-16" : "w-64"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <>
              <span className="text-lg font-bold text-[#203864] tracking-tight">GORGEN</span>
              <span className="text-xs text-gray-400 font-medium">v3.5.6</span>
            </>
          )}
          {sidebarCollapsed && (
            <span className="text-lg font-bold text-[#203864] mx-auto">G</span>
          )}
        </div>

        {/* Notifications */}
        <div className="px-3 py-2 border-b border-gray-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            {!sidebarCollapsed && (
              <>
                <span className="text-sm font-medium">Notificações</span>
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  9
                </span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1
                    transition-all duration-150
                    ${isActive
                      ? "bg-[#E0E8F2] text-[#203864]"
                      : "text-gray-600 hover:bg-gray-100"
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="px-2 py-2 border-t border-gray-200 hidden lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Recolher</span>
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="px-3 py-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div
                  className={`w-9 h-9 rounded-full ${userProfileColor} text-white flex items-center justify-center font-semibold text-sm flex-shrink-0`}
                >
                  {userInitials}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || "email@exemplo.com"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          min-h-screen transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}
          pt-16 lg:pt-0
        `}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
