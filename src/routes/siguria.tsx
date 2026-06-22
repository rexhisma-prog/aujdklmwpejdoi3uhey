import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Mail,
  Cookie,
  Trash2,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/siguria")({
  head: () => ({
    meta: [
      { title: "Siguria & Privatësia — ShtoFollow.com" },
      {
        name: "description",
        content:
          "Si i mbrojmë të dhënat tuaja në ShtoFollow.com: qasja, ruajtja, cookies, fshirja e të dhënave dhe kontakti për çështje sigurie. Faqe e mirëmbajtur nga REA Marketing SH.P.K.",
      },
      { property: "og:title", content: "Siguria & Privatësia — ShtoFollow.com" },
      {
        property: "og:description",
        content:
          "Informacion mbi sigurinë, privatësinë dhe trajtimin e të dhënave në ShtoFollow.com.",
      },
      { property: "og:url", content: "https://shtofollow.com/siguria" },
    ],
    links: [{ rel: "canonical", href: "https://shtofollow.com/siguria" }],
  }),
  component: Siguria,
});

const sections = [
  {
    icon: Lock,
    title: "Qasja & Autentikimi",
    points: [
      "Hyrja bëhet me email dhe fjalëkalim ose me llogari Google.",
      "Çdo përdorues sheh vetëm të dhënat e veta të llogarisë — porositë, bilancin dhe referimet.",
      "Fjalëkalimet ruhen të enkriptuara nga sistemi i autentikimit dhe nuk janë të aksesueshme nga ne.",
    ],
  },
  {
    icon: Database,
    title: "Ruajtja & Mbrojtja e të Dhënave",
    points: [
      "Të dhënat ruhen në një bazë të dhënash të menaxhuar me rregulla qasjeje në nivel rreshti (RLS).",
      "Të dhënat e ndjeshme si adresat IP nuk u shfaqen përdoruesve të tjerë, përfshirë referuesit.",
      "Komunikimi me serverin bëhet përmes lidhjeve të enkriptuara (HTTPS).",
    ],
  },
  {
    icon: Eye,
    title: "Çfarë Mbledhim & Përdorim",
    points: [
      "Mbledhim email-in, të dhënat e porosive dhe informacionin e nevojshëm për shërbimin.",
      "Të dhënat përdoren vetëm për ofrimin e shërbimit dhe komunikim me ju.",
      "Nuk i shesim të dhënat tuaja palëve të treta.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies & Analitika",
    points: [
      "Përdorim cookies thelbësore për funksionimin e llogarisë dhe seancës.",
      "Mund të menaxhoni preferencat e cookies përmes panelit të pëlqimit në faqe.",
    ],
  },
  {
    icon: Trash2,
    title: "Ruajtja & Fshirja e të Dhënave",
    points: [
      "Të dhënat ruhen për aq kohë sa llogaria juaj është aktive.",
      "Mund të kërkoni fshirjen e të dhënave tuaja duke na kontaktuar.",
    ],
  },
  {
    icon: UserCheck,
    title: "Të Drejtat Tuaja",
    points: [
      "Keni të drejtë të shihni, korrigjoni ose kërkoni fshirjen e të dhënave tuaja.",
      "Për çdo kërkesë mbi privatësinë, na kontaktoni dhe do t'ju përgjigjemi sa më shpejt.",
    ],
  },
];

function Siguria() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kthehu mrapa
          </button>
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Shto</span>
            <span className="text-primary">Follow</span>
            <span className="text-muted-foreground">.com</span>
          </Link>
          <span className="w-24" />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Siguria &{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Privatësia
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Kjo faqe mirëmbahet nga REA Marketing SH.P.K. për t'iu përgjigjur pyetjeve të zakonshme
              mbi sigurinë dhe privatësinë e ShtoFollow.com.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h2 className="mb-3 text-lg font-semibold">{s.title}</h2>
                <ul className="space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <div className="mb-3 inline-flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Raporto një Çështje Sigurie</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Nëse zbuloni një dobësi sigurie ose keni shqetësime mbi privatësinë, na kontaktoni dhe
              do ta trajtojmë me prioritet. Ju lutemi përfshini sa më shumë detaje që të mundeni.
            </p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Kjo faqe është përmbajtje e redaktueshme e zotëruar nga aplikacioni dhe përshkruan
              kontrollet aktuale të dukshme në platformë. Ajo nuk është certifikim i pavarur. Siguria
              është përgjegjësi e përbashkët mes platformës, zotëruesit të aplikacionit dhe përdoruesve.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Përdorni shërbimet tona vetëm për qëllime të ligjshme dhe të mira.</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 shtofollow.com — REA Marketing SH.P.K. Të gjitha të drejtat të rezervuara.
          </p>
        </div>
      </footer>
    </div>
  );
}
