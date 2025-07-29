// pages/confirmation.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ConfirmationPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { data, bundles } = router.query;
    const encoded = data || bundles;

    if (!encoded || encoded.length < 5) {
      setError("No order data found.");
      return;
    }

    try {
      const decoded = decodeURIComponent(encoded);
      const parsed = JSON.parse(decoded);

      const fullData = Array.isArray(parsed)
        ? { bundles: parsed, recurring: parsed.some((b) => b.recurring) }
        : parsed;

      if (!fullData.bundles || !Array.isArray(fullData.bundles)) {
        throw new Error("Invalid bundle structure.");
      }

      setOrderData(fullData);
    } catch (err) {
      console.error("❌ Failed to parse order data:", err);
      setError("Invalid or corrupt order data.");
    }
  }, [router.isReady, router.query]);

  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Lato, sans-serif" }}>
        <h1>❌ Order Error</h1>
        <p>{error}</p>
        <button
          onClick={() => router.push("/pricing")}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Return to Pricing
        </button>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Lato, sans-serif" }}>
        <h1>Loading order confirmation…</h1>
      </div>
    );
  }

  const total = orderData.bundles.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "Lato, sans-serif",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅ Order Confirmation</h1>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {orderData.bundles.map((bundle, i) => (
          <li
            key={i}
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <img
              src={bundle.icon}
              alt={`${bundle.name} icon`}
              style={{ width: "60px", height: "60px", objectFit: "contain" }}
            />
            <div>
              <h3 style={{ margin: 0 }}>{bundle.name}</h3>
              <p style={{ margin: "0.2rem 0" }}>{bundle.description}</p>
              <p style={{ fontWeight: "bold" }}>
                Quantity: {bundle.quantity || 1} × ${bundle.price} = $
                {bundle.price * (bundle.quantity || 1)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: "1.8rem" }}>
        Total: <strong>${total}</strong>
      </h2>

      {orderData.recurring && (
        <p style={{ fontSize: "1rem", color: "#555", marginTop: "1rem" }}>
          🌀 This is a recurring subscription.
        </p>
      )}
    </main>
  );
}
