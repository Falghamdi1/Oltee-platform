"use client";
import { useState, useRef, useCallback } from "react";
import type { OLTEEInputs, MonteCarloConfig, MonteCarloResult } from "@/types/oltee";
import { runMonteCarloSimulationAsync, buildConfig } from "@/lib/montecarlo";

export interface UseMonteCarloReturn {
  result: MonteCarloResult | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
  config: MonteCarloConfig;
  run: (inputs: OLTEEInputs, config?: Partial<MonteCarloConfig>) => Promise<void>;
  cancel: () => void;
  updateConfig: (partial: Partial<MonteCarloConfig>) => void;
  reset: () => void;
}

export function useMonteCarlo(): UseMonteCarloReturn {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MonteCarloConfig>(buildConfig());
  const cancelRef = useRef(false);

  const run = useCallback(async (inputs: OLTEEInputs, configOverride?: Partial<MonteCarloConfig>) => {
    cancelRef.current = false;
    setIsRunning(true); setProgress(0); setError(null); setResult(null);
    try {
      const finalConfig = { ...config, ...configOverride };
      const res = await runMonteCarloSimulationAsync(inputs, finalConfig, (p) => {
        if (!cancelRef.current) setProgress(p);
      });
      if (!cancelRef.current) setResult(res);
    } catch (e) {
      if (!cancelRef.current) setError((e as Error).message);
    } finally {
      if (!cancelRef.current) { setIsRunning(false); setProgress(0); }
    }
  }, [config]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setIsRunning(false); setProgress(0);
  }, []);

  const updateConfig = useCallback((partial: Partial<MonteCarloConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setResult(null); setProgress(0); setError(null); setIsRunning(false);
    setConfig(buildConfig());
  }, []);

  return { result, isRunning, progress, error, config, run, cancel, updateConfig, reset };
}
