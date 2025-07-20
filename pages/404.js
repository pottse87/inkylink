// pages/404.js

import Link from "next/link";

export default function Custom404() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff4f4",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Lato, sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "5rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
        Oops! The page you're looking for doesn't exist.
      </p>

      <Link href="/">
        <button
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "8px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#005ac1")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#0070f3")}
        >
          Back to Home
        </button>
      </Link>
    </div>
  );
}
