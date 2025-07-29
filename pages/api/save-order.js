// pages/api/save-order.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const orderData = req.body;

    // Timestamped filename for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `order-${timestamp}.json`;

    // Save to external SSD path
    const ordersDir = "E:/inkylink_orders";
    const fullPath = path.join(ordersDir, filename);

    fs.writeFileSync(fullPath, JSON.stringify(orderData, null, 2), "utf8");

    return res.status(200).json({ message: "Order saved locally", filename });
  } catch (err) {
    console.error("Failed to save order:", err);
    return res.status(500).json({ error: "Failed to save order" });
  }
}
