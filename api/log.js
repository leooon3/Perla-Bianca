import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

async function ensureSheet(doc) {
  if (doc.sheetsByTitle["Log"]) return doc.sheetsByTitle["Log"];
  return await doc.addSheet({ title: "Log", headerValues: ["Timestamp","Utente","Azione","Dettagli","Proprieta"] });
}

async function getDoc(privateKey) {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
}

export default async function handler(req, res) {
  if (cors(req, res)) return res.status(200).end();

  let user;
  try { user = verifyAuth(req); } catch(e) { return res.status(401).json({ error: "Unauthorized" }); }

  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    try { privateKey = Buffer.from(privateKey, "base64").toString("utf-8"); } catch(e){}
  }
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  const doc = await getDoc(privateKey);

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    const sheet = await ensureSheet(doc);
    const rows = await sheet.getRows();
    const log = rows
      .map((r) => ({
        timestamp: r.get("Timestamp"),
        utente: r.get("Utente"),
        azione: r.get("Azione"),
        dettagli: r.get("Dettagli"),
        proprieta: r.get("Proprieta"),
      }))
      .reverse() // newest first
      .slice(0, 100);
    return res.status(200).json(log);
  }

  if (req.method === "POST") {
    const { azione, dettagli, proprieta } = req.body;
    if (!azione) return res.status(400).json({ error: "azione required" });
    const sheet = await ensureSheet(doc);
    await sheet.addRow({
      Timestamp: new Date().toISOString(),
      Utente: user.email,
      Azione: azione,
      Dettagli: dettagli || "",
      Proprieta: proprieta || "perla-bianca",
    });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
