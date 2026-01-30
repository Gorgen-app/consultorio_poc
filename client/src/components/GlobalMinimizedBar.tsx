/**
 * ============================================================================
 * COMPONENTE: GlobalMinimizedBar
 * ============================================================================
 * Barra fixa na parte inferior da tela que exibe todas as janelas minimizadas.
 * Similar às tabs de um browser, permite restaurar ou fechar janelas.
 * Este componente deve ser renderizado no nível do App para estar sempre visível.
 * ============================================================================
 */

import React from 'react';
import { useMinimizedWindowsContext, MinimizedWindow } from '@/contexts/MinimizedWindowsContext';
import { X, FileText, Clock } from 'lucide-react';

// Formatar tempo em MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Componente de tab individual
function MinimizedTab({
  window,
  onRestore,
  onClose,
}: {
  window: MinimizedWindow;
  onRestore: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="minimized-tab"
      onClick={onRestore}
      title={`${window.pacienteNome} - Clique para restaurar`}
    >
      <div className="tab-icon">
        <FileText size={14} />
      </div>
      <div className="tab-content">
        <span className="tab-name">{window.pacienteNome}</span>
        <span className="tab-time">
          <Clock size={10} />
          {formatTime(window.tempoAberto)}
        </span>
      </div>
      <button
        className="tab-close"
        onClick={onClose}
        title="Fechar"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Componente principal
export function GlobalMinimizedBar() {
  const { windows, removeWindow, restoreWindow } = useMinimizedWindowsContext();

  // Não renderizar se não houver janelas
  if (windows.length === 0) {
    return null;
  }

  const handleRestore = (id: string) => {
    const window = restoreWindow(id);
    if (window) {
      // Disparar evento customizado para que o componente de evolução saiba restaurar
      const event = new CustomEvent('restoreMinimizedWindow', { detail: window });
      document.dispatchEvent(event);
    }
  };

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // TODO: Adicionar confirmação se houver alterações não salvas
    removeWindow(id);
  };

  return (
    <>
      <div className="global-minimized-bar">
        <div className="bar-container">
          {windows.map((window) => (
            <MinimizedTab
              key={window.id}
              window={window}
              onRestore={() => handleRestore(window.id)}
              onClose={(e) => handleClose(e, window.id)}
            />
          ))}
        </div>
      </div>

      <style>{`
        .global-minimized-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: linear-gradient(135deg, #1E3A5F 0%, #0056A4 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        }

        .bar-container {
          display: flex;
          align-items: stretch;
          gap: 2px;
          padding: 4px 8px;
          overflow-x: auto;
          max-width: 100%;
        }

        .bar-container::-webkit-scrollbar {
          height: 4px;
        }

        .bar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .bar-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .minimized-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
          max-width: 280px;
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .minimized-tab:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .tab-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tab-name {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          opacity: 0.8;
          font-variant-numeric: tabular-nums;
        }

        .tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .tab-close:hover {
          background: rgba(239, 68, 68, 0.8);
          color: #FFFFFF;
        }

        /* Ajuste para não sobrepor conteúdo da página */
        body {
          padding-bottom: 60px;
        }
      `}</style>
    </>
  );
}

export default GlobalMinimizedBar;
