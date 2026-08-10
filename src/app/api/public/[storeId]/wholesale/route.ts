import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Rota PÚBLICA: o storefront de qualquer loja lê os preços de atacado.
// CORS aberto de propósito — preços não são segredo (aparecem na vitrine) e cada
// loja tem um domínio/origem diferente. A proteção fica no rate limit (middleware)
// e no redirect de navegação direta.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const cors = { "Access-Control-Allow-Origin": "*" };

  const { data, error } = await supabase
    .from("wholesale_prices")
    .select("product_id, variant_id, price_atc")
    .eq("store_id", Number(storeId));

  if (error) {
    console.error("[public wholesale] erro Supabase:", error);
    return NextResponse.json({ error: "erro interno" }, { status: 500, headers: cors });
  }
  return NextResponse.json(data ?? [], { headers: cors });
}
