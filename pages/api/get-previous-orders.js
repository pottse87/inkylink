import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { client_id } = req.body;

  try {
    const dbPath = path.join('E:', 'inkylink', 'orders.json');
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const allOrders = JSON.parse(rawData);

    const previous = allOrders.filter(order => order.client_id === client_id);
    res.status(200).json(previous);
  } catch (error) {
    console.error('Error fetching past orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
}
