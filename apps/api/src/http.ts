import type { VercelResponse } from "@vercel/node";

export const INTERNAL_ERROR_MESSAGE = "Internal server error";
export const SERVICE_UNAVAILABLE_MESSAGE = "Service unavailable";

function logServerError(scope: string, error?: unknown) {
  if (error === undefined) {
    console.error(scope);
    return;
  }
  console.error(scope, error);
}

export function sendInternalError(
  res: VercelResponse,
  scope: string,
  error: unknown,
  message = INTERNAL_ERROR_MESSAGE,
) {
  logServerError(scope, error);
  return res.status(500).json({ ok: false, error: message });
}

export function sendServiceUnavailable(
  res: VercelResponse,
  scope: string,
  error?: unknown,
  message = SERVICE_UNAVAILABLE_MESSAGE,
) {
  logServerError(scope, error);
  return res.status(503).json({ ok: false, error: message });
}
