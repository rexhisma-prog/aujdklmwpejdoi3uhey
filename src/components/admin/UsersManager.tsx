import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteUserAccount } from "@/lib/admin.functions";

type ProfileRow = {
  user_id: string;
  email: string | null;
  balance_eur: number;
  created_at: string;
};

export function UsersManager() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const removeUser = useServerFn(deleteUserAccount);

  const load = () => {
    supabase
      .from("profiles")
      .select("user_id, email, balance_eur, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as ProfileRow[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const saveBalance = async (userId: string) => {
    const raw = edits[userId];
    const value = Number(raw);
    if (raw === undefined || raw === "" || Number.isNaN(value) || value < 0) {
      alert("Vendos një shumë të vlefshme (≥ 0).");
      return;
    }
    setSavingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ balance_eur: value })
      .eq("user_id", userId);
    setSavingId(null);
    if (error) {
      alert("Gabim gjatë ruajtjes: " + error.message);
      return;
    }
    setEdits((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    load();
  };

  const deleteUser = async (userId: string, email: string | null) => {
    if (!confirm(`A je i sigurt që do të fshish përdoruesin ${email ?? userId}? Ky veprim është i pakthyeshëm.`)) return;
    setDeletingId(userId);
    try {
      await removeUser({ data: { userId } });
      setRows((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (e) {
      alert("Gabim gjatë fshirjes: " + (e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = rows.filter((r) =>
    (r.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-semibold">Të gjithë përdoruesit</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko..."
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka përdorues.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Wallet</th>
                <th className="px-6 py-3">Ndrysho balancin</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-6 py-4 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{Number(u.balance_eur).toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={edits[u.user_id] ?? ""}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [u.user_id]: e.target.value }))}
                        placeholder={Number(u.balance_eur).toFixed(2)}
                        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => saveBalance(u.user_id)}
                        disabled={savingId === u.user_id || edits[u.user_id] === undefined}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {savingId === u.user_id ? "..." : "Ruaj"}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteUser(u.user_id, u.email)}
                      disabled={deletingId === u.user_id}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:border-destructive disabled:opacity-50"
                    >
                      {deletingId === u.user_id ? "..." : "Fshi"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
