import { nuvemshopClient } from "./tiendanube";

// Registra o callback de Business Rules do domínio "payments".
// A Nuvemshop passa a chamar essa URL no evento `payments/before-filter` (checkout)
// pra saber quais meios de pagamento devemos esconder. No atacado, deixamos só o Pix.
//
// Pré-requisitos (fora do código):
//   - App com escopos `read_payment_options` e `read_payments`.
//   - App habilitada para Business Rules pelo time de parceiros
//     (mesma habilitação usada no shipping — não é um pedido separado).
//
// Idempotente: o PUT sobrescreve o callback existente.
export async function registerPaymentsBusinessRule(
  storeId: number,
  url: string
): Promise<void> {
  const client = await nuvemshopClient(storeId);
  await client.put(`${storeId}/business_rules/integrations/payments`, {
    url,
    event: "payments/before-filter",
  });
}
