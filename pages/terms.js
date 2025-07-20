// pages/terms.js

import Link from "next/link";

export default function TermsOfService() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f6f6f6",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        lineHeight: "1.7",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        Terms of Service
      </h1>
      <p>
        By using Inkylink, you agree to the following terms. These terms govern
        your use of our services and content.
      </p>

      <h2 style={{ marginTop: "2rem" }}>1. Content Delivery</h2>
      <p>
        We create custom written content based on the information you provide.
        Delivery timelines depend on your selected package and our current
        queue. All content is delivered digitally.
      </p>

      <h2 style={{ marginTop: "2rem" }}>2. Intellectual Property</h2>
      <p>
        Once delivered and paid for in full, you have full rights to use,
        modify, or distribute the content as you see fit. We do not claim
        ownership of your brand or products.
      </p>

      <h2 style={{ marginTop: "2rem" }}>3. Refund Policy</h2>
      <p>
        Due to the digital and custom nature of our service, refunds are not
        offered once content has been delivered. We will revise content upon
        request within reason.
      </p>

      <h2 style={{ marginTop: "2rem" }}>4. User Responsibilities</h2>
      <p>
        You agree to provide accurate and complete information for us to
        effectively fulfill your order. You are solely responsible for how you
        use the delivered content.
      </p>

      <h2 style={{ marginTop: "2rem" }}>5. Changes to Terms</h2>
      <p>
        We reserve the right to update these terms at any time. Continued use of
        our services constitutes acceptance of any revised terms.
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
