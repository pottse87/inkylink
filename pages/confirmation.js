import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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

  const handleCheckout = async () => {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundles: selectedBundles }),
    });

    const session = await response.json();
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({ sessionId: session.id });
  };

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">🧾 Order Confirmation</h1>
      {selectedBundles.length === 0 ? (
        <p>No items selected. Please go back and build your bundle.</p>
      ) : (
        <div className="space-y-4">
          {selectedBundles.map((bundle, index) => (
            <div
              key={index}
              className="p-4 border rounded-xl bg-white shadow text-left"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={/icons/}
                  alt={bundle.name}
                  className="w-10 h-10"
                />
                <div>
                  <h2 className="text-xl font-semibold">{bundle.name}</h2>
                  <p>{bundle.description}</p>
                  <p className="font-bold"></p>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleCheckout}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
          >
            Place Order & Checkout
          </button>
        </div>
      )}
    </div>
  );
}
