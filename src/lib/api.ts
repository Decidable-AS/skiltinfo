import { cache } from "react";
import { VegvesenResponse, KjoretoyData } from "./types";
import { checkRateLimit, cleanupExpiredRateLimitBuckets } from "./rate-limit";

const API_BASE =
  "https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata";

const CACHE_TTL_MS = 5 * 60_000;
const NULL_CACHE_TTL_MS = 60_000;
const SVV_LIMIT = 60;
const SVV_WINDOW_MS = 60_000;

type CacheEntry = {
  data: KjoretoyData | null;
  expiresAt: number;
};

const vehicleCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<KjoretoyData | null>>();

function logVegvesenEvent(event: string, details: Record<string, unknown>) {
  console.error(
    "[vegvesen-api]",
    JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...details,
    })
  );
}

async function readErrorResponse(res: Response) {
  try {
    const body = await res.text();
    return body.slice(0, 500) || null;
  } catch {
    return null;
  }
}

function cleanupExpiredVehicleCache() {
  const currentTime = Date.now();

  for (const [key, entry] of vehicleCache.entries()) {
    if (entry.expiresAt <= currentTime) {
      vehicleCache.delete(key);
    }
  }
}

function readVehicleCache(regnr: string) {
  const cached = vehicleCache.get(regnr);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    vehicleCache.delete(regnr);
    return null;
  }

  return cached.data;
}

function writeVehicleCache(regnr: string, data: KjoretoyData | null) {
  vehicleCache.set(regnr, {
    data,
    expiresAt: Date.now() + (data ? CACHE_TTL_MS : NULL_CACHE_TTL_MS),
  });
}

async function fetchVehicleUncached(
  regnr: string
): Promise<KjoretoyData | null> {
  const cleaned = regnr.toUpperCase().replace(/[\s-]/g, "");
  const startedAt = Date.now();

  cleanupExpiredRateLimitBuckets();
  cleanupExpiredVehicleCache();

  const cached = readVehicleCache(cleaned);
  if (cached !== null) {
    return cached;
  }

  if (vehicleCache.has(cleaned)) {
    return null;
  }

  const inFlight = inFlightRequests.get(cleaned);
  if (inFlight) {
    return inFlight;
  }

  const rateLimit = checkRateLimit("svv:global", SVV_LIMIT, SVV_WINDOW_MS);
  if (!rateLimit.allowed) {
    logVegvesenEvent("local_rate_limit_blocked", {
      regnr: cleaned,
      limit: SVV_LIMIT,
      windowMs: SVV_WINDOW_MS,
      source: "app_rate_limiter",
    });
    throw new Error("Vegvesen API rate limit reached");
  }

  const request = (async () => {
    const url = `${API_BASE}?kjennemerke=${cleaned}`;
    const res = await fetch(url, {
      headers: {
        "SVV-Authorization": `Apikey ${process.env.SVV_API_KEY}`,
      },
      cache: "no-store",
    });

    if (res.status === 204 || res.status === 404) {
      writeVehicleCache(cleaned, null);
      return null;
    }

    if (!res.ok) {
      const bodyPreview = await readErrorResponse(res);
      logVegvesenEvent("upstream_request_failed", {
        regnr: cleaned,
        url,
        status: res.status,
        statusText: res.statusText,
        retryAfter: res.headers.get("retry-after"),
        requestId: res.headers.get("x-request-id") ?? res.headers.get("traceparent"),
        contentType: res.headers.get("content-type"),
        durationMs: Date.now() - startedAt,
        bodyPreview,
      });
      throw new Error(`Vegvesen API error: ${res.status}`);
    }

    const data: VegvesenResponse = await res.json();

    if (!data.kjoretoydataListe || data.kjoretoydataListe.length === 0) {
      writeVehicleCache(cleaned, null);
      return null;
    }

    const vehicle = data.kjoretoydataListe[0];
    writeVehicleCache(cleaned, vehicle);
    return vehicle;
  })();

  inFlightRequests.set(cleaned, request);

  try {
    return await request;
  } catch (error) {
    logVegvesenEvent("lookup_failed", {
      regnr: cleaned,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    inFlightRequests.delete(cleaned);
  }
}

// Share the same lookup between metadata and page rendering for a request.
export const fetchVehicle = cache(fetchVehicleUncached);
