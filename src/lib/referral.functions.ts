import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://shtofollow.com";

/**
 * Links the signed-in user to a referrer using a referral code.
 * Self-referral is rejected inside the DB function. Captures the signup IP
 * for anti-abuse checks. Safe to call multiple times — it only links once.
 */
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "").trim().toLowerCase();
    if (!code || code.length > 32) throw new Error("Kod referimi i pavlefshëm.");
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }
    const email = (claims?.email as string | undefined) ?? null;

    const { data: linked, error } = await supabase.rpc("claim_referral", {
      _code: data.code,
      _ip: ip ?? "",
      _email: email ?? "",
    });
    if (error) {
      console.error("[referral] claim error", error);
      return { linked: false };
    }
    return { linked: Boolean(linked) };
  });

/**
 * Returns the signed-in user's referral dashboard data:
 * unique link, totals, and the list of earnings.
 */
export const getReferralData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, referral_earnings_eur")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, referred_email, status, bonus_paid, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const { data: earnings } = await supabase
      .from("referral_earnings")
      .select("id, referred_email, topup_amount_eur, bonus_eur, status, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const refs = referrals ?? [];
    const code = profile?.referral_code ?? null;

    return {
      code,
      link: code ? `${SITE_URL}/ref/${code}` : null,
      totalReferrals: refs.length,
      activeReferrals: refs.filter((r) => r.bonus_paid).length,
      totalEarnings: Number(profile?.referral_earnings_eur ?? 0),
      earnings: (earnings ?? []).map((e) => ({
        id: e.id,
        email: e.referred_email,
        date: e.created_at,
        topupAmount: Number(e.topup_amount_eur),
        bonus: Number(e.bonus_eur),
        status: e.status,
      })),
      referrals: refs.map((r) => ({
        id: r.id,
        email: r.referred_email,
        status: r.status,
        bonusPaid: r.bonus_paid,
        date: r.created_at,
      })),
    };
  });
