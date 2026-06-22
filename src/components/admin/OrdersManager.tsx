import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Order = {
  id: string;
  user_id: string;
  service_id: string;
  quantity: number;
  target_link: string;
  total_price_eur: number;
  status: string;
  notes: string | null;
  followers_before: number | null;
  followers_after: number | null;
  created_at: string;
  services?: { name: string; platform: string; service_type: string } | null;
};

const STATUSES = ["pending", "in_progress", "completed", "cancelled"];

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [beforeDrafts, setBeforeDrafts] = useState<Record<string, string>>({});
  const [afterDrafts, setAfterDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, services(name, platform, service_type)")
      .order("created_at", { ascending: false });
    const list = (data as Order[]) ?? [];
    setOrders(list);

    const userIds = [...new Set(list.map((o) => o.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      (profiles ?? []).forEach((p: { user_id: string; email: string | null }) => {
        if (p.email) map[p.user_id] = p.email;
      });
      setEmails(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    await supabase.from("orders").update({ status }).eq("id", id);
    setSavingId(null);
    load();
  };

  const saveNote = async (id: string) => {
    setSavingId(id);
    const note = (noteDrafts[id] ?? "").trim();
    await supabase.from("orders").update({ notes: note || null }).eq("id", id);
    setSavingId(null);
    setNoteDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    load();
  };

  const saveFollowers = async (id: string, current: { before: number | null; after: number | null }) => {
    setSavingId(id);
    const rawBefore = beforeDrafts[id];
    const rawAfter = afterDrafts[id];
    const before = rawBefore === undefined ? current.before : rawBefore === "" ? null : Number(rawBefore);
    const after = rawAfter === undefined ? current.after : rawAfter === "" ? null : Number(rawAfter);
    await supabase
      .from("orders")
      .update({ followers_before: before, followers_after: after })
      .eq("id", id);
    setSavingId(null);
    setBeforeDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setAfterDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
      in_progress: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
      completed: "bg-green-500/15 text-green-500 ring-green-500/30",
      cancelled: "bg-red-500/15 text-red-500 ring-red-500/30",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Porositë e klientëve</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {orders.length} porosi gjithsej · përditësohet në kohë reale
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : orders.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka porosi ende.
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="space-y-4 p-4 md:hidden">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("sq-AL")}
                </span>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  disabled={savingId === o.id}
                  className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusBadge(o.status)} bg-transparent`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-background text-foreground">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 font-medium">{o.services?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {o.services?.platform} · {o.services?.service_type} · {o.quantity.toLocaleString()} copë
              </div>
              <div className="mt-1 text-xs text-muted-foreground break-all">
                {emails[o.user_id] ?? "—"}
              </div>
              <div className="mt-1 break-all text-xs">
                {/^https?:\/\//i.test(o.target_link) ? (
                  <a href={o.target_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {o.target_link}
                  </a>
                ) : (
                  o.target_link
                )}
              </div>
              <div className="mt-1 font-semibold text-primary">
                {Number(o.total_price_eur).toFixed(2)} €
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Shënime / Arsyeja e refuzimit
                </label>
                <textarea
                  value={noteDrafts[o.id] ?? o.notes ?? ""}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))
                  }
                  placeholder="Arsyeja e refuzimit / shënim..."
                  rows={2}
                  className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => saveNote(o.id)}
                  disabled={savingId === o.id || (noteDrafts[o.id] ?? o.notes ?? "") === (o.notes ?? "")}
                  className="mt-2 w-full rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Ruaj shënimin
                </button>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Ndjekës para → pas
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={beforeDrafts[o.id] ?? (o.followers_before ?? "")}
                    onChange={(e) => setBeforeDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                    placeholder="Para"
                    className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <input
                    type="number"
                    value={afterDrafts[o.id] ?? (o.followers_after ?? "")}
                    onChange={(e) => setAfterDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                    placeholder="Pas"
                    className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  />
                </div>
                <button
                  onClick={() => saveFollowers(o.id, { before: o.followers_before, after: o.followers_after })}
                  disabled={savingId === o.id || (beforeDrafts[o.id] === undefined && afterDrafts[o.id] === undefined)}
                  className="mt-2 w-full rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Ruaj ndjekësit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Klienti</th>
                <th className="px-4 py-3">Shërbimi</th>
                <th className="px-4 py-3">Sasia</th>
                <th className="px-4 py-3">Linku</th>
                <th className="px-4 py-3">Totali</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3">Ndjekës para/pas</th>
                <th className="px-4 py-3">Shënime</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate" title={emails[o.user_id] ?? o.user_id}>
                    {emails[o.user_id] ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.services?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.services?.platform} · {o.services?.service_type}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{o.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {/^https?:\/\//i.test(o.target_link) ? (
                      <a
                        href={o.target_link}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-primary hover:underline"
                        title={o.target_link}
                      >
                        {o.target_link}
                      </a>
                    ) : (
                      <span className="block truncate" title={o.target_link}>
                        {o.target_link}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {Number(o.total_price_eur).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={savingId === o.id}
                      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusBadge(o.status)} bg-transparent`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-background text-foreground">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[170px]">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={beforeDrafts[o.id] ?? (o.followers_before ?? "")}
                        onChange={(e) => setBeforeDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        placeholder="Para"
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <input
                        type="number"
                        value={afterDrafts[o.id] ?? (o.followers_after ?? "")}
                        onChange={(e) => setAfterDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        placeholder="Pas"
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => saveFollowers(o.id, { before: o.followers_before, after: o.followers_after })}
                        disabled={savingId === o.id || (beforeDrafts[o.id] === undefined && afterDrafts[o.id] === undefined)}
                        className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
                      >
                        Ruaj
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="flex items-start gap-2">
                      <textarea
                        value={noteDrafts[o.id] ?? o.notes ?? ""}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))
                        }
                        placeholder="Arsyeja e refuzimit / shënim..."
                        rows={2}
                        className="w-full resize-y rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={() => saveNote(o.id)}
                        disabled={savingId === o.id || (noteDrafts[o.id] ?? o.notes ?? "") === (o.notes ?? "")}
                        className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
                      >
                        Ruaj
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
