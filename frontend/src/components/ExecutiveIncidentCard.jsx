import React, { useState } from 'react';
import ConfidenceMeter from './ConfidenceMeter';
import IncidentTimeline from './IncidentTimeline';
import { exportToMarkdown, exportToJson, exportToPdf } from '../utils/exportUtils';

export default function ExecutiveIncidentCard({ incidentData, uploadId = 'ALL', messages = [] }) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!incidentData || !incidentData.root_cause) return null;

  const {
    incident_id = 'N/A',
    severity = 'LOW',
    confidence = '85%',
    incident_category = 'UNKNOWN',
    root_cause = {},
    statistics = {},
    affected_services = [],
    recommendations = [],
    timeline = [],
  } = incidentData;

  // Auto-generate Incident Tags
  const generateTags = () => {
    const tags = [];
    if (incident_category) tags.push(`[${incident_category.toUpperCase()}]`);
    if (severity) tags.push(`[${severity.toUpperCase()}_SEVERITY]`);
    if (affected_services.length > 1) tags.push('[CASCADE_FAILURE]');
    if (root_cause.service) tags.push(`[${root_cause.service.toUpperCase()}]`);
    tags.push('[ROOT_CAUSE_IDENTIFIED]');
    return tags;
  };

  const incidentTags = generateTags();

  // Helper for copy notifications
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Copy Executive Summary text
  const copyExecutiveSummary = () => {
    const text = `LogSense AI Executive Summary (Incident ID: ${incident_id}):\nStatus: ${statistics.total_errors || 0} errors across ${affected_services.length} services.\nRoot Cause: ${root_cause.summary}\nExplanation: ${root_cause.explanation}`;
    handleCopyText(text, 'summary');
  };

  // Copy Root Cause text
  const copyRootCause = () => {
    const text = `Root Cause: ${root_cause.summary}\nPrimary Microservice: ${root_cause.service}\nPrimary Error: ${root_cause.primary_error || 'N/A'}\nExplanation: ${root_cause.explanation}`;
    handleCopyText(text, 'root_cause');
  };

  // Copy Recommendations text
  const copyRecommendations = () => {
    const text = `Remediation Actions:\n` + recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
    handleCopyText(text, 'recommendations');
  };

  // Render Severity Badge
  const renderSeverityBadge = (sev) => {
    const upperSev = (sev || 'LOW').toUpperCase();
    if (upperSev === 'CRITICAL') {
      return (
        <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-error-container text-on-error-container border border-error/30 uppercase tracking-wider">
          Critical Severity
        </span>
      );
    }
    if (upperSev === 'HIGH') {
      return (
        <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
          High Severity
        </span>
      );
    }
    if (upperSev === 'MEDIUM') {
      return (
        <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
          Medium Severity
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
        Low Severity
      </span>
    );
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg space-y-lg shadow-sm animate-fade-in-up">
      {/* 1. Header & Export Center Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div className="space-y-xs">
          <div className="flex items-center gap-sm flex-wrap">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Executive Incident Report
            </h2>
            <span className="font-code-sm text-xs bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/60 text-on-surface-variant font-mono">
              ID: {incident_id}
            </span>
            {renderSeverityBadge(severity)}
          </div>

          {/* Incident Tags */}
          <div className="flex flex-wrap gap-xs pt-xs">
            {incidentTags.map((tag, idx) => (
              <span
                key={idx}
                className="font-code-sm text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Confidence Meter & Export Dropdown */}
        <div className="flex items-center gap-md">
          <ConfidenceMeter
            confidence={confidence}
            occurrences={root_cause.occurrences || 1}
            category={incident_category}
            totalErrors={statistics.total_errors || 1}
          />

          {/* Export Center Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-md py-xs font-label-md text-label-md bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all flex items-center gap-xs cursor-pointer h-9 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Report</span>
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-xs w-48 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl z-50 py-xs text-on-surface font-body-sm text-body-sm animate-fade-in-up">
                <button
                  onClick={() => {
                    exportToMarkdown(incidentData, messages, uploadId);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-md py-xs hover:bg-surface-container flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                  <span>Export as Markdown (.md)</span>
                </button>
                <button
                  onClick={() => {
                    exportToJson(incidentData, messages, uploadId);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-md py-xs hover:bg-surface-container flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-sm">code</span>
                  <span>Export as JSON (.json)</span>
                </button>
                <button
                  onClick={() => {
                    exportToPdf(incidentData, messages, uploadId);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-md py-xs hover:bg-surface-container flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-sm">picture_as_pdf</span>
                  <span>Export to PDF / Print</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Executive Summary Hero & Quick Action */}
      <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-md relative overflow-hidden space-y-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
            Executive Summary
          </span>
          <button
            onClick={copyExecutiveSummary}
            className="flex items-center gap-xs text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {copiedSection === 'summary' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedSection === 'summary' ? 'Copied Summary' : 'Copy Summary'}</span>
          </button>
        </div>
        <p className="font-headline-md text-on-surface font-semibold leading-relaxed">
          {root_cause.summary || 'Operational Incident Detected'}
        </p>
        <p className="font-body-md text-on-surface-variant leading-relaxed">
          {root_cause.explanation}
        </p>
      </div>

      {/* 3. Impact Assessment: Business Impact & Technical Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {/* Business Impact Card */}
        <div className="bg-surface-container-high/40 border border-outline-variant/50 rounded-xl p-md space-y-xs">
          <div className="flex items-center gap-xs text-amber-400 font-label-caps text-label-caps uppercase font-bold">
            <span className="material-symbols-outlined text-sm">domain</span>
            <span>Business Impact Assessment</span>
          </div>
          <p className="font-body-sm text-on-surface-variant leading-relaxed">
            Service degradation in <span className="font-semibold text-on-surface">{root_cause.service || 'core system'}</span> resulted in elevated error rates. Potential customer transaction delays or session dropouts during peak failure window.
          </p>
        </div>

        {/* Technical Impact Card */}
        <div className="bg-surface-container-high/40 border border-outline-variant/50 rounded-xl p-md space-y-xs">
          <div className="flex items-center gap-xs text-primary font-label-caps text-label-caps uppercase font-bold">
            <span className="material-symbols-outlined text-sm">dns</span>
            <span>Technical System Impact</span>
          </div>
          <p className="font-body-sm text-on-surface-variant leading-relaxed">
            Total {statistics.total_errors || 0} system failure logs recorded across {affected_services.length || 1} microservices. Cascading latency impact detected on dependent downstream operations.
          </p>
        </div>
      </div>

      {/* 4. Root Cause Details & Primary Log Signature */}
      <div className="bg-surface-container-high/40 border border-outline-variant/50 rounded-xl p-md space-y-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-error text-base">warning</span>
            <h3 className="font-label-caps text-label-caps text-on-surface uppercase font-bold tracking-wider">
              Root Cause Diagnostics
            </h3>
          </div>
          <button
            onClick={copyRootCause}
            className="flex items-center gap-xs text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {copiedSection === 'root_cause' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedSection === 'root_cause' ? 'Copied' : 'Copy Root Cause'}</span>
          </button>
        </div>

        {root_cause.primary_error && (
          <div className="bg-[#020617] border border-outline-variant/40 rounded-lg p-md font-mono text-xs text-on-surface leading-relaxed break-words whitespace-pre-wrap">
            {root_cause.primary_error}
          </div>
        )}
      </div>

      {/* 5. Causal Failure Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="space-y-md pt-xs">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider border-b border-outline-variant/40 pb-xs">
            Causal Failure Timeline
          </h3>
          <IncidentTimeline timeline={timeline} />
        </div>
      )}

      {/* 6. Recommendations & Remediation */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-md pt-xs border-t border-outline-variant/40">
          <div className="flex items-center justify-between">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
              Actionable Recommendations
            </h3>
            <button
              onClick={copyRecommendations}
              className="flex items-center gap-xs text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedSection === 'recommendations' ? 'check' : 'content_copy'}
              </span>
              <span>{copiedSection === 'recommendations' ? 'Copied' : 'Copy Actions'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-surface-container-high/60 border border-outline-variant/50 rounded-xl p-sm flex items-start gap-sm"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="font-body-sm text-on-surface leading-snug">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
