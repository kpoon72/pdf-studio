import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePDFStore } from '../../store/pdfStore';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLoading, loadingMessage } = usePDFStore();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-6 py-2.5 bg-white dark:bg-gray-900">
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} KPoon. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Global loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
            <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
              {loadingMessage || 'Processing…'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
