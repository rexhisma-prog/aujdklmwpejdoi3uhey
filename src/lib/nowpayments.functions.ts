import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://shtofollow.com";
const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

// USDT on the Tron network — lowest fees, most used stablecoin.
const PAY_CURRENCY = "usdttrc20";

function getApiKey() {
  const key = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!key) {
    throw new Error("Mungon kredenciali i NOWPayments (NOWPAYMENTS_API_KEY).");
  }
  return key;
}

/**
 * Creates a NOWPayments invoice for a crypto (USDT-TRC20) top-up and returns
 * the hosted payment URL. The balance is credited later, when NOWPayments
 * calls our IPN webhook with a confirmed payment.
 */
export const createCryptoTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number }) => {
    const amount = Number(input?.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
      throw new Error("Shuma minimale për mbushje me kripto është 10 €.");
    }
    return { amount: Math.round(amount * 100) / 100 };
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const apiKey = getApiKey();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve the payer's email so we always know whose balance to credit.
    let email: string | null = (claims?.email as string | undefined) ?? null;
    if (!email) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("user_id", userId)
        .maybeSingle();
      email = prof?.email ?? null;
    }

    // 1. Create a pending top-up request.
    const { data: topup, error: insErr } = await supabaseAdmin
      .from("topup_requests")
      .insert({
        user_id: userId,
        amount_eur: data.amount,
        method: "crypto",
        status: "pending",
        email,
      })
      .select("id")
      .single();
    if (insErr || !topup) {
      throw new Error("Nuk u krijua kërkesa për mbushje.");
    }

    // 2. Open a NOWPayments invoice.
    const res = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: data.amount,
        price_currency: "eur",
        pay_currency: PAY_CURRENCY,
        order_id: topup.id,
        order_description: "Mbushje balanci ShtoFollow",
        ipn_callback_url: `${SITE_URL}/api/public/nowpayments/webhook`,
        success_url: `${SITE_URL}/topup?status=success`,
        cancel_url: `${SITE_URL}/topup?status=cancel`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[NOWPayments] invoice error", res.status, body);
      await supabaseAdmin.from("topup_requests").update({ status: "failed" }).eq("id", topup.id);
      throw new Error("Pagesa me kripto nuk mund të iniciohej. Provo përsëri.");
    }

    const invoice = (await res.json()) as { id?: string; invoice_url?: string };
    if (!invoice.invoice_url) {
      throw new Error("Përgjigje e pavlefshme nga NOWPayments.");
    }

    // 3. Store the invoice id so the webhook can match it back to this request.
    if (invoice.id) {
      await supabaseAdmin
        .from("topup_requests")
        .update({ provider_session_id: String(invoice.id) })
        .eq("id", topup.id);
    }

    return { redirectUrl: invoice.invoice_url };
  });
