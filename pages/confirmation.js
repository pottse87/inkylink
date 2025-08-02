import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';


export default function ConfirmationPage() {
  const router = useRouter();
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]); // 🟡 Add this

useEffect(() => {
  // 🔶 Fetch previous orders using clientId
  if (clientId) {
    fetch('/api/get-previous-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId })
    })
      .then(res => res.json())
      .then(data => setPreviousOrders(data))
      .catch(err => console.error('Fetch failed:', err));
  }
}, [clientId]);

useEffect(() => {
  // 🔶 Persist a client_id across sessions using localStorage
  let existingId = localStorage.getItem('inkylink_client_id');
  if (!existingId) {
    existingId = uuidv4(); // or crypto.randomUUID()
    localStorage.setItem('inkylink_client_id', existingId);
  }
  setClientId(existingId);
}, []);

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
      client_id: clientId,
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
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem'
    }}
  >
    <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
      {/* Left Side – Previous Orders */}
      <div style={{ flex: 1 }}>
        <h2>🔁 Previously Selected Services:</h2>
        {previousOrders.length > 0 ? (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {previousOrders.map((order, index) =>
              order.items.map((item, i) => (
                <li key={`${index}-${i}`} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong>{item.name}</strong> — ${item.price}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedBundles(prev => [
                          ...prev,
                          {
                            id: item.id,
                            name: item.name,
                            quantity: 1,
                            price: item.price,
                            icon: item.icon || ''
                          }
                        ])
                      }
                      style={{
                        backgroundColor: '#00b894',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.3rem 0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Add Again
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p>You haven't ordered anything yet!</p>
        )}
      </div>

      {/* Right Side – Cart */}
      <div style={{ flex: 1 }}>
        <h1>In Your Cart Today:</h1>
        {selectedBundles.length === 0 ? (
          <p>No items selected.</p>
        ) : (
          <ul>
            {selectedBundles.map((bundle, index) => (
              <li key={index}>
                <strong>{bundle.name}</strong> – × {bundle.quantity || 1}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    {/* Bottom Buttons */}
    <div
      style={{
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          backgroundColor: '#ff6666',
          color: '#333',
          border: 'none',
          borderRadius: '6px',
          padding: '0.6rem 1.2rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        onMouseOver={e => (e.target.style.backgroundColor = '#e65555')}
        onMouseOut={e => (e.target.style.backgroundColor = '#ff6666')}
      >
        ⬅ Back
      </button>

      <button
        onClick={handleConfirm}
        style={{
          backgroundColor: '#00b894',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '0.6rem 1.2rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        onMouseOver={e => (e.target.style.backgroundColor = '#00997a')}
        onMouseOut={e => (e.target.style.backgroundColor = '#00b894')}
      >
        Continue to Intake Form →
      </button>
    </div>
  </div>
);
}