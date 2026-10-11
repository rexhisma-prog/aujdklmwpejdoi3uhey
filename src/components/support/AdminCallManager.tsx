import { uniqueChannel, sharedChannel } from "@/lib/rt";
import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startRtc, startRing, stopRing, notify, ping, fmtDur, type RtcSession } from "@/lib/support-rtc";

type Call = { id: string; user_id: string; first_name: string; last_name: string; phone: string | null; email: string | null; status: string };

/** Mounted in the admin layout: marks admin online, rings on incoming calls, runs the active call. */
export function AdminCallManager({ adminId }: { adminId: string }) {
  const [incoming, setIncoming] = useState<Call | null>(null);
  const [active, setActive] = useState<Call | null>(null);
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [voice, setVoice] = useState("1");
  useEffect(() => { const v = localStorage.getItem("admin-voice"); if (v) setVoice(v); }, []);
  const pickVoice = (v: string) => { setVoice(v); localStorage.setItem("admin-voice", v); };
  const audio = useRef<HTMLAudioElement>(null);
  const rtc = useRef<RtcSession | null>(null);
  const activeRef = useRef<Call | null>(null);
  activeRef.current = active;

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
    const pres = sharedChannel("support-presence", { config: { presence: { key: adminId } } });
    pres.subscribe((s) => { if (s === "SUBSCRIBED") pres.track({ online_at: new Date().toISOString() }); });

    const ch = uniqueChannel("admin-calls")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_calls" }, (p) => {
        const c = p.new as Call;
        if (activeRef.current) return;
        setIncoming(c);
        startRing();
        notify("📞 Thirrje hyrëse", `${c.first_name} ${c.last_name}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_calls" }, (p) => {
        const c = p.new as Call;
        setIncoming((cur) => (cur?.id === c.id && c.status !== "ringing" ? (stopRing(), null) : cur));
        if (activeRef.current?.id === c.id && (c.status === "ended" || c.status === "missed")) endLocal();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (p) => {
        const m = p.new as { is_admin: boolean; body: string };
        if (!m.is_admin) { ping(); notify("💬 Mesazh i ri", m.body); }
      })
      .subscribe();
    return () => {
      stopRing();
      rtc.current?.close();
      supabase.removeChannel(pres);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  useEffect(() => {
    if (!active) return;
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const endLocal = () => { rtc.current?.close(); rtc.current = null; setActive(null); setMuted(false); };

  const accept = async () => {
    const c = incoming!;
    stopRing();
    setIncoming(null);
    const { error } = await supabase.from("support_calls").update({ status: "accepted", answered_at: new Date().toISOString() }).eq("id", c.id).eq("status", "ringing");
    if (error) return;
    setActive(c);
    try {
      rtc.current = await startRtc({ callId: c.id, selfId: adminId, isCaller: false, pitch: Number(voice), audioEl: audio.current!, onState: (s) => { if (s === "failed") hangup(); } });
    } catch { hangup(); }
  };
  const reject = async () => {
    const c = incoming!;
    stopRing();
    setIncoming(null);
    await supabase.from("support_calls").update({ status: "rejected", ended_at: new Date().toISOString() }).eq("id", c.id);
  };
  const hangup = async () => {
    const c = activeRef.current;
    endLocal();
    if (c) await supabase.from("support_calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", c.id);
  };

  return (
    <>
      <audio ref={audio} autoPlay />
      {(incoming || active) && (
        <div className="fixed bottom-5 right-5 z-[70] w-80 rounded-3xl border border-primary bg-card p-5 shadow-[var(--shadow-glow)] animate-in slide-in-from-bottom-4">
          {incoming && (
            <>
              <p className="text-xs uppercase text-primary">📞 Thirrje hyrëse</p>
              <p className="mt-1 text-lg font-bold">{incoming.first_name} {incoming.last_name}</p>
              <p className="text-xs text-muted-foreground">{incoming.phone ?? ""} {incoming.email ?? ""}</p>
              <label className="mt-3 block text-xs text-muted-foreground">
                Zëri im
                <select value={voice} onChange={(e) => pickVoice(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                  <option value="1">Normal</option>
                  <option value="0.8">I thellë</option>
                  <option value="0.65">Shumë i thellë</option>
                  <option value="1.25">I hollë</option>
                </select>
              </label>
              <div className="mt-4 flex gap-2">
                <button onClick={accept} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"><Phone className="h-4 w-4" /> Prano</button>
                <button onClick={reject} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2 text-sm font-semibold text-destructive-foreground"><PhoneOff className="h-4 w-4" /> Refuzo</button>
              </div>
            </>
          )}
          {active && (
            <>
              <p className="text-xs uppercase text-primary">Në thirrje</p>
              <p className="mt-1 text-lg font-bold">{active.first_name} {active.last_name}</p>
              <p className="font-mono text-2xl">{fmtDur(secs)}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { rtc.current?.setMuted(!muted); setMuted(!muted); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2 text-sm">{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {muted ? "Unmute" : "Mute"}</button>
                <button onClick={hangup} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2 text-sm font-semibold text-destructive-foreground"><PhoneOff className="h-4 w-4" /> Mbyll</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
