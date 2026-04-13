import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "./redis.js";
import { sendServiceUnavailable } from "./http.js";

const AUTH_RATE_LIMIT_WINDOW_SECONDS = 300;
const AUTH_RATE_LIMIT_MAX_FAILURES = 5;

interface SharedSecretAuthOptions {
  envVarName: string;
  scope: string;
  allowRawAuthorization?: boolean;
}

function digestSecret(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function secretsMatch(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  return timingSafeEqual(digestSecret(provided), digestSecret(expected));
}

function getRequestIp(req: VercelRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  const realIp = req.headers["x-real-ip"];
  const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;

  return (
    forwardedValue?.split(",")[0]?.trim() ||
    realIpValue?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function extractAuthorizationToken(
  req: VercelRequest,
  allowRawAuthorization = false,
): string | undefined {
  const authorization = req.headers.authorization;
  if (!authorization) return undefined;
  if (authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    return token || undefined;
  }
  if (!allowRawAuthorization) return undefined;
  const token = authorization.trim();
  return token || undefined;
}

async function registerFailedAttempt(scope: string, ip: string): Promise<number | null> {
  const key = `auth:failed:${scope}:${ip}`;

  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, AUTH_RATE_LIMIT_WINDOW_SECONDS);
    }
    return attempts;
  } catch (error) {
    console.error(`[${scope}] failed auth rate-limit write failed:`, error);
    return null;
  }
}

async function clearFailedAttempts(scope: string, ip: string): Promise<void> {
  const key = `auth:failed:${scope}:${ip}`;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[${scope}] failed auth rate-limit reset failed:`, error);
  }
}

export async function requireSharedSecret(
  req: VercelRequest,
  res: VercelResponse,
  options: SharedSecretAuthOptions,
): Promise<boolean> {
  const secret = process.env[options.envVarName];
  if (!secret) {
    sendServiceUnavailable(
      res,
      `[${options.scope}] ${options.envVarName} is not configured`,
    );
    return false;
  }

  const token = extractAuthorizationToken(req, options.allowRawAuthorization);
  const ip = getRequestIp(req);

  if (!secretsMatch(token, secret)) {
    const attempts = await registerFailedAttempt(options.scope, ip);
    if (attempts !== null && attempts > AUTH_RATE_LIMIT_MAX_FAILURES) {
      res.setHeader("Retry-After", String(AUTH_RATE_LIMIT_WINDOW_SECONDS));
      res.status(429).json({
        ok: false,
        error: "Too many unauthorized attempts",
      });
      return false;
    }

    res.status(401).json({ ok: false, error: "Unauthorized" });
    return false;
  }

  await clearFailedAttempts(options.scope, ip);
  return true;
}
