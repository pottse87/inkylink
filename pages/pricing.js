import React, { useState } from "react";
import { useRouter } from "next/router";
import ROIcalculator from "../components/ROIcalculator";
import BundleCard from "../components/BundleCard";

export default function Pricing() {
  const router = useRouter();
  const [showROI, setShowROI] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState("monthly");

  const handleBundleCheckout = (bundle) => {
    const bundles = [{
      id: bundle.id,
      name: bundle.title,
      description: bundle.description,
      price: bundle.price,
      icon: bundle.icon
    }];
    const encoded = encodeURIComponent(JSON.stringify(bundles));
    router.push(`/confirmation?bundles=${encoded}`);
  };

  const handlePlanCheckout = (plan) => {
    const bundle = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: billingFrequency === "monthly" ? plan.priceMonthly : plan.priceYearly,
      icon: `/icons/${plan.id}.png`
    };
    const encoded = encodeURIComponent(JSON.stringify([bundle]));
    router.push(`/confirmation?bundles=${encoded}`);
  };

  const subscriptionPlans = [
    {
      id: "starter",
      name: "Starter Plan",
      description: "Streamlined precision with a professional edge.",
      priceMonthly: 69,
      priceYearly: 699,
      stripeMonthlyId: "price_1RrASOFjDGmKohCH3emQcGkw",
      stripeYearlyId: "price_1RrAWzFjDGmKohCHaTwI70lD",
      icon: "/icons/starter.png",
      productDescriptions: 3,
      bulletRewrites: 1,
      welcomeEmail: 1,
      color: "#e8f5e9",
    },
    {
      id: "growth",
      name: "Growth Plan",
      description: "Content that scales as fast as your catalog.",
      priceMonthly: 129,
      priceYearly: 1299,
      stripeMonthlyId: "price_1RrAZCFjDGmKohCHxEnUiiHn",
      stripeYearlyId: "price_1RrAa2FjDGmKohCHOnxsKpAJ",
      icon: "/icons/growth.png",
      productDescriptions: 6,
      bulletRewrites: 2,
      welcomeEmail: 1,
      seoMetadata: 2,
      color: "#e3f2fd",
    },
    {
      id: "pro",
      name: "Pro Plan",
      description: "Strategic content development tailored to established names.",
      priceMonthly: 229,
      priceYearly: 2299,
      stripeMonthlyId: "price_1RrAcJFjDGmKohCHEzzR4KF7",
      stripeYearlyId: "price_1RrAdjFjDGmKohCHwYxagpG4",
      icon: "/icons/pro.png",
      productDescriptions: 8,
      productOverview: 2,
      bulletRewrites: 3,
      seoMetadata: 2,
      welcomeEmail: 2,
      blog: "1 blog post",
      faq: "1 FAQ section",
      revisions: "Up to 2 revisions per item/month",
      color: "#ede7f6",
    },
    {
      id: "elite",
      name: "Elite Plan",
      description: "Consistent monthly content to match your business velocity.",
      priceMonthly: 329,
      priceYearly: 3299,
      stripeMonthlyId: "price_1RrAfJFjDGmKohCHuZ3dZPUs",
      stripeYearlyId: "price_1RrAglFjDGmKohCHmVeQg6YC",
      icon: "/icons/elite.png",
      productDescriptions: 15,
      productOverview: 3,
      bulletRewrites: 5,
      seoMetadata: 4,
      welcomeEmail: 2,
      blog: "1 blog post",
      email: "1 email campaign",
      extra: "1 comparison table",
      faq: "1 FAQ section",
      revisions: "Up to 2 revisions per item/ month ",
      color: "#fff3e0",
    },
  ];

  const oneTimeBundles = [
    {
      id: "product-description",
      title: "Product Description",
      price: 39,
      description: "Stand out in search with expertly crafted product descriptions.",
      icon: "/icons/desc.png",
      stripeMonthlyId: "price_1RrAiGFjDGmKohCHv5acUOmw",
    },
    {
      id: "product-overview",
      title: "Product Overview",
      price: 29,
      description: "Highlight your product in a quick, easy-to-read snapshot.",
      icon: "/icons/overview.png",
      stripeMonthlyId: "price_1RrAkaFjDGmKohCHFah1gFHG",
    },
    {
      id: "welcome-email",
      title: "Welcome Email",
      price: 39,
      description: "Make a lasting first impression with a warm, professional welcome.",
      icon: "/icons/welcome.png",
      stripeMonthlyId: "price_1RrAnIFjDGmKohCHAFVQH1Ew",
    },
    {
      id: "product-drop-email",
      title: "Product Drop Email",
      price: 39,
      description: "Announce your new product with a sharp branded impact.",
      icon: "/icons/drop.png",
      stripeMonthlyId: "price_1RrAnxFjDGmKohCHrqsHz9Z7",
    },
    {
      id: "seo-blog-post",
      title: "SEO-Optimized Blog Post",
      price: 59,
      description: "A keyword-driven blog built to rank on page one.",
      icon: "/icons/blog.png",
      stripeMonthlyId: "price_1RrAovFjDGmKohCHvLnPKHf8",
    },
    {
      id: "bullet-point-rewrite",
      title: "Bullet Point Rewrite",
      price: 39,
      description: "Optimize your bullet points high-performance, persuasive language.",
      icon: "/icons/bullet point rewrite.png",
      stripeMonthlyId: "price_1RrAqhFjDGmKohCHBPP4F3i1",
    },
    {
      id: "faq-section",
      title: "FAQ Section",
      price: 29,
      description: "Answer buyer questions before they're asked with a customer-focused FAQ.",
      icon: "/icons/faq section.png",
      stripeMonthlyId: "price_1RrArMFjDGmKohCHYT4OISyP",
    },
    {
      id: "comparison-table",
      title: "Comparison Table",
      price: 39,
      description: "Make decision-making easy with a side-by-side comparison.",
      icon: "/icons/comparison table.png",
      stripeMonthlyId: "price_1RrAs9FjDGmKohCHEJ4tkmdY",
    },
    {
      id: "seo-titles-metadata",
      title: "SEO Titles & Metadata",
      price: 39,
      description: "Keyword-smart titles that speak both human and search engine.",
      icon: "/icons/seo.png",
      stripeMonthlyId: "price_1RrAtGFjDGmKohCHvzgeRw3f",
    },
    {
      id: "full-site-audit",
      title: "Full Site Audit",
      price: 179,
      description: "We'll review your store and provide clear, usable feedback you can apply immediately.",
      icon: "/icons/full site audit.png",
      stripeMonthlyId: "price_1RrAuVFjDGmKohCHzjoZfIQ5",
    },
    {
      id: "launch-kit",
      title: "Launch Kit",
      price: 119,
      description: "Everything you need to launch new products with confidence.",
      icon: "/icons/launch kit.png",
      stripeMonthlyId: "price_1RrAyoFjDGmKohCHFlITlQ0H",
    },
    {
      id: "expansion-kit",
      title: "Expansion Kit",
      price: 149,
      description: "A smart choice for stores expanding their lineup or revamping old content.",
      icon: "/icons/expansion kit.png",
      stripeMonthlyId: "price_1RrAztFjDGmKohCHYJYF4khr",
    },
    {
      id: "conversion-booster",
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
    stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H",
    icon: "/icons/conversion booster pro.png",
    includes: [
      "Landing Page Optimization",
      "Comparison Table",
      "Email Campaign"
    ],
    color: "#fce4ec",
  },
];

  return (
    <main
      style={{
        backgroundColor: "#f1f8fc",
        fontFamily: "Lato, sans-serif",
        padding: "2rem",
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        <img src="/logo.png" alt="Inkylink Logo" width={100} height={100} />
        <h1 style={{ fontSize: "5rem", marginLeft: "1rem" }}>Inkylink</h1>
      </header>

      <h2 style={{ fontSize: "2.2rem", marginBottom: "1.5rem" }}>How It Works:</h2>
      <ul
        style={{
          fontSize: "1.8rem",
          textAlign: "left",
          margin: "0 auto 2rem",
          maxWidth: "700px",
          paddingLeft: "2rem",
        }}
      >
        <li style={{ marginBottom: "1rem" }}>Choose a plan or build your own bundle from the options below</li>
        <li style={{ marginBottom: "1rem" }}>We craft your content using state-of-the-art SEO optimization theory and advanced AI integration</li>
        <li style={{ marginBottom: "1rem" }}>Once your work is completed, it is sent to you via email. You can review and revise; or accept and deploy it instantly</li>
      </ul>

      <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Choose Your Plan</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <label style={{ fontSize: "1.1rem", marginRight: "0.5rem" }}>Monthly</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={billingFrequency === "yearly"}
            onChange={() =>
              setBillingFrequency(billingFrequency === "monthly" ? "yearly" : "monthly")
            }

          />
          <span className="slider round"></span>
        </label>
        <label style={{ fontSize: "1.1rem", marginLeft: "0.5rem" }}>Yearly</label>
      </div>

      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #007f00;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            style={{
              width: "250px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: plan.color || "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={`/icons/${plan.id}.png`}
              alt={`${plan.name} Icon`}
              style={{ width: "60px", height: "60px", marginBottom: "1rem" }}
            />
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{plan.name}</h3>
            <p style={{ fontSize: "1rem", marginBottom: "1rem", fontStyle: "italic" }}>
              {plan.description}
            </p>
     <p style={{ marginBottom: "0.3rem" }}>
  <strong>
    ${billingFrequency === "monthly" ? plan.priceMonthly : plan.priceYearly}
  </strong>{" "}
  /{billingFrequency === "monthly" ? "mo" : "yr"}
</p>

{billingFrequency === "yearly" && (
  <p style={{ color: "#007f00", fontWeight: "bold", fontSize: "0.9rem" }}>
    Save ${plan.priceMonthly * 12 - plan.priceYearly} per year
  </p>
)}

            <ul style={{ textAlign: "left", marginTop: "1rem", paddingLeft: "1rem" }}>
              <li>{plan.productDescriptions} product descriptions</li>
              <li>{plan.bulletRewrites} bullet rewrites</li>
              {plan.welcomeEmail && <li>1 welcome email</li>}
              {plan.seoMetadata && <li>{plan.seoMetadata} SEO titles & metadata</li>}
              {plan.blog && <li>{plan.blog}</li>}
              {plan.email && <li>{plan.email}</li>}
              {plan.extra && <li>{plan.extra}</li>}
              {plan.faq && <li>{plan.faq}</li>}
              {plan.revisions && <li>{plan.revisions}</li>}
            </ul>
            <div style={{ marginTop: "auto" }}>
              <button
                onClick={() => handlePlanCheckout(plan)}
                style={{
                  marginTop: "1.5rem",
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "1.1rem" }}>Not sure how we can help? click the lighbulb to use our content conversion calculator</p>
        <div
          onClick={() => setShowROI(!showROI)}
          style={{ fontSize: "2rem", cursor: "pointer" }}
          aria-label="Toggle ROI Calculator"
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter") setShowROI(!showROI);
          }}
        >
          💡
        </div>
        {showROI && <ROIcalculator key="roi-widget" />}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "0 2rem",
        }}
      >
        <h2 style={{ fontSize: "1.8rem" }}>Single products and services</h2>
        <div>
          <p style={{ marginBottom: "0.5rem" }}>Want a custom mix of services?</p>
          <button
            onClick={() => router.push("/build-a-bundle")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              backgroundColor: "#00b984",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s ease"
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#3399ff")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#00b894")}
          >
            Build a Bundle
          </button>
        </div>
      </div>

    <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  }}
>
  {oneTimeBundles.map((bundle) => (
    <div
      key={bundle.id}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "360px",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#fff",
        textAlign: "center",
      }}
    >
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{bundle.title}</h3>
        <img
          src={bundle.icon}
          alt={`${bundle.title} icon`}
          style={{ width: "60px", height: "60px", objectFit: "contain" }}
        />
        <p style={{ marginTop: "0.5rem", fontSize: "1rem" }}>{bundle.description}</p>
        <p style={{ fontWeight: "bold", marginTop: "0.5rem" }}>${bundle.price}</p>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => handleBundleCheckout(bundle)}
          style={{
            width: "140px",
            padding: "0.4rem 1rem",
            fontSize: "0.9rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Order Now
        </button>
      </div>
    </div>
  ))}
</div>
    </main>
  );
}

