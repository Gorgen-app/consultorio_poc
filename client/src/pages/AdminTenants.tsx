import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/MaskedInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Users, Calendar, Search, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminTenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const [newTenant, setNewTenant] = useState({
    nome: "",
    slug: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    plano: "basic" as "free" | "basic" | "professional" | "enterprise",
    maxUsuarios: 5,
    maxPacientes: 100,
  });

  const { data: tenants, isLoading, refetch } = trpc.tenants.list.useQuery();
  const createTenant = trpc.tenants.create.useMutation({
    onSuccess: () => {
      toast.success("Tenant criado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
      setNewTenant({
        nome: "",
        slug: "",
        cnpj: "",
        email: "",
        telefone: "",
        endereco: "",
        plano: "basic",
        maxUsuarios: 5,
        maxPacientes: 100,
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar tenant: ${error.message}`);
    },
  });

  const updateTenant = trpc.tenants.update.useMutation({
    onSuccess: () => {
      toast.success("Tenant atualizado com sucesso!");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar tenant: ${error.message}`);
    },
  });

  const toggleTenantStatus = trpc.tenants.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do tenant atualizado!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const filteredTenants = tenants?.filter((tenant: any) =>
    tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCreateTenant = () => {
    if (!newTenant.nome || !newTenant.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    createTenant.mutate(newTenant);
  };

  const handleUpdateTenant = () => {
    if (!selectedTenant) return;
    updateTenant.mutate({
      id: selectedTenant.id,
      ...selectedTenant,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>;
      case "suspenso":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Suspenso</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanoBadge = (plano: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      professional: "bg-purple-500",
      enterprise: "bg-amber-500",
    };
    return <Badge className={colors[plano] || "bg-gray-500"}>{plano.charAt(0).toUpperCase() + plano.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração de Tenants</h1>
          <p className="text-muted-foreground">Gerencie os consultórios e clínicas cadastrados no sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Tenant</DialogTitle>
              <DialogDescription>
                Cadastre um novo consultório ou clínica no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Consultório *</Label>
                  <Input
                    id="nome"
                    value={newTenant.nome}
                    onChange={(e) => {
                      setNewTenant({
                        ...newTenant,
                        nome: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Ex: Clínica São Lucas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                    placeholder="clinica-sao-lucas"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <MaskedInput
                    mask="cnpj"
                    id="cnpj"
                    value={newTenant.cnpj}
                    onChange={(e) => setNewTenant({ ...newTenant, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <MaskedInput
                    mask="telefone"
                    id="telefone"
                    value={newTenant.telefone}
                    onChange={(e) => setNewTenant({ ...newTenant, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  placeholder="contato@clinica.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={newTenant.endereco}
                  onChange={(e) => setNewTenant({ ...newTenant, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plano">Plano</Label>
                  <Select
                    value={newTenant.plano}
                    onValueChange={(value: any) => setNewTenant({ ...newTenant, plano: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsuarios">Máx. Usuários</Label>
                  <Input
                    id="maxUsuarios"
                    type="number"
                    value={newTenant.maxUsuarios}
                    onChange={(e) => setNewTenant({ ...newTenant, maxUsuarios: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPacientes">Máx. Pacientes</Label>
                  <Input
                    id="maxPacientes"
                    type="number"
                    value={newTenant.maxPacientes}
                    onChange={(e) => setNewTenant({ ...newTenant, maxPacientes: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTenant} disabled={createTenant.isPending}>
                {createTenant.isPending ? "Criando..." : "Criar Tenant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants?.filter((t: any) => t.status === "ativo").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Enterprise</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants?.filter((t: any) => t.plano === "enterprise").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidade Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants?.reduce((acc: number, t: any) => acc + (t.maxPacientes || 0), 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">pacientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tenants</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, slug ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tenant encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant: any) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-mono">{tenant.id}</TableCell>
                    <TableCell className="font-medium">{tenant.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                    <TableCell>{tenant.email || "-"}</TableCell>
                    <TableCell>{getPlanoBadge(tenant.plano)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{tenant.maxUsuarios} usuários</div>
                      <div className="text-muted-foreground">{tenant.maxPacientes?.toLocaleString()} pacientes</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toggleTenantStatus.mutate({
                              id: tenant.id,
                              status: tenant.status === "ativo" ? "inativo" : "ativo",
                            });
                          }}
                        >
                          {tenant.status === "ativo" ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Tenant</DialogTitle>
            <DialogDescription>
              Atualize as informações do tenant
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Consultório</Label>
                  <Input
                    value={selectedTenant.nome}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={selectedTenant.slug}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={selectedTenant.cnpj || ""}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={selectedTenant.telefone || ""}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, telefone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={selectedTenant.email || ""}
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select
                    value={selectedTenant.plano}
                    onValueChange={(value) => setSelectedTenant({ ...selectedTenant, plano: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Máx. Usuários</Label>
                  <Input
                    type="number"
                    value={selectedTenant.maxUsuarios}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, maxUsuarios: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Pacientes</Label>
                  <Input
                    type="number"
                    value={selectedTenant.maxPacientes}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, maxPacientes: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedTenant.status}
                  onValueChange={(value) => setSelectedTenant({ ...selectedTenant, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTenant} disabled={updateTenant.isPending}>
              {updateTenant.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
