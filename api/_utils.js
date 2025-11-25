// api/_utils.js
import jwt from "jsonwebtoken";

export function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token mancante o non valido");
  }
  const token = authHeader.split(" ")[1];
  try {
    // Verifica firma e scadenza
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Sessione scaduta");
  }
}

// Configurazione CORS standard per le tue API
export function cors(req, res) {
  const allowed = ["https://perla-bianca.vercel.app", "http://localhost:3000"];
  const origin = req.headers.origin;
  if (allowed.includes(origin))
    res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return req.method === "OPTIONS";
}
