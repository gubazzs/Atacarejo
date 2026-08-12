import { nuvemshopClient } from "./tiendanube";
import { supabase } from "./supabase";

// Espelha no Supabase o catálogo de opções da loja (frete e pagamento).
// Roda FORA do caminho quente (no install e no refresh), pra que os callbacks de
// Business Rules leiam só do Supabase — igual à discounts-callback.
//
// Requer os escopos read_shipping / read_payment_options + read_payments no token.
// Se não estiverem liberados, o GET dá 401/403 e devolvemos o motivo (não lança).

export interface SyncResult {
  ok: boolean;
  count: number;
  error?: string;
}
export interface SyncSummary {
  shipping: SyncResult;
  payments: SyncResult;
}

interface CarrierOption { id: string | number; name?: string; code?: string }
interface Carrier { id: string | number; options?: CarrierOption[] }

interface CheckoutPaymentOption {
  id: string | number;
  name?: string;
  supported_payment_method_types?: string[];
}
interface PaymentProvider { id: string | number; checkout_payment_options?: CheckoutPaymentOption[] }

function motivo(e: unknown): string {
  const err = e as { response?: { status?: number; statusText?: string }; message?: string };
  if (err?.response?.status) return `HTTP ${err.response.status} ${err.response.statusText ?? ""}`.trim();
  return err?.message ?? "erro desconhecido";
}

// Frete: busca na Nuvemshop e substitui o conjunto no Supabase.
export async function syncShippingOptions(storeId: number): Promise<SyncResult> {
  try {
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
    if (rows.length) {
      const { error } = await supabase.from("store_shipping_options").insert(rows);
      if (error) return { ok: false, count: 0, error: `insert: ${error.message}` };
    }
    return { ok: true, count: rows.length };
  } catch (e) {
    return { ok: false, count: 0, error: motivo(e) };
  }
}

// Pagamento: idem.
export async function syncPaymentOptions(storeId: number): Promise<SyncResult> {
  try {
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
    if (rows.length) {
      const { error } = await supabase.from("store_payment_options").insert(rows);
      if (error) return { ok: false, count: 0, error: `insert: ${error.message}` };
    }
    return { ok: true, count: rows.length };
  } catch (e) {
    return { ok: false, count: 0, error: motivo(e) };
  }
}

// Sincroniza os dois; nunca lança. Devolve o resultado de cada um pra diagnóstico.
export async function syncStoreOptions(storeId: number): Promise<SyncSummary> {
  const [shipping, payments] = await Promise.all([
    syncShippingOptions(storeId),
    syncPaymentOptions(storeId),
  ]);

  if (!shipping.ok) console.error(`[syncStoreOptions] loja ${storeId} shipping falhou:`, shipping.error);
  if (!payments.ok) console.error(`[syncStoreOptions] loja ${storeId} payments falhou:`, payments.error);

  return { shipping, payments };
}
