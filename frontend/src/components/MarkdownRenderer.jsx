import React, { useState } from 'react';

/**
 * Custom CodeBlock component with language badge and copy functionality
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-sm rounded-lg border border-outline-variant/60 bg-[#020617] overflow-hidden shadow-inner">
      <div className="flex items-center justify-between px-md py-xs bg-surface-container-highest/80 border-b border-outline-variant/40 text-on-surface-variant font-code-sm text-[12px]">
        <span className="font-semibold uppercase tracking-wider text-primary">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-xs px-2 py-0.5 rounded hover:bg-surface-container transition-colors text-on-surface hover:text-primary cursor-pointer"
          title="Copy code snippet"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-md font-code-sm text-code-sm text-on-surface overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Custom Table component with dark styling
 */
function TableBlock({ rows }) {
  if (!rows || rows.length === 0) return null;
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  return (
    <div className="my-md overflow-x-auto rounded-lg border border-outline-variant/60">
      <table className="w-full text-left font-body-sm text-body-sm border-collapse">
        <thead>
          <tr className="bg-surface-container-high border-b border-outline-variant text-on-surface font-semibold">
            {headerRow.map((cell, i) => (
              <th key={i} className="px-md py-sm border-r border-outline-variant/30 last:border-r-0">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-high/50 transition-colors odd:bg-surface-container/30"
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-md py-sm border-r border-outline-variant/30 last:border-r-0 text-on-surface-variant">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Inline text formatting for bold, italic, code tags
 */
function renderFormattedText(text) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    let match = null;
    let type = null;

    if (codeMatch && boldMatch) {
      if (codeMatch.index <= boldMatch.index) {
        match = codeMatch;
        type = 'code';
      } else {
        match = boldMatch;
        type = 'bold';
      }
    } else if (codeMatch) {
      match = codeMatch;
      type = 'code';
    } else if (boldMatch) {
      match = boldMatch;
      type = 'bold';
    }

    if (!match) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    if (type === 'code') {
      parts.push(
        <code
          key={key++}
          className="font-code-sm bg-surface-container-lowest text-primary px-1.5 py-0.5 rounded border border-outline-variant/50 text-[13px]"
        >
          {match[1]}
        </code>
      );
    } else if (type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-on-surface">
          {match[1]}
        </strong>
      );
    }

    remaining = remaining.substring(match.index + match[0].length);
  }

  return parts;
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Blocks ```
    if (line.trim().startsWith('```')) {
      const language = line.trim().replace(/^```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <CodeBlock key={`code-${i}`} language={language} code={codeLines.join('\n')} />
      );
      i++;
      continue;
    }

    // Markdown Table parsing (| header | header |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const rowText = lines[i].trim();
        if (!/^\|[\s\-:|]+\|$/.test(rowText)) {
          const cells = rowText
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push(<TableBlock key={`table-${i}`} rows={tableRows} />);
      }
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={`h1-${i}`} className="font-headline-md text-headline-md font-bold text-on-surface mt-md mb-xs">
          {renderFormattedText(line.replace(/^#\s+/, ''))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${i}`} className="font-headline-sm text-headline-sm font-semibold text-on-surface mt-md mb-xs border-b border-outline-variant/40 pb-xs">
          {renderFormattedText(line.replace(/^##\s+/, ''))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className="font-body-lg text-body-lg font-semibold text-primary mt-sm mb-xs">
          {renderFormattedText(line.replace(/^###\s+/, ''))}
        </h3>
      );
      i++;
      continue;
    }

    // Unordered Bullet lists (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-sm text-on-surface-variant">
          {listItems.map((item, idx) => (
            <li key={idx} className="font-body-md leading-relaxed">
              {renderFormattedText(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists (1., 2.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-sm text-on-surface-variant">
          {listItems.map((item, idx) => (
            <li key={idx} className="font-body-md leading-relaxed">
              {renderFormattedText(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Standard Paragraph
    blocks.push(
      <p key={`p-${i}`} className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant my-xs">
        {renderFormattedText(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-xs">{blocks}</div>;
}
