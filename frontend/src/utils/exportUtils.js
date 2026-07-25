/**
 * LogSense AI - Export Center Utilities
 * Functions for exporting incident reports and chat transcripts to Markdown, JSON, and PDF.
 */

/**
 * Downloads a text string as a blob file.
 */
function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export incident report and chat transcript as Markdown (.md)
 */
export function exportToMarkdown(incidentData, messages = [], uploadId = 'ALL') {
  const timestamp = new Date().toISOString();
  const lines = [];

  lines.append ? lines.append : null;
  lines.push(`# LogSense AI - Executive Incident Investigation Report`);
  lines.push(`**Generated**: ${timestamp}`);
  lines.push(`**Target Upload Batch**: ${uploadId}`);
  lines.push(`\n---\n`);

  if (incidentData) {
    lines.push(`## Executive Summary`);
    lines.push(`- **Incident ID**: \`${incidentData.incident_id || 'N/A'}\``);
    lines.push(`- **Severity**: ${incidentData.severity || 'N/A'}`);
    lines.push(`- **Confidence**: ${incidentData.confidence || 'N/A'}`);
    lines.push(`- **Category**: ${incidentData.incident_category || 'N/A'}`);
    lines.push(`- **Total Logs Ingested**: ${incidentData.statistics?.total_logs || 0}`);
    lines.push(`- **Total Errors**: ${incidentData.statistics?.total_errors || 0}`);
    lines.push(`\n### Root Cause Analysis`);
    lines.push(`**Summary**: ${incidentData.root_cause?.summary || 'N/A'}`);
    lines.push(`**Service**: \`${incidentData.root_cause?.service || 'unknown'}\``);
    lines.push(`**Explanation**: ${incidentData.root_cause?.explanation || 'N/A'}`);

    if (incidentData.root_cause?.primary_error) {
      lines.push(`\n**Primary Error Signature**:\n\`\`\`\n${incidentData.root_cause.primary_error}\n\`\`\``);
    }

    if (incidentData.affected_services && incidentData.affected_services.length > 0) {
      lines.push(`\n### Affected Infrastructure`);
      lines.push(incidentData.affected_services.map((s) => `- \`${s}\``).join('\n'));
    }

    if (incidentData.recommendations && incidentData.recommendations.length > 0) {
      lines.push(`\n### Recommended Actions`);
      lines.push(incidentData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n'));
    }

    if (incidentData.timeline && incidentData.timeline.length > 0) {
      lines.push(`\n### Failure Timeline`);
      incidentData.timeline.forEach((t) => {
        lines.push(`- **[${t.timestamp || 'N/A'}]** [\`${t.service || 'unknown'}\`] (${t.level}): ${t.message}`);
      });
    }
  }

  if (messages && messages.length > 0) {
    lines.push(`\n---\n`);
    lines.push(`## AI Copilot Investigation Transcript`);
    messages.forEach((msg) => {
      const sender = msg.sender === 'user' ? 'User' : 'LogSense AI';
      lines.push(`\n### ${sender} (${msg.timestamp || ''})`);
      lines.push(msg.content);
    });
  }

  const markdownText = lines.join('\n');
  const filename = `incident-report-${uploadId}-${Date.now()}.md`;
  downloadBlob(markdownText, filename, 'text/markdown;charset=utf-8;');
}

/**
 * Export incident report and chat transcript as structured JSON (.json)
 */
export function exportToJson(incidentData, messages = [], uploadId = 'ALL') {
  const exportPayload = {
    export_metadata: {
      tool: 'LogSense AI Incident Copilot',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      upload_id: uploadId,
    },
    incident_report: incidentData || null,
    chat_transcript: messages.map((m) => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      model: m.model || null,
      response_time_ms: m.responseTimeMs || null,
      tokens: m.tokens || null,
    })),
  };

  const jsonText = JSON.stringify(exportPayload, null, 2);
  const filename = `incident-report-${uploadId}-${Date.now()}.json`;
  downloadBlob(jsonText, filename, 'application/json;charset=utf-8;');
}

/**
 * Export incident report via browser Print/PDF dialog
 */
export function exportToPdf(incidentData, messages = [], uploadId = 'ALL') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>LogSense AI Incident Report - ${uploadId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #0f172a; padding: 30px; }
          h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
          h2 { color: #334155; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; background: #e2e8f0; }
          .critical { background: #fee2e2; color: #991b1b; }
          .high { background: #fef3c7; color: #92400e; }
          .medium { background: #fef08a; color: #854d0e; }
          .code-box { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background: #f8fafc; }
          ul { padding-left: 20px; }
          .chat-bubble { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 8px; background: #f1f5f9; }
          .user { background: #eff6ff; border-color: #bfdbfe; }
        </style>
      </head>
      <body>
        <h1>LogSense AI — Executive Incident Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()} | <strong>Upload Batch:</strong> ${uploadId}</p>

        ${
          incidentData
            ? `
          <div class="grid">
            <div class="card">
              <strong>Incident ID:</strong> ${incidentData.incident_id || 'N/A'}<br/>
              <strong>Severity:</strong> <span class="badge ${(incidentData.severity || 'low').toLowerCase()}">${incidentData.severity || 'LOW'}</span><br/>
              <strong>Confidence Score:</strong> ${incidentData.confidence || 'N/A'}
            </div>
            <div class="card">
              <strong>Category:</strong> ${incidentData.incident_category || 'N/A'}<br/>
              <strong>Total Ingested Logs:</strong> ${incidentData.statistics?.total_logs || 0}<br/>
              <strong>Total Error Count:</strong> ${incidentData.statistics?.total_errors || 0}
            </div>
          </div>

          <h2>Root Cause Analysis</h2>
          <p><strong>Summary:</strong> ${incidentData.root_cause?.summary || 'N/A'}</p>
          <p><strong>Primary Microservice:</strong> <code>${incidentData.root_cause?.service || 'unknown'}</code></p>
          <p><strong>Explanation:</strong> ${incidentData.root_cause?.explanation || 'N/A'}</p>

          ${
            incidentData.root_cause?.primary_error
              ? `<h3>Primary Error Signature</h3><div class="code-box">${incidentData.root_cause.primary_error}</div>`
              : ''
          }

          ${
            incidentData.recommendations && incidentData.recommendations.length > 0
              ? `<h2>Recommended Actions</h2><ul>${incidentData.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>`
              : ''
          }

          ${
            incidentData.timeline && incidentData.timeline.length > 0
              ? `<h2>Incident Timeline</h2><ul>${incidentData.timeline
                  .map((t) => `<li><strong>[${t.timestamp || 'N/A'}]</strong> [${t.service || 'unknown'}] - ${t.message}</li>`)
                  .join('')}</ul>`
              : ''
          }
        `
            : ''
        }

        ${
          messages && messages.length > 0
            ? `
          <h2>AI Copilot Investigation History</h2>
          ${messages
            .map(
              (m) => `
            <div class="chat-bubble ${m.sender === 'user' ? 'user' : ''}">
              <strong>${m.sender === 'user' ? 'User' : 'LogSense AI'} (${m.timestamp || ''}):</strong>
              <p>${m.content.replace(/\n/g, '<br/>')}</p>
            </div>
          `
            )
            .join('')}
        `
            : ''
        }

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
