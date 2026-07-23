import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export default function AIAnalysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [availableUploadIds, setAvailableUploadIds] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState('ALL');

  // Fetch filter metadata (upload IDs)
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await apiService.getLogMetadata();
      if (response.data && response.data.status === 'success') {
        setAvailableUploadIds(response.data.upload_ids || []);
      }
    } catch {
      // Non-critical background fetch failure
    }
  }, []);

  // Fetch Incident Analysis Report
  const fetchAnalysis = useCallback(async (uploadId = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = uploadId && uploadId !== 'ALL' ? { upload_id: uploadId } : null;
      const response = await apiService.analyzeLogs(payload);
      if (response.data && response.data.status === 'success') {
        setData(response.data);
      } else {
        setError('Unexpected incident report response structure.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Unable to generate incident analysis report.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchAnalysis(selectedUploadId);
  }, [fetchAnalysis, selectedUploadId]);

  // Badge helpers
  const renderLevelBadge = (level) => {
    const lvl = (level || 'INFO').toUpperCase();
    if (lvl === 'CRITICAL' || lvl === 'FATAL' || lvl === 'SEVERE' || lvl === 'ERROR' || lvl === 'ERR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-error-container text-on-error-container">
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
          {lvl}
        </span>
      );
    }
    if (lvl === 'WARN' || lvl === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary-container text-on-tertiary-container">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          {lvl}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
        {lvl}
      </span>
    );
  };

  const renderSeverityBadge = (severity) => {
    const sev = (severity || 'LOW').toUpperCase();
    if (sev === 'CRITICAL') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-error/30 bg-error/10">
          <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
          <span className="font-label-caps text-error font-bold">Critical</span>
        </div>
      );
    }
    if (sev === 'HIGH') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 font-bold">High</div>
        </div>
      );
    }
    if (sev === 'MEDIUM') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
          <span className="font-label-caps text-yellow-400 font-bold">Medium</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-primary/30 bg-primary/10">
        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
        <span className="font-label-caps text-primary font-bold">Low</span>
      </div>
    );
  };

  // Recommendation icon helper
  const getRecommendationIcon = (idx) => {
    const icons = ['layers', 'tune', 'storage', 'refresh', 'shield', 'auto_fix_high'];
    return icons[idx % icons.length];
  };

  return (
    <div className="w-full mx-auto max-w-[1440px] space-y-lg">
      {/* 1. Page Header & Upload Selector */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-md">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg font-bold text-on-surface mb-2">AI Analysis</h2>
          <p className="font-body-sm text-on-surface-variant max-w-2xl">
            Automated root cause investigation and failure correlation generated from stored system logs.
          </p>
        </div>

        {/* Upload ID Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-sm">
          {availableUploadIds.length > 0 && (
            <div className="flex items-center gap-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Batch:</span>
              <select
                value={selectedUploadId}
                onChange={(e) => setSelectedUploadId(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary outline-none cursor-pointer h-9"
              >
                <option value="ALL">All Stored Logs</option>
                {availableUploadIds.map((uid) => (
                  <option key={uid} value={uid}>
                    {uid}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => fetchAnalysis(selectedUploadId)}
            className="px-md py-xs font-label-md text-label-md bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-sm flex items-center gap-xs cursor-pointer h-9"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              sync
            </span>
            Re-Analyze
          </button>
        </div>
      </section>

      {/* LOADING STATE SKELETON */}
      {loading && (
        <div className="space-y-lg animate-pulse">
          <div className="bg-surface-container rounded-2xl h-24"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container rounded-xl h-20"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            <div className="lg:col-span-8 bg-surface-container rounded-2xl h-80"></div>
            <div className="lg:col-span-4 bg-surface-container rounded-2xl h-80"></div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-error-container/20 border border-error/30 rounded-xl p-lg flex flex-col items-center justify-center text-center space-y-md my-xl">
          <div className="w-12 h-12 rounded-full bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-headline-lg">error</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Unable to generate analysis.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-md">{error}</p>
          </div>
          <button
            onClick={() => fetchAnalysis(selectedUploadId)}
            className="px-lg py-sm font-label-md text-label-md bg-error text-on-error rounded-lg hover:brightness-110 transition-all flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">refresh</span>
            Retry Analysis
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && data && data.statistics?.total_logs === 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl flex flex-col items-center justify-center text-center space-y-md my-lg shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[36px]">analytics</span>
          </div>
          <div className="max-w-md">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">No Incident Data Available</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Upload application log files (.log, .txt, .csv) to generate real-time incident reports, failure timelines, and root cause analysis.
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-xl py-sm font-label-md text-label-md bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-md flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">upload_file</span>
            Upload Logs
          </button>
        </div>
      )}

      {/* POPULATED INCIDENT REPORT */}
      {!loading && !error && data && data.statistics?.total_logs > 0 && (
        <>
          {/* Analysis Status Badges */}
          <div className="flex flex-wrap gap-sm">
            <div className="inline-flex items-center gap-xs px-2.5 py-1 rounded border border-secondary/30 bg-secondary/10">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
              <span className="font-label-caps text-label-caps text-secondary font-medium">Analysis Completed</span>
            </div>
            <div className="inline-flex items-center gap-xs px-2.5 py-1 rounded border border-outline-variant bg-surface-container">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">tag</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant font-mono">{data.incident_id}</span>
            </div>
            <div className="inline-flex items-center gap-xs px-2.5 py-1 rounded border border-outline-variant bg-surface-container">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">category</span>
              <span className="font-label-caps text-label-caps text-primary font-bold">{data.incident_category}</span>
            </div>
          </div>

          {/* Executive Summary Hero Banner */}
          <section className="animate-fade-in-up">
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
              <div className="flex items-start gap-md">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[28px]">summarize</span>
                </div>
                <div className="space-y-xs">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Executive Incident Summary</h3>
                  <p className="font-headline-md text-on-surface leading-relaxed">
                    {data.root_cause?.summary || 'Operational issue detected'}
                    {data.root_cause?.service && (
                      <>
                        {' in '}
                        <span className="font-code-sm text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 font-semibold">
                          {data.root_cause.service}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="font-body-sm text-on-surface-variant pt-xs">
                    {data.root_cause?.explanation}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Summary Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
            <div className="bg-surface-container border border-outline-variant/50 rounded-xl p-md flex flex-col justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total Logs Ingested</span>
              <span className="font-headline-md text-headline-md font-bold text-on-surface mt-xs">
                {data.statistics.total_logs.toLocaleString()}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/50 rounded-xl p-md flex flex-col justify-between border-l-4 border-error">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total Errors</span>
              <span className="font-headline-md text-headline-md font-bold text-error mt-xs">
                {data.statistics.total_errors.toLocaleString()}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/50 rounded-xl p-md flex flex-col justify-between border-l-4 border-tertiary-container">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Warnings</span>
              <span className="font-headline-md text-headline-md font-bold text-tertiary mt-xs">
                {data.statistics.total_warnings.toLocaleString()}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/50 rounded-xl p-md flex flex-col justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Affected Services</span>
              <span className="font-headline-md text-headline-md font-bold text-on-surface mt-xs">
                {data.statistics.affected_service_count.toLocaleString()}
              </span>
            </div>
          </section>

          {/* Affected Services Chips */}
          {data.affected_services && data.affected_services.length > 0 && (
            <section className="bg-surface-container border border-outline-variant/50 rounded-xl p-md">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block mb-sm">
                Affected Service Infrastructure
              </span>
              <div className="flex flex-wrap gap-xs">
                {data.affected_services.map((srv) => (
                  <div
                    key={srv}
                    className="inline-flex items-center gap-xs px-md py-xs rounded-lg bg-surface-container-high border border-outline-variant/60 text-on-surface font-body-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            {/* Left Column: Root Cause & Top Errors */}
            <div className="lg:col-span-7 flex flex-col gap-lg">
              {/* Root Cause Details Card */}
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg flex-1">
                <div className="flex justify-between items-start mb-lg border-b border-outline-variant pb-md">
                  <div>
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider">Root Cause Identified</h3>
                    <h4 className="font-headline-md text-on-surface font-semibold">
                      {data.root_cause?.summary || 'Operational Failure'}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-surface-container shadow-[0_0_15px_rgba(77,142,255,0.2)]">
                      <span className="font-body-sm font-bold text-primary">{data.confidence}</span>
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Confidence</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
                  <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Primary Service</span>
                    <span className="font-code-sm text-on-surface bg-surface-container-highest px-2 py-1 rounded inline-block truncate max-w-full">
                      {data.root_cause?.service || 'unknown'}
                    </span>
                  </div>
                  <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">First Seen</span>
                    <span className="font-code-sm text-on-surface block truncate">{data.root_cause?.first_seen || 'N/A'}</span>
                  </div>
                  <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Severity</span>
                    {renderSeverityBadge(data.severity)}
                  </div>
                  <div className="p-md rounded-lg bg-surface-container-high border border-outline-variant/50">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Occurrences</span>
                    <span className="font-body-sm text-on-surface font-semibold block">{data.root_cause?.occurrences || 0} times</span>
                  </div>
                </div>

                {/* Primary Error Box */}
                {data.root_cause?.primary_error && (
                  <div className="space-y-xs">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">
                      Primary Log Signature
                    </span>
                    <div className="bg-[#020617] border border-outline-variant/40 rounded-lg p-md font-mono text-xs text-on-surface leading-relaxed break-words whitespace-pre-wrap">
                      {data.root_cause.primary_error}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Error Patterns List */}
              {data.top_errors && data.top_errors.length > 0 && (
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg space-y-md">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider border-b border-outline-variant pb-sm">
                    Top Recurring Error Patterns
                  </h3>
                  <div className="space-y-sm">
                    {data.top_errors.map((err, idx) => (
                      <div key={idx} className="p-md rounded-xl bg-surface-container-high border border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-md">
                        <div className="min-w-0 flex-1 space-y-xs">
                          <div className="flex items-center gap-xs flex-wrap">
                            {renderLevelBadge(err.level)}
                            <span className="font-code-sm text-secondary bg-surface-container-highest px-2 py-0.5 rounded">
                              {err.service}
                            </span>
                          </div>
                          <p className="font-code-sm text-on-surface truncate">{err.message}</p>
                        </div>
                        <div className="flex items-center gap-xs font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-md py-sm rounded-lg border border-outline-variant/30 whitespace-nowrap self-start md:self-auto">
                          <span className="material-symbols-outlined text-[14px]">repeat</span>
                          <span>{err.count} count</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Failure Timeline */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg h-full flex flex-col">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-lg uppercase tracking-wider border-b border-outline-variant pb-md">
                  Failure Timeline
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[550px] relative pl-6 border-l-2 border-outline-variant/30 space-y-md pr-xs">
                  {data.timeline && data.timeline.length > 0 ? (
                    data.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-surface-container border-2 ${
                            event.level === 'CRITICAL' || event.level === 'ERROR'
                              ? 'border-error shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : 'border-tertiary'
                          }`}
                        ></div>
                        <div className="flex items-center gap-xs mb-1">
                          <span className="font-code-sm text-on-surface-variant">{event.timestamp}</span>
                          <span className="font-code-sm text-primary font-medium">[{event.service}]</span>
                        </div>
                        <p className="font-body-sm text-on-surface font-medium leading-normal">{event.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="font-body-sm text-on-surface-variant py-md">No timeline events captured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Fixes */}
          {data.recommendations && data.recommendations.length > 0 && (
            <section className="animate-fade-in-up space-y-md">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Recommended Remediation Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                {data.recommendations.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container border border-outline-variant hover:border-outline hover:bg-surface-container-high rounded-xl p-md transition-all group flex items-start gap-md"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined">{getRecommendationIcon(idx)}</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-[10px] text-primary uppercase tracking-wider block mb-0.5">
                        Step {idx + 1}
                      </span>
                      <h4 className="font-body-sm text-on-surface font-medium leading-snug">{step}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Actions */}
          <section className="flex justify-end gap-md pb-xl pt-md">
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-body-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Open AI Chat
            </button>
            <button
              onClick={() => fetchAnalysis(selectedUploadId)}
              className="px-6 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-blue-600 transition-colors font-body-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Analyze Again
            </button>
          </section>
        </>
      )}
    </div>
  );
}
