import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return json({ success: false, message: "Unauthorized" }, 401);
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Pull a session id out of the many shapes OneFor may POST.
 */
function extractSession(payload: Record<string, unknown>): {
  sessionId?: string;
  clientReferenceId?: string;
  paidHint?: boolean;
} {
  const data = (payload.data ?? payload.Data ?? {}) as Record<string, unknown>;

  const sessionId =
    (payload.session_id as string) ||
    (data.session_id as string) ||
    (typeof payload.id === "string" && payload.type ? (payload.id as string) : undefined) ||
    undefined;

  const clientReferenceId =
    (payload.client_reference_id as string) || (data.client_reference_id as string) || undefined;

  let paidHint: boolean | undefined;
  if (typeof payload.is_paid === "boolean") paidHint = payload.is_paid;
  const status = (payload.status as string) || (data.status as string);
  if (status) paidHint = status.toLowerCase() === "complete";

  return { sessionId, clientReferenceId, paidHint };
}

function getOneforConfig() {
  const baseUrl = (process.env.ONEFOR_BASE_URL || "https://api.app.onefor.com/core").replace(/\/$/, "");
  const apiKey = process.env.ONEFOR_API_KEY?.trim();
  const apiSecret = process.env.ONEFOR_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  return { baseUrl, auth: Buffer.from(`${apiKey}:${apiSecret}`).toString("base64") };
}

/**
 * Authoritatively confirm payment status by asking OneFor directly.
 */
async function verifySessionStatus(sessionId: string): Promise<boolean | null> {
  const cfg = getOneforConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.baseUrl}/epay/session/${encodeURIComponent(sessionId)}`, {
      method: "GET",
      headers: { Authorization: `Basic ${cfg.auth}` },
    });
    if (!res.ok) {
      console.error("[OneFor webhook] verify status", res.status);
      return null;
    }
    const body = (await res.json()) as { status?: string };
    const status = (body.status || "").toLowerCase();
    if (status === "complete") return true;
    if (status === "expired" || status === "cancelled" || status === "refunded") return false;
    return null;
  } catch (e) {
    console.error("[OneFor webhook] verify error", e);
    return null;
  }
}

export const Route = createFileRoute("/api/public/onefor/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Basic auth verification (credentials configured on the OneFor merchant)
        const user = process.env.ONEFOR_WEBHOOK_USER;
        const pass = process.env.ONEFOR_WEBHOOK_PASSWORD;
        const header = request.headers.get("authorization") ?? "";
        if (!user || !pass || !header.startsWith("Basic ")) {
          return unauthorized();
        }
        const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
        const idx = decoded.indexOf(":");
        const gotUser = idx >= 0 ? decoded.slice(0, idx) : decoded;
        const gotPass = idx >= 0 ? decoded.slice(idx + 1) : "";
        if (!safeEqual(gotUser, user) || !safeEqual(gotPass, pass)) {
          return unauthorized();
        }

        // 2. Parse payload (tolerant of OneFor's various shapes)
        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ success: false, message: "Invalid JSON" }, 400);
        }

        const { sessionId, paidHint } = extractSession(payload);
        if (!sessionId) {
          return json({ success: false, message: "Missing session_id" }, 400);
        }

        // 3. Confirm the real status with OneFor; fall back to the payload hint
        let paid = await verifySessionStatus(sessionId);
        if (paid === null) {
          if (typeof paidHint !== "boolean") {
            return json({ success: true, message: "pending" }, 200);
          }
          paid = paidHint;
        }

        // 4. Settle the top-up (credits balance only after admin approval per business rule)
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("complete_topup_by_session", {
          _session_id: sessionId,
          _paid: paid,
        });

        if (error) {
          console.error("[OneFor webhook] rpc error", error);
          return json({ success: false, message: "Server error" }, 400);
        }
        if (data === false) {
          return json({ success: false, message: "Session not found" }, 400);
        }

        return json({ success: true, message: "" }, 200);
      },
    },
  },
});
