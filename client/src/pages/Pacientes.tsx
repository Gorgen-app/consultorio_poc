import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: pacientes, isLoading } = trpc.pacientes.list.useQuery({
    nome: searchTerm || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">Gerenciar cadastro de pacientes</p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Pacientes</CardTitle>
          <CardDescription>Filtrar por nome, CPF ou convênio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {pacientes?.length || 0} pacientes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : pacientes && pacientes.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientes.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.idPaciente}</TableCell>
                      <TableCell>{paciente.nome}</TableCell>
                      <TableCell>{paciente.cpf || "-"}</TableCell>
                      <TableCell>{paciente.telefone || "-"}</TableCell>
                      <TableCell>{paciente.operadora1 || "-"}</TableCell>
                      <TableCell>
                        <span className={`badge-${paciente.statusCaso === "Ativo" ? "success" : "warning"} px-2 py-1 rounded text-xs`}>
                          {paciente.statusCaso || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum paciente encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
