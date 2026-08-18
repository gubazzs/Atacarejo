import { nuvemshopClient } from "./tiendanube";

export interface RegisterResult {
  ok: boolean;
  status?: number;
  error?: string;
  body?: unknown; // corpo da resposta da Nuvemshop (razão exata do erro)
}

// Registra o callback de Business Rules do domínio "shipping".
// A Nuvemshop passa a chamar essa URL no evento `shipping/before-filter` (checkout).
//
// Pré-requisitos (fora do código): escopo read_shipping + app habilitada para
// Business Rules pelo time de parceiros. Sem isso, o PUT volta 401/403 e o callback
// NÃO é registrado (a Nuvemshop nunca chama a function -> 0 invocações).
//
// Não lança: devolve o resultado pra o install/diagnóstico não abortar os próximos passos.
export async function registerShippingBusinessRule(
  storeId: number,
  url: string
): Promise<RegisterResult> {
  try {
    const client = await nuvemshopClient(storeId);
    await client.put(`${storeId}/business_rules/integrations/shipping`, {
      url,
      event: "shipping/before-filter",
    });
    return { ok: true };
  } catch (e) {
    const err = e as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    return {
      ok: false,
      status: err?.response?.status,
      error: err?.message,
      body: err?.response?.data,
    };
  }
}
