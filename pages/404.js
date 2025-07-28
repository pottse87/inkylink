// pages/404.js

import React from "react";
import Link from "next/link";

export default function Custom404() {
  return (
    <div
      style={{
        backgroundColor: "#fff3e0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Lato, sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "3rem", color: "#ef6c00", marginBottom: "1rem" }}>
        ⚠️ 404: Page Not Found
      </h1>
      <p style={{ fontSize: "1.25rem", maxWidth: "600px", marginBottom: "2rem" }}>
        Oops! The page you're looking for doesn't exist. Maybe it moved — or maybe it never existed at all.
      </p>
      <Link href="/" passHref>
        <button
          style={{
            backgroundColor: "#fb8c00",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Back to Homepage
        </button>
      </Link>
    </div>
  );
}
