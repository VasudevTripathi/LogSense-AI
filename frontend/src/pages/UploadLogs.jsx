import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';

export default function UploadLogs() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('All Levels');

  const fileInputRef = useRef(null);

  const ALLOWED_EXTENSIONS = ['.log', '.txt', '.csv'];
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const validateAndSetFile = (file) => {
    setValidationError(null);
    if (!file) return;

    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setValidationError(`Unsupported file type "${fileExt}". Please upload a .log, .txt, or .csv file.`);
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setValidationError(`File size exceeds 10 MB limit (${sizeMB} MB). Please select a smaller log file.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    validateAndSetFile(file);
  };

  const handleParseLogs = async () => {
    if (!selectedFile) {
      setValidationError('Please select or drop a valid log file first.');
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await apiService.uploadLogs(formData);
      if (response.data && response.data.status === 'success') {
        setParseResult(response.data);
        window.dispatchEvent(new CustomEvent('logs-updated'));
      } else {
        setValidationError('Unexpected server response format.');
      }
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Failed to parse logs.';
      setValidationError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  const handleClearUpload = () => {
    setSelectedFile(null);
    setParseResult(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Level badge helper matching Stitch design
  const renderLevelBadge = (level) => {
    const lvl = (level || 'INFO').toUpperCase();
    if (lvl === 'ERROR') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-error/10 text-error border border-error/20">
          ERROR
        </span>
      );
    }
    if (lvl === 'WARN' || lvl === 'WARNING') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          WARN
        </span>
      );
    }
    if (lvl === 'INFO') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
          INFO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-bright text-outline border border-outline-variant/50">
        {lvl}
      </span>
    );
  };

  // Filter preview records
  const filteredPreview = (parseResult?.preview || []).filter((entry) => {
    if (selectedLevelFilter === 'All Levels') return true;
    const lvl = (entry.level || '').toUpperCase();
    if (selectedLevelFilter === 'ERROR') return lvl === 'ERROR';
    if (selectedLevelFilter === 'WARNING') return lvl === 'WARN' || lvl === 'WARNING';
    if (selectedLevelFilter === 'INFO') return lvl === 'INFO';
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-xl">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".log,.txt,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Upload Logs</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm max-w-2xl">
          Upload application log files for parsing and AI-powered analysis.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-error-container/20 border border-error/30 rounded-xl p-md flex items-center justify-between text-error animate-fade-in-up">
          <div className="flex items-center gap-sm font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-error">error</span>
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-error hover:opacity-80 p-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-surface-container-low border rounded-xl p-lg relative overflow-hidden group transition-all cursor-pointer ${
          isDragOver
            ? 'border-primary bg-surface-container/60 shadow-lg shadow-primary/10'
            : 'border-outline-variant/30 hover:border-outline-variant/60'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <div className="border-2 border-dashed border-outline-variant/50 rounded-lg p-xl flex flex-col items-center justify-center text-center bg-surface-container/30 transition-colors hover:bg-surface-container/50 hover:border-primary/50">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant/30 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_upload
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md font-medium text-on-surface">
            {selectedFile ? selectedFile.name : 'Drop your log files here'}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            {selectedFile
              ? `Selected file size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
              : 'or click to browse'}
          </p>
          <div className="mt-lg flex flex-wrap gap-sm justify-center text-on-surface-variant font-label-caps text-label-caps">
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.log</span>
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.txt</span>
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.csv</span>
            <span className="px-sm py-xs text-outline ml-sm flex items-center">Max size 10 MB</span>
          </div>
          <div className="mt-xl flex gap-md">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-lg py-sm font-body-sm text-body-sm font-medium border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors active:scale-95 cursor-pointer"
            >
              Choose File
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                handleParseLogs();
              }}
              className="px-lg py-sm font-body-sm text-body-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-primary-container transition-colors active:scale-95 shadow-sm shadow-[#3b82f6]/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: File Information & Log Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        {/* Left Column: File Info */}
        <div className="lg:col-span-1 space-y-sm">
          <h4 className="font-label-caps text-label-caps text-outline-variant mb-md px-xs">Current Upload Status</h4>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex items-center gap-md">
            <span className="material-symbols-outlined text-outline-variant p-sm bg-surface-container rounded-lg">description</span>
            <div className="min-w-0 flex-1">
              <p className="font-label-caps text-label-caps text-outline">File Name</p>
              <p className="font-body-sm text-body-sm text-on-surface truncate mt-xs">
                {selectedFile ? selectedFile.name : parseResult ? parseResult.filename : 'No file uploaded'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex flex-col justify-center">
              <p className="font-label-caps text-label-caps text-outline mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">hard_drive</span> Size
              </p>
              <p className="font-body-lg text-body-lg text-on-surface">
                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '--'}
              </p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex flex-col justify-center">
              <p className="font-label-caps text-label-caps text-outline mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">schedule</span> Time
              </p>
              <p className="font-body-lg text-body-lg text-on-surface">
                {selectedFile ? new Date(selectedFile.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
              </p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex items-center justify-between">
            <div>
              <p className="font-label-caps text-label-caps text-outline">Total Entries</p>
              <p className="font-headline-md text-headline-md text-on-surface font-semibold mt-xs">
                {parseResult ? parseResult.total_logs.toLocaleString() : selectedFile ? 'Ready to parse' : '0'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-label-caps text-label-caps text-outline">Status</p>
              <div className="mt-xs flex items-center gap-xs bg-primary/10 border border-primary/20 px-sm py-xs rounded-full">
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : parseResult ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                <span className="font-label-caps text-label-caps text-primary text-[10px]">
                  {loading ? 'PARSING...' : parseResult ? 'PARSED' : selectedFile ? 'READY' : 'EMPTY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Log Preview Table */}
        <div className="lg:col-span-3 bg-surface-container-low border border-outline-variant/30 rounded-xl flex flex-col overflow-hidden h-[500px]">
          <div className="p-sm border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-md bg-surface-container/50">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-outline-variant ml-sm">table_rows</span>
              <h4 className="font-body-sm text-body-sm font-medium text-on-surface">Log Preview</h4>
              <span className="font-label-caps text-label-caps text-outline bg-surface-container px-xs py-[2px] rounded border border-outline-variant/20 ml-xs">
                {parseResult ? `Top ${filteredPreview.length} of ${parseResult.total_logs}` : 'Top 20'}
              </span>
            </div>
            <div className="flex items-center gap-sm flex-1 md:flex-none justify-end">
              <div className="relative w-full md:w-48">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline-variant text-[16px]">filter_list</span>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-xs pl-xl pr-sm font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 appearance-none h-8 cursor-pointer"
                >
                  <option>All Levels</option>
                  <option>ERROR</option>
                  <option>WARNING</option>
                  <option>INFO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#0f172a]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container border-b border-outline-variant/50 shadow-sm z-10">
                <tr>
                  <th className="font-label-caps text-label-caps text-outline-variant py-sm px-md w-40">Timestamp</th>
                  <th className="font-label-caps text-label-caps text-outline-variant py-sm px-md w-24">Level</th>
                  <th className="font-label-caps text-label-caps text-outline-variant py-sm px-md w-48">Service</th>
                  <th className="font-label-caps text-label-caps text-outline-variant py-sm px-md">Message</th>
                </tr>
              </thead>
              <tbody className="font-code-sm text-code-sm text-on-surface-variant divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-xl text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-sm">
                        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                        <span>Parsing log file...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPreview.length > 0 ? (
                  filteredPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-primary-container/5 transition-colors group">
                      <td className="py-xs px-md whitespace-nowrap text-outline">{row.timestamp || '--'}</td>
                      <td className="py-xs px-md">{renderLevelBadge(row.level)}</td>
                      <td className="py-xs px-md text-secondary truncate max-w-[12rem]">{row.service || '--'}</td>
                      <td className="py-xs px-md text-on-surface font-medium truncate max-w-xl group-hover:text-primary-fixed transition-colors">
                        {row.message}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-xl text-center text-on-surface-variant">
                      {parseResult
                        ? 'No log entries match the selected filter.'
                        : 'No log preview available. Select a file and click "Parse Logs".'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end items-center gap-md pt-md border-t border-outline-variant/20 pb-xl">
        <button
          onClick={handleClearUpload}
          className="px-lg py-sm font-body-sm text-body-sm font-medium border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors active:scale-95 flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span> Clear Upload
        </button>
        <button
          disabled={loading || !selectedFile}
          onClick={handleParseLogs}
          className="px-xl py-sm font-body-sm text-body-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-primary-container transition-colors active:scale-95 shadow-sm shadow-[#3b82f6]/20 flex items-center gap-xs group cursor-pointer disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`}>
            {loading ? 'sync' : 'bolt'}
          </span>
          {loading ? 'Parsing...' : 'Parse Logs'}
        </button>
      </div>
    </div>
  );
}
