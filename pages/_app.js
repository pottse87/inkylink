import { useEffect } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

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

  return <Component {...pageProps} />;
}

export default MyApp;
