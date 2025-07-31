import React from "react";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Inkylink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f1f8fc",
        fontFamily: "Lato, sans-serif",
        textAlign: "center",
        padding: "2rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <img
            src="/logo.png"
            alt="Inkylink Logo"
            width="150"
            height="150"
            style={{ display: "block" }}
          />
          <h1 style={{ fontSize: "clamp(2rem, 10vw, 8rem)", margin: 0 }}>Inkylink</h1>
        </div>

        <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
          Your SEO web content provider, and much, much more!
        </h2>

        <p style={{ maxWidth: "700px", fontSize: "1.1rem", marginBottom: "2rem" }}>
          We create advanced SEO optimized product descriptions, emails, and web content that drive clicks, build trust, and boost conversions; delivered to you each month automatically.
        </p>

        <div style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <Link href="/pricing">
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#26de81",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "Lato, sans-serif",
                textAlign: "center",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#3399ff")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#26de81")}
            >
              View Plans & Pricing
            </button>
          </Link>

          <Link href="/build-a-bundle">
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#00b894",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "Lato, sans-serif",
                textAlign: "center",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#3399ff")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#00b894")}
            >
              Build a Custom Bundle
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
