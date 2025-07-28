// pages/api/insert-test-order.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ name: 'Test Order', email: 'test@example.com', amount: 123 }])
    .select();

  if (error) {
    console.error('Insert error:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}
