import React from 'react';

export default function Dashboard() {
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
          <button className="font-label-md text-label-md px-md py-sm bg-surface-container-lowest text-primary border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-xs cursor-pointer">
            <span className="material-symbols-outlined text-body-md">analytics</span>
            Analyze Logs
          </button>
          <button className="font-label-md text-label-md px-md py-sm bg-primary-container text-on-primary-container rounded-lg hover:brightness-95 transition-all shadow-sm flex items-center gap-xs cursor-pointer">
            <span className="material-symbols-outlined text-body-md">upload_file</span>
            Upload Logs
          </button>
        </div>
      </div>

      {/* Summary Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Total Logs */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Total Logs</span>
            <span className="material-symbols-outlined text-outline text-body-lg">receipt_long</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="font-display-lg text-display-lg text-on-surface">24.5k</h3>
            <span className="font-label-md text-label-md text-[#4ade80] bg-[#14532d] px-xs rounded-full flex items-center">
              <span className="material-symbols-outlined text-[10px]">arrow_upward</span> 12%
            </span>
          </div>
        </div>

        {/* Errors */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between border-l-4 border-error">
          <div className="flex items-start justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Errors</span>
            <span className="material-symbols-outlined text-error text-body-lg">error</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="font-display-lg text-display-lg text-on-surface">124</h3>
            <span className="font-label-md text-label-md text-error bg-error-container text-on-error-container px-xs rounded-full flex items-center">
              <span className="material-symbols-outlined text-[10px]">arrow_upward</span> 5%
            </span>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between border-l-4 border-tertiary-container">
          <div className="flex items-start justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Warnings</span>
            <span className="material-symbols-outlined text-tertiary text-body-lg">warning</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="font-display-lg text-display-lg text-on-surface">450</h3>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-xs rounded-full flex items-center">
              <span className="material-symbols-outlined text-[10px]">remove</span> 0%
            </span>
          </div>
        </div>

        {/* Active Services */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Active Services</span>
            <span className="material-symbols-outlined text-outline text-body-lg">memory</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="font-display-lg text-display-lg text-on-surface">8</h3>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Log Level Distribution */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 lg:col-span-1 flex flex-col">
          <h4 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Log Level Distribution</h4>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="doughnut-chart mb-lg">
              <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                <span className="font-headline-sm text-headline-sm text-on-surface">24.5k</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Total</span>
              </div>
            </div>
            <div className="w-full flex flex-col gap-sm">
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-primary-container"></div> Info
                </div>
                <span className="text-on-surface-variant">65%</span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-tertiary-container"></div> Warning
                </div>
                <span className="text-on-surface-variant">20%</span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-error"></div> Error
                </div>
                <span className="text-on-surface-variant">15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Timeline */}
        <div className="bg-surface-container-lowest rounded-xl p-md ambient-shadow-level-1 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-lg">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Error Timeline</h4>
            <select className="bg-surface-container-low border border-outline-variant rounded-md font-label-md text-label-md px-sm py-xs text-on-surface-variant outline-none focus:border-primary-container">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="flex-1 relative w-full h-48 border-b border-l border-outline-variant/30 flex items-end pt-md">
            {/* Y-axis labels */}
            <div className="absolute left-[-24px] top-0 bottom-0 flex flex-col justify-between text-[10px] text-outline py-xs">
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            {/* SVG Line Chart */}
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path
                d="M0,35 L10,30 L20,38 L30,20 L40,25 L50,10 L60,15 L70,5 L80,20 L90,12 L100,25 L100,40 L0,40 Z"
                fill="url(#gradient-error)"
                opacity="0.1"
              ></path>
              <path
                d="M0,35 L10,30 L20,38 L30,20 L40,25 L50,10 L60,15 L70,5 L80,20 L90,12 L100,25"
                fill="none"
                stroke="#ffb4ab"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="0.5"
              ></path>
              <defs>
                <linearGradient id="gradient-error" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffb4ab"></stop>
                  <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-outline">
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow-level-1 overflow-hidden">
        <div className="p-md border-b border-surface-variant flex items-center justify-between">
          <h4 className="font-headline-sm text-headline-sm text-on-surface">Recent Logs</h4>
          <button className="font-label-md text-label-md text-primary hover:underline cursor-pointer">View All</button>
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
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">2023-10-27 14:32:01</td>
                <td className="py-sm px-md whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-label-md bg-error-container text-on-error-container">
                    ERROR
                  </span>
                </td>
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">payment-gateway</td>
                <td className="py-sm px-md truncate max-w-[400px]">Connection timed out while waiting for response from Stripe API.</td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">2023-10-27 14:31:45</td>
                <td className="py-sm px-md whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-label-md bg-tertiary-container text-on-tertiary-container">
                    WARN
                  </span>
                </td>
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">auth-service</td>
                <td className="py-sm px-md truncate max-w-[400px]">High number of failed login attempts detected for user ID 8912.</td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">2023-10-27 14:30:12</td>
                <td className="py-sm px-md whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary-container">
                    INFO
                  </span>
                </td>
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">user-profile</td>
                <td className="py-sm px-md truncate max-w-[400px]">Successfully updated avatar settings for session token a7x...</td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">2023-10-27 14:28:55</td>
                <td className="py-sm px-md whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary-container">
                    INFO
                  </span>
                </td>
                <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">database-cluster</td>
                <td className="py-sm px-md truncate max-w-[400px]">Routine garbage collection completed in 45ms. Freed 1.2GB.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
