import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { originPermitido } from "@/lib/allowedOrigin";

// Rota pública: o storefront lê o min_quantity da loja (via view stores_config).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const origin = originPermitido(req);
  if (!origin) {
    // origem não permitida -> redireciona sem revelar o motivo
    return NextResponse.redirect("https://nextcubeinc.com");
  }

  const { storeId } = await params;
  const cors = { "Access-Control-Allow-Origin": origin };

  const { data, error } = await supabase
    .from("stores_config")
    .select("min_quantity")
    .eq("store_id", Number(storeId))
    .single();

  // em qualquer erro, cai no padrão 3 (não quebra o storefront)
  if (error) {
    console.error("[public config] erro Supabase:", error);
    return NextResponse.json({ min_quantity: 3 }, { headers: cors });
  }

  return NextResponse.json({ min_quantity: data?.min_quantity ?? 3 }, { headers: cors });
}
