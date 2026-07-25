import React, { useState, useEffect } from 'react';

/**
 * Multi-stage progress loader replacing generic spinners.
 */
export default function MultiStageLoader() {
  const stages = [
    { label: 'Step 1/3: Sanitizing incident context & masking credentials...', progress: 33 },
    { label: 'Step 2/3: Correlating root cause & affected microservices...', progress: 66 },
    { label: 'Step 3/3: Synthesizing AI SRE insights & remediation steps...', progress: 95 },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStageIdx(1), 1200);
    const timer2 = setTimeout(() => setCurrentStageIdx(2), 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const activeStage = stages[currentStageIdx];

  return (
    <div className="bg-surface-container-high border border-outline-variant p-md rounded-2xl shadow-md space-y-xs max-w-xl animate-fade-in-up">
      <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-sm animate-spin">
            psychology
          </span>
          <span className="font-medium text-on-surface">{activeStage.label}</span>
        </div>
        <span className="font-code-sm text-primary font-bold">{activeStage.progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${activeStage.progress}%` }}
        />
      </div>
    </div>
  );
}
