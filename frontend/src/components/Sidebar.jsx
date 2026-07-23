import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'dashboard' },
    { label: 'Upload Logs', path: '/upload', icon: 'upload_file' },
    { label: 'Log Explorer', path: '/explorer', icon: 'travel_explore' },
    { label: 'AI Analysis', path: '/analysis', icon: 'analytics' },
    { label: 'AI Chat', path: '/chat', icon: 'chat_bubble' },
  ];

  return (
    <aside className="fixed h-full w-[240px] left-0 top-0 bg-surface dark:bg-surface-dim flex flex-col border-r border-outline-variant dark:border-outline z-40">
      {/* Brand Header */}
      <div className="px-lg pt-lg pb-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
          LogSense AI
        </h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-xs">
          Premium Log Analysis
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-md py-sm space-y-sm mt-md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary font-medium'
                  : 'text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Area */}
      <div className="p-md border-t border-outline-variant/30 flex items-center gap-sm">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
          <img
            className="w-full h-full object-cover"
            alt="User Avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzTvzUGugVF_olRpHcJIbRUzuNlHd3ljUELHEu1GR3nsXhR62R9q6yOsWjQsOP7uzsLhhGUvk7ka57mQJCXlbTOOS_Od4Teug8qvEaUWayaHfoOyq5uhUy4jQjs_5X9F9FhhoMu_ckWXe23EwuoCfRhdY4C-sh6Yr3ScTcLW5agKQCcVUohps1JdQbtOvkjOpILd6t1xs-t98rB3gW_tIZYQ9nhyOQ9pmHJibG2nXyIUjRgmM5YqSAgZQZDIy2_4ROBbJSMFUpq5E"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body-sm text-body-sm truncate text-on-surface font-medium">Alex Dev</p>
          <p className="font-label-caps text-[10px] truncate text-on-surface-variant opacity-75">alex@company.com</p>
        </div>
      </div>
    </aside>
  );
}
