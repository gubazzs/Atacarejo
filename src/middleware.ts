import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  // headers seguros (não quebram nada)
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");

  // Restringe QUEM pode embutir o app num iframe (anti-clickjacking).
  // ATENÇÃO: confirme o domínio exato do admin da Nuvemshop ANTES de ativar,
  // senão o app pode parar de carregar dentro do admin.
  // Pra descobrir, rode no console do app (aberto dentro do admin):
  //   document.location.ancestorOrigins?.[0]
  // Depois descomente e ajuste os domínios:
  //
  // res.headers.set(
  //   "Content-Security-Policy",
  //   "frame-ancestors https://*.tiendanube.com https://*.nuvemshop.com.br https://*.nuvemshop.com;"
  // );

  return res;
}

export const config = {
  matcher: "/:path*",
};
