import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import igAutoConfirm from "@/assets/ig-auto-confirm.png.asset.json";
import igFollowInvite from "@/assets/ig-follow-invite.jpg.asset.json";

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
};

export const Route = createFileRoute("/order/$serviceId")({
  head: () => ({
    meta: [
      { title: "Porosit shërbimin — shtofollow.com" },
      { name: "description", content: "Porosit shërbime për rrjetet sociale në shtofollow.com — zgjidh sasinë, vendos linkun dhe konfirmo porosinë." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1000);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .maybeSingle();
      if (!mounted) return;
      if (!data) {
        setError("Shërbimi nuk u gjet.");
      } else {
        setService(data as Service);
        setQuantity(Math.max(1000, (data as Service).quantity || 1000));
        setUserId(user.id);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [serviceId, navigate]);

  const total = service ? (Number(service.price_eur) * quantity) / 1000 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !userId) return;
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.from("orders").insert({
      user_id: userId,
      service_id: service.id,
      quantity,
      target_link: link.trim(),
      notes: notes.trim() || null,
      total_price_eur: total,
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

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-muted-foreground">{error ?? "Shërbimi nuk u gjet."}</p>
        <Link to="/dashboard" className="text-primary hover:underline">
          Kthehu te paneli
        </Link>
      </div>
    );
  }

  const isClosure =
    service.service_type === "profile_closure" || service.service_type === "report_tool";
  const isReport = service.service_type === "report_tool";

  const unitLabel =
    service.service_type === "followers"
      ? "followers"
      : service.service_type === "views"
        ? "views"
        : service.service_type === "likes"
          ? "likes"
          : "njësi";

  const linkPlaceholder =
    service.service_type === "followers"
      ? "https://instagram.com/profili_yt"
      : "https://... (linku i postimit, fotos ose videos)";

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
          <div className="w-full rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center shadow-[var(--shadow-glow)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/40">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Faleminderit! 🎉</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Porosia jote u pranua me sukses dhe po procesohet nga ekipi ynë.
            </p>

            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                {isReport ? (
                  <>Raporti përpilohet dhe të dërgohet brenda <span className="font-semibold text-primary">2 deri në 24 orë</span>.</>
                ) : isClosure ? (
                  <>Mbyllja mund të zgjasë nga <span className="font-semibold text-primary">2 deri në 72 orë</span>.</>
                ) : (
                  <>Shërbimi do të kryhet brenda <span className="font-semibold text-primary">2 orësh</span>.</>
                )}
              </p>
            </div>

            <div className="mt-6 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isClosure ? (
                  <span className="font-semibold text-foreground">{service.name}</span>
                ) : (
                  <>Sasia: <span className="font-semibold text-foreground">{quantity.toLocaleString()} {unitLabel}</span></>
                )}
              </p>
              <p>
                Totali: <span className="font-semibold text-primary">{total.toFixed(2)} €</span>
              </p>
            </div>


            <p className="mt-6 text-xs text-muted-foreground">
              Të ftojmë të na kontaktosh në çdo moment nëse ke pyetje. Faleminderit që zgjodhe <span className="font-semibold text-foreground">ShtoFollow.com</span>! 💙
            </p>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/dashboard"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Kthehu te paneli
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setLink("");
                  setNotes("");
                }}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                Bëj një porosi tjetër
              </button>
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
        <h1 className="text-2xl font-bold">Porosit: {service.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isClosure
            ? `Çmim fiks: ${Number(service.price_eur).toFixed(2)} €`
            : `${Number(service.price_eur).toFixed(2)} € për 1,000 ${unitLabel}`}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6"
        >
          {!isClosure && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Sasia ({unitLabel})
              </label>
              <input
                type="number"
                min={service.quantity || 100}
                step={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimumi: {service.quantity}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isReport
                ? "Linku / username i profilit që raportohet"
                : isClosure
                  ? "Linku i profilit / faqes fake"
                  : "Linku i profilit / fotos / videos"}
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder={isClosure ? "https://instagram.com/profili_fake" : linkPlaceholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />

            {isReport ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                ℹ️ Profili nuk ka nevojë të jetë publik. Vetëm nëse dëshiron të raportosh një foto ose video, profili duhet të jetë i hapur (public).
              </p>
            ) : !isClosure ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Profili duhet të jetë i hapur (public), jo privat — përndryshe porosia nuk mund të kryhet.
              </p>
            ) : null}
          </div>


          {service.platform?.toLowerCase() === "instagram" &&
            service.service_type?.toLowerCase().includes("follow") && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                ⚠️ E rëndësishme: çaktivizo "Automatically confirm anyone you follow"
              </p>
              <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">
                Para se të porosisësh followera, sigurohu që ky opsion në Instagram të jetë i <strong>fikur (off)</strong>.
                Shko te: Settings → Follow and invite friends → Following → çaktivizo "Automatically confirm anyone you follow".
              </p>
              <div className="mt-3 space-y-3">
                <img
                  src={igFollowInvite.url}
                  alt="Instagram: Follow and invite friends"
                  className="w-full rounded-lg border border-border"
                  loading="lazy"
                />
                <img
                  src={igAutoConfirm.url}
                  alt="Instagram: çaktivizo Automatically confirm anyone you follow"
                  className="w-full rounded-lg border border-border"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Shënime (opsionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Diçka që duhet ta dimë për këtë porosi..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <span className="text-sm text-muted-foreground">Totali</span>
            <span className="text-xl font-bold text-primary">
              {total.toFixed(2)} €
            </span>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || success}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Dërgo porosinë
          </button>
        </form>
      </main>
    </div>
  );
}
