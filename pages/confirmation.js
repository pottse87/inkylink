// pages/confirmation.js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Confirmation() {
  const router = useRouter();
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let incoming = [];

    if (router.query.bundles) {
      try {
        const parsed = JSON.parse(router.query.bundles);
        incoming = parsed.map((item) => ({
          ...item,
          quantity: item.quantity || 1,
        }));
      } catch (err) {
        console.error("Error parsing bundles:", err);
      }
    }

    if (router.query.data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(router.query.data));
        const formatted = parsed.items.map((item) => ({
          ...item,
          quantity: item.quantity || 1,
        }));
        incoming = [...incoming, ...formatted];
      } catch (err) {
        console.error("Error parsing data:", err);
      }
    }

    setSelectedBundles(incoming);
  }, [router.query]);

  const updateQuantity = (id, newQty) => {
    setSelectedBundles((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, parseInt(newQty || 1)) }
          : item
      )
    );
  };

  const getTotal = () =>
    selectedBundles.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

  const handleProceed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundles: selectedBundles }),
      });

      const data = await res.json();

      if (data.sessionId) {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        );
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        alert("Something went wrong.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("There was a problem. Please try again.");
      setLoading(false);
    }
  };

  const loadStripe = async (key) => {
    if (!window.Stripe) {
      const stripeJs = await import("@stripe/stripe-js");
      return stripeJs.loadStripe(key);
    }
    return window.Stripe(key);
  };

  return (
    <main
      style={{
        fontFamily: "Lato, sans-serif",
        minHeight: "100vh",
        backgroundColor: "#fdf6ec",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        Review Your Bundle
      </h1>
      <p style={{ marginBottom: "2rem" }}>Here’s what you’ve selected:</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
          justifyItems: "center",
          maxWidth: "1000px",
          margin: "0 auto 3rem",
        }}
      >
        {selectedBundles.map((bundle) => (
          <div
            key={bundle.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "1rem",
              padding: "1rem",
              backgroundColor: "#ffffff",
              width: "100%",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <img
              src={bundle.icon || `/icons/${bundle.id}.png`}
              alt={bundle.name}
              style={{
                width: "50px",
                height: "50px",
                marginBottom: "1rem",
              }}
            />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>
              {bundle.name}
            </h3>
            <p style={{ fontSize: "0.95rem", color: "#444" }}>
              {bundle.description}
            </p>
            <div style={{ marginTop: "0.75rem" }}>
              <label>
                Qty:{" "}
                <input
                  type="number"
                  min="1"
                  value={bundle.quantity}
                  onChange={(e) =>
                    updateQuantity(bundle.id, e.target.value)
                  }
                  style={{
                    width: "60px",
                    padding: "0.25rem",
                    borderRadius: "0.4rem",
                    border: "1px solid #aaa",
                    textAlign: "center",
                  }}
                />
              </label>
            </div>
            <strong
              style={{
                fontSize: "1.1rem",
                marginTop: "0.75rem",
                display: "block",
              }}
            >
              ${bundle.price * bundle.quantity}
            </strong>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: "1rem" }}>Total: ${getTotal()}</h2>

      <button
        onClick={handleProceed}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#aaa" : "#2ecc71",
          color: "white",
          fontSize: "1.1rem",
          padding: "0.75rem 2rem",
          border: "none",
          borderRadius: "0.5rem",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s",
        }}
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
    </main>
  );
}
