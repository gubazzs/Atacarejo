import { nuvemshopClient } from "./tiendanube";
import type { RegisterResult } from "./shipping";

// Registra o callback de Business Rules do domínio "payments".
// A Nuvemshop passa a chamar essa URL no evento `payments/before-filter` (checkout).
//
// Pré-requisitos (fora do código): escopos read_payment_options + read_payments + app
// habilitada para Business Rules pelos parceiros. Sem isso, o PUT volta 401/403 e o
// callback NÃO é registrado (0 invocações).
//
// Não lança: devolve o resultado.
export async function registerPaymentsBusinessRule(
  storeId: number,
  url: string
): Promise<RegisterResult> {
  try {
    const client = await nuvemshopClient(storeId);
    await client.put(`${storeId}/business_rules/integrations/payments`, {
      url,
      event: "payments/before-filter",
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
