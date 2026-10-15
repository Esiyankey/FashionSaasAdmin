import "server-only";
import { tooManyRequests } from "./errors";

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/**
 * Fixed-window limiter for public write endpoints (contact, newsletter,
 * checkout). State is per server instance; behind several instances use a
 * shared store (e.g. Redis) or the platform's firewall rate limiting instead.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): void {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    throw tooManyRequests(Math.ceil((current.resetAt - now) / 1000));
  }
}
