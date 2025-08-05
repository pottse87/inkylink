import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const logsDir = path.join(process.cwd(), 'logs', 'website');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logPath = path.join(logsDir, `error-${timestamp}.json`);
    fs.writeFileSync(logPath, JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
