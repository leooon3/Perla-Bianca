import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth } from "./_utils.js";

export default async function handler(req, res) {
  //#region CORS & Preflight
  const allowedOrigins = [
    "https://perla-bianca.vercel.app",
    "https://isarcofagidelre.it",
    "https://www.isarcofagidelre.it",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  }

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  //#endregion

  try {
    //#region Google Auth & Sheet Connection
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error("Missing Google Configuration");
    }

    // Decode private key (Handle Base64 and newlines)
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
    const sheet = doc.sheetsByIndex[0]; // Assuming reviews are in the first sheet
    //#endregion

    //#region Data Processing
    const rows = await sheet.getRows();

    // Transform raw rows into clean JSON
    const reviews = rows.map((row) => ({
      "Nome e Cognome": row.get("Nome e Cognome"),
      Valutazione: row.get("Valutazione"),
      Recensione: row.get("Recensione"),
      "Data Soggiorno": row.get("Data Soggiorno"),
      Approvato: row.get("Approvato"),
      Risposta: row.get("Risposta"),
    }));

    // Admin sees all reviews; public only sees approved ones
    let isAdmin = false;
    try {
      verifyAuth(req);
      isAdmin = true;
    } catch (e) {}

    if (isAdmin) {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(reviews);
    } else {
      const approved = reviews.filter(
        (r) => r.Approvato && r.Approvato.toUpperCase() === "SI"
      );
      res.status(200).json(approved);
    }
    //#endregion
  } catch (error) {
    console.error("Reviews API Error:", error);
    res.status(500).json({ error: "Unable to retrieve reviews" });
  }
}
