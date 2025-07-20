// pages/privacy.js

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9f9f9",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        lineHeight: "1.7",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        Privacy Policy
      </h1>
      <p>
        At Inkylink, your privacy is important to us. This Privacy Policy
        outlines what information we collect, how we use it, and the steps we
        take to safeguard it.
      </p>

      <h2 style={{ marginTop: "2rem" }}>Information We Collect</h2>
      <ul>
        <li>Your name and email address</li>
        <li>Business information for content creation</li>
        <li>Order details and Stripe payment data</li>
      </ul>

      <h2 style={{ marginTop: "2rem" }}>How We Use Your Information</h2>
      <ul>
        <li>To fulfill your content orders</li>
        <li>To improve our services and offerings</li>
        <li>To communicate updates or order details</li>
      </ul>

      <h2 style={{ marginTop: "2rem" }}>Data Security</h2>
      <p>
        We use secure third-party services like Stripe for payments and do not
        store any sensitive payment information ourselves. All user content is
        handled with strict confidentiality.
      </p>

      <h2 style={{ marginTop: "2rem" }}>Your Consent</h2>
      <p>
        By using our site, you consent to our privacy policy. You may request
        access or deletion of your data at any time by contacting us.
      </p>

      <Link href="/">
        <button
          style={{
            marginTop: "3rem",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "8px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#005ac1")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#0070f3")}
        >
          Back to Home
        </button>
      </Link>
    </div>
  );
}
