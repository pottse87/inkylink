import React from 'react';
import Head from 'next/head';

export default function Custom500() {
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
        <title>500 - Server Error | Inkylink</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <img src="/favicon.png" alt="Inkylink Logo" width="120" height="120" />
      <h1>500 - Server Error</h1>
      <p>Something went wrong on our end. Please try again later.</p>
      <a href="/" style={{ color: '#fff', textDecoration: 'underline', marginTop: '1rem' }}>Return to Home</a>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>Contact: inkylink.home@gmail.com</p>
    </div>
  );
}
