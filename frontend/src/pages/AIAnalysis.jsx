import React from 'react';

export default function AIAnalysis() {
  return (
    <div className="w-full mx-auto max-w-[1440px] space-y-lg">
      {/* 1. Analysis Status Header */}
      <section className="animate-fade-in-up">
        <h2 className="font-headline-lg-mobile md:font-headline-lg font-bold text-on-surface mb-2">AI Analysis</h2>
        <p className="font-body-sm text-on-surface-variant mb-md max-w-2xl">
          AI-powered root cause investigation generated from uploaded application logs.
        </p>
        <div className="flex flex-wrap gap-sm">
          <div className="inline-flex items-center gap-xs px-2 py-1 rounded border border-secondary/30 bg-secondary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
            <span className="font-label-caps text-label-caps text-secondary">Analysis Completed</span>
          </div>
          <div className="inline-flex items-center gap-xs px-2 py-1 rounded border border-outline-variant bg-surface-container">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">timer</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">14.2s</span>
          </div>
          <div className="inline-flex items-center gap-xs px-2 py-1 rounded border border-outline-variant bg-surface-container">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">database</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">12.4k Logs</span>
          </div>
          <div className="inline-flex items-center gap-xs px-2 py-1 rounded border border-outline-variant bg-surface-container">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">calendar_today</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Oct 24, 2023 - 14:30</span>
          </div>
        </div>
      </section>

      {/* 2. Executive Summary Card */}
      <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-start gap-md">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[28px]">summarize</span>
            </div>
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">Executive Summary</h3>
              <p className="font-headline-md text-on-surface leading-relaxed">
                The incident was triggered by a sudden surge in authentication requests leading to{' '}
                <span className="text-error font-medium">database connection pool exhaustion</span> in the{' '}
                <span className="font-code-sm text-primary px-1.5 py-0.5 rounded bg-primary/10">auth-service</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Root Cause Analysis & 4. Evidence List & 5. Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Root Cause & Evidence */}
        <div className="lg:col-span-8 flex flex-col gap-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg flex-1 hover:border-outline transition-colors duration-300">
            <div className="flex justify-between items-start mb-lg border-b border-outline-variant pb-md">
              <div>
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider">Root Cause Identified</h3>
                <h4 className="font-headline-md text-on-surface font-semibold">Connection Pool Exhaustion</h4>
              </div>
              <div className="flex flex-col items-end">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-surface-container shadow-[0_0_15px_rgba(77,142,255,0.2)]">
                  <span className="font-body-sm font-bold text-primary">96%</span>
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Confidence</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
              <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Affected Service</span>
                <span className="font-code-sm text-on-surface bg-surface-container-highest px-2 py-1 rounded inline-block">auth-service</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Start Time (UTC)</span>
                <span className="font-code-sm text-on-surface block">13:41:02</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Severity</span>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-error/30 bg-error/10 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                  <span className="font-label-caps text-error">Critical</span>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Impact</span>
                <span className="font-body-sm text-on-surface font-medium block">15% User Drop</span>
              </div>
            </div>

            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-md uppercase tracking-wider">Key Evidence</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                  <div>
                    <p className="font-body-sm text-on-surface">Database timeout detected <span className="text-on-surface-variant">(1,200+ occurrences)</span></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                  <div>
                    <p className="font-body-sm text-on-surface">Connection pool exhausted <span className="text-on-surface-variant">(Max 100/100 reached)</span></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                  <div>
                    <p className="font-body-sm text-on-surface">Retry failures increased <span className="text-on-surface-variant">(400% spike in auth-service)</span></p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg h-full">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-lg uppercase tracking-wider border-b border-outline-variant pb-md">Timeline of Failure</h3>
            <div className="relative pl-6 border-l-2 border-outline-variant/30 space-y-md">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-surface-container border-2 border-outline-variant"></div>
                <span className="font-code-sm text-on-surface-variant block mb-1">13:41</span>
                <p className="font-body-sm text-on-surface">First timeout detected in <span className="font-code-sm text-primary">auth-service</span></p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-surface-container border-2 border-tertiary"></div>
                <span className="font-code-sm text-on-surface-variant block mb-1">13:42</span>
                <p className="font-body-sm text-on-surface">Database connection pool reaches 100% capacity</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-surface-container border-2 border-error shadow-[0_0_10px_rgba(255,180,171,0.5)]"></div>
                <span className="font-code-sm text-on-surface-variant block mb-1">13:45</span>
                <p className="font-body-sm text-on-surface font-medium text-error">Service unavailable (503) for 15% of users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Recommended Fixes Grid */}
      <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-md uppercase tracking-wider">Recommended Fixes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="bg-surface-container border border-outline-variant hover:border-outline hover:bg-surface-container-high rounded-xl p-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary">layers</span>
            </div>
            <h4 className="font-body-sm text-on-surface font-medium">Increase Database Pool</h4>
          </div>
          <div className="bg-surface-container border border-outline-variant hover:border-outline hover:bg-surface-container-high rounded-xl p-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary">search</span>
            </div>
            <h4 className="font-body-sm text-on-surface font-medium">Optimize Auth Queries</h4>
          </div>
          <div className="bg-surface-container border border-outline-variant hover:border-outline hover:bg-surface-container-high rounded-xl p-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary">storage</span>
            </div>
            <h4 className="font-body-sm text-on-surface font-medium">Scale Auth Service</h4>
          </div>
          <div className="bg-surface-container border border-outline-variant hover:border-outline hover:bg-surface-container-high rounded-xl p-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary">refresh</span>
            </div>
            <h4 className="font-body-sm text-on-surface font-medium">Update Retry Logic</h4>
          </div>
        </div>
      </section>

      {/* 7. Footer Actions */}
      <section className="flex justify-end gap-md pb-xl animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <button className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-body-sm font-medium flex items-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Open AI Chat
        </button>
        <button className="px-6 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-blue-600 transition-colors font-body-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Analyze Again
        </button>
      </section>
    </div>
  );
}
