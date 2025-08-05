import React, { useState } from "react";
import { useRouter } from "next/router";
import Logo from "../public/logo.png";
import Image from "next/image";
import QuantitySelector from "../components/QuantitySelector";

const oneTimeBundles = [
    {
      id: "product description",
      title: "Product Description",
      price: 39,
      description: "Stand out in search with expertly crafted product descriptions.",
      icon: "/icons/desc.png",
      stripeMonthlyId: "price_1RrAiGFjDGmKohCHv5acUOmw",
    },
    {
      id: "product overview",
      title: "Product Overview",
      price: 29,
      description: "Highlight your product in a quick, easy-to-read snapshot.",
      icon: "/icons/overview.png",
      stripeMonthlyId: "price_1RrAkaFjDGmKohCHFah1gFHG",
    },
    {
      id: "welcome email",
      title: "Welcome Email",
      price: 39,
      description: "Make a lasting first impression with a warm, professional welcome.",
      icon: "/icons/welcome.png",
      stripeMonthlyId: "price_1RrAnIFjDGmKohCHAFVQH1Ew",
    },
    {
      id: "product drop email",
      title: "Product Drop Email",
      price: 39,
      description: "Announce your new product with a sharp branded impact.",
      icon: "/icons/drop.png",
      stripeMonthlyId: "price_1RrAnxFjDGmKohCHrqsHz9Z7",
    },
    {
      id: "seo blog post",
      title: "SEO-Optimized Blog Post",
      price: 59,
      description: "A keyword-driven blog built to rank on page one.",
      icon: "/icons/blog.png",
      stripeMonthlyId: "price_1RrAovFjDGmKohCHvLnPKHf8",
    },
    {
      id: "bullet point rewrite",
      title: "Bullet Point Rewrite",
      price: 39,
      description: "Optimize your bullet points high-performance, persuasive language.",
      icon: "/icons/bullet point rewrite.png",
      stripeMonthlyId: "price_1RrAqhFjDGmKohCHBPP4F3i1",
    },
    {
      id: "faq section",
      title: "FAQ Section",
      price: 29,
      description: "Answer buyer questions before they're asked with a customer-focused FAQ.",
      icon: "/icons/faq section.png",
      stripeMonthlyId: "price_1RrArMFjDGmKohCHYT4OISyP",
    },
    {
      id: "comparison table",
      title: "Comparison Table",
      price: 39,
      description: "Make decision-making easy with a side-by-side comparison.",
      icon: "/icons/comparison table.png",
      stripeMonthlyId: "price_1RrAs9FjDGmKohCHEJ4tkmdY",
    },
    {
      id: "seo titles metadata",
      title: "SEO Titles & Metadata",
      price: 39,
      description: "Keyword-smart titles that speak both human and search engine.",
      icon: "/icons/seo.png",
      stripeMonthlyId: "price_1RrAtGFjDGmKohCHvzgeRw3f",
    },
    {
      id: "full site audit",
      title: "Full Site Audit",
      price: 179,
      description: "We'll review your store and provide clear, usable feedback you can apply immediately.",
      icon: "/icons/full site audit.png",
      stripeMonthlyId: "price_1RrAuVFjDGmKohCHzjoZfIQ5",
    },
    {
      id: "launch kit",
      title: "Launch Kit",
      price: 119,
      description: "Everything you need to launch new products with confidence.",
      icon: "/icons/launch kit.png",
      stripeMonthlyId: "price_1RrAyoFjDGmKohCHFlITlQ0H",
    },
    {
      id: "expansion kit",
      title: "Expansion Kit",
      price: 149,
      description: "A smart choice for stores expanding their lineup or revamping old content.",
      icon: "/icons/expansion kit.png",
      stripeMonthlyId: "price_1RrAztFjDGmKohCHYJYF4khr",
    },
    {
      id: "conversion booster",
      title: "Conversion Booster",
      price: 129,
      description: "Revive sluggish listings and amplify your most visited pages.",
      icon: "/icons/conversion booster.png",
      stripeMonthlyId: "price_1RrB2IFjDGmKohCHWVM3XyqB",
    },
  {
    id: "amazon product description",
    title: "Amazon Product Description",
    description: "Optimized for Amazon's algorithm and shopper behavior. Includes SEO-driven copy, brand tone, and strategic formatting.",
    price: 49,
    icon: "/icons/amazon product description.png",
    stripeMonthlyId: "price_1RrB3sFjDGmKohCH96i7R4hi",
  },
  {
    id: "amazon bullet points rewrite",
    title: "Amazon Bullet Points Rewrite",
    description: "High-performance bullet points designed to boost click-through-rate and conversions.",
    price: 39,
    icon: "/icons/amazon bullet point rewrite.png",
    stripeMonthlyId: "price_1RrB4bFjDGmKohCH3pvtcmn9",
  },
  {
    id: "Enhanced Amazon Content",
    title: "Enhanced Amazon Content",
    description: "Strategically crafted narratives built to fit Amazon's visual structure.",
    price: 59,
    icon: "/icons/enhanced amazon content.png",
    stripeMonthlyId: "price_1RrB5kFjDGmKohCHHVGJMjnm",
  },
  {
    id: "split test variants",
    title: "Split Test Variants",
    description: "Run A/B tests with multiple versions of your product's copy to see which converts best. Includes 2 full variants.",
    price: 69,
    icon: "/icons/split test variants.png",
    stripeMonthlyId: "price_1RrBDYFjDGmKohCHE7gydsgB",
  },
  {
    id: "branding voice guidelines",
    title: "Branding Voice Guidelines",
    description: "Define your unique voice, tone, and messaging pillars so all future content aligns with your brand.",
    price: 89,
    icon: "/icons/branding voice guidelines.png",
    stripeMonthlyId: "price_1RrBEBFjDGmKohCHLRhmPioP",
  },
  {
    id: "amazon power pack",
    title: "Amazon Power Pack",
    description: "Amazon-optimized description, bullet points, and A+ content.",
    price: 129,
    icon: "/icons/amazon power pack.png",
    stripeMonthlyId: "price_1RrB6wFjDGmKohCHgHxpeQRN",
    includes: [
      "Amazon Description",
      "Amazon Bullets",
      "A+ Module Copy"
    ],
    color: "#fce4ec",
  },
  {
    id: "store revamp kit",
    title: "Store Revamp Kit",
    description: "Revitalize your store with expert insight and high impact descriptions.",
    price: 199,
    stripeMonthlyId: "price_1RrB88FjDGmKohCHTTZcDy5q",
    icon: "/icons/store revamp kit.png",
    includes: [
      "Full Site Audit",
      "Descriptions",
      "Bullets",
      "SEO Metadata"
    ],
    color: "#fce4ec",
  },
  {
    id: "ongoing optimization",
    title: "Ongoing Optimization",
    description: "Structured to adapt, improve and help scale your goals.",
    price: 149,
    stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H",
    icon: "/icons/ongoing optimization.png",
    includes: [
      "Product Page Audit",
      "Split Test Variants",
      "SEO Metadata"
    ],
    color: "#fce4ec",
  },
  {
    id: "conversion booster pro",
    title: "Conversion Booster Pro",
    description: "Targeted improvements designed to turn traffic into sales.",
    price: 169,
    stripeMonthlyId: "price_1RrBBNFjDGmKohCHE209rvTT",
    icon: "/icons/conversion booster pro.png",
    includes: [
      "Landing Page Optimization",
      "Comparison Table",
      "Email Campaign"
    ],
    color: "#fce4ec",
  },
];

export default function BuildABundle() {
  const router = useRouter();

  const [quantities, setQuantities] = useState(
    oneTimeBundles.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {})
  );

  const [isRecurring, setIsRecurring] = useState(false);

  const totalPrice = oneTimeBundles.reduce(
    (total, bundle) => total + bundle.price * (quantities[bundle.id] || 0),
    0
  );

  const handleQuantityChange = (id, newQty) => {
    if (newQty < 0) return;
    setQuantities((prev) => ({ ...prev, [id]: newQty }));
  };

  const handleCheckout = () => {
    const selectedBundles = oneTimeBundles
      .filter((b) => quantities[b.id] > 0)
      .map((b) => ({
        id: b.id,
        name: b.title,
        description: b.description,
        price: b.price,
        quantity: quantities[b.id],
        icon: b.icon,
      }));

    if (selectedBundles.length === 0) {
      alert("Please select at least one bundle with quantity > 0.");
      return;
    }

    const data = {
      bundles: selectedBundles,
      recurring: isRecurring,
    };

    const encoded = encodeURIComponent(JSON.stringify(data));
    router.push(`/confirmation?data=${encoded}`);
  };

  return (
    <main
      style={{
        backgroundColor: "#f1f8fc",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        minHeight: "100vh",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          justifyContent: "center",
        }}
      >
        <Image src={Logo} alt="Inkylink Logo" width={80} height={80} />
        <h1 style={{ fontSize: "3.5rem", margin: 0 }}>Build a Bundle</h1>
      </header>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={() => setIsRecurring(!isRecurring)}
          />
          Recurring Monthly Subscription
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {oneTimeBundles.map((bundle) => (
          <div
            key={bundle.id}
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <img
              src={bundle.icon}
              alt={bundle.title}
              style={{ width: "60px", height: "60px", objectFit: "contain" }}
            />
            <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
              {bundle.title}
            </h3>
            <p   
            style={{
              fontSize: "0.9rem",
              fontStyle: "italic",
              marginBottom: "1rem",
              maxHeight: "90px",
              overflowY: "auto",
              paddingRight: "0.5rem",
              lineHeight: "1.4",
              wordBreak: "break-word",
              textAlign: "left",
           }}
            >
              {bundle.description}
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              ${bundle.price} each
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", height: "48px" }}>
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: "1", fontSize: "1.2rem", userSelect: "none" }}>
    <span>+</span>
    <span>–</span>
  </div>
  <QuantitySelector
    bundle={bundle}
    quantity={quantities[bundle.id]}
    onQuantityChange={handleQuantityChange}
  />
</div>

          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          marginBottom: "2rem",
          textAlign: "right",
        }}
      >
        Total: ${totalPrice}
        {isRecurring ? " / month" : ""}
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handleCheckout}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            backgroundColor: "#007f00",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          aria-label="Proceed to checkout"
        >
          Proceed to Checkout
        </button>
      </div>
   <div style={{ marginTop: "2rem", textAlign: "center" }}>
  <button
    onClick={() => window.history.back()}
    style={{
      padding: "0.6rem 1.2rem",
      fontSize: "1rem",
      backgroundColor: "#ff6666", // Coral Red
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "background-color 0.2s ease-in-out",
    }}
    onMouseEnter={(e) => (e.target.style.backgroundColor = "#e65555")}
    onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff6666")}
  >
    ← Back
  </button>
</div>
    </main>
  );
}
