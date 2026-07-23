import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export default function LogExplorer() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [uploadIdFilter, setUploadIdFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');

  // Metadata dropdown options
  const [availableServices, setAvailableServices] = useState([]);
  const [availableUploadIds, setAvailableUploadIds] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch filter metadata (services and upload_ids)
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await apiService.getLogMetadata();
      if (response.data && response.data.status === 'success') {
        setAvailableServices(response.data.services || []);
        setAvailableUploadIds(response.data.upload_ids || []);
      }
    } catch {
      // Non-critical background fetch failure
    }
  }, []);

  // Main fetch logs function
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        sort: sortOrder,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (levelFilter !== 'ALL') params.level = levelFilter;
      if (serviceFilter !== 'ALL') params.service = serviceFilter;
      if (uploadIdFilter !== 'ALL') params.upload_id = uploadIdFilter;

      const response = await apiService.getLogs(params);
      if (response.data && response.data.status === 'success') {
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.pages || 0);
      } else {
        setError('Unexpected server response format.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load logs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, levelFilter, serviceFilter, uploadIdFilter, sortOrder]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Clear all active filters
  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setLevelFilter('ALL');
    setServiceFilter('ALL');
    setUploadIdFilter('ALL');
    setSortOrder('desc');
    setPage(1);
  };

  // Copy log message to clipboard
  const handleCopyMessage = (logId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(logId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle inline row expansion
  const toggleRowExpand = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  // Level Badge Renderer
  const renderLevelBadge = (level) => {
    const lvl = (level || 'INFO').toUpperCase();
    if (lvl === 'ERROR' || lvl === 'ERR' || lvl === 'CRITICAL' || lvl === 'FATAL') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-label-md text-label-md bg-error-container text-on-error-container">
          {lvl}
        </span>
      );
    }
    if (lvl === 'WARN' || lvl === 'WARNING') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-label-md text-label-md bg-tertiary-container text-on-tertiary-container">
          {lvl}
        </span>
      );
    }
    if (lvl === 'INFO') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-label-md text-label-md bg-secondary-container text-on-secondary-container">
          INFO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded font-label-md text-label-md bg-surface-container text-on-surface-variant">
        {lvl}
      </span>
    );
  };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Log Explorer</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Browse, search, filter, and inspect ingested application logs.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={fetchLogs}
            className="font-label-md text-label-md px-md py-sm bg-surface-container-lowest text-primary border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-body-md ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md ambient-shadow-level-1 space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-md">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message, service, or level..."
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg py-xs pl-xl pr-xl font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none h-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-sm top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface text-sm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none h-10 cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">ERROR / CRITICAL</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none h-10 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              {availableServices.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none h-10 cursor-pointer"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Secondary Row */}
        <div className="flex flex-wrap items-center justify-between gap-md pt-xs border-t border-outline-variant/20">
          <div className="flex items-center gap-sm flex-wrap">
            {availableUploadIds.length > 0 && (
              <div className="flex items-center gap-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Upload ID:</span>
                <select
                  value={uploadIdFilter}
                  onChange={(e) => {
                    setUploadIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-surface-container-low border border-outline-variant/50 rounded-md px-sm py-xs font-label-md text-label-md text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="ALL">All Uploads</option>
                  {availableUploadIds.map((uid) => (
                    <option key={uid} value={uid}>
                      {uid}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-md">
            {(search || levelFilter !== 'ALL' || serviceFilter !== 'ALL' || uploadIdFilter !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="font-label-md text-label-md text-primary hover:underline flex items-center gap-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                Clear Filters
              </button>
            )}
            <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-sm py-xs rounded border border-outline-variant/30">
              Total Matches: {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-error-container/20 border border-error/30 rounded-xl p-lg flex flex-col items-center justify-center text-center space-y-md my-xl">
          <div className="w-12 h-12 rounded-full bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-headline-lg">error</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Unable to load log explorer.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-md">{error}</p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-lg py-sm font-label-md text-label-md bg-error text-on-error rounded-lg hover:brightness-110 transition-all flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">refresh</span>
            Retry
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && logs.length === 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl flex flex-col items-center justify-center text-center space-y-md my-lg shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[36px]">manage_search</span>
          </div>
          <div className="max-w-md">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">No logs found.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              No stored log records matched your query terms or active filter selections.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-lg py-sm font-label-md text-label-md bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-md flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">filter_alt_off</span>
            Reset All Filters
          </button>
        </div>
      )}

      {/* LOG EXPLORER TABLE & LOADING SKELETON */}
      {(!error && (loading || logs.length > 0)) && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow-level-1 overflow-hidden border border-outline-variant/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="py-sm px-md font-medium w-44">Timestamp</th>
                  <th className="py-sm px-md font-medium w-28">Level</th>
                  <th className="py-sm px-md font-medium w-48">Service</th>
                  <th className="py-sm px-md font-medium">Message</th>
                  <th className="py-sm px-md font-medium w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="font-mono-code text-mono-code text-on-surface divide-y divide-outline-variant/20 bg-[#0f172a]">
                {loading
                  ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-md px-md"><div className="h-4 bg-surface-container rounded w-3/4"></div></td>
                        <td className="py-md px-md"><div className="h-4 bg-surface-container rounded w-1/2"></div></td>
                        <td className="py-md px-md"><div className="h-4 bg-surface-container rounded w-2/3"></div></td>
                        <td className="py-md px-md"><div className="h-4 bg-surface-container rounded w-5/6"></div></td>
                        <td className="py-md px-md"></td>
                      </tr>
                    ))
                  : logs.map((log) => {
                      const isExpanded = expandedRowId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => toggleRowExpand(log.id)}
                            className={`hover:bg-primary-container/10 transition-colors group cursor-pointer ${
                              isExpanded ? 'bg-primary-container/15' : ''
                            }`}
                          >
                            <td className="py-sm px-md text-outline whitespace-nowrap">{log.timestamp || 'N/A'}</td>
                            <td className="py-sm px-md whitespace-nowrap">{renderLevelBadge(log.level)}</td>
                            <td className="py-sm px-md text-secondary truncate max-w-[12rem]">{log.service || 'unknown'}</td>
                            <td className="py-sm px-md truncate max-w-xl text-on-surface font-medium group-hover:text-primary-fixed transition-colors">
                              {log.message}
                            </td>
                            <td className="py-sm px-md text-center text-outline-variant">
                              <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}>
                                expand_more
                              </span>
                            </td>
                          </tr>

                          {/* INLINE EXPANDED DETAILS VIEW */}
                          {isExpanded && (
                            <tr className="bg-[#090d16] border-y border-primary/20 animate-fade-in-up">
                              <td colSpan={5} className="p-md">
                                <div className="space-y-md font-sans text-body-sm text-on-surface">
                                  {/* Top Details Metadata Bar */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-sm bg-surface-container-lowest/60 p-sm rounded-lg border border-outline-variant/30">
                                    <div>
                                      <span className="font-label-caps text-[10px] text-outline block">Upload ID</span>
                                      <span className="font-mono text-xs text-primary font-semibold truncate block">{log.upload_id || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="font-label-caps text-[10px] text-outline block">Timestamp</span>
                                      <span className="font-mono text-xs text-on-surface block">{log.timestamp || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="font-label-caps text-[10px] text-outline block">Service Component</span>
                                      <span className="font-mono text-xs text-secondary font-medium block">{log.service || 'unknown'}</span>
                                    </div>
                                    <div>
                                      <span className="font-label-caps text-[10px] text-outline block">Log ID</span>
                                      <span className="font-mono text-xs text-on-surface-variant block">#{log.id}</span>
                                    </div>
                                  </div>

                                  {/* Full Raw Message View */}
                                  <div className="space-y-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-label-caps text-label-caps text-outline">Complete Log Message</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyMessage(log.id, log.message);
                                        }}
                                        className="font-label-md text-label-md text-primary hover:underline flex items-center gap-xs cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">
                                          {copiedId === log.id ? 'check' : 'content_copy'}
                                        </span>
                                        {copiedId === log.id ? 'Copied!' : 'Copy Message'}
                                      </button>
                                    </div>
                                    <div className="bg-[#020617] border border-outline-variant/40 rounded-lg p-md font-mono text-xs text-on-surface leading-relaxed break-words whitespace-pre-wrap selection:bg-primary/30">
                                      {log.message}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-md bg-surface-container-low border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-md font-body-sm text-body-sm">
            <div className="flex items-center gap-md">
              <span className="text-on-surface-variant">
                Showing {total > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total.toLocaleString()} entries
              </span>
              <div className="flex items-center gap-xs">
                <span className="font-label-caps text-label-caps text-outline">Per Page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-surface-container border border-outline-variant/50 rounded px-sm py-xs font-body-sm text-body-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-xs">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-md py-xs font-label-md text-label-md border border-outline-variant/50 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Previous
              </button>

              <span className="px-md py-xs font-label-md text-label-md text-on-surface font-semibold">
                Page {page} of {totalPages || 1}
              </span>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-md py-xs font-label-md text-label-md border border-outline-variant/50 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-xs"
              >
                Next
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
