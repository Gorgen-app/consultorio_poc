/**
 * ============================================================================
 * HOOK: useMinimizedWindows
 * ============================================================================
 * Gerencia as janelas de evolução minimizadas
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { JanelaMinimizada } from '../types';

interface UseMinimizedWindowsReturn {
  janelas: JanelaMinimizada[];
  adicionar: (janela: JanelaMinimizada) => void;
  remover: (id: number) => JanelaMinimizada | null;
  restaurar: (id: number) => JanelaMinimizada | null;
  atualizar: (id: number, updates: Partial<JanelaMinimizada>) => void;
  limpar: () => void;
  count: number;
}

export function useMinimizedWindows(): UseMinimizedWindowsReturn {
  const [janelas, setJanelas] = useState<JanelaMinimizada[]>([]);

  // Adicionar janela minimizada
  const adicionar = useCallback((janela: JanelaMinimizada) => {
    setJanelas((prev) => [...prev, janela]);
  }, []);

  // Remover janela (sem restaurar)
  const remover = useCallback((id: number): JanelaMinimizada | null => {
    let janelaRemovida: JanelaMinimizada | null = null;
    
    setJanelas((prev) => {
      const index = prev.findIndex((j) => j.id === id);
      if (index !== -1) {
        janelaRemovida = prev[index];
        return prev.filter((j) => j.id !== id);
      }
      return prev;
    });
    
    return janelaRemovida;
  }, []);

  // Restaurar janela (remove e retorna)
  const restaurar = useCallback((id: number): JanelaMinimizada | null => {
    let janelaRestaurada: JanelaMinimizada | null = null;
    
    setJanelas((prev) => {
      const index = prev.findIndex((j) => j.id === id);
      if (index !== -1) {
        janelaRestaurada = prev[index];
        return prev.filter((j) => j.id !== id);
      }
      return prev;
    });
    
    return janelaRestaurada;
  }, []);

  // Atualizar janela existente
  const atualizar = useCallback((id: number, updates: Partial<JanelaMinimizada>) => {
    setJanelas((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
  }, []);

  // Limpar todas as janelas
  const limpar = useCallback(() => {
    setJanelas([]);
  }, []);

  return {
    janelas,
    adicionar,
    remover,
    restaurar,
    atualizar,
    limpar,
    count: janelas.length,
  };
}

export default useMinimizedWindows;
