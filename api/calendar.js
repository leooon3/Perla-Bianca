import { google } from "googleapis";
import { JWT } from "google-auth-library";

export default async function handler(req, res) {
  // ============================================================
  // 1. CONFIGURAZIONE CORS & PREFLIGHT
  // ============================================================
  const allowedOrigins = [
    "https://perla-bianca.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-admin-password"
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ============================================================
    // 2. AUTENTICAZIONE GOOGLE (Service Account)
    // ============================================================
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      try {
        privateKey = Buffer.from(privateKey, "base64").toString("utf-8");
      } catch (e) {}
    }
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      // NOTA: Scope completo per poter scrivere sul calendario
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // ============================================================
    // 3. GET: LEGGI EVENTI (Pubblico + Admin)
    // ============================================================
    if (req.method === "GET") {
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      // Formattiamo i dati per il frontend
      const events = response.data.items.map((event) => ({
        id: event.id, // ID necessario per la cancellazione
        title: "Occupato", // Titolo pubblico generico per privacy
        realTitle: event.summary, // Titolo reale visibile solo all'admin
        start: event.start.date || event.start.dateTime,
        end: event.end.date || event.end.dateTime,
        allDay: !event.start.dateTime,
      }));

      return res.status(200).json(events);
    }

    // ============================================================
    // 4. SICUREZZA (VERIFICA PASSWORD ADMIN)
    // ============================================================
    // Da qui in poi le operazioni richiedono la password amministratore
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Password non valida" });
    }

    // ============================================================
    // 5. POST: AGGIUNGI EVENTO (Admin)
    // ============================================================
    if (req.method === "POST") {
      const { start, end, title } = req.body;

      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: title || "Prenotazione",
          start: { date: start },
          end: { date: end },
        },
      });
      return res.status(200).json({ success: true });
    }

    // ============================================================
    // 6. DELETE: RIMUOVI EVENTO (Admin)
    // ============================================================
    if (req.method === "DELETE") {
      const { eventId } = req.body;
      await calendar.events.delete({
        calendarId,
        eventId,
      });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Errore Calendar API:", error);
    return res.status(500).json({ error: error.message });
  }
}
