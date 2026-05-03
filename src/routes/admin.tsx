import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Users, Wallet, TrendingUp, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin — shtofollow.com" }] }),
  component: AdminPage,
});

const users = [
  { id: 1, name: "Ardit K.", email: "ardit@example.com", balance: "45.20 €", orders: 12 },
  { id: 2, name: "Erina M.", email: "erina@example.com", balance: "120.00 €", orders: 34 },
  { id: 3, name: "Blerim S.", email: "blerim@example.com", balance: "8.50 €", orders: 5 },
  { id: 4, name: "Diana H.", email: "diana@example.com", balance: "210.75 €", orders: 67 },
];

function AdminPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

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

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke verifikuar aksesin...
      </div>
    );
  }

  const stats = [
    { icon: Users, label: "Përdorues", value: "4,302" },
    { icon: Wallet, label: "Balanca totale", value: "€ 38,210" },
    { icon: ShoppingCart, label: "Porosi sot", value: "187" },
    { icon: TrendingUp, label: "Të ardhura muaji", value: "€ 12,540" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Kthehu te faqja</Link>
            <h1 className="mt-1 text-2xl font-bold">Super Admin Panel</h1>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
            Admin akses
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
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

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold">Të gjithë përdoruesit</h2>
            <input
              placeholder="Kërko..."
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-3">Emri</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Wallet</th>
                  <th className="px-6 py-3">Porosi</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{u.balance}</td>
                    <td className="px-6 py-4">{u.orders}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
                        Detaje
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
