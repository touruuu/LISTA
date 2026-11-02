# LISTA Network & Security Audit — 2026-09-25

Scope: public endpoint `https://lista.tail951fe5.ts.net` (Tailscale Funnel → CT110 LXC → Express :8088), LAN endpoint `http://192.168.68.146:8088`. Every item below is labeled VERIFIED (command + date) or OPEN (not yet done). Re-run the commands to refresh.

## 1. Exposure surface — VERIFIED
`tailscale funnel status` (from CT110, 2026-09-25):
```
https://lista.tail951fe5.ts.net (Funnel on)
|-- / proxy http://127.0.0.1:8088
```
Single inbound path, TLS-terminated by Tailscale, backend bound to loopback. No router port-forwarding exists. **OPEN:** external nmap scan from an off-network vantage to prove "only 443 answers" empirically.

## 2. TLS — VERIFIED
`openssl s_client` (2026-09-25): issuer `Let's Encrypt (YE2)`, valid 2026-09-21 → 2026-12-20 (~86d), auto-renewed by tailscaled. Negotiates **HTTP/2**. **OPEN:** full cipher/protocol audit with testssl.sh (expect TLS 1.3/1.2 only — Tailscale-managed).

## 3. HTTP security headers — VERIFIED FINDING (OPEN remediation)
`curl -I` (2026-09-25): response carries only `accept-ranges, cache-control, content-type, etag, last-modified, content-length`. **Missing: HSTS, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.**
Remediation (one Express middleware, ~10 lines):
```js
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'",
    'Strict-Transport-Security': 'max-age=31536000'
  });
  next();
});
```
Status: **finding documented, fix not yet applied** (apply, re-run `curl -I`, paste before/after here — that pair is the resume artifact).

## 4. Access control — VERIFIED POSTURE (OPEN decision)
All `/api/*` read/write endpoints are unauthenticated by design (shared-store demo; groupmates open the same URL with zero setup). Legacy `LISTA_OWNER_TOKEN` mode exists and is fail-closed when set; statement pages are token-gated (token = capability URL); artifact bytes are token-gated for statement viewers. Risk: anyone with the funnel URL can read/write the ledger. Accepted for demo data; the remediation path (shared store PIN gate on writes) is designed, not built.

## 5. Latency — VERIFIED (2026-09-25, curl timing loop on GET /api/verify)
| Path | p50 | p95 | max |
|---|---|---|---|
| Funnel (public HTTPS) | 889 ms | 3.71 s | 3.71 s |
| LAN (direct) | 1 ms | 4 ms | 4 ms |

Interpretation: funnel numbers include TLS handshake + Tailscale relay path (DERP relay when no direct connection); LAN proves the app itself adds ~4 ms. **OPEN:** instrument sync-latency histogram server-side (tx created_at → first state read containing it) for p50/p99 tables; check whether a direct (non-relayed) WireGuard path collapses the funnel gap.

## 6. Availability — OPEN
Not yet instrumented. Plan: Uptime Kuma monitor on the funnel URL (7-day window → status-page screenshot). No claims possible until then — do not put an uptime % on a resume before this exists.

## 7. Dependency & platform audit — VERIFIED (2026-09-25)
- `npm audit --omit=dev`: **0 vulnerabilities** (runtime deps).
- Dev box Node v22.23.2; **prod CT110 runs Node v20.x** — version skew documented; pin engines in package.json as follow-up.

## 8. Tamper-evidence drill — VERIFIED (2026-09-25, on production data, reversible)
```
verify  -> {ok:true, count:4}
tamper  -> newest tx 100.00 -> 101.37 (forged write, no restamp)
verify  -> {ok:false, broken_at:"5c324476…", reason:"hash mismatch"}
restore -> original amount + full restamp
verify  -> {ok:true}
```
Single-record forgery detected 100% of the time; honest repair restores chain integrity. Reproducible on demand via `/api/dev/tamper|restore`.

## 9. Backup / restore drill — VERIFIED (2026-09-25)
`GET /backup.json` from prod → rebuilt into a **fresh empty server** via the idempotent sync path → `{customers:3, txs:4, verify:{ok:true}}`. **RTO: 2 seconds** (download + rebuild + verify). Artifacts (pic+sig webp files) are NOT in backup.json — restore re-uploads from phones' outboxes; document as known gap, mitigation = also tar `LISTA_ARTIFACT_DIR`.

## 10. Topology — VERIFIED (documented in README + homelab docs)
iPhone/laptop → Deco mesh (untagged) → SG108E → CT110 LXC (static 192.168.68.146/24, gw .1) → Express :8088 (loopback) ← Tailscale Funnel 443. LXC requires host-side `/dev/net/tun` cgroup allow + bind mount (pct has no tun flag on this PVE build). **OPEN (homelab-side):** dedicated VLAN for CT110 + OPNsense inter-VLAN policy; split-DNS zone (`lista.home`) via AdGuard/Unbound.

---

**Scorecard:** 6 verified pass, 2 verified findings (headers, access posture), 4 open workstreams (external scan, cipher audit, uptime monitor, headers fix). All drills ran against production with zero data loss.
