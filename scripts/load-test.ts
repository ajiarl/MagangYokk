/**
 * Autonomous Concurrency & Capacity Load Testing Harness
 * Target: MagangYokk High-Traffic Endpoints
 * 
 * Pengujian beban konkurensi mandiri tanpa dependensi native C++.
 * Mengukur RPS, latency percentiles (min, p50, p90, p95, p99, max), dan error rate.
 */

interface RequestResult {
  status: number;
  durationMs: number;
  ok: boolean;
  error?: string;
}

interface BenchmarkSummary {
  endpoint: string;
  totalRequests: number;
  concurrency: number;
  successCount: number;
  failCount: number;
  totalDurationSec: number;
  rps: number;
  minMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  errorRatePercent: number;
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

async function runWorkerPool(
  url: string,
  totalRequests: number,
  concurrency: number
): Promise<RequestResult[]> {
  const results: RequestResult[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < totalRequests) {
      currentIndex++;
      const start = performance.now();
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "MagangYokk-LoadTest/1.0",
            Accept: "*/*",
          },
        });
        const durationMs = performance.now() - start;
        const isHealth = url.includes("/api/health");
        // Untuk /api/health, status 200 (healthy) maupun 503 (unhealthy saat DB offline) adalah respons valid server
        const isOk = (response.status >= 200 && response.status < 400) || (isHealth && response.status === 503);
        results.push({
          status: response.status,
          durationMs,
          ok: isOk,
        });
      } catch (err: unknown) {
        const durationMs = performance.now() - start;
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          status: 0,
          durationMs,
          ok: false,
          error: msg,
        });
      }
    }
  }

  const pool: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, totalRequests); i++) {
    pool.push(worker());
  }

  await Promise.all(pool);
  return results;
}

async function benchmarkEndpoint(
  baseUrl: string,
  path: string,
  totalRequests = 100,
  concurrency = 50
): Promise<BenchmarkSummary> {
  const fullUrl = `${baseUrl}${path}`;
  const overallStart = performance.now();

  const results = await runWorkerPool(fullUrl, totalRequests, concurrency);

  const overallDurationMs = performance.now() - overallStart;
  const totalDurationSec = overallDurationMs / 1000;
  const rps = totalDurationSec > 0 ? totalRequests / totalDurationSec : 0;

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successCount = results.filter((r) => r.ok).length;
  const failCount = totalRequests - successCount;
  const errorRatePercent = (failCount / totalRequests) * 100;

  return {
    endpoint: path,
    totalRequests,
    concurrency,
    successCount,
    failCount,
    totalDurationSec,
    rps,
    minMs: latencies[0] || 0,
    p50Ms: calculatePercentile(latencies, 50),
    p90Ms: calculatePercentile(latencies, 90),
    p95Ms: calculatePercentile(latencies, 95),
    p99Ms: calculatePercentile(latencies, 99),
    maxMs: latencies[latencies.length - 1] || 0,
    errorRatePercent,
  };
}

async function checkServerAlive(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.status < 500;
  } catch {
    try {
      const res = await fetch(baseUrl, {
        signal: AbortSignal.timeout(3000),
      });
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

async function main() {
  const baseUrl = process.env.TARGET_URL || "http://localhost:3000";

  console.log("================================================================================");
  console.log("             MAGANGYOKK LOAD & CONCURRENCY BENCHMARK HARNESS                     ");
  console.log("================================================================================");
  console.log(`Target Base URL: ${baseUrl}`);
  console.log(`Node Environment: ${process.version}`);
  console.log(`Timestamp       : ${new Date().toISOString()}\n`);

  const isAlive = await checkServerAlive(baseUrl);
  if (!isAlive) {
    console.error(`[ERROR] Server target di ${baseUrl} tidak merespons.`);
    console.error(`Petunjuk: Jalankan aplikasi terlebih dahulu dengan:`);
    console.error(`  npm run build && npm run start   (atau npm run dev)`);
    console.error(`Lalu ulangi: npm run test:load\n`);
    process.exit(1);
  }

  const endpoints = ["/api/health", "/"];
  const totalRequests = 100;
  const concurrency = 50;

  const summaries: BenchmarkSummary[] = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`Benchmarking ${endpoint} (${totalRequests} reqs @ c=${concurrency})... `);
    const summary = await benchmarkEndpoint(baseUrl, endpoint, totalRequests, concurrency);
    summaries.push(summary);
    console.log("SELESAI");
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("                              HASIL BENCHMARK");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    "Endpoint       | Total | Conc | RPS     | p50 (ms) | p95 (ms) | p99 (ms) | Error % | Status"
  );
  console.log(
    "---------------+-------+------+---------+----------+----------+----------+---------+-------"
  );

  let allPassed = true;

  for (const s of summaries) {
    const statusPass = s.errorRatePercent === 0;
    if (!statusPass) allPassed = false;

    const ep = s.endpoint.padEnd(14, " ");
    const tot = String(s.totalRequests).padStart(5, " ");
    const cnc = String(s.concurrency).padStart(4, " ");
    const rps = s.rps.toFixed(1).padStart(7, " ");
    const p50 = s.p50Ms.toFixed(1).padStart(8, " ");
    const p95 = s.p95Ms.toFixed(1).padStart(8, " ");
    const p99 = s.p99Ms.toFixed(1).padStart(8, " ");
    const err = `${s.errorRatePercent.toFixed(1)}%`.padStart(7, " ");
    const verdict = statusPass ? " PASS  " : " FAIL  ";

    console.log(`${ep} | ${tot} | ${cnc} | ${rps} | ${p50} | ${p95} | ${p99} | ${err} | ${verdict}`);
  }

  console.log("--------------------------------------------------------------------------------\n");

  if (allPassed) {
    console.log("✓ KESIMPULAN: Seluruh endpoint memenuhi kapasitas beban (0% error rate).");
    process.exit(0);
  } else {
    console.error("✗ KESIMPULAN: Terdapat kegagalan request melebihi toleransi.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal benchmark error:", err);
  process.exit(1);
});
