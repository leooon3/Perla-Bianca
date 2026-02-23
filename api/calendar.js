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

    // Resolve calendar ID per property (with fallback to default)
    const propertyRaw =
      req.method === "GET" ? req.query?.property : req.body?.property;
    const propertyKey = (propertyRaw || "perla-bianca")
      .toUpperCase()
      .replace(/-/g, "_");
    const calendarId =
      process.env[`GOOGLE_CALENDAR_ID_${propertyKey}`] ||
      process.env.GOOGLE_CALENDAR_ID;
    //#endregion

    //#region GET Method (Public, realTitle only for admins)
    if (req.method === "GET") {
      // Optional auth: admins get real booking titles
      let isAdmin = false;
      try {
        verifyAuth(req);
        isAdmin = true;
      } catch (e) {}

      if (isAdmin) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
      }

      // Admin sees past 3 months too (for calendar navigation); public sees from today
      const timeMin = isAdmin
        ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString();

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items.map((event) => {
        const item = {
          id: event.id,
          start: event.start.date || event.start.dateTime,
          end: event.end.date || event.end.dateTime,
          allDay: !event.start.dateTime,
          display: "background",
          color: "#ef4444",
          textColor: "black",
        };
        if (isAdmin) {
          item.realTitle = event.summary;
          item.description = event.description || "";
        }
        return item;
      });

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
