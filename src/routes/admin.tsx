import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Users, Wallet, TrendingUp, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin — shtofollow.com" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

type ProfileRow = {
  user_id: string;
  email: string | null;
  balance_eur: number;
};


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
    { icon: Users, label: "Përdorues", value: "0" },
    { icon: Wallet, label: "Balanca totale", value: "€ 0.00" },
    { icon: ShoppingCart, label: "Porosi sot", value: "0" },
    { icon: TrendingUp, label: "Të ardhura muaji", value: "€ 0.00" },
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

        <UsersManager />


        <TopupsManager />
        <OrdersManager />
        <ReferralEarningsManager />
        <ServicesManager />
      </main>
    </div>
  );
}

function UsersManager() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    supabase
      .from("profiles")
      .select("user_id, email, balance_eur")
      .order("balance_eur", { ascending: false })
      .then(({ data }) => {
        setRows((data as ProfileRow[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const saveBalance = async (userId: string) => {
    const raw = edits[userId];
    const value = Number(raw);
    if (raw === undefined || raw === "" || Number.isNaN(value) || value < 0) {
      alert("Vendos një shumë të vlefshme (≥ 0).");
      return;
    }
    setSavingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ balance_eur: value })
      .eq("user_id", userId);
    setSavingId(null);
    if (error) {
      alert("Gabim gjatë ruajtjes: " + error.message);
      return;
    }
    setEdits((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    load();
  };

  const filtered = rows.filter((r) =>
    (r.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-semibold">Të gjithë përdoruesit</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko..."
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka përdorues.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Wallet</th>
                <th className="px-6 py-3">Ndrysho balancin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-6 py-4 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{Number(u.balance_eur).toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={edits[u.user_id] ?? ""}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [u.user_id]: e.target.value }))}
                        placeholder={Number(u.balance_eur).toFixed(2)}
                        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => saveBalance(u.user_id)}
                        disabled={savingId === u.user_id || edits[u.user_id] === undefined}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {savingId === u.user_id ? "..." : "Ruaj"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


type ReferralEarning = {
  id: string;
  referred_email: string | null;
  topup_amount_eur: number;
  bonus_eur: number;
  status: string;
  created_at: string;
};

function ReferralEarningsManager() {
  const [rows, setRows] = useState<ReferralEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .rpc("admin_list_referral_earnings")
      .then(({ data }) => {
        setRows((data as ReferralEarning[]) ?? []);
        setLoading(false);
      });
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.bonus_eur), 0);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Fitimet nga referimet</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {rows.length} bonuse · gjithsej {total.toFixed(2)} € të paguara
          </p>
        </div>
      </div>
      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka fitime nga referime ende.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-6 py-3">Përdoruesi</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Shuma e mbushur</th>
                <th className="px-6 py-3">Bonusi i fituar</th>
                <th className="px-6 py-3">Statusi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-6 py-4">{r.referred_email ?? "—"}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-6 py-4">{Number(r.topup_amount_eur).toFixed(2)} €</td>
                  <td className="px-6 py-4 font-semibold text-primary">
                    +{Number(r.bonus_eur).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-500/15 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-green-500/30">
                      {r.status === "paid" ? "Paguar" : r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


type Order = {
  id: string;
  user_id: string;
  service_id: string;
  quantity: number;
  target_link: string;
  total_price_eur: number;
  status: string;
  notes: string | null;
  created_at: string;
  services?: { name: string; platform: string; service_type: string } | null;
};

const STATUSES = ["pending", "in_progress", "completed", "cancelled"];

function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, services(name, platform, service_type)")
      .order("created_at", { ascending: false });
    const list = (data as Order[]) ?? [];
    setOrders(list);

    const userIds = [...new Set(list.map((o) => o.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      (profiles ?? []).forEach((p: { user_id: string; email: string | null }) => {
        if (p.email) map[p.user_id] = p.email;
      });
      setEmails(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    await supabase.from("orders").update({ status }).eq("id", id);
    setSavingId(null);
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
      in_progress: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
      completed: "bg-green-500/15 text-green-500 ring-green-500/30",
      cancelled: "bg-red-500/15 text-red-500 ring-red-500/30",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Porositë e klientëve</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {orders.length} porosi gjithsej · përditësohet në kohë reale
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : orders.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka porosi ende.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Klienti</th>
                <th className="px-4 py-3">Shërbimi</th>
                <th className="px-4 py-3">Sasia</th>
                <th className="px-4 py-3">Linku</th>
                <th className="px-4 py-3">Totali</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3">Shënime</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate" title={emails[o.user_id] ?? o.user_id}>
                    {emails[o.user_id] ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.services?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.services?.platform} · {o.services?.service_type}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{o.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {/^https?:\/\//i.test(o.target_link) ? (
                      <a
                        href={o.target_link}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-primary hover:underline"
                        title={o.target_link}
                      >
                        {o.target_link}
                      </a>
                    ) : (
                      <span className="block truncate" title={o.target_link}>
                        {o.target_link}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {Number(o.total_price_eur).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={savingId === o.id}
                      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusBadge(o.status)} bg-transparent`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-background text-foreground">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-xs text-muted-foreground" title={o.notes ?? ""}>
                    {o.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
          <input type="number" step="0.01" placeholder="Çmimi € / 1000" value={newSvc.price_eur}
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

type Topup = {
  id: string;
  user_id: string;
  amount_eur: number;
  method: string;
  reference: string | null;
  status: string;
  created_at: string;
  email: string | null;
  profiles?: { email: string | null } | null;
};

const METHOD_LABEL: Record<string, string> = {
  card: "Kartelë",
  bank: "Transfertë bankare",
  manual: "Kërkesë manuale",
};

function TopupsManager() {
  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("topup_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data as Topup[]) ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p.email]));
      rows.forEach((r) => {
        // Prefer the email captured on the top-up itself; fall back to profile.
        r.profiles = { email: r.email ?? map.get(r.user_id) ?? null };
      });
    }
    setTopups(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-topups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topup_requests" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approve = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase.rpc("approve_topup", { _request_id: id });
    if (error) alert(error.message);
    setSavingId(null);
    load();
  };

  const reject = async (id: string) => {
    setSavingId(id);
    await supabase.from("topup_requests").update({ status: "rejected" }).eq("id", id);
    setSavingId(null);
    load();
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
      paid: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
      approved: "bg-green-500/15 text-green-500 ring-green-500/30",
      rejected: "bg-red-500/15 text-red-500 ring-red-500/30",
      failed: "bg-red-500/15 text-red-500 ring-red-500/30",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  const statusLabel = (s: string) =>
    s === "paid" ? "paguar · në pritje" : s;

  const isActionable = (s: string) => s === "pending" || s === "paid";

  const pendingCount = topups.filter((t) => isActionable(t.status)).length;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Kërkesat për mbushje balanci</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {pendingCount} në pritje · përditësohet në kohë reale
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : topups.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka kërkesa ende.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Klienti</th>
                <th className="px-4 py-3">Shuma</th>
                <th className="px-4 py-3">Mënyra</th>
                <th className="px-4 py-3">Referenca</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {topups.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.profiles?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {Number(t.amount_eur).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">{METHOD_LABEL[t.method] ?? t.method}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-xs text-muted-foreground" title={t.reference ?? ""}>
                    {t.reference ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${badge(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isActionable(t.status) ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approve(t.id)}
                          disabled={savingId === t.id}
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {savingId === t.id ? "..." : "Aprovo"}
                        </button>
                        <button
                          onClick={() => reject(t.id)}
                          disabled={savingId === t.id}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:border-destructive disabled:opacity-50"
                        >
                          Refuzo
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
