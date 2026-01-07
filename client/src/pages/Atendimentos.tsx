import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Atendimentos() {
  const { data: atendimentos, isLoading } = trpc.atendimentos.list.useQuery({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Atendimentos</h1>
          <p className="text-muted-foreground mt-2">Gerenciar atendimentos realizados</p>
        </div>
        <Link href="/atendimentos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Atendimento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Atendimentos</CardTitle>
          <CardDescription>
            {atendimentos?.length || 0} atendimentos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : atendimentos && atendimentos.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atendimentos.map((atd) => (
                    <TableRow key={atd.id}>
                      <TableCell className="font-medium">{atd.atendimento}</TableCell>
                      <TableCell>{new Date(atd.dataAtendimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{atd.tipoAtendimento || "-"}</TableCell>
                      <TableCell>{atd.nomePaciente || "-"}</TableCell>
                      <TableCell>{atd.local || "-"}</TableCell>
                      <TableCell>{atd.convenio || "-"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          parseFloat(atd.faturamentoPrevistoFinal || "0")
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`badge-${atd.pagamentoEfetivado ? "success" : "warning"} px-2 py-1 rounded text-xs`}>
                          {atd.pagamentoEfetivado ? "Sim" : "Não"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum atendimento encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
