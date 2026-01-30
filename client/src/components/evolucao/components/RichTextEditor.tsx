/**
 * ============================================================================
 * COMPONENTE: RichTextEditor
 * ============================================================================
 * Editor de texto rico com ribbon de formatação completa
 * ============================================================================
 */

import React, { useRef, useCallback } from 'react';
import { RichTextEditorProps, TipoAtendimento } from '../types';

// Template padrão de evolução médica
const TEMPLATE_PADRAO = `<p><strong>QUEIXA PRINCIPAL:</strong></p>
<p>Paciente comparece para...</p>
<br>
<p><strong>HISTÓRIA DA DOENÇA ATUAL:</strong></p>
<p>Refere que há X dias apresenta...</p>
<br>
<p><strong>EXAME FÍSICO:</strong></p>
<p>BEG, corado, hidratado, anictérico, acianótico, afebril.</p>
<p>PA: ___/___mmHg | FC: ___bpm | FR: ___irpm | Temp: ___°C | SpO2: ___%</p>
<p>ACV: RCR 2T BNF s/ sopros</p>
<p>AR: MV+ bilateral s/ RA</p>
<p>ABD: Plano, flácido, indolor, s/ VMG</p>
<br>
<p><strong>HIPÓTESE DIAGNÓSTICA:</strong></p>
<ol>
<li></li>
<li></li>
</ol>
<br>
<p><strong>CONDUTA:</strong></p>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<br>
<p>Retorno em ___ dias/semanas.</p>`;

interface RichTextEditorExtendedProps extends RichTextEditorProps {
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
  onDataHoraChange: (value: string) => void;
  onTipoChange: (value: TipoAtendimento) => void;
  onEmitDocument: () => void;
  onImportExam: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorExtendedProps> = ({
  value,
  onChange,
  placeholder = 'Digite a evolução do atendimento...',
  dataHora,
  tipoAtendimento,
  onDataHoraChange,
  onTipoChange,
  onEmitDocument,
  onImportExam,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const currentColorCommandRef = useRef<string>('');

  // Executar comando de formatação
  const execCommand = useCallback((command: string, value: string | null = null) => {
    document.execCommand(command, false, value || undefined);
    editorRef.current?.focus();
    
    // Atualizar valor
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Transformar maiúsculas/minúsculas
  const transformCase = useCallback((type: 'upper' | 'lower') => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.toString();
      const newText = type === 'upper' ? text.toUpperCase() : text.toLowerCase();
      document.execCommand('insertText', false, newText);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [onChange]);

  // Definir espaçamento entre linhas
  const setLineHeight = useCallback((lineHeight: string) => {
    if (editorRef.current) {
      editorRef.current.style.lineHeight = lineHeight;
    }
  }, []);

  // Mostrar color picker
  const showColorPicker = useCallback((command: string) => {
    currentColorCommandRef.current = command;
    colorPickerRef.current?.click();
  }, []);

  // Aplicar cor
  const applyColor = useCallback((color: string) => {
    if (currentColorCommandRef.current) {
      execCommand(currentColorCommandRef.current, color);
    }
  }, [execCommand]);

  // Inserir tabela
  const insertTable = useCallback(() => {
    const rows = prompt('Número de linhas:', '3');
    const cols = prompt('Número de colunas:', '3');
    
    if (!rows || !cols) return;
    
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 8px 0;"><tbody>';
    for (let i = 0; i < parseInt(rows); i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        const cellStyle = 'border: 1px solid #D1D5DB; padding: 8px; text-align: left;';
        tableHTML += i === 0 
          ? `<th style="${cellStyle} background: #F3F4F6; font-weight: 600;">&nbsp;</th>` 
          : `<td style="${cellStyle}">&nbsp;</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p></p>';
    
    document.execCommand('insertHTML', false, tableHTML);
    
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Inserir template padrão
  const insertTemplate = useCallback(() => {
    if (editorRef.current && editorRef.current.innerHTML.trim() !== '') {
      if (!confirm('O campo já contém texto. Deseja substituir pelo texto padrão?')) {
        return;
      }
    }
    
    if (editorRef.current) {
      editorRef.current.innerHTML = TEMPLATE_PADRAO;
      onChange(TEMPLATE_PADRAO);
      editorRef.current.focus();
    }
  }, [onChange]);

  // Handler de input
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="rich-text-editor">
      {/* Barra de Ferramentas Superior */}
      <div className="toolbar-top">
        <div className="toolbar-section">
          <label className="toolbar-label">DATA/HORA</label>
          <input
            type="datetime-local"
            id="dataEvolucao"
            className="toolbar-input"
            value={dataHora}
            onChange={(e) => onDataHoraChange(e.target.value)}
          />
        </div>
        <div className="toolbar-section">
          <label className="toolbar-label">TIPO</label>
          <select
            id="tipoAtendimento"
            className="toolbar-select"
            value={tipoAtendimento}
            onChange={(e) => onTipoChange(e.target.value as TipoAtendimento)}
          >
            <option value="consulta">Consulta</option>
            <option value="retorno">Retorno</option>
            <option value="urgencia">Urgência</option>
            <option value="teleconsulta">Teleconsulta</option>
          </select>
        </div>
      </div>

      {/* Ribbon de Formatação */}
      <div className="formatting-ribbon">
        {/* Fonte e Tamanho */}
        <div className="ribbon-group">
          <select
            className="ribbon-select"
            onChange={(e) => execCommand('fontName', e.target.value)}
            defaultValue="Inter"
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
          <select
            className="ribbon-select ribbon-select-small"
            onChange={(e) => execCommand('fontSize', e.target.value)}
            defaultValue="3"
          >
            <option value="1">8</option>
            <option value="2">10</option>
            <option value="3">12</option>
            <option value="4">14</option>
            <option value="5">18</option>
            <option value="6">24</option>
            <option value="7">36</option>
          </select>
        </div>

        <div className="ribbon-divider" />

        {/* Formatação Básica */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => execCommand('bold')} title="Negrito (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('italic')} title="Itálico (Ctrl+I)">
            <em>I</em>
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('underline')} title="Sublinhado (Ctrl+U)">
            <u>U</u>
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('strikeThrough')} title="Tachado">
            <s>S</s>
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('superscript')} title="Sobrescrito">
            x<sup>2</sup>
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('subscript')} title="Subscrito">
            x<sub>2</sub>
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Maiúsculas/Minúsculas */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => transformCase('upper')} title="MAIÚSCULAS">
            AA
          </button>
          <button className="ribbon-btn" onClick={() => transformCase('lower')} title="minúsculas">
            aa
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Listas */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => execCommand('insertUnorderedList')} title="Lista com marcadores">
            ☰
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
            1.
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Alinhamento */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => execCommand('justifyLeft')} title="Alinhar à esquerda">
            ≡
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('justifyCenter')} title="Centralizar">
            ≡
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('justifyRight')} title="Alinhar à direita">
            ≡
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('justifyFull')} title="Justificar">
            ≡
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Recuo */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => execCommand('outdent')} title="Diminuir recuo">
            ←
          </button>
          <button className="ribbon-btn" onClick={() => execCommand('indent')} title="Aumentar recuo">
            →
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Espaçamento */}
        <div className="ribbon-group">
          <select
            className="ribbon-select ribbon-select-small"
            onChange={(e) => setLineHeight(e.target.value)}
            defaultValue="1.5"
            title="Espaçamento entre linhas"
          >
            <option value="1">1.0</option>
            <option value="1.5">1.5</option>
            <option value="2">2.0</option>
            <option value="2.5">2.5</option>
          </select>
        </div>

        <div className="ribbon-divider" />

        {/* Cores */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={() => showColorPicker('foreColor')} title="Cor do texto">
            A<span style={{ borderBottom: '3px solid #EF4444' }} />
          </button>
          <button className="ribbon-btn" onClick={() => showColorPicker('hiliteColor')} title="Cor de destaque">
            <span style={{ background: '#FBBF24', padding: '0 4px' }}>A</span>
          </button>
          <input
            ref={colorPickerRef}
            type="color"
            style={{ display: 'none' }}
            onChange={(e) => applyColor(e.target.value)}
          />
        </div>

        <div className="ribbon-divider" />

        {/* Tabela */}
        <div className="ribbon-group">
          <button className="ribbon-btn" onClick={insertTable} title="Inserir tabela">
            ⊞
          </button>
        </div>

        <div className="ribbon-divider" />

        {/* Template */}
        <div className="ribbon-group">
          <button className="ribbon-btn ribbon-btn-text" onClick={insertTemplate} title="Inserir Texto Padrão">
            📄 Texto Padrão
          </button>
        </div>
      </div>

      {/* Área de Edição */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        dir="ltr"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      {/* Barra de Ações */}
      <div className="editor-actions">
        <button className="btn-action" onClick={onEmitDocument}>
          📄 Emitir Documento
        </button>
        <button className="btn-action" onClick={onImportExam}>
          📥 Importar Resultado de Exame
        </button>
      </div>

      <style>{`
        .rich-text-editor {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .toolbar-top {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 16px;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbar-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .toolbar-input,
        .toolbar-select {
          padding: 6px 10px;
          border: 1px solid #D1D5DB;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          background: #FFFFFF;
        }

        .toolbar-input:focus,
        .toolbar-select:focus {
          outline: none;
          border-color: #0056A4;
          box-shadow: 0 0 0 2px rgba(0, 86, 164, 0.1);
        }

        .formatting-ribbon {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #E5E7EB;
          flex-wrap: wrap;
        }

        .ribbon-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .ribbon-divider {
          width: 1px;
          height: 24px;
          background: #E5E7EB;
          margin: 0 4px;
        }

        .ribbon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ribbon-btn:hover {
          background: #F3F4F6;
          border-color: #D1D5DB;
        }

        .ribbon-btn-text {
          padding: 0 10px;
          font-size: 12px;
        }

        .ribbon-select {
          padding: 4px 8px;
          border: 1px solid #D1D5DB;
          border-radius: 4px;
          font-size: 12px;
          background: #FFFFFF;
          cursor: pointer;
        }

        .ribbon-select-small {
          width: 60px;
        }

        .editor-content {
          flex: 1;
          padding: 16px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          margin: 12px 16px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
          min-height: 300px;
          /* Forçar direção LTR para evitar bug de texto espelhado/RTL */
          direction: ltr !important;
          unicode-bidi: normal !important;
          text-align: left;
        }

        .editor-content:focus {
          outline: none;
          border-color: #0056A4;
          box-shadow: 0 0 0 3px rgba(0, 86, 164, 0.1);
        }

        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }

        .editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
        }

        .editor-content th,
        .editor-content td {
          border: 1px solid #D1D5DB;
          padding: 8px;
          text-align: left;
        }

        .editor-content th {
          background: #F3F4F6;
          font-weight: 600;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
          padding: 0 16px 12px;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action:hover {
          background: #F3F4F6;
          border-color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
