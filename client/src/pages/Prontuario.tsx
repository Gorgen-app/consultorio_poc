import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  AlertTriangle,
  Activity,
  Building2,
  Scissors,
  TestTube,
  Image,
  Heart,
  Syringe,
  Baby,
  FileOutput,
  Plus,
  Edit,
  Scale,
  Ruler,
  UserPlus,
  ClipboardList
} from "lucide-react";

// Componentes das seções
import ProntuarioEvolucoes from "@/components/prontuario/ProntuarioEvolucoes";
import ProntuarioInternacoes from "@/components/prontuario/ProntuarioInternacoes";
import ProntuarioCirurgias from "@/components/prontuario/ProntuarioCirurgias";
import ProntuarioExamesLab from "@/components/prontuario/ProntuarioExamesLab";
import ProntuarioExamesImagem from "@/components/prontuario/ProntuarioExamesImagem";
import ProntuarioEndoscopia from "@/components/prontuario/ProntuarioEndoscopia";
import ProntuarioCardiologia from "@/components/prontuario/ProntuarioCardiologia";
import ProntuarioTerapias from "@/components/prontuario/ProntuarioTerapias";
import ProntuarioObstetricia from "@/components/prontuario/ProntuarioObstetricia";
import ProntuarioDocumentos from "@/components/prontuario/ProntuarioDocumentos";
import ProntuarioResumoClinico from "@/components/prontuario/ProntuarioResumoClinico";
import HistoricoMedidas from "@/components/prontuario/HistoricoMedidas";

// Função para calcular idade
function calcularIdade(dataNascimento: Date | string | null): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

// Função para formatar data
function formatarData(data: string | Date | null): string {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

// Função para calcular IMC
function calcularIMC(peso: number | null, altura: number | null): string {
  if (!peso || !altura || altura === 0) return "-";
  const imc = peso / (altura * altura);
  return imc.toFixed(1);
}

// Função para classificar IMC
function classificarIMC(imc: number): { texto: string; cor: string } {
  if (imc < 18.5) return { texto: "Abaixo do peso", cor: "text-yellow-600" };
  if (imc < 25) return { texto: "Normal", cor: "text-green-600" };
  if (imc < 30) return { texto: "Sobrepeso", cor: "text-yellow-600" };
  if (imc < 35) return { texto: "Obesidade I", cor: "text-orange-600" };
  if (imc < 40) return { texto: "Obesidade II", cor: "text-red-600" };
  return { texto: "Obesidade III", cor: "text-red-700" };
}

export default function Prontuario() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const pacienteId = parseInt(params.id || "0");
  
  const [secaoAtiva, setSecaoAtiva] = useState("resumo");
  
  // Buscar prontuário completo
  const { data: prontuario, isLoading, error, refetch } = trpc.prontuario.completo.useQuery(
    { pacienteId },
    { enabled: pacienteId > 0 }
  );
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !prontuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Erro ao carregar prontuário</h2>
            <p className="text-gray-500 mb-4">
              {error?.message || "Paciente não encontrado"}
            </p>
            <Button onClick={() => setLocation("/pacientes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { paciente, resumoClinico, problemasAtivos, alergias, medicamentosUso } = prontuario;
  const idade = calcularIdade(paciente.dataNascimento);
  const isMulher = paciente.sexo === "F";
  
  // Calcular IMC
  const peso = resumoClinico?.pesoAtual ? Number(resumoClinico.pesoAtual) : null;
  const altura = resumoClinico?.altura ? Number(resumoClinico.altura) : null;
  const imcValor = peso && altura ? peso / (altura * altura) : null;
  const imcClassificacao = imcValor ? classificarIMC(imcValor) : null;
  
  // Menu lateral
  const menuItems = [
    { id: "resumo", label: "Resumo Clínico", icon: ClipboardList },
    { id: "medidas", label: "Medidas Antropométricas", icon: Scale },
    { id: "evolucoes", label: "Evoluções", icon: FileText },
    { id: "internacoes", label: "Internações", icon: Building2 },
    { id: "cirurgias", label: "Cirurgias", icon: Scissors },
    { id: "exames-lab", label: "Exames Laboratoriais", icon: TestTube },
    { id: "exames-imagem", label: "Exames de Imagem", icon: Image },
    { id: "endoscopia", label: "Endoscopia", icon: Stethoscope },
    { id: "cardiologia", label: "Cardiologia", icon: Heart },
    { id: "terapias", label: "Terapias e Infusões", icon: Syringe },
    ...(isMulher ? [{ id: "obstetricia", label: "Obstetrícia", icon: Baby }] : []),
    { id: "documentos", label: "Documentos", icon: FileOutput },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com dados do paciente */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          {/* Botão voltar e título */}
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/pacientes")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Prontuário Médico</h1>
              <p className="text-sm text-gray-500">ID: {paciente.idPaciente}</p>
            </div>
            <Badge variant={paciente.obitoPerda === "Ativo" ? "default" : "destructive"}>
              {paciente.obitoPerda || "Ativo"}
            </Badge>
          </div>
          
          {/* Dados do paciente */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Coluna 1: Identificação */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-lg font-semibold">{paciente.nome}</p>
                  <p className="text-sm text-gray-500">
                    {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Feminino" : "-"}, {idade ? `${idade} anos` : "-"}
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">CPF:</span> {paciente.cpf || "-"}</p>
                  <p><span className="text-gray-500">Nascimento:</span> {formatarData(paciente.dataNascimento)}</p>
                  <p><span className="text-gray-500">Mãe:</span> {paciente.nomeMae || "-"}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Coluna 2: Contato */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{paciente.telefone || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{paciente.email || "-"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    {paciente.endereco ? `${paciente.endereco}, ${paciente.bairro || ""} - ${paciente.cidade || ""}/${paciente.uf || ""}` : "-"}
                  </span>
                </div>
                {/* Responsável */}
                {paciente.responsavelNome && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      Responsável / Contato de Emergência
                    </p>
                    <p className="font-medium">{paciente.responsavelNome}</p>
                    <p className="text-gray-500">{paciente.responsavelParentesco || "-"}</p>
                    <p>{paciente.responsavelTelefone || "-"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Coluna 3: Dados Antropométricos */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Dados Antropométricos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {peso ? `${peso}` : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Peso (kg)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {altura ? `${altura}` : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Altura (m)</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${imcClassificacao?.cor || "text-gray-400"}`}>
                      {imcValor ? imcValor.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-gray-500">IMC</p>
                    {imcClassificacao && (
                      <p className={`text-xs ${imcClassificacao.cor}`}>{imcClassificacao.texto}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Coluna 4: Resumo Rápido */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Resumo Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Alergias */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Alergias
                  </p>
                  {alergias.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {alergias.map((a) => (
                        <Badge 
                          key={a.id} 
                          variant={a.gravidade === "Grave" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {a.substancia}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Nenhuma alergia conhecida
                    </Badge>
                  )}
                </div>
                
                {/* Problemas Ativos */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    Problemas Ativos ({problemasAtivos.filter(p => p.ativo).length})
                  </p>
                  {problemasAtivos.filter(p => p.ativo).slice(0, 3).map((p) => (
                    <p key={p.id} className="text-xs truncate">{p.descricao}</p>
                  ))}
                  {problemasAtivos.filter(p => p.ativo).length > 3 && (
                    <p className="text-xs text-blue-600">+{problemasAtivos.filter(p => p.ativo).length - 3} mais...</p>
                  )}
                </div>
                
                {/* Medicamentos */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Pill className="h-3 w-3" />
                    Medicamentos em Uso ({medicamentosUso.length})
                  </p>
                  {medicamentosUso.slice(0, 2).map((m) => (
                    <p key={m.id} className="text-xs truncate">{m.medicamento}</p>
                  ))}
                  {medicamentosUso.length > 2 && (
                    <p className="text-xs text-blue-600">+{medicamentosUso.length - 2} mais...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal com menu lateral */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* Menu lateral */}
        <div className="w-64 bg-white border-r min-h-[calc(100vh-280px)] p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSecaoAtiva(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    secaoAtiva === item.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Área de conteúdo */}
        <div className="flex-1 p-6">
          {secaoAtiva === "resumo" && (
            <ProntuarioResumoClinico 
              pacienteId={pacienteId} 
              resumoClinico={resumoClinico}
              problemasAtivos={problemasAtivos}
              alergias={alergias}
              medicamentosUso={medicamentosUso}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "medidas" && (
            <HistoricoMedidas 
              pacienteId={pacienteId} 
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "evolucoes" && (
            <ProntuarioEvolucoes 
              pacienteId={pacienteId} 
              evolucoes={prontuario.evolucoes}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "internacoes" && (
            <ProntuarioInternacoes 
              pacienteId={pacienteId} 
              internacoes={prontuario.internacoes}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "cirurgias" && (
            <ProntuarioCirurgias 
              pacienteId={pacienteId} 
              cirurgias={prontuario.cirurgias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "exames-lab" && (
            <ProntuarioExamesLab 
              pacienteId={pacienteId} 
              exames={prontuario.examesLaboratoriais}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "exames-imagem" && (
            <ProntuarioExamesImagem 
              pacienteId={pacienteId} 
              exames={prontuario.examesImagem}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "endoscopia" && (
            <ProntuarioEndoscopia 
              pacienteId={pacienteId} 
              exames={prontuario.endoscopias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "cardiologia" && (
            <ProntuarioCardiologia 
              pacienteId={pacienteId} 
              exames={prontuario.cardiologia}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "terapias" && (
            <ProntuarioTerapias 
              pacienteId={pacienteId} 
              terapias={prontuario.terapias}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "obstetricia" && isMulher && (
            <ProntuarioObstetricia 
              pacienteId={pacienteId} 
              registros={prontuario.obstetricia}
              onUpdate={refetch}
            />
          )}
          {secaoAtiva === "documentos" && (
            <ProntuarioDocumentos 
              pacienteId={pacienteId}
              pacienteNome={paciente.nome}
              documentos={prontuario.documentos}
              onUpdate={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}
