import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Merge from './pages/Merge';
import Split from './pages/Split';
import Editor from './pages/Editor';
import Organizer from './pages/Organizer';
import Sign from './pages/Sign';
import Convert from './pages/Convert';
import { usePDFStore } from './store/pdfStore';

const App: React.FC = () => {
  const { theme } = usePDFStore();

  // Apply theme class on mount and changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Restore theme from localStorage on first load
  useEffect(() => {
    const saved = localStorage.getItem('pdf-studio-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#a855f7', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="merge" element={<Merge />} />
          <Route path="split" element={<Split />} />
          <Route path="editor" element={<Editor />} />
          <Route path="organize" element={<Organizer />} />
          <Route path="sign" element={<Sign />} />
          <Route path="convert" element={<Convert />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
