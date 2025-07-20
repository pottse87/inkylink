import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import ROIcalculator from "../components/ROIcalculator";
import BundleCard from "../components/BundleCard";
import Logo from "../public/logo.png";

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
      description: "Professional polish for lean operations.",
      priceMonthly: 49,
      priceYearly: 490,
      productDescriptions: 2,
      bulletRewrites: 1,
      welcomeEmail: 1,
      color: "#e8f5e9",
    },
    {
      id: "growth",
      name: "Growth Plan",
      description: "Scalable content support for growing catalogs.",
      priceMonthly: 99,
      priceYearly: 990,
      productDescriptions: 6,
      bulletRewrites: 2,
      seoMetadata: 2,
      color: "#e3f2fd",
    },
    {
      id: "pro",
      name: "Pro Plan",
      description: "Comprehensive content creation for established brands.",
      priceMonthly: 179,
      priceYearly: 1790,
      productDescriptions: 10,
      bulletRewrites: 3,
      seoMetadata: 2,
      blog: "1 blog post",
      faq: "1 FAQ section",
      revisions: "Up to 2 revisions/month",
      color: "#ede7f6",
    },
    {
      id: "elite",
      name: "Elite Plan",
      description: "Full-suite monthly content for high-performing teams.",
      priceMonthly: 299,
      priceYearly: 2990,
      productDescriptions: 15,
      bulletRewrites: 5,
      seoMetadata: 4,
      blog: "1 blog post",
      email: "1 email campaign",
      extra: "1 comparison table",
      faq: "1 FAQ section",
      revisions: "Up to 2 thoughtful revisions per item",
      color: "#fff3e0",
    },
  ];

  const oneTimeBundles = [
    {
      id: "desc",
      title: "Full Product Writeup",
      price: 25,
      description: "One SEO-optimized, conversion-ready description.",
      icon: "/icons/product description.png",
    },
    {
      id: "overview",
      title: "Quick Overview Summary",
      price: 25,
      description: "Summarize features and benefits at a glance.",
      icon: "/icons/overview.png",
    },
    {
      id: "welcome",
      title: "Welcome Email",
      price: 29,
      description: "A warm, brand-building email to greet new customers.",
      icon: "/icons/welcome email.png",
    },
    {
      id: "drop",
      title: "Launch Announcement",
      price: 29,
      description: "Announce new arrivals in style and drive conversions.",
      icon: "/icons/drop.png",
    },
    {
      id: "blog",
      title: "SEO Blog Article",
      price: 39,
      description: "Educate and engage while driving organic traffic.",
      icon: "/icons/blog.png",
    },
    {
      id: "bullets",
      title: "Bullet Rewrite Boost",
      price: 10,
      description: "Clear, scannable bullets that sell benefits fast.",
      icon: "/icons/bullet point rewrite.png",
    },
    {
      id: "faq",
      title: "FAQ Builder",
      price: 20,
      description: "Answer top customer concerns with clarity and trust.",
      icon: "/icons/faq section.png",
    },
    {
      id: "compare",
      title: "Feature Comparison Table",
      price: 20,
      description: "Highlight what makes you better than the competition.",
      icon: "/icons/comparison table.png",
    },
    {
      id: "metadata",
      title: "SEO Titles & Metadata",
      price: 12,
      description: "Boost visibility with search-friendly tags and titles.",
      icon: "/icons/seo.png",
    },
  ];

  return (
    <main style={{ backgroundColor: "#f1f8fc", fontFamily: "Lato, sans-serif", padding: "2rem", textAlign: "center", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
        <Image src={Logo} alt="Inkylink Logo" width={100} height={100} />
        <h1 style={{ fontSize: "5rem", marginLeft: "1rem" }}>Inkylink</h1>
      </header>

      <h2 style={{ fontSize: "2.2rem", marginBottom: "1.5rem" }}>How It Works:</h2>
      <ul style={{ fontSize: "1.8rem", textAlign: "left", margin: "0 auto 2rem", maxWidth: "700px", paddingLeft: "2rem" }}>
        <li style={{ marginBottom: "1rem" }}>Choose your plan or product</li>
        <li style={{ marginBottom: "1rem" }}>We create content that connects and converts</li>
        <li style={{ marginBottom: "1rem" }}>You approve and deploy it instantly</li>
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

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
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
            <img src={`/icons/${plan.id}.png`} alt={`${plan.name} Icon`} style={{ width: "60px", height: "60px", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{plan.name}</h3>
            <p style={{ fontSize: "1rem", marginBottom: "1rem", fontStyle: "italic" }}>{plan.description}</p>
            <p><strong>${billingFrequency === "monthly" ? plan.priceMonthly : plan.priceYearly}</strong> /{billingFrequency === "monthly" ? "mo" : "yr"}</p>
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
        <p style={{ fontSize: "1.1rem" }}>Not sure how we can help? Use our conversion calculator…</p>
        <div onClick={() => setShowROI(!showROI)} style={{ fontSize: "2rem", cursor: "pointer" }}>💡</div>
        {showROI && <ROIcalculator />}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", padding: "0 2rem" }}>
        <h2 style={{ fontSize: "1.8rem" }}>Single products and services</h2>
        <div>
          <p style={{ marginBottom: "0.5rem" }}>Want a custom mix of services?</p>
          <button
            onClick={() => router.push("/build-a-bundle")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              backgroundColor: "#007f00",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Build a Bundle
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {oneTimeBundles.map((bundle) => (
          <div key={bundle.id} style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", background: "#fff", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{bundle.title}</h3>
            <img src={bundle.icon} alt={bundle.title} style={{ width: "60px", height: "60px", objectFit: "contain" }} />
            <p style={{ marginTop: "0.5rem", fontSize: "1rem" }}>{bundle.description}</p>
            <p style={{ fontWeight: "bold", marginTop: "0.5rem" }}>${bundle.price}</p>
            <button
              onClick={() => handleBundleCheckout(bundle)}
              style={{
                marginTop: "0.5rem",
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
        ))}
      </div>
    </main>
  );
}
