import React, { useEffect } from 'react';
import { ensureClientId } from '../lib/clientId';
import "../styles/globals.css";
import Script from "next/script";
import '../lib/env'; // Validate environment variables

function MyApp({ Component, pageProps }) {
  useEffect(() => { ensureClientId(); }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: event.message,
            source: event.filename,
            line: event.lineno,
            col: event.colno,
            error: event.error?.stack,
          }),
        });
      });
    }
  }, []);

   return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-ZGGM64VWRQ"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZGGM64VWRQ', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
