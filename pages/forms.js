import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function IntakeForm() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Simulated form templates
  const formTemplates = {
    'expansion-kit': [
      { question: 'What products are we describing?', type: 'text' },
      { question: 'Who is your target customer?', type: 'text' }
    ],
    'conversion-booster': [
      { question: 'What are the top objections customers have?', type: 'text' },
      { question: 'What benefits should we emphasize?', type: 'text' }
    ],
    'launch-kit': [
      { question: 'Describe your brand vibe in a sentence.', type: 'text' },
      { question: 'What makes your store unique?', type: 'text' }
    ]
    // Add more templates as needed
  };

  useEffect(() => {
    if (router.query && router.query.order) {
      try {
        const decoded = decodeURIComponent(router.query.order);
        const parsedOrder = JSON.parse(decoded);
        setOrder(parsedOrder);

        // Pre-fill form data object with empty answers
        const initialData = {};
        parsedOrder.items.forEach(item => {
          const questions = formTemplates[item.id] || [];
          initialData[item.id] = questions.map(q => ({ question: q.question, answer: '' }));
        });
        setFormData(initialData);
      } catch (err) {
        console.error('Error parsing order:', err);
      }
    }
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
      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (response.ok) {
        setSubmitted(true);
        router.push('/thankyou');
      } else {
        console.error('Save failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  if (!order) return <p>Loading order...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Answer a few quick questions</h1>
      {order.items.map(item => (
        <div key={item.id} style={{ marginBottom: '2rem' }}>
          <h3>{item.name} (×{item.quantity})</h3>
          {(formTemplates[item.id] || []).map((q, idx) => (
            <div key={idx} style={{ marginBottom: '0.5rem' }}>
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
