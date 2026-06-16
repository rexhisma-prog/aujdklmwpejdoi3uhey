import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Instagram, Wallet, ShoppingCart, ShieldCheck, Heart, Eye, Users, TrendingUp, Music2, ArrowLeft, MoreHorizontal, ThumbsUp, MessageCircle, Share2, UserPlus, Play, Gift } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://shtofollow.com/" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "shtofollow.com",
          url: "https://shtofollow.com",
        }),
      },
    ],
  }),
  component: Index,
});

function useAutoRedirectAfterLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (cancelled) return;
      const isAdmin = roles?.some((r) => r.role === "super_admin");
      navigate({ to: isAdmin ? "/admin" : "/dashboard" });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);
}


function Index() {
  useAutoRedirectAfterLogin();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ReferralPromo />
        <Features />
        <LiveStats />
        <SocialMockups />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

function ReferralPromo() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-10 shadow-[var(--shadow-glow)]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
            <Gift className="h-3.5 w-3.5" /> Programi i Referimeve
          </div>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">
            Fto shokët, fito <span className="text-primary">15% bonus</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Fto shokët e tu në ShtoFollow.com dhe fito 15% bonus pasi ata të bëjnë depozitën e parë të suksesshme. Përdoruesit e referuar kanë minimum 20€ për mbushje.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "15% bonus pas depozitës së parë",
              "Pa kufizim referimesh",
              "Link unik për çdo përdorues",
              "Fitimet shtohen direkt në balanc",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="text-primary">✅</span> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
            >
              <Gift className="h-4 w-4" /> Merr linkun tënd
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-foreground">Shto</span><span className="text-primary">Follow</span><span className="text-muted-foreground">.com</span>
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
    { name: "Diana H.", text: "Wallet-i funksionon perfekt, mbusha 20€ dhe brenda minutash kisha porosinë gati." },
    { name: "Krenar V.", text: "I përdora për Instagram dhe rezultatet erdhen menjëherë. Çmime shumë konkurruese!" },
    { name: "Anila B.", text: "Mbështetja e klientit është e shkëlqyer. Më ndihmuan brenda pak minutash." },
    { name: "Genti P.", text: "Më e mira faqe për followers në Shqipëri. Pa probleme, pa vonesa!" },
    { name: "Elsa R.", text: "Për Facebook page-in tim erdhen 5K followers brenda një dite. Mahnitëse!" },
    { name: "Driton M.", text: "Pagesa me kartë e thjeshtë dhe e sigurt. Do rekomandoj te të gjithë miqtë." },
    { name: "Vesa K.", text: "Likes erdhen menjëherë sapo bëra porosinë. Cilësi e lartë, çmim i ulët." },
  ];
  // duplicate for seamless loop
  const loop = [...items, ...items];
  return (
    <section className="overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Çfarë thonë klientët
        </div>
        <h2 className="mt-4 text-4xl font-bold tracking-tight">Mbi 800 klientë të kënaqur</h2>
      </div>

      <div className="relative mt-12 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex gap-6 animate-marquee">
          {loop.map((t, i) => (
            <div
              key={i}
              className="w-[340px] shrink-0 rounded-3xl border border-border bg-card p-6"
            >
              <p className="text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
              <p className="mt-4 text-sm font-semibold text-primary">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedFollowers({ size = "5xl" }: { size?: "4xl" | "5xl" }) {
  const { value, ref } = useCountUp(10000, 5000);
  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className={`text-${size} font-bold text-primary tabular-nums`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">followers</div>
    </div>
  );
}

function AnimatedStat({ target }: { target: number }) {
  const { value, ref } = useCountUp(target, 5000);
  return <span ref={ref as never} className="tabular-nums">{value.toLocaleString()}</span>;
}

function SocialMockups() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Live
        </div>
        <h2 className="mt-4 text-4xl font-bold tracking-tight">Shiko rritjen në kohë reale</h2>
        <p className="mt-3 text-muted-foreground">Nga 0 në 10,000 followers — shpejt dhe sigurt</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {/* Instagram mockup */}
        <div className="overflow-hidden rounded-3xl border border-border bg-[oklch(0.12_0.015_165)] shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">shtofollow.com</span>
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary via-primary-foreground/20 to-primary p-[2px]">
                <div className="h-full w-full rounded-full bg-card" />
              </div>
              <div className="flex flex-1 justify-around text-center text-xs">
                <div><div className="text-base font-bold">42</div><div className="text-muted-foreground">Posts</div></div>
                <div><div className="text-base font-bold text-primary"><AnimatedStat target={10000} /></div><div className="text-muted-foreground">Followers</div></div>
                <div><div className="text-base font-bold">320</div><div className="text-muted-foreground">Following</div></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="font-semibold">shtofollow.com</div>
              <div className="text-xs text-muted-foreground">📈 Social Media Growth</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground">Follow</button>
              <button className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold">Message</button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-primary/10 to-transparent py-10">
              <AnimatedFollowers />
            </div>
          </div>
        </div>

        {/* Facebook mockup */}
        <div className="overflow-hidden rounded-3xl border border-border bg-[oklch(0.12_0.015_165)] shadow-[var(--shadow-elegant)]">
          <div className="h-20 bg-gradient-to-r from-primary to-primary-glow" />
          <div className="-mt-10 px-5">
            <div className="h-20 w-20 rounded-full border-4 border-card bg-secondary" />
            <div className="mt-3">
              <div className="text-lg font-bold">shtofollow.com.com</div>
              <div className="text-xs text-muted-foreground"><AnimatedStat target={10000} /> followers · 890 likes</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground">
                <ThumbsUp className="h-3.5 w-3.5" /> Like
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-semibold">
                <UserPlus className="h-3.5 w-3.5" /> Follow
              </button>
              <button aria-label="Shpërndaj" className="rounded-lg border border-border px-2.5 py-1.5">
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mx-5 mt-5 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary" />
              <div>
                <div className="text-xs font-semibold">shtofollow.com.com</div>
                <div className="text-[10px] text-muted-foreground">Just now</div>
              </div>
            </div>
            <p className="mt-2 text-xs">📈 Rritje e vazhdueshme — <AnimatedStat target={10000} /> followers!</p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>👍 ❤️ 100</span>
              <span>24 comments</span>
            </div>
            <div className="mt-2 flex gap-3 border-t border-border pt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
              <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
            </div>
          </div>
          <div className="m-5 flex flex-col items-center rounded-2xl bg-gradient-to-b from-primary/10 to-transparent py-8">
            <AnimatedFollowers />
          </div>
        </div>

        {/* TikTok mockup */}
        <div className="overflow-hidden rounded-3xl border border-border bg-[oklch(0.12_0.015_165)] shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">@shtofollow.com</span>
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-center p-5">
            <div className="h-20 w-20 rounded-full bg-secondary" />
            <div className="mt-3 font-semibold">@shtofollow.com</div>
            <div className="mt-4 flex gap-6 text-center text-xs">
              <div><div className="text-base font-bold">128</div><div className="text-muted-foreground">Following</div></div>
              <div><div className="text-base font-bold text-primary"><AnimatedStat target={10000} /></div><div className="text-muted-foreground">Followers</div></div>
              <div><div className="text-base font-bold">45.2K</div><div className="text-muted-foreground">Likes</div></div>
            </div>
            <div className="mt-4 flex w-full gap-2">
              <button className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground">Follow</button>
              <button className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold">Message</button>
            </div>
            <div className="mt-5 flex w-full border-b border-border text-xs">
              <button className="flex-1 border-b-2 border-primary py-2 font-semibold">Videos</button>
              <button className="flex-1 py-2 text-muted-foreground">Liked</button>
            </div>
            <div className="mt-3 grid w-full grid-cols-3 gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex aspect-[3/4] items-center justify-center rounded bg-gradient-to-br from-primary/30 to-secondary">
                  <Play className="h-5 w-5 text-foreground/70" />
                </div>
              ))}
            </div>
            <div className="mt-5 w-full rounded-2xl bg-gradient-to-b from-primary/10 to-transparent py-6 text-center">
              <AnimatedFollowers size="4xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <p className="text-sm text-muted-foreground">© 2026 shtofollow.com. Të gjitha të drejtat të rezervuara.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">Hyr</Link>
          <Link to="/register" className="hover:text-foreground">Regjistrohu</Link>
          <Link to="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
