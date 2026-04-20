/**
 * Generate all sitemap XML files into public/ from cached plate ranges.
 *
 * Output:
 *   public/sitemap.xml            — sitemap index
 *   public/sitemaps/0.xml .. N.xml — child sitemaps (max 50k URLs each)
 *
 * Reads src/data/plate-ranges.json and does not call the Vegvesen API.
 *
 * Usage: bun run scripts/build-sitemaps.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load env: process.env takes priority (set by Coolify/CI), fall back to .env.local
const envPath = resolve(ROOT, ".env.local");
const envContent = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

function envVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const match = envContent.match(new RegExp(`^${name}=(.+)`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "");
}

// COOLIFY_URL is comma-separated, e.g. "https://bilskiltnummer.no,https://www.bilskiltnummer.no"
const coolifyUrl = envVar("COOLIFY_URL");
const BASE_URL = coolifyUrl?.split(",")[0] ?? "http://localhost:3000";

const CACHE_PATH = resolve(ROOT, "src/data/plate-ranges.json");
const SITEMAPS_DIR = resolve(ROOT, "public/sitemaps");
const INDEX_PATH = resolve(ROOT, "public/sitemap.xml");
const MAX_URLS_PER_SITEMAP = 50_000;
const URL_CHANGEFREQ = "daily";
const URL_PRIORITY = "0.8";

// ── Types ──────────────────────────────────────────────────────────────

interface NumRange { min: number; max: number }
interface PrefixResult { d5?: NumRange; d4?: NumRange }
type ScanCache = Record<string, PrefixResult>;

function pad(n: number, d: number): string {
  return String(n).padStart(d, "0");
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
  if (!existsSync(CACHE_PATH)) {
    console.error(`Cache file not found: ${CACHE_PATH}`);
    console.error("Run the scan script locally to generate plate-ranges.json before building sitemaps.");
    process.exit(1);
  }

  let ranges: ScanCache;
  try {
    ranges = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    console.error(`Failed to read cache file: ${CACHE_PATH}`);
    process.exit(1);
  }

  // 1. Generate sitemap XMLs
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

  // 2. Write sitemap index
  let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const file of sitemapFiles) {
    indexXml += `<sitemap><loc>${BASE_URL}/sitemaps/${file}</loc></sitemap>\n`;
  }
  indexXml += "</sitemapindex>\n";
  writeFileSync(INDEX_PATH, indexXml);

  console.log(`Done: ${Object.keys(ranges).length} active prefixes, ${sitemapFiles.length} sitemaps, ${totalUrls.toLocaleString()} URLs`);
}

main().catch(console.error);
