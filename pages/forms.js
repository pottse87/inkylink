import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function IntakeForm() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [templates, setTemplates] = useState({});
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetch('/form_templates.json')
      .then((res) => res.json())
      .then((loadedTemplates) => {
        setTemplates(loadedTemplates);

        if (router.query && router.query.order) {
          try {
            const decoded = decodeURIComponent(router.query.order);
            const parsedOrder = JSON.parse(decoded);
            setOrder(parsedOrder);

            // 💵 Calculate total price
            const calculatedTotal = parsedOrder.items.reduce((sum, item) => {
              return sum + (item.price || 0) * (item.quantity || 1);
            }, 0);
            setTotalPrice(calculatedTotal);

            // Set up empty answer slots
            const initial = {};
            parsedOrder.items.forEach(item => {
              const questions = loadedTemplates[item.id.replace(/-/g, " ")] || [];
              initial[item.id] = questions.map(q => ({
                question: q.question,
                answer: ''
              }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formPayload = {
      order_id: order?.order_id || `${Date.now()}_${order?.client_name || 'order'}`,
      customer_email: order?.customer_email || '',
      plan: order?.plan || '',
      bundle_ids: JSON.stringify(order?.items.map(item => ({ ...item, id: item.id.replace(/-/g, " ") })) || []),
      client_feedback: '',
      rework_count: 0,
      ai_assistant: 'ChatGPT',
      total_price: totalPrice,
      approved: false,
      delivered: false,
      source_page: 'forms',
      internal_notes: '',
      client_name: order?.client_name || '',
      revision_limit: order?.revision_limit || 3,
      assistant_output: formData || {},
      payment_status: 'unpaid',
      source_campaign: order?.source_campaign || 'organic',
      completion_time_ms: 0,
      priority_level: 'normal',
      language: 'en',
      review_notes: '',
      recurring: false,
      submitted_at: new Date().toISOString(),
      feedback_submitted_at: null,
      status: 'ready_for_ai' // 🚀 ready for local AI watcher
    };

    try {
      const response = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });

      if (response.ok) {
        setSubmitted(true);
        router.push('/thankyou');
      } else {
        console.error('Failed to save order:', await response.text());
        alert('There was an issue submitting your form.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again later.');
    }
  };

  if (!order) {
    return <p>Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {order.items.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          {(formData[item.id] || []).map((entry, index) => (
            <div key={index}>
              <label>{entry.question}</label>
              <input
                type="text"
                value={entry.answer}
                onChange={(e) =>
                  handleChange(item.id, index, e.target.value)
                }
                required
              />
            </div>
          ))}
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
