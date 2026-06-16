import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

/**
 * Performance smoke / SLO check for qavant.dev.
 *
 * Honest scope: qavant.dev is a static site behind a CDN (Netlify). A "stress
 * test to find the breaking point" would mostly measure the CDN edge, not my
 * app, and hammering it would be abusive. So this is a LIGHT, realistic load
 * that asserts availability and latency SLOs — not a vanity load number.
 *
 * Target can be overridden:  BASE_URL=https://staging.example npm-less `k6 run`
 */
const SITE = __ENV.BASE_URL || 'https://qavant.dev';
const STATUS_UI = 'https://raw.githubusercontent.com/peterolah-qa/qavant-tests/main/status.json';
const STATUS_API = 'https://raw.githubusercontent.com/peterolah-qa/qavant-api-tests/main/status.json';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],     // < 1% of requests may error
    http_req_duration: ['p(95)<800'],   // 95% of responses under 800 ms
    checks: ['rate>0.99'],              // virtually all checks must pass
  },
};

export default function () {
  // 1) Homepage — available, correct, and fast
  const home = http.get(SITE);
  check(home, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage serves real content': (r) => !!r.body && r.body.includes('Qavant'),
    'homepage under 1s': (r) => r.timings.duration < 1000,
  });

  // 2) The live-metrics data sources the site depends on
  check(http.get(STATUS_UI), { 'ui status.json available': (r) => r.status === 200 });
  check(http.get(STATUS_API), { 'api status.json available': (r) => r.status === 200 });

  sleep(1);
}

/**
 * Emit a machine-readable status.json (same family as the other repos) plus a
 * human summary. Runs even when thresholds fail, so the published numbers always
 * reflect reality.
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
    lastRun: new Date().toISOString(),
  };

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: false }),
    'summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'status.json': JSON.stringify(status, null, 2),
  };
}
