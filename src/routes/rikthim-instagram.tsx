import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Shield,
  Instagram,
  ArrowLeft,
  Clock,
  RotateCcw,
  CreditCard,
  Users,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/rikthim-instagram")({
  head: () => ({
    meta: [
      { title: "Rikthimi i Instagramit të Mbyllur ose të Suspenduar — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Ndihmojmë në rikthimin e llogarive të Instagramit që janë mbyllur, suspenduar ose çaktivizuar. Çmime sipas numrit të ndjekësve. Procesi zgjat deri në 1 javë; nëse nuk rikthehet brenda javës, mbahen vetëm 50€ për shpenzime dhe pjesa tjetër kthehet e plotë brenda 24 orëve.",
      },
      { property: "og:title", content: "Rikthimi i Instagramit të Mbyllur ose të Suspenduar — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Rikthejmë llogaritë e Instagramit të mbyllura, suspenduara ose çaktivizuara. Procesi zgjat deri në 1 javë; nëse nuk rikthehet brenda javës, mbahen vetëm 50€ për shpenzime dhe pjesa tjetër kthehet e plotë brenda 24 orëve. Pagesat: OneFor, Visa dhe Mastercard.",
      },
      { property: "og:url", content: "https://shtofollow.com/rikthim-instagram" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/rikthim-instagram" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Rikthimi i Instagramit të Mbyllur ose të Suspenduar",
          description:
            "Ndihmojmë në rikthimin e llogarive të Instagramit që janë mbyllur, suspenduar ose çaktivizuar.",
          provider: { "@type": "Organization", name: "ShtoFollow.com", url: "https://shtofollow.com" },
          areaServed: "AL",
          offers: { "@type": "Offer", priceCurrency: "EUR", price: "199.99" },
        }),
      },
    ],
  }),
  component: RikthimInstagram,
});

type RecoveryService = {
  id: string;
  name: string;
  price_eur: number;
  sort_order: number;
};

function RikthimInstagram() {
  const navigate = useNavigate();
  const [services, setServices] = useState<RecoveryService[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, price_eur, sort_order")
        .eq("service_type", "account_recovery")
        .eq("active", true)
        .order("sort_order");
      if (mounted && data) setServices(data as RecoveryService[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kthehu mbrapa
          </button>
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Shto</span>
            <span className="text-primary">Follow</span>
            <span className="text-muted-foreground">.com</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Dilni
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" /> Nga 199.99€
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Instagram className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              🔓 Rikthimi i Instagramit të mbyllur ose të{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                suspenduar
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Ndihmojmë në rikthimin e llogarive të Instagramit që janë mbyllur, suspenduar ose çaktivizuar.
            </p>
            <div className="mx-auto mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Procesi zgjat deri në <span className="font-semibold text-primary">1 javë</span>.
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
                <RotateCcw className="h-4 w-4 text-primary" />
                Nuk rikthehet brenda javës? <span className="font-semibold text-primary">Mbahen vetëm 50€, pjesa tjetër kthehet e plotë brenda 24 orëve</span>.
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                Pagesat: <span className="font-semibold text-primary">OneFor, Visa dhe Mastercard</span>
              </div>
            </div>
            <div className="mt-10">
              <a
                href="#cmimet"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Instagram className="h-4 w-4" /> Nis rikthimin e Instagramit
              </a>
            </div>
          </div>
        </section>

        {/* Çmimet */}
        <section id="cmimet" className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Çmimet sipas numrit të ndjekësve</h2>
            <p className="mt-3 text-muted-foreground">
              Zgjidh paketën sipas numrit të ndjekësve të llogarisë tënde.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {services.map((s) => {
              const content = (
                <>
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    {s.name.replace("Rikthim Instagram — ", "")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{Number(s.price_eur).toFixed(2)}€</span>
                    <Instagram className="h-4 w-4 text-primary" />
                  </span>
                </>
              );
              return (
                <Link
                  key={s.id}
                  to="/order/$serviceId"
                  params={{ serviceId: s.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {content}
                </Link>
              );
            })}
            {services.length === 0 && (
              <p className="rounded-2xl border border-border bg-card px-5 py-4 text-center text-sm text-muted-foreground">
                Duke ngarkuar çmimet...
              </p>
            )}
          </div>

          {/* Garanci kthimi parash */}
          <div className="mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Garanci kthimi parash</p>
              <p className="text-sm text-muted-foreground">
                Procesi zgjat deri në 1 javë. Nëse Instagrami nuk rikthehet brenda javës, mbahen vetëm 50€ për shpenzime dhe pjesa tjetër kthehet e plotë brenda 24 orëve.
              </p>
            </div>
          </div>
        </section>

        {/* Çfarë përfshihet */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Pse të na zgjedhësh</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, text: "Proces i sigurt dhe profesional" },
                { icon: Clock, text: "Rikthimi deri në 1 javë" },
                { icon: RotateCcw, text: "Nuk rikthehet? Mbahen vetëm 50€, pjesa tjetër kthehet" },
                { icon: CreditCard, text: "OneFor, Visa dhe Mastercard" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-10 shadow-[var(--shadow-glow)]">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Gati për të rikthyer Instagramin?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Zgjidh paketën sipas numrit të ndjekësve dhe nis procesin sot.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#cmimet"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Instagram className="h-4 w-4" /> Nis rikthimin e Instagramit
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/50"
              >
                Kthehu te faqja
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 shtofollow.com — REA Marketing SH.P.K. Të gjitha të drejtat të rezervuara.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Kryefaqja</Link>
            <Link to="/login" className="hover:text-foreground">Hyr</Link>
            <Link to="/register" className="hover:text-foreground">Regjistrohu</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
