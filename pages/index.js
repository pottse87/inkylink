// pages/index.js

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
          <Image
            src="/logo.png"
            alt="Inkylink Logo"
            width={150}
            height={150}
          />
          <h1 style={{ fontSize: "8rem", margin: 0 }}>Inkylink</h1>
        </div>

        <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
          Your SEO content provider—and so much more!
        </h2>

        <p style={{ maxWidth: "700px", fontSize: "1.1rem", marginBottom: "2rem" }}>
          We create powerful SEO optimized product descriptions, emails, and web content that drive clicks, build trust, and boost conversions; delivered to you each month automatically.
        </p>

        <div style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <Link href="/pricing" style={{
            padding: "1rem 2rem",
            backgroundColor: "#0070f3",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "1.1rem"
          }}>
            View Plans & Pricing
          </Link>

          <Link href="/build-a-bundle" style={{
            padding: "1rem 2rem",
            backgroundColor: "#555",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "1.1rem"
          }}>
            Build a Custom Bundle
          </Link>
        </div>
      </main>
    </>
  );
}
