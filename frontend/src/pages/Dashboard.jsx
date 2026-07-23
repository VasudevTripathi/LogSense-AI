import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getDashboard();
      if (response.data && response.data.status === 'success') {
        setData(response.data.data);
      } else {
        setError('Unexpected server response format.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Unable to load dashboard.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();

    const handleLogsUpdated = () => {
      fetchDashboardMetrics();
    };

    window.addEventListener('logs-updated', handleLogsUpdated);
    return () => {
      window.removeEventListener('logs-updated', handleLogsUpdated);
    };
  }, [fetchDashboardMetrics]);

  // Color mapping for log level pie chart
  const LEVEL_COLORS = {
    INFO: '#3b82f6',
    WARN: '#f59e0b',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    ERR: '#ef4444',
    CRITICAL: '#dc2626',
    FATAL: '#991b1b',
    DEBUG: '#8b5cf6',
    TRACE: '#a855f7',
    UNKNOWN: '#64748b',
  };

  const getColorForLevel = (levelName) => {
    const key = (levelName || '').toUpperCase();
    return LEVEL_COLORS[key] || '#64748b';
  };

  // Helper for status badge
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

  // Transform backend log_level_distribution for Recharts
  const pieChartData = React.useMemo(() => {
    if (!data?.log_level_distribution) return [];
    return Object.entries(data.log_level_distribution).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }));
  }, [data]);

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Dashboard</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Overview of your system health and log metrics.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={() => navigate('/analysis')}
            className="font-label-md text-label-md px-md py-sm bg-surface-container-lowest text-primary border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">analytics</span>
            Analyze Logs
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="font-label-md text-label-md px-md py-sm bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-sm flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">upload_file</span>
            Upload Logs
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="space-y-lg animate-pulse">
          {/* Skeleton Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-md h-28 flex flex-col justify-between">
                <div className="h-4 bg-surface-container rounded w-1/3"></div>
                <div className="h-8 bg-surface-container rounded w-1/2"></div>
              </div>
            ))}
          </div>
          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-md h-72"></div>
            <div className="bg-surface-container-lowest rounded-xl p-md h-72 lg:col-span-2"></div>
          </div>
          {/* Skeleton Table */}
          <div className="bg-surface-container-lowest rounded-xl h-64 p-md"></div>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-error-container/20 border border-error/30 rounded-xl p-lg flex flex-col items-center justify-center text-center space-y-md my-xl">
          <div className="w-12 h-12 rounded-full bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-headline-lg">error</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Unable to load dashboard.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-md">{error}</p>
          </div>
          <button
            onClick={fetchDashboardMetrics}
            className="px-lg py-sm font-label-md text-label-md bg-error text-on-error rounded-lg hover:brightness-110 transition-all flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">refresh</span>
            Retry
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && data && data.total_logs === 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl flex flex-col items-center justify-center text-center space-y-md my-lg shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
          </div>
          <div className="max-w-md">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">No log file uploaded yet.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Upload an application log file (.log, .txt, .csv) to view total log volume, failure timelines, log level distributions, and AI root cause analysis.
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-xl py-sm font-label-md text-label-md bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-md flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-md">upload_file</span>
            Upload Log File
          </button>
        </div>
      )}

      {/* POPULATED DASHBOARD METRICS */}
      {!loading && !error && data && data.total_logs > 0 && (
        <>
          {/* Summary Cards Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {/* Total Logs */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Total Logs</span>
                <span className="material-symbols-outlined text-outline text-body-lg">receipt_long</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-display-lg text-display-lg text-on-surface">
                  {data.total_logs.toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Errors */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between border-l-4 border-error">
              <div className="flex items-start justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Errors</span>
                <span className="material-symbols-outlined text-error text-body-lg">error</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-display-lg text-display-lg text-on-surface">
                  {(data.errors ?? data.error_count ?? 0).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Warnings */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between border-l-4 border-tertiary-container">
              <div className="flex items-start justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Warnings</span>
                <span className="material-symbols-outlined text-tertiary text-body-lg">warning</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-display-lg text-display-lg text-on-surface">
                  {(data.warnings ?? data.warning_count ?? 0).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Active Services */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Active Services</span>
                <span className="material-symbols-outlined text-outline text-body-lg">memory</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-display-lg text-display-lg text-on-surface">
                  {(data.unique_services ?? 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            {/* Log Level Distribution */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 lg:col-span-1 flex flex-col">
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Log Level Distribution</h4>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForLevel(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {data.total_logs > 1000 ? `${(data.total_logs / 1000).toFixed(1)}k` : data.total_logs}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">Total</span>
                  </div>
                </div>

                {/* Level Distribution Legend */}
                <div className="w-full flex flex-col gap-sm mt-md">
                  {pieChartData.map((item) => {
                    const pct = data.total_logs > 0 ? ((item.value / data.total_logs) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.name} className="flex items-center justify-between font-body-sm text-body-sm">
                        <div className="flex items-center gap-xs">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getColorForLevel(item.name) }}
                          ></div>
                          <span className="capitalize">{item.name}</span>
                        </div>
                        <span className="text-on-surface-variant font-mono">{pct}% ({item.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error Timeline / Logs Over Time */}
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-lg">
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Log Timeline & Failure Rate</h4>
                <div className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Total Logs
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444] ml-sm"></span> Errors
                </div>
              </div>

              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.logs_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradient-total" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradient-errors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="timestamp" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area type="monotone" dataKey="count" name="Total Logs" stroke="#3b82f6" fillOpacity={1} fill="url(#gradient-total)" />
                    <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" fillOpacity={1} fill="url(#gradient-errors)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Services Bar Chart */}
          {data.top_services && data.top_services.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1">
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-md">Top Services by Volume</h4>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.top_services}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="service" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="count" name="Log Count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Logs Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow-level-1 overflow-hidden">
            <div className="p-md border-b border-surface-variant flex items-center justify-between">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Recent Errors</h4>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Showing latest {data.recent_errors?.length || 0} critical/error logs
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    <th className="py-sm px-md font-medium">Timestamp</th>
                    <th className="py-sm px-md font-medium">Level</th>
                    <th className="py-sm px-md font-medium">Service</th>
                    <th className="py-sm px-md font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="font-mono-code text-mono-code text-on-surface divide-y divide-surface-variant">
                  {data.recent_errors && data.recent_errors.length > 0 ? (
                    data.recent_errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                        <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">{err.timestamp || 'N/A'}</td>
                        <td className="py-sm px-md whitespace-nowrap">{renderLevelBadge(err.level)}</td>
                        <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">{err.service || 'unknown'}</td>
                        <td className="py-sm px-md truncate max-w-[400px]">{err.message}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-md px-md text-center text-on-surface-variant">
                        No recent error logs detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
