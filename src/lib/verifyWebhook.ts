import { createHmac, timingSafeEqual } from "crypto";

// Verifica a assinatura dos webhooks da Nuvemshop.
// Header: x-linkedstore-hmac-sha256 = HMAC-SHA256(corpo_cru, client_secret) em hex.
export function verifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.CLIENT_SECRET;
  if (!hmacHeader || !secret) return false;

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b); // comparação segura contra timing attack
  } catch {
    return false;
  }
}
