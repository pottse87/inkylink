import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { data, bundles } = router.query;
    const encoded = data || bundles;

    if (!encoded) {
      setError("No order data found.");
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(encoded));
      const fullData = Array.isArray(parsed)
        ? { bundles: parsed, recurring: parsed.some(b => b.recurring) }
        : parsed;

      setOrderData(fullData);
    } catch (err) {
      console.error("Failed to parse checkout data:", err);
      setError("Invalid order data.");
    }
  }, [router.isReady, router.query]);

  const totalPrice = orderData?.bundles.reduce(
    (sum, b) => sum + b.price * (b.quantity || 1),
    0
  );

  const handleStripeCheckout = async () => {
    alert("Stripe Checkout logic will go here (or redirect to a hosted page).");
    // Example placeholder:
    // const res = await fetch("/api/create-checkout-session", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(orderData),
    // });
    // const session = await res.json();
    // const stripe = await loadStripe("your_public_key_here");
    // await stripe.redirectToCheckout({ sessionId: session.id });
  };

  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Lato, sans-serif" }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button
          onClick={() => router.push("/pricing")}
          style={{
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
        <h1>Loading checkout...</h1>
      </div>
    );
  }

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "Lato, sans-serif",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Checkout</h1>

      <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
        Recurring Subscription:{" "}
        <strong>{orderData.recurring ? "Yes" : "No"}</strong>
      </p>

      <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Items:</h2>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {orderData.bundles.map((bundle) => (
          <li
            key={bundle.id}
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
        Total: <strong>${totalPrice}</strong>
      </h2>

      <button
        onClick={handleStripeCheckout}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1.2rem",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "2rem",
          width: "100%",
        }}
      >
        Pay with Stripe
      </button>
    </main>
  );
}
