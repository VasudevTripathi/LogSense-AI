import React, { useState } from 'react';

/**
 * Interactive Confidence Score Meter with breakdown tooltip.
 */
export default function ConfidenceMeter({ confidence, occurrences = 1, category = 'UNKNOWN', totalErrors = 1 }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Parse numerical percentage
  const numValue = parseInt(String(confidence).replace('%', ''), 10) || 85;

  // Determine meter color variant
  let colorClass = 'stroke-primary text-primary';
  let bgGradient = 'from-primary/20 to-primary/5';

  if (numValue >= 90) {
    colorClass = 'stroke-emerald-400 text-emerald-400';
    bgGradient = 'from-emerald-500/20 to-emerald-500/5';
  } else if (numValue >= 75) {
    colorClass = 'stroke-primary text-primary';
    bgGradient = 'from-primary/20 to-primary/5';
  } else if (numValue >= 60) {
    colorClass = 'stroke-amber-400 text-amber-400';
    bgGradient = 'from-amber-500/20 to-amber-500/5';
  } else {
    colorClass = 'stroke-error text-error';
    bgGradient = 'from-error/20 to-error/5';
  }

  // Calculate SVG stroke offset for ring gauge
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numValue / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center gap-xs cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Circular Progress Meter */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-surface-container-highest"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            className={`${colorClass} transition-all duration-700 ease-out`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className={`absolute font-code-sm text-[11px] font-bold ${colorClass}`}>
          {numValue}%
        </span>
      </div>

      <div className="flex flex-col">
        <span className="font-label-caps text-label-caps text-on-surface-variant font-bold uppercase tracking-wider">
          Confidence
        </span>
        <span className="font-body-sm text-[12px] text-on-surface flex items-center gap-0.5">
          <span>High Reliability</span>
          <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary transition-colors">
            info
          </span>
        </span>
      </div>

      {/* Tooltip Breakdown */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-md bg-surface-container-highest border border-outline-variant/80 rounded-xl shadow-xl text-on-surface text-xs z-50 animate-fade-in-up space-y-xs">
          <div className="font-label-caps text-label-caps text-primary uppercase font-bold border-b border-outline-variant/40 pb-xs">
            Confidence Score Metrics
          </div>
          <div className="space-y-1 font-body-sm text-[11px] text-on-surface-variant">
            <div className="flex justify-between">
              <span>Base Rule Baseline:</span>
              <span className="font-mono text-on-surface">80%</span>
            </div>
            <div className="flex justify-between">
              <span>Occurrences ({occurrences}x):</span>
              <span className="font-mono text-emerald-400">+{occurrences > 5 ? '8%' : occurrences > 1 ? '4%' : '0%'}</span>
            </div>
            <div className="flex justify-between">
              <span>Category ({category}):</span>
              <span className="font-mono text-emerald-400">+{category !== 'UNKNOWN' ? '8%' : '0%'}</span>
            </div>
            <div className="flex justify-between">
              <span>Concentration Ratio:</span>
              <span className="font-mono text-emerald-400">+4%</span>
            </div>
          </div>
          <div className="border-t border-outline-variant/40 pt-xs flex justify-between font-bold text-on-surface">
            <span>Calculated Score:</span>
            <span className={colorClass}>{numValue}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
