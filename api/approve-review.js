import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js"; // Importiamo i nuovi strumenti di sicurezza

export default async function handler(req, res) {
  // 1. GESTIONE CORS STANDARD
  // Se è una richiesta di "pre-flight" (OPTIONS), rispondiamo OK e ci fermiamo.
  if (cors(req, res)) return res.status(200).end();

  // 2. SICUREZZA: VERIFICA TOKEN
  // Sostituisce il vecchio controllo "x-admin-password"
  try {
    verifyAuth(req); // Se il token non è valido, questa funzione lancia un errore
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Sessione scaduta o non valida. Effettua il login." });
  }

  // 3. LOGICA GOOGLE SHEETS (Uguale a prima)
  try {
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
    const sheet = doc.sheetsByIndex[0]; // Foglio Recensioni
    const rows = await sheet.getRows();

    const { rowIndex } = req.body;

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
