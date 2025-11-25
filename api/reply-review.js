import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  if (cors(req, res)) return res.status(200).end();

  // Verifica che l'utente sia loggato come Admin
  try {
    verifyAuth(req);
  } catch (err) {
    return res.status(401).json({ error: "Non autorizzato" });
  }

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Autenticazione Google Sheets (Standard)
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      try {
        privateKey = Buffer.from(privateKey, "base64").toString("utf-8");
      } catch (e) {}
    }
    if (privateKey.includes("\\n"))
      privateKey = privateKey.replace(/\\n/g, "\n");

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
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Dati in arrivo dal frontend
    const { rowIndex, replyText } = req.body;

    if (rows[rowIndex]) {
      // Aggiorna solo la colonna "Risposta"
      rows[rowIndex].assign({ Risposta: replyText });
      await rows[rowIndex].save();
      return res.status(200).json({ success: true });
    } else {
      throw new Error("Recensione non trovata");
    }
  } catch (error) {
    console.error("Errore salvataggio risposta:", error);
    return res.status(500).json({ error: error.message });
  }
}
