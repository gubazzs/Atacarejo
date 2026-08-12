import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { syncStoreOptions } from "@/lib/syncOptions";

// Re-sincroniza o catálogo de opções (frete/pagamento) da loja no Supabase.
// Devolve o diagnóstico de cada sync (quantas linhas / qual erro), pra dar pra ver
// na hora se o problema é scope (HTTP 401/403), catálogo vazio, ou insert.
// Trata staleness FORA do caminho quente: chame ao abrir o admin (ou por webhook).
export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const summary = await syncStoreOptions(storeId);
  return NextResponse.json(summary);
}
