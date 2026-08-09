import jwt from "jsonwebtoken";

// Valida o session token do Nexo e devolve o storeId.
//
// Segurança: THE_SECRET é uma string PÚBLICA (só vale no Developer Mode).
// Por isso ela só é aceita quando APP_MODE=dev. Em produção (qualquer outro
// valor, ou ausente), aceita SÓ o client_secret — senão qualquer um poderia
// forjar um token assinado com "THE_SECRET" e se passar por outra loja.
export function getStoreId(req: Request): number | null {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const secrets: string[] = [];
  if (process.env.APP_MODE === "dev") secrets.push("THE_SECRET");
  if (process.env.CLIENT_SECRET) secrets.push(process.env.CLIENT_SECRET);

  for (const secret of secrets) {
    try {
      const payload = jwt.verify(token, secret) as { storeId?: string | number };
      if (payload?.storeId != null) return Number(payload.storeId);
    } catch {
      // segredo não bateu -> tenta o próximo
    }
  }

  return null;
}
