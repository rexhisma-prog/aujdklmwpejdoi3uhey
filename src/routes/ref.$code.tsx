import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Gift } from "lucide-react";

export const Route = createFileRoute("/ref/$code")({
  head: () => ({
    meta: [
      { title: "Ftesë — ShtoFollow.com" },
      { name: "description", content: "Je ftuar në ShtoFollow.com. Regjistrohu dhe fillo të rrisësh praninë në rrjetet sociale." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RefCapture,
});

function RefCapture() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (code) localStorage.setItem("pending_ref", code);
    } catch {
      // ignore storage errors
    }
    const t = setTimeout(() => navigate({ to: "/register" }), 1200);
    return () => clearTimeout(t);
  }, [code, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-10 shadow-[var(--shadow-glow)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/40">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Je ftuar në ShtoFollow.com 🎉</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Po të çojmë te regjistrimi...
        </p>
      </div>
    </div>
  );
}
