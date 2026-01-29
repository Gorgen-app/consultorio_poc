/**
 * ============================================================================
 * HOOK: usePendingDocuments
 * ============================================================================
 * Gerencia a lista de documentos pendentes de assinatura/conclusão
 * Integrado com API real via tRPC
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { DocumentoPendente } from '../types';

interface UsePendingDocumentsReturn {
  pendentes: DocumentoPendente[];
  count: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  marcarComoConcluido: (id: number) => void;
}

// Intervalo de polling em milissegundos (5 minutos)
const POLLING_INTERVAL = 5 * 60 * 1000;

export function usePendingDocuments(): UsePendingDocumentsReturn {
  const [pendentesLocais, setPendentesLocais] = useState<DocumentoPendente[]>([]);

  // Query para contar documentos pendentes
  const { 
    data: countData, 
    isLoading: isLoadingCount,
    error: countError,
    refetch: refetchCount,
  } = trpc.prontuario.evolucoes.countPendentes.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    staleTime: 60000, // 1 minuto
  });

  // Query para listar documentos pendentes
  const { 
    data: listData, 
    isLoading: isLoadingList,
    error: listError,
    refetch: refetchList,
  } = trpc.prontuario.evolucoes.listPendentes.useQuery(
    { limit: 10, offset: 0 },
    {
      refetchInterval: POLLING_INTERVAL,
      staleTime: 60000, // 1 minuto
    }
  );

  // Mapear dados da API para o formato do componente
  useEffect(() => {
    if (listData) {
      const mapped: DocumentoPendente[] = listData.map((doc: any) => ({
        id: doc.id,
        pacienteNome: doc.pacienteNome || 'Paciente',
        tipo: doc.tipo || 'Evolução',
        dataAbertura: doc.createdAt || doc.data,
        tempoAberto: calcularTempoAberto(doc.createdAt || doc.data),
      }));
      setPendentesLocais(mapped);
    }
  }, [listData]);

  // Calcular tempo aberto em segundos
  const calcularTempoAberto = (dataStr: string | Date): number => {
    try {
      const data = new Date(dataStr);
      const agora = new Date();
      return Math.floor((agora.getTime() - data.getTime()) / 1000);
    } catch {
      return 0;
    }
  };

  // Marcar documento como concluído (remove da lista local)
  const marcarComoConcluido = useCallback((id: number) => {
    setPendentesLocais((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  // Refresh manual
  const refresh = useCallback(() => {
    refetchCount();
    refetchList();
  }, [refetchCount, refetchList]);

  // Combinar estados de loading e error
  const isLoading = isLoadingCount || isLoadingList;
  const error = (countError || listError) as Error | null;

  return {
    pendentes: pendentesLocais,
    count: countData?.count || pendentesLocais.length,
    isLoading,
    error,
    refresh,
    marcarComoConcluido,
  };
}

export default usePendingDocuments;
