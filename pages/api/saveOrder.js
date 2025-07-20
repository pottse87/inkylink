import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const filePath = path.join(process.cwd(), 'orders.json');
    const newOrder = { ...req.body, timestamp: new Date().toISOString() };

    let existingOrders = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      existingOrders = JSON.parse(fileData);
    }

    existingOrders.push(newOrder);
    fs.writeFileSync(filePath, JSON.stringify(existingOrders, null, 2));

    return res.status(200).json({ success: true });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
