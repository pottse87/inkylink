// pages/build-a-bundle.js

import React, { useState } from "react";
import { useRouter } from "next/router";

export default function BuildABundle() {
  const router = useRouter();

  const bundles = [
    { id: "desc", name: "Full Product Writeup", price: 25, description: "One SEO-optimized, conversion-ready description.", icon: "🛍️" },
    { id: "overview", name: "Quick Overview Summary", price: 25, description: "Summarize features and benefits at a glance.", icon: "📦" },
    { id: "welcome", name: "Welcome Email", price: 29, description: "A warm, brand-building email to greet new customers.", icon: "📬" },
    { id: "drop", name: "Launch Announcement", price: 29, description: "Announce new arrivals in style and drive conversions.", icon: "📢" },
    { id: "blog", name: "SEO Blog Article", price: 39, description: "Educate and engage while driving organic traffic.", icon: "✍️" },
    { id: "bullets", name: "Bullet Rewrite Boost", price: 10, description: "Clear, scannable bullets that sell benefits fast.", icon: "📌" },
    { id: "faq", name: "FAQ Builder", price: 20, description: "Answer top customer concerns with clarity and trust.", icon: "❓" },
    { id: "compare", name: "Feature Comparison Table", price: 20, description: "Highlight what makes you better than the competition.", icon: "📊" },
    { id: "metadata", name: "SEO Titles & Metadata", price: 12, description: "Boost visibility with search-friendly tags and titles.", icon: "🔖" },
  ];

  const [selected, setSelected] = useState([]);

  const toggleBundle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const total = bundles
    .filter((b) => selected.includes(b.id))
    .reduce((sum, b) => sum + b.price, 0);

  const handleCheckout = () => {
    const selectedItems = bundles
      .filter((b) => selected.includes(b.id))
      .map((b) => ({
        id: b.id,
        name: b.name,
        price: b.price,
        quantity: 1, // Default quantity
      }));

    const query = encodeURIComponent(JSON.stringify({ items: selectedItems }));
    router.push(`/confirmation?data=${query}`);
  };

  return (
    <main
      style={{
        backgroundColor: "#f1f8fc",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "2rem" }}>Build Your Own Bundle</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          justifyItems: "center",
        }}
      >
        {bundles.map((bundle) => (
          <label
            key={bundle.id}
            style={{
              backgroundColor: "#fff",
              padding: "1rem",
              borderRadius: "1rem",
              width: "220px",
              minHeight: "260px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              cursor: "pointer",
              border: selected.includes(bundle.id)
                ? "2px solid #28a745"
                : "2px solid transparent",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{bundle.icon}</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{bundle.name}</h3>
            <p style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>{bundle.description}</p>
            <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>${bundle.price}</p>
            <input
              type="checkbox"
              checked={selected.includes(bundle.id)}
              onChange={() => toggleBundle(bundle.id)}
              style={{ marginTop: "1rem" }}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: "3rem", fontSize: "1.5rem", fontWeight: "bold" }}>
        Total: ${total}
      </div>

      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          ← Back to Pricing
        </button>
        <button
          onClick={handleCheckout}
          disabled={selected.length === 0}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: selected.length > 0 ? "#007f00" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Checkout →
        </button>
      </div>
    </main>
  );
}
