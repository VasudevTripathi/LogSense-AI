import React from 'react';

export default function UploadLogs() {
  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-xl">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Upload Logs</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm max-w-2xl">
          Upload application log files for parsing and AI-powered analysis.
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-lg relative overflow-hidden group hover:border-outline-variant/60 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <div className="border-2 border-dashed border-outline-variant/50 rounded-lg p-xl flex flex-col items-center justify-center text-center bg-surface-container/30 transition-colors hover:bg-surface-container/50 hover:border-primary/50 cursor-pointer group-hover:border-primary/50 group-hover:bg-surface-container/50">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant/30 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_upload
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md font-medium text-on-surface">Drop your log files here</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">or click to browse</p>
          <div className="mt-lg flex flex-wrap gap-sm justify-center text-on-surface-variant font-label-caps text-label-caps">
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.log</span>
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.txt</span>
            <span className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-md">.csv</span>
            <span className="px-sm py-xs text-outline ml-sm flex items-center">Max size 100 MB</span>
          </div>
          <div className="mt-xl flex gap-md">
            <button className="px-lg py-sm font-body-sm text-body-sm font-medium border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors active:scale-95 cursor-pointer">
              Choose File
            </button>
            <button className="px-lg py-sm font-body-sm text-body-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-primary-container transition-colors active:scale-95 shadow-sm shadow-[#3b82f6]/20 cursor-pointer">
              Upload
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
              <p className="font-body-sm text-body-sm text-on-surface truncate mt-xs">api-production-gateway-2023-10-27.log</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex flex-col justify-center">
              <p className="font-label-caps text-label-caps text-outline mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">hard_drive</span> Size
              </p>
              <p className="font-body-lg text-body-lg text-on-surface">14.2 MB</p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex flex-col justify-center">
              <p className="font-label-caps text-label-caps text-outline mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">schedule</span> Time
              </p>
              <p className="font-body-lg text-body-lg text-on-surface">10:42 AM</p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md flex items-center justify-between">
            <div>
              <p className="font-label-caps text-label-caps text-outline">Total Entries</p>
              <p className="font-headline-md text-headline-md text-on-surface font-semibold mt-xs">4,892</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-label-caps text-label-caps text-outline">Status</p>
              <div className="mt-xs flex items-center gap-xs bg-primary/10 border border-primary/20 px-sm py-xs rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-primary text-[10px]">PARSED</span>
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
              <span className="font-label-caps text-label-caps text-outline bg-surface-container px-xs py-[2px] rounded border border-outline-variant/20 ml-xs">Top 20</span>
            </div>
            <div className="flex items-center gap-sm flex-1 md:flex-none justify-end">
              <div className="relative w-full md:w-48">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline-variant text-[16px]">filter_list</span>
                <select className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-xs pl-xl pr-sm font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 appearance-none h-8">
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
                <tr className="hover:bg-primary-container/5 transition-colors group">
                  <td className="py-xs px-md whitespace-nowrap text-outline">10:42:01.123</td>
                  <td className="py-xs px-md">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-error/10 text-error border border-error/20">ERROR</span>
                  </td>
                  <td className="py-xs px-md text-secondary truncate max-w-[12rem]">auth-service</td>
                  <td className="py-xs px-md text-on-surface font-medium truncate max-w-xl group-hover:text-primary-fixed transition-colors">Failed to authenticate user: Token expired</td>
                </tr>
                <tr className="hover:bg-primary-container/5 transition-colors group">
                  <td className="py-xs px-md whitespace-nowrap text-outline">10:42:01.089</td>
                  <td className="py-xs px-md">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">WARN</span>
                  </td>
                  <td className="py-xs px-md text-secondary truncate max-w-[12rem]">database-pool</td>
                  <td className="py-xs px-md text-on-surface truncate max-w-xl">Connection pool approaching limits (85% utilization)</td>
                </tr>
                <tr className="hover:bg-primary-container/5 transition-colors group">
                  <td className="py-xs px-md whitespace-nowrap text-outline">10:42:00.950</td>
                  <td className="py-xs px-md">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">INFO</span>
                  </td>
                  <td className="py-xs px-md text-secondary truncate max-w-[12rem]">api-gateway</td>
                  <td className="py-xs px-md text-on-surface truncate max-w-xl">Request processed successfully in 42ms [GET /api/v1/users]</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end items-center gap-md pt-md border-t border-outline-variant/20 pb-xl">
        <button className="px-lg py-sm font-body-sm text-body-sm font-medium border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors active:scale-95 flex items-center gap-xs cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">delete</span> Clear Upload
        </button>
        <button className="px-xl py-sm font-body-sm text-body-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-primary-container transition-colors active:scale-95 shadow-sm shadow-[#3b82f6]/20 flex items-center gap-xs group cursor-pointer">
          <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">bolt</span> Parse Logs
        </button>
      </div>
    </div>
  );
}
