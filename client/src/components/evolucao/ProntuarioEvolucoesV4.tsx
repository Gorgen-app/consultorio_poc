/**
 * ============================================================================
 * COMPONENTE: ProntuarioEvolucoesV4
 * ============================================================================
 * Componente principal que integra o novo modal de evolução v4 com todos os
 * subcomponentes e funcionalidades implementadas.
 * 
 * Este componente substitui o ProntuarioEvolucoes antigo quando a feature
 * flag está ativa.
 * ============================================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Calendar, Clock, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

// Importar componentes do módulo de evolução
import {
  ModalEvolucao,
  ModalSelecionarExame,
} from './components';

// Importar hooks
import {
  useTimer,
  useEvolucao,
} from './hooks';

// Importar contexto global de janelas minimizadas
import { useMinimizedWindowsContext, MinimizedWindow as GlobalMinimizedWindow } from '@/contexts/MinimizedWindowsContext';

// Tipos
import { Evolucao, MinimizedWindow, TipoAtendimento } from './types';

interface ProntuarioEvolucoesV4Props {
  pacienteId: number;
  pacienteNome: string;
  pacienteCpf?: string;
  pacienteDataNascimento?: string;
  agendamentoId?: number;
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

// Componente de card de evolução
function EvolucaoCard({ 
  evolucao, 
  onClick 
}: { 
  evolucao: any; 
  onClick: () => void;
}) {
  const isAssinada = evolucao.assinado || evolucao.statusAssinatura === 'assinado';
  
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isAssinada 
                ? 'bg-green-100 text-green-600' 
                : 'bg-amber-100 text-amber-600'
            }`}>
              {isAssinada ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {evolucao.tipo || 'Consulta'}
                </span>
                <Badge variant={isAssinada ? 'default' : 'secondary'} className="text-xs">
                  {isAssinada ? 'Assinada' : 'Rascunho'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatarData(evolucao.dataEvolucao)}
                </div>
                {evolucao.profissionalNome && (
                  <span className="text-gray-400">
                    por {evolucao.profissionalNome}
                  </span>
                )}
              </div>
              
              {evolucao.subjetivo && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {evolucao.subjetivo.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal
export function ProntuarioEvolucoesV4({
  pacienteId,
  pacienteNome,
  pacienteCpf = '',
  pacienteDataNascimento = '',
  agendamentoId,
}: ProntuarioEvolucoesV4Props) {
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evolucaoSelecionada, setEvolucaoSelecionada] = useState<any>(null);
  const [isModalExameOpen, setIsModalExameOpen] = useState(false);

  // Contexto global de janelas minimizadas
  const { addWindow, restoreWindow } = useMinimizedWindowsContext();
  
  // Estado para armazenar dados da janela restaurada
  const [restoredWindowData, setRestoredWindowData] = useState<GlobalMinimizedWindow | null>(null);

  // Buscar evoluções do paciente
  const { 
    data: evolucoes, 
    isLoading, 
    refetch: refetchEvolucoes,
  } = trpc.prontuario.evolucoes.list.useQuery(
    { pacienteId },
    { enabled: pacienteId > 0 }
  );

  // Abrir modal para nova evolução
  const handleNovaEvolucao = useCallback(() => {
    setEvolucaoSelecionada(null);
    setIsModalOpen(true);
  }, []);

  // Abrir modal para editar evolução existente
  const handleEditarEvolucao = useCallback((evolucao: any) => {
    setEvolucaoSelecionada(evolucao);
    setIsModalOpen(true);
  }, []);

  // Fechar modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEvolucaoSelecionada(null);
  }, []);

  // Minimizar modal - recebe JanelaMinimizada do ModalEvolucao
  const handleMinimizeModal = useCallback((janela: any) => {
    const newWindow: GlobalMinimizedWindow = {
      id: `evolucao-${pacienteId}-${Date.now()}`,
      pacienteId: pacienteId,
      pacienteNome: janela.pacienteNome || pacienteNome,
      pacienteCpf: pacienteCpf,
      pacienteDataNascimento: pacienteDataNascimento,
      tipo: 'evolucao',
      conteudo: janela.conteudo || '',
      tempoAberto: janela.timerSeconds || 0,
      dataAbertura: janela.dataHora || new Date().toISOString(),
      agendamentoId: agendamentoId,
    };
    addWindow(newWindow);
    setIsModalOpen(false);
  }, [pacienteId, pacienteNome, pacienteCpf, pacienteDataNascimento, agendamentoId, addWindow]);

  // Listener para restaurar janela do contexto global
  useEffect(() => {
    const handleRestoreEvent = (event: CustomEvent<GlobalMinimizedWindow>) => {
      const window = event.detail;
      // Só restaurar se for do mesmo paciente
      if (window.pacienteId === pacienteId) {
        setRestoredWindowData(window);
        setIsModalOpen(true);
      }
    };

    document.addEventListener('restoreMinimizedWindow', handleRestoreEvent as EventListener);
    return () => {
      document.removeEventListener('restoreMinimizedWindow', handleRestoreEvent as EventListener);
    };
  }, [pacienteId]);

  // Callback de sucesso ao salvar
  const handleSaveSuccess = useCallback(() => {
    refetchEvolucoes();
  }, [refetchEvolucoes]);

  // Callback de sucesso ao assinar
  const handleSignSuccess = useCallback(() => {
    refetchEvolucoes();
    handleCloseModal();
  }, [refetchEvolucoes, handleCloseModal]);

  // Importar exame
  const handleImportExam = useCallback((exameId: number) => {
    // TODO: Integrar com a extração de dados do exame
    console.log('Importar exame:', exameId);
    setIsModalExameOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Evoluções</h2>
          <p className="text-sm text-gray-500">
            Registro de consultas e atendimentos do paciente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão de upload */}
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload de Documento
          </Button>
          
          {/* Botão de nova evolução */}
          <Button onClick={handleNovaEvolucao} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Evolução
          </Button>
        </div>
      </div>

      {/* Lista de evoluções */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
      ) : !evolucoes || evolucoes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma evolução registrada
            </h3>
            <p className="text-gray-500 mb-6">
              Clique em "Nova Evolução" para registrar o primeiro atendimento.
            </p>
            <Button onClick={handleNovaEvolucao} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Evolução
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evolucoes.map((evolucao: any) => (
            <EvolucaoCard
              key={evolucao.id}
              evolucao={evolucao}
              onClick={() => handleEditarEvolucao(evolucao)}
            />
          ))}
        </div>
      )}

      {/* Modal de evolução */}
      {isModalOpen && (
        <ModalEvolucao
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onMinimize={handleMinimizeModal}
          paciente={{
            id: pacienteId,
            nome: pacienteNome,
            cpf: pacienteCpf,
            dataNascimento: pacienteDataNascimento,
          }}
          agendamentoId={agendamentoId}
          evolucaoExistente={evolucaoSelecionada}
        />
      )}

      {/* Modal de seleção de exame */}
      <ModalSelecionarExame
        isOpen={isModalExameOpen}
        onClose={() => setIsModalExameOpen(false)}
        pacienteId={pacienteId}
        onExameSelecionado={handleImportExam}
      />

      {/* Barra de janelas minimizadas agora é global (GlobalMinimizedBar) */}
    </div>
  );
}

export default ProntuarioEvolucoesV4;
