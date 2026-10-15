import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NATIVE_SCHEME } from "@/lib/native";

// Opened in the phone's browser after Google sign-in started from the Android app.
// Hands the session back to the app via the app's own link scheme.
export const Route = createFileRoute("/native-callback")({
  head: () => ({
    meta: [
      { title: "Duke u kthyer në aplikacion — ShtoFollow" },
      { name: "description", content: "Përfundimi i hyrjes në aplikacionin ShtoFollow për Android." },
      { property: "og:title", content: "ShtoFollow — Kthim në aplikacion" },
      { property: "og:description", content: "Përfundimi i hyrjes në aplikacionin ShtoFollow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NativeCallback,
});

function NativeCallback() {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    let done = false;
    const go = (s: { access_token: string; refresh_token: string } | null) => {
      if (!s || done) return;
      done = true;
      const url = `${NATIVE_SCHEME}://auth#access_token=${encodeURIComponent(s.access_token)}&refresh_token=${encodeURIComponent(s.refresh_token)}`;
      setLink(url);
      window.location.href = url;
    };
    supabase.auth.getSession().then(({ data }) => go(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => go(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <p className="text-sm text-muted-foreground">Duke u kthyer në aplikacionin ShtoFollow…</p>
        {link && (
          <a href={link} className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Hap aplikacionin
          </a>
        )}
      </div>
    </div>
  );
}
