import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  //#region CORS Setup
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
    if (nome.length > 50) {
      return res
        .status(400)
        .json({ message: "Nome troppo lungo (max 50 caratteri)." });
    }
    if (messaggio.length > 1000) {
      return res
        .status(400)
        .json({ message: "Messaggio troppo lungo (max 1000 caratteri)." });
    }

    const votoInt = parseInt(voto);
    if (isNaN(votoInt) || votoInt < 1 || votoInt > 5) {
      return res.status(400).json({ message: "Voto non valido." });
    }

    const cleanMessage = messaggio.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanName = nome.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      "Nome e Cognome": cleanName,
      Valutazione: votoInt,
      Recensione: cleanMessage,
      "Data Soggiorno": dataSoggiorno,
      Approvato: "NO",
    });
    //#endregion

    //#region Send notification email to Admin
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Perla Bianca Bot" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, //Send to yourself
        subject: `⭐ Nuova Recensione: ${voto}/5 da ${nome}`,
        html: `
          <h3>Hai ricevuto una nuova recensione!</h3>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Voto:</strong> ${voto} stelle</p>
          <p><strong>Periodo:</strong> ${dataSoggiorno}</p>
          <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #007bff;">
            ${messaggio}
          </blockquote>
          <p><a href="https://perla-bianca.vercel.app/admin.html" style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Vai all'Admin per approvare</a></p>
        `,
      });
    } catch (mailError) {
      console.error("Errore invio notifica admin:", mailError);
      // Not Blocking user review if email fails
    }
    //#endregion
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Submit Review API Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
