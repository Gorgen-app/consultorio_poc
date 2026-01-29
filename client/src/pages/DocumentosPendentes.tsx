/**
 * ============================================================================
 * PÁGINA: Documentos Pendentes
 * ============================================================================
 * Lista todos os documentos médicos (evoluções, receitas, atestados, etc.)
 * que estão pendentes de assinatura ou conclusão.
 * ============================================================================
 */

import { useState } from "react";
import { 
  FileText, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  FileSignature
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// Tipos
interface DocumentoPendente {
  id: number;
  tipo: 'Evolução' | 'Documento Médico';
  pacienteId: number;
  pacienteNome: string;
  data: string;
  createdAt: string;
}

// Formatar tempo decorrido
function formatarTempoDecorrido(dataStr: string): string {
  try {
    const data = new Date(dataStr);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) {
      return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
    } else if (diffHoras > 0) {
      return `há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else if (diffMinutos > 0) {
      return `há ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    } else {
      return 'agora';
    }
  } catch {
    return 'data inválida';
  }
}

// Formatar data
function formatarData(dataStr: string): string {
  try {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Data inválida';
  }
}

// Componente de card de documento pendente
function DocumentoCard({ documento, onClick }: { documento: DocumentoPendente; onClick: () => void }) {
  const tempoDecorrido = formatarTempoDecorrido(documento.createdAt);
  const isUrgente = tempoDecorrido.includes('dia');

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${
        isUrgente ? 'border-l-4 border-l-amber-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              documento.tipo === 'Evolução' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{documento.pacienteNome}</span>
                <Badge variant="outline" className="text-xs">
                  {documento.tipo}
                </Badge>
                {isUrgente && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatarData(documento.data)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {tempoDecorrido}
                </div>
              </div>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function DocumentosPendentes() {
  const [, setLocation] = useLocation();
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  // Buscar contagem de pendentes
  const { 
    data: countData, 
    isLoading: isLoadingCount 
  } = trpc.prontuario.evolucoes.countPendentes.useQuery();

  // Buscar lista de pendentes
  const { 
    data: pendentes, 
    isLoading: isLoadingList,
    refetch,
    isRefetching,
  } = trpc.prontuario.evolucoes.listPendentes.useQuery({ limit: 50, offset: 0 });

  // Filtrar documentos
  const documentosFiltrados = (pendentes || []).filter((doc: DocumentoPendente) => {
    // Filtro por tipo
    if (filtroTipo !== "todos" && doc.tipo !== filtroTipo) {
      return false;
    }
    
    // Filtro por busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      return doc.pacienteNome.toLowerCase().includes(termoBusca);
    }
    
    return true;
  });

  // Navegar para o documento
  const handleDocumentoClick = (documento: DocumentoPendente) => {
    if (documento.tipo === 'Evolução') {
      setLocation(`/prontuario/${documento.pacienteId}?tab=evolucoes&evolucaoId=${documento.id}`);
    } else {
      setLocation(`/prontuario/${documento.pacienteId}?tab=documentos&docId=${documento.id}`);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSignature className="w-7 h-7 text-blue-600" />
            Documentos Pendentes
          </h1>
          <p className="text-gray-500 mt-1">
            Documentos médicos aguardando assinatura ou conclusão
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Card de resumo */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Total de Pendências
              </p>
              {isLoadingCount ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <p className="text-4xl font-bold text-blue-900 mt-1">
                  {countData?.count || 0}
                </p>
              )}
            </div>
            <div className="p-4 bg-blue-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome do paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="Evolução">Evoluções</SelectItem>
            <SelectItem value="Documento Médico">Documentos Médicos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de documentos */}
      {isLoadingList ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tudo em dia!
            </h3>
            <p className="text-gray-500">
              {busca || filtroTipo !== "todos" 
                ? "Nenhum documento encontrado com os filtros aplicados."
                : "Não há documentos pendentes de assinatura ou conclusão."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documentosFiltrados.map((documento: DocumentoPendente) => (
            <DocumentoCard
              key={`${documento.tipo}-${documento.id}`}
              documento={documento}
              onClick={() => handleDocumentoClick(documento)}
            />
          ))}
        </div>
      )}

      {/* Dica */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <strong>Dica:</strong> Documentos marcados como "Urgente" estão pendentes há mais de 24 horas.
          Clique em um documento para abrir o prontuário do paciente e finalizar a assinatura.
        </p>
      </div>
    </div>
  );
}
