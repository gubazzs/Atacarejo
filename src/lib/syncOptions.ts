import { nuvemshopClient } from "./tiendanube";
import { supabase } from "./supabase";

// Espelha no Supabase o catálogo de opções da loja (frete e pagamento).
// Roda FORA do caminho quente (no install e no refresh), pra que os callbacks de
// Business Rules leiam só do Supabase — igual à discounts-callback.
//
// Requer os escopos read_shipping / read_payment_options + read_payments no token.
// Se ainda não estiverem liberados, o GET falha e o sync é ignorado (não trava nada).

interface CarrierOption { id: string | number; name?: string; code?: string }
interface Carrier { id: string | number; options?: CarrierOption[] }

interface CheckoutPaymentOption {
  id: string | number;
  name?: string;
  supported_payment_method_types?: string[];
}
interface PaymentProvider { id: string | number; checkout_payment_options?: CheckoutPaymentOption[] }

// Frete: busca na Nuvemshop e substitui o conjunto no Supabase.
export async function syncShippingOptions(storeId: number): Promise<void> {
  const client = await nuvemshopClient(storeId);
  const { data } = await client.get(`${storeId}/shipping_carriers/options`);
  const carriers: Carrier[] = Array.isArray(data) ? data : [];

  const rows = carriers.flatMap((c) =>
    (c.options ?? []).map((o) => ({
      store_id: storeId,
      carrier_id: String(c.id),
      option_id: String(o.id),
      code: o.code ?? null,
      name: o.name ?? null,
      updated_at: new Date().toISOString(),
    }))
  );

  // reflete remoções: apaga o atual e insere o novo conjunto
  await supabase.from("store_shipping_options").delete().eq("store_id", storeId);
  if (rows.length) await supabase.from("store_shipping_options").insert(rows);
}

// Pagamento: idem.
export async function syncPaymentOptions(storeId: number): Promise<void> {
  const client = await nuvemshopClient(storeId);
  const { data } = await client.get(`${storeId}/payment_providers/options`);
  const providers: PaymentProvider[] = Array.isArray(data) ? data : [];

  const rows = providers.flatMap((p) =>
    (p.checkout_payment_options ?? []).map((o) => ({
      store_id: storeId,
      provider_id: String(p.id),
      option_id: String(o.id),
      name: o.name ?? null,
      method_types: (o.supported_payment_method_types ?? []).map((t) => String(t)),
      updated_at: new Date().toISOString(),
    }))
  );

  await supabase.from("store_payment_options").delete().eq("store_id", storeId);
  if (rows.length) await supabase.from("store_payment_options").insert(rows);
}

// Sincroniza os dois sem lançar (cada um falha de forma isolada).
export async function syncStoreOptions(storeId: number): Promise<void> {
  const results = await Promise.allSettled([
    syncShippingOptions(storeId),
    syncPaymentOptions(storeId),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `[syncStoreOptions] loja ${storeId} — ${i === 0 ? "shipping" : "payments"} falhou:`,
        r.reason?.message ?? r.reason
      );
    }
  });
}
