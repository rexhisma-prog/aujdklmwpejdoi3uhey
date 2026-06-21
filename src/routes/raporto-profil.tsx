import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Shield,
  Instagram,
  Twitter,
  Music2,
  Facebook,
  ArrowLeft,
  FileText,
  Copy,
  Check,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/raporto-profil")({
  head: () => ({
    meta: [
      { title: "Tool për Raportim Profilesh Fake — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Gjenero raportime profesionale në gjuhën angleze për profile fake ose që shkelin politikat e platformave (Instagram, Facebook, Twitter, TikTok). Çmim 49.99€.",
      },
      { property: "og:title", content: "Tool për Raportim Profilesh Fake — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Krijo raportime të gatshme në anglisht për profile që shkelin politikat e Metas dhe platformave të tjera. Çmim 49.99€.",
      },
      { property: "og:url", content: "https://shtofollow.com/raporto-profil" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/raporto-profil" }],
  }),
  component: RaportoProfil,
});

type ReportService = { id: string; service_type: string };

const platformOptions = [
  { value: "Instagram", icon: Instagram },
  { value: "Facebook", icon: Facebook },
  { value: "Twitter", icon: Twitter },
  { value: "TikTok", icon: Music2 },
] as const;

const reasonOptions: { id: string; label: string; clause: string }[] = [
  {
    id: "impersonation",
    label: "Imitim identiteti / profil fake",
    clause:
      "impersonating another person or brand by using their name, photographs, or identity without authorization",
  },
  {
    id: "scam",
    label: "Mashtrim / praktika mashtruese",
    clause:
      "participating in suspicious or deceptive practices that could mislead, defraud, or financially harm other users",
  },
  {
    id: "illegal",
    label: "Përmbajtje e paligjshme / e ndaluar",
    clause:
      "sharing or promoting unlawful, restricted, or otherwise prohibited content",
  },
  {
    id: "harassment",
    label: "Ngacmim / bullizëm",
    clause:
      "engaging in harassment, bullying, or targeted abuse directed at other users",
  },
  {
    id: "hate",
    label: "Gjuhë urrejtjeje",
    clause:
      "publishing hate speech or content that targets individuals or groups based on protected characteristics",
  },
  {
    id: "spam",
    label: "Spam / sjellje e rreme",
    clause:
      "spreading spam, fake engagement, or coordinated inauthentic behaviour",
  },
  {
    id: "privacy",
    label: "Shkelje e privatësisë",
    clause:
      "sharing private or personal information of others without their consent",
  },
];

function buildReport(platform: string, username: string, clauses: string[]): string {
  const p = platform || "the platform";
  const handle = username ? `, ${username},` : "";
  let behaviour = "";
  if (clauses.length === 1) {
    behaviour = clauses[0];
  } else if (clauses.length === 2) {
    behaviour = `${clauses[0]} and ${clauses[1]}`;
  } else if (clauses.length > 2) {
    behaviour = `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;
  }
  const behaviourSentence = behaviour
    ? `After observing the account’s activity, I believe it may be engaging in behaviour such as ${behaviour}. `
    : "";

  return `Dear ${p} Trust & Safety Team,

I am writing to formally report a ${p} account that appears to be involved in activities that may violate your Community Guidelines and potentially constitute illegal behaviour. The account in question${handle} has recently come to my attention due to content and actions that raise serious concerns regarding safety, legality, and appropriate platform use. ${behaviourSentence}These activities create a concerning environment for users and may pose risks to individuals who interact with or are exposed to the account’s content.

I am reporting this matter in good faith, solely out of concern for the safety and integrity of the ${p} community, and I respectfully request that the account be thoroughly reviewed by your moderation or safety team. If any further details, evidence, or clarification are required, I am willing to provide additional information to assist in your investigation.

Thank you for your attention to this serious matter, and I trust that appropriate action will be taken if any violations are confirmed.

Sincerely,
A concerned member of the ${p} community`;
}

function RaportoProfil() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("Instagram");
  const [username, setUsername] = useState("");
  const [selected, setSelected] = useState<string[]>(["impersonation"]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, service_type")
        .eq("service_type", "report_tool")
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      if (mounted && data) setServiceId((data as ReportService).id);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleReason = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const report = useMemo(() => {
    const clauses = reasonOptions.filter((r) => selected.includes(r.id)).map((r) => r.clause);
    return buildReport(platform, username.trim(), clauses);
  }, [platform, username, selected]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
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
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" /> Çmim 49.99€
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Tool për Raportim{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Profilesh
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Gjenero raportime profesionale në gjuhën angleze për profile fake ose që shkelin politikat e platformave.
              Përdoret vetëm për qëllime të mira — siguri dhe integritet të komunitetit.
            </p>
          </div>
        </section>

        {/* Generator */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            {/* Platform */}
            <label className="mb-2 block text-sm font-medium">Platforma</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {platformOptions.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlatform(value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    platform === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {value}
                </button>
              ))}
            </div>

            {/* Username */}
            <label htmlFor="username" className="mb-2 mt-6 block text-sm font-medium">
              Username / link i profilit (opsionale)
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username ose URL"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />

            {/* Reasons */}
            <label className="mb-2 mt-6 block text-sm font-medium">Arsyet e raportimit</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {reasonOptions.map((r) => {
                const active = selected.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleReason(r.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Output */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Raporti (English)</label>
                <button
                  type="button"
                  onClick={copyReport}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopjuar" : "Kopjo"}
                </button>
              </div>
              <textarea
                readOnly
                value={report}
                rows={16}
                className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none"
              />
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              Raporto vetëm profile që realisht shkelin politikat. Përdorimi i rremë i raportimit shkel rregullat e platformave.
            </div>
          </div>

          {/* Order */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-6 text-center">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-4xl font-bold text-primary">49.99€</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Shërbim i plotë raportimi me asistencë profesionale deri në shqyrtimin e profilit.
            </p>
            {serviceId ? (
              <Link
                to="/order/$serviceId"
                params={{ serviceId }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Shield className="h-4 w-4" /> Porosit shërbimin
              </Link>
            ) : (
              <a
                href="https://wa.me/491634371067"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> Na kontakto
              </a>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-10 shadow-[var(--shadow-glow)]">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Ke nevojë për ndihmë me raportimin?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Na kontakto në WhatsApp dhe të asistojmë gjatë gjithë procesit.
            </p>
            <a
              href="https://wa.me/491634371067"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
            >
              <MessageCircle className="h-4 w-4" /> +49 163 4371067
            </a>
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
