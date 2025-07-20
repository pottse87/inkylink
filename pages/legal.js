// pages/legal.js
import Link from "next/link";

export default function LegalPage() {
  return (
    <main
      style={{
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.6",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>Legal & Policies</h1>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <Link href="/privacy">
            <span style={{ color: "#0070f3", cursor: "pointer" }}>Privacy Policy</span>
          </Link>
        </li>
        <li>
          <Link href="/terms">
            <span style={{ color: "#0070f3", cursor: "pointer" }}>Terms of Service</span>
          </Link>
        </li>
        <li>
          <Link href="/404">
            <span style={{ color: "#0070f3", cursor: "pointer" }}>404 Page</span>
          </Link>
        </li>
      </ul>

      <div style={{ marginTop: "2rem" }}>
        <Link href="/">
          <button
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>
        </Link>
      </div>
    </main>
  );
}
