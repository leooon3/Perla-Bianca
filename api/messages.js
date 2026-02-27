import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  if (cors(req, res)) return res.status(200).end();

  try { verifyAuth(req); } catch(e) { return res.status(401).json({ error: "Unauthorized" }); }

  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    try { privateKey = Buffer.from(privateKey, "base64").toString("utf-8"); } catch(e){}
  }
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle["Messaggi"];
  if (!sheet) {
    sheet = await doc.addSheet({ title: "Messaggi", headerValues: ["Timestamp","Nome","Email","Messaggio","Proprieta","Letto","Risposto"] });
  }

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    const property = req.query?.property || "perla-bianca";
    const rows = await sheet.getRows();
    const messages = rows
      .filter((r) => !property || (r.get("Proprieta") || "perla-bianca") === property)
      .map((r, i) => ({
        idx: i,
        timestamp: r.get("Timestamp"),
        nome: r.get("Nome"),
        email: r.get("Email"),
        messaggio: r.get("Messaggio"),
        proprieta: r.get("Proprieta"),
        letto: r.get("Letto"),
        risposto: r.get("Risposto"),
      }))
      .reverse(); // newest first
    return res.status(200).json(messages);
  }

  if (req.method === "POST") {
    const { action, idx } = req.body;
    const rows = await sheet.getRows();
    if (idx === undefined || !rows[idx]) return res.status(404).json({ error: "Not found" });
    if (action === "mark-read") { rows[idx].set("Letto", "SI"); await rows[idx].save(); }
    else if (action === "mark-replied") { rows[idx].set("Risposto", "SI"); await rows[idx].save(); }
    else return res.status(400).json({ error: "Unknown action" });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
