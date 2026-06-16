import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://shtofollow.com";

function getOneforConfig() {
  const baseUrl = (process.env.ONEFOR_BASE_URL || "https://api.app.onefor.com/core").replace(/\/$/, "");
  const apiKey = process.env.ONEFOR_API_KEY?.trim();
  const apiSecret = process.env.ONEFOR_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    throw new Error("Mungojnë kredencialet e OneFor (ONEFOR_API_KEY / ONEFOR_API_SECRET).");
  }
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const isProd = baseUrl.includes("api.app.onefor.com");
  const webBase = isProd ? "https://web.app.onefor.com" : "https://web.staging.app.onefor.com";
  return { baseUrl, auth, webBase };
}

/**
 * Creates a OneFor ePay session for a card top-up and returns the redirect URL.
 * The balance is credited later, when OneFor calls our webhook.
 */
export const createOneforTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; channel?: "card" | "onefor" }) => {
    const amount = Number(input?.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      throw new Error("Shumë e pavlefshme.");
    }
    const channel = input?.channel === "onefor" ? "onefor" : "card";
    return { amount: Math.round(amount * 100) / 100, channel };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { baseUrl, auth } = getOneforConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create a pending top-up request
    const { data: topup, error: insErr } = await supabaseAdmin
      .from("topup_requests")
      .insert({
        user_id: userId,
        amount_eur: data.amount,
        method: data.channel,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr || !topup) {
      throw new Error("Nuk u krijua kërkesa për mbushje.");
    }

    // 2. Open a OneFor ePay session
    const expiresAt = new Date(Date.now() + 8 * 60 * 1000).toISOString();
    const res = await fetch(`${baseUrl}/epay/session`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_reference_id: topup.id,
        total_amount: data.amount,
        currency: "EUR",
        success_url: `${SITE_URL}/topup?status=success`,
        cancel_url: `${SITE_URL}/topup?status=cancel`,
        transaction_details: "Mbushje balanci ShtoFollow",
        expires_at: expiresAt,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[OneFor] session error", res.status, body);
      await supabaseAdmin.from("topup_requests").update({ status: "failed" }).eq("id", topup.id);
      throw new Error("Pagesa nuk mund të iniciohej. Provo përsëri.");
    }

    const session = (await res.json()) as { session_id: string };
    if (!session.session_id) {
      throw new Error("Përgjigje e pavlefshme nga OneFor.");
    }

    // 3. Store the session id so the webhook can match it
    await supabaseAdmin
      .from("topup_requests")
      .update({ provider_session_id: session.session_id })
      .eq("id", topup.id);

    return {
      sessionId: session.session_id,
      redirectUrl: `https://web.staging.app.onefor.com/web/merchant-redirection?sessionId=${session.session_id}`,
    };
  });
