import {StrictMode, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function RootElement() {
  const [isConnected, setIsConnected] = useState(true);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if ((import.meta as any).env?.PROD) return;

    let socket: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let attempt = 0;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}`);

      socket.onopen = () => {
        setIsConnected(true);
        setHasConnectedOnce(true);
        setReconnectAttempts(0);
        attempt = 0;
      };

      socket.onclose = () => {
        setIsConnected(false);
        attempt++;
        setReconnectAttempts(attempt);
        // Exponential backoff with jitter (max 30s)
        const baseDelay = Math.min(1000 * Math.pow(1.5, attempt), 30000);
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;
        
        retryTimeout = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (socket) {
         socket.onclose = null;
         socket.close();
      }
    };
  }, []);

  return (
    <>
      <App />
      {!isConnected && hasConnectedOnce && (
        <div className="fixed bottom-4 left-4 z-[99] flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] font-mono tracking-wide font-bold bg-rose-600/95 text-white rounded-xl shadow-2xl border border-rose-500/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-200 animate-pulse border border-rose-100" />
          <div className="flex flex-col">
            <span>Connection Dropped</span>
            <span className="text-[9px] text-rose-200/90 font-medium tracking-wider">
              RECONNECTING (ATTEMPT {reconnectAttempts})
            </span>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootElement />
  </StrictMode>,
);
