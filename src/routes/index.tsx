import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, Wallet, ShoppingCart, ShieldCheck, Heart, Eye, Users, TrendingUp, Music2, ArrowLeft, MoreHorizontal, ThumbsUp, MessageCircle, Share2, UserPlus, Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrowSocial — Rritu në rrjetet sociale" },
      { name: "description", content: "Shto Followers, Pëlqime dhe Shikime në Instagram, TikTok dhe Facebook. Wallet EUR, porosi të shpejta, transaksione të sigurta." },
      { property: "og:title", content: "GrowSocial — Rritu në rrjetet sociale" },
      { property: "og:description", content: "Followers, Likes dhe Views për Instagram, TikTok, Facebook." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <ProfileLookup />
      <Features />
      <LiveStats />
      <SocialMockups />
      <Testimonials />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">Grow</span>Social
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Hyr
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
          >
            Regjistrohu
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live — 800+ klientë të kënaqur
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Rritu në rrjetet{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            sociale
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Shto dhe rriti Followat, Pëlqimet dhe Shikimet në Instagram, TikTok dhe Facebook — shpejt, sigurt dhe me çmime të lira.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
          >
            Hyr ne panel
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/50"
          >
            Mbush balancin
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProfileLookup() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <h2 className="text-center text-2xl font-bold">Shiko profilin tënd</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Shkruaj username-in për të parë profilin para se të porosisësh
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2 text-sm font-medium text-primary ring-1 ring-primary/30">
            <Instagram className="h-4 w-4" /> Instagram
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Music2 className="h-4 w-4" /> TikTok
          </button>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
          <input
            placeholder="Shkruaj username-in tënd..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            Kërko
          </button>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Wallet, title: "Wallet EUR", desc: "Mbush balancin me kartë bankare në mënyrë të sigurt." },
    { icon: ShoppingCart, title: "Porosi të shpejta", desc: "Zgjidh shërbimin dhe porosit menjëherë." },
    { icon: ShieldCheck, title: "I sigurt", desc: "Të gjitha transaksionet janë të sigurta dhe të mbrojtura." },
  ];
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-[var(--shadow-glow)]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </section>
  );
}

function LiveStats() {
  const stats = [
    { icon: Users, value: "12,480", label: "Followers të dërguar sot" },
    { icon: Eye, value: "98,210", label: "Shikime në rrjete sociale" },
    { icon: Heart, value: "4,302", label: "Përdorues aktivë" },
  ];
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Ardit K.", text: "Shumë shpejt erdhen followerat, brenda 2 orësh i kisha të gjithë. Top shërbim!" },
    { name: "Erina M.", text: "Çmim shumë i mirë dhe pagesa me kartë funksionoi pa problem. Rekomandoj!" },
    { name: "Blerim S.", text: "TikTok views erdhen menjëherë. Do e përdor përsëri 100%." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Çfarë thonë klientët
        </div>
        <h2 className="mt-4 text-4xl font-bold tracking-tight">Mbi 800 klientë të kënaqur</h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <div key={t.name} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
            <p className="mt-4 text-sm font-semibold text-primary">— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <p className="text-sm text-muted-foreground">© 2026 GrowSocial. Të gjitha të drejtat të rezervuara.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">Hyr</Link>
          <Link to="/register" className="hover:text-foreground">Regjistrohu</Link>
          <Link to="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
