// components/ROICalculator.js - Replace the current file with:
import React, { useState } from "react";

export default function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(25000);
  const [conversionRate, setConversionRate] = useState(2.5);
  const [avgOrderValue, setAvgOrderValue] = useState(75);

  const currentMonthlyOrders = Math.round(monthlyRevenue / avgOrderValue);
  const currentTraffic = Math.round(currentMonthlyOrders / (conversionRate / 100));
  
  // Conservative 15-25% improvement estimate
  const improvedConversionRate = conversionRate * 1.2;
  const newMonthlyOrders = Math.round(currentTraffic * (improvedConversionRate / 100));
  const newMonthlyRevenue = newMonthlyOrders * avgOrderValue;
  const monthlyIncrease = newMonthlyRevenue - monthlyRevenue;
  const roiVsInvestment = monthlyIncrease - 129; // Assuming Growth plan cost

  return (
    <div style={{ padding: "1.5rem", fontFamily: "inherit" }}>
      <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Revenue Impact Calculator</h3>
      
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Current Monthly Revenue: ${monthlyRevenue.toLocaleString()}
        </label>
        <input
          type="range"
          min="5000"
          max="100000"
          step="2500"
          value={monthlyRevenue}
          onChange={(e) => setMonthlyRevenue(parseInt(e.target.value))}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Current Conversion Rate: {conversionRate.toFixed(1)}%
        </label>
        <input
          type="range"
          min="0.5"
          max="8"
          step="0.1"
          value={conversionRate}
          onChange={(e) => setConversionRate(parseFloat(e.target.value))}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Average Order Value: ${avgOrderValue}
        </label>
        <input
          type="range"
          min="25"
          max="300"
          step="5"
          value={avgOrderValue}
          onChange={(e) => setAvgOrderValue(parseInt(e.target.value))}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
      </div>

      <div style={{ 
        padding: "1.5rem", 
        backgroundColor: "#f8fafc", 
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        marginTop: "1.5rem"
      }}>
        <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "#1a202c" }}>Projected Impact</h4>
        
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#4a5568" }}>Current traffic: </span>
          <strong>{currentTraffic.toLocaleString()} visitors/month</strong>
        </div>
        
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#4a5568" }}>Improved conversion: </span>
          <strong>{improvedConversionRate.toFixed(1)}%</strong>
          <span style={{ fontSize: "0.8rem", color: "#48bb78", marginLeft: "0.5rem" }}>
            (+{((improvedConversionRate - conversionRate) / conversionRate * 100).toFixed(0)}%)
          </span>
        </div>

        <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#e6fffa", borderRadius: "4px" }}>
          <div style={{ fontSize: "0.9rem", color: "#2d3748", marginBottom: "0.25rem" }}>
            Estimated monthly increase:
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#2b6cb0" }}>
            ${monthlyIncrease.toLocaleString()}
          </div>
        </div>

        <div style={{ fontSize: "0.85rem", color: "#718096", marginBottom: "0.75rem" }}>
          ROI vs Growth Plan (${roiVsInvestment > 0 ? '+' : ''}${roiVsInvestment.toLocaleString()}/month)
        </div>

        <div style={{ fontSize: "0.8rem", color: "#a0aec0", lineHeight: "1.4" }}>
          Based on industry data showing 15-25% conversion improvements from optimized product content and SEO.
        </div>
      </div>
    </div>
  );
}