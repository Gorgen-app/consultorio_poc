/**
 * ============================================================================
 * COMPONENTE: ModalFooter
 * ============================================================================
 * Rodapé do modal com botões de ação e atalhos de teclado
 * ============================================================================
 */

import React from 'react';
import { ModalFooterProps } from '../types';

// Ícones
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const SignIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ExitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const ModalFooter: React.FC<ModalFooterProps> = ({
  isDirty,
  isSaving,
  isSigning,
  onCancel,
  onSaveAndExit,
  onSave,
  onSign,
  onSignAndFinish,
}) => {
  return (
    <footer className="modal-footer">
      {/* Atalhos de Teclado */}
      <div className="shortcuts-info">
        <span className="shortcut">
          <kbd>Ctrl</kbd> + <kbd>S</kbd> salvar
        </span>
        <span className="shortcut">
          <kbd>Ctrl</kbd> + <kbd>↵</kbd> encerrar
        </span>
      </div>

      {/* Botões de Ação */}
      <div className="footer-actions">
        <button
          className="btn btn-cancel"
          onClick={onCancel}
          disabled={isSaving || isSigning}
        >
          Cancelar
        </button>

        <button
          className="btn btn-save-exit"
          onClick={onSaveAndExit}
          disabled={isSaving || isSigning}
        >
          <ExitIcon />
          Salvar e Sair
        </button>

        <button
          className="btn btn-save"
          onClick={onSave}
          disabled={isSaving || isSigning}
        >
          <SaveIcon />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>

        <button
          className="btn btn-sign"
          onClick={onSign}
          disabled={isSaving || isSigning}
        >
          <SignIcon />
          {isSigning ? 'Assinando...' : 'Assinar'}
        </button>

        <button
          className="btn btn-sign-finish"
          onClick={onSignAndFinish}
          disabled={isSaving || isSigning}
        >
          <CheckIcon />
          Assinar e Encerrar
        </button>
      </div>

      <style>{`
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: #F9FAFB;
          border-top: 1px solid #E5E7EB;
          flex-shrink: 0;
        }

        .shortcuts-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .shortcut {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #9CA3AF;
        }

        kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          padding: 2px 6px;
          background: #E5E7EB;
          border: 1px solid #D1D5DB;
          border-radius: 4px;
          font-size: 11px;
          font-family: inherit;
          color: #6B7280;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn svg {
          flex-shrink: 0;
        }

        .btn-cancel {
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          color: #6B7280;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #F3F4F6;
          border-color: #9CA3AF;
        }

        .btn-save-exit {
          background: #F59E0B;
          color: #FFFFFF;
        }

        .btn-save-exit:hover:not(:disabled) {
          background: #D97706;
        }

        .btn-save {
          background: #6B7280;
          color: #FFFFFF;
        }

        .btn-save:hover:not(:disabled) {
          background: #4B5563;
        }

        .btn-sign {
          background: #1E3A5F;
          color: #FFFFFF;
        }

        .btn-sign:hover:not(:disabled) {
          background: #152a45;
        }

        .btn-sign-finish {
          background: #10B981;
          color: #FFFFFF;
        }

        .btn-sign-finish:hover:not(:disabled) {
          background: #059669;
        }

        @media (max-width: 768px) {
          .modal-footer {
            flex-direction: column;
            gap: 12px;
          }

          .shortcuts-info {
            order: 2;
          }

          .footer-actions {
            order: 1;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default ModalFooter;
