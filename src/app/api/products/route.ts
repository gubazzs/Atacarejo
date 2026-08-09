import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { nuvemshopClient } from "@/lib/tiendanube";

export async function GET(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const client = await nuvemshopClient(storeId);
  const res = await client.get(`${storeId}/products`);
  return NextResponse.json(res.data);
}