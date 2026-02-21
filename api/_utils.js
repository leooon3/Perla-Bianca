import jwt from "jsonwebtoken";

//#region Authentication Verification
export function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid token");
  }
  const token = authHeader.split(" ")[1];
  try {
    // Verify signature and expiration
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Session expired");
  }
}
//#endregion

//#region CORS Configuration
// Standard CORS configuration for APIs
export function cors(req, res) {
  const allowed = [
    "https://perla-bianca.vercel.app",
    "https://isarcofagidelre.it",
    "https://www.isarcofagidelre.it",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;

  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return req.method === "OPTIONS";
}
//#endregion
