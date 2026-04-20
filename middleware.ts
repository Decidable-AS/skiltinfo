import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  cleanupExpiredRateLimitBuckets,
  getClientIp,
} from "@/lib/rate-limit";

const LOOKUP_ROUTE = /^\/[A-Z]{2}\d{4,5}$/i;
const LOOKUP_LIMIT = 20;
const LOOKUP_WINDOW_MS = 60_000;

export function middleware(request: NextRequest) {
  if (!LOOKUP_ROUTE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  cleanupExpiredRateLimitBuckets();

  const ip = getClientIp(request.headers);
  const result = checkRateLimit(`lookup:${ip}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS);

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
