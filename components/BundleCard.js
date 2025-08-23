import React from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BundleCard({ bundle, onAddToCart }) {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(bundle);
    }
  };

  return (
    <div style={{
      border: "1px solid #ccc",
      borderRadius: "10px",
      padding: "1.5rem",
      backgroundColor: "#fff",
      boxShadow: "0 0 10px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{bundle.name}</h3>
      <p style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>{bundle.description}</p>
      <p style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "1rem" }}>${(bundle.price_cents / 100).toFixed(2)}</p>
      <button
        onClick={handleAddToCart}
        style={{
          backgroundColor: "#0070f3",
          color: "#fff",
          padding: "0.75rem",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Add to Cart
      </button>
    </div>
  );
}
