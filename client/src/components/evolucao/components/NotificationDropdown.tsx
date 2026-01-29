/**
 * ============================================================================
 * COMPONENTE: NotificationDropdown
 * ============================================================================
 * Dropdown de notificações com documentos pendentes de assinatura
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotificationDropdownProps, DocumentoPendente } from '../types';

// Ícones
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const FileWarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="11" x2="12" y2="15" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Formatar tempo aberto
const formatarTempoAberto = (segundos: number): string => {
  if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60);
    return `${minutos} min`;
  }
  if (segundos < 86400) {
    const horas = Math.floor(segundos / 3600);
    return `${horas}h`;
  }
  const dias = Math.floor(segundos / 86400);
  return `${dias}d`;
};

// Formatar data
const formatarData = (data: string): string => {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// Item de documento pendente
const PendingDocumentItem: React.FC<{
  documento: DocumentoPendente;
  onClick: () => void;
}> = ({ documento, onClick }) => {
  return (
    <div className="pending-item" onClick={onClick}>
      <div className="pending-icon">
        <FileWarningIcon />
      </div>
      <div className="pending-info">
        <span className="pending-patient">{documento.pacienteNome}</span>
        <span className="pending-type">{documento.tipo}</span>
        <span className="pending-time">Aberto há {formatarTempoAberto(documento.tempoAberto)}</span>
      </div>
    </div>
  );
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  pendentes,
  onViewAll,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback((id: number) => {
    onItemClick(id);
    setIsOpen(false);
  }, [onItemClick]);

  const handleViewAll = useCallback(() => {
    onViewAll();
    setIsOpen(false);
  }, [onViewAll]);

  const count = pendentes.length;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button className="notification-trigger" onClick={toggleDropdown} title="Documentos pendentes">
        <BellIcon />
        {count > 0 && <span className="notification-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {isOpen && (
        <div className="notification-menu">
          <div className="menu-header">
            <h4>Documentos Pendentes</h4>
            <span className="menu-count">{count} pendente{count !== 1 ? 's' : ''}</span>
          </div>

          <div className="menu-content">
            {pendentes.length === 0 ? (
              <p className="empty-message">Nenhum documento pendente</p>
            ) : (
              pendentes.slice(0, 5).map((doc) => (
                <PendingDocumentItem
                  key={doc.id}
                  documento={doc}
                  onClick={() => handleItemClick(doc.id)}
                />
              ))
            )}
          </div>

          {pendentes.length > 0 && (
            <div className="menu-footer">
              <button className="btn-view-all" onClick={handleViewAll}>
                Ver todos os pendentes
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notification-dropdown {
          position: relative;
        }

        .notification-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-trigger:hover {
          background: #F3F4F6;
          color: #374151;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: #EF4444;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 600;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          margin-top: 8px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          overflow: hidden;
        }

        .menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }

        .menu-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .menu-count {
          font-size: 12px;
          color: #EF4444;
          font-weight: 500;
        }

        .menu-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .empty-message {
          padding: 24px;
          text-align: center;
          color: #9CA3AF;
          font-size: 13px;
        }

        .pending-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #F3F4F6;
        }

        .pending-item:last-child {
          border-bottom: none;
        }

        .pending-item:hover {
          background: #F9FAFB;
        }

        .pending-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #FEF3C7;
          border-radius: 8px;
          color: #F59E0B;
          flex-shrink: 0;
        }

        .pending-info {
          flex: 1;
          min-width: 0;
        }

        .pending-patient {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pending-type {
          display: block;
          font-size: 12px;
          color: #6B7280;
          margin-top: 2px;
        }

        .pending-time {
          display: block;
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 2px;
        }

        .menu-footer {
          padding: 12px 16px;
          background: #F9FAFB;
          border-top: 1px solid #E5E7EB;
        }

        .btn-view-all {
          width: 100%;
          padding: 10px;
          background: #0056A4;
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-view-all:hover {
          background: #004080;
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
