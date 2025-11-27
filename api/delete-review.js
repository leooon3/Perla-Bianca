import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  //#region CORS & Security
  if (cors(req, res)) return res.status(200).end();

  try {
    verifyAuth(req); // Security: Admin only
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
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
    //#endregion

    //#region Delete Logic
    const { rowIndex } = req.body;

    if (rows[rowIndex]) {
      await rows[rowIndex].delete();
      return res.status(200).json({ success: true });
    } else {
      throw new Error("Review not found (maybe already deleted)");
    }
    //#endregion
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
