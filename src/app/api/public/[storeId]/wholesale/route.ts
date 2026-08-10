import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { originPermitido } from "@/lib/allowedOrigin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const origin = originPermitido(req);
  if (!origin) {
    // origem não permitida -> redireciona sem revelar o motivo
    return NextResponse.redirect("https://nextcubeinc.com");
  }

  const { storeId } = await params; // Next 15: params é Promise
  const cors = { "Access-Control-Allow-Origin": origin };

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
