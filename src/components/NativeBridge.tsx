import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, NATIVE_SCHEME } from "@/lib/native";

/** Android-only glue: back button, status bar, deep-link sign-in, resume refresh. No-op on web. */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;
    const cleanups: Array<() => void> = [];
    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* ignore */
      }

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && window.location.pathname !== "/") window.history.back();
        else App.exitApp();
      });

      const open = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith(`${NATIVE_SCHEME}://`)) return;
        const u = new URL(url.replace(`${NATIVE_SCHEME}://`, "https://native/"));
        const p = new URLSearchParams(u.hash.slice(1));
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");
        try { await Browser.close(); } catch { /* ignore */ }
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          window.location.replace("/");
        } else if (u.pathname.startsWith("/topup")) {
          window.location.replace("/topup" + u.search);
        }
      });

      // Coming back from an external payment page: refresh the balance view.
      const resume = await App.addListener("resume", () => {
        if (window.location.pathname.startsWith("/topup")) window.location.reload();
      });

      cleanups.push(() => back.remove(), () => open.remove(), () => resume.remove());
    })();
    return () => cleanups.forEach((c) => c());
  }, []);
  return null;
}
