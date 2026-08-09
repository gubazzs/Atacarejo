import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params; // Next 15: params é Promise

  const { data, error } = await supabase
    .from("wholesale_prices")
    .select("product_id, variant_id, price_atc")
    .eq("store_id", Number(storeId));

  const cors = { "Access-Control-Allow-Origin": "*" };
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json(data ?? [], { headers: cors });
}