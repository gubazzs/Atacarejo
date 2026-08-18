import { NextResponse } from "next/server";
import { getStoreId } from "@/lib/nexoAuth";
import { registerShippingBusinessRule } from "@/lib/shipping";
import { registerPaymentsBusinessRule } from "@/lib/payments";
import { syncStoreOptions } from "@/lib/syncOptions";

// Re-registra (ou tenta) os callbacks de Business Rules e devolve o status de cada um.
// Serve pra DIAGNÓSTICO: se vier { ok:false, status:403 } você confirma que é a trava
// de habilitação/scope — e não código. Se vier { ok:true } o callback foi registrado
// e a Nuvemshop passa a invocar a Edge Function.
export async function POST(req: Request) {
  const storeId = getStoreId(req);
  if (!storeId) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const shipping = await registerShippingBusinessRule(
    storeId,
    `${process.env.SUPABASE_URL}/functions/v1/shipping-callback`
  );
  const payments = await registerPaymentsBusinessRule(
    storeId,
    `${process.env.SUPABASE_URL}/functions/v1/payments-callback`
  );

  // também espelha o catálogo de opções (frete/pagamento) no Supabase e reporta
  // o count/erro — é aqui que descobrimos por que store_shipping_options está vazio.
  const sync = await syncStoreOptions(storeId);

  return NextResponse.json({ shipping, payments, sync });
}
