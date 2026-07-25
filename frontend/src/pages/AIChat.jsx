import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function AIChat() {
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Metadata & Selected Upload Context
  const [availableUploadIds, setAvailableUploadIds] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState('ALL');
  const [analysisContext, setAnalysisContext] = useState(null);
  const [fetchingContext, setFetchingContext] = useState(true);

  const messagesEndRef = useRef(null);

  // Suggested Prompts list
  const suggestedQuestions = [
    { icon: 'help_outline', text: 'Explain the root cause.' },
    { icon: 'summarize', text: 'Summarize the incident.' },
    { icon: 'troubleshoot', text: 'Which service failed first?' },
    { icon: 'search', text: 'What should I investigate next?' },
    { icon: 'shield', text: 'How can I prevent this?' },
    { icon: 'translate', text: 'Explain this in simple terms.' },
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch available upload IDs for filter dropdown
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await apiService.getLogMetadata();
      if (response.data && response.data.status === 'success') {
        const uids = response.data.upload_ids || [];
        setAvailableUploadIds(uids);
        if (uids.length > 0 && selectedUploadId === 'ALL') {
          setSelectedUploadId(uids[0]);
        }
      }
    } catch {
      // Background fetch failure fallback
    }
  }, [selectedUploadId]);

  // Fetch analysis context for currently selected upload
  const fetchAnalysisContext = useCallback(async (uploadId) => {
    setFetchingContext(true);
    try {
      const payload = uploadId && uploadId !== 'ALL' ? { upload_id: uploadId } : null;
      const res = await apiService.analyzeLogs(payload);
      if (res.data && res.data.status === 'success') {
        setAnalysisContext(res.data);
      } else {
        setAnalysisContext(null);
      }
    } catch {
      setAnalysisContext(null);
    } finally {
      setFetchingContext(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Reset conversation and update context when selected upload changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    if (selectedUploadId) {
      fetchAnalysisContext(selectedUploadId);
    }
  }, [selectedUploadId, fetchAnalysisContext]);

  // Core function to send chat message to POST /ai/chat
  const handleSendMessage = async (textToSend) => {
    const questionText = typeof textToSend === 'string' ? textToSend : inputMsg;
    if (!questionText || !questionText.strip ? !questionText.trim() : !questionText.trim()) return;

    const trimmedQuestion = questionText.trim();
    setInputMsg('');
    setError(null);

    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append User Message
    const userMsgObj = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: trimmedQuestion,
      timestamp: userMessageTime,
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const payload = {
        upload_id: selectedUploadId === 'ALL' ? (availableUploadIds[0] || 'default_upload') : selectedUploadId,
        question: trimmedQuestion,
      };

      const response = await apiService.sendAIChat(payload);
      const resData = response.data;

      if (resData && resData.status === 'success') {
        const assistantMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const assistantMsgObj = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          content: resData.answer,
          model: resData.model || 'gpt-4o-mini',
          responseTimeMs: resData.response_time_ms || 0,
          tokens: resData.tokens || { input: 0, output: 0, total: 0 },
          timestamp: assistantMsgTime,
        };

        setMessages((prev) => [...prev, assistantMsgObj]);
      } else {
        setError('Unexpected API response structure received.');
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      let errMsg = 'Failed to connect to AI Copilot service.';

      if (status === 400) {
        errMsg = detail || 'Invalid request parameters.';
      } else if (status === 404) {
        errMsg = detail || 'Upload batch or incident report data not found.';
      } else if (status === 429) {
        errMsg = detail || 'AI rate limit reached. Please wait a moment before trying again.';
      } else if (status === 500) {
        errMsg = detail || 'AI backend configuration error. Check OPENAI_API_KEY settings.';
      } else if (status === 504) {
        errMsg = detail || 'AI service request timed out.';
      } else if (err.message) {
        errMsg = err.message;
      }

      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter Keypress in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy assistant response
  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Severity badge helper
  const renderSeverityBadge = (severity) => {
    const sev = (severity || 'LOW').toUpperCase();
    if (sev === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error-container text-on-error-container border border-error/30">
          Critical
        </span>
      );
    }
    if (sev === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          High
        </span>
      );
    }
    if (sev === 'MEDIUM') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          Medium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/20 text-primary border border-primary/30">
        Low
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100vh-112px)] -m-lg overflow-hidden bg-surface">
      {/* Left Sidebar Panel: Analysis Context & Suggested Prompts */}
      <aside className="w-[320px] lg:w-[360px] border-r border-outline-variant bg-surface-container-low p-gutter flex flex-col gap-gutter overflow-y-auto shrink-0">
        {/* Upload Selection & Analysis Context Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md shadow-sm space-y-md">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-sm">
            <h2 className="font-headline-md text-body-lg text-on-surface flex items-center gap-xs font-semibold">
              <span className="material-symbols-outlined text-primary text-base">psychology</span>
              <span>Incident Copilot Context</span>
            </h2>
          </div>

          {/* Batch Selector */}
          <div className="space-y-xs">
            <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">
              Selected Log Batch
            </label>
            <select
              value={selectedUploadId}
              onChange={(e) => setSelectedUploadId(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary outline-none cursor-pointer h-9"
            >
              {availableUploadIds.length === 0 && <option value="ALL">All Stored Logs</option>}
              {availableUploadIds.map((uid) => (
                <option key={uid} value={uid}>
                  {uid}
                </option>
              ))}
            </select>
          </div>

          {/* Context Details */}
          {fetchingContext ? (
            <div className="space-y-sm py-sm animate-pulse">
              <div className="h-4 bg-surface-container rounded w-3/4"></div>
              <div className="h-4 bg-surface-container rounded w-1/2"></div>
              <div className="h-4 bg-surface-container rounded w-5/6"></div>
            </div>
          ) : analysisContext ? (
            <div className="space-y-sm pt-xs font-body-sm text-body-sm">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-xs">
                <span className="text-on-surface-variant">Severity</span>
                {renderSeverityBadge(analysisContext.severity)}
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-xs">
                <span className="text-on-surface-variant">Category</span>
                <span className="font-code-sm text-primary font-bold">{analysisContext.incident_category}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-xs">
                <span className="text-on-surface-variant">Affected Services</span>
                <span className="font-code-sm text-on-surface">
                  {analysisContext.affected_services?.length || 0} services
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-xs">
                <span className="text-on-surface-variant">Total Logs / Errors</span>
                <span className="font-code-sm text-on-surface">
                  {analysisContext.statistics?.total_logs || 0} /{' '}
                  <span className="text-error font-semibold">{analysisContext.statistics?.total_errors || 0}</span>
                </span>
              </div>
              <div className="pt-xs">
                <span className="text-on-surface-variant block mb-1 font-label-caps text-[11px] uppercase tracking-wider">
                  Root Cause
                </span>
                <p className="font-body-sm text-on-surface bg-surface-container-high/60 p-xs rounded border border-outline-variant/40 leading-snug">
                  {analysisContext.root_cause?.summary || 'No failure detected.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="font-body-sm text-on-surface-variant py-xs">No analysis data loaded.</p>
          )}
        </div>

        {/* Suggested Questions List */}
        <div className="flex-1 space-y-sm">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            Suggested Prompts
          </h3>
          <div className="grid grid-cols-1 gap-xs">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                disabled={loading}
                className="text-left bg-surface-container border border-outline-variant/70 rounded-lg p-sm hover:border-primary/50 hover:bg-surface-container-highest transition-all duration-200 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center space-x-sm">
                  <span className="material-symbols-outlined text-primary/70 text-sm group-hover:text-primary transition-colors">
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

      {/* Main Chat Interface */}
      <section className="flex-1 flex flex-col relative bg-background overflow-hidden">
        {/* Header Bar */}
        <div className="px-lg py-sm bg-surface-container-low border-b border-outline-variant flex items-center justify-between z-10">
          <div className="flex items-center space-x-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-label-caps text-label-caps text-on-surface font-semibold uppercase tracking-wider">
              AI Copilot Connected — {selectedUploadId}
            </span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-xs px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg text-body-sm transition-colors cursor-pointer"
            title="Clear current conversation"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-lg space-y-lg pb-[140px]">
          {/* Empty Conversation Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-xl space-y-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[36px]">auto_awesome</span>
              </div>
              <div className="max-w-md">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  LogSense AI Copilot
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs leading-relaxed">
                  Ask questions regarding root causes, service failures, stack traces, or remediation steps for batch{' '}
                  <span className="font-code-sm text-primary font-semibold">{selectedUploadId}</span>.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-xs max-w-lg pt-sm">
                {suggestedQuestions.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    className="px-md py-xs rounded-full border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-all cursor-pointer"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Message Thread */}
          {messages.map((msg) =>
            msg.sender === 'user' ? (
              /* User Message Bubble */
              <div key={msg.id} className="flex justify-end animate-fade-in-up">
                <div className="max-w-[75%] flex flex-col items-end">
                  <div className="bg-primary-container text-on-primary-container px-md py-sm rounded-2xl rounded-tr-xs shadow-sm border border-primary/20">
                    <p className="font-body-lg text-body-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-on-surface-variant font-label-caps text-[10px] mt-xs">{msg.timestamp}</span>
                </div>
              </div>
            ) : (
              /* Assistant Response Card */
              <div key={msg.id} className="flex justify-start animate-fade-in-up">
                <div className="max-w-[85%] flex flex-col items-start space-y-xs">
                  <div className="bg-surface-container-high border border-outline-variant text-on-surface p-md rounded-2xl rounded-tl-xs shadow-sm w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-sm border-b border-outline-variant/40 pb-xs">
                      <div className="flex items-center space-x-xs">
                        <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                        <span className="font-label-caps text-label-caps text-primary uppercase font-bold">
                          LogSense AI Response
                        </span>
                        {msg.model && (
                          <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30">
                            {msg.model}
                          </span>
                        )}
                      </div>

                      {/* Token usage metadata */}
                      {msg.tokens && msg.tokens.total > 0 && (
                        <div className="flex items-center gap-xs font-code-sm text-[11px] text-on-surface-variant">
                          <span className="material-symbols-outlined text-[13px]">analytics</span>
                          <span>{msg.tokens.total} tokens</span>
                        </div>
                      )}
                    </div>

                    {/* Markdown Rendered Content */}
                    <MarkdownRenderer content={msg.content} />

                    {/* Action Bar (Copy & Regenerate) */}
                    <div className="mt-md pt-xs border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <div className="flex items-center gap-sm">
                        <button
                          onClick={() => handleCopyMessage(msg.content)}
                          className="flex items-center gap-xs px-xs py-0.5 rounded hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          title="Copy message text"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                          <span className="text-[12px]">Copy</span>
                        </button>
                        <button
                          onClick={handleRegenerate}
                          className="flex items-center gap-xs px-xs py-0.5 rounded hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          title="Regenerate response"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          <span className="text-[12px]">Regenerate</span>
                        </button>
                      </div>

                      {msg.responseTimeMs > 0 && (
                        <span className="font-code-sm text-[11px] text-on-surface-variant/70">
                          {msg.responseTimeMs} ms
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-on-surface-variant font-label-caps text-[10px]">{msg.timestamp}</span>
                </div>
              </div>
            )
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="bg-surface-container-high border border-outline-variant px-md py-sm rounded-2xl rounded-tl-xs shadow-sm flex items-center space-x-sm">
                <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                <span className="font-body-md text-body-md text-on-surface-variant font-medium">
                  Analyzing structured incident report and generating response...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner State */}
          {error && (
            <div className="bg-error-container/20 border border-error/30 rounded-xl p-md flex items-center justify-between text-error animate-fade-in-up">
              <div className="flex items-center space-x-sm">
                <span className="material-symbols-outlined text-base">error</span>
                <span className="font-body-md text-body-md font-medium">{error}</span>
              </div>
              <button
                onClick={handleRegenerate}
                className="px-md py-xs bg-error text-on-error rounded-lg font-label-md text-label-md hover:brightness-110 transition-all cursor-pointer flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Fixed Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-surface-container-low border-t border-outline-variant p-md z-10">
          <div className="max-w-4xl mx-auto flex items-end space-x-sm bg-surface border border-outline-variant rounded-xl p-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-200">
            <textarea
              className="flex-1 bg-transparent border-none text-on-surface font-body-lg text-body-lg resize-none max-h-32 min-h-[44px] py-sm focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/50"
              placeholder={`Ask AI Copilot about batch ${selectedUploadId}... (Press Enter to send)`}
              rows={1}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMsg.trim()}
              className="bg-primary text-on-primary p-sm rounded-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send message"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-xs text-center">
            <span className="font-label-caps text-[10px] text-on-surface-variant/50">
              LogSense AI Copilot operates strictly on structured incident reports. Verify critical diagnostic insights.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
