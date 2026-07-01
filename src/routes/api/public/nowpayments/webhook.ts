import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * NOWPayments signs the IPN body with HMAC-SHA512 over the JSON payload whose
 * keys are sorted alphabetically (recursively), using the IPN secret.
 * See: https://documenter.getpostman.com/view/7907941/S1a32n38 (IPN section).
 */
function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const sorted = JSON.stringify(sortObject(parsed));
  const expected = createHmac("sha512", secret).update(sorted).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/nowpayments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
        if (!secret) {
          console.error("[NOWPayments webhook] missing IPN secret");
          return json({ success: false, message: "Not configured" }, 500);
        }

        const signature = request.headers.get("x-nowpayments-sig") ?? "";
        const rawBody = await request.text();

        if (!signature || !verifySignature(rawBody, signature, secret)) {
          return json({ success: false, message: "Invalid signature" }, 401);
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
          return json({ success: false, message: "Invalid JSON" }, 400);
        }

        const orderId = payload.order_id as string | undefined;
        const status = String(payload.payment_status ?? "").toLowerCase();
        if (!orderId) {
          return json({ success: false, message: "Missing order_id" }, 400);
        }

        // Decide the outcome. "finished" = fully paid & confirmed on-chain.
        let paid: boolean | null = null;
        if (status === "finished") paid = true;
        else if (["failed", "refunded", "expired"].includes(status)) paid = false;

        // Intermediate states (waiting/confirming/confirmed/sending/partially_paid):
        // acknowledge so NOWPayments stops retrying; final IPN settles it.
        if (paid === null) {
          return json({ success: true, message: "pending" }, 200);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("credit_topup_by_id", {
          _topup_id: orderId,
          _paid: paid,
        });

        if (error) {
          console.error("[NOWPayments webhook] rpc error", error);
          return json({ success: false, message: "Server error" }, 400);
        }
        if (data === false) {
          return json({ success: false, message: "Order not found" }, 400);
        }

        return json({ success: true, message: "" }, 200);
      },
    },
  },
});
