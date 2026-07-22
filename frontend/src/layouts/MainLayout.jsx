import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col ml-[240px] h-full overflow-hidden bg-background">
        {/* Top Header */}
        <Header />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-lg pb-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
