# qavant-perf

Performance smoke / SLO checks for **[qavant.dev](https://qavant.dev)** — written with k6.

This is the fourth suite in the Qavant ecosystem (alongside Playwright, Newman and
Selenium). It answers a different question than the others: not "is it correct?" but
"is it **available and fast enough**, under load?"

[![k6 Performance](https://github.com/peterolah-qa/qavant-perf/actions/workflows/k6.yml/badge.svg)](https://github.com/peterolah-qa/qavant-perf/actions/workflows/k6.yml)
[![checks](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeterolah-qa%2Fqavant-perf%2Fmain%2Fstatus.json&query=%24.passRate&suffix=%25&label=checks&color=brightgreen)](https://raw.githubusercontent.com/peterolah-qa/qavant-perf/main/status.json)
[![p95 latency](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeterolah-qa%2Fqavant-perf%2Fmain%2Fstatus.json&query=%24.p95_ms&suffix=ms&label=p95&color=blue)](https://raw.githubusercontent.com/peterolah-qa/qavant-perf/main/status.json)
[![error rate](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeterolah-qa%2Fqavant-perf%2Fmain%2Fstatus.json&query=%24.errorRate&label=error%20rate&color=blue)](https://raw.githubusercontent.com/peterolah-qa/qavant-perf/main/status.json)

> **Live SLO metrics** above are read straight from the latest CI run's `status.json` — they update themselves on every push and daily run. p95 latency and error rate are the gates; a breach turns the build red.

**Live results from the latest run:**
- [`status.json`](https://raw.githubusercontent.com/peterolah-qa/qavant-perf/main/status.json) — machine-readable metrics (checks, p95, error rate)
- [`summary.txt`](https://raw.githubusercontent.com/peterolah-qa/qavant-perf/main/summary.txt) — the full human-readable k6 run summary

Both are committed back to the repo by CI on every run, so they always reflect the most recent execution.


## Honest scope (read this first)

qavant.dev is a static site behind a CDN. A stress test built to "find the breaking
point" would mostly measure the CDN edge, not my application — and hammering any host
is abusive. So this suite is deliberately a **performance smoke under light, realistic
load**: it asserts availability and latency SLOs, not a vanity load number. Scoping the
test to what is actually meaningful is the point.

## What is covered

| Check | SLO / assertion |
|-------|-----------------|
| Homepage availability | HTTP 200, serves real content (not an error page) |
| Homepage latency | each response under 1s; **p95 < 800 ms** across the run |
| Error rate | **< 1%** of all requests may fail |
| Live-metrics sources | both `status.json` endpoints the site depends on return 200 |
| Overall checks | **> 99%** of checks must pass (threshold-gated) |

Load profile: 5 virtual users for 30 seconds — enough to measure latency under
concurrency, light enough to be a good citizen against a live site.

## Design decisions

- **Smoke, not stress.** SLOs (p95 latency, error rate) over a vanity "max RPS". On a
  CDN-backed static site, SLOs are the honest, useful signal.
- **Thresholds are the quality gate.** k6 exits non-zero if any threshold is breached,
  so a slow or flaky deploy turns the CI run red — same gate philosophy as the other suites.
- **Reports reality even on red.** `handleSummary` writes `status.json` whether thresholds
  pass or fail, so the published numbers are never a lie.
- **Same status contract.** Emits `status.json` (`passed`, `total`, `passRate`, `p95_ms`,
  `errorRate`, `lastRun`) in the same family as the other repos.
- **Target is overridable** via `BASE_URL`, so the same script can hit a staging build.

## Running locally

Install k6 (https://grafana.com/docs/k6/latest/set-up/install-k6/), then:

```bash
k6 run scripts/smoke.js
# against another target:
BASE_URL=http://localhost:8000 k6 run scripts/smoke.js
```

## CI

`.github/workflows/k6.yml` runs on every push to `main`, daily on a schedule, and on
demand. It installs k6 via the official `grafana/setup-k6-action`, runs the smoke test
(a breached threshold fails the build), uploads the summary as an artifact, and publishes
`status.json` back to the repo.

## Stack

k6 (Grafana) · JavaScript · GitHub Actions

---

Built and maintained by **Peter** · [qavant.dev](https://qavant.dev)
