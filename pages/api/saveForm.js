import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const form = req.body;
    form.id = uuidv4();

    const submissionsDir = path.join(process.cwd(), "form_submissions");
    if (!fs.existsSync(submissionsDir)) {
      fs.mkdirSync(submissionsDir);
    }

    const filePath = path.join(submissionsDir, `${form.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(form, null, 2));

    return res.status(200).json({ success: true, form });
  } catch (error) {
    console.error("SaveForm API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
