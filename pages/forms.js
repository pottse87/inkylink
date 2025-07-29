import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function IntakeForm() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [templates, setTemplates] = useState({});
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load form templates from /public/form_templates.json
    fetch('/form_templates.json')
      .then((res) => res.json())
      .then((loadedTemplates) => {
        setTemplates(loadedTemplates);

        // Then parse the order object from router
        if (router.query && router.query.order) {
          try {
            const decoded = decodeURIComponent(router.query.order);
            const parsedOrder = JSON.parse(decoded);
            setOrder(parsedOrder);

            // Initialize empty answer set
            const initial = {};
            parsedOrder.items.forEach(item => {
              const questions = loadedTemplates[item.id] || [];
              initial[item.id] = questions.map(q => ({ question: q.question, answer: '' }));
            });
            setFormData(initial);
          } catch (err) {
            console.error('Order parsing failed:', err);
          }
        }
      });
  }, [router.query]);

  const handleChange = (itemId, index, value) => {
    const updated = { ...formData };
    updated[itemId][index].answer = value;
    setFormData(updated);
  };

  const handleSubmit = async () => {
    if (!order) return;

    const updatedOrder = {
      ...order,
      form_data: formData,
      status: 'needs_review'
    };

    try {
      const res = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (res.ok) {
        setSubmitted(true);
        router.push('/thankyou');
      } else {
        console.error('Save failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  if (!order) return <p>Loading order...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Answer a few quick questions</h1>
      {order.items.map(item => (
        <div key={item.id} style={{ marginBottom: '2rem' }}>
          <h3>{item.name} (×{item.quantity})</h3>
          {(templates[item.id] || []).map((q, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <label>{q.question}</label><br />
              <input
                type="text"
                value={formData[item.id]?.[idx]?.answer || ''}
                onChange={(e) => handleChange(item.id, idx, e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#008060', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Submit
      </button>
    </div>
  );
}
