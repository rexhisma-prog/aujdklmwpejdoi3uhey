import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, ShoppingCart, Instagram, Music2, Facebook, Heart, Eye, Users, LogOut, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
};

const platformIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
};

const typeIcon: Record<string, typeof Heart> = {
  likes: Heart,
  views: Eye,
  followers: Users,
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Paneli im — shtofollow.com" }] }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      // If super admin, redirect to admin panel
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (roles?.some((r) => r.role === "super_admin")) {
        navigate({ to: "/admin" });
        return;
      }
      setEmail(user.email ?? "");
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Duke ngarkuar...
      </div>
    );
  }

  const services = [
    { icon: Instagram, name: "Instagram Followers", price: "nga 1.50 €" },
    { icon: Heart, name: "Instagram Likes", price: "nga 0.80 €" },
    { icon: Music2, name: "TikTok Followers", price: "nga 1.20 €" },
    { icon: Eye, name: "TikTok Views", price: "nga 0.50 €" },
    { icon: Facebook, name: "Facebook Followers", price: "nga 2.00 €" },
    { icon: Users, name: "Facebook Page Likes", price: "nga 1.80 €" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Faqja kryesore
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Mirësevjen 👋</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" /> Dil
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Wallet */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Balanca jote
              </div>
              <div className="mt-2 text-4xl font-bold text-primary">0.00 €</div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
              <Plus className="h-4 w-4" /> Mbush balancin
            </button>
          </div>
        </section>

        {/* Services */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Shërbimet tona</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ icon: Icon, name, price }) => (
              <div
                key={name}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{price}</div>
                <button className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Porosit
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Orders */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold">Porositë e mia</h2>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nuk ke porosi ende. Zgjedh një shërbim më lart për të filluar.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
