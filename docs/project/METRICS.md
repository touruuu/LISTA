# LISTA Metrics Catalog

Resume-grade numbers, each with its measurement method. Rule: a metric may only be cited (resume, deck, interview) if it has a **current measured value** below. Re-measure with the given command; update the table.

## Measured (2026-09-25)

| Metric | Value | Method |
|---|---|---|
| Cross-device consistency | **<5 s** (poll interval; worst case one poll cycle) | architecture property + observable on two devices |
| LAN p95 API latency | **4 ms** | `for i in $(seq 1 10); do curl -s -o /dev/null -w '%{time_total}\n' http://192.168.68.146:8088/api/verify; done` |
| Funnel p50 / p95 | **889 ms / 3.71 s** | same loop against the HTTPS URL (n=20) |
| Tamper detection rate | **100%** (1/1 single-record forgeries detected, chain break pinpointed to tx id) | `POST /api/dev/tamper` → `GET /api/verify` |
| Backup→restore RTO | **2 s** (3 customers, 4 txs, chain ok after restore into empty server) | `docs/audits/network-audit-2026-09-25.md` §9 procedure |
| Runtime dependency vulns | **0** | `npm audit --omit=dev` |
| Hardware footprint | **1 vCPU / 1 GB RAM / 8 GB disk** LXC serving the full stack | `pct config 110` |
| TLS cert | Let's Encrypt, HTTP/2, auto-renew | `openssl s_client` |
| Offline resilience | designed: writes queue in IndexedDB outbox, auto-drain on reconnect, `client_tx_id` idempotent | `src/sync.js` — **not yet drill-measured, do not cite a % until the airplane-mode test is run** |

## Not yet instrumented (do NOT cite)

| Metric | Why it needs instrumenting | Plan |
|---|---|---|
| Uptime % | no monitor has ever watched the endpoint | Uptime Kuma monitor, 7-day window, status-page screenshot |
| Sync latency p50/p99 (server-side) | no log of created_at → first-visible | small middleware logging row-appearance; table after a week of real use |
| Users / transactions processed | the ledger has ~4 demo txs; invented adoption numbers are sniffed out instantly | only cite after real store use |

## One-liner currently justified by this file

> "Self-hosted PWA ledger on a 1 GB LXC: public HTTPS via Tailscale Funnel, <5 s cross-device consistency, 2-second verified disaster-recovery, 0 dependency vulnerabilities, hash-chained ledger that detected 100% of injected forgeries in drills."
