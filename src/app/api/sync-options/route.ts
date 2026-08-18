import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { syncStoreOptions } from "@/lib/syncOptions";

// Espelha o catálogo de opções (frete/pagamento) no Supabase pros callbacks lerem.
// Chamado automaticamente quando o admin abre (fire-and-forget), além do install.
// Autenticado pelo session token do Nexo (getStoreId).
export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const sync = await syncStoreOptions(storeId);
  return NextResponse.json(sync);
}
