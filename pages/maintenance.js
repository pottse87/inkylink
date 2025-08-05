import React from 'react';
import Head from 'next/head';

export default function Maintenance() {
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
        <title>Maintenance Mode - Inkylink</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <img src="/favicon.png" alt="Inkylink Logo" width="120" height="120" />
      <h1>We'll be back soon!</h1>
      <p>Inkylink is currently undergoing scheduled maintenance.<br/>Please check back later.</p>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>Contact us: inkylink.home@gmail.com</p>
    </div>
  );
}
