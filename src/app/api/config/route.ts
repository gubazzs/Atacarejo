import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStoreId } from "@/lib/nexoAuth";

export async function GET(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("stores")
    .select("min_quantity")
    .eq("store_id", storeId)
    .single();

  if (error) {
    console.error("[config GET] erro Supabase:", error);
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }
  return NextResponse.json({ min_quantity: data?.min_quantity ?? 3 });
}

export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const min = Number(body?.min_quantity);

  // valida: inteiro entre 1 e 999
  if (!Number.isInteger(min) || min < 1 || min > 999) {
    return NextResponse.json({ error: "quantidade mínima inválida" }, { status: 400 });
  }

  const { error } = await supabase
    .from("stores")
    .update({ min_quantity: min })
    .eq("store_id", storeId);

  if (error) {
    console.error("[config POST] erro Supabase:", error);
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
