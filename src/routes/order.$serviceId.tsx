import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
};

export const Route = createFileRoute("/order/$serviceId")({
  head: () => ({ meta: [{ title: "Porosit shërbimin — shtofollow.com" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
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
          {Number(service.price_eur).toFixed(2)} € për 1,000 {unitLabel}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6"
        >
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

          <div>
            <label className="mb-2 block text-sm font-medium">
              Linku i profilit / fotos / videos
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder={linkPlaceholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

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
          {success && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              Porosia u dërgua me sukses! Po të kthejmë te paneli...
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
