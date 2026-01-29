/**
 * ============================================================================
 * HOOK: useTimer
 * ============================================================================
 * Controla o timer de duração da consulta
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
  seconds: number;
  formattedTime: string;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setInitialSeconds: (seconds: number) => void;
}

export function useTimer(initialSeconds: number = 0): UseTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Formatar tempo como MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  // Iniciar timer
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  // Parar timer
  const stop = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    }
  }, [isRunning]);

  // Resetar timer
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  // Definir segundos iniciais (para restaurar janela minimizada)
  const setInitialSeconds = useCallback((newSeconds: number) => {
    setSeconds(newSeconds);
  }, []);

  // Efeito para incrementar o timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    seconds,
    formattedTime: formatTime(seconds),
    isRunning,
    start,
    stop,
    reset,
    setInitialSeconds,
  };
}

export default useTimer;
