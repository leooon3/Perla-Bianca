// api/auth.js
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

// CONFIGURAZIONE
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL; // O la tua mail gmail diretta
const EMAIL_PASS = process.env.EMAIL_PASS;
// Lista delle email che possono accedere (ADMIN)
const ALLOWED_EMAILS = ["leooonericcardo@gmail.com", "adarte05@libero.it"];

const client = new OAuth2Client(CLIENT_ID);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

export default async function handler(req, res) {
  // CORS Setup
  const allowedOrigins = [
    "https://perla-bianca.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin))
    res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { action, email, token, code, hash, expires } = req.body;

    // --- 1. LOGIN CON GOOGLE ---
    if (action === "google-login") {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
      const userEmail = ticket.getPayload().email.toLowerCase();

      if (!ALLOWED_EMAILS.includes(userEmail)) {
        return res
          .status(403)
          .json({ error: "Accesso negato: Email non autorizzata." });
      }

      const sessionToken = jwt.sign(
        { email: userEmail, role: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.status(200).json({ token: sessionToken });
    }

    // --- 2. INVIO CODICE OTP (EMAIL) ---
    if (action === "send-otp") {
      const userEmail = email.toLowerCase();
      if (!ALLOWED_EMAILS.includes(userEmail)) {
        // Per sicurezza, potresti non dire nulla, ma per uso personale è meglio l'errore chiaro
        return res
          .status(403)
          .json({ error: "Email non presente nella whitelist." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = Date.now() + 5 * 60 * 1000; // 5 minuti

      // Creiamo una "firma" per verificare dopo che il codice sia legittimo senza usare database
      const data = `${userEmail}.${otp}.${expiration}`;
      const signedHash = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(data)
        .digest("hex");

      await transporter.sendMail({
        from: '"Admin Perla Bianca" <noreply@perlabianca.it>',
        to: userEmail,
        subject: "Codice di Accesso Admin",
        html: `<div style="font-family: sans-serif; padding: 20px; text-align: center;">
                 <h2>Codice di Accesso</h2>
                 <p>Il tuo codice è:</p>
                 <h1 style="background: #eee; padding: 10px; border-radius: 5px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
                 <p>Valido per 5 minuti.</p>
               </div>`,
      });

      return res
        .status(200)
        .json({ hash: signedHash, expires: expiration, email: userEmail });
    }

    // --- 3. VERIFICA CODICE OTP ---
    if (action === "verify-otp") {
      if (Date.now() > parseInt(expires))
        return res.status(400).json({ error: "Codice scaduto." });

      const data = `${email}.${code}.${expires}`;
      const calculatedHash = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(data)
        .digest("hex");

      if (calculatedHash !== hash)
        return res.status(400).json({ error: "Codice non valido." });

      const sessionToken = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
        expiresIn: "24h",
      });
      return res.status(200).json({ token: sessionToken });
    }

    res.status(400).json({ error: "Azione sconosciuta" });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: error.message });
  }
}
