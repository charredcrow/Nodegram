import { useEffect } from 'react';
import '../App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspacePage } from '../pages/workspace';
import { NotificationProvider } from './providers/NotificationProvider';

// Component for theme management
const AppContent = () => {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';

    const applyTheme = (themeValue: string) => {
      const root = document.documentElement;

      if (themeValue === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.setAttribute('data-theme', systemTheme);
      } else {
        root.setAttribute('data-theme', themeValue);
      }
    };

    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  return (
    <div className="container">
      <Routes>
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  if (typeof global === 'undefined') {
    (window as typeof window & { global: typeof window }).global = window;
  }

  return (
    <Router>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;
