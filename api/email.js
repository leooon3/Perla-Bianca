import nodemailer from "nodemailer";

export default async function handler(req, res) {
  //#region CORS & Preflight
  res.setHeader("Access-Control-Allow-Credentials", true);
  const allowedOrigins = [
    "https://perla-bianca.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  //#endregion

  //#region Data Extraction & Validation
  const { nome, email, messaggio, honeypot } = req.body;

  // Anti-Spam Check (Honeypot)
  if (honeypot) {
    // Return OK to fool the bot, but do not send anything
    return res.status(200).json({ message: "Email sent successfully" });
  }

  // Validate Empty Fields
  if (!nome || !email || !messaggio) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate Email Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }
  //#endregion

  try {
    //#region Nodemailer Configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    //#endregion

    //#region Email Templates
    // Admin Notification
    const adminMailOptions = {
      from: `"${nome}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email,
      subject: `New website message from: ${nome}`,
      text: `You received a new message:\n\nName: ${nome}\nEmail: ${email}\n\nMessage:\n${messaggio}`,
      html: `
        <h3>New message from Perla Bianca</h3>
        <p><strong>Name:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #007bff;">
          ${messaggio.replace(/\n/g, "<br>")}
        </blockquote>
      `,
    };

    // User Auto-reply
    const userMailOptions = {
      from: `"Perla Bianca" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank you for contacting us - Perla Bianca",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Thank you ${nome}!</h2>
          <p>We have received your request and will respond as soon as possible.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            <strong>Your message summary:</strong><br>
            <em>${messaggio.replace(/\n/g, "<br>")}</em>
          </p>
          <br>
          <p>See you soon,<br><strong>Perla Bianca Staff</strong></p>
        </div>
      `,
    };
    //#endregion

    //#region Send Emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    // Save to Google Sheets (fire-and-forget)
    (async () => {
      try {
        const { GoogleSpreadsheet } = await import("google-spreadsheet");
        const { JWT } = await import("google-auth-library");
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (!privateKey.includes("BEGIN PRIVATE KEY")) {
          try { privateKey = Buffer.from(privateKey, "base64").toString("utf-8"); } catch(e){}
        }
        if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");
        const auth = new JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: privateKey,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
        await doc.loadInfo();
        let sheet = doc.sheetsByTitle["Messaggi"];
        if (!sheet) {
          sheet = await doc.addSheet({ title: "Messaggi", headerValues: ["Timestamp","Nome","Email","Messaggio","Proprieta","Letto","Risposto"] });
        }
        await sheet.addRow({
          Timestamp: new Date().toISOString(),
          Nome: nome,
          Email: email,
          Messaggio: messaggio,
          Proprieta: req.body?.property || "perla-bianca",
          Letto: "NO",
          Risposto: "NO",
        });
      } catch(e) { console.warn("Messages sheet save failed:", e.message); }
    })();

    return res.status(200).json({ message: "Emails sent successfully" });
    //#endregion
  } catch (error) {
    console.error("Email Sending Error:", error);
    return res.status(500).json({
      message: "Error sending email. Check address or try again later.",
      error: error.message,
    });
  }
}
