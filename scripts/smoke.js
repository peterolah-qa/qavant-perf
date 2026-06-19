import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

/**
 * Performance smoke for Qavant.
 *
 * Honest scope & fair use:
 *  - qavant.dev is a static site behind a CDN (Netlify). Netlify's Acceptable
 *    Use Policy forbids benchmark/load tests against their infrastructure, so
 *    we do NOT load-test it. We only do a single synthetic availability probe
 *    (one request — the same kind of "lab" check Lighthouse performs).
 *  - The real LOAD test runs against https://test.k6.io, Grafana k6's public
 *    sanctioned test target, which exists precisely for this purpose.
 *
 * Override the load target if you have your own server you fully control:
 *    BASE_URL=https://my-own-api.example k6 run scripts/smoke.js
 */
const OWN_SITE   = 'https://qavant.dev';                       // probed once, not loaded
const LOAD_TARGET = __ENV.BASE_URL || 'https://test.k6.io';    // sanctioned load target
const STATUS_UI  = 'https://raw.githubusercontent.com/peterolah-qa/qavant-tests/main/status.json';
const STATUS_API = 'https://raw.githubusercontent.com/peterolah-qa/qavant-api-tests/main/status.json';

export const options = {
  scenarios: {
    // 1) Single synthetic visit to my own site — availability only, no load.
    availability: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'availability',
    },
    // 2) Real load test against a target meant for it.
    load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'load',
      startTime: '2s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],     // < 1% of requests may error
    http_req_duration: ['p(95)<800'],   // 95% of responses under 800 ms
    checks: ['rate>0.99'],              // virtually all checks must pass
  },
};

// Scenario 1: one request to qavant.dev + the data sources the site depends on.
export function availability() {
  const home = http.get(OWN_SITE);
  check(home, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage serves real content': (r) => !!r.body && r.body.includes('Qavant'),
    'homepage under 1s': (r) => r.timings.duration < 1000,
  });
  check(http.get(STATUS_UI),  { 'ui status.json available':  (r) => r.status === 200 });
  check(http.get(STATUS_API), { 'api status.json available': (r) => r.status === 200 });
}

// Scenario 2: sustained load against the sanctioned target.
export function load() {
  const res = http.get(LOAD_TARGET);
  check(res, {
    'load target status is 200': (r) => r.status === 200,
    'load target returns a body': (r) => !!r.body,
  });
  sleep(1);
}

/**
 * Emit a machine-readable status.json (same family as the other repos) plus a
 * human summary. Runs even when thresholds fail, so the published numbers
 * always reflect reality.
 */
export function handleSummary(data) {
  const c = (data.metrics.checks && data.metrics.checks.values) || { passes: 0, fails: 0 };
  const passed = c.passes || 0;
  const total = (c.passes || 0) + (c.fails || 0);
  const passRate = total ? Math.round((passed / total) * 1000) / 10 : 0;
  const p95 = (data.metrics.http_req_duration &&
               data.metrics.http_req_duration.values &&
               data.metrics.http_req_duration.values['p(95)']) || 0;
  const errRate = (data.metrics.http_req_failed &&
                   data.metrics.http_req_failed.values &&
                   data.metrics.http_req_failed.values.rate) || 0;

  const status = {
    passed,
    total,
    passRate,
    p95_ms: Math.round(p95),
    errorRate: Math.round(errRate * 10000) / 10000,
    loadTarget: LOAD_TARGET,
    lastRun: new Date().toISOString(),
  };

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: false }),
    'summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'status.json': JSON.stringify(status, null, 2),
  };
}
