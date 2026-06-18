import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // Only super admins may delete users.
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Not authorized");
    if (data.userId === context.userId) throw new Error("Nuk mund të fshish veten.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove dependent rows first (in case FKs don't cascade).
    await supabaseAdmin.from("orders").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("topup_requests").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("referrals").delete().eq("referred_user_id", data.userId);
    await supabaseAdmin.from("referrals").delete().eq("referrer_id", data.userId);
    await supabaseAdmin.from("referral_earnings").delete().eq("referred_user_id", data.userId);
    await supabaseAdmin.from("referral_earnings").delete().eq("referrer_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
