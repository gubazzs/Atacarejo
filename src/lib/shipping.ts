import { nuvemshopClient } from "./tiendanube";

// Registra o callback de Business Rules do domínio "shipping".
// A Nuvemshop passa a chamar essa URL no evento `shipping/before-filter` (checkout)
// pra saber quais opções de frete devemos esconder.
//
// Pré-requisitos (fora do código):
//   - App com escopo `read_shipping`.
//   - App habilitada para Business Rules pelo time de parceiros
//     (partners@nuvemshop.com.br / partners@tiendanube.com).
//
// Idempotente: o PUT sobrescreve o callback existente, então pode rodar em toda
// (re)instalação sem duplicar.
export async function registerShippingBusinessRule(
  storeId: number,
  url: string
): Promise<void> {
  const client = await nuvemshopClient(storeId);
  await client.put(`${storeId}/business_rules/integrations/shipping`, {
    url,
    event: "shipping/before-filter",
  });
}
