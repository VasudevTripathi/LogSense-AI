import React, { useState } from 'react';

export default function AIChat() {
  const [inputMsg, setInputMsg] = useState('');

  const suggestedQuestions = [
    { icon: 'chat_bubble', text: 'Why did the application crash?' },
    { icon: 'troubleshoot', text: 'Which service failed first?' },
    { icon: 'summarize', text: "Summarize today's logs." },
    { icon: 'account_tree', text: 'Explain this stack trace.' },
    { icon: 'database', text: 'Show all database errors.' },
    { icon: 'timer', text: 'What caused the timeout?' },
  ];

  return (
    <div className="flex h-[calc(100vh-112px)] -m-lg overflow-hidden bg-surface">
      {/* Left Panel: Context & Suggestions */}
      <aside className="w-[320px] lg:w-[360px] border-r border-outline-variant bg-surface-container-low p-gutter flex flex-col gap-gutter overflow-y-auto shrink-0">
        {/* Analysis Context Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm flex items-center space-x-sm font-semibold">
            <span className="material-symbols-outlined text-primary text-base">analytics</span>
            <span>Analysis Context</span>
          </h2>
          <div className="space-y-sm">
            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-xs">
              <span className="text-on-surface-variant font-body-sm text-body-sm">Current Log File</span>
              <span className="font-code-sm text-code-sm text-primary">api-prod.log</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-xs">
              <span className="text-on-surface-variant font-body-sm text-body-sm">Logs Loaded</span>
              <span className="font-code-sm text-code-sm text-on-surface">12.4k</span>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-xs">
              <span className="text-on-surface-variant font-body-sm text-body-sm">Analysis Completed</span>
              <div className="flex items-center space-x-sm">
                <div className="w-16 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="w-full h-full bg-primary rounded-full"></div>
                </div>
                <span className="font-code-sm text-code-sm text-primary">100%</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-xs">
              <span className="text-on-surface-variant font-body-sm text-body-sm">Root Cause</span>
              <span className="font-code-sm text-code-sm text-error bg-error-container/20 px-xs py-0.5 rounded">DB Exhaustion</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-body-sm text-body-sm">Most Affected</span>
              <span className="font-code-sm text-code-sm text-tertiary">auth-service</span>
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="flex-1">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-md uppercase tracking-wider">Suggested Questions</h3>
          <div className="grid grid-cols-1 gap-sm">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInputMsg(q.text)}
                className="text-left bg-surface-container border border-outline-variant rounded-lg p-sm hover:border-primary/50 hover:bg-surface-container-highest transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-start space-x-sm">
                  <span className="material-symbols-outlined text-primary/70 text-sm mt-0.5 group-hover:text-primary transition-colors">
                    {q.icon}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                    {q.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Panel: Chat Interface */}
      <section className="flex-1 flex flex-col relative bg-background overflow-hidden">
        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-lg space-y-xl pb-[140px]">
          {/* System Intro Message */}
          <div className="flex justify-center">
            <span className="bg-surface-container px-sm py-xs rounded-full border border-outline-variant text-on-surface-variant font-label-caps text-label-caps text-[10px]">
              Analysis complete. Ready to query api-prod.log
            </span>
          </div>

          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[70%] flex flex-col items-end">
              <div className="bg-primary-container text-on-primary-container px-md py-sm rounded-xl rounded-tr-sm shadow-sm border border-primary/20">
                <p className="font-body-lg text-body-lg">Show me the stack trace for those checkout-service errors.</p>
              </div>
              <span className="text-on-surface-variant font-label-caps text-[10px] mt-xs">14:22:15 UTC</span>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className="max-w-[85%] flex flex-col items-start">
              <div className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-xl rounded-tl-sm shadow-sm">
                <div className="flex items-center space-x-sm mb-xs border-b border-outline-variant/30 pb-xs">
                  <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                  <span className="font-label-caps text-label-caps text-primary uppercase font-medium">LogSense AI Analysis</span>
                </div>
                <p className="font-body-lg text-body-lg leading-relaxed mb-sm text-on-surface-variant">
                  Correlating timestamps shows a cascade failure. The{' '}
                  <code className="font-code-sm bg-surface-container-lowest px-1 py-0.5 rounded border border-outline-variant/50 text-tertiary">postgres-main</code>{' '}
                  instance reported connection pool exhaustion approximately 1.2 seconds prior to the first 502 error in{' '}
                  <code className="font-code-sm bg-surface-container-lowest px-1 py-0.5 rounded border border-outline-variant/50 text-secondary">checkout-service</code>.
                </p>

                {/* Embedded Code Block */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm font-code-sm text-code-sm overflow-x-auto text-on-surface-variant">
                  <pre>
                    <code>
{`[2023-10-27T14:21:05.112Z] ERROR [checkout-service] DBConnectionError: Timeout waiting for connection from pool
  at Pool.getConnection (/app/node_modules/pg/lib/pool.js:292:24)
  at CheckoutController.process (/app/src/controllers/checkout.js:45:32)
  ...
[2023-10-27T14:21:06.350Z] WARN  [gateway] Upstream connection failed: checkout-service (502 Bad Gateway)`}
                    </code>
                  </pre>
                </div>

                <div className="mt-sm flex items-center space-x-xs">
                  <span className="material-symbols-outlined text-error text-[14px]">error</span>
                  <span className="font-body-sm text-body-sm text-error">Recommendation: Inspect max connection limits on postgres-main.</span>
                </div>
              </div>
              <span className="text-on-surface-variant font-label-caps text-[10px] mt-xs">14:22:18 UTC</span>
            </div>
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-surface-container-low border-t border-outline-variant p-md z-10">
          <div className="max-w-4xl mx-auto flex items-end space-x-sm bg-surface border border-outline-variant rounded-xl p-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-200">
            <button
              className="p-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container opacity-50 cursor-not-allowed"
              title="Attach Logs (Disabled)"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              className="flex-1 bg-transparent border-none text-on-surface font-body-lg text-body-lg resize-none max-h-32 min-h-[44px] py-sm focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/50"
              placeholder="Ask about your uploaded logs..."
              rows={1}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button className="bg-primary text-on-primary p-sm rounded-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-xs text-center">
            <span className="font-label-caps text-[10px] text-on-surface-variant/50">
              LogSense AI may generate incorrect information. Verify critical data.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
