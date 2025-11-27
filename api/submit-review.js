import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export default async function handler(req, res) {
  //#region CORS Setup
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
    return res.status(405).json({ message: "POST only" });
  //#endregion

  try {
    //#region Input Validation
    const { nome, voto, messaggio, dataSoggiorno } = req.body;

    if (!nome || !voto || !messaggio || !dataSoggiorno) {
      return res
        .status(400)
        .json({ message: "Please fill all fields, including dates." });
    }
    //#endregion

    //#region Google Sheet Connection
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Missing GOOGLE_PRIVATE_KEY on Vercel");
    }

    let privateKey;
    try {
      privateKey = Buffer.from(
        process.env.GOOGLE_PRIVATE_KEY,
        "base64"
      ).toString("utf-8");
    } catch (e) {
      throw new Error("Key on Vercel is not valid Base64");
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
    const sheet = doc.sheetsByIndex[0];
    //#endregion

    //#region Save Data
    // Column names MUST match Google Sheet headers
    await sheet.addRow({
      "Nome e Cognome": nome,
      Valutazione: voto,
      Recensione: messaggio,
      "Data Soggiorno": dataSoggiorno,
      Approvato: "NO", // Default: not approved
    });

    return res.status(200).json({ success: true });
    //#endregion
  } catch (error) {
    console.error("Submit Review API Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
