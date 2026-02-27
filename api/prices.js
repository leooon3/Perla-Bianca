import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT }               from "google-auth-library";
import { cors, verifyAuth }  from "./_utils.js";

// ─── Default fallback ───────────────────────────────────────────────────────
const DEFAULTS = [
  { stagione: "Alta Stagione",  dal: "01/07", al: "31/08", prezzoNotte: 200, minNotti: 7, pulizie: 80,  caparra: "30%", note: "" },
  { stagione: "Media Stagione", dal: "01/06", al: "30/09", prezzoNotte: 160, minNotti: 5, pulizie: 60,  caparra: "30%", note: "" },
  { stagione: "Bassa Stagione", dal: "01/10", al: "31/05", prezzoNotte: 120, minNotti: 3, pulizie: 50,  caparra: "30%", note: "" },
];

const HEADERS = ["Stagione","Dal","Al","PrezzoNotte","MinNotti","Pulizie","Caparra","Note"];

// ─── Google Sheets helpers ──────────────────────────────────────────────────
async function getAuth() {
  let key = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!key.includes("BEGIN PRIVATE KEY")) {
    try { key = Buffer.from(key, "base64").toString("utf-8"); } catch {}
  }
  if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
  return new JWT({
    email:  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheet(property) {
  const auth  = await getAuth();
  const doc   = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();

  const title = `Prezzi-${property}`;
  let sheet   = doc.sheetsByTitle[title];

  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues: HEADERS });
    for (const row of DEFAULTS) {
      await sheet.addRow({
        Stagione: row.stagione, Dal: row.dal,  Al: row.al,
        PrezzoNotte: row.prezzoNotte, MinNotti: row.minNotti,
        Pulizie: row.pulizie, Caparra: row.caparra, Note: row.note,
      });
    }
  }
  return sheet;
}

function rowToObj(r) {
  return {
    stagione:    r.get("Stagione")    || "",
    dal:         r.get("Dal")         || "",
    al:          r.get("Al")          || "",
    prezzoNotte: Number(r.get("PrezzoNotte")) || 0,
    minNotti:    Number(r.get("MinNotti"))    || 1,
    pulizie:     Number(r.get("Pulizie"))     || 0,
    caparra:     r.get("Caparra")     || "",
    note:        r.get("Note")        || "",
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (cors(req, res)) return res.status(200).end();

  // ── GET (public) ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const property = req.query?.property || "perla-bianca";
    try {
      const sheet = await getSheet(property);
      const rows  = await sheet.getRows();
      return res.status(200).json(rows.map(rowToObj));
    } catch (err) {
      console.error("prices GET:", err.message);
      return res.status(200).json(DEFAULTS); // graceful fallback
    }
  }

  // ── POST (admin only) ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    try { verifyAuth(req); }
    catch { return res.status(401).json({ error: "Unauthorized" }); }

    const { prices, property = "perla-bianca" } = req.body;
    if (!Array.isArray(prices)) {
      return res.status(400).json({ error: "prices must be an array" });
    }

    try {
      const sheet   = await getSheet(property);
      const oldRows = await sheet.getRows();
      // Delete all existing rows first
      for (const r of oldRows) await r.delete();
      // Re-insert
      for (const p of prices) {
        await sheet.addRow({
          Stagione:    p.stagione    || "",
          Dal:         p.dal         || "",
          Al:          p.al          || "",
          PrezzoNotte: Number(p.prezzoNotte) || 0,
          MinNotti:    Number(p.minNotti)    || 1,
          Pulizie:     Number(p.pulizie)     || 0,
          Caparra:     p.caparra     || "",
          Note:        p.note        || "",
        });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("prices POST:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
