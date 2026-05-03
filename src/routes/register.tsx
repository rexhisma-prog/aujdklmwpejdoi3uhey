import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Regjistrohu — ShtoFollow" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Kthehu</Link>
        <h1 className="mt-4 text-3xl font-bold">Krijo llogari</h1>
        <p className="mt-1 text-sm text-muted-foreground">Filloj me wallet-in tënd EUR sot</p>
        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Emri</label>
            <input className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Emri yt" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="ti@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Fjalëkalimi</label>
            <input type="password" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="••••••••" />
          </div>
          <button type="button" className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90">
            Regjistrohu
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ke llogari?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Hyr</Link>
        </p>
      </div>
    </div>
  );
}
