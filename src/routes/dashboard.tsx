import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, ShoppingCart, Instagram, Music2, Facebook, Heart, Eye, Users, LogOut, Plus, Gift, Copy, Check } from "lucide-react";
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
  created_at: string;
  services?: { name: string; platform: string } | null;
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
  const [notice, setNotice] = useState<{ status: string; serviceName: string } | null>(null);
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
        setServices((svc as Service[]) ?? []);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate, claimRef]);

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
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Faqja kryesore
            </Link>
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
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nuk ke porosi ende. Zgjedh një shërbim më lart për të filluar.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
