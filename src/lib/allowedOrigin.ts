// Domínios permitidos a chamar as rotas PÚBLICAS (storefront da Nuvemshop).
const DOMINIOS_PERMITIDOS = ["lojavirtualnuvem.com.br", "nuvemshop.com.br"];

// Devolve o origin recebido se ele for de um domínio permitido; senão null.
// Usa o header Origin (enviado pelo navegador em requisições cross-origin),
// com o Referer como reserva.
export function originPermitido(req: Request): string | null {
  const origin = req.headers.get("origin");
  const candidato = origin ?? req.headers.get("referer");
  if (!candidato) return null;

  try {
    const host = new URL(candidato).hostname;
    const ok = DOMINIOS_PERMITIDOS.some(
      (d) => host === d || host.endsWith("." + d)
    );
    if (!ok) return null;
    // pro CORS, refletimos o Origin (se veio); senão "*" já basta (sem Origin = não-CORS)
    return origin ?? "*";
  } catch {
    return null;
  }
}
