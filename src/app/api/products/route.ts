import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { nuvemshopClient } from "@/lib/tiendanube";

const PER_PAGE = 100; // teto: Nuvemshop aceita até 200, Supabase até 1000 — usamos o menor com folga

export async function GET(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const q = searchParams.get("q")?.trim();

  const client = await nuvemshopClient(storeId);

  const res = await client.get(`${storeId}/products`, {
    params: {
      page,
      per_page: PER_PAGE,
      ...(q ? { q } : {}),
    },
  });

  // repassa o total pro front calcular o pageCount do <Pagination />
  const totalCount = res.headers["x-total-count"] ?? "0";

  return NextResponse.json(res.data, {
    headers: {
      "x-total-count": String(totalCount),
    },
  });
}