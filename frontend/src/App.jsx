import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UploadLogs from './pages/UploadLogs';
import AIAnalysis from './pages/AIAnalysis';
import AIChat from './pages/AIChat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadLogs />} />
          <Route path="analysis" element={<AIAnalysis />} />
          <Route path="chat" element={<AIChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
