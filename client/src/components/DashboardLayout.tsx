import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Calendar, Stethoscope, ClipboardPlus, UserPlus, Settings, Shield, DollarSign, Eye, ChevronDown, ChevronRight, Search } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { temPermissao, type PerfilType, type Funcionalidade } from "../../../shared/permissions";
import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Mapeamento de perfis
const perfilInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin_master: { label: "Admin Master", icon: <Shield className="h-4 w-4" />, color: "bg-red-500" },
  medico: { label: "Médico", icon: <Stethoscope className="h-4 w-4" />, color: "bg-blue-500" },
  secretaria: { label: "Secretária", icon: <Calendar className="h-4 w-4" />, color: "bg-green-500" },
  auditor: { label: "Auditor", icon: <DollarSign className="h-4 w-4" />, color: "bg-yellow-500" },
  paciente: { label: "Paciente", icon: <Eye className="h-4 w-4" />, color: "bg-gray-500" },
};

// Menu items principais (sem subitens)
const mainMenuItems: { icon: typeof LayoutDashboard; label: string; path: string; funcionalidade: Funcionalidade }[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", funcionalidade: "dashboard" },
  { icon: Calendar, label: "Agenda", path: "/agenda", funcionalidade: "agenda" },
];

// Menu items com subitens
const menuWithSubitems: {
  icon: typeof Users;
  label: string;
  path: string;
  funcionalidade: Funcionalidade;
  subitems: { icon: typeof UserPlus; label: string; path: string; funcionalidade: Funcionalidade }[];
}[] = [
  {
    icon: Users,
    label: "Pacientes",
    path: "/pacientes",
    funcionalidade: "pacientes",
    subitems: [
      { icon: UserPlus, label: "Novo Paciente", path: "/pacientes/novo", funcionalidade: "pacientes.criar" },
      { icon: Search, label: "Buscar Paciente", path: "/pacientes?buscar=true", funcionalidade: "pacientes" },
    ],
  },
  {
    icon: Stethoscope,
    label: "Atendimentos",
    path: "/atendimentos",
    funcionalidade: "atendimentos",
    subitems: [
      { icon: ClipboardPlus, label: "Novo Atendimento", path: "/atendimentos/novo", funcionalidade: "atendimentos.criar" },
      { icon: Search, label: "Buscar Atendimento", path: "/atendimentos?buscar=true", funcionalidade: "atendimentos" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Estados para controlar os dropdowns abertos
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  // Queries de perfil
  const { data: profile, refetch: refetchProfile } = trpc.perfil.me.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: availablePerfis } = trpc.perfil.getAvailablePerfis.useQuery(undefined, {
    enabled: !!user,
  });
  const setPerfilAtivo = trpc.perfil.setPerfilAtivo.useMutation({
    onSuccess: () => {
      toast.success("Perfil alterado com sucesso!");
      refetchProfile();
    },
    onError: (error) => {
      toast.error(`Erro ao trocar perfil: ${error.message}`);
    },
  });
  
  const currentPerfil = profile?.perfilAtivo || "paciente";
  const currentPerfilInfo = perfilInfo[currentPerfil];
  
  // Encontrar item ativo para o título mobile
  const allItems = [
    ...mainMenuItems,
    ...menuWithSubitems.map(m => ({ ...m })),
    ...menuWithSubitems.flatMap(m => m.subitems),
  ];
  const activeMenuItem = allItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const toggleMenu = (menuPath: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuPath]: !prev[menuPath],
    }));
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {/* Menu items principais */}
              {mainMenuItems
                .filter(item => temPermissao(currentPerfil as PerfilType, item.funcionalidade))
                .map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-10 transition-all font-normal`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              
              {/* Menu items com subitens */}
              {menuWithSubitems
                .filter(item => temPermissao(currentPerfil as PerfilType, item.funcionalidade))
                .map(item => {
                  const isActive = location === item.path || item.subitems.some(sub => location === sub.path);
                  const isOpen = openMenus[item.path] ?? false;
                  const hasVisibleSubitems = item.subitems.some(sub => 
                    temPermissao(currentPerfil as PerfilType, sub.funcionalidade)
                  );
                  
                  return (
                    <Collapsible
                      key={item.path}
                      open={isOpen && !isCollapsed}
                    >
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          <SidebarMenuButton
                            isActive={location === item.path}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-10 transition-all font-normal flex-1`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                            />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {hasVisibleSubitems && !isCollapsed && (
                            <CollapsibleTrigger asChild>
                              <button
                                className="h-10 w-8 flex items-center justify-center hover:bg-accent rounded-r-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(item.path);
                                }}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                      </SidebarMenuItem>
                      
                      <CollapsibleContent>
                        {item.subitems
                          .filter(sub => temPermissao(currentPerfil as PerfilType, sub.funcionalidade))
                          .map(subitem => {
                            const isSubActive = location === subitem.path;
                            return (
                              <SidebarMenuItem key={subitem.path}>
                                <SidebarMenuButton
                                  isActive={isSubActive}
                                  onClick={() => setLocation(subitem.path)}
                                  tooltip={subitem.label}
                                  className={`h-9 transition-all font-normal ml-4 text-sm`}
                                >
                                  <subitem.icon
                                    className={`h-3.5 w-3.5 ${isSubActive ? "text-primary" : ""}`}
                                  />
                                  <span>{subitem.label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            {/* Botão de Configurações - apenas ícone */}
            {temPermissao(currentPerfil as PerfilType, "configuracoes") && (
              <div className="mb-2">
                <SidebarMenuButton
                  isActive={location === "/configuracoes"}
                  onClick={() => setLocation("/configuracoes")}
                  tooltip="Configurações"
                  className={`h-10 transition-all font-normal ${isCollapsed ? "justify-center" : ""}`}
                >
                  <Settings className={`h-4 w-4 ${location === "/configuracoes" ? "text-primary" : ""}`} />
                  {!isCollapsed && <span>Configurações</span>}
                </SidebarMenuButton>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Perfil atual */}
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Badge className={`${currentPerfilInfo?.color} text-white text-xs`}>
                    {currentPerfilInfo?.icon}
                    <span className="ml-1">{currentPerfilInfo?.label}</span>
                  </Badge>
                </DropdownMenuLabel>
                
                {/* Seletor de perfil - só mostra se tiver mais de um perfil */}
                {availablePerfis && availablePerfis.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Trocar Perfil</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {availablePerfis.map((perfil) => {
                          const info = perfilInfo[perfil];
                          const isActive = perfil === currentPerfil;
                          return (
                            <DropdownMenuItem
                              key={perfil}
                              onClick={() => !isActive && setPerfilAtivo.mutate({ perfil: perfil as any })}
                              className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
                              disabled={isActive || setPerfilAtivo.isPending}
                            >
                              {info?.icon}
                              <span className="ml-2">{info?.label}</span>
                              {isActive && <span className="ml-auto text-xs text-muted-foreground">(Ativo)</span>}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
