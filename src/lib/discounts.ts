import { nuvemshopClient } from "./tiendanube";

export async function createPromotion(storeId: number): Promise<string> {
  const client = await nuvemshopClient(storeId);
  const res = await client.post(`${storeId}/promotions`, {
    name: "Atacado",
    allocation_type: "cross_items",
    active: true,
  });
  return res.data.data.id; // resposta = { data: { id } }
}

export async function registerCallback(storeId: number, url: string): Promise<void> {
  const client = await nuvemshopClient(storeId);
  await client.put(`${storeId}/discounts/callbacks`, { url });
}

// Registra o webhook de desinstalação (via API — os de LGPD ficam no Painel).
export async function registerUninstallWebhook(storeId: number, url: string): Promise<void> {
  const client = await nuvemshopClient(storeId);
  await client.post(`${storeId}/webhooks`, { event: "app/uninstalled", url });
}