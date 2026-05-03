import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Hyr — shtofollow.com" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // check role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);
    const isAdmin = roles?.some((r) => r.role === "super_admin");
    navigate({ to: isAdmin ? "/admin" : "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Kthehu</Link>
        <h1 className="mt-4 text-3xl font-bold">Hyr në llogari</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mirë se erdhe përsëri në shtofollow.com</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="ti@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fjalëkalimi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Duke hyrë..." : "Hyr"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nuk ke llogari?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">Regjistrohu</Link>
        </p>
      </div>
    </div>
  );
}
