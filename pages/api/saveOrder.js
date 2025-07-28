import { Client } from "pg";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const order = req.body;

  // Validate required fields
  if (
    !order.customer_email ||
    !order.bundles ||
    !Array.isArray(order.bundles)
  ) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  // Connect to PostgreSQL without SSL (adjust if your DB requires it)
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // Disable SSL here to fix the SSL connection error
  });

  try {
    await client.connect();

    // Insert order into 'orders' table
    const query = `
      INSERT INTO orders (
        id,
        created_at,
        customer_email,
        plan,
        bundle_ids,
        status,
        client_feedback,
        ai_assistant,
        submitted_at,
        total_price,
        source_page,
        internal_notes,
        client_name,
        feedback_submitted_at,
        assistant_output,
        source_campaign,
        completion_time_ms,
        review_notes,
        recurring
      ) VALUES (
        gen_random_uuid(),
        NOW(),
        $1,
        $2,
        $3,
        'pending',
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      RETURNING id
    `;

    const values = [
      order.customer_email,
      order.plan || null,
      JSON.stringify(order.bundles.map((b) => b.id)),
      order.client_feedback || "none yet",
      order.ai_assistant || "ChatGPT",
      order.submitted_at || new Date().toISOString(),
      order.total_price || 0,
      order.source_page || null,
      order.internal_notes || null,
      order.client_name || null,
      order.feedback_submitted_at || null,
      JSON.stringify(order.assistant_output || {}),
      order.source_campaign || null,
      order.completion_time_ms || 0,
      order.review_notes || null,
      order.recurring || false,
    ];

    const result = await client.query(query, values);

    await client.end();

    return res.status(200).json({ success: true, orderId: result.rows[0].id });
  } catch (error) {
    console.error("Database insertion error:", error);
    await client.end();
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
