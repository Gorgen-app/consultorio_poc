/**
 * ============================================================================
 * HOOK: useEvolucao
 * ============================================================================
 * Gerencia o estado e operações da evolução médica
 * Integrado com API real via tRPC
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Evolucao, TipoAtendimento } from '../types';

interface UseEvolucaoReturn {
  evolucao: Evolucao | null;
  conteudo: string;
  tipoAtendimento: TipoAtendimento;
  dataHora: string;
  isDirty: boolean;
  isSaving: boolean;
  isSigning: boolean;
  error: string | null;
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
  onClose?: () => void;
}

// Mapear tipo de atendimento do frontend para o backend
const mapTipoAtendimento = (tipo: TipoAtendimento): "Consulta" | "Retorno" | "Urgência" | "Teleconsulta" | "Parecer" => {
  const mapa: Record<TipoAtendimento, "Consulta" | "Retorno" | "Urgência" | "Teleconsulta" | "Parecer"> = {
    consulta: 'Consulta',
    retorno: 'Retorno',
    urgencia: 'Urgência',
    teleconsulta: 'Teleconsulta',
  };
  return mapa[tipo] || 'Consulta';
};

export function useEvolucao(options: UseEvolucaoOptions): UseEvolucaoReturn {
  const { pacienteId, agendamentoId, evolucaoExistente, onSaveSuccess, onSignSuccess, onClose } = options;

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
  const [error, setError] = useState<string | null>(null);

  // Mutations tRPC
  const createMutation = trpc.prontuario.evolucoes.create.useMutation();
  const updateMutation = trpc.prontuario.evolucoes.update.useMutation();
  const assinarMutation = trpc.prontuario.evolucoes.assinar.useMutation();

  // Setters com marcação de dirty
  const setConteudo = useCallback((novoConteudo: string) => {
    setConteudoState(novoConteudo);
    setIsDirty(true);
    setError(null);
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
      setError('O conteúdo da evolução não pode estar vazio.');
      return false;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const dataEvolucao = new Date(dataHora);
      
      if (evolucao?.id) {
        // Atualizar evolução existente
        await updateMutation.mutateAsync({
          id: evolucao.id,
          subjetivo: conteudo, // Usando subjetivo para texto livre
        });
      } else {
        // Criar nova evolução
        const novaEvolucao = await createMutation.mutateAsync({
          pacienteId,
          agendamentoId: agendamentoId || null,
          dataEvolucao,
          tipo: mapTipoAtendimento(tipoAtendimento),
          subjetivo: conteudo, // Usando subjetivo para texto livre
          statusAssinatura: 'rascunho',
          assinado: false,
          atendimentoEncerrado: false,
        });
        
        setEvolucao({
          id: novaEvolucao.id,
          pacienteId,
          agendamentoId,
          dataHora,
          tipoAtendimento,
          conteudo,
          status: 'salva',
          assinada: false,
        });
      }
      
      setIsDirty(false);
      onSaveSuccess?.();
      return true;
    } catch (err) {
      console.error('Erro ao salvar evolução:', err);
      setError('Erro ao salvar evolução. Tente novamente.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [conteudo, evolucao, pacienteId, agendamentoId, dataHora, tipoAtendimento, createMutation, updateMutation, onSaveSuccess]);

  // Salvar e sair
  const salvarESair = useCallback(async (): Promise<boolean> => {
    const sucesso = await salvar();
    if (sucesso) {
      onClose?.();
    }
    return sucesso;
  }, [salvar, onClose]);

  // Assinar evolução
  const assinar = useCallback(async (): Promise<boolean> => {
    if (!conteudo.trim()) {
      setError('O conteúdo da evolução não pode estar vazio.');
      return false;
    }

    setIsSigning(true);
    setError(null);
    
    try {
      // Primeiro salvar se houver alterações
      if (isDirty || !evolucao?.id) {
        const salvou = await salvar();
        if (!salvou) {
          setIsSigning(false);
          return false;
        }
      }
      
      // Depois assinar
      if (evolucao?.id) {
        await assinarMutation.mutateAsync({
          id: evolucao.id,
          encerrarAtendimento: false,
        });
        
        setEvolucao({
          ...evolucao,
          status: 'assinada',
          assinada: true,
          dataAssinatura: new Date().toISOString(),
        });
      }
      
      setIsDirty(false);
      onSignSuccess?.();
      return true;
    } catch (err) {
      console.error('Erro ao assinar evolução:', err);
      setError('Erro ao assinar evolução. Tente novamente.');
      return false;
    } finally {
      setIsSigning(false);
    }
  }, [conteudo, evolucao, isDirty, salvar, assinarMutation, onSignSuccess]);

  // Assinar e encerrar
  const assinarEEncerrar = useCallback(async (): Promise<boolean> => {
    if (!conteudo.trim()) {
      setError('O conteúdo da evolução não pode estar vazio.');
      return false;
    }

    setIsSigning(true);
    setError(null);
    
    try {
      // Primeiro salvar se houver alterações
      if (isDirty || !evolucao?.id) {
        const salvou = await salvar();
        if (!salvou) {
          setIsSigning(false);
          return false;
        }
      }
      
      // Depois assinar e encerrar
      if (evolucao?.id) {
        await assinarMutation.mutateAsync({
          id: evolucao.id,
          encerrarAtendimento: true,
        });
        
        setEvolucao({
          ...evolucao,
          status: 'encerrada',
          assinada: true,
          dataAssinatura: new Date().toISOString(),
        });
      }
      
      setIsDirty(false);
      onSignSuccess?.();
      onClose?.();
      return true;
    } catch (err) {
      console.error('Erro ao assinar e encerrar evolução:', err);
      setError('Erro ao assinar e encerrar evolução. Tente novamente.');
      return false;
    } finally {
      setIsSigning(false);
    }
  }, [conteudo, evolucao, isDirty, salvar, assinarMutation, onSignSuccess, onClose]);

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
    setError(null);
  }, []);

  return {
    evolucao,
    conteudo,
    tipoAtendimento,
    dataHora,
    isDirty,
    isSaving,
    isSigning,
    error,
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
