// api/reviews.js
export default async function handler(req, res) {
  // Impostazioni di sicurezza base (CORS)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*"); // O metti il tuo dominio per essere più stretto
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = "Risposte del modulo 1"; // Nome del foglio (tab)

  if (!sheetId) {
    return res.status(500).json({ error: "Server Error: ID Foglio mancante" });
  }

  const apiUrl = `https://opensheet.elk.sh/${sheetId}/${encodeURIComponent(
    sheetName
  )}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Errore da Google/Opensheet: ${response.statusText}`);
    }

    const data = await response.json();

    // Restituisci i dati al tuo frontend (browser)
    res.status(200).json(data);
  } catch (error) {
    console.error("Errore API Recensioni:", error);
    res.status(500).json({ error: "Impossibile recuperare le recensioni" });
  }
}
