import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Gift,
  Users,
  Wallet,
  Link as LinkIcon,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getReferralData } from "@/lib/referral.functions";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Programi i Referimeve — shtofollow.com" },
      { name: "description", content: "Fto shokët e tu në ShtoFollow.com dhe fito 15% bonus për çdo referim të suksesshëm." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReferralsPage,
});

type Earning = {
  id: string;
  email: string | null;
  date: string;
  topupAmount: number;
  bonus: number;
  status: string;
};

type Data = {
  code: string | null;
  link: string | null;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  earnings: Earning[];
};

function ReferralsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState(false);
  const fetchReferral = useServerFn(getReferralData);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: s }) => {
      if (!mounted) return;
      if (!s.session?.user) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const res = await fetchReferral();
        if (mounted) setData(res as Data);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate, fetchReferral]);

  const copyLink = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke ngarkuar...
      </div>
    );
  }

  const stats = [
    { icon: Users, label: "Referime totale", value: String(data?.totalReferrals ?? 0) },
    { icon: TrendingUp, label: "Referime aktive", value: String(data?.activeReferrals ?? 0) },
    { icon: Gift, label: "Fitime totale", value: `${(data?.totalEarnings ?? 0).toFixed(2)} €` },
    { icon: Wallet, label: "Balanci nga referimet", value: `${(data?.totalEarnings ?? 0).toFixed(2)} €` },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Paneli
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
            <Gift className="h-3.5 w-3.5" /> Programi i Referimeve
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Hero / promo card */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-8 shadow-[var(--shadow-glow)]">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
              <Gift className="h-3.5 w-3.5" /> Fito 15% Bonus
            </div>
            <h1 className="mt-4 text-3xl font-bold">Programi i Referimeve</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Fto shokët e tu dhe fito bonus sa herë që sjell klientë të rinj. Bonusi
              shtohet automatikisht në balancin tënd dhe përdoret për porosi brenda
              platformës.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        {/* Referral link */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="h-4 w-4 text-primary" /> Linku yt unik i referimit
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={data?.link ?? "—"}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
            />
            <button
              onClick={copyLink}
              disabled={!data?.link}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "U kopjua!" : "Kopjo Linkun"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ndaje këtë link. Kur dikush regjistrohet përmes tij dhe bën mbushjen e parë,
            ti fiton 15% bonus automatikisht.
          </p>
        </section>

        {/* Earnings table */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold">Fitimet nga referimet</h2>
          </div>
          {(!data || data.earnings.length === 0) ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Gift className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ende nuk ke fituar bonus. Ndaje linkun tënd për të filluar!
              </p>
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
                  {data.earnings.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="px-6 py-4">{e.email ?? "—"}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(e.date).toLocaleDateString("sq-AL")}
                      </td>
                      <td className="px-6 py-4">{e.topupAmount.toFixed(2)} €</td>
                      <td className="px-6 py-4 font-semibold text-primary">
                        +{e.bonus.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-500/15 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-green-500/30">
                          {e.status === "paid" ? "Paguar" : e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
