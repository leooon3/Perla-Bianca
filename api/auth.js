import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
  //#endregion

  //#region Configuration Check
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const JWT_SECRET = process.env.JWT_SECRET;
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  if (!JWT_SECRET || !EMAIL_USER || !EMAIL_PASS) {
    console.error("CONFIGURATION ERROR: Missing environment variables.");
    return res.status(500).json({
      error: "Server error: Incomplete configuration.",
    });
  }

  // Admin Whitelist
  const ALLOWED_EMAILS = [
    "leooonericcardo@gmail.com",
    "adarte05@libero.it",
    "camilla.leone08@gmail.com",
    "a.leone911@gmail.com",
    "tonylyon686@gmail.com",
  ];
  //#endregion

  try {
    const { action, email, token, code, hash, expires } = req.body;

    //#region Google Login
    if (action === "google-login") {
      const client = new OAuth2Client(CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
      const userEmail = ticket.getPayload().email.toLowerCase();

      if (!ALLOWED_EMAILS.includes(userEmail)) {
        return res
          .status(403)
          .json({ error: "Access denied: Unauthorized email." });
      }

      const sessionToken = jwt.sign(
        { email: userEmail, role: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.status(200).json({ token: sessionToken });
    }
    //#endregion

    //#region Send OTP (Email)
    if (action === "send-otp") {
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required." });
      }
      const userEmail = email.toLowerCase();

      // Immediate whitelist check
      if (!ALLOWED_EMAILS.includes(userEmail)) {
        return res.status(403).json({ error: "Email not in whitelist." });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });

      // Verify SMTP connection
      try {
        await transporter.verify();
      } catch (smtpError) {
        console.error("SMTP Error:", smtpError);
        return res.status(500).json({
          error: "Cannot send email. Check server credentials.",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = Date.now() + 5 * 60 * 1000; // 5 minutes

      const data = `${userEmail}.${otp}.${expiration}`;
      const signedHash = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(data)
        .digest("hex");

      await transporter.sendMail({
        from: `"Admin Perla Bianca" <${EMAIL_USER}>`,
        to: userEmail,
        subject: "Admin Access Code",
        html: `<div style="font-family: sans-serif; padding: 20px; text-align: center;">
                 <h2>Access Code</h2>
                 <p>Your code is:</p>
                 <h1 style="background: #eee; padding: 10px; border-radius: 5px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
                 <p>Valid for 5 minutes.</p>
               </div>`,
      });

      return res
        .status(200)
        .json({ hash: signedHash, expires: expiration, email: userEmail });
    }
    //#endregion

    //#region Verify OTP
    if (action === "verify-otp") {
      // Check expiration
      if (Date.now() > parseInt(expires)) {
        return res.status(400).json({ error: "Code expired." });
      }

      const normalizedEmail = email.toLowerCase();
      const data = `${normalizedEmail}.${code}.${expires}`;

      const calculatedHash = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(data)
        .digest("hex");

      if (calculatedHash !== hash) {
        return res.status(400).json({ error: "Invalid code (Hash mismatch)." });
      }

      const sessionToken = jwt.sign(
        { email: normalizedEmail, role: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.status(200).json({ token: sessionToken });
    }
    //#endregion

    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    console.error("Auth Error CRITICAL:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
