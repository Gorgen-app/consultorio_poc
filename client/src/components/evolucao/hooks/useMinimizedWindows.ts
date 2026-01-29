/**
 * ============================================================================
 * HOOK: useMinimizedWindows
 * ============================================================================
 * Gerencia as janelas de evolução minimizadas
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { MinimizedWindow } from '../types';

interface UseMinimizedWindowsReturn {
  windows: MinimizedWindow[];
  addWindow: (window: MinimizedWindow) => void;
  removeWindow: (id: string) => MinimizedWindow | null;
  restoreWindow: (id: string) => MinimizedWindow | null;
  updateWindow: (id: string, updates: Partial<MinimizedWindow>) => void;
  clearWindows: () => void;
  count: number;
}

export function useMinimizedWindows(): UseMinimizedWindowsReturn {
  const [windows, setWindows] = useState<MinimizedWindow[]>([]);

  // Adicionar janela minimizada
  const addWindow = useCallback((window: MinimizedWindow) => {
    setWindows((prev) => [...prev, window]);
  }, []);

  // Remover janela (sem restaurar)
  const removeWindow = useCallback((id: string): MinimizedWindow | null => {
    let removedWindow: MinimizedWindow | null = null;
    
    setWindows((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index !== -1) {
        removedWindow = prev[index];
        return prev.filter((w) => w.id !== id);
      }
      return prev;
    });
    
    return removedWindow;
  }, []);

  // Restaurar janela (remove e retorna)
  const restoreWindow = useCallback((id: string): MinimizedWindow | null => {
    let restoredWindow: MinimizedWindow | null = null;
    
    setWindows((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index !== -1) {
        restoredWindow = prev[index];
        return prev.filter((w) => w.id !== id);
      }
      return prev;
    });
    
    return restoredWindow;
  }, []);

  // Atualizar janela existente
  const updateWindow = useCallback((id: string, updates: Partial<MinimizedWindow>) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  // Limpar todas as janelas
  const clearWindows = useCallback(() => {
    setWindows([]);
  }, []);

  return {
    windows,
    addWindow,
    removeWindow,
    restoreWindow,
    updateWindow,
    clearWindows,
    count: windows.length,
  };
}

export default useMinimizedWindows;
