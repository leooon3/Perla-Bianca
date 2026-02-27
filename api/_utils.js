import jwt from "jsonwebtoken";

// ─── ALLOWED ORIGINS ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://perla-bianca.vercel.app",
  "https://isarcofagidelre.it",
  "https://www.isarcofagidelre.it",
  "http://localhost:3000",
];

//#region Authentication Verification
export function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid token");
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Session expired");
  }
}
//#endregion

//#region CORS Configuration
export function cors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return req.method === "OPTIONS";
}
//#endregion

//#region CSRF — Origin Validation
/**
 * Returns true if the request origin/referer is from an allowed domain.
 * Should be called on all public POST endpoints (review, contact).
 * Admin endpoints (JWT-protected) do not need this.
 */
export function validateOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
}
//#endregion

//#region Rate Limiting (in-memory, per serverless instance)
/**
 * Simple sliding-window rate limiter.
 * Imperfect across Vercel instances but effective for cold-start scenarios
 * and repeated requests hitting the same warm instance.
 *
 * @param {object} req  - Incoming request
 * @param {string} key  - Action key, e.g. "otp", "review", "contact"
 * @param {number} max  - Max requests allowed in the window
 * @param {number} windowMs - Window size in milliseconds (default: 60 000)
 * @returns {{ ok: boolean, retryAfter: number }} - ok=false means rate-limited
 */
const _store = new Map(); // key → [timestamps]

export function rateLimit(req, key, max = 5, windowMs = 60_000) {
  const now  = Date.now();
  const ip   =
    (req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const storeKey = `${ip}:${key}`;
  const hits     = (_store.get(storeKey) || []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    const oldest     = hits[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { ok: false, retryAfter };
  }

  hits.push(now);
  _store.set(storeKey, hits);

  // Lightweight GC: prune expired entries once the store grows large
  if (_store.size > 5_000) {
    for (const [k, v] of _store) {
      if (v.every((t) => now - t >= windowMs)) _store.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}
//#endregion
