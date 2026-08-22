import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStoreId } from "@/lib/nexoAuth";

const MAX_ITEMS = 1000;

export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ error: "muitos itens" }, { status: 400 });
  }
  if (items.length === 0) return NextResponse.json({ saved: 0 });

  // valida e normaliza cada item
  const rows = [];
  for (const i of items) {
    const product_id = Number(i?.product_id);
    const variant_id = Number(i?.variant_id);
    const price_atc = Number(i?.price_atc);

    if (
      !Number.isInteger(product_id) ||
      !Number.isInteger(variant_id) ||
      !Number.isFinite(price_atc) ||
      price_atc < 0
    ) {
      return NextResponse.json({ error: "item inválido" }, { status: 400 });
    }

    rows.push({ store_id: storeId, product_id, variant_id, price_atc });
  }

  const { data, error } = await supabase
    .from("wholesale_prices")
    .upsert(rows, { onConflict: "store_id,variant_id" })
    .select();

  if (error) {
    console.error("[wholesale POST] erro Supabase:", error);
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }
  return NextResponse.json({ saved: data?.length ?? 0 });
}

export async function GET(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // opcional: filtra só os variant_ids da página atual do front,
  // em vez de trazer os preços da loja inteira toda vez
  const variantIdsParam = searchParams.get("variant_ids");

  let query = supabase
    .from("wholesale_prices")
    .select("product_id, variant_id, price_atc")
    .eq("store_id", storeId);

  if (variantIdsParam) {
    const variantIds = variantIdsParam
      .split(",")
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v));

    if (variantIds.length === 0) {
      return NextResponse.json({ error: "variant_ids inválido" }, { status: 400 });
    }
    if (variantIds.length > MAX_ITEMS) {
      return NextResponse.json({ error: "muitos ids" }, { status: 400 });
    }

    query = query.in("variant_id", variantIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[wholesale GET] erro Supabase:", error);
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}