"use client";
import { useEffect, useRef } from "react";

export interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StreamingText({ text, isStreaming=false, className, style }: StreamingTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStreaming && ref.current) {
      const parent = ref.current.closest("[data-ai-panel]");
      if (parent) parent.scrollTop = parent.scrollHeight;
    }
  }, [text, isStreaming]);
  return (
    <div ref={ref} className={className} aria-live="polite" aria-atomic="false" style={style}>
      <span style={{ whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{text}</span>
      {isStreaming && (
        <span aria-hidden="true" style={{
          display:"inline-block", width:2, height:"1.1em",
          background:"#00E5B4", verticalAlign:"text-bottom",
          marginLeft:2, animation:"blink 700ms step-end infinite",
        }}/>
      )}
    </div>
  );
}
