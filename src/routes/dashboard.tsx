import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, ShoppingCart, Instagram, Music2, Facebook, Heart, Eye, Users, LogOut, Plus, Gift, Copy, Check, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimReferral } from "@/lib/referral.functions";

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
};

type Order = {
  id: string;
  service_id: string;
  quantity: number;
  target_link: string;
  total_price_eur: number;
  status: string;
  notes: string | null;
  created_at: string;
  services?: { name: string; platform: string } | null;
};

type Topup = {
  id: string;
  amount_eur: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

const topupStatusLabel: Record<string, string> = {
  pending: "Në pritje",
  paid: "Paguar — në verifikim",
  approved: "Aprovuar",
  rejected: "Refuzuar",
  failed: "Dështoi",
};

const topupBadgeClass: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
  paid: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  approved: "bg-green-500/15 text-green-500 ring-green-500/30",
  rejected: "bg-red-500/15 text-red-500 ring-red-500/30",
  failed: "bg-red-500/15 text-red-500 ring-red-500/30",
};

const statusLabel: Record<string, string> = {
  pending: "Në pritje",
  in_progress: "Duke u procesuar",
  completed: "Realizuar",
  cancelled: "Anuluar",
};

const statusBadgeClass: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  completed: "bg-green-500/15 text-green-500 ring-green-500/30",
  cancelled: "bg-red-500/15 text-red-500 ring-red-500/30",
};

const platformIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
};

const typeIcon: Record<string, typeof Heart> = {
  likes: Heart,
  views: Eye,
  followers: Users,
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Paneli im — shtofollow.com" },
      { name: "description", content: "Paneli i llogarisë shtofollow.com: shiko balancin, porosit shërbime dhe ndiq porositë e tua." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [notice, setNotice] = useState<{ status: string; serviceName: string } | null>(null);
  const [topupNotice, setTopupNotice] = useState<{ amount: number; reason: string | null } | null>(null);
  const claimRef = useServerFn(claimReferral);

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
        navigate({ to: "/admin" });
        return;
      }
      setEmail(user.email ?? "");

      // Claim a pending referral link (if any), once.
      try {
        const pendingRef = localStorage.getItem("pending_ref");
        if (pendingRef) {
          await claimRef({ data: { code: pendingRef } });
          localStorage.removeItem("pending_ref");
        }
      } catch {
        // ignore
      }

      // Load or create the user's profile (balance + referral code)
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance_eur, referral_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        const { data: created } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, email: user.email ?? null })
          .select("balance_eur, referral_code")
          .maybeSingle();
        if (mounted) {
          setBalance(0);
          setReferralCode(created?.referral_code ?? null);
        }
      } else if (mounted) {
        setBalance(Number(profile.balance_eur));
        setReferralCode(profile.referral_code ?? null);
      }

      const { data: svc } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (mounted) {
        const platformRank: Record<string, number> = { instagram: 0, tiktok: 1, facebook: 2 };
        const typeRank: Record<string, number> = { followers: 0, likes: 1, views: 2 };
        const list = ((svc as Service[]) ?? [])
          .filter((s) => s.service_type !== "profile_closure" && s.service_type !== "report_tool")
          .sort((a, b) => {
            const pa = platformRank[a.platform] ?? 99;
            const pb = platformRank[b.platform] ?? 99;
            if (pa !== pb) return pa - pb;
            const ta = typeRank[a.service_type] ?? 99;
            const tb = typeRank[b.service_type] ?? 99;
            return ta - tb;
          });
        setServices(list);
        setLoading(false);
      }

      // Load the user's orders
      const { data: ord } = await supabase
        .from("orders")
        .select("id, service_id, quantity, target_link, total_price_eur, status, notes, created_at, services(name, platform)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (mounted) setOrders((ord as Order[]) ?? []);

      // Load the user's top-up requests
      const { data: tp } = await supabase
        .from("topup_requests")
        .select("id, amount_eur, status, rejection_reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (mounted) setTopups((tp as Topup[]) ?? []);
    });
    return () => {
      mounted = false;
    };
  }, [navigate, claimRef]);

  // Realtime: notify the user when an order status changes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      channel = supabase
        .channel("client-orders")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newRow = payload.new as { id: string; status: string; service_id: string; notes: string | null };
            const oldRow = payload.old as { status: string };
            setOrders((prev) =>
              prev.map((o) => (o.id === newRow.id ? { ...o, status: newRow.status, notes: newRow.notes } : o)),
            );
            if (
              newRow.status !== oldRow.status &&
              (newRow.status === "completed" || newRow.status === "in_progress")
            ) {
              setOrders((prev) => {
                const svcName =
                  prev.find((o) => o.id === newRow.id)?.services?.name ?? "Porosia";
                setNotice({ status: newRow.status, serviceName: svcName });
                return prev;
              });
            }
          },
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);


  const referralLink = referralCode ? `https://shtofollow.com/ref/${referralCode}` : null;
  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke ngarkuar...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-2xl ${
              notice.status === "completed"
                ? "border-green-500/40"
                : "border-blue-500/40"
            }`}
          >
            <div
              className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
                notice.status === "completed"
                  ? "bg-green-500/15 text-green-500"
                  : "bg-blue-500/15 text-blue-500"
              }`}
            >
              {notice.status === "completed" ? (
                <Check className="h-10 w-10" />
              ) : (
                <ShoppingCart className="h-10 w-10" />
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {notice.status === "completed"
                ? "Porosia juaj është realizuar me sukses! 🎉"
                : "Porosia juaj është duke u procesuar ⏳"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{notice.serviceName}</p>
            <button
              onClick={() => setNotice(null)}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Në rregull
            </button>
          </div>
        </div>
      )}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Kthehu mbrapa
            </button>
            <h1 className="mt-1 text-2xl font-bold">Paneli i llogarisë</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" /> Dil
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Wallet */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Balanca jote
              </div>
              <div className="mt-2 text-4xl font-bold text-primary">{balance.toFixed(2)} €</div>
            </div>
            <Link
              to="/topup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Mbush balancin
            </Link>
          </div>
        </section>

        {/* Contact / support */}
        <section className="rounded-3xl border border-border bg-card/50 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" /> Ke nevojë për ndihmë?
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Na kontakto në WhatsApp në <span className="font-semibold text-foreground">+49 163 4371067</span>
              </p>
            </div>
            <a
              href="https://wa.me/491634371067"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Kontakto në WhatsApp
            </a>
          </div>
        </section>

        {/* Referral promo */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-[var(--shadow-glow)]">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                <Gift className="h-3.5 w-3.5" /> Fito 15% Bonus
              </div>
              <h2 className="mt-3 text-xl font-bold">Programi i Referimeve</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Fto shokët e tu dhe fito bonus sa herë që sjell klientë të rinj.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyReferral}
                disabled={!referralLink}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "U kopjua!" : "Kopjo Linkun"}
              </button>
              <Link
                to="/referrals"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Referimet
              </Link>
            </div>
          </div>
        </section>

        {/* Fake profile closure */}
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-[var(--shadow-glow)]">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                <ShieldCheck className="h-3.5 w-3.5" /> Mbyllje profilesh fake
              </div>
              <h2 className="mt-3 text-xl font-bold">Instagram, TikTok dhe Facebook</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Shiko çmimet dhe zgjidh shërbimin për mbyllje profili ose faqeje fake.
              </p>
            </div>
            <Link
              to="/mbyll-profile-fake"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" /> Shiko shërbimet
            </Link>
          </div>
        </section>

        {/* Report assistance */}
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-[var(--shadow-glow)]">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                <ShieldCheck className="h-3.5 w-3.5" /> Asistencë raportimi — 29.99€
              </div>
              <h2 className="mt-3 text-xl font-bold">Përpilim raportimi për mbylljen e profileve</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Asistencë për përpilimin e raportit në anglisht dhe udhëzime për hapat zyrtarë.
              </p>
            </div>
            <Link
              to="/raporto-profil"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" /> Shiko shërbimin
            </Link>
          </div>
        </section>



        <section>
          <h2 className="mb-4 text-lg font-semibold">Shërbimet tona</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = platformIcon[s.platform] ?? typeIcon[s.service_type] ?? Users;
              return (
                <div
                  key={s.id}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
                >
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {Number(s.price_eur).toFixed(2)} € për 1,000
                  </div>
                  <Link
                    to="/order/$serviceId"
                    params={{ serviceId: s.id }}
                    className="mt-4 block w-full rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Porosit
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Orders */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold">Porositë e mia</h2>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nuk ke porosi ende. Zgjedh një shërbim më lart për të filluar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((o) => (
                <div key={o.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium">{o.services?.name ?? "Shërbim"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.quantity.toLocaleString()} · {new Date(o.created_at).toLocaleDateString("sq-AL")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">
                        {Number(o.total_price_eur).toFixed(2)} €
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                          statusBadgeClass[o.status] ?? "bg-muted text-muted-foreground ring-border"
                        }`}
                      >
                        {statusLabel[o.status] ?? o.status}
                      </span>
                    </div>
                  </div>
                  {o.status === "cancelled" && o.notes ? (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      <span className="font-semibold">Arsyeja e refuzimit: </span>
                      {o.notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
