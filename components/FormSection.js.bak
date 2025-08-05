// components/FormSection.js

import React, { useState } from "react";

export default function FormSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    businessName: "",
    websiteUrl: "",
    targetAudience: "",
    toneStyle: "",
    specialInstructions: "",
    keywords: "",
    consent: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consent) {
      alert("Please confirm consent before submitting.");
      return;
    }
    console.log("Form submitted:", formData);
    alert("Thanks! Your request has been submitted.");
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Kindly take a moment to complete each field below
      </h2>

      <label>Full Name</label>
      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />

      <label>Email Address</label>
      <input type="email" name="email" value={formData.email} onChange={handleChange} required />

      <label>Business Name</label>
      <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required />

      <label>Website URL (if available)</label>
      <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} />

      <label>Who is your target audience?</label>
      <textarea name="targetAudience" value={formData.targetAudience} onChange={handleChange} rows={3} />

      <label>What tone or style would you like the content to reflect?</label>
      <textarea name="toneStyle" value={formData.toneStyle} onChange={handleChange} rows={3} />

      <label>Special Instructions / Notes</label>
      <textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleChange} rows={3} />

      <label>Keywords or phrases you'd like us to include</label>
      <textarea name="keywords" value={formData.keywords} onChange={handleChange} rows={3} />

      <div style={{ marginTop: "1rem" }}>
        <label>
          <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} />
          &nbsp;I consent to the processing of this data so Inkylink and its AI assistants can fulfill my order.
        </label>
      </div>

      <button
        type="submit"
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit Request
      </button>
    </form>
  );
}
