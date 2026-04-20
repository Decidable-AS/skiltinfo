import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  cleanupExpiredRateLimitBuckets,
  getClientIp,
} from "@/lib/rate-limit";

const LOOKUP_ROUTE = /^\/[A-Z]{2}\d{4,5}$/i;
const LOOKUP_LIMIT = 20;
const LOOKUP_WINDOW_MS = 60_000;

function anonymizeIp(ip: string) {
  if (ip === "unknown") {
    return ip;
  }

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 4).join(":") || "unknown"}::`;
  }

  return "unknown";
}

function getRefererOrigin(request: NextRequest) {
  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return "invalid";
  }
}

function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|scrapy|curl|wget|python|node-fetch|axios|go-http-client/i.test(
    userAgent,
  );
}

function logLookupRequest(
  request: NextRequest,
  ip: string,
  result: { allowed: boolean; remaining: number; retryAfterSeconds: number },
) {
  const userAgent = request.headers.get("user-agent") || "unknown";
  const refererOrigin = getRefererOrigin(request) ?? "none";
  const acceptLanguage = request.headers.get("accept-language") || "none";
  const secFetchSite = request.headers.get("sec-fetch-site") || "none";
  const secFetchMode = request.headers.get("sec-fetch-mode") || "none";
  const retryAfter = result.allowed ? "none" : `${result.retryAfterSeconds}s`;

  console.info(
    `[lookup-request] ${new Date().toISOString()} ${request.method} ${request.nextUrl.pathname} ip=${anonymizeIp(ip)} allowed=${result.allowed ? "yes" : "no"} remaining=${result.remaining} retry_after=${retryAfter} bot=${isLikelyBot(userAgent) ? "likely" : "unlikely"} referer=${refererOrigin} lang=${acceptLanguage} fetch_site=${secFetchSite} fetch_mode=${secFetchMode} ua=${userAgent}`,
  );
}

export function middleware(request: NextRequest) {
  if (!LOOKUP_ROUTE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  cleanupExpiredRateLimitBuckets();

  const ip = getClientIp(request.headers);
  const result = checkRateLimit(`lookup:${ip}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS);

  logLookupRequest(request, ip, result);

  if (!result.allowed) {
    return new NextResponse("For mange oppslag. Vent litt og prov igjen.", {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(LOOKUP_LIMIT),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(LOOKUP_LIMIT));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
