import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import {
  createPromotion,
  registerCallback,
  registerUninstallWebhook,
} from "@/lib/discounts";
import { registerShippingBusinessRule } from "@/lib/shipping";
import { registerPaymentsBusinessRule } from "@/lib/payments";
import { syncStoreOptions } from "@/lib/syncOptions";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code não encontrado" }, { status: 400 });
  }

  // troca o code por access_token
  const tokenRes = await axios.post(process.env.TIENDANUBE_AUTH_URL!, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
  });
  const cred = tokenRes.data; // { access_token, scope, user_id }
  const storeId = Number(cred.user_id);

  // salva a loja no Supabase
  await supabase.from("stores").upsert(
    { store_id: storeId, access_token: cred.access_token, scope: cred.scope },
    { onConflict: "store_id" }
  );

  // cria promoção + registra callback (não trava a instalação se falhar)
  try {
    const promotionId = await createPromotion(storeId);
    await supabase.from("stores").update({ promotion_id: promotionId }).eq("store_id", storeId);
    await registerCallback(
      storeId,
      `${process.env.SUPABASE_URL}/functions/v1/discounts-callback`
    );
    // webhook de desinstalação (URL pública — não pode ser localhost)
    await registerUninstallWebhook(
      storeId,
      `${process.env.APP_URL}/api/webhooks/app-uninstalled`
    );
    // Business Rules de frete: no atacado escondemos o varejo e deixamos só "A Combinar".
    // Requer escopo read_shipping + app habilitada para Business Rules pelos parceiros.
    await registerShippingBusinessRule(
      storeId,
      `${process.env.SUPABASE_URL}/functions/v1/shipping-callback`
    );
    // Business Rules de pagamento: no atacado deixamos só o Pix ativo.
    // Requer escopos read_payment_options + read_payments (mesma habilitação de Business Rules).
    await registerPaymentsBusinessRule(
      storeId,
      `${process.env.SUPABASE_URL}/functions/v1/payments-callback`
    );
    // Espelha o catálogo de opções (frete/pagamento) no Supabase pros callbacks lerem.
    await syncStoreOptions(storeId);
  } catch (e) {
    console.error("Erro setup atacado:", e);
  }

  return NextResponse.json(cred);
}