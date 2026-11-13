import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (failureCount >= 3) return false;
        if (!error.response) return true; // network error or timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) return true;
        const status = error.response.status;
        return status >= 500 && status <= 599;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

const ServerWakingBanner = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => setShow(e.detail?.isSlow ?? false);
    window.addEventListener('backend-slow-status', handler);
    return () => window.removeEventListener('backend-slow-status', handler);
  }, []);

  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#f59e0b',
      color: '#ffffff',
      textAlign: 'center',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      zIndex: 9999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      Server is waking up, this can take up to a minute
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServerWakingBanner />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
