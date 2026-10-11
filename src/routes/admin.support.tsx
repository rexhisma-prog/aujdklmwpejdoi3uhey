import { uniqueChannel } from "@/lib/rt";
import { createFileRoute } from "@tanstack/react-router";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, Composer, MessageList, useMessages, useTyping } from "@/components/support/SupportWidget";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Live Support — Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminSupport,
});

type Conv = { id: string; user_id: string; user_email: string | null; category: string; order_id: string | null; status: string; last_message: string | null; last_message_at: string; admin_unread: number; created_at: string };
type Call = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; status: string; created_at: string; answered_at: string | null; ended_at: string | null };

function AdminSupport() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"chat" | "calls">("chat");
  const [online, setOnline] = useState(0);

  const load = async () => {
    const [{ data: c }, { data: k }] = await Promise.all([
      supabase.from("support_conversations").select("*").order("last_message_at", { ascending: false }).limit(300),
      supabase.from("support_calls").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setConvs((c as Conv[]) ?? []);
    setCalls((k as Call[]) ?? []);
  };
  useEffect(() => {
    load();
    const ch = uniqueChannel("admin-support-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_calls" }, load)
      .subscribe();
    const tick = () => {
      const pres = supabase.getChannels().find((c) => c.topic === "realtime:support-presence");
      setOnline(pres ? Math.max(1, Object.keys(pres.presenceState()).length) : 1);
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, []);

  const list = useMemo(() => convs.filter((c) =>
    (filter === "all" || (filter === "unread" ? c.admin_unread > 0 : c.status === filter)) &&
    (!q || `${c.user_email} ${c.last_message} ${c.order_id}`.toLowerCase().includes(q.toLowerCase()))), [convs, q, filter]);
  const current = convs.find((c) => c.id === sel) ?? null;

  const stats = [
    ["Gjithsej", convs.length], ["Hapur", convs.filter((c) => c.status === "open").length],
    ["Në pritje", convs.filter((c) => c.status === "pending").length], ["Zgjidhur", convs.filter((c) => c.status === "resolved").length],
    ["Pa lexuar", convs.reduce((a, c) => a + c.admin_unread, 0)], ["Thirrje sot", calls.filter((c) => new Date(c.created_at).toDateString() === new Date().toDateString()).length],
    ["Të humbura", calls.filter((c) => c.status === "missed").length], ["Agjentë online", online],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="flex gap-2">
        {(["chat", "calls"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg border px-3 py-1.5 text-sm ${tab === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t === "chat" ? "💬 Bisedat" : "📞 Historiku i thirrjeve"}</button>
        ))}
      </div>

      {tab === "calls" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-3">Klienti</th><th>Kontakti</th><th>Statusi</th><th>Kohëzgjatja</th><th>Data</th></tr></thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="text-xs">{c.phone} {c.email}</td>
                  <td>{({ ringing: "🔔 Duke rënë", accepted: "🟢 Aktive", rejected: "⛔ Refuzuar", missed: "❗ E humbur", ended: "✅ Përfunduar" } as Record<string, string>)[c.status] ?? c.status}</td>
                  <td>{c.answered_at && c.ended_at ? `${Math.round((+new Date(c.ended_at) - +new Date(c.answered_at)) / 1000)}s` : "—"}</td>
                  <td className="text-xs">{new Date(c.created_at).toLocaleString("sq-AL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid h-[70vh] gap-4 lg:grid-cols-[320px_1fr_280px]">
          <div className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card ${sel ? "hidden lg:flex" : "flex"}`}>
            <div className="space-y-2 border-b border-border p-3">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="all">Të gjitha</option><option value="unread">Pa lexuar</option><option value="open">Hapur</option><option value="pending">Në pritje</option><option value="resolved">Zgjidhur</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {list.map((c) => (
                <button key={c.id} onClick={() => setSel(c.id)} className={`w-full border-b border-border p-3 text-left hover:bg-muted ${sel === c.id ? "bg-muted" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.user_email ?? c.user_id.slice(0, 8)}</span>
                    {c.admin_unread > 0 && <span className="rounded-full bg-destructive px-2 text-xs text-destructive-foreground">{c.admin_unread}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.last_message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{categoryLabel(c.category)} · {c.status} · {new Date(c.last_message_at).toLocaleString("sq-AL")}</p>
                </button>
              ))}
              {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">Asnjë bisedë.</p>}
            </div>
          </div>
          {current ? <ChatBoundary key={current.id}><AdminChat conv={current} onBack={() => setSel(null)} /></ChatBoundary> : <div className="hidden items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground lg:flex">Zgjidh një bisedë</div>}
          {current && <ChatBoundary key={"p" + current.id}><CustomerPanel conv={current} /></ChatBoundary>}
        </div>
      )}
    </div>
  );
}

function AdminChat({ conv, onBack }: { conv: Conv; onBack: () => void }) {
  const [adminId, setAdminId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null)); }, []);
  const msgs = useMessages(conv.id, true, true);
  const { otherTyping, signal } = useTyping(conv.id, true);
  const setStatus = (status: string) => supabase.from("support_conversations").update({ status }).eq("id", conv.id).then(() => {});
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <button onClick={onBack} className="text-sm text-muted-foreground lg:hidden">←</button>
        <span className="flex-1 truncate font-semibold">{conv.user_email}</span>
        <select value={conv.status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
          <option value="open">Hapur</option><option value="pending">Në pritje</option><option value="resolved">Zgjidhur</option>
        </select>
      </div>
      <MessageList msgs={msgs} selfIsAdmin typing={otherTyping} />
      <Composer onTyping={signal} onSend={async (body) => {
        if (!adminId) return "Duke u ngarkuar...";
        const { error } = await supabase.from("support_messages").insert({ conversation_id: conv.id, sender_id: adminId, is_admin: true, body });
        return error?.message ?? null;
      }} />
    </div>
  );
}

function CustomerPanel({ conv }: { conv: Conv }) {
  const [profile, setProfile] = useState<{ balance_eur: number; created_at: string } | null>(null);
  const [orders, setOrders] = useState<{ id: string; status: string; total_price_eur: number; created_at: string; target_link: string; services: { name: string } | null }[]>([]);
  const [history, setHistory] = useState(0);
  useEffect(() => {
    supabase.from("profiles").select("balance_eur, created_at").eq("user_id", conv.user_id).maybeSingle().then(({ data }) => setProfile(data as any));
    supabase.from("orders").select("id, status, total_price_eur, created_at, target_link, services(name)").eq("user_id", conv.user_id).order("created_at", { ascending: false }).limit(10).then(({ data }) => setOrders((data as any) ?? []));
    supabase.from("support_conversations").select("id", { count: "exact", head: true }).eq("user_id", conv.user_id).then(({ count }) => setHistory(count ?? 0));
  }, [conv.user_id]);
  return (
    <div className="hidden space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 text-sm lg:block">
      <p className="text-xs uppercase text-muted-foreground">Klienti</p>
      <p className="font-semibold break-all">{conv.user_email}</p>
      <p className="text-xs text-muted-foreground break-all">ID: {conv.user_id}</p>
      {profile && <p>Balanca: <b>{Number(profile.balance_eur).toFixed(2)}€</b><br /><span className="text-xs text-muted-foreground">Regjistruar: {new Date(profile.created_at).toLocaleDateString("sq-AL")}</span></p>}
      <p>Kategoria: <b>{categoryLabel(conv.category)}</b></p>
      <p className="text-xs text-muted-foreground">Biseda gjithsej: {history}</p>
      <p className="pt-2 text-xs uppercase text-muted-foreground">Porositë</p>
      {orders.map((o) => (
        <div key={o.id} className={`rounded-xl border p-2 text-xs ${o.id === conv.order_id ? "border-primary bg-primary/10" : "border-border"}`}>
          <p className="font-semibold">#{o.id.slice(0, 8)} · {o.services?.name}</p>
          <p>{Number(o.total_price_eur).toFixed(2)}€ · {o.status}</p>
          <p className="truncate text-muted-foreground">{o.target_link}</p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-xs text-muted-foreground">Asnjë porosi.</p>}
    </div>
  );
}

class ChatBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  stack = "";
  static getDerivedStateFromError(e: unknown) { return { err: e instanceof Error ? e.message : String(e) }; }
  componentDidCatch(e: unknown, info: { componentStack?: string | null }) { console.error("support chat error", e); this.stack = `${e instanceof Error ? e.stack ?? "" : ""}\n${info.componentStack ?? ""}`.slice(0, 1200); this.forceUpdate(); }
  render() {
    if (this.state.err) return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4 text-center text-sm">
        <p className="text-destructive">Gabim: {this.state.err}</p>
        {this.stack && <pre className="max-h-48 w-full overflow-auto whitespace-pre-wrap text-left text-[10px] text-muted-foreground">{this.stack}</pre>}
        <button onClick={() => this.setState({ err: null })} className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">Provo përsëri</button>
      </div>
    );
    return this.props.children;
  }
}
