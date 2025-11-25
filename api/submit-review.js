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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Solo POST" });

  try {
    // ============================================================
    // 2. VALIDAZIONE DATI INPUT
    // ============================================================
    const { nome, voto, messaggio, dataSoggiorno } = req.body;

    if (!nome || !voto || !messaggio || !dataSoggiorno) {
      return res
        .status(400)
        .json({ message: "Compila tutti i campi, incluse le date." });
    }

    // ============================================================
    // 3. AUTENTICAZIONE GOOGLE & CARICAMENTO FOGLIO
    // ============================================================
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Manca la variabile GOOGLE_PRIVATE_KEY su Vercel");
    }

    // Decodifica chiave privata (Base64 e newline)
    let privateKey;
    try {
      privateKey = Buffer.from(
        process.env.GOOGLE_PRIVATE_KEY,
        "base64"
      ).toString("utf-8");
    } catch (e) {
      throw new Error("La chiave su Vercel non è in formato Base64 valido");
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

    // Selezioniamo il primo foglio (Recensioni)
    const sheet = doc.sheetsByIndex[0];

    // ============================================================
    // 4. SALVATAGGIO DATI
    // ============================================================
    // Le colonne nel foglio Google Sheets DEVONO corrispondere a queste chiavi
    await sheet.addRow({
      "Nome e Cognome": nome,
      Valutazione: voto,
      Recensione: messaggio,
      "Data Soggiorno": dataSoggiorno, // Formato custom "dal - al"
      Approvato: "NO", // Default: non approvato
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Errore API Submit Review:", error);
    return res.status(500).json({
      message: "Errore interno server",
      error: error.message,
    });
  }
}
