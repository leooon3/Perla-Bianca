import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  //#region CORS & Security
  // Handle CORS preflight
  if (cors(req, res)) return res.status(200).end();

  // Verify Admin Token
  try {
    verifyAuth(req);
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Session expired or invalid. Please login." });
  }
  //#endregion

  try {
    //#region Google Sheet Connection
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

    // Resolve sheet ID per property (with fallback to default)
    const propertyKey = (req.body?.property || "perla-bianca")
      .toUpperCase()
      .replace(/-/g, "_");
    const sheetId =
      process.env[`GOOGLE_SHEET_ID_${propertyKey}`] ||
      process.env.GOOGLE_SHEET_ID;

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Reviews Sheet
    const rows = await sheet.getRows();
    //#endregion

    //#region Approval Logic
    const { rowIndex } = req.body;

    if (rows[rowIndex]) {
      rows[rowIndex].assign({ Approvato: "SI" });
      await rows[rowIndex].save();
      return res.status(200).json({ success: true });
    } else {
      throw new Error("Review not found");
    }
    //#endregion
  } catch (error) {
    console.error("Approval API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
