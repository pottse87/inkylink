import React from "react";

export default function QuantitySelector({ bundle, quantity, onQuantityChange }) {
  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 99) {
      onQuantityChange(bundle.id, newValue);
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <input
        type="number"
        value={quantity}
        min={0}
        max={99}
        onChange={handleInputChange}
        style={{
          width: "3.5rem",
          textAlign: "center",
          fontSize: "1.1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#f9f9f9",
        }}
        aria-label={`Quantity of ${bundle.title}`}
      />
    </div>
  );
}
