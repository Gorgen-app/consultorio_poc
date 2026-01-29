/**
 * ============================================================================
 * COMPONENTE: MinimizedBar
 * ============================================================================
 * Barra inferior com abas de janelas minimizadas
 * ============================================================================
 */

import React from 'react';
import { MinimizedBarProps, JanelaMinimizada } from '../types';

// Ícones
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// Formatar tempo
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

// Componente de Aba Minimizada
const MinimizedTab: React.FC<{
  janela: JanelaMinimizada;
  onRestore: () => void;
  onClose: () => void;
}> = ({ janela, onRestore, onClose }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="minimized-tab" onClick={onRestore}>
      <FileIcon />
      <span className="tab-name">{janela.pacienteNome}</span>
      <span className="tab-timer">{formatTime(janela.timerSeconds)}</span>
      <button className="tab-close" onClick={handleClose} title="Fechar">
        ×
      </button>
    </div>
  );
};

export const MinimizedBar: React.FC<MinimizedBarProps> = ({
  janelas,
  onRestore,
  onClose,
}) => {
  if (janelas.length === 0) {
    return null;
  }

  return (
    <div className="minimized-bar">
      {janelas.map((janela) => (
        <MinimizedTab
          key={janela.id}
          janela={janela}
          onRestore={() => onRestore(janela.id)}
          onClose={() => onClose(janela.id)}
        />
      ))}

      <style>{`
        .minimized-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: #1F2937;
          border-top: 1px solid #374151;
          z-index: 1000;
          overflow-x: auto;
        }

        .minimized-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #374151;
          border-radius: 6px 6px 0 0;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .minimized-tab:hover {
          background: #4B5563;
        }

        .minimized-tab svg {
          color: #9CA3AF;
          flex-shrink: 0;
        }

        .tab-name {
          font-size: 13px;
          font-weight: 500;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-timer {
          font-size: 11px;
          color: #9CA3AF;
          font-family: 'Courier New', monospace;
          padding: 2px 6px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: #9CA3AF;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: 4px;
        }

        .tab-close:hover {
          background: rgba(239, 68, 68, 0.8);
          color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .minimized-bar {
            padding: 6px 12px;
          }

          .minimized-tab {
            padding: 6px 10px;
          }

          .tab-name {
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default MinimizedBar;


// ============================================================================
// VERSÃO V4: MinimizedBarV4 (usa MinimizedWindow com id string)
// ============================================================================

import { MinimizedBarV4Props, MinimizedWindow } from '../types';

// Componente de Aba Minimizada V4
const MinimizedTabV4: React.FC<{
  window: MinimizedWindow;
  onRestore: () => void;
  onClose: () => void;
}> = ({ window, onRestore, onClose }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="minimized-tab" onClick={onRestore}>
      <FileIcon />
      <span className="tab-name">{window.pacienteNome}</span>
      <span className="tab-timer">{formatTime(window.tempoAberto)}</span>
      <button className="tab-close" onClick={handleClose} title="Fechar">
        ×
      </button>
    </div>
  );
};

export const MinimizedBarV4: React.FC<MinimizedBarV4Props> = ({
  windows,
  onRestore,
  onClose,
}) => {
  if (windows.length === 0) {
    return null;
  }

  return (
    <div className="minimized-bar">
      {windows.map((win) => (
        <MinimizedTabV4
          key={win.id}
          window={win}
          onRestore={() => onRestore(win.id)}
          onClose={() => onClose(win.id)}
        />
      ))}

      <style>{`
        .minimized-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: #1F2937;
          border-top: 1px solid #374151;
          z-index: 1000;
          overflow-x: auto;
        }

        .minimized-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #374151;
          border-radius: 6px 6px 0 0;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .minimized-tab:hover {
          background: #4B5563;
        }

        .minimized-tab svg {
          color: #9CA3AF;
          flex-shrink: 0;
        }

        .tab-name {
          font-size: 13px;
          font-weight: 500;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-timer {
          font-size: 11px;
          color: #9CA3AF;
          font-family: 'Courier New', monospace;
          padding: 2px 6px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: #9CA3AF;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: 4px;
        }

        .tab-close:hover {
          background: rgba(239, 68, 68, 0.8);
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};
