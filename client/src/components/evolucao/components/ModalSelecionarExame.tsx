/**
 * ============================================================================
 * COMPONENTE: ModalSelecionarExame
 * ============================================================================
 * Modal para seleção de exames laboratoriais para importação na evolução
 * ============================================================================
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ExameLaboratorial {
  id: number;
  nomeArquivo: string;
  categoria: string;
  dataDocumento: string | null;
  laboratorio: string | null;
  createdAt: string;
}

interface ModalSelecionarExameProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: number;
  onExameSelecionado: (exameId: number) => void;
}

export const ModalSelecionarExame: React.FC<ModalSelecionarExameProps> = ({
  isOpen,
  onClose,
  pacienteId,
  onExameSelecionado,
}) => {
  const [selectedExameId, setSelectedExameId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Buscar exames do paciente
  const { data: exames, isLoading, error } = trpc.prontuario.evolucoes.listExamesPaciente.useQuery(
    { pacienteId },
    { enabled: isOpen && pacienteId > 0 }
  );

  // Formatar data
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Data não informada';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  // Handler de seleção
  const handleSelect = (exameId: number) => {
    setSelectedExameId(exameId);
  };

  // Handler de importação
  const handleImport = async () => {
    if (!selectedExameId) return;
    
    setIsImporting(true);
    try {
      await onExameSelecionado(selectedExameId);
      onClose();
    } catch (error) {
      console.error('Erro ao importar exame:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Importar Resultado de Exame
          </DialogTitle>
          <DialogDescription>
            Selecione um exame laboratorial para importar os resultados como tabela na evolução.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando exames...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Erro ao carregar exames.</p>
              <p className="text-gray-500 text-sm mt-2">Tente novamente mais tarde.</p>
            </div>
          ) : !exames || exames.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum exame laboratorial encontrado.</p>
              <p className="text-gray-500 text-sm mt-2">
                Faça upload de exames na aba "Exames Laboratoriais" do prontuário.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {exames.map((exame: ExameLaboratorial) => (
                  <div
                    key={exame.id}
                    onClick={() => handleSelect(exame.id)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all
                      ${selectedExameId === exame.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {exame.nomeArquivo || 'Exame sem nome'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(exame.dataDocumento)}
                          </div>
                          {exame.laboratorio && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {exame.laboratorio}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedExameId === exame.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedExameId || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar Exame'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalSelecionarExame;
