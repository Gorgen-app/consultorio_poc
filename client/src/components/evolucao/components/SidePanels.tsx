/**
 * ============================================================================
 * COMPONENTE: SidePanels
 * ============================================================================
 * Painéis laterais com Documentos e Histórico Recente
 * ============================================================================
 */

import React, { useRef, useState, useCallback } from 'react';
import { SidePanelsProps, Documento, HistoricoEvolucao } from '../types';

// Ícones
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Formatar data
const formatarData = (data: string): string => {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// Formatar tamanho de arquivo
const formatarTamanho = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Componente de Upload
const UploadArea: React.FC<{ onUpload: (files: FileList) => void }> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  }, [onUpload]);

  return (
    <div
      className={`upload-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <UploadIcon />
      <span className="upload-text">Arraste arquivos aqui</span>
      <span className="upload-subtext">ou clique para selecionar</span>
    </div>
  );
};

// Componente de Lista de Documentos
const DocumentosList: React.FC<{ documentos: Documento[]; onRemove: (id: number) => void }> = ({
  documentos,
  onRemove,
}) => {
  if (documentos.length === 0) return null;

  return (
    <div className="documentos-list">
      {documentos.map((doc) => (
        <div key={doc.id} className="documento-item">
          <FileIcon />
          <div className="documento-info">
            <span className="documento-nome">{doc.nome}</span>
            <span className="documento-meta">{formatarTamanho(doc.tamanho)}</span>
          </div>
          <button className="btn-remove" onClick={() => onRemove(doc.id)} title="Remover">
            <TrashIcon />
          </button>
        </div>
      ))}
    </div>
  );
};

// Componente de Histórico
const HistoricoList: React.FC<{
  historico: HistoricoEvolucao[];
  onItemClick: (id: number) => void;
}> = ({ historico, onItemClick }) => {
  if (historico.length === 0) {
    return <p className="empty-text">Nenhuma evolução anterior</p>;
  }

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      consulta: 'Consulta',
      retorno: 'Retorno',
      urgencia: 'Urgência',
      teleconsulta: 'Teleconsulta',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="historico-list">
      {historico.map((item) => (
        <div key={item.id} className="historico-item" onClick={() => onItemClick(item.id)}>
          <div className="historico-header">
            <span className="historico-data">{formatarData(item.data)}</span>
            <span className="historico-tipo">{getTipoLabel(item.tipo)}</span>
          </div>
          <p className="historico-resumo">{item.resumo}</p>
        </div>
      ))}
    </div>
  );
};

export const SidePanels: React.FC<SidePanelsProps> = ({
  pacienteId,
  historico,
  documentos,
  onUpload,
  onHistoricoClick,
}) => {
  const [localDocumentos, setLocalDocumentos] = useState<Documento[]>(documentos);

  const handleRemoveDocumento = useCallback((id: number) => {
    setLocalDocumentos((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const handleUpload = useCallback((files: FileList) => {
    // Criar documentos a partir dos arquivos
    const novosDocumentos: Documento[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      pacienteId,
      nome: file.name,
      tipo: 'outro',
      url: URL.createObjectURL(file),
      tamanho: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    setLocalDocumentos((prev) => [...prev, ...novosDocumentos]);
    onUpload(files);
  }, [pacienteId, onUpload]);

  return (
    <aside className="side-panels">
      {/* Painel de Documentos */}
      <section className="panel panel-documentos">
        <h3 className="panel-title">DOCUMENTOS</h3>
        <UploadArea onUpload={handleUpload} />
        <DocumentosList documentos={localDocumentos} onRemove={handleRemoveDocumento} />
      </section>

      {/* Painel de Histórico */}
      <section className="panel panel-historico">
        <h3 className="panel-title">HISTÓRICO RECENTE</h3>
        <HistoricoList historico={historico} onItemClick={onHistoricoClick} />
      </section>

      <style>{`
        .side-panels {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: #F9FAFB;
          border-left: 1px solid #E5E7EB;
          width: 280px;
          min-width: 280px;
          overflow-y: auto;
        }

        .panel {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px;
        }

        .panel-title {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 2px dashed #D1D5DB;
          border-radius: 8px;
          background: #F9FAFB;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-area:hover,
        .upload-area.dragging {
          border-color: #0056A4;
          background: rgba(0, 86, 164, 0.05);
        }

        .upload-area svg {
          color: #9CA3AF;
          margin-bottom: 8px;
        }

        .upload-text {
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }

        .upload-subtext {
          font-size: 12px;
          color: #0056A4;
          margin-top: 4px;
        }

        .documentos-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .documento-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #F9FAFB;
          border-radius: 6px;
        }

        .documento-item svg {
          color: #6B7280;
          flex-shrink: 0;
        }

        .documento-info {
          flex: 1;
          min-width: 0;
        }

        .documento-nome {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .documento-meta {
          font-size: 11px;
          color: #9CA3AF;
        }

        .btn-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-remove:hover {
          background: #FEE2E2;
          color: #EF4444;
        }

        .empty-text {
          font-size: 13px;
          color: #9CA3AF;
          text-align: center;
          padding: 16px;
        }

        .historico-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .historico-item {
          padding: 10px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .historico-item:hover {
          border-color: #0056A4;
          background: rgba(0, 86, 164, 0.02);
        }

        .historico-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .historico-data {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .historico-tipo {
          font-size: 10px;
          font-weight: 500;
          color: #6B7280;
          padding: 2px 6px;
          background: #E5E7EB;
          border-radius: 4px;
        }

        .historico-resumo {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </aside>
  );
};

export default SidePanels;
