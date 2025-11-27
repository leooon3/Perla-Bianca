import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { verifyAuth, cors } from "./_utils.js";

export default async function handler(req, res) {
  //#region CORS
  if (cors(req, res)) return res.status(200).end();
  //#endregion

  try {
    //#region Google Authentication
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
    //#endregion

    //#region GET Method (Public)
    // No verifyAuth here, calendar must be visible to everyone
    if (req.method === "GET") {
      res.setHeader(
        "Cache-Control",
        "s-maxage=120, stale-while-revalidate=300"
      );
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items.map((event) => ({
        id: event.id,
        realTitle: event.summary, // Visible in JSON but hidden in public UI
        start: event.start.date || event.start.dateTime,
        end: event.end.date || event.end.dateTime,
        allDay: !event.start.dateTime,
        display: "background",
        color: "#ef4444", // Full Red Background
        textColor: "black",
      }));

      return res.status(200).json(events);
    }
    //#endregion

    //#region Protected Methods (POST / DELETE)
    // Auth Check
    try {
      verifyAuth(req);
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    // Add Event
    if (req.method === "POST") {
      const { start, end, title, description } = req.body;

      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: title || "Prenotazione",
          description: description || "",
          start: { date: start },
          end: { date: end },
        },
      });
      return res.status(200).json({ success: true });
    }

    // Remove Event
    if (req.method === "DELETE") {
      const { eventId } = req.body;
      await calendar.events.delete({
        calendarId,
        eventId,
      });
      return res.status(200).json({ success: true });
    }
    //#endregion
  } catch (error) {
    console.error("Calendar API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
