// STUN observes addresses used by WebRTC, not necessarily the HTTPS route.
// An additional address is evidence of another route, never proof of a leak.
import { normalizePublicIp } from "../lib/public-ip.ts";

export type WebRtcIpObservation = {
  status: "complete" | "timeout" | "unsupported" | "error";
  ips: string[];
  transport: "stun";
  observedAt: string;
  reason?: "api-unavailable" | "connection-failed" | "gathering-failed";
};

export function observeWebRtcIps(timeoutMs = 4500): Promise<WebRtcIpObservation> {
  const result = (status: WebRtcIpObservation["status"], ips: string[] = [], reason?: WebRtcIpObservation["reason"]): WebRtcIpObservation => ({
    status, ips, transport: "stun", observedAt: new Date().toISOString(), ...(reason ? { reason } : {}),
  });
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") return Promise.resolve(result("unsupported", [], "api-unavailable"));
  const duration = Number.isFinite(timeoutMs) ? Math.min(15_000, Math.max(100, timeoutMs)) : 4500;
  return new Promise<WebRtcIpObservation>((resolve) => {
    const found = new Set<string>();
    let connection: RTCPeerConnection;
    try {
      connection = new RTCPeerConnection({ iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }] });
    } catch {
      resolve(result("error", [], "connection-failed"));
      return;
    }
    let settled = false;
    let gatheringError = false;
    const finish = (status: WebRtcIpObservation["status"], reason?: WebRtcIpObservation["reason"]) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      connection.onicecandidate = null;
      connection.onicegatheringstatechange = null;
      connection.onicecandidateerror = null;
      try { connection.close(); } catch { /* A failed close cannot hide captured evidence. */ }
      resolve(result(status, [...found], reason));
    };
    const complete = () => finish(gatheringError && found.size === 0 ? "error" : "complete", gatheringError && found.size === 0 ? "gathering-failed" : undefined);
    const timer = window.setTimeout(() => finish("timeout"), duration);
    connection.onicecandidate = (event) => {
      if (!event.candidate) { complete(); return; }
      const candidate = event.candidate;
      const fields = candidate.candidate.trim().split(/\s+/);
      const type = candidate.type ?? fields[fields.indexOf("typ") + 1];
      // Public host candidates also expose a route; TURN relay addresses are
      // allocated intermediaries and must not be reported as the visitor's IP.
      if (!["host", "srflx", "prflx"].includes(type ?? "")) return;
      const ip = normalizePublicIp(candidate.address ?? fields[4] ?? "");
      if (ip) found.add(ip);
    };
    connection.onicegatheringstatechange = () => {
      if (connection.iceGatheringState === "complete") complete();
    };
    connection.onicecandidateerror = () => { gatheringError = true; };
    try {
      connection.createDataChannel("check");
      connection.createOffer().then((offer) => connection.setLocalDescription(offer)).catch(() => finish("error", "connection-failed"));
    } catch {
      finish("error", "connection-failed");
    }
  });
}

// Compatibility for callers that only consume captured addresses. Callers
// interpreting safety must use observeWebRtcIps() to retain failure semantics.
export async function detectLeakIps(timeoutMs = 4500) {
  return (await observeWebRtcIps(timeoutMs)).ips;
}
