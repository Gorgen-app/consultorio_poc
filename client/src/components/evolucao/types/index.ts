/**
 * ============================================================================
 * TIPOS TYPESCRIPT - MODAL DE EVOLUÇÃO v4
 * ============================================================================
 * Sistema Gorgen - Módulo de Prontuário Eletrônico
 * Versão: 4.0.0
 * Data: 29/01/2026
 * ============================================================================
 */

// ============================================================================
// TIPOS DE PACIENTE
// ============================================================================

export interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  idade?: number;
  convenio?: string;
  telefone?: string;
  email?: string;
}

// ============================================================================
// TIPOS DE EVOLUÇÃO
// ============================================================================

export interface Evolucao {
  id?: number;
  pacienteId: number;
  agendamentoId?: number;
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
  conteudo: string;
  status: StatusEvolucao;
  tempoConsulta?: number; // em segundos
  assinada: boolean;
  dataAssinatura?: string;
  medicoId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TipoAtendimento = 'consulta' | 'retorno' | 'urgencia' | 'teleconsulta';

export type StatusEvolucao = 'rascunho' | 'salva' | 'assinada' | 'encerrada';

// ============================================================================
// TIPOS DE DOCUMENTO
// ============================================================================

export interface Documento {
  id: number;
  evolucaoId?: number;
  pacienteId: number;
  nome: string;
  tipo: TipoDocumento;
  url: string;
  tamanho: number;
  uploadedAt: string;
}

export type TipoDocumento = 'exame' | 'laudo' | 'receita' | 'atestado' | 'outro';

export interface DocumentoPendente {
  id: number;
  pacienteNome: string;
  tipo: string;
  dataAbertura: string;
  tempoAberto: number; // em segundos
}

// ============================================================================
// TIPOS DE HISTÓRICO
// ============================================================================

export interface HistoricoEvolucao {
  id: number;
  data: string;
  tipo: TipoAtendimento;
  resumo: string;
  medicoNome?: string;
}

// ============================================================================
// TIPOS DE JANELA MINIMIZADA
// ============================================================================

export interface JanelaMinimizada {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  conteudo: string;
  timerSeconds: number;
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
}

// ============================================================================
// TIPOS DE ESTADO DO MODAL
// ============================================================================

export interface ModalEvolucaoState {
  isOpen: boolean;
  isMinimized: boolean;
  paciente: Paciente | null;
  evolucao: Evolucao | null;
  timerSeconds: number;
  isDirty: boolean;
  isSaving: boolean;
  isSigning: boolean;
}

// ============================================================================
// TIPOS DE PROPS DOS COMPONENTES
// ============================================================================

export interface ModalEvolucaoProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: (janela: JanelaMinimizada) => void;
  paciente: Paciente;
  agendamentoId?: number;
  evolucaoExistente?: Evolucao;
}

export interface ModalHeaderProps {
  paciente: Paciente;
  timerSeconds: number;
  agendamentoId?: number;
  onProntuario: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface SidePanelsProps {
  pacienteId: number;
  historico: HistoricoEvolucao[];
  documentos: Documento[];
  onUpload: (files: FileList) => void;
  onHistoricoClick: (evolucaoId: number) => void;
}

export interface ModalFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  isSigning: boolean;
  onCancel: () => void;
  onSaveAndExit: () => void;
  onSave: () => void;
  onSign: () => void;
  onSignAndFinish: () => void;
}

export interface MinimizedBarProps {
  janelas: JanelaMinimizada[];
  onRestore: (id: number) => void;
  onClose: (id: number) => void;
}

export interface NotificationDropdownProps {
  pendentes: DocumentoPendente[];
  onViewAll: () => void;
  onItemClick: (id: number) => void;
}

// ============================================================================
// TIPOS DE RESULTADO DE EXAME
// ============================================================================

export interface ResultadoExame {
  exame: string;
  resultado: string;
  referencia: string;
  data: string;
  unidade?: string;
  status?: 'normal' | 'alterado' | 'critico';
}

export interface TabelaExames {
  pacienteId: number;
  dataExtracao: string;
  resultados: ResultadoExame[];
}

// ============================================================================
// TIPOS DE TEMPLATE
// ============================================================================

export interface TemplateEvolucao {
  id: number;
  nome: string;
  conteudo: string;
  tipoAtendimento?: TipoAtendimento;
  isDefault?: boolean;
}

// ============================================================================
// TIPOS DE TOAST/NOTIFICAÇÃO
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
