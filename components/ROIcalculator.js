import React, { useState } from "react";

export default function ROIcalculator() {
  const [traffic, setTraffic] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [avgOrderValue, setAvgOrderValue] = useState("");
  const [result, setResult] = useState(null);

  const calculateROI = () => {
    const t = parseFloat(traffic);
    const c = parseFloat(conversionRate);
    const aov = parseFloat(avgOrderValue);

    if (isNaN(t) || isNaN(c) || isNaN(aov)) {
      setResult("Please enter valid numbers.");
      return;
    }

    const baselineRevenue = ((t * (c / 100)) * aov);
    const improvedConversionRate = c * 1.5; // 50% conversion uplift
    const improvedRevenue = ((t * (improvedConversionRate / 100)) * aov);
    const uplift = improvedRevenue - baselineRevenue;

    setResult({
      baseline: baselineRevenue.toFixed(2),
      projected: improvedRevenue.toFixed(2),
      gain: uplift.toFixed(2),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Conversion ROI Calculator
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Monthly Traffic
        </label>
        <input
          type="number"
          value={traffic}
          onChange={(e) => setTraffic(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., 5000"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Current Conversion Rate (%)
        </label>
        <input
          type="number"
          value={conversionRate}
          onChange={(e) => setConversionRate(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., 2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Average Order Value ($)
        </label>
        <input
          type="number"
          value={avgOrderValue}
          onChange={(e) => setAvgOrderValue(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., 45"
        />
      </div>

      <button
        onClick={calculateROI}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
      >
        Calculate ROI
      </button>

      {result && (
        <div className="mt-6 text-center">
          <p className="text-gray-800">📉 Baseline Revenue: <strong>${result.baseline}</strong></p>
          <p className="text-gray-800">📈 Projected Revenue w/ Inkylink: <strong>${result.projected}</strong></p>
          <p className="text-green-700 font-bold mt-2">🚀 Estimated Monthly Gain: ${result.gain}</p>
          <p className="text-sm text-gray-500 mt-4 italic">
  *This tool provides estimates only. Actual results may vary based on traffic quality, product type, and implementation.
</p>

        </div>
      )}
    </div>
  );
}
