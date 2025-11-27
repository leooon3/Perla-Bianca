import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js"; // Importiamo i nuovi strumenti di sicurezza

export default async function handler(req, res) {
  // 1. GESTIONE CORS STANDARD
  if (cors(req, res)) return res.status(200).end();

  try {
    // 2. AUTENTICAZIONE GOOGLE (Service Account)
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
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // ============================================================
    // 3. METODO GET: PUBBLICO (Tutti possono leggere gli eventi)
    // ============================================================
    // Qui NON c'è "verifyAuth" perché il calendario deve essere visibile a tutti
    if (req.method === "GET") {
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items.map((event) => ({
        id: event.id,
        realTitle: event.summary, // Visibile nel JSON ma nascosto dalla UI pubblica
        start: event.start.date || event.start.dateTime,
        end: event.end.date || event.end.dateTime,
        allDay: !event.start.dateTime,
        display: "background",
        color: "#ef4444", // Questo renderà lo sfondo Rosso pieno
        textColor: "black", // Questo renderà il testo Nero
      }));

      return res.status(200).json(events);
    }

    // ============================================================
    // 4. METODI PROTETTI (POST / DELETE)
    // ============================================================

    // VERIFICA LOGIN: Blocca qui se l'utente non è autenticato
    try {
      verifyAuth(req);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Non autorizzato. Effettua il login." });
    }

    // Aggiungi Evento (Solo se login ok)
    if (req.method === "POST") {
      // --- MODIFICATO: Estraiamo anche description ---
      const { start, end, title, description } = req.body;

      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: title || "Prenotazione",
          // --- NUOVO: Passiamo la descrizione a Google ---
          description: description || "",
          start: { date: start },
          end: { date: end },
        },
      });
      return res.status(200).json({ success: true });
    }

    // Rimuovi Evento (Solo se login ok)
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
