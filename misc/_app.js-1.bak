import React, { useEffect, useState } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [maintenance, setMaintenance] = useState(false);
  const [allowedPages, setAllowedPages] = useState([]);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {useEffect(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || ''
        })
      });
    });
  }
}, []);
    let ws;
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:3002');
      ws.onopen = () => {
        console.log('🔌 Connected to maintenance server');
        if (currentPath === '/reconnecting') {
          window.location.href = '/';
        }
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'status') {
            setMaintenance(data.maintenance);
            setAllowedPages(data.allowedPages || []);
          }
        } catch (err) {
          console.error('❌ WS Message Error:', err);
        }
      };
      ws.onclose = () => {
        console.warn('⚠️ WS Disconnected. Redirecting to reconnecting page...');
        if (maintenance) {
          window.location.href = '/maintenance';
        } else {
          window.location.href = '/reconnecting';
        }
        setTimeout(connectWS, 3000);
      };
    };
    connectWS();
  }, []);

  if (maintenance && !allowedPages.includes(currentPath)) {
    if (currentPath !== '/maintenance') {
      if (typeof window !== 'undefined') window.location.href = '/maintenance';
    }
  }

  return <Component {...pageProps} />;
}

export default MyApp;

