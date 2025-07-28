import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Confirmation() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady) return; // wait for router to be ready

    const { data } = router.query;

    if (!data) {
      setError("No order data found in URL.");
      return;
    }

    try {
      // Decode URI component and parse JSON string
      const parsedData = JSON.parse(decodeURIComponent(data));
      setOrderData(parsedData);
    } catch (err) {
      console.error("Error parsing order data:", err);
      setError("Failed to parse order data.");
    }
  }, [router.isReady, router.query]);

  if (error) {
    return <div style={{ padding: "2rem", fontFamily: "Lato, sans-serif" }}>
      <h1>Error</h1>
      <p>{error}</p>
      <button onClick={() => router.push("/pricing")} style={{
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        cursor: "pointer"
      }}>Go Back to Pricing</button>
    </div>;
  }

  if (!orderData) {
    return <div style={{ padding: "2rem", fontFamily: "Lato, sans-serif" }}>
      <h1>Loading Order Details...</h1>
    </div>;
  }

  const totalPrice = orderData.bundles.reduce(
    (sum, b) => sum + (b.price * (b.quantity || 1)),
    0
  );

  return (
    <main style={{
      padding: "2rem",
      fontFamily: "Lato, sans-serif",
      maxWidth: "700px",
      margin: "0 auto"
    }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Order Confirmation</h1>

      <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
        Recurring Subscription: <strong>{orderData.recurring ? "Yes" : "No"}</strong>
      </p>

      <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your Bundles:</h2>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {orderData.bundles.map((bundle) => (
          <li key={bundle.id} style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <img
              src={bundle.icon}
              alt={bundle.name}
              style={{ width: "60px", height: "60px", objectFit: "contain" }}
            />
            <div>
              <h3 style={{ margin: 0 }}>{bundle.name}</h3>
              <p style={{ margin: "0.2rem 0" }}>{bundle.description}</p>
              <p style={{ fontWeight: "bold" }}>
                Quantity: {bundle.quantity || 1} × ${bundle.price} = ${bundle.price * (bundle.quantity || 1)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: "1.8rem" }}>
        Total Price: <strong>${totalPrice}</strong>
      </h2>

      <button
        onClick={() => alert("Checkout flow coming soon!")}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1.2rem",
          backgroundColor: "#007f00",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "2rem",
          width: "100%",
        }}
      >
        Proceed to Checkout
      </button>
    </main>
  );
}
