import React from 'react';

/**
 * AI Performance & Efficiency Telemetry Card.
 */
export default function AIPerformanceCard({ model, responseTimeMs, tokens }) {
  const inputTokens = tokens?.input || 0;
  const outputTokens = tokens?.output || 0;
  const totalTokens = tokens?.total || inputTokens + outputTokens || 0;
  const isRuleEngine = model?.includes('rule-engine');

  return (
    <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-md shadow-sm space-y-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-xs">
        <div className="flex items-center gap-xs">
          <span className={`material-symbols-outlined text-base ${isRuleEngine ? 'text-amber-400' : 'text-primary'}`}>
            {isRuleEngine ? 'auto_mode' : 'bolt'}
          </span>
          <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-bold">
            AI Telemetry & Performance
          </span>
        </div>
        <span className={`font-code-sm text-[10px] px-2 py-0.5 rounded border font-semibold ${
          isRuleEngine
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-primary/10 text-primary border-primary/20'
        }`}>
          {isRuleEngine ? 'Rule-Based SRE Engine' : model || 'gpt-4o-mini'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-xs text-center font-body-sm text-body-sm">
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Latency</span>
          <span className="font-code-sm font-semibold text-emerald-400">
            {responseTimeMs !== undefined ? `${responseTimeMs} ms` : 'N/A'}
          </span>
        </div>
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Prompt Input</span>
          <span className="font-code-sm font-semibold text-on-surface">
            {isRuleEngine ? 'Deterministic' : `${inputTokens.toLocaleString()} tk`}
          </span>
        </div>
        <div className="bg-surface-container-high/60 p-xs rounded-lg border border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-on-surface-variant block">Completion Output</span>
          <span className="font-code-sm font-semibold text-primary">
            {isRuleEngine ? 'Structured' : `${outputTokens.toLocaleString()} tk`}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-body-sm text-on-surface-variant pt-xs border-t border-outline-variant/30">
        <span>Processing Pipeline:</span>
        <span className="font-code-sm font-bold text-on-surface">
          {isRuleEngine ? 'Rule Engine (Deterministic)' : `${totalTokens.toLocaleString()} tokens`}
        </span>
      </div>
    </div>
  );
}
