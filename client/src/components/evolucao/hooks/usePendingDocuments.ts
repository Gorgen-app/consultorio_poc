/**
 * ============================================================================
 * HOOK: usePendingDocuments
 * ============================================================================
 * Gerencia a lista de documentos pendentes de assinatura/conclusão
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { DocumentoPendente } from '../types';

interface UsePendingDocumentsReturn {
  pendentes: DocumentoPendente[];
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  marcarComoConcluido: (id: number) => void;
}

export function usePendingDocuments(): UsePendingDocumentsReturn {
  const [pendentes, setPendentes] = useState<DocumentoPendente[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar documentos pendentes
  const fetchPendentes = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar chamada de API real
      // const response = await api.get('/documentos/pendentes');
      // setPendentes(response.data);
      
      // Dados simulados
      const dadosSimulados: DocumentoPendente[] = [
        {
          id: 1,
          pacienteNome: 'Maria Silva',
          tipo: 'Evolução',
          dataAbertura: '2026-01-29T10:30:00',
          tempoAberto: 3600,
        },
        {
          id: 2,
          pacienteNome: 'João Santos',
          tipo: 'Receita',
          dataAbertura: '2026-01-29T09:15:00',
          tempoAberto: 7200,
        },
        {
          id: 3,
          pacienteNome: 'Ana Costa',
          tipo: 'Atestado',
          dataAbertura: '2026-01-28T16:45:00',
          tempoAberto: 86400,
        },
      ];
      
      setPendentes(dadosSimulados);
    } catch (error) {
      console.error('Erro ao buscar documentos pendentes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marcar documento como concluído
  const marcarComoConcluido = useCallback((id: number) => {
    setPendentes((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  // Refresh manual
  const refresh = useCallback(async () => {
    await fetchPendentes();
  }, [fetchPendentes]);

  // Carregar ao montar
  useEffect(() => {
    fetchPendentes();
  }, [fetchPendentes]);

  return {
    pendentes,
    count: pendentes.length,
    isLoading,
    refresh,
    marcarComoConcluido,
  };
}

export default usePendingDocuments;
