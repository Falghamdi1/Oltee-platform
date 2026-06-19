"use client";
import { useState, useEffect, useRef } from "react";

export interface UseCountUpOptions {
  target: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  easing?: "linear" | "easeOut" | "spring";
}
export interface UseCountUpReturn {
  current: number;
  isAnimating: boolean;
  formatted: string;
}

export function useCountUp({
  target, duration = 1200, delay = 0, decimals = 1, easing = "easeOut",
}: UseCountUpOptions): UseCountUpReturn {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target); prevRef.current = target; return;
    }
    const timer = setTimeout(() => {
      const start = prevRef.current;
      const t0 = performance.now();
      setIsAnimating(true);
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const e = easing === "linear" ? p : easing === "easeOut"
          ? 1 - Math.pow(1 - p, 3)
          : 1 - Math.pow(1 - p, 4);
        setCurrent(start + (target - start) * e);
        if (p < 1) { frameRef.current = requestAnimationFrame(tick); }
        else { setCurrent(target); prevRef.current = target; setIsAnimating(false); }
      };
      frameRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(frameRef.current); };
  }, [target, duration, delay, easing]);

  return { current, isAnimating, formatted: current.toFixed(decimals) };
}
