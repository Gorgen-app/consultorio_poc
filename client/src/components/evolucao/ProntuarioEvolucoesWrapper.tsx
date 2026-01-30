/**
 * ============================================================================
 * COMPONENTE: ProntuarioEvolucoesWrapper
 * ============================================================================
 * 
 * Wrapper que decide qual versão do componente de evoluções usar com base
 * na feature flag NOVO_MODAL_EVOLUCAO.
 * 
 * Este componente deve ser usado no lugar do ProntuarioEvolucoes original
 * para permitir a substituição gradual e controlada.
 * 
 * ============================================================================
 */

import React from 'react';
import { isFeatureEnabled, FEATURES } from '@/lib/featureFlags';
import { ProntuarioEvolucoesV4 } from './ProntuarioEvolucoesV4';

// Importar o componente antigo (lazy loading para não carregar se não for usado)
const ProntuarioEvolucoesLegacy = React.lazy(() => 
  import('@/components/prontuario/ProntuarioEvolucoes')
);

interface ProntuarioEvolucoesWrapperProps {
  pacienteId: number;
  pacienteNome: string;
  pacienteCpf?: string;
  pacienteDataNascimento?: string;
  agendamentoId?: number;
  // Props do componente legado
  evolucoes?: any[];
  onUpdate?: () => void;
  abrirNovaEvolucao?: boolean;
  agendamentoIdVinculado?: number | null;
  onEvolucaoCriada?: () => void;
  onAtendimentoEncerrado?: () => void;
  paciente?: any;
}

export function ProntuarioEvolucoesWrapper(props: ProntuarioEvolucoesWrapperProps) {
  const useNewModal = isFeatureEnabled(FEATURES.NOVO_MODAL_EVOLUCAO);
  
  if (useNewModal) {
    return (
      <ProntuarioEvolucoesV4
        pacienteId={props.pacienteId}
        pacienteNome={props.pacienteNome}
        pacienteCpf={props.pacienteCpf || props.paciente?.cpf || ''}
        pacienteDataNascimento={props.pacienteDataNascimento || props.paciente?.dataNascimento || ''}
        agendamentoId={props.agendamentoId}
      />
    );
  }
  
  // Fallback para o componente legado
  // Garantir que props obrigatórias tenham valores padrão
  const legacyProps = {
    ...props,
    evolucoes: props.evolucoes || [],
    onUpdate: props.onUpdate || (() => {}),
  };
  
  return (
    <React.Suspense fallback={<div className="p-4">Carregando...</div>}>
      <ProntuarioEvolucoesLegacy {...legacyProps} />
    </React.Suspense>
  );
}

export default ProntuarioEvolucoesWrapper;
