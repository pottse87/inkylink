// components/PricingCard.js

import React from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  "pk_test_51RinIyC24XB4jGbR54BRNISol1W7NOLeVGuJrkb7sFic4VkmvKH4NdayHPFpFBfQyM5k4MAJtIPKpdvljLg2JHqV00tvuCVP8R"
);

export default function PricingCard({ plan }) {
  const handleCheckout = async (priceId) => {
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      successUrl: "http://localhost:3000/thankyou",
      cancelUrl: "http://localhost:3000/pricing",
    });
  };

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      padding: "2rem",
      width: "280px",
      textAlign: "center",
    }}>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{plan.name}</h3>
      <p style={{ marginBottom: "1rem" }}>{plan.description}</p>
      <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        ${plan.price}/mo <span style={{ color: "#666" }}>or</span> ${plan.yearlyPrice}/yr
      </p>
      <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "green" }}>
        Save ${plan.price * 12 - plan.yearlyPrice} per year!
      </div>
      <button
        style={{
          padding: "0.5rem 1.5rem",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "0.5rem",
        }}
        onClick={() => handleCheckout(plan.priceId)}
      >
        Monthly
      </button>
      <button
        style={{
          padding: "0.5rem 1.5rem",
          backgroundColor: "#e6007a",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => handleCheckout(plan.yearlyPriceId)}
      >
        Yearly
      </button>
    </div>
  );
}
