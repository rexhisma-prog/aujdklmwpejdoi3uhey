import { uniqueChannel } from "@/lib/rt";
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
  /** Voice pitch ratio: 1 = normal, <1 deeper, >1 higher. */
  pitch?: number;
  /** Pre-opened microphone stream (captured during a user tap). */
  stream?: MediaStream;
}): Promise<RtcSession> {
  const live = opts.stream?.getAudioTracks().some((t) => t.readyState === "live");
  const stream = live
    ? opts.stream!
    : await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
  stream.getAudioTracks().forEach((t) => (t.enabled = true));
  const pc = new RTCPeerConnection({ iceServers: ICE });
  let voiceCtx: AudioContext | null = null;
  if (opts.pitch && opts.pitch !== 1) {
    const out = pitchShift(stream, opts.pitch);
    voiceCtx = out.ctx;
    out.stream.getTracks().forEach((t) => pc.addTrack(t, out.stream));
  } else {
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }
  pc.ontrack = (e) => {
    opts.audioEl.srcObject = e.streams[0] ?? new MediaStream([e.track]);
    opts.audioEl.muted = false;
    opts.audioEl.volume = 1;
    const tryPlay = () => opts.audioEl.play().catch(() => {
      // Autoplay blocked: play on the next tap anywhere.
      const once = () => { opts.audioEl.play().catch(() => {}); document.removeEventListener("pointerdown", once); };
      document.addEventListener("pointerdown", once);
    });
    void tryPlay();
  };
  pc.onconnectionstatechange = () => opts.onState?.(pc.connectionState);

  // Supabase query builders are lazy: awaiting/then() is what actually sends the request.
  const send = async (kind: string, payload: unknown) => {
    const { error } = await supabase.from("support_call_signaling").insert({
      call_id: opts.callId,
      sender_id: opts.selfId,
      kind,
      payload: payload as never,
    });
    if (error) console.warn("rtc send", kind, error.message);
  };
  // Wait (max 4s) for ICE gathering so the SDP itself carries the network candidates.
  const gathered = () =>
    new Promise<void>((res) => {
      if (pc.iceGatheringState === "complete") return res();
      const t = setTimeout(res, 4000);
      pc.addEventListener("icegatheringstatechange", () => {
        if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); }
      });
    });

  pc.onicecandidate = (e) => {
    if (e.candidate) void send("ice", e.candidate.toJSON());
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
      await gathered();
      const ld = pc.localDescription!;
      await send("answer", { type: ld.type, sdp: ld.sdp });
    } else if (row.kind === "answer" && opts.isCaller) {
      await pc.setRemoteDescription(row.payload);
    } else if (row.kind === "ice") {
      if (pc.remoteDescription) await pc.addIceCandidate(row.payload).catch(() => {});
      else pending.push(row.payload);
      return;
    }
    while (pending.length && pc.remoteDescription) await pc.addIceCandidate(pending.shift()!).catch(() => {});
  };

  const channel = uniqueChannel(`sig-${opts.callId}`)
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
    await gathered();
    const ld = pc.localDescription!;
    await send("offer", { type: ld.type, sdp: ld.sdp });
  }

  return {
    pc,
    stream,
    setMuted: (m) => stream.getAudioTracks().forEach((t) => (t.enabled = !m)),
    close: () => {
      stream.getTracks().forEach((t) => t.stop());
      pc.close();
      voiceCtx?.close().catch(() => {});
      supabase.removeChannel(channel);
      opts.audioEl.srcObject = null;
    },
  };
}

/** Real-time granular pitch shifter (two crossfaded delay taps). Returns the processed stream. */
function pitchShift(input: MediaStream, ratio: number) {
  const ctx = new AudioContext();
  void ctx.resume();
  const src = ctx.createMediaStreamSource(input);
  const proc = ctx.createScriptProcessor(1024, 1, 1);
  const dest = ctx.createMediaStreamDestination();
  const W = Math.round(ctx.sampleRate * 0.05); // 50ms grain
  const N = 16384;
  const buf = new Float32Array(N);
  let w = 0;
  let phase = 0;
  const step = (1 - ratio) / W;
  const read = (delay: number) => {
    let pos = w - delay;
    while (pos < 0) pos += N;
    const i = Math.floor(pos);
    const f = pos - i;
    return buf[i % N] * (1 - f) + buf[(i + 1) % N] * f;
  };
  proc.onaudioprocess = (e) => {
    const inp = e.inputBuffer.getChannelData(0);
    const out = e.outputBuffer.getChannelData(0);
    for (let n = 0; n < inp.length; n++) {
      buf[w] = inp[n];
      phase += step;
      if (phase >= 1) phase -= 1;
      if (phase < 0) phase += 1;
      const p2 = (phase + 0.5) % 1;
      const g1 = Math.sin(Math.PI * phase) ** 2;
      const g2 = Math.sin(Math.PI * p2) ** 2;
      out[n] = read(phase * W + 1) * g1 + read(p2 * W + 1) * g2;
      w = (w + 1) % N;
    }
  };
  src.connect(proc);
  proc.connect(dest);
  // Chrome only runs ScriptProcessor when it reaches the destination; route through a silent gain.
  const silent = ctx.createGain();
  silent.gain.value = 0;
  proc.connect(silent).connect(ctx.destination);
  const resume = () => { if (ctx.state === "suspended") void ctx.resume(); };
  resume();
  setTimeout(resume, 500);
  return { ctx, stream: dest.stream };
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
