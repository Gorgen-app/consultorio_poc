/**
 * ============================================================================
 * MÓDULO DE EVOLUÇÃO - GORGEN
 * ============================================================================
 * 
 * Este módulo contém todos os componentes, hooks e tipos necessários para
 * o modal de evolução médica do sistema Gorgen.
 * 
 * ESTRUTURA:
 * - components/  : Componentes React do modal
 * - hooks/       : Hooks customizados para lógica de negócio
 * - types/       : Definições de tipos TypeScript
 * - utils/       : Funções utilitárias
 * 
 * USO:
 * import { ModalEvolucao, useTimer, Paciente } from '@/components/evolucao';
 * 
 * ============================================================================
 */

// Componentes
export {
  ModalEvolucao,
  ModalHeader,
  RichTextEditor,
  SidePanels,
  ModalFooter,
  MinimizedBar,
  NotificationDropdown,
  ModalSelecionarExame,
} from './components';

// Componente Principal Integrado
export { ProntuarioEvolucoesV4 } from './ProntuarioEvolucoesV4';

// Wrapper com Feature Flag
export { ProntuarioEvolucoesWrapper } from './ProntuarioEvolucoesWrapper';

// Hooks
export {
  useTimer,
  useEvolucao,
  useMinimizedWindows,
  usePendingDocuments,
} from './hooks';

// Tipos
export type {
  Paciente,
  Evolucao,
  TipoAtendimento,
  StatusEvolucao,
  Documento,
  TipoDocumento,
  DocumentoPendente,
  HistoricoEvolucao,
  JanelaMinimizada,
  ModalEvolucaoState,
  ModalEvolucaoProps,
  ModalHeaderProps,
  RichTextEditorProps,
  SidePanelsProps,
  ModalFooterProps,
  MinimizedBarProps,
  NotificationDropdownProps,
  ResultadoExame,
  TabelaExames,
  TemplateEvolucao,
  ToastType,
  Toast,
} from './types';
