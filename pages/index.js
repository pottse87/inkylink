import React from "react";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
  <>
    <Head>
      <title>Welcome to Inkylink!</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main
      style={{
        backgroundColor: "#a5f1f5ff",
        color: "#0b0f0a",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
   <header
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2rem",
  }}
>
  <img src="/logo.png" alt="Inkylink Logo" width={100} height={100} />
  <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.1, marginTop: "1rem", textAlign: "center" }}>
    Welcome to Inkylink!
  </h1>
</header>



        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Selling. Made Human.
        </h2>

       <p
  style={{
    maxWidth: "600px",
    fontSize: "1.25rem",
    lineHeight: 1.6,
    marginBottom: "2.4rem",
    textAlign: "center",
    marginLeft: "auto",
    marginRight: "auto"
  }}
>
  We use advanced AI integration and analytics to deliver search engine-optimized
  web and product content that gets your products seen and drives sales - delivered
  automatically every month.
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
    backgroundColor: "#26de81", // brand green
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "Lato, sans-serif",
    textAlign: "center",
    cursor: "pointer",
    transition: "background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
    boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
    transform: "translateY(0)"
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#21c874"; // darker brand green
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#26de81";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 1px 0 rgba(0,0,0,0.3)";
  }}
>
  View Plans & Pricing
</button>

          </Link>

          <Link href="/build-a-bundle">
          <button
  style={{
    padding: "0.75rem 1.5rem",
    backgroundColor: "#10b981", // our emerald green
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "Lato, sans-serif",
    textAlign: "center",
    cursor: "pointer",
    transition: "background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
    boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
    transform: "translateY(0)"
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#059669"; // darker emerald
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#10b981";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 1px 0 rgba(0,0,0,0.3)";
  }}
>
  Build a Custom Bundle
</button>

          </Link>
        </div>
      </main>
    </>
  );
}
