import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createOneforTopup } from "@/lib/onefor.functions";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Landmark,
  HandCoins,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/topup")({
  head: () => ({ meta: [{ title: "Mbush balancin — shtofollow.com" }] }),
  component: TopupPage,
});

type Method = "card" | "onefor" | "bank" | "manual";

const METHODS: {
  id: Method;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "card",
    label: "Kartelë",
    desc: "Paguaj me kartelë debiti/krediti. Balanca shtohet automatikisht.",
    icon: CreditCard,
  },
  {
    id: "onefor",
    label: "OneFor",
    desc: "Paguaj me llogarinë tënde OneFor. Balanca shtohet automatikisht.",
    icon: Wallet,
  },
  {
    id: "bank",
    label: "Transfertë bankare",
    desc: "Dërgo shumën në llogarinë tonë bankare.",
    icon: Landmark,
  },
  {
    id: "manual",
    label: "Kërkesë manuale",
    desc: "Kërko mbushje dhe ekipi ynë e aprovon.",
    icon: HandCoins,
  },
];

const PRESETS = [5, 10, 20, 50, 100];

const BANK_DETAILS = {
  bank: "Teb Bank",
  name: "REA Marketing SH.P.K",
  iban: "2032000271265989",
};

function TopupPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(10);
  const [method, setMethod] = useState<Method>("card");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [returnStatus, setReturnStatus] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s === "success" || s === "cancel") setReturnStatus(s);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const startCardPayment = useServerFn(createOneforTopup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || amount <= 0) return;
    setError(null);
    setSubmitting(true);

    // Card & OneFor payments go through OneFor: create a session.
    if (method === "card" || method === "onefor") {
      try {
        const { redirectUrl } = await startCardPayment({
          data: { amount, channel: method },
        });
        // Card -> redirect to the OneFor payment page.
        // OneFor -> show a QR code the user scans with the OneFor app.
        if (method === "onefor") {
          setQrUrl(redirectUrl);
          setSubmitting(false);
        } else {
          window.location.href = redirectUrl;
        }
        return;
      } catch (err) {
        setSubmitting(false);
        setError(err instanceof Error ? err.message : "Pagesa dështoi.");
        return;
      }
    }

    // Bank transfer / manual requests are recorded for admin approval.
    const { error: err } = await supabase.from("topup_requests").insert({
      user_id: userId,
      amount_eur: amount,
      method,
      reference: reference.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke ngarkuar...
      </div>
    );
  }

  if (qrUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card/50 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
            <button
              onClick={() => setQrUrl(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Kthehu
            </button>
          </div>
        </header>
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-10 text-center">
          <h1 className="text-2xl font-bold">Skano me OneFor</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Hap aplikacionin OneFor dhe skano këtë QR code për të paguar{" "}
            <span className="font-semibold text-primary">{amount.toFixed(2)} €</span>.
            Balanca shtohet automatikisht pas pagesës.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-[var(--shadow-glow)]">
            <QRCodeSVG value={qrUrl} size={240} level="M" />
          </div>

          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Hap linkun e pagesës
          </a>

          <p className="mt-6 text-xs text-muted-foreground">
            Pasi të paguash, kthehu te paneli — balanca përditësohet brenda pak sekondash.
          </p>
        </main>
      </div>
    );
  }


  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
          <div className="w-full rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center shadow-[var(--shadow-glow)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/40">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Kërkesa u dërgua! 🎉</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Kërkesa jote për mbushje prej{" "}
              <span className="font-semibold text-primary">
                {amount.toFixed(2)} €
              </span>{" "}
              u regjistrua me sukses.
            </p>

            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                Balanca jote do të përditësohet sapo ekipi ynë ta konfirmojë
                pagesën.
              </p>
            </div>

            {method === "bank" && (
              <div className="mt-6 rounded-2xl border border-border bg-background/50 px-5 py-4 text-left text-sm">
                <p className="mb-2 font-semibold">Të dhënat bankare:</p>
                <p className="text-muted-foreground">Banka: {BANK_DETAILS.bank}</p>
                <p className="text-muted-foreground">Emri: {BANK_DETAILS.name}</p>
                <p className="text-muted-foreground">Numri i llogarisë: {BANK_DETAILS.iban}</p>
              </div>
            )}

            <div className="mt-8">
              <Link
                to="/dashboard"
                className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Kthehu te paneli
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Paneli
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold">Mbush balancin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zgjedh shumën dhe mënyrën e pagesës.
        </p>

        {returnStatus === "success" && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Pagesa u përfundua. Balanca jote përditësohet sapo OneFor ta konfirmojë (zakonisht në pak sekonda).
          </div>
        )}
        {returnStatus === "cancel" && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Pagesa u anulua. Mund të provosh përsëri.
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Shuma (€)</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    amount === p
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {p} €
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              step="0.5"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Mënyra e pagesës
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {method === "bank" && (
            <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm">
              <p className="mb-1 font-semibold">Dërgo pagesën në:</p>
              <p className="text-muted-foreground">Banka: {BANK_DETAILS.bank}</p>
              <p className="text-muted-foreground">Emri: {BANK_DETAILS.name}</p>
              <p className="text-muted-foreground">Numri i llogarisë: {BANK_DETAILS.iban}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Referencë / shënim (opsionale)
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={
                method === "bank"
                  ? "Numri i transfertës ose emri i dërguesit"
                  : "Diçka që duhet ta dimë"
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <span className="text-sm text-muted-foreground">Totali për mbushje</span>
            <span className="text-xl font-bold text-primary">
              {amount.toFixed(2)} €
            </span>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || amount <= 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {method === "card"
              ? "Vazhdo te pagesa me kartelë"
              : method === "onefor"
                ? "Gjenero QR code për OneFor"
                : "Dërgo kërkesën"}
          </button>
        </form>
      </main>
    </div>
  );
}
