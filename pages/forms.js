// pages/forms.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function FormsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    brand: '',
    service: '',
    bundleOptions: '',
    audience: '',
    tone: '',
    notesAndKeywords: '',
    goal: '',
    cta: '',
    inspiration: '',
    avoid: '',
    format: [],
    agreed: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const router = useRouter();
  const orderId = `order-${Date.now()}`;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name === 'format') {
      setFormData((prev) => ({
        ...prev,
        format: checked
          ? [...prev.format, value]
          : prev.format.filter((f) => f !== value),
      }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Please agree to the terms before submitting.");
      return;
    }

    const payload = { orderId, ...formData };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${orderId}.json`;
    link.click();

    router.push("/thankyou");
  };

  return (
    <main style={{
      fontFamily: 'Lato, sans-serif',
      maxWidth: '720px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#ffffff',
      color: '#333',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Help us create exactly what you need.</h1>
      <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
        Please take a moment to fill out all fields below so our team can get started right away.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
        <input name="brand" placeholder="Your Brand or Business Name" value={formData.brand} onChange={handleChange} required />

        <select name="service" value={formData.service} onChange={handleChange} required>
          <option value="">Select a Service</option>
          <option value="Build-a-Bundle">Build-a-Bundle</option>
          <optgroup label="One-Time Services">
            <option>Expansion Kit</option>
            <option>Launch Kit</option>
            <option>Conversion Booster</option>
            <option>Full Site Audit</option>
            <option>Product Description</option>
            <option>Product Overview</option>
            <option>Welcome Email</option>
            <option>Product Drop Email</option>
            <option>SEO-Optimized Blog Post</option>
            <option>Bullet Point Rewrite</option>
            <option>FAQ Section</option>
            <option>Comparison Table</option>
            <option>SEO Titles & Metadata</option>
          </optgroup>
          <optgroup label="Subscription Plans">
            <option>Starter Plan</option>
            <option>Growth Plan</option>
            <option>Pro Plan</option>
            <option>Elite Plan</option>
          </optgroup>
        </select>

        {formData.service === "Build-a-Bundle" && (
          <textarea
            name="bundleOptions"
            placeholder="Which services would you like included in your bundle?"
            value={formData.bundleOptions}
            onChange={handleChange}
            required
          />
        )}

        <textarea
          name="audience"
          placeholder="Who is this content for?"
          value={formData.audience}
          onChange={handleChange}
          required
        />

        <select name="tone" value={formData.tone} onChange={handleChange} required>
          <option value="">Preferred Tone</option>
          <option value="Friendly">Friendly</option>
          <option value="Professional">Professional</option>
          <option value="Playful">Playful</option>
          <option value="Bold">Bold</option>
          <option value="Luxury">Luxury</option>
        </select>

        <textarea
          name="notesAndKeywords"
          placeholder="Special instructions, phrases, or keywords you'd like us to include"
          value={formData.notesAndKeywords}
          onChange={handleChange}
        />

        <div>
          <p><strong>Kindly take a moment to fill out the section below.</strong><br />
          It helps us personalize your content to match your voice, your goals, and your audience — so you get exactly what you need, first time.</p>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ marginBottom: '1rem' }}
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          </button>
        </div>

        {showAdvanced && (
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <label>What are you hoping this content will achieve?</label>
            <select name="goal" value={formData.goal} onChange={handleChange} required>
              <option value="">Select a goal</option>
              <option>Educate readers</option>
              <option>Increase search traffic</option>
              <option>Drive conversions</option>
              <option>Make an announcement</option>
              <option>Compare products</option>
              <option>Other</option>
            </select>

            <label>What should the reader do after reading?</label>
            <input
              name="cta"
              value={formData.cta}
              onChange={handleChange}
              placeholder="e.g. Buy now, Schedule a call"
              required
            />

            <label>Any inspiration links or competitors you like?</label>
            <input
              name="inspiration"
              type="url"
              value={formData.inspiration}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />

            <label>Anything we should avoid?</label>
            <textarea
              name="avoid"
              value={formData.avoid}
              onChange={handleChange}
              required
            />

            <label>Preferred structure or layout:</label>
            {["Paragraph", "Bullet Points", "Q&A", "Comparison Table", "Email Layout"].map(opt => (
              <label key={opt} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  name="format"
                  value={opt}
                  checked={formData.format.includes(opt)}
                  onChange={handleChange}
                />{" "}
                {opt}
              </label>
            ))}
          </div>
        )}

        <label>
          <input
            type="checkbox"
            name="agreed"
            checked={formData.agreed}
            onChange={handleChange}
            required
          />{" "}
          I agree to the terms and understand how my order will be processed.
        </label>

        <button type="submit" style={{
          backgroundColor: '#0070f3',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Submit Order
        </button>
      </form>
    </main>
  );
}
