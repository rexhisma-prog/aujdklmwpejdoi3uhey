import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Topup = {
  id: string;
  user_id: string;
  amount_eur: number;
  method: string;
  reference: string | null;
  status: string;
  created_at: string;
  email: string | null;
  rejection_reason: string | null;
  profiles?: { email: string | null } | null;
};

const METHOD_LABEL: Record<string, string> = {
  card: "Kartelë",
  bank: "Transfertë bankare",
  manual: "Kërkesë manuale",
};

export function TopupsManager() {
  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionDrafts, setRejectionDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("topup_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data as Topup[]) ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p.email]));
      rows.forEach((r) => {
        r.profiles = { email: r.email ?? map.get(r.user_id) ?? null };
      });
    }
    setTopups(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-topups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topup_requests" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approve = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase.rpc("approve_topup", { _request_id: id });
    if (error) alert(error.message);
    setSavingId(null);
    load();
  };

  const openReasonEditor = (topup: Topup) => {
    setRejectingId(topup.id);
    setRejectionDrafts((prev) => ({
      ...prev,
      [topup.id]: prev[topup.id] ?? topup.rejection_reason ?? "",
    }));
  };

  const saveRejectionReason = async (topup: Topup) => {
    const id = topup.id;
    const reason = rejectionDrafts[id]?.trim();
    if (!reason) {
      alert("Shkruaj arsyen e refuzimit.");
      return;
    }
    setSavingId(id);
    const updatePayload = isActionable(topup.status)
      ? { status: "rejected", rejection_reason: reason }
      : { rejection_reason: reason };
    await supabase.from("topup_requests").update(updatePayload).eq("id", id);
    setSavingId(null);
    setRejectingId(null);
    setRejectionDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    load();
  };

  const removeTopup = async (id: string) => {
    if (!confirm("A je i sigurt që do të fshish këtë transaksion të dështuar?")) return;
    setSavingId(id);
    const { error } = await supabase.from("topup_requests").delete().eq("id", id);
    if (error) alert(error.message);
    setSavingId(null);
    load();
  };

  const isFailed = (s: string) => s === "rejected" || s === "failed";

  const badge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30",
      paid: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
      approved: "bg-green-500/15 text-green-500 ring-green-500/30",
      rejected: "bg-red-500/15 text-red-500 ring-red-500/30",
      failed: "bg-red-500/15 text-red-500 ring-red-500/30",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  const statusLabel = (s: string) =>
    s === "paid" ? "paguar · në pritje" : s;

  const isActionable = (s: string) => s === "pending" || s === "paid";

  const pendingCount = topups.filter((t) => isActionable(t.status)).length;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Kërkesat për mbushje balanci</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {pendingCount} në pritje · përditësohet në kohë reale
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : topups.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka kërkesa ende.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Klienti</th>
                <th className="px-4 py-3">Shuma</th>
                <th className="px-4 py-3">Mënyra</th>
                <th className="px-4 py-3">Referenca</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3">Arsyeja</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {topups.map((t) => (
                <Fragment key={t.id}>
                <tr className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.profiles?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {Number(t.amount_eur).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">{METHOD_LABEL[t.method] ?? t.method}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-xs text-muted-foreground" title={t.reference ?? ""}>
                    {t.reference ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${badge(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] text-xs text-muted-foreground">
                    {t.rejection_reason ? (
                      <span className="text-destructive">{t.rejection_reason}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isActionable(t.status) ? (
                      <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approve(t.id)}
                            disabled={savingId === t.id}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            {savingId === t.id ? "..." : "Aprovo"}
                          </button>
                          {rejectingId !== t.id && (
                            <button
                              onClick={() => openReasonEditor(t)}
                              disabled={savingId === t.id}
                              className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:border-destructive disabled:opacity-50"
                            >
                              Refuzo
                            </button>
                          )}
                        </div>
                    ) : isFailed(t.status) ? (
                      <div className="flex justify-end gap-2">
                        {t.status === "rejected" && (
                          <button
                            onClick={() => openReasonEditor(t)}
                            disabled={savingId === t.id}
                            className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                          >
                            Arsyeja
                          </button>
                        )}
                        <button
                          onClick={() => removeTopup(t.id)}
                          disabled={savingId === t.id}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:border-destructive disabled:opacity-50"
                        >
                          {savingId === t.id ? "..." : "Fshi"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
                {rejectingId === t.id && (
                  <tr className="border-b border-border bg-secondary/20">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="ml-auto flex max-w-xl flex-col items-end gap-2">
                        <textarea
                          value={rejectionDrafts[t.id] ?? ""}
                          onChange={(e) =>
                            setRejectionDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          placeholder="Shkruaj arsyen e refuzimit..."
                          rows={3}
                          autoFocus
                          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveRejectionReason(t)}
                            disabled={savingId === t.id}
                            className="rounded-lg border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            {savingId === t.id ? "..." : "Konfirmo refuzimin"}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionDrafts((prev) => {
                                const next = { ...prev };
                                delete next[t.id];
                                return next;
                              });
                            }}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50"
                          >
                            Anulo
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
