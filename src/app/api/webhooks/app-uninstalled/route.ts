import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyWebhook } from "@/lib/verifyWebhook";

// App desinstalado: limpa os dados da loja na hora.
// (o store/redact também chega depois, mas aqui a gente já para de aplicar desconto)
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-linkedstore-hmac-sha256"))) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  const { store_id } = JSON.parse(raw);
  const storeId = Number(store_id);

  await supabase.from("wholesale_prices").delete().eq("store_id", storeId);
  await supabase.from("stores").delete().eq("store_id", storeId);

  return NextResponse.json({ ok: true });
}
