import crypto from "crypto";

const SECRET = process.env.PPDB_UPLOAD_SECRET || process.env.NEXTAUTH_SECRET || "ppdb-upload-dev-secret";
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createDraftToken(unit: string): { draftId: string; token: string; expiresAt: number } {
  const draftId = crypto.randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = `${expiresAt}.${sign(`${draftId}|${unit}|${expiresAt}`)}`;
  return { draftId, token, expiresAt };
}

export function verifyDraftToken(token: string, draftId: string, unit: string): boolean {
  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!expiresAt || expiresAt < Date.now() || !signature) return false;

  const expected = sign(`${draftId}|${unit}|${expiresAt}`);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return givenBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(givenBuffer, expectedBuffer);
}
