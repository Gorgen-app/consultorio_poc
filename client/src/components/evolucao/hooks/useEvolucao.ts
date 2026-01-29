/**
 * ============================================================================
 * HOOK: useEvolucao
 * ============================================================================
 * Gerencia o estado e operações da evolução médica
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { Evolucao, TipoAtendimento, StatusEvolucao } from '../types';

interface UseEvolucaoReturn {
  evolucao: Evolucao | null;
  conteudo: string;
  tipoAtendimento: TipoAtendimento;
  dataHora: string;
  isDirty: boolean;
  isSaving: boolean;
  isSigning: boolean;
  setConteudo: (conteudo: string) => void;
  setTipoAtendimento: (tipo: TipoAtendimento) => void;
  setDataHora: (dataHora: string) => void;
  salvar: () => Promise<boolean>;
  salvarESair: () => Promise<boolean>;
  assinar: () => Promise<boolean>;
  assinarEEncerrar: () => Promise<boolean>;
  resetar: () => void;
}

interface UseEvolucaoOptions {
  pacienteId: number;
  agendamentoId?: number;
  evolucaoExistente?: Evolucao;
  onSaveSuccess?: () => void;
  onSignSuccess?: () => void;
}

export function useEvolucao(options: UseEvolucaoOptions): UseEvolucaoReturn {
  const { pacienteId, agendamentoId, evolucaoExistente, onSaveSuccess, onSignSuccess } = options;

  // Estado inicial
  const [evolucao, setEvolucao] = useState<Evolucao | null>(evolucaoExistente || null);
  const [conteudo, setConteudoState] = useState(evolucaoExistente?.conteudo || '');
  const [tipoAtendimento, setTipoAtendimentoState] = useState<TipoAtendimento>(
    evolucaoExistente?.tipoAtendimento || 'consulta'
  );
  const [dataHora, setDataHoraState] = useState(() => {
    if (evolucaoExistente?.dataHora) {
      return evolucaoExistente.dataHora;
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Setters com marcação de dirty
  const setConteudo = useCallback((novoConteudo: string) => {
    setConteudoState(novoConteudo);
    setIsDirty(true);
  }, []);

  const setTipoAtendimento = useCallback((tipo: TipoAtendimento) => {
    setTipoAtendimentoState(tipo);
    setIsDirty(true);
  }, []);

  const setDataHora = useCallback((novaDataHora: string) => {
    setDataHoraState(novaDataHora);
    setIsDirty(true);
  }, []);

  // Salvar evolução
  const salvar = useCallback(async (): Promise<boolean> => {
    if (!conteudo.trim()) {
      return false;
    }

    setIsSaving(true);
    try {
      // TODO: Implementar chamada de API real
      // const response = await api.post('/evolucoes', { ... });
      
      // Simulação de salvamento
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const novaEvolucao: Evolucao = {
        id: evolucao?.id || Date.now(),
        pacienteId,
        agendamentoId,
        dataHora,
        tipoAtendimento,
        conteudo,
        status: 'salva',
        assinada: false,
      };
      
      setEvolucao(novaEvolucao);
      setIsDirty(false);
      onSaveSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [conteudo, evolucao, pacienteId, agendamentoId, dataHora, tipoAtendimento, onSaveSuccess]);

  // Salvar e sair
  const salvarESair = useCallback(async (): Promise<boolean> => {
    const sucesso = await salvar();
    return sucesso;
  }, [salvar]);

  // Assinar evolução
  const assinar = useCallback(async (): Promise<boolean> => {
    if (!conteudo.trim()) {
      return false;
    }

    setIsSigning(true);
    try {
      // TODO: Implementar chamada de API real para assinatura digital
      // const response = await api.post('/evolucoes/assinar', { ... });
      
      // Simulação de assinatura
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const evolucaoAssinada: Evolucao = {
        ...evolucao!,
        id: evolucao?.id || Date.now(),
        pacienteId,
        agendamentoId,
        dataHora,
        tipoAtendimento,
        conteudo,
        status: 'assinada',
        assinada: true,
        dataAssinatura: new Date().toISOString(),
      };
      
      setEvolucao(evolucaoAssinada);
      setIsDirty(false);
      onSignSuccess?.();
      return true;
    } catch (error) {
      console.error('Erro ao assinar evolução:', error);
      return false;
    } finally {
      setIsSigning(false);
    }
  }, [conteudo, evolucao, pacienteId, agendamentoId, dataHora, tipoAtendimento, onSignSuccess]);

  // Assinar e encerrar
  const assinarEEncerrar = useCallback(async (): Promise<boolean> => {
    const sucesso = await assinar();
    if (sucesso && evolucao) {
      setEvolucao({ ...evolucao, status: 'encerrada' });
    }
    return sucesso;
  }, [assinar, evolucao]);

  // Resetar estado
  const resetar = useCallback(() => {
    setEvolucao(null);
    setConteudoState('');
    setTipoAtendimentoState('consulta');
    setDataHoraState(
      new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
    setIsDirty(false);
  }, []);

  return {
    evolucao,
    conteudo,
    tipoAtendimento,
    dataHora,
    isDirty,
    isSaving,
    isSigning,
    setConteudo,
    setTipoAtendimento,
    setDataHora,
    salvar,
    salvarESair,
    assinar,
    assinarEEncerrar,
    resetar,
  };
}

export default useEvolucao;
