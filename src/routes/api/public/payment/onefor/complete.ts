import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function unauthorized() {
  return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/payment/onefor/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Basic auth verification
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

        let payload: { order_id?: number; is_paid?: boolean; session_id?: string };
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const sessionId = payload.session_id;
        if (!sessionId || typeof payload.is_paid !== "boolean") {
          return new Response(JSON.stringify({ success: false, message: "Missing fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("complete_topup_by_session", {
          _session_id: sessionId,
          _paid: payload.is_paid,
        });

        if (error) {
          console.error("[OneFor webhook] rpc error", error);
          return new Response(JSON.stringify({ success: false, message: "Server error" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (data === false) {
          return new Response(JSON.stringify({ success: false, message: "Session not found" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: "" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
