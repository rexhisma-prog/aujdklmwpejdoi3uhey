import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Shield,
  Instagram,
  Twitter,
  Music2,
  Check,
  ArrowLeft,
  FileSearch,
  FileText,
  Eye,
  Headphones,
  Clock,
  RotateCcw,
  MessageCircle,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/mbyll-profile-fake")({
  head: () => ({
    meta: [
      { title: "Mbyllja e Profileve dhe Faqeve Fake — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Mbyllim profile dhe faqe false në Instagram, Twitter dhe TikTok që përdorin emrin, fotografinë ose markën tuaj. Çmim fiks 249.99€. Nëse mbyllja nuk realizohet, paratë kthehen 100%.",
      },
      { property: "og:title", content: "Mbyllja e Profileve dhe Faqeve Fake — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Ndihmojmë persona dhe biznese të mbyllin profile dhe faqe false në Instagram, Twitter dhe TikTok. Çmim fiks 249.99€ — kthim parash 100% nëse nuk realizohet.",
      },
      { property: "og:url", content: "https://shtofollow.com/mbyll-profile-fake" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/mbyll-profile-fake" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Mbyllja e Profileve dhe Faqeve Fake",
          description:
            "Mbyllim profile dhe faqe false në Instagram, Twitter dhe TikTok që përdorin emrin, fotografinë ose markën tuaj.",
          provider: { "@type": "Organization", name: "ShtoFollow.com", url: "https://shtofollow.com" },
          areaServed: "AL",
          offers: { "@type": "Offer", priceCurrency: "EUR", price: "249.99" },
        }),
      },
    ],
  }),
  component: MbyllProfileFake,
});

const platformIcon: Record<string, typeof Instagram> = {
  Instagram,
  Twitter,
  TikTok: Music2,
};

const CLOSURE_PRICE = "249.99€";

const platforms = [
  { platform: "Instagram", price: CLOSURE_PRICE },
  { platform: "Twitter", price: CLOSURE_PRICE },
  { platform: "TikTok", price: CLOSURE_PRICE },
];

type ClosureService = { id: string; platform: string; name: string };

const included = [
  { icon: FileSearch, text: "Analiza e rastit" },
  { icon: FileText, text: "Raportim profesional" },
  { icon: Eye, text: "Ndjekja e procesit" },
  { icon: Headphones, text: "Asistencë deri në përfundim" },
];

function MbyllProfileFake() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ClosureService[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, platform, name")
        .eq("service_type", "profile_closure")
        .eq("active", true);
      if (mounted && data) setServices(data as ClosureService[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const findServiceId = (platform: string) => {
    return services.find(
      (s) => s.platform.toLowerCase() === platform.toLowerCase(),
    )?.id;
  };

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
              <Shield className="h-3.5 w-3.5" /> Çmim fiks 249.99€
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              🛡️ Mbyllja e Profileve dhe Faqeve{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Fake
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Ndihmojmë persona dhe biznese të mbyllin profile dhe faqe false që përdorin emrin, fotografinë ose markën
              e tyre në Instagram, Twitter dhe TikTok.
            </p>
            <div className="mx-auto mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Mbyllja zgjat nga <span className="font-semibold text-primary">2 deri në 72 orë</span>.
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
                <RotateCcw className="h-4 w-4 text-primary" />
                Nuk realizohet? <span className="font-semibold text-primary">Kthim parash 100%</span>.
              </div>
            </div>
            <div className="mt-10">
              <a
                href="#cmimet"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Shield className="h-4 w-4" /> Shiko çmimet
              </a>
            </div>
          </div>
        </section>

        {/* Çmimet */}
        <section id="cmimet" className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Çmimi</h2>
            <p className="mt-3 text-muted-foreground">
              Një çmim i vetëm fiks për të gjitha platformat.
            </p>
            <div className="mx-auto mt-6 inline-flex items-baseline gap-1">
              <span className="text-5xl font-bold text-primary">249.99€</span>
              <span className="text-muted-foreground">/ profil</span>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {platforms.map((p) => {
              const Icon = platformIcon[p.platform] ?? Shield;
              const serviceId = findServiceId(p.platform);
              const content = (
                <>
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-primary" /> {p.platform}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{p.price}</span>
                    {serviceId && <Shield className="h-4 w-4 text-primary" />}
                  </span>
                </>
              );
              return serviceId ? (
                <Link
                  key={p.platform}
                  to="/order/$serviceId"
                  params={{ serviceId }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={p.platform}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {/* Garanci kthimi parash */}
          <div className="mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Garanci: kthim parash 100%</p>
              <p className="text-sm text-muted-foreground">
                Nëse mbyllja nuk realizohet, paratë ju kthehen plotësisht — 100%.
              </p>
            </div>
          </div>
        </section>


        {/* Përfshihen */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Çfarë përfshihet</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {included.map(({ icon: Icon, text }) => (
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
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Gati për të mbyllur profilin fake?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Na kontakto vetëm në WhatsApp dhe nis procesin sot. Të asistojmë deri në mbylljen përfundimtare.
            </p>
            <a
              href="https://wa.me/491634371067"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
            >
              <MessageCircle className="h-4 w-4" /> +49 163 4371067
            </a>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Shield className="h-4 w-4" /> Nis procesin
              </Link>
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
          <p className="text-sm text-muted-foreground">© 2026 shtofollow.com. Të gjitha të drejtat të rezervuara.</p>
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
