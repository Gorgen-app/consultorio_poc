/**
 * ============================================================================
 * CONTEXTO: MinimizedWindowsContext
 * ============================================================================
 * Gerencia o estado global das janelas minimizadas em toda a aplicação.
 * As janelas minimizadas persistem entre navegações de página.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Tipo de janela minimizada
export interface MinimizedWindow {
  id: string;
  pacienteId: number;
  pacienteNome: string;
  pacienteCpf?: string;
  pacienteDataNascimento?: string;
  tipo: 'evolucao' | 'documento';
  conteudo?: string;
  tempoAberto: number;
  dataAbertura: string;
  agendamentoId?: number;
}

// Interface do contexto
interface MinimizedWindowsContextType {
  windows: MinimizedWindow[];
  addWindow: (window: MinimizedWindow) => void;
  removeWindow: (id: string) => void;
  restoreWindow: (id: string) => MinimizedWindow | undefined;
  updateWindow: (id: string, updates: Partial<MinimizedWindow>) => void;
  clearWindows: () => void;
  getWindowById: (id: string) => MinimizedWindow | undefined;
}

// Criar contexto
const MinimizedWindowsContext = createContext<MinimizedWindowsContextType | undefined>(undefined);

// Provider
export function MinimizedWindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<MinimizedWindow[]>([]);

  // Adicionar janela
  const addWindow = useCallback((window: MinimizedWindow) => {
    setWindows(prev => {
      // Verificar se já existe uma janela com o mesmo ID
      const exists = prev.find(w => w.id === window.id);
      if (exists) {
        // Atualizar a janela existente
        return prev.map(w => w.id === window.id ? { ...w, ...window } : w);
      }
      // Adicionar nova janela
      return [...prev, window];
    });
  }, []);

  // Remover janela
  const removeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  // Restaurar janela (remove e retorna)
  const restoreWindow = useCallback((id: string): MinimizedWindow | undefined => {
    let restored: MinimizedWindow | undefined;
    setWindows(prev => {
      restored = prev.find(w => w.id === id);
      return prev.filter(w => w.id !== id);
    });
    return restored;
  }, []);

  // Atualizar janela
  const updateWindow = useCallback((id: string, updates: Partial<MinimizedWindow>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  // Limpar todas as janelas
  const clearWindows = useCallback(() => {
    setWindows([]);
  }, []);

  // Obter janela por ID
  const getWindowById = useCallback((id: string): MinimizedWindow | undefined => {
    return windows.find(w => w.id === id);
  }, [windows]);

  return (
    <MinimizedWindowsContext.Provider
      value={{
        windows,
        addWindow,
        removeWindow,
        restoreWindow,
        updateWindow,
        clearWindows,
        getWindowById,
      }}
    >
      {children}
    </MinimizedWindowsContext.Provider>
  );
}

// Hook para usar o contexto
export function useMinimizedWindowsContext() {
  const context = useContext(MinimizedWindowsContext);
  if (!context) {
    throw new Error('useMinimizedWindowsContext must be used within a MinimizedWindowsProvider');
  }
  return context;
}

export default MinimizedWindowsContext;
