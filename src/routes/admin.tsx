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

        <ServicesManager />
      </main>
    </div>
  );
}

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
  active: boolean;
  sort_order: number;
};

function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSvc, setNewSvc] = useState({ platform: "instagram", service_type: "followers", name: "", price_eur: 0, quantity: 100 });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setServices((data as Service[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = (id: string, field: keyof Service, value: string | number | boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const save = async (s: Service) => {
    setSavingId(s.id);
    await supabase.from("services").update({
      name: s.name, platform: s.platform, service_type: s.service_type,
      price_eur: s.price_eur, quantity: s.quantity, active: s.active,
    }).eq("id", s.id);
    setSavingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Fshi këtë shërbim?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };

  const add = async () => {
    if (!newSvc.name) return;
    setAdding(true);
    await supabase.from("services").insert({ ...newSvc, sort_order: services.length + 1 });
    setNewSvc({ platform: "instagram", service_type: "followers", name: "", price_eur: 0, quantity: 100 });
    setAdding(false);
    load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Shërbimet & çmimet</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ndrysho çmimet dhe sasitë që shfaqen në panelin e klientëve.</p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Emri</th>
                <th className="px-4 py-3">Platforma</th>
                <th className="px-4 py-3">Tipi</th>
                <th className="px-4 py-3">Çmimi € / 1000</th>
                <th className="px-4 py-3">Sasi min.</th>
                <th className="px-4 py-3">Aktiv</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <input value={s.name} onChange={(e) => updateField(s.id, "name", e.target.value)}
                      className="w-full rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={s.platform} onChange={(e) => updateField(s.id, "platform", e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1">
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={s.service_type} onChange={(e) => updateField(s.id, "service_type", e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1">
                      <option value="followers">Followers</option>
                      <option value="likes">Likes</option>
                      <option value="views">Views</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" value={s.price_eur}
                      onChange={(e) => updateField(s.id, "price_eur", Number(e.target.value))}
                      className="w-24 rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" value={s.quantity}
                      onChange={(e) => updateField(s.id, "quantity", Number(e.target.value))}
                      className="w-28 rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={s.active}
                      onChange={(e) => updateField(s.id, "active", e.target.checked)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => save(s)} disabled={savingId === s.id}
                      className="mr-2 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                      {savingId === s.id ? "..." : "Ruaj"}
                    </button>
                    <button onClick={() => remove(s.id)}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:border-destructive">
                      Fshi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-border px-6 py-4">
        <h3 className="mb-3 text-sm font-semibold">Shto shërbim të ri</h3>
        <div className="flex flex-wrap items-end gap-2">
          <input placeholder="Emri" value={newSvc.name}
            onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-sm" />
          <select value={newSvc.platform}
            onChange={(e) => setNewSvc({ ...newSvc, platform: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-sm">
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
          </select>
          <select value={newSvc.service_type}
            onChange={(e) => setNewSvc({ ...newSvc, service_type: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-sm">
            <option value="followers">Followers</option>
            <option value="likes">Likes</option>
            <option value="views">Views</option>
          </select>
          <input type="number" step="0.01" placeholder="Çmimi €" value={newSvc.price_eur}
            onChange={(e) => setNewSvc({ ...newSvc, price_eur: Number(e.target.value) })}
            className="w-24 rounded border border-border bg-background px-2 py-1 text-sm" />
          <input type="number" placeholder="Sasia" value={newSvc.quantity}
            onChange={(e) => setNewSvc({ ...newSvc, quantity: Number(e.target.value) })}
            className="w-28 rounded border border-border bg-background px-2 py-1 text-sm" />
          <button onClick={add} disabled={adding || !newSvc.name}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {adding ? "..." : "Shto"}
          </button>
        </div>
      </div>
    </div>
  );
}
