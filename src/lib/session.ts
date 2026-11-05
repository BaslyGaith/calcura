// Jetons de session signés (HS256). Compatible Edge (utilisé par le middleware).
import { EncryptJWT, SignJWT, jwtDecrypt, jwtVerify } from "jose";

export const SESSION_COOKIE = "bp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export type SessionPayload = { sub: string; role: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET manquant ou trop court");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

/** Signe une petite charge utile (ex. état d'une partie) pour vérification ultérieure. */
export async function signData(data: Record<string, unknown>, ttlSeconds = 3600): Promise<string> {
  return new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret());
}

export async function verifyData<T>(token: string): Promise<(T & { iat: number }) | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T & { iat: number };
  } catch {
    return null;
  }
}

async function encKey() {
  const raw = await crypto.subtle.digest("SHA-256", secret());
  return new Uint8Array(raw);
}

/** Comme signData, mais chiffré (JWE) : le client ne peut pas lire le contenu (ex. bonnes réponses). */
export async function encryptData(data: Record<string, unknown>, ttlSeconds = 3600): Promise<string> {
  return new EncryptJWT(data)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .encrypt(await encKey());
}

export async function decryptData<T>(token: string): Promise<(T & { iat: number }) | null> {
  try {
    const { payload } = await jwtDecrypt(token, await encKey());
    return payload as T & { iat: number };
  } catch {
    return null;
  }
}
