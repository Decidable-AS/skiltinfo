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
    throw new Error("Vegvesen API rate limit reached");
  }

  const request = (async () => {
    const res = await fetch(`${API_BASE}?kjennemerke=${cleaned}`, {
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
  } finally {
    inFlightRequests.delete(cleaned);
  }
}

// Share the same lookup between metadata and page rendering for a request.
export const fetchVehicle = cache(fetchVehicleUncached);
