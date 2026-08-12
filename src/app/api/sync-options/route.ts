import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { syncStoreOptions } from "@/lib/syncOptions";

// Re-sincroniza o catálogo de opções (frete/pagamento) da loja no Supabase.
// Serve pra tratar staleness FORA do caminho quente: chame ao abrir o admin/config
// (ou por webhook) sempre que as opções da loja puderem ter mudado.
export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  await syncStoreOptions(storeId);
  return NextResponse.json({ ok: true });
}
