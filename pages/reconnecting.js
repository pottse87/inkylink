import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Reconnecting() {
  const [dots, setDots] = useState('');
  const retryDelay = 3000; // 3 seconds

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 1000);

    const retryTimeout = setTimeout(() => {
      window.location.reload();
    }, retryDelay);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div style={{
      fontFamily: 'Lato, sans-serif',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <Head>
        <title>Reconnecting... - Inkylink</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <h1 style={{ marginBottom: '1rem' }}>Reconnecting{dots}</h1>
      <p>Attempting to restore connection to the server...</p>
    </div>
  );
}
