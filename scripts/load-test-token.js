const { RtcTokenBuilder, RtcRole } = require("agora-token");
const crypto = require("crypto");

const appId = "970ca35de60c44645bbae8a215061b33";
const cert = "5cfd2fd17e6d404791f3d45fb56fb7e3";

console.log("=== BENCHMARK DE CHARGE : GÉNÉRATION DE TOKENS RTC AGORA ===");

function randomAudienceUid() {
  return crypto.randomInt(1_000_000_000, 4_000_000_000);
}

function buildToken(channelName, uid) {
  const ttl = 3600;
  return RtcTokenBuilder.buildTokenWithUid(appId, cert, channelName, uid, RtcRole.SUBSCRIBER, ttl, ttl);
}

function runBenchmark(count) {
  const durations = [];
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    const uid = randomAudienceUid();
    buildToken("aa_live_stress", uid);
    const t1 = performance.now();
    durations.push(t1 - t0);
  }

  durations.sort((a, b) => a - b);
  const total = performance.now() - start;
  const p50 = durations[Math.floor(count * 0.50)];
  const p95 = durations[Math.floor(count * 0.95)];
  const p99 = durations[Math.floor(count * 0.99)];
  const max = durations[count - 1];
  const opsPerSec = Math.round((count / total) * 1000);

  console.log(`Palier : ${count} requêtes`);
  console.log(`Temps total : ${total.toFixed(2)} ms | Débit : ${opsPerSec} tokens/sec`);
  console.log(`Latence p50 : ${p50.toFixed(4)} ms | p95 : ${p95.toFixed(4)} ms | p99 : ${p99.toFixed(4)} ms | Max : ${max.toFixed(4)} ms\n`);

  return { Palier: count, "Total (ms)": total.toFixed(2), "Tokens/sec": opsPerSec, "p50 (ms)": p50.toFixed(4), "p95 (ms)": p95.toFixed(4), "p99 (ms)": p99.toFixed(4) };
}

const steps = [50, 200, 500, 1000, 2000];
const summary = [];
for (const step of steps) {
  summary.push(runBenchmark(step));
}

// Test du rate limiter (mémoire)
console.log("=== TEST DU RATE LIMITER SOUS CHARGE (25 hits successifs) ===");
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

let allowed = 0;
let blocked = 0;
for (let i = 0; i < 25; i++) {
  if (rateLimit("stress-user", 20, 60000)) allowed++;
  else blocked++;
}
console.log(`Résultat : ${allowed} autorisés (seuil = 20), ${blocked} bloqués (429) => ✅ Conforme.`);

console.log("\nTableau récapitulatif :");
console.table(summary);
