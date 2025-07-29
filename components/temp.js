// components/ROICalculator.js

import React, { useState } from "react";

export default function ROICalculator() {
  const [traffic, setTraffic] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [averageOrderValue, setAverageOrderValue] = useState("");
  const [roi, setRoi] = useState(null);

  const calculateROI = () => {
    const visitors = parseFloat(traffic);
    const rate = parseFloat(conversionRate) / 100;
    const orderValue = parseFloat(averageOrderValue);

    if (!isNaN(visitors) && !isNaN(rate) && !isNaN(orderValue)) {
      const sales = visitors * rate;
      const revenue = sales * orderValue;
      setRoi(revenue.toFixed(2));
    } else {
      setRoi(null);
    }
  };

  return (
    <div
      style={{
        margin: "4rem auto",
        maxWidth: "600px",
        background: "#ffffff",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 0 12px rgba(0,0,0,0.05)",
        fontFamily: "Lato, sans-serif"
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Not sure how we can help?
        <br />
        <span style={{ fontSize: "1rem", color: "#555" }}>
          Use our conversion calculator to estimate potential ROI
        </span>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="number"
          placeholder="Monthly Website Visitors"
          value={traffic}
          onChange={(e) => setTraffic(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Conversion Rate (%)"
          value={conversionRate}
          onChange={(e) => setConversionRate(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Average Order Value ($)"
          value={averageOrderValue}
          onChange={(e) => setAverageOrderValue(e.target.value)}
          style={inputStyle}
        />

        <button onClick={calculateROI} style={buttonStyle}>
          Calculate ROI
        </button>

        {roi && (
          <div style={{ marginTop: "1rem", textAlign: "center", color: "#0070f3" }}>
            Estimated Revenue: <strong>${roi}</strong>/mo
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "0.75rem",
  fontSize: "1rem",
  borderRadius: "5px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  padding: "0.75rem",
  fontSize: "1rem",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};
