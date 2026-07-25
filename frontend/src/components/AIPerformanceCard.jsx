import React from 'react';

/**
 * AI Performance & Efficiency Telemetry Card.
 */
export default function AIPerformanceCard({ model, responseTimeMs, tokens }) {
  const inputTokens = tokens?.input || 0;
  const outputTokens = tokens?.output || 0;
  const totalTokens = tokens?.total || inputTokens + outputTokens || 0;

  return (
    <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-md shadow-sm space-y-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-xs">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-base">bolt</span>
          <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-bold">
            AI Telemetry & Performance
          </span>
        </div>
        <span className="font-code-sm text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-semibold">
          {model || 'gpt-4o-mini'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-xs text-center font-body-sm text-body-sm">
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Latency</span>
          <span className="font-code-sm font-semibold text-emerald-400">
            {responseTimeMs ? `${responseTimeMs} ms` : 'N/A'}
          </span>
        </div>
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Prompt Input</span>
          <span className="font-code-sm font-semibold text-on-surface">
            {inputTokens.toLocaleString()} tk
          </span>
        </div>
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Completion Output</span>
          <span className="font-code-sm font-semibold text-primary">
            {outputTokens.toLocaleString()} tk
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-body-sm text-on-surface-variant pt-xs border-t border-outline-variant/30">
        <span>Total Context Consumption:</span>
        <span className="font-code-sm font-bold text-on-surface">{totalTokens.toLocaleString()} tokens</span>
      </div>
    </div>
  );
}
