import { uniqueChannel, sharedChannel } from "@/lib/rt";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Minus, Send, Phone, PhoneOff, Mic, MicOff, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startRtc, startRing, stopRing, ping, notify, fmtDur, type RtcSession } from "@/lib/support-rtc";

type Conv = { id: string; category: string; order_id: string | null; status: string; last_message: string | null; last_message_at: string; user_unread: number };
type Msg = { id: string; conversation_id: string; sender_id: string; is_admin: boolean; body: string; read_at: string | null; created_at: string };

const CATEGORIES = [
  ["general", "Pyetje e përgjithshme"],
  ["order", "Problem me porosinë"],
  ["payment", "Problem me pagesën"],
  ["balance", "Balanca nuk është shtuar"],
  ["rejected", "Pagesa është refuzuar"],
  ["confirm", "Konfirmimi i transaksionit"],
  ["other", "Problem tjetër"],
] as const;
export const categoryLabel = (c: string) => CATEGORIES.find((x) => x[0] === c)?.[1] ?? c;

export function SupportWidget() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? null);
      if (u) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        setIsAdmin(!!r?.some((x) => x.role === "super_admin"));
      } else setIsAdmin(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!userId || isAdmin) return null;
  return <Widget key={userId} userId={userId} email={email} />;
}

function Widget({ userId, email }: { userId: string; email: string | null }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "new" | "chat" | "call">("list");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [online, setOnline] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  const loadConvs = async () => {
    const { data } = await supabase.from("support_conversations").select("*").eq("user_id", userId).order("last_message_at", { ascending: false });
    setConvs((data as Conv[]) ?? []);
  };

  useEffect(() => {
    loadConvs();
    const ch = uniqueChannel(`sup-user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations", filter: `user_id=eq.${userId}` }, () => loadConvs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (p) => {
        const m = p.new as Msg;
        if (m.is_admin) {
          ping();
          notify("ShtoFollow Support", m.body);
        }
      })
      .subscribe();
    // Admins already hold the shared presence channel (AdminCallManager); just read it.
    const existing = supabase.getChannels().find((c) => c.topic === "realtime:support-presence");
    let pres: ReturnType<typeof supabase.channel> | null = null;
    let iv: ReturnType<typeof setInterval> | null = null;
    if (existing) {
      setOnline(true);
    } else {
      const p = supabase.channel("support-presence");
      pres = p;
      p.on("presence", { event: "sync" }, () => setOnline(Object.keys(p.presenceState()).length > 0)).subscribe();
    }
    return () => {
      if (iv) clearInterval(iv);
      supabase.removeChannel(ch);
      if (pres) supabase.removeChannel(pres);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = convs.reduce((a, c) => a + c.user_unread, 0);

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
          }}
          aria-label="Hap Live Support"
          className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{unread}</span>
          )}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-4 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[85vh] sm:w-[380px] sm:rounded-3xl sm:border sm:border-border sm:shadow-[var(--shadow-elegant)]">
          <div className="flex items-center gap-3 border-b border-border bg-primary/10 px-4 py-3">
            {view !== "list" && (
              <button onClick={() => setView("list")} aria-label="Mbrapa" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
            )}
            <div className="flex-1">
              <p className="font-semibold">ShtoFollow Support</p>
              <p className="text-xs text-muted-foreground">{online ? "🟢 Online – përgjigjemi shpejt" : "⚪ Offline – lë mesazh"}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Minimizo" className="text-muted-foreground hover:text-foreground"><Minus className="h-5 w-5" /></button>
            <button onClick={() => { setOpen(false); setView("list"); }} aria-label="Mbyll" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          {view === "list" && (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setView("new")} className="rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">💬 Bisedë e re</button>
                <button onClick={() => setView("call")} className="rounded-xl border border-border py-3 text-sm font-semibold hover:border-primary">📞 Thirrje zanore</button>
              </div>
              <p className="pt-2 text-xs font-medium uppercase text-muted-foreground">Bisedat e tua</p>
              {convs.length === 0 && <p className="text-sm text-muted-foreground">Nuk ke biseda ende.</p>}
              {convs.map((c) => (
                <button key={c.id} onClick={() => { setActive(c); setView("chat"); }} className="w-full rounded-xl border border-border p-3 text-left hover:border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{categoryLabel(c.category)}</span>
                    {c.user_unread > 0 && <span className="rounded-full bg-destructive px-2 text-xs text-destructive-foreground">{c.user_unread}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.last_message ?? "—"}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{c.status === "resolved" ? "✅ Zgjidhur" : c.status === "pending" ? "⏳ Në pritje" : "🟢 Hapur"} · {new Date(c.last_message_at).toLocaleString("sq-AL")}</p>
                </button>
              ))}
            </div>
          )}
          {view === "new" && <NewConv userId={userId} email={email} onCreated={(c) => { setActive(c); setView("chat"); loadConvs(); }} />}
          {view === "chat" && active && <Chat conv={active} userId={userId} visible={open} />}
          {view === "call" && <CallPanel userId={userId} email={email} online={online} />}
        </div>
      )}
    </>
  );
}

function NewConv({ userId, email, onCreated }: { userId: string; email: string | null; onCreated: (c: Conv) => void }) {
  const [category, setCategory] = useState<string>("general");
  const [orderId, setOrderId] = useState("");
  const [text, setText] = useState("");
  const [orders, setOrders] = useState<{ id: string; created_at: string; status: string; total_price_eur: number; services: { name: string } | null }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("orders").select("id, created_at, status, total_price_eur, services(name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setOrders((data as any) ?? []));
  }, [userId]);

  const submit = async () => {
    if (!text.trim()) return setErr("Shkruaj problemin.");
    setBusy(true); setErr(null);
    const { data, error } = await supabase.from("support_conversations").insert({ user_id: userId, user_email: email, category, order_id: orderId || null }).select().single();
    if (error || !data) { setBusy(false); return setErr(error?.message ?? "Gabim"); }
    const { error: e2 } = await supabase.from("support_messages").insert({ conversation_id: data.id, sender_id: userId, body: text });
    setBusy(false);
    if (e2) return setErr(e2.message);
    onCreated(data as Conv);
  };

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      <label className="block text-sm font-medium">Kategoria</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
        {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label className="block text-sm font-medium">Porosia (opsionale)</label>
      <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
        <option value="">— Asnjë —</option>
        {orders.map((o) => <option key={o.id} value={o.id}>#{o.id.slice(0, 8)} · {o.services?.name ?? "Shërbim"} · {Number(o.total_price_eur).toFixed(2)}€ · {o.status}</option>)}
      </select>
      <label className="block text-sm font-medium">Përshkruaj problemin</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={5} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button disabled={busy} onClick={submit} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Duke dërguar..." : "Dërgo"}</button>
    </div>
  );
}

export function useTyping(convId: string, selfIsAdmin: boolean) {
  const [otherTyping, setOtherTyping] = useState(false);
  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const ch = sharedChannel(`typing-${convId}`);
    let t: ReturnType<typeof setTimeout>;
    ch.on("broadcast", { event: "typing" }, (p) => {
      if (p.payload.admin === selfIsAdmin) return;
      setOtherTyping(true);
      clearTimeout(t);
      t = setTimeout(() => setOtherTyping(false), 3000);
    }).subscribe();
    chRef.current = ch;
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [convId, selfIsAdmin]);
  const signal = () => {
    if (Date.now() - last.current < 1500) return;
    last.current = Date.now();
    chRef.current?.send({ type: "broadcast", event: "typing", payload: { admin: selfIsAdmin } });
  };
  return { otherTyping, signal };
}

export function MessageList({ msgs, selfIsAdmin, typing }: { msgs: Msg[]; selfIsAdmin: boolean; typing: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { try { end.current?.scrollIntoView({ block: "end" }); } catch { /* ignore */ } }, [msgs.length, typing]);
  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-4">
      {msgs.map((m) => {
        const mine = m.is_admin === selfIsAdmin;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                {new Date(m.created_at).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}
                {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
              </p>
            </div>
          </div>
        );
      })}
      {typing && <p className="text-xs italic text-muted-foreground">Duke shkruar...</p>}
      <div ref={end} />
    </div>
  );
}

export function useMessages(convId: string, selfIsAdmin: boolean, visible: boolean) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const markRead = async () => {
    await supabase.from("support_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", convId).eq("is_admin", !selfIsAdmin).is("read_at", null);
    await supabase.from("support_conversations").update(selfIsAdmin ? { admin_unread: 0 } : { user_unread: 0 }).eq("id", convId);
  };
  useEffect(() => {
    supabase.from("support_messages").select("*").eq("conversation_id", convId).order("created_at").then(({ data }) => setMsgs((data as Msg[]) ?? []));
    const ch = uniqueChannel(`msgs-${convId}-${selfIsAdmin}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages", filter: `conversation_id=eq.${convId}` }, (p) => {
        const m = p.new as Msg;
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m]));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, selfIsAdmin]);
  useEffect(() => {
    if (visible && msgs.some((m) => m.is_admin !== selfIsAdmin && !m.read_at)) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, visible]);
  return msgs;
}

export function Composer({ onSend, onTyping, disabled }: { onSend: (t: string) => Promise<string | null>; onTyping: () => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    const e = await onSend(t);
    if (e) { setErr(e); setText(t); } else setErr(null);
  };
  return (
    <div className="border-t border-border p-3">
      {err && <p className="mb-1 text-xs text-destructive">{err}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          disabled={disabled}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          maxLength={2000}
          placeholder="Shkruaj mesazhin..."
          className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={send} aria-label="Dërgo" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Chat({ conv, userId, visible }: { conv: Conv; userId: string; visible: boolean }) {
  const msgs = useMessages(conv.id, false, visible);
  const { otherTyping, signal } = useTyping(conv.id, false);
  return (
    <>
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {categoryLabel(conv.category)}{conv.order_id && ` · Porosia #${conv.order_id.slice(0, 8)}`}
      </div>
      <MessageList msgs={msgs} selfIsAdmin={false} typing={otherTyping} />
      <Composer
        onTyping={signal}
        onSend={async (body) => {
          const { error } = await supabase.from("support_messages").insert({ conversation_id: conv.id, sender_id: userId, body });
          return error?.message ?? null;
        }}
      />
    </>
  );
}

function CallPanel({ userId, email, online }: { userId: string; email: string | null; online: boolean }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: email ?? "" });
  const [consent, setConsent] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const rtc = useRef<RtcSession | null>(null);

  const cleanup = () => { stopRing(); rtc.current?.close(); rtc.current = null; };
  const live = useRef({ callId: null as string | null, status: "idle" });
  live.current = { callId, status };
  useEffect(() => () => {
    cleanup();
    const { callId: id, status: st } = live.current;
    if (id && (st === "ringing" || st === "accepted")) supabase.from("support_calls").update({ status: st === "ringing" ? "missed" : "ended", ended_at: new Date().toISOString() }).eq("id", id).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!callId) return;
    const ch = uniqueChannel(`call-${callId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_calls", filter: `id=eq.${callId}` }, async (p) => {
        const s = (p.new as { status: string }).status;
        setStatus(s);
        if (s === "accepted" && !rtc.current && audio.current) {
          stopRing();
          try {
            rtc.current = await startRtc({ callId, selfId: userId, isCaller: true, audioEl: audio.current, onState: (st) => { if (st === "failed" || st === "disconnected") hangup(); } });
          } catch { setErr("Mikrofoni nuk u lejua."); hangup(); }
        }
        if (s === "rejected" || s === "ended" || s === "missed") cleanup();
      })
      .subscribe();
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("support_calls").select("status").eq("id", callId).single();
      if (data?.status === "ringing") { await supabase.from("support_calls").update({ status: "missed", ended_at: new Date().toISOString() }).eq("id", callId); }
    }, 45000);
    return () => { clearTimeout(timeout); supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  useEffect(() => {
    if (status !== "accepted") return;
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const hangup = async () => {
    cleanup();
    if (callId) await supabase.from("support_calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", callId);
    setStatus("ended");
  };

  const call = async () => {
    setErr(null);
    if (!form.first_name.trim() || !form.last_name.trim()) return setErr("Emri dhe mbiemri janë të detyrueshëm.");
    if (!form.phone.trim() && !form.email.trim()) return setErr("Shëno telefonin ose email-in.");
    if (!consent) return setErr("Prano njoftimin e privatësisë.");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch { return setErr("Duhet të lejosh mikrofonin për thirrje."); }
    const { data, error } = await supabase.from("support_calls").insert({ user_id: userId, ...form, phone: form.phone || null, email: form.email || null }).select("id").single();
    if (error || !data) return setErr(error?.message ?? "Gabim");
    setStatus("ringing");
    setCallId(data.id);
    startRing();
  };

  const label: Record<string, string> = { ringing: "Duke thirrur agjentin...", accepted: "Në thirrje", rejected: "Agjenti nuk është i disponueshëm. Lë mesazh në chat.", missed: "Thirrja nuk u pranua. Lë mesazh në chat dhe të kontaktojmë.", ended: "Thirrja përfundoi." };

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      <audio ref={audio} autoPlay />
      {status === "idle" ? (
        <>
          {!online && <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">⚪ Agjenti është offline. Mund të provosh, ose lër mesazh në chat.</p>}
          {(["first_name", "last_name", "phone", "email"] as const).map((k) => (
            <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} maxLength={120}
              placeholder={{ first_name: "Emri *", last_name: "Mbiemri *", phone: "Telefoni", email: "Email" }[k]}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          ))}
          <label className="flex gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Pajtohem që të dhënat të përdoren vetëm për këtë kërkesë mbështetjeje (shtofollow.com, REA Marketing SH.P.K).
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button onClick={call} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"><Phone className="h-4 w-4" /> Thirr tani</button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ${status === "ringing" ? "animate-pulse" : ""}`}><Phone className="h-8 w-8 text-primary" /></div>
          <p className="font-semibold">{label[status] ?? status}</p>
          {status === "accepted" && <p className="font-mono text-2xl">{fmtDur(secs)}</p>}
          {err && <p className="text-sm text-destructive">{err}</p>}
          {(status === "ringing" || status === "accepted") ? (
            <div className="flex gap-3">
              {status === "accepted" && (
                <button onClick={() => { rtc.current?.setMuted(!muted); setMuted(!muted); }} className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
              )}
              <button onClick={hangup} className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><PhoneOff className="h-5 w-5" /></button>
            </div>
          ) : (
            <button onClick={() => { setCallId(null); setStatus("idle"); setErr(null); }} className="rounded-xl border border-border px-4 py-2 text-sm">Kthehu</button>
          )}
        </div>
      )}
    </div>
  );
}
