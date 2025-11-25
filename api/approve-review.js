import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export default async function handler(req, res) {
  // ============================================================
  // 1. CONFIGURAZIONE CORS & PREFLIGHT
  // ============================================================
  const allowedOrigins = [
    "https://perla-bianca.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-admin-password"
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  // ============================================================
  // 2. SICUREZZA (VERIFICA PASSWORD ADMIN)
  // ============================================================
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Password non valida" });
  }

  try {
    // ============================================================
    // 3. AUTENTICAZIONE GOOGLE (Service Account)
    // ============================================================
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      try {
        privateKey = Buffer.from(privateKey, "base64").toString("utf-8");
      } catch (e) {}
    }
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // ============================================================
    // 4. GESTIONE FOGLIO & AGGIORNAMENTO RIGA
    // ============================================================
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID,
      serviceAccountAuth
    );
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Foglio Recensioni
    const rows = await sheet.getRows();

    // Logica di approvazione
    const { rowIndex } = req.body;

    // Verifichiamo che la riga esista
    if (rows[rowIndex]) {
      rows[rowIndex].assign({ Approvato: "SI" });
      await rows[rowIndex].save();
      return res.status(200).json({ success: true });
    } else {
      throw new Error("Recensione non trovata");
    }
  } catch (error) {
    console.error("Errore API Approvazione:", error);
    return res.status(500).json({ error: error.message });
  }
}
