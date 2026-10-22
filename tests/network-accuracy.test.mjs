import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { isPublicIp, normalizePublicIp, publicSocketIp, samePublicIp } from "../src/lib/public-ip.ts";
import { compareNetworkObservation, resolveVisitorIp } from "../src/lib/network-observation.ts";
import { mapIpInfoReport } from "../src/server/ip-purity.ts";
import { observeWebRtcIps } from "../src/detection/leak-ip.ts";

const NOW = 1_800_000_000_000;
const lite = { ip: "8.8.8.8", country: "United States", country_code: "US", asn: "AS15169", as_name: "Google LLC" };
const info = {
  ip: "8.8.8.8", hostname: "dns.google", geo: { city: "Mountain View", region: "California", country: "United States", country_code: "US" },
  as: { asn: "AS15169", name: "Google LLC", type: "hosting" },
  anonymous: { is_vpn: false, is_proxy: false, is_tor: false, is_res_proxy: false }, is_hosting: true, is_mobile: false, is_anonymous: false,
};
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
let moduleNumber = 0;
const freshLookup = async () => (await import(`../src/server/ip-purity.ts?test=${++moduleNumber}`)).lookupAddress;

async function withProvider(run, token = "test-token", tier = "lite") {
  const originalFetch = globalThis.fetch;
  const oldToken = process.env.IPINFO_TOKEN;
  const oldTier = process.env.IPINFO_TIER;
  if (token === null) delete process.env.IPINFO_TOKEN; else process.env.IPINFO_TOKEN = token;
  process.env.IPINFO_TIER = tier;
  try { await run(); } finally {
    globalThis.fetch = originalFetch;
    if (oldToken === undefined) delete process.env.IPINFO_TOKEN; else process.env.IPINFO_TOKEN = oldToken;
    if (oldTier === undefined) delete process.env.IPINFO_TIER; else process.env.IPINFO_TIER = oldTier;
  }
}

test("public literal validation rejects malformed IPv6, reserved ranges and URL syntax", () => {
  for (const ip of ["2001:4860::1:", "2001:4860:1:2:3:4:5:6::", "2001:4860:1:2:3:4:5", "2001:db8::1", "3fff::1", "3fff:fff::1", "2001:2::1", "192.0.0.8", "192.0.0.170", "192.88.99.2", "08.8.8.8", "8.8.8.8:80", "[2606:4700::1111]", "2606:4700::1%en0", "2606:4700::1]/evil"]) assert.equal(isPublicIp(ip), false, ip);
  for (const ip of ["192.0.0.9", "192.0.0.10", "2606:4700::1111", "2001:4860::8888", "3fff:1000::1", "2001:1::1"]) assert.equal(isPublicIp(ip), true, ip);
});

test("equivalent IPv6 addresses are compared canonically", () => {
  assert.equal(normalizePublicIp("2001:4860:0000:0000:0000:0000:0000:ABCD"), "2001:4860::abcd");
  assert.equal(samePublicIp("2001:4860::abcd", "2001:4860:0:0:0:0:0:ABCD"), true);
  assert.equal(samePublicIp("invalid", "invalid"), false);
  assert.equal(samePublicIp("8.8.8.8", "1.1.1.1"), false);
  assert.equal(normalizePublicIp("2001:4860::8.8.8.8"), "2001:4860::808:808");
});

test("IPv4-mapped socket peers are normalized without allowing mapped lookup targets", () => {
  assert.equal(publicSocketIp("::ffff:8.8.8.8"), "8.8.8.8");
  assert.equal(publicSocketIp("::ffff:808:808"), "8.8.8.8");
  assert.equal(publicSocketIp("0:0:0:0:0:ffff:808:808"), "8.8.8.8");
  assert.equal(publicSocketIp("::ffff:808:808:1"), null);
  assert.equal(publicSocketIp("::ffff:127.0.0.1"), null);
  assert.equal(isPublicIp("::ffff:8.8.8.8"), false);
});

test("forwarding headers are ignored by default and cannot override the socket peer", () => {
  const spoof = new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9", "x-real-ip": "4.2.2.2" });
  assert.deepEqual(resolveVisitorIp(spoof, "8.8.8.8"), { ip: "8.8.8.8", source: "socket" });
  assert.equal(resolveVisitorIp(spoof, "127.0.0.1"), null);
  assert.equal(resolveVisitorIp(spoof, undefined), null);
});

test("trusted edge must set exactly one valid address with no fallback chain", () => {
  assert.deepEqual(resolveVisitorIp({ "X-Real-IP": " 8.8.8.8 " }, "127.0.0.1", "x-real-ip"), { ip: "8.8.8.8", source: "trusted-header" });
  assert.equal(resolveVisitorIp({ "x-forwarded-for": "1.1.1.1, 8.8.8.8", "x-real-ip": "9.9.9.9" }, "8.8.4.4", "x-forwarded-for"), null);
  assert.equal(resolveVisitorIp({ "x-real-ip": ["8.8.8.8", "1.1.1.1"] }, "8.8.4.4", "x-real-ip"), null);
  assert.equal(resolveVisitorIp({ "x-real-ip": "127.0.0.1" }, "8.8.4.4", "x-real-ip"), null);
  assert.equal(resolveVisitorIp({}, "8.8.4.4", "x-real-ip"), null);
  assert.equal(resolveVisitorIp({}, "8.8.4.4", "unrecognized"), null);
});

test("deployment examples preserve the single trusted-header boundary and private app port", async () => {
  const [caddy, nginx, env, compose] = await Promise.all(["../deploy/checkcd.caddy", "../deploy/nginx.conf", "../.env.example", "../compose.yaml"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const activeCaddy = caddy.split("\n").filter((line) => !line.trimStart().startsWith("#")).join("\n");
  const activeNginx = nginx.split("\n").filter((line) => !line.trimStart().startsWith("#")).join("\n");
  assert.match(env, /^TRUST_PROXY_HEADER=\s*$/m);
  assert.match(caddy, /TRUST_PROXY_HEADER=x-real-ip/);
  assert.match(nginx, /TRUST_PROXY_HEADER=x-real-ip/);
  assert.match(activeCaddy, /header_up X-Real-IP \{client_ip\}/);
  assert.match(activeCaddy, /header_up -CF-Connecting-IP/);
  assert.match(activeNginx, /proxy_set_header X-Real-IP \$remote_addr;/);
  assert.doesNotMatch(activeNginx, /\$http_x_real_ip|\$proxy_add_x_forwarded_for/);
  assert.match(compose, /127\.0\.0\.1:3000:3000/);
});

test("different families and countries are observations, never automatic leakage", () => {
  assert.equal(compareNetworkObservation({ ip: "2606:4700::1111", countryCode: "US" }, { ip: "8.8.8.8", countryCode: "DE" }), "possible-dual-stack");
  assert.equal(compareNetworkObservation({ ip: "1.1.1.1", countryCode: null }, { ip: "8.8.8.8", countryCode: null }), "additional-route");
  assert.equal(compareNetworkObservation({ ip: "2606:4700::1111", countryCode: null }, { ip: "2606:4700:0:0:0:0:0:1111", countryCode: "US" }), "same");
  assert.equal(compareNetworkObservation({ ip: "127.0.0.1", countryCode: null }, { ip: "8.8.8.8", countryCode: null }), "unknown");
});

test("IPinfo Lite retains missing privacy fields and scores as unknown", () => {
  const report = mapIpInfoReport(lite, "8.8.8.8", "socket", NOW);
  assert.equal(report.asn, "AS15169");
  assert.equal(report.countryCode, "US");
  assert.equal(report.ipSource, "socket");
  assert.equal(report.score, null);
  assert.equal(report.ipType, null);
  assert.equal(report.aiSubscription, null);
  assert.deepEqual(new Set(Object.values(report.flagChecks)), new Set([null]));
  assert.deepEqual(new Set(Object.values(report.dimensions)), new Set([null]));
  assert.deepEqual(report.flags, []);
  assert.equal(report.source.fetchedAt, new Date(NOW).toISOString());
  assert.equal(Date.parse(report.source.expiresAt) - NOW, 300_000);
});

test("documented privacy booleans remain separate from missing and malformed values", () => {
  const report = mapIpInfoReport(info, "8.8.8.8", "trusted-header", NOW);
  assert.equal(report.flagChecks.vpn, false);
  assert.equal(report.flagChecks.datacenter, true);
  assert.equal(report.flagChecks.abuser, null);
  assert.deepEqual(report.flags, ["datacenter"]);
  assert.equal(report.ipType, "IDC");
  assert.equal(report.location, "Mountain View · California · United States");
  const malformed = mapIpInfoReport({ ...info, anonymous: { is_vpn: "true", is_proxy: 0 }, is_anonymous: true }, "8.8.8.8", "socket", NOW);
  assert.equal(malformed.flagChecks.vpn, null);
  assert.equal(malformed.flagChecks.proxy, null);
  assert.equal(malformed.anonymous, true);
});

test("aggregate anonymity preserves known false and unknown while retaining specific positive evidence", () => {
  const from = (extra) => mapIpInfoReport({ ip: "8.8.8.8", ...extra }, "8.8.8.8", "socket", NOW);
  assert.equal(from({}).anonymous, null);
  assert.equal(from({ is_anonymous: false }).anonymous, false);
  assert.equal(from({ is_anonymous: "false" }).anonymous, null);
  assert.equal(from({ anonymous: { is_vpn: false, is_proxy: false, is_tor: false } }).anonymous, null);
  assert.equal(from({ anonymous: { is_relay: true } }).anonymous, true);
  assert.equal(from({ is_anonymous: false, anonymous: { is_vpn: true } }).anonymous, true);
  const residential = from({ anonymous: { is_res_proxy: true } });
  assert.equal(residential.anonymous, true);
  assert.equal(residential.flagChecks.residentialProxy, true);
  assert.deepEqual(residential.flags, ["residentialProxy"]);
  assert.equal(residential.flagChecks.abuser, null);
});

test("upstream responses must match the explicit queried address", () => {
  for (const input of [null, [], {}, { ...info, ip: "1.1.1.1" }, { ...info, ip: "127.0.0.1" }, { ...info, bogon: true }, { ...info, error: { title: "unauthorized" } }]) assert.equal(mapIpInfoReport(input, "8.8.8.8", "socket", NOW), null);
  assert.ok(mapIpInfoReport({ ip: "2606:4700:0:0:0:0:0:1111" }, "2606:4700::1111", "socket", NOW));
});

test("unconfigured provider preserves a valid IP without any external request", async () => {
  await withProvider(async () => {
    globalThis.fetch = () => { throw new Error("must not fetch"); };
    const lookup = await freshLookup();
    const report = await lookup("8.8.8.8", "zh", "trusted-header");
    assert.equal(report.ok, true);
    assert.equal(report.ip, "8.8.8.8");
    assert.equal(report.source.provider, "request");
    assert.equal(report.source.status, "unconfigured");
    assert.equal(report.score, null);
    assert.equal(report.flagChecks.proxy, null);
    assert.deepEqual(await lookup("127.0.0.1", "zh"), { ok: false, reason: "invalid-address" });
  }, null);
});

test("queries use the documented target endpoint with a server-only authorization header", async () => {
  await withProvider(async () => {
    let request;
    globalThis.fetch = async (url, init) => { request = { url, init }; return jsonResponse(info); };
    const report = await (await freshLookup())("8.8.8.8", "en", "socket");
    assert.equal(request.url, "https://api.ipinfo.io/lookup/8.8.8.8");
    assert.equal(request.init.headers.authorization, "Bearer test-token");
    assert.equal(request.init.redirect, "error");
    assert.equal(request.init.cache, "no-store");
    assert.equal(report.source.status, "live");
    assert.equal(JSON.stringify(report).includes("test-token"), false);
  }, "test-token", "plus");
});

test("an unsupported configured tier stays unknown without contacting a provider", async () => {
  await withProvider(async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return jsonResponse(lite); };
    const report = await (await freshLookup())("8.8.8.8", "en");
    assert.equal(calls, 0);
    assert.equal(report.source.status, "unconfigured");
    assert.equal(report.flagChecks.proxy, null);
  }, "test-token", "unsupported-tier");
});

test("same-target requests coalesce and cache separately by address, locale and credentials", async () => {
  await withProvider(async () => {
    let calls = 0;
    globalThis.fetch = async (url) => { calls++; await Promise.resolve(); return jsonResponse({ ...lite, ip: decodeURIComponent(url.split("/").at(-1)) }); };
    const lookup = await freshLookup();
    const [first, second] = await Promise.all([lookup("8.8.8.8", "zh"), lookup("8.8.8.8", "zh")]);
    assert.equal(calls, 1);
    assert.deepEqual(first, second);
    assert.equal((await lookup("8.8.8.8", "zh")).source.status, "cached");
    assert.equal((await lookup("8.8.8.8", "zh")).source.fetchedAt, first.source.fetchedAt);
    assert.equal(calls, 1);
    await lookup("1.1.1.1", "zh");
    await lookup("8.8.8.8", "en");
    process.env.IPINFO_TOKEN = "other-token";
    await lookup("8.8.8.8", "zh");
    assert.equal(calls, 4);
  });
});

test("equivalent IPv6 requests share intelligence without changing address-source evidence", async () => {
  await withProvider(async () => {
    let calls = 0;
    globalThis.fetch = async (url) => { calls++; return jsonResponse({ ip: decodeURIComponent(url.split("/").at(-1)), country_code: "US" }); };
    const lookup = await freshLookup();
    await lookup("2606:4700::1111", "zh", "socket");
    const canonical = await lookup("2606:4700:0:0:0:0:0:1111", "zh", "socket");
    assert.equal(calls, 1);
    assert.equal(canonical.source.status, "cached");
    assert.equal(canonical.ipSource, "socket");
    const observed = await lookup("2606:4700::1111", "zh", "user-input");
    assert.equal(calls, 2);
    assert.equal(observed.ipSource, "user-input");
  });
});

test("expired intelligence is discarded when a refresh fails", async () => {
  const oldNow = Date.now;
  let now = NOW;
  Date.now = () => now;
  try {
    await withProvider(async () => {
      let failed = false;
      globalThis.fetch = async () => failed ? jsonResponse({ detail: "sensitive upstream data" }, 500) : jsonResponse(lite);
      const lookup = await freshLookup();
      const first = await lookup("8.8.8.8", "en");
      now += 300_001;
      failed = true;
      const latest = await lookup("8.8.8.8", "en");
      assert.equal(first.countryCode, "US");
      assert.equal(latest.source.status, "error");
      assert.equal(latest.source.error, "provider-unavailable");
      assert.equal(latest.countryCode, null);
      assert.equal(latest.source.fetchedAt, null);
      assert.equal(JSON.stringify(latest).includes("sensitive"), false);
    });
  } finally { Date.now = oldNow; }
});

test("provider authentication, quota, timeout and invalid data preserve explicit unknown semantics", async () => {
  await withProvider(async () => {
    for (const [mock, reason] of [
      [async () => jsonResponse({}, 401), "provider-auth"],
      [async () => jsonResponse({}, 403), "provider-auth"],
      [async () => jsonResponse({}, 429), "provider-rate-limit"],
      [async () => { throw new DOMException("do not expose", "TimeoutError"); }, "timeout"],
      [async () => new Response("not json"), "provider-invalid"],
      [async () => jsonResponse({ ...lite, ip: "1.1.1.1" }), "provider-invalid"],
    ]) {
      globalThis.fetch = mock;
      const lookup = await freshLookup();
      const report = await lookup("8.8.8.8", "en");
      assert.equal(report.ok, true);
      assert.equal(report.ip, "8.8.8.8");
      assert.equal(report.source.status, "error");
      assert.equal(report.source.error, reason);
      assert.equal(report.score, null);
      assert.equal(report.flagChecks.tor, null);
    }
  });
});

test("a failed lookup does not poison retries or an independent target", async () => {
  await withProvider(async () => {
    let calls = 0;
    globalThis.fetch = async (url) => { calls++; return calls === 1 ? jsonResponse({}, 429) : jsonResponse({ ...lite, ip: decodeURIComponent(url.split("/").at(-1)) }); };
    const lookup = await freshLookup();
    assert.equal((await lookup("8.8.8.8", "en")).source.error, "provider-rate-limit");
    assert.equal((await lookup("1.1.1.1", "en")).ip, "1.1.1.1");
    assert.equal((await lookup("8.8.8.8", "en")).source.status, "live");
    assert.equal(calls, 3);
  });
});

async function withRtc(Peer, run) {
  const oldWindow = globalThis.window;
  const oldPeer = globalThis.RTCPeerConnection;
  globalThis.window = { setTimeout, clearTimeout };
  if (Peer) globalThis.RTCPeerConnection = Peer; else delete globalThis.RTCPeerConnection;
  try { await run(); } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldPeer === undefined) delete globalThis.RTCPeerConnection; else globalThis.RTCPeerConnection = oldPeer;
  }
}
const candidate = (ip, type = "srflx") => ({ candidate: `candidate:1 1 udp 2122260223 ${ip} 60000 typ ${type}`, address: ip, type });

test("WebRTC unavailable and constructor failures never become a successful empty test", async () => {
  await withRtc(null, async () => assert.equal((await observeWebRtcIps()).status, "unsupported"));
  await withRtc(class { constructor() { throw new Error("blocked"); } }, async () => {
    const report = await observeWebRtcIps();
    assert.equal(report.status, "error");
    assert.equal(report.reason, "connection-failed");
  });
});

test("WebRTC captures public candidates, canonicalizes IPv6, ignores private and TURN addresses, and cleans up", async () => {
  let peer;
  class Peer {
    constructor() { peer = this; }
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() {
      for (const item of [candidate("8.8.8.8"), candidate("192.168.1.1", "host"), candidate("2606:4700:0:0:0:0:0:1111", "host"), candidate("2606:4700::1111"), candidate("1.1.1.1", "relay")]) this.onicecandidate({ candidate: item });
      this.onicecandidate({ candidate: null });
    }
    close() { this.closed = true; }
  }
  await withRtc(Peer, async () => {
    const report = await observeWebRtcIps();
    assert.equal(report.status, "complete");
    assert.deepEqual(report.ips, ["8.8.8.8", "2606:4700::1111"]);
    assert.equal(report.transport, "stun");
    assert.equal(peer.closed, true);
    assert.equal(peer.onicecandidate, null);
  });
});

test("WebRTC gathering errors are distinct from a completed observation with no exposed address", async () => {
  class Peer {
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() { this.onicecandidateerror({}); this.onicecandidate({ candidate: null }); }
    close() {}
  }
  await withRtc(Peer, async () => {
    const report = await observeWebRtcIps();
    assert.equal(report.status, "error");
    assert.equal(report.reason, "gathering-failed");
    assert.deepEqual(report.ips, []);
  });
});

test("a completed empty WebRTC observation remains explicitly different from API failure", async () => {
  class Peer {
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() { this.onicecandidate({ candidate: null }); }
    close() {}
  }
  await withRtc(Peer, async () => {
    const report = await observeWebRtcIps();
    assert.equal(report.status, "complete");
    assert.deepEqual(report.ips, []);
    assert.equal(report.reason, undefined);
  });
});

test("legacy SDP candidate parsing captures the candidate address, never a related address or mDNS name", async () => {
  class Peer {
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() {
      for (const sdp of ["candidate:1 1 udp 123 8.8.8.8 60000 typ srflx raddr 192.168.1.1 rport 9000", "candidate:2 1 udp 123 host-1.local 60000 typ host raddr 1.1.1.1 rport 9000"]) this.onicecandidate({ candidate: { candidate: sdp } });
      this.onicecandidate({ candidate: null });
    }
    close() {}
  }
  await withRtc(Peer, async () => {
    const report = await observeWebRtcIps();
    assert.equal(report.status, "complete");
    assert.deepEqual(report.ips, ["8.8.8.8"]);
  });
});

test("WebRTC timeouts retain partial evidence and close the connection", async () => {
  let closed = false;
  class Peer {
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() { this.onicecandidate({ candidate: candidate("8.8.8.8") }); }
    close() { closed = true; }
  }
  await withRtc(Peer, async () => {
    const report = await observeWebRtcIps(100);
    assert.equal(report.status, "timeout");
    assert.deepEqual(report.ips, ["8.8.8.8"]);
    assert.equal(closed, true);
  });
});

test("synchronous WebRTC setup errors settle the observation and close its resources", async () => {
  let closed = false;
  class Peer {
    createDataChannel() { throw new Error("disabled"); }
    close() { closed = true; }
  }
  await withRtc(Peer, async () => {
    assert.equal((await observeWebRtcIps()).status, "error");
    assert.equal(closed, true);
  });
});
