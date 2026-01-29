/**
 * ============================================================================
 * COMPONENTE: ModalEvolucao
 * ============================================================================
 * Modal principal de evolução médica - Orquestrador de todos os subcomponentes
 * ============================================================================
 * 
 * Este componente é o container principal que coordena:
 * - ModalHeader: Cabeçalho com informações do paciente e controles
 * - RichTextEditor: Editor de texto rico com ribbon de formatação
 * - SidePanels: Painéis laterais de documentos e histórico
 * - ModalFooter: Rodapé com botões de ação
 * 
 * ============================================================================
 */

import React, { useEffect, useCallback, useState } from 'react';
import { ModalEvolucaoProps, HistoricoEvolucao, Documento, JanelaMinimizada, TipoAtendimento } from '../types';
import { useTimer, useEvolucao } from '../hooks';
import ModalHeader from './ModalHeader';
import RichTextEditor from './RichTextEditor';
import SidePanels from './SidePanels';
import ModalFooter from './ModalFooter';

// Dados simulados de histórico
const HISTORICO_MOCK: HistoricoEvolucao[] = [
  {
    id: 1,
    data: '2026-01-15',
    tipo: 'consulta',
    resumo: 'Paciente retorna para acompanhamento de hipertensão arterial...',
  },
  {
    id: 2,
    data: '2025-12-08',
    tipo: 'retorno',
    resumo: 'Avaliação de exames laboratoriais. Glicemia de jejum...',
  },
  {
    id: 3,
    data: '2025-11-22',
    tipo: 'consulta',
    resumo: 'Primeira consulta. Paciente encaminhado para avaliação...',
  },
];

export const ModalEvolucao: React.FC<ModalEvolucaoProps> = ({
  isOpen,
  onClose,
  onMinimize,
  paciente,
  agendamentoId,
  evolucaoExistente,
}) => {
  // Hooks customizados
  const timer = useTimer(0);
  const evolucao = useEvolucao({
    pacienteId: paciente.id,
    agendamentoId,
    evolucaoExistente,
    onSaveSuccess: () => showToast('Evolução salva com sucesso!', 'success'),
    onSignSuccess: () => showToast('Evolução assinada com sucesso!', 'success'),
  });

  // Estado local
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // Mostrar toast
  const showToast = useCallback((message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Iniciar timer ao abrir
  useEffect(() => {
    if (isOpen) {
      timer.start();
    } else {
      timer.stop();
    }
  }, [isOpen]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl+S: Salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        evolucao.salvar();
      }

      // Ctrl+Enter: Assinar e Encerrar
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSignAndFinish();
      }

      // Escape: Fechar
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, evolucao]);

  // Handler de fechar
  const handleClose = useCallback(() => {
    if (evolucao.isDirty) {
      if (!confirm('Existem alterações não salvas. Deseja realmente fechar?')) {
        return;
      }
    }
    timer.stop();
    onClose();
  }, [evolucao.isDirty, timer, onClose]);

  // Handler de minimizar
  const handleMinimize = useCallback(() => {
    const janela: JanelaMinimizada = {
      id: Date.now(),
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
      conteudo: evolucao.conteudo,
      timerSeconds: timer.seconds,
      dataHora: evolucao.dataHora,
      tipoAtendimento: evolucao.tipoAtendimento,
    };
    timer.stop();
    onMinimize(janela);
  }, [paciente, evolucao, timer, onMinimize]);

  // Handler de prontuário
  const handleProntuario = useCallback(() => {
    // TODO: Navegar para o prontuário do paciente
    window.open(`/prontuario/${paciente.id}`, '_blank');
  }, [paciente.id]);

  // Handler de salvar e sair
  const handleSaveAndExit = useCallback(async () => {
    const sucesso = await evolucao.salvarESair();
    if (sucesso) {
      timer.stop();
      onClose();
    }
  }, [evolucao, timer, onClose]);

  // Handler de assinar e encerrar
  const handleSignAndFinish = useCallback(async () => {
    const sucesso = await evolucao.assinarEEncerrar();
    if (sucesso) {
      timer.stop();
      onClose();
    }
  }, [evolucao, timer, onClose]);

  // Handler de upload
  const handleUpload = useCallback((files: FileList) => {
    // TODO: Implementar upload real
    showToast(`${files.length} arquivo(s) enviado(s)`, 'success');
  }, [showToast]);

  // Handler de histórico
  const handleHistoricoClick = useCallback((evolucaoId: number) => {
    // TODO: Abrir evolução anterior
    console.log('Abrir evolução:', evolucaoId);
  }, []);

  // Handler de emitir documento
  const handleEmitDocument = useCallback(() => {
    // TODO: Abrir modal de emissão de documento
    console.log('Emitir documento');
  }, []);

  // Handler de importar exame
  const handleImportExam = useCallback(() => {
    // TODO: Integrar com módulo de extração de exames
    const tabelaExemplo = `
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #D1D5DB; padding: 8px; background: #F3F4F6; text-align: left;">Exame</th>
      <th style="border: 1px solid #D1D5DB; padding: 8px; background: #F3F4F6; text-align: left;">Resultado</th>
      <th style="border: 1px solid #D1D5DB; padding: 8px; background: #F3F4F6; text-align: left;">Referência</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">Glicemia de Jejum</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">98 mg/dL</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">70-99 mg/dL</td>
    </tr>
    <tr>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">Hemoglobina Glicada</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">5.6%</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">&lt;5.7%</td>
    </tr>
    <tr>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">Colesterol Total</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">185 mg/dL</td>
      <td style="border: 1px solid #D1D5DB; padding: 8px;">&lt;200 mg/dL</td>
    </tr>
  </tbody>
</table>
`;
    evolucao.setConteudo(evolucao.conteudo + tabelaExemplo);
    showToast('Tabela de exames inserida', 'success');
  }, [evolucao, showToast]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Cabeçalho */}
        <ModalHeader
          paciente={paciente}
          timerSeconds={timer.seconds}
          agendamentoId={agendamentoId}
          onProntuario={handleProntuario}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />

        {/* Corpo do Modal */}
        <div className="modal-body">
          {/* Área Principal - Editor */}
          <main className="main-content">
            <RichTextEditor
              value={evolucao.conteudo}
              onChange={evolucao.setConteudo}
              placeholder="Digite a evolução do atendimento..."
              dataHora={evolucao.dataHora}
              tipoAtendimento={evolucao.tipoAtendimento}
              onDataHoraChange={evolucao.setDataHora}
              onTipoChange={evolucao.setTipoAtendimento}
              onEmitDocument={handleEmitDocument}
              onImportExam={handleImportExam}
            />
          </main>

          {/* Painéis Laterais */}
          <SidePanels
            pacienteId={paciente.id}
            historico={HISTORICO_MOCK}
            documentos={documentos}
            onUpload={handleUpload}
            onHistoricoClick={handleHistoricoClick}
          />
        </div>

        {/* Rodapé */}
        <ModalFooter
          isDirty={evolucao.isDirty}
          isSaving={evolucao.isSaving}
          isSigning={evolucao.isSigning}
          onCancel={handleClose}
          onSaveAndExit={handleSaveAndExit}
          onSave={evolucao.salvar}
          onSign={evolucao.assinar}
          onSignAndFinish={handleSignAndFinish}
        />

        {/* Toast */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .modal-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1400px;
          height: 90vh;
          max-height: 900px;
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .modal-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          z-index: 1002;
          animation: slideUp 0.3s ease;
        }

        .toast-success {
          background: #10B981;
        }

        .toast-error {
          background: #EF4444;
        }

        .toast-warning {
          background: #F59E0B;
        }

        .toast-info {
          background: #0056A4;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .modal-container {
            max-width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-body {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ModalEvolucao;
