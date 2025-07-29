import React, { useState } from "react";
import { useRouter } from "next/router";
import Logo from "../public/logo.png";
import Image from "next/image";

const bundles = [
  {
    id: "product-description",
    title: "Product Description",
    price: 39,
    description: "Get a compelling and SEO-optimized product description.",
    icon: "/icons/desc.png",
  },
  {
    id: "product-overview",
    title: "Product Overview",
    price: 39,
    description: "Summarize your product in a short, scannable overview.",
    icon: "/icons/overview.png",
  },
  {
    id: "welcome-email",
    title: "Welcome Email",
    price: 49,
    description: "A warm, professional welcome for new customers.",
    icon: "/icons/welcome.png",
  },
  {
    id: "product-drop-email",
    title: "Product Drop Email",
    price: 49,
    description: "Announce a new product drop with energy and style.",
    icon: "/icons/drop.png",
  },
  {
    id: "seo-blog-post",
    title: "SEO-Optimized Blog Post",
    price: 79,
    description: "A helpful blog post written to rank and convert.",
    icon: "/icons/blog.png",
  },
  {
    id: "bullet-point-rewrite",
    title: "Bullet Point Rewrite",
    price: 29,
    description: "Let us polish and optimize your feature bullets.",
    icon: "/icons/bullet point rewrite.png",
  },
  {
    id: "faq-section",
    title: "FAQ Section",
    price: 29,
    description: "We’ll craft a useful and buyer-focused FAQ section.",
    icon: "/icons/faq section.png",
  },
  {
    id: "comparison-table",
    title: "Comparison Table",
    price: 39,
    description: "Give customers a clean, visual way to compare options.",
    icon: "/icons/comparison table.png",
  },
  {
    id: "seo-titles-metadata",
    title: "SEO Titles & Metadata",
    price: 29,
    description: "Get clean, optimized titles and metadata that rank.",
    icon: "/icons/seo.png",
  },
  {
    id: "full-site-audit",
    title: "Full Site Audit",
    price: 149,
    description: "We’ll review your store and provide clear, actionable feedback.",
    icon: "/icons/full site audit.png",
  },
  {
    id: "launch-kit",
    title: "Launch Kit",
    price: 149,
    description: "Everything you need to kickstart your store.",
    icon: "/icons/launch kit.png",
  },
  {
    id: "expansion-kit",
    title: "Expansion Kit",
    price: 199,
    description: "Bulk product descriptions and SEO setup.",
    icon: "/icons/expansion kit.png",
  },
  {
    id: "conversion-booster",
    title: "Conversion Booster",
    price: 129,
    description: "Improve trust and conversions fast.",
    icon: "/icons/conversion booster.png",
  },
];

export default function BuildABundle() {
  const router = useRouter();

  const [quantities, setQuantities] = useState(
    bundles.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {})
  );

  const [isRecurring, setIsRecurring] = useState(false);

  const totalPrice = bundles.reduce(
    (total, bundle) => total + bundle.price * (quantities[bundle.id] || 0),
    0
  );

  const handleQuantityChange = (id, newQty) => {
    if (newQty < 0) return;
    setQuantities((prev) => ({ ...prev, [id]: newQty }));
  };

  const handleCheckout = () => {
    const selectedBundles = bundles
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
        {bundles.map((bundle) => (
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
            <p style={{ fontSize: "0.9rem", fontStyle: "italic", marginBottom: "1rem" }}>
              {bundle.description}
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              ${bundle.price} each
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "auto",
              }}
            >
              <button
                onClick={() =>
                  handleQuantityChange(bundle.id, (quantities[bundle.id] || 0) - 1)
                }
                disabled={(quantities[bundle.id] || 0) <= 0}
                style={{
                  padding: "0.3rem 0.7rem",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                }}
                aria-label={`Decrease quantity of ${bundle.title}`}
              >
                –
              </button>
              <input
                type="number"
                min="0"
                value={quantities[bundle.id]}
                onChange={(e) =>
                  handleQuantityChange(bundle.id, Math.max(0, Number(e.target.value)))
                }
                style={{
                  width: "50px",
                  textAlign: "center",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                aria-label={`Quantity of ${bundle.title}`}
              />
              <button
                onClick={() =>
                  handleQuantityChange(bundle.id, (quantities[bundle.id] || 0) + 1)
                }
                style={{
                  padding: "0.3rem 0.7rem",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                }}
                aria-label={`Increase quantity of ${bundle.title}`}
              >
                +
              </button>
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            padding: "0.6rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#ccc",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          aria-label="Go back"
        >
          ⬅ Back
        </button>

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
    </main>
  );
}
