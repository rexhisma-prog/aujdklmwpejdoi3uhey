import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Shield,
  Instagram,
  Facebook,
  Music2,
  Check,
  ArrowLeft,
  FileSearch,
  FileText,
  Eye,
  Headphones,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/mbyll-profile-fake")({
  head: () => ({
    meta: [
      { title: "Mbyllja e Profileve dhe Faqeve Fake — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Mbyllim profile dhe faqe false në Instagram, Facebook dhe TikTok që përdorin emrin, fotografinë ose markën tuaj. Nga 99.99€.",
      },
      { property: "og:title", content: "Mbyllja e Profileve dhe Faqeve Fake — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Ndihmojmë persona dhe biznese të mbyllin profile dhe faqe false në Instagram, Facebook dhe TikTok. Nga 99.99€.",
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
            "Mbyllim profile dhe faqe false në Instagram, Facebook dhe TikTok që përdorin emrin, fotografinë ose markën tuaj.",
          provider: { "@type": "Organization", name: "ShtoFollow.com", url: "https://shtofollow.com" },
          areaServed: "AL",
          offers: { "@type": "Offer", priceCurrency: "EUR", price: "99.99" },
        }),
      },
    ],
  }),
  component: MbyllProfileFake,
});

const platformIcon: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
  TikTok: Music2,
};

const tiers = [
  {
    title: "Deri në 2.000 ndjekës",
    desc: "Për profile dhe faqe të vogla që përdorin identitetin tuaj.",
    keyword: "pak",
    prices: [
      { platform: "Instagram", price: "99.99€" },
      { platform: "Facebook", price: "99.99€" },
      { platform: "TikTok", price: "99.99€" },
    ],
  },
  {
    title: "2.001 – 50.000 ndjekës",
    desc: "Për profile dhe faqe me ndjekës të shumtë.",
    highlight: true,
    keyword: "shumë",
    prices: [
      { platform: "Instagram", price: "249.99€" },
      { platform: "Facebook", price: "199.99€" },
      { platform: "TikTok", price: "129.99€" },
    ],
  },
  {
    title: "50.001 – 250.000 ndjekës",
    desc: "Për profile dhe faqe të mëdha me audiencë të madhe.",
    keyword: "vip",
    prices: [
      { platform: "Instagram", price: "362.49€" },
    ],
  },
];

type ClosureService = { id: string; platform: string; name: string };

const included = [
  { icon: FileSearch, text: "Analiza e rastit" },
  { icon: FileText, text: "Raportim profesional" },
  { icon: Eye, text: "Ndjekja e procesit" },
  { icon: Headphones, text: "Asistencë deri në përfundim" },
];

function MbyllProfileFake() {
  const [services, setServices] = useState<ClosureService[]>([]);

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

  const findServiceId = (platform: string, keyword: string) => {
    return services.find(
      (s) =>
        s.platform.toLowerCase() === platform.toLowerCase() &&
        s.name.toLowerCase().includes(keyword),
    )?.id;
  };

  return (

    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Faqja kryesore
          </Link>
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Shto</span>
            <span className="text-primary">Follow</span>
            <span className="text-muted-foreground">.com</span>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" /> Nga 99.99€
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
              e tyre në Instagram, Facebook dhe TikTok.
            </p>
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Mbyllja mund të zgjasë nga <span className="font-semibold text-primary">2 deri në 72 orë</span>.
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
        <section id="cmimet" className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Çmimet</h2>
            <p className="mt-3 text-muted-foreground">Çmime fikse sipas madhësisë së profilit ose faqes.</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.title}
                className={`rounded-3xl border bg-card p-7 ${
                  tier.highlight
                    ? "border-primary/40 shadow-[var(--shadow-glow)]"
                    : "border-border shadow-[var(--shadow-elegant)]"
                }`}
              >
                <h3 className="text-xl font-bold">{tier.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tier.prices.map((p) => {
                    const Icon = platformIcon[p.platform] ?? Shield;
                    const serviceId = findServiceId(p.platform, tier.keyword);
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
                      <li key={p.platform}>
                        <Link
                          to="/order/$serviceId"
                          params={{ serviceId }}
                          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          {content}
                        </Link>
                      </li>
                    ) : (
                      <li
                        key={p.platform}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                      >
                        {content}
                      </li>
                    );
                  })}
                </ul>

              </div>
            ))}
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
              Na kontakto dhe nis procesin sot. Të asistojmë deri në mbylljen përfundimtare.
            </p>
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
