// pages/api/save-order.js
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    customer_email,
    plan,
    bundle_ids,
    client_feedback,
    rework_count,
    ai_assistant,
    total_price,
    approved,
    delivered,
    source_page,
    internal_notes,
    client_name,
    revision_limit,
    assistant_output,
    payment_status,
    source_campaign,
    completion_time_ms,
    priority_level,
    language,
    review_notes,
    recurring,
    submitted_at,
    feedback_submitted_at,
  } = req.body;

  const status = 'pending';

  try {
    // 1️⃣ Save to PostgreSQL (existing logic)
    const query = `
      INSERT INTO orders (
        customer_email, plan, bundle_ids, status, client_feedback, rework_count,
        ai_assistant, total_price, approved, delivered, source_page,
        internal_notes, client_name, revision_limit, assistant_output,
        payment_status, source_campaign, completion_time_ms, priority_level,
        language, review_notes, recurring, submitted_at, feedback_submitted_at
      )
      VALUES (
        $1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      )
    `;

    const values = [
      customer_email,
      plan,
      JSON.stringify(bundle_ids),
      status,
      client_feedback,
      rework_count || 0,
      ai_assistant,
      total_price,
      approved || false,
      delivered || false,
      source_page,
      internal_notes,
      client_name,
      revision_limit || 3,
      JSON.stringify(assistant_output),
      payment_status || 'unpaid',
      source_campaign,
      completion_time_ms,
      priority_level || 'normal',
      language || 'en',
      review_notes,
      recurring || false,
      submitted_at || new Date(),
      feedback_submitted_at || null,
    ];

    await pool.query(query, values);

    // 2️⃣ Save locally to /orders directory
    try {
      const ordersDir = path.join(process.cwd(), 'orders');
      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${client_name || 'order'}.json`;
      const filePath = path.join(ordersDir, fileName);

      const localOrder = {
        order_id: fileName.replace('.json', ''),
        customer_email,
        plan,
        bundle_ids,
        status,
        client_feedback,
        rework_count: rework_count || 0,
        ai_assistant,
        total_price,
        approved: approved || false,
        delivered: delivered || false,
        source_page,
        internal_notes,
        client_name,
        revision_limit: revision_limit || 3,
        assistant_output,
        payment_status: payment_status || 'unpaid',
        source_campaign,
        completion_time_ms,
        priority_level: priority_level || 'normal',
        language: language || 'en',
        review_notes,
        recurring: recurring || false,
        submitted_at: submitted_at || new Date(),
        feedback_submitted_at: feedback_submitted_at || null
      };

      fs.writeFileSync(filePath, JSON.stringify(localOrder, null, 2));
      console.log(`✅ Order saved locally: ${filePath}`);
    } catch (localErr) {
      console.error('⚠ Error saving local order file:', localErr);
    }

    res.status(200).json({ message: 'Order saved to PostgreSQL and locally' });

  } catch (error) {
    console.error('❌ Error saving order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
