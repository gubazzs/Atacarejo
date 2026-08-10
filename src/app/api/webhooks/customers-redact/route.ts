import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/verifyWebhook";

// LGPD: pediram pra apagar dados de um cliente.
// Este app NÃO armazena nenhum dado de cliente (só produtos/variantes/preços da loja),
// então não há nada a apagar. Responde 200.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-linkedstore-hmac-sha256"))) {
    return new NextResponse("invalid signature", { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
