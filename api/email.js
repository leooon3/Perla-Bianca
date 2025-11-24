import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // --- GESTIONE CORS ---
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

  const { nome, email, messaggio } = req.body;

  if (!nome || !email || !messaggio) {
    return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1. Configura la mail per TE (Admin)
    const adminMailOptions = {
      from: `"${nome}" <${process.env.EMAIL_USER}>`, // Mittente fittizio per evitare spam block
      to: process.env.EMAIL_TO || process.env.EMAIL_USER, // Usa EMAIL_TO se c'è, altrimenti manda a te stesso
      replyTo: email, // Rispondi direttamente al cliente
      subject: `Nuovo messaggio dal sito da: ${nome}`,
      text: `Hai ricevuto un nuovo messaggio:\n\nNome: ${nome}\nEmail: ${email}\n\nMessaggio:\n${messaggio}`,
      html: `
        <h3>Nuovo messaggio da Perla Bianca</h3>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Messaggio:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #007bff;">
          ${messaggio.replace(/\n/g, "<br>")}
        </blockquote>
      `,
    };

    // 2. Configura la mail per il CLIENTE (Auto-reply)
    const userMailOptions = {
      from: `"Perla Bianca" <${process.env.EMAIL_USER}>`,
      to: email, // Arriva al cliente
      subject: "Grazie per averci contattato - Perla Bianca",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Grazie ${nome}!</h2>
          <p>Abbiamo ricevuto la tua richiesta e ti risponderemo il prima possibile.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            <strong>Riepilogo del tuo messaggio:</strong><br>
            <em>${messaggio.replace(/\n/g, "<br>")}</em>
          </p>
          <br>
          <p>A presto,<br><strong>Lo staff di Perla Bianca</strong></p>
        </div>
      `,
    };

    // 3. Invia ENTRAMBE le mail simultaneamente
    // Se la mail del cliente è errata, questo blocco fallirà e andrà nel catch
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    return res.status(200).json({ message: "Email inviate con successo" });
  } catch (error) {
    console.error("Errore invio email:", error);

    // MODIFICA IMPORTANTE:
    // Restituiamo un messaggio chiaro che il frontend mostrerà all'utente
    return res.status(500).json({
      message:
        "Errore nell'invio della mail. Controlla l'indirizzo o riprova più tardi.",
      error: error.message,
    });
  }
}
