// pages/thank-you.js

import React from "react";
import Link from "next/link";

export default function ThankYou() {
  return (
    <div
      style={{
        backgroundColor: "#e8f5e9",
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
      <h1 style={{ fontSize: "2.5rem", color: "#2e7d32", marginBottom: "1rem" }}>
        ✅ Thank You!
      </h1>
      <p style={{ fontSize: "1.25rem", maxWidth: "600px", marginBottom: "2rem" }}>
        Your order has been received. Our team is reviewing your submission, and your content will be created shortly. You'll receive a confirmation email when it's ready for review.
      </p>
      <Link href="/" passHref>
        <button
          style={{
            backgroundColor: "#43a047",
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
