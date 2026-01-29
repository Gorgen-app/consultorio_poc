/**
 * ============================================================================
 * COMPONENTE: ModalHeader
 * ============================================================================
 * Cabeçalho do modal de evolução com informações do paciente e controles
 * ============================================================================
 */

import React from 'react';
import { ModalHeaderProps } from '../types';

// Ícones inline para evitar dependências externas
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Função para calcular idade
const calcularIdade = (dataNascimento: string): number => {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
};

// Função para formatar CPF
const formatarCPF = (cpf: string): string => {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para formatar data
const formatarData = (data: string): string => {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  paciente,
  timerSeconds,
  agendamentoId,
  onProntuario,
  onMinimize,
  onClose,
}) => {
  const idade = paciente.idade || calcularIdade(paciente.dataNascimento);
  
  // Formatar timer
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <header className="modal-header">
      <div className="header-content">
        {/* Informações do Paciente */}
        <div className="patient-info">
          <h1 className="patient-name">
            <UserIcon />
            <span id="patientName">{paciente.nome}</span>
          </h1>
          <div className="patient-details">
            <span className="detail-item">
              <strong>CPF:</strong> {formatarCPF(paciente.cpf)}
            </span>
            <span className="detail-item">
              <strong>Nasc:</strong> {formatarData(paciente.dataNascimento)}
            </span>
            <span className="detail-item age">
              ({idade} anos)
            </span>
          </div>
        </div>

        {/* Ações do Cabeçalho */}
        <div className="header-actions">
          {/* Timer */}
          <div className="timer-display">
            <ClockIcon />
            <span id="timer">{formatTimer(timerSeconds)}</span>
          </div>

          {/* Botão Prontuário */}
          <button
            id="btnProntuario"
            className="btn-header"
            onClick={onProntuario}
            title="Abrir Prontuário"
          >
            <FileIcon />
            Prontuário
          </button>

          {/* Link Agendamento */}
          {agendamentoId && (
            <button className="btn-header btn-link">
              <LinkIcon />
              Agendamento #{agendamentoId}
            </button>
          )}

          {/* Botão Minimizar */}
          <button
            className="btn-icon"
            onClick={onMinimize}
            title="Minimizar"
          >
            <MinimizeIcon />
          </button>

          {/* Botão Fechar */}
          <button
            className="btn-icon btn-close"
            onClick={onClose}
            title="Fechar"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <style>{`
        .modal-header {
          background: linear-gradient(135deg, #1E3A5F 0%, #0056A4 100%);
          padding: 8px 24px;
          flex-shrink: 0;
          color: #FFFFFF;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .patient-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .patient-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .patient-details {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          opacity: 0.9;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .detail-item strong {
          font-weight: 500;
        }

        .age {
          opacity: 0.8;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Courier New', monospace;
        }

        .btn-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-header:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .btn-link {
          background: transparent;
          border-color: transparent;
          text-decoration: underline;
          opacity: 0.9;
        }

        .btn-link:hover {
          opacity: 1;
          background: transparent;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-close:hover {
          background: rgba(239, 68, 68, 0.8);
        }
      `}</style>
    </header>
  );
};

export default ModalHeader;
