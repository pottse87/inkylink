// components/BundleCard.js

import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import bundleData from "../config/stripe-config-bundles";

const stripePromise = loadStripe(
  "pk_test_51RinIyC24XB4jGbR54BRNISol1W7NOLeVGuJrkb7sFic4VkmvKH4NdayHPFpFBfQyM5k4MAJtIPKpdvljLg2JHqV00tvuCVP8R"
);

export default function BundleCard({ bundle }) {
  const handleCheckout = async (priceId) => {
    const stripe = await stripePromise;

    await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      successUrl: "http://localhost:3000/thankyou",
      cancelUrl: "http://localhost:3000/pricing"
    });
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
      <p style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "1rem" }}>${bundle.price}</p>
      <button
        onClick={() => handleCheckout(bundle.priceId)}
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
        Order Now
      </button>
    </div>
  );
}
