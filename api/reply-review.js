import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  //#region CORS & Security
  if (cors(req, res)) return res.status(200).end();

  // Verify Admin Login
  try {
    verifyAuth(req);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  //#endregion

  try {
    //#region Google Sheet Connection
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

    // Resolve sheet ID per property (with fallback to default)
    const propertyKey = (req.body?.property || "perla-bianca")
      .toUpperCase()
      .replace(/-/g, "_");
    const sheetId =
      process.env[`GOOGLE_SHEET_ID_${propertyKey}`] ||
      process.env.GOOGLE_SHEET_ID;

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    //#endregion

    //#region Save Reply Logic
    const { rowIndex, replyText } = req.body;

    if (rows[rowIndex]) {
      // Update only the "Risposta" column
      rows[rowIndex].assign({ Risposta: replyText });
      await rows[rowIndex].save();
      return res.status(200).json({ success: true });
    } else {
      throw new Error("Review not found");
    }
    //#endregion
  } catch (error) {
    console.error("Save Reply Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
