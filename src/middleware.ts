import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ratelimit } from "@/lib/ratelimit";

const REDIRECT_URL = "https://nextcubeinc.com";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Acesso direto pelo navegador (barra de endereço) a /api -> redireciona.
  // /api/auth (OAuth/install) é navegação legítima e fica de fora.
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    req.headers.get("sec-fetch-mode") === "navigate"
  ) {
    return NextResponse.redirect(REDIRECT_URL);
  }

  // Rate limiting nas rotas de API (por IP).
  // Isenta /api/auth (OAuth) e /api/webhooks (server-to-server da Nuvemshop):
  // se levarem 429, a Nuvemshop trata como falha e fica retentando.
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    } catch {
      // Upstash indisponível -> não bloqueia (fail open), pra não derrubar o app
    }
  }

  const res = NextResponse.next();

  // headers seguros (não quebram nada)
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");

  // frame-ancestors (anti-clickjacking) — ativar depois de confirmar o domínio do admin:
  // res.headers.set(
  //   "Content-Security-Policy",
  //   "frame-ancestors https://*.tiendanube.com https://*.nuvemshop.com.br https://*.nuvemshop.com;"
  // );

  return res;
}

export const config = {
  matcher: "/:path*",
};
