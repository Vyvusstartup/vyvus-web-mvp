import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: security headers (CSP report-only) + simple rate limit for /api/*
 * Uses Upstash Redis if configured; falls back to in-memory.
 */
const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_S ?? "60", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX ?? "60", 10);

const memCounters = new Map<string, { count: number; resetAt: number }>();

async function checkLimit(ip: string): Promise<{ ok: boolean; remaining: number; reset: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const reset = now + WINDOW_SECONDS;

  if (url && token) {
    try {
      const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const incr = await incrRes.json();
      const count = typeof incr.result === "number" ? incr.result : Number(incr.result);
      if (count === 1) {
        await fetch(`${url}/expire/${encodeURIComponent(key)}/${WINDOW_SECONDS}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
      }
      return { ok: count <= MAX_REQUESTS, remaining: Math.max(0, MAX_REQUESTS - count), reset };
    } catch {
      // fall back to memory
    }
  }

  const cur = memCounters.get(key);
  if (!cur || cur.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: reset });
    return { ok: true, remaining: MAX_REQUESTS - 1, reset };
  }
  cur.count += 1;
  memCounters.set(key, cur);
  return { ok: cur.count <= MAX_REQUESTS, remaining: Math.max(0, MAX_REQUESTS - cur.count), reset: cur.resetAt };
}

const csp = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
].join("; ");

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname.startsWith("/api/")) {
    const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const { ok, remaining, reset } = await checkLimit(ip);
    const response = NextResponse.next();

    response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(reset));

    response.headers.set("Content-Security-Policy-Report-Only", csp);
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    if (!ok) {
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "Content-Security-Policy-Report-Only": csp,
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
          "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        },
      });
    }
    return response;
  }

  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy-Report-Only", csp);
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
