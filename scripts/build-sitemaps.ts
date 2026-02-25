/**
 * Scan the Vegvesen API to find active plate ranges, then generate
 * all sitemap XML files into public/.
 *
 * Output:
 *   public/sitemap.xml            — sitemap index
 *   public/sitemaps/0.xml .. N.xml — child sitemaps (max 50k URLs each)
 *
 * Assumption: plates are assigned sequentially from 10000 (5-digit) or
 * 1000 (4-digit). If the first number doesn't exist, the prefix is empty.
 *
 * Resumable — caches scan results in src/data/plate-ranges.json.
 *
 * Usage: bun run scripts/build-sitemaps.ts
 * Requires SVV_API_KEY in .env.local
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const API_BASE =
  "https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata";

const VALID_LETTERS = "ABCDEFGHJKLNPRSTUVWXYZ".split("");

// Load env: process.env takes priority (set by Coolify/CI), fall back to .env.local
const envPath = resolve(ROOT, ".env.local");
const envContent = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

function envVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const match = envContent.match(new RegExp(`^${name}=(.+)`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "");
}

const API_KEY = envVar("SVV_API_KEY");
if (!API_KEY) {
  console.error("SVV_API_KEY not found");
  process.exit(1);
}

// COOLIFY_URL is comma-separated, e.g. "https://bilskiltnummer.no,https://www.bilskiltnummer.no"
const coolifyUrl = envVar("COOLIFY_URL");
const BASE_URL = coolifyUrl?.split(",")[0] ?? "http://localhost:3000";

const CACHE_PATH = resolve(ROOT, "src/data/plate-ranges.json");
const SITEMAPS_DIR = resolve(ROOT, "public/sitemaps");
const INDEX_PATH = resolve(ROOT, "public/sitemap.xml");
const MAX_URLS_PER_SITEMAP = 50_000;
const CONCURRENCY = 10;
const DELAY_MS = 30;
const URL_CHANGEFREQ = "daily";
const URL_PRIORITY = "0.8";

// ── Types ──────────────────────────────────────────────────────────────

interface NumRange { min: number; max: number }
interface PrefixResult { d5?: NumRange; d4?: NumRange }
type ScanResult = PrefixResult | "empty";
type ScanCache = Record<string, ScanResult>;

// ── API ────────────────────────────────────────────────────────────────

let requestCount = 0;

async function checkPlate(regnr: string): Promise<boolean> {
  requestCount++;
  try {
    const res = await fetch(`${API_BASE}?kjennemerke=${regnr}`, {
      headers: { "SVV-Authorization": `Apikey ${API_KEY}` },
    });
    if (res.status === 200) return true;
    if (res.status === 204 || res.status === 404) return false;
    if (res.status === 429 || res.status >= 500) {
      await sleep(3000);
      return checkPlate(regnr);
    }
    return false;
  } catch {
    await sleep(2000);
    return checkPlate(regnr);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pad(n: number, d: number): string {
  return String(n).padStart(d, "0");
}

// ── Binary search ──────────────────────────────────────────────────────

async function bsearchMax(prefix: string, lo: number, hi: number, digits: number): Promise<number> {
  let left = lo, right = hi, best = lo;
  while (left <= right) {
    const mid = Math.ceil((left + right) / 2);
    if (await checkPlate(`${prefix}${pad(mid, digits)}`)) { best = mid; left = mid + 1; }
    else right = mid - 1;
    await sleep(DELAY_MS);
  }
  return best;
}

async function findMax(prefix: string, min: number, max: number, digits: number): Promise<number | null> {
  if (!(await checkPlate(`${prefix}${pad(min, digits)}`))) return null;
  await sleep(DELAY_MS);
  return bsearchMax(prefix, min, max, digits);
}

async function scanPrefix(prefix: string): Promise<ScanResult> {
  const [max5, max4] = await Promise.all([
    findMax(prefix, 10000, 99999, 5),
    findMax(prefix, 1000, 9999, 4),
  ]);
  if (max5 === null && max4 === null) return "empty";
  const r: PrefixResult = {};
  if (max5 !== null) r.d5 = { min: 10000, max: max5 };
  if (max4 !== null) r.d4 = { min: 1000, max: max4 };
  return r;
}

// ── Concurrency pool ───────────────────────────────────────────────────

async function pooled<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  let idx = 0;
  const worker = async () => { while (idx < items.length) { const i = idx++; await fn(items[i]); } };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

// ── XML helpers ────────────────────────────────────────────────────────

function writeSitemapChunk(filepath: string, urls: string[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const url of urls) {
    xml += `<url><loc>${url}</loc><changefreq>${URL_CHANGEFREQ}</changefreq><priority>${URL_PRIORITY}</priority></url>\n`;
  }
  xml += "</urlset>\n";
  writeFileSync(filepath, xml);
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const prefixes: string[] = [];
  for (const a of VALID_LETTERS) for (const b of VALID_LETTERS) prefixes.push(`${a}${b}`);

  // 1. Scan (with cache)
  let cache: ScanCache = {};
  if (existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")); } catch { cache = {}; }
  }

  const cached = Object.keys(cache).length;
  console.log(`Scanning ${prefixes.length} prefixes (${cached} cached, concurrency ${CONCURRENCY})`);

  let done = cached;
  await pooled(prefixes, CONCURRENCY, async (prefix) => {
    if (cache[prefix] !== undefined) return;
    const result = await scanPrefix(prefix);
    cache[prefix] = result;
    done++;
    const tag = result === "empty" ? "empty" : Object.entries(result).map(([k, v]) => `${k}:${v.max}`).join(" ");
    console.log(`[${done}/${prefixes.length}] ${prefix} ${tag}`);
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  });

  const ranges: Record<string, PrefixResult> = {};
  for (const [k, v] of Object.entries(cache)) if (v !== "empty") ranges[k] = v;
  writeFileSync(CACHE_PATH, JSON.stringify(ranges, null, 2));

  // 2. Generate sitemap XMLs
  console.log("Generating sitemaps...");

  if (existsSync(SITEMAPS_DIR)) rmSync(SITEMAPS_DIR, { recursive: true });
  mkdirSync(SITEMAPS_DIR, { recursive: true });

  let chunkIdx = 0;
  let totalUrls = 0;
  const sitemapFiles: string[] = [];

  for (const prefix of Object.keys(ranges).sort()) {
    const result = ranges[prefix];

    for (const [key, digits] of [["d5", 5], ["d4", 4]] as const) {
      const range = result[key];
      if (!range) continue;

      const count = range.max - range.min + 1;
      const numChunks = Math.ceil(count / MAX_URLS_PER_SITEMAP);

      for (let i = 0; i < numChunks; i++) {
        const start = range.min + i * MAX_URLS_PER_SITEMAP;
        const end = Math.min(start + MAX_URLS_PER_SITEMAP - 1, range.max);

        const urls: string[] = [];
        for (let num = start; num <= end; num++) {
          urls.push(`${BASE_URL}/${prefix}${pad(num, digits)}`);
        }

        const filename = `${chunkIdx}.xml`;
        writeSitemapChunk(resolve(SITEMAPS_DIR, filename), urls);
        sitemapFiles.push(filename);
        totalUrls += urls.length;
        chunkIdx++;
      }
    }
  }

  // 3. Write sitemap index
  let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const file of sitemapFiles) {
    indexXml += `<sitemap><loc>${BASE_URL}/sitemaps/${file}</loc></sitemap>\n`;
  }
  indexXml += "</sitemapindex>\n";
  writeFileSync(INDEX_PATH, indexXml);

  console.log(`Done: ${Object.keys(ranges).length} active prefixes, ${sitemapFiles.length} sitemaps, ${totalUrls.toLocaleString()} URLs, ${requestCount} API calls`);
}

main().catch(console.error);
