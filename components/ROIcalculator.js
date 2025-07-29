import React, { useState } from "react";

export default function ROIcalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [traffic, setTraffic] = useState("");
  const [result, setResult] = useState(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const calculate = () => {
    const p = parseFloat(price);
    const c = parseFloat(conversionRate);
    const t = parseFloat(traffic);
    if (isNaN(p) || isNaN(c) || isNaN(t)) {
      setResult("Please enter valid numbers.");
      return;
    }
    const roi = ((p * (c / 100)) * t).toFixed(2);
    setResult(`Projected monthly revenue: $${roi}`);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <button
        onClick={toggleOpen}
        className="text-4xl cursor-pointer mb-4"
        aria-label="Toggle ROI Calculator"
      >
        💡
      </button>
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Conversion ROI Calculator
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Avg. Order Value ($)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., 45"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Conversion Rate (%)
            </label>
            <input
              type="number"
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., 3"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Monthly Traffic
            </label>
            <input
              type="number"
              value={traffic}
              onChange={(e) => setTraffic(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., 2000"
            />
          </div>
          <button
            onClick={calculate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            Calculate ROI
          </button>
          {result && (
            <p className="mt-4 text-center text-green-700 font-semibold">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
