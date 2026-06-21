import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Shield,
  ArrowLeft,
  FileText,
  FileSearch,
  Languages,
  ExternalLink,
  ListChecks,
  Headphones,
  MessageCircle,
  Info,
  Check,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/raporto-profil")({
  head: () => ({
    meta: [
      { title: "Asistencë për Përpilim Raportimi — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Asistencë profesionale për përpilimin e raportimit në anglisht për mbylljen e profileve fake ose që shkelin politikat e platformave, dhe udhëzime për hapat zyrtarë. Çmim 29.99€.",
      },
      { property: "og:title", content: "Asistencë për Përpilim Raportimi — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Të ndihmojmë të përpilosh raportimin për mbylljen e profileve dhe të të tregojmë hapat zyrtarë. Çmim 29.99€.",
      },
      { property: "og:url", content: "https://shtofollow.com/raporto-profil" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/raporto-profil" }],
  }),
  component: RaportoProfil,
});

type ReportService = { id: string };

const included = [
  { icon: FileSearch, text: "Analiza e rastit dhe e arsyeve të raportimit" },
  { icon: FileText, text: "Përpilim i raportit profesional sipas rastit tuaj" },
  { icon: Languages, text: "Raporti gatuhet në gjuhën angleze" },
  { icon: ListChecks, text: "Udhëzime hap-pas-hapi për procesin zyrtar" },
  { icon: ExternalLink, text: "Adresimi te linqet zyrtare të platformave" },
  { icon: Headphones, text: "Asistencë deri në dërgimin e raportit" },
];

const steps = [
  "Na tregon profilin dhe arsyet pse mendon se shkel politikat.",
  "Ne përpilojmë raportin e plotë në anglisht sipas rastit tënd.",
  "Të tregojmë hapat zyrtarë dhe linkun e saktë për raportim.",
  "Të asistojmë gjatë dërgimit te platforma zyrtare.",
];

function RaportoProfil() {
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id")
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
              <Shield className="h-3.5 w-3.5" /> Çmim 29.99€
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Asistencë për Përpilim{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Raportimi
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Të ndihmojmë të përpilosh raportimin për mbylljen e profileve fake ose që shkelin politikat e platformave,
              dhe të të tregojmë hapat zyrtarë. Përdoret vetëm për qëllime të mira.
            </p>
            <div className="mt-10">
              <a
                href="#porosit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                <Shield className="h-4 w-4" /> Nis asistencën
              </a>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-3xl px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-foreground">E rëndësishme:</span> Ky shërbim është{" "}
              <span className="font-semibold text-foreground">vetëm asistencë</span> për përpilimin e raportit dhe për të
              të treguar hapat zyrtarë. Vendimi përfundimtar për mbylljen e profilit merret nga platforma zyrtare.
            </p>
          </div>
        </section>

        {/* Çfarë përfshihet */}
        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Çfarë përfshihet</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {included.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Si funksionon */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Si funksionon</h2>
            </div>
            <ol className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <li key={s} className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Porosit */}
        <section id="porosit" className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center shadow-[var(--shadow-glow)]">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <div className="mx-auto mt-4 inline-flex items-baseline gap-1">
              <span className="text-5xl font-bold text-primary">29.99€</span>
            </div>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Asistencë e plotë për përpilimin e raportit dhe udhëzimin e hapave zyrtarë.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm">
              {["Raport profesional në anglisht", "Hapat zyrtarë + linqet e platformës", "Asistencë deri në dërgim"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {serviceId ? (
                <Link
                  to="/order/$serviceId"
                  params={{ serviceId }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
                >
                  <Shield className="h-4 w-4" /> Porosit asistencën
                </Link>
              ) : null}
              <a
                href="https://wa.me/491634371067"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                <MessageCircle className="h-4 w-4" /> +49 163 4371067
              </a>
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
