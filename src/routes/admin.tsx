import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin — shtofollow.com" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Përmbledhje", exact: true, key: null },
  { to: "/admin/regjistrimet", label: "Regjistrimet", exact: false, key: null },
  { to: "/admin/pagesat", label: "Pagesat", exact: false, key: "pagesat" },
  { to: "/admin/kerkesat", label: "Kërkesat", exact: false, key: "kerkesat" },
  { to: "/admin/sherbimet", label: "Shërbimet", exact: false, key: null },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [counts, setCounts] = useState<{ pagesat: number; kerkesat: number }>({
    pagesat: 0,
    kerkesat: 0,
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (roles?.some((r) => r.role === "super_admin")) {
        setAllowed(true);
      } else {
        navigate({ to: "/dashboard" });
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!allowed) return;

    const loadCounts = async () => {
      const { count: pagesat } = await supabase
        .from("topup_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "paid"]);
      const { count: kerkesat } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setCounts({ pagesat: pagesat ?? 0, kerkesat: kerkesat ?? 0 });
    };

    loadCounts();
    const channel = supabase
      .channel("admin-nav-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "topup_requests" }, () => loadCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadCounts())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke verifikuar aksesin...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Kthehu te faqja</Link>
              <h1 className="mt-1 text-2xl font-bold">Super Admin Panel</h1>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
              Admin akses
            </span>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2">
            {NAV.map((item) => {
              const badge = item.key ? counts[item.key] : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="relative flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                  activeProps={{ className: "relative flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary" }}
                >
                  {item.label}
                  {badge > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
