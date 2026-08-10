import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/verifyWebhook";

// LGPD: um cliente pediu um relatório dos dados dele.
// Este app NÃO armazena dados de clientes, então não há dados a reportar.
// Responde 200 (nada a entregar ao lojista).
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-linkedstore-hmac-sha256"))) {
    return new NextResponse("invalid signature", { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
