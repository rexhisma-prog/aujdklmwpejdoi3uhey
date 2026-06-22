import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Wallet, TrendingUp, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [statsData, setStatsData] = useState({
    users: 0,
    totalBalance: 0,
    ordersToday: 0,
    monthRevenue: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("balance_eur");
      const users = profiles?.length ?? 0;
      const totalBalance = (profiles ?? []).reduce(
        (s, p) => s + Number(p.balance_eur ?? 0),
        0,
      );

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count: ordersToday } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: topups } = await supabase
        .from("topup_requests")
        .select("amount_eur, status, created_at")
        .eq("status", "approved")
        .gte("created_at", startOfMonth.toISOString());
      const monthRevenue = (topups ?? []).reduce(
        (s, t) => s + Number(t.amount_eur ?? 0),
        0,
      );

      setStatsData({ users, totalBalance, ordersToday: ordersToday ?? 0, monthRevenue });
    };
    loadStats();
  }, []);

  const stats = [
    { icon: Users, label: "Përdorues", value: String(statsData.users) },
    { icon: Wallet, label: "Balanca totale", value: `€ ${statsData.totalBalance.toFixed(2)}` },
    { icon: ShoppingCart, label: "Porosi sot", value: String(statsData.ordersToday) },
    { icon: TrendingUp, label: "Të ardhura muaji (depozita të pranuara)", value: `€ ${statsData.monthRevenue.toFixed(2)}` },
  ];

  const links = [
    { to: "/admin/regjistrimet", label: "Regjistrimet", desc: "Përdoruesit & balanca" },
    { to: "/admin/pagesat", label: "Pagesat", desc: "Kërkesat për mbushje & referime" },
    { to: "/admin/kerkesat", label: "Kërkesat", desc: "Porositë e klientëve" },
    { to: "/admin/sherbimet", label: "Shërbimet", desc: "Çmimet & shërbimet" },
  ] as const;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary"
          >
            <div className="font-semibold">{l.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{l.desc}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
