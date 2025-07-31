import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ConfirmationPage() {
  const router = useRouter();
  const [selectedBundles, setSelectedBundles] = useState([]);

  useEffect(() => {
    if (router.query && router.query.bundles) {
      try {
        const parsed = JSON.parse(router.query.bundles);
        setSelectedBundles(parsed);
      } catch (error) {
        console.error('Failed to parse bundles:', error);
      }
    }
  }, [router.query]);

  const generateOrderId = () => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = Math.random().toString(36).substring(2, 6);
    return 'order_' + timestamp + '_' + rand;
  };

  const handleConfirm = () => {
    const order = {
      order_id: generateOrderId(),
      source: router.query.source || 'confirmation',
      customer: {
        name: '',
        email: ''
      },
      items: selectedBundles.map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        quantity: bundle.quantity || 1,
        price: bundle.price,
        icon: bundle.icon || ''
      })),
      form_data: {},
      status: 'needs_form',
      created_at: Date.now()
    };

    const orderString = encodeURIComponent(JSON.stringify(order));
    router.push('/forms?order=' + orderString);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Confirm Your Selection</h1>
      {selectedBundles.length === 0 && <p>No items selected.</p>}
      {selectedBundles.length > 0 && (
        <ul>
          {selectedBundles.map((bundle, index) => (
            <li key={index}>
              <strong>{bundle.name}</strong> - * {bundle.quantity || 1}
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
        {/* Back Button - coral red */}
        <button
          onClick={() => router.back()}
          style={{
            backgroundColor: "#ff6666",
            color: "#333",
            border: "none",
            borderRadius: "6px",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background-color 0.2s ease"
          }}
          onMouseOver={e => (e.target.style.backgroundColor = "#e65555")}
          onMouseOut={e => (e.target.style.backgroundColor = "#ff6666")}
        >
          ⬅ Back
        </button>

        {/* Continue Button - emerald teal*/}
        <button
          onClick={handleConfirm}
          style={{
            backgroundColor: "#00b894",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background-color 0.2s ease"
          }}
          onMouseOver={e => (e.target.style.backgroundColor = "#00997a")}
          onMouseOut={e => (e.target.style.backgroundColor = "#00b894")}
        >
          Continue to Intake Form →
        </button>
      </div>
    </div> 
  ); 
} 
