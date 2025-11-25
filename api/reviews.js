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

  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // ============================================================
    // 2. AUTENTICAZIONE GOOGLE & CONNESSIONE FOGLIO
    // ============================================================
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error("Configurazione Google mancante");
    }

    // Decodifica la chiave privata (gestione Base64 e newline)
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

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID,
      serviceAccountAuth
    );

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Assumiamo che le recensioni siano nel primo foglio

    // ============================================================
    // 3. LETTURA E FORMATTAZIONE DATI
    // ============================================================
    const rows = await sheet.getRows();

    // Trasformiamo le righe grezze in un oggetto JSON pulito
    const reviews = rows.map((row) => ({
      "Nome e Cognome": row.get("Nome e Cognome"),
      Valutazione: row.get("Valutazione"),
      Recensione: row.get("Recensione"),
      "Data Soggiorno": row.get("Data Soggiorno"),
      Approvato: row.get("Approvato"),
      Risposta: row.get("Risposta"),
    }));

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Errore API Recensioni:", error);
    res.status(500).json({ error: "Impossibile recuperare le recensioni" });
  }
}
