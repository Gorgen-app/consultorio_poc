import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Users, FileText, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MergePacientesModal } from "@/components/MergePacientesModal";
import { Merge } from "lucide-react";

// Função para normalizar nome para comparação
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z\s]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

// Função para normalizar CPF
function normalizarCPF(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
}

// Função para calcular similaridade entre strings (Levenshtein simplificado)
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = normalizarNome(str1);
  const s2 = normalizarNome(str2);
  
  if (s1 === s2) return 100;
  
  // Verificar se um contém o outro
  if (s1.includes(s2) || s2.includes(s1)) {
    const maior = Math.max(s1.length, s2.length);
    const menor = Math.min(s1.length, s2.length);
    return Math.round((menor / maior) * 100);
  }
  
  // Verificar palavras em comum
  const palavras1 = s1.split(" ").filter(p => p.length > 2);
  const palavras2 = s2.split(" ").filter(p => p.length > 2);
  const comuns = palavras1.filter(p => palavras2.includes(p));
  
  if (comuns.length > 0) {
    return Math.round((comuns.length / Math.max(palavras1.length, palavras2.length)) * 100);
  }
  
  return 0;
}

interface Paciente {
  id: number;
  idPaciente: string;
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  operadora1?: string | null;
  telefone?: string | null;
}

interface GrupoDuplicado {
  tipo: "cpf" | "nome";
  chave: string;
  pacientes: Paciente[];
  similaridade?: number;
}

export default function RelatorioDuplicados() {
  const [, setLocation] = useLocation();
  const [abaAtiva, setAbaAtiva] = useState("cpf");
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [pacientesParaMerge, setPacientesParaMerge] = useState<Paciente[]>([]);
  
  const { data: pacientes, isLoading, refetch, isFetching } = trpc.pacientes.list.useQuery({ 
    limit: 50000 
  });
  
  // Identificar duplicados por CPF
  const duplicadosCPF = useMemo(() => {
    if (!pacientes) return [];
    
    const porCPF = new Map<string, Paciente[]>();
    
    pacientes.forEach((p: Paciente) => {
      const cpfNormalizado = normalizarCPF(p.cpf);
      if (cpfNormalizado && cpfNormalizado.length === 11) {
        const grupo = porCPF.get(cpfNormalizado) || [];
        grupo.push(p);
        porCPF.set(cpfNormalizado, grupo);
      }
    });
    
    const duplicados: GrupoDuplicado[] = [];
    porCPF.forEach((grupo, cpf) => {
      if (grupo.length > 1) {
        duplicados.push({
          tipo: "cpf",
          chave: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
          pacientes: grupo,
        });
      }
    });
    
    return duplicados.sort((a, b) => b.pacientes.length - a.pacientes.length);
  }, [pacientes]);
  
  // Identificar duplicados por nome similar
  const duplicadosNome = useMemo(() => {
    if (!pacientes) return [];
    
    const porNome = new Map<string, Paciente[]>();
    
    pacientes.forEach((p: Paciente) => {
      const nomeNormalizado = normalizarNome(p.nome);
      if (nomeNormalizado) {
        const grupo = porNome.get(nomeNormalizado) || [];
        grupo.push(p);
        porNome.set(nomeNormalizado, grupo);
      }
    });
    
    const duplicados: GrupoDuplicado[] = [];
    porNome.forEach((grupo, nome) => {
      if (grupo.length > 1) {
        duplicados.push({
          tipo: "nome",
          chave: grupo[0].nome,
          pacientes: grupo,
          similaridade: 100,
        });
      }
    });
    
    return duplicados.sort((a, b) => b.pacientes.length - a.pacientes.length);
  }, [pacientes]);
  
  const totalDuplicadosCPF = duplicadosCPF.reduce((acc, g) => acc + g.pacientes.length, 0);
  const totalDuplicadosNome = duplicadosNome.reduce((acc, g) => acc + g.pacientes.length, 0);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/pacientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Pacientes Duplicados</h1>
            <p className="text-sm text-gray-500">Identificação de possíveis cadastros duplicados por CPF ou nome</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pacientes?.length?.toLocaleString("pt-BR") || 0}</p>
            </CardContent>
          </Card>
          
          <Card className={duplicadosCPF.length > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${duplicadosCPF.length > 0 ? "text-red-500" : ""}`} />
                Duplicados por CPF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${duplicadosCPF.length > 0 ? "text-red-600" : ""}`}>
                {duplicadosCPF.length} grupos ({totalDuplicadosCPF} pacientes)
              </p>
            </CardContent>
          </Card>
          
          <Card className={duplicadosNome.length > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${duplicadosNome.length > 0 ? "text-yellow-500" : ""}`} />
                Duplicados por Nome
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${duplicadosNome.length > 0 ? "text-yellow-600" : ""}`}>
                {duplicadosNome.length} grupos ({totalDuplicadosNome} pacientes)
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs com Tabelas */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
              <TabsList className="mb-4">
                <TabsTrigger value="cpf" className="gap-2">
                  <Badge variant={duplicadosCPF.length > 0 ? "destructive" : "secondary"}>
                    {duplicadosCPF.length}
                  </Badge>
                  Duplicados por CPF
                </TabsTrigger>
                <TabsTrigger value="nome" className="gap-2">
                  <Badge variant={duplicadosNome.length > 0 ? "default" : "secondary"} className={duplicadosNome.length > 0 ? "bg-yellow-500" : ""}>
                    {duplicadosNome.length}
                  </Badge>
                  Duplicados por Nome
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="cpf">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : duplicadosCPF.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Nenhum duplicado por CPF encontrado!</p>
                    <p className="text-sm text-gray-500">Todos os CPFs são únicos no sistema.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duplicadosCPF.map((grupo, idx) => (
                      <Card key={idx} className="border-red-200">
                        <CardHeader className="py-3 bg-red-50">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              CPF: {grupo.chave}
                              <Badge variant="destructive">{grupo.pacientes.length} registros</Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setPacientesParaMerge(grupo.pacientes);
                                setMergeModalOpen(true);
                              }}
                            >
                              <Merge className="h-4 w-4" />
                              Unificar
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Data Nascimento</TableHead>
                                <TableHead>Convênio</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grupo.pacientes.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="font-mono text-xs">{p.idPaciente}</TableCell>
                                  <TableCell className="font-medium">{p.nome}</TableCell>
                                  <TableCell>
                                    {p.dataNascimento 
                                      ? new Date(p.dataNascimento).toLocaleDateString("pt-BR")
                                      : "-"}
                                  </TableCell>
                                  <TableCell>{p.operadora1 || "-"}</TableCell>
                                  <TableCell>{p.telefone || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/prontuario/${p.id}`}>
                                      <Button variant="ghost" size="sm" title="Ver prontuário">
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="nome">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : duplicadosNome.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Nenhum duplicado por nome encontrado!</p>
                    <p className="text-sm text-gray-500">Todos os nomes são únicos no sistema.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duplicadosNome.slice(0, 50).map((grupo, idx) => (
                      <Card key={idx} className="border-yellow-200">
                        <CardHeader className="py-3 bg-yellow-50">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Nome: {grupo.chave}
                              <Badge className="bg-yellow-500">{grupo.pacientes.length} registros</Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setPacientesParaMerge(grupo.pacientes);
                                setMergeModalOpen(true);
                              }}
                            >
                              <Merge className="h-4 w-4" />
                              Unificar
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead>Data Nascimento</TableHead>
                                <TableHead>Convênio</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grupo.pacientes.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="font-mono text-xs">{p.idPaciente}</TableCell>
                                  <TableCell className="font-medium">{p.nome}</TableCell>
                                  <TableCell>{p.cpf || "-"}</TableCell>
                                  <TableCell>
                                    {p.dataNascimento 
                                      ? new Date(p.dataNascimento).toLocaleDateString("pt-BR")
                                      : "-"}
                                  </TableCell>
                                  <TableCell>{p.operadora1 || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/prontuario/${p.id}`}>
                                      <Button variant="ghost" size="sm" title="Ver prontuário">
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                    {duplicadosNome.length > 50 && (
                      <p className="text-center text-sm text-gray-500">
                        Mostrando 50 de {duplicadosNome.length} grupos. Exporte para ver todos.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Merge */}
      <MergePacientesModal
        open={mergeModalOpen}
        onOpenChange={setMergeModalOpen}
        pacientes={pacientesParaMerge}
        onMergeComplete={() => {
          refetch();
          setPacientesParaMerge([]);
        }}
      />
    </div>
  );
}
