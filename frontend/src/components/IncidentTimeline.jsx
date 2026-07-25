import React from 'react';

/**
 * Vertical Causal Timeline component for incident events.
 */
export default function IncidentTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-surface-container-high/40 border border-outline-variant/40 rounded-xl p-md text-center text-on-surface-variant font-body-sm">
        No chronological timeline events detected.
      </div>
    );
  }

  const renderLevelBadge = (level) => {
    const lvl = (level || 'INFO').toUpperCase();
    if (lvl === 'CRITICAL' || lvl === 'FATAL' || lvl === 'SEVERE' || lvl === 'ERROR' || lvl === 'ERR') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error-container text-on-error-container">
          {lvl}
        </span>
      );
    }
    if (lvl === 'WARN' || lvl === 'WARNING') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tertiary-container text-on-tertiary-container">
          {lvl}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">
        {lvl}
      </span>
    );
  };

  return (
    <div className="relative pl-6 border-l-2 border-outline-variant/40 space-y-md">
      {timeline.map((event, idx) => {
        const isCritical =
          event.level === 'CRITICAL' || event.level === 'FATAL' || event.level === 'ERROR' || event.level === 'ERR';

        return (
          <div key={idx} className="relative group">
            {/* Causal Node Dot */}
            <div
              className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                isCritical
                  ? 'border-error bg-error/20 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  : 'border-tertiary bg-tertiary/20'
              }`}
            />

            <div className="bg-surface-container-high/60 border border-outline-variant/40 rounded-xl p-sm hover:border-primary/50 transition-all">
              <div className="flex items-center justify-between gap-xs flex-wrap mb-xs">
                <div className="flex items-center gap-xs">
                  <span className="font-code-sm text-[12px] text-on-surface-variant">{event.timestamp || 'N/A'}</span>
                  {renderLevelBadge(event.level)}
                  <span className="font-code-sm text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[11px] font-semibold">
                    {event.service || 'unknown'}
                  </span>
                </div>
                <span className="font-label-caps text-[10px] text-on-surface-variant/60">
                  Event #{idx + 1}
                </span>
              </div>
              <p className="font-code-sm text-on-surface text-[12px] leading-relaxed break-words">
                {event.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
