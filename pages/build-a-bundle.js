import React, { useState } from "react";
import { useRouter } from "next/router";
import Logo from "../public/logo.png";
import Image from "next/image";

const bundles = [
  { id: "product-description", title: "Product Description", price: 39, description: "Get a compelling and SEO-optimized product description.", icon: "/icons/product-description.png" },
  { id: "product-overview", title: "Product Overview", price: 39, description: "Summarize your product in a short, scannable overview.", icon: "/icons/product-overview.png" },
  { id: "welcome-email", title: "Welcome Email", price: 49, description: "A warm, professional welcome for new customers.", icon: "/icons/welcome-email.png" },
  { id: "product-drop-email", title: "Product Drop Email", price: 49, description: "Announce a new product drop with energy and style.", icon: "/icons/product-drop-email.png" },
  { id: "seo-blog-post", title: "SEO-Optimized Blog Post", price: 79, description: "A helpful blog post written to rank and convert.", icon: "/icons/seo-blog-post.png" },
  { id: "bullet-point-rewrite", title: "Bullet Point Rewrite", price: 29, description: "Let us polish and optimize your feature bullets.", icon: "/icons/bullet-point-rewrite.png" },
  { id: "faq-section", title: "FAQ Section", price: 29, description: "We’ll craft a useful and buyer-focused FAQ section.", icon: "/icons/faq-section.png" },
  { id: "comparison-table", title: "Comparison Table", price: 39, description: "Give customers a clean, visual way to compare options.", icon: "/icons/comparison-table.png" },
  { id: "seo-titles-metadata", title: "SEO Titles & Metadata", price: 29, description: "Get clean, optimized titles and metadata that rank.", icon: "/icons/seo-titles-metadata.png" },
  { id: "full-site-audit", title: "Full Site Audit", price: 149, description: "We’ll review your store and provide clear, actionable feedback.", icon: "/icons/full-site-audit.png" },
  { id: "launch-kit", title: "Launch Kit", price: 149, description: "Everything you need to kickstart your store.", icon: "/icons/launch-kit.png" },
  { id: "expansion-kit", title: "Expansion Kit", price: 199, description: "Bulk product descriptions and SEO setup.", icon: "/icons/expansion-kit.png" },
  { id: "conversion-booster", title: "Conversion Booster", price: 129, description: "Improve trust and conversions fast.", icon: "/icons/conversion-booster.png" }
];

export default function BuildABundle() {
  const router = useRouter();
  const [quantities, setQuantities] = useState(bundles.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {}));
  const [isRecurring, setIsRecurring] = useState(false);

  const generateOrderId = () => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = Math.random().toString(36).substring(2, 6);
    return 'order_' + timestamp + '_' + rand;
  };

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

    const order = {
      order_id: generateOrderId(),
      customer: { name: '', email: '' },
      items: selectedBundles,
      status: 'needs_form',
      form_data: {},
      source: 'build-a-bundle',
      recurring: isRecurring,
      created_at: Date.now()
    };

    const encoded = encodeURIComponent(JSON.stringify(order));
    router.push('/confirmation?order=' + encoded);
  };

  return (
    <main style={{ backgroundColor: "#f1f8fc", fontFamily: "Lato, sans-serif", padding: "2rem", minHeight: "100vh", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", justifyContent: "center" }}>
        <Image src={Logo} alt="Inkylink Logo" width={80} height={80} />
        <h1 style={{ fontSize: "3.5rem", margin: 0 }}>Build a Bundle</h1>
      </header>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "1.2rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
          Recurring Monthly Subscription
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {bundles.map((bundle) => (
          <div key={bundle.id} style={{ backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 3px 6px rgba(0,0,0,0.1)", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <img src={bundle.icon} alt={bundle.title} style={{ width: "60px", height: "60px", objectFit: "contain" }} />
            <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>{bundle.title}</h3>
            <p style={{ fontSize: "0.9rem", fontStyle: "italic", marginBottom: "1rem" }}>{bundle.description}</p>
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}> each</p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "auto", marginBottom: "0.5rem" }}>
              <button
                onClick={() => handleQuantityChange(bundle.id, (quantities[bundle.id] || 0) - 1)}
                disabled={(quantities[bundle.id] || 0) <= 0}
                style={{ padding: "0.3rem 0.7rem", fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", minWidth: "32px" }}
              >-</button>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold", minWidth: "32px", textAlign: "center" }}>{quantities[bundle.id] || 0}</span>
              <button
                onClick={() => handleQuantityChange(bundle.id, (quantities[bundle.id] || 0) + 1)}
                style={{ padding: "0.3rem 0.7rem", fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", minWidth: "32px" }}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "2rem", textAlign: "right" }}>
        Total: {isRecurring ? " / month" : ""}
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handleCheckout}
          style={{ padding: "0.75rem 2rem", fontSize: "1.1rem", backgroundColor: "#007f00", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Proceed to Checkout
        </button>
      </div>
    </main>
  );
}

