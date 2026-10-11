import { supabase } from "@/integrations/supabase/client";

const ICE: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun.relay.metered.ca:80"] },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
      "turns:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export type RtcSession = {
  pc: RTCPeerConnection;
  stream: MediaStream;
  setMuted: (m: boolean) => void;
  close: () => void;
};

/**
 * Audio-only WebRTC session. Signaling goes through support_call_signaling rows (RLS-protected).
 * The caller (customer) sends the offer once the admin has accepted.
 */
export async function startRtc(opts: {
  callId: string;
  selfId: string;
  isCaller: boolean;
  audioEl: HTMLAudioElement;
  onState?: (s: RTCPeerConnectionState) => void;
}): Promise<RtcSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const pc = new RTCPeerConnection({ iceServers: ICE });
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  pc.ontrack = (e) => {
    opts.audioEl.srcObject = e.streams[0] ?? new MediaStream([e.track]);
    opts.audioEl.muted = false;
    opts.audioEl.volume = 1;
    opts.audioEl.play().catch(() => {});
  };
  pc.onconnectionstatechange = () => opts.onState?.(pc.connectionState);

  const send = (kind: string, payload: unknown) =>
    supabase.from("support_call_signaling").insert({
      call_id: opts.callId,
      sender_id: opts.selfId,
      kind,
      payload: payload as never,
    });

  pc.onicecandidate = (e) => {
    if (e.candidate) send("ice", e.candidate.toJSON());
  };

  const pending: RTCIceCandidateInit[] = [];
  const seen = new Set<string>();
  let chain = Promise.resolve();
  const handle = (row: { id: string; sender_id: string; kind: string; payload: any }) => {
    chain = chain.then(() => processRow(row)).catch((e) => console.warn("rtc", e));
    return chain;
  };
  const processRow = async (row: { id: string; sender_id: string; kind: string; payload: any }) => {
    if (row.sender_id === opts.selfId || seen.has(row.id)) return;
    seen.add(row.id);
    if (row.kind === "offer" && !opts.isCaller) {
      await pc.setRemoteDescription(row.payload);
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      await send("answer", { type: ans.type, sdp: ans.sdp });
    } else if (row.kind === "answer" && opts.isCaller) {
      await pc.setRemoteDescription(row.payload);
    } else if (row.kind === "ice") {
      if (pc.remoteDescription) await pc.addIceCandidate(row.payload).catch(() => {});
      else pending.push(row.payload);
      return;
    }
    while (pending.length && pc.remoteDescription) await pc.addIceCandidate(pending.shift()!).catch(() => {});
  };

  const channel = supabase
    .channel(`sig-${opts.callId}-${opts.selfId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "support_call_signaling", filter: `call_id=eq.${opts.callId}` },
      (p) => handle(p.new as any),
    );
  await new Promise<void>((res) => channel.subscribe((s) => s === "SUBSCRIBED" && res()));

  // Catch up on anything sent before subscription.
  const { data: existing } = await supabase
    .from("support_call_signaling")
    .select("id, sender_id, kind, payload")
    .eq("call_id", opts.callId)
    .order("created_at");
  for (const r of existing ?? []) await handle(r);

  if (opts.isCaller) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await send("offer", { type: offer.type, sdp: offer.sdp });
  }

  return {
    pc,
    stream,
    setMuted: (m) => stream.getAudioTracks().forEach((t) => (t.enabled = !m)),
    close: () => {
      stream.getTracks().forEach((t) => t.stop());
      pc.close();
      supabase.removeChannel(channel);
      opts.audioEl.srcObject = null;
    },
  };
}

let ringCtx: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
export function startRing() {
  stopRing();
  try {
    ringCtx = new AudioContext();
    const beep = () => {
      if (!ringCtx) return;
      const o = ringCtx.createOscillator();
      const g = ringCtx.createGain();
      o.frequency.value = 440;
      g.gain.value = 0.08;
      o.connect(g).connect(ringCtx.destination);
      o.start();
      o.stop(ringCtx.currentTime + 0.6);
    };
    beep();
    ringTimer = setInterval(beep, 1800);
  } catch {}
}
export function stopRing() {
  if (ringTimer) clearInterval(ringTimer);
  ringTimer = null;
  ringCtx?.close().catch(() => {});
  ringCtx = null;
}
export function ping() {
  try {
    const c = new AudioContext();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.15);
    setTimeout(() => c.close(), 400);
  } catch {}
}
export function notify(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
    new Notification(title, { body });
  }
}
export const fmtDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
